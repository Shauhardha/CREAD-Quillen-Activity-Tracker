from pydantic import BaseModel

class InitiativeCreate(BaseModel):
    name: str

class InitiativeOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True
