from sqlalchemy import Column, Integer, Text, String, ForeignKey, Date, TIMESTAMP, text
from app.database import Base
from sqlalchemy.orm import relationship

# class ProgressUpdate(Base): 
#     __tablename__ = "progress_updates"

#     id = Column(Integer, primary_key=True)
#     activity_id = Column(Integer, ForeignKey("activities.id"))
#     update_date = Column(Date, nullable=False)
#     notes = Column(Text)
#     milestones = Column(Text)
#     quantitative_outcome = Column(Text)
#     qualitative_outcome = Column(Text)
#     evaluation_tool_reference = Column(String(255))
#     created_by = Column(Integer, ForeignKey("users.id"))

#     activity = relationship("Activity")
#     creator = relationship("User")

class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True)
    activity_id = Column(Integer, ForeignKey("activities.id"))
    file_path = Column(String(255), nullable=False)
    file_name = Column(String(255))
    file_type = Column(String(50))
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    uploaded_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))

    activity = relationship("Activity")
    uploader = relationship("User")    
