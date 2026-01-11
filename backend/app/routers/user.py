
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

        # Optional: Add to Cognito group
        cognito.admin_add_user_to_group(
            UserPoolId=os.getenv("COGNITO_USER_POOL_ID"),
            Username=payload.email,
            GroupName=payload.role  # 'admin' or 'staff'
        )

        return {"message": "User added", "sub": sub, "id": new_user.id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users", response_model=List[UserOut])
def get_users(db: Session = Depends(get_db), current_user=Depends(require_admin)):
    """Return all users from the `users` table. Admin-only."""
    try:
        users = db.query(User).filter(User.deleted_at == None).all()
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, payload: "UserUpdate", db: Session = Depends(get_db), current_user=Depends(require_admin)):
    """Update a user's name, role and active status. Admin-only.
    This will also update Cognito group membership and enable/disable the Cognito user."""
    try:
        from app.schemas.user import UserUpdate

        user = db.query(User).filter(User.id == user_id, User.deleted_at == None).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        updated = False

        # name
        if payload.name is not None and payload.name != user.name:
            user.name = payload.name
            updated = True

        # role -> update Cognito groups
        if payload.role is not None and payload.role != user.role:
            old_role = user.role
            new_role = payload.role
            # Update DB
            user.role = new_role
            updated = True

            # Update Cognito group membership
            try:
                # remove from old group if present
                if old_role:
                    cognito.admin_remove_user_from_group(
                        UserPoolId=os.getenv("COGNITO_USER_POOL_ID"),
                        Username=user.email,
                        GroupName=str(old_role)
                    )
            except Exception:
                pass

            try:
                cognito.admin_add_user_to_group(
                    UserPoolId=os.getenv("COGNITO_USER_POOL_ID"),
                    Username=user.email,
                    GroupName=str(new_role)
                )
            except Exception:
                pass

        # is_active -> enable/disable in Cognito
        if payload.is_active is not None and payload.is_active != user.is_active:
            user.is_active = payload.is_active
            updated = True
            try:
                if payload.is_active:
                    cognito.admin_enable_user(
                        UserPoolId=os.getenv("COGNITO_USER_POOL_ID"),
                        Username=user.email
                    )
                else:
                    cognito.admin_disable_user(
                        UserPoolId=os.getenv("COGNITO_USER_POOL_ID"),
                        Username=user.email
                    )
            except Exception:
                pass

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
        user = db.query(User).filter(User.id == user_id, User.deleted_at == None).first()
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