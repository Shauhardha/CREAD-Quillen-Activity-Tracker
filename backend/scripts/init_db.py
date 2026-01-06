from app.database import engine
from app.models import Base  # this imports ALL models

print("Creating tables...")
Base.metadata.create_all(bind=engine)
print("Done.")
