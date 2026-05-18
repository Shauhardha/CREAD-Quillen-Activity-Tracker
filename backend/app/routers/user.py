
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, UserUpdate  # new schema: email, name, password, role
from boto3 import client as boto3_client
from dotenv import load_dotenv
import os
from datetime import datetime
from app.auth import require_admin

load_dotenv()

router = APIRouter(prefix="/api/admin", tags=["Admin"])

cognito = boto3_client('cognito-idp', region_name=os.getenv("COGNITO_REGION"))

@router.post("/add-user")
def add_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)  # only admins can add users
):
    try:
        # Create user in Cognito
        cognito_response = cognito.admin_create_user(
            UserPoolId=os.getenv("COGNITO_USER_POOL_ID"),
            Username=payload.email,
            TemporaryPassword=payload.password,
            MessageAction='SUPPRESS',  # no email invite
            UserAttributes=[
                {'Name': 'email', 'Value': payload.email},
                {'Name': 'name', 'Value': payload.name},
                {'Name': 'email_verified', 'Value': 'true'}  # auto-verify for admin add
            ]
        )

        # Get sub from Cognito response
        sub = next(attr['Value'] for attr in cognito_response['User']['Attributes'] if attr['Name'] == 'sub')

        # Step 2: Set the same password as PERMANENT → status becomes CONFIRMED
        cognito.admin_set_user_password(
            UserPoolId=os.getenv("COGNITO_USER_POOL_ID"),
            Username=payload.email,
            Password=payload.password,
            Permanent=True
        )

        # Create in RDS
        new_user = User(
            cognito_sub=sub,
            email=payload.email,
            name=payload.name,
            role=payload.role
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Add to Cognito group — use .value to get plain string from enum
        role_str = payload.role.value if hasattr(payload.role, 'value') else str(payload.role)
        try:
            cognito.admin_add_user_to_group(
                UserPoolId=os.getenv("COGNITO_USER_POOL_ID"),
                Username=payload.email,
                GroupName=role_str
            )
        except Exception as group_err:
            # Rollback: remove from DB and Cognito to avoid inconsistent state
            db.delete(new_user)
            db.commit()
            try:
                cognito.admin_delete_user(
                    UserPoolId=os.getenv("COGNITO_USER_POOL_ID"),
                    Username=payload.email
                )
            except Exception:
                pass  # Best-effort Cognito cleanup
            raise HTTPException(
                status_code=500,
                detail=f"User created but group assignment failed — rolled back: {str(group_err)}"
            )

        return {"message": "User added", "sub": sub, "id": new_user.id}

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ add_user FAILED: {type(e).__name__}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users", response_model=List[UserOut])
def get_users(db: Session = Depends(get_db), current_user=Depends(require_admin)):
    """Return all users from the `users` table. Admin-only."""
    try:
        users = db.query(User).filter(User.deleted_at.is_(None)).all()
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, payload: "UserUpdate", db: Session = Depends(get_db), current_user=Depends(require_admin)):
    """Update a user's name, role and active status. Admin-only.
    This will also update Cognito group membership and enable/disable the Cognito user."""
    try:
        from app.schemas.user import UserUpdate

        user = db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        updated = False

        # name
        if payload.name is not None and payload.name != user.name:
            user.name = payload.name
            updated = True

        # role -> update Cognito groups
        if payload.role is not None and payload.role != user.role:
            # Extract plain string values from enums (avoids "UserRole.read_only" bug)
            old_role_str = user.role.value if hasattr(user.role, 'value') else str(user.role)
            new_role_str = payload.role.value if hasattr(payload.role, 'value') else str(payload.role)
            pool_id = os.getenv("COGNITO_USER_POOL_ID")

            # Update DB first
            user.role = payload.role
            updated = True

            # ── Remove from old Cognito group ───────────────────────
            if old_role_str:
                try:
                    cognito.admin_remove_user_from_group(
                        UserPoolId=pool_id,
                        Username=user.email,
                        GroupName=old_role_str
                    )
                    print(f"✅ Removed user #{user.id} from Cognito group '{old_role_str}'")
                except cognito.exceptions.ResourceNotFoundException:
                    print(f"ℹ️  Cognito group '{old_role_str}' not found — skipping removal")
                except Exception as e:
                    print(f"⚠️  Could not remove user #{user.id} from Cognito group '{old_role_str}': {e}")

            # ── Add user to new group (group already exists in Cognito) ──
            try:
                cognito.admin_add_user_to_group(
                    UserPoolId=pool_id,
                    Username=user.email,
                    GroupName=new_role_str
                )
                print(f"✅ Added user #{user.id} to Cognito group '{new_role_str}'")
            except Exception as e:
                print(f"⚠️  Could not add user #{user.id} to Cognito group '{new_role_str}': {e}")

        # is_active -> enable/disable in Cognito
        if payload.is_active is not None and payload.is_active != user.is_active:
            user.is_active = payload.is_active
            updated = True
            pool_id = os.getenv("COGNITO_USER_POOL_ID")
            try:
                if payload.is_active:
                    cognito.admin_enable_user(UserPoolId=pool_id, Username=user.email)
                    print(f"✅ Enabled Cognito user #{user.id}")
                else:
                    cognito.admin_disable_user(UserPoolId=pool_id, Username=user.email)
                    print(f"✅ Disabled Cognito user #{user.id}")
            except Exception as e:
                print(f"⚠️  Could not update Cognito enabled status for user #{user.id}: {e}")

        if updated:
            db.commit()
            db.refresh(user)

        return user

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    """Delete user from Cognito user pool and mark deleted_at in the DB (admin-only)."""
    try:
        user = db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # delete from Cognito
        try:
            cognito.admin_delete_user(UserPoolId=os.getenv("COGNITO_USER_POOL_ID"), Username=user.email)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Cognito delete failed: {str(e)}")

        # mark deleted_at
        user.deleted_at = datetime.utcnow()
        db.commit()

        return {"message": "User deleted", "id": user_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))