from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base
import datetime
import os

# Check for a cloud database URL (e.g. from Render/Railway/Heroku)
DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL:
    # Most cloud providers give postgres://, but SQLAlchemy requires postgresql://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    # Connect to Cloud Postgres
    engine = create_engine(DATABASE_URL)
else:
    # Fallback to local SQLite if no environment variable is set
    DATABASE_URL = "sqlite:///./securepay.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    time = Column(String, default=lambda: datetime.datetime.now().isoformat())
    amount = Column(Float)
    base_currency = Column(String)
    target_currency = Column(String)
    approved = Column(Boolean)
    risk_score = Column(Float)
    risk_level = Column(String)
    location = Column(String)
    device = Column(String)
    aml_flags = Column(String) # JSON string
    status = Column(String, default="approved")  # approved | denied | pending | dev_approved | dev_denied

class UserProfile(Base):
    __tablename__ = "profiles"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String, default="user")
    is_blocked = Column(Boolean, default=False)
    typing_speed = Column(Float, default=62.0)
    mouse_velocity = Column(Float, default=450.0)
    primary_location = Column(String, default="NY")
    last_lat_long = Column(String, default="40.7128,-74.0060")
    last_seen_epoch = Column(Float, default=0.0)
    preferred_priority = Column(String, default="balanced")

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)          # recipient (admin id for user→admin messages)
    from_user_id = Column(Integer, nullable=True)  # sender (set for user→admin messages)
    from_username = Column(String, nullable=True)  # display name of sender
    type = Column(String)
    message = Column(String)
    time = Column(String, default=lambda: datetime.datetime.now().isoformat())
    is_read = Column(Boolean, default=False)

def init_db():
    Base.metadata.create_all(engine)
    db = SessionLocal()
    
    try:
        # Check if users already exist
        exists = db.query(UserProfile).first()
        if not exists:
            admin = UserProfile(username="admin", password="admin", role="admin")
            u1 = UserProfile(username="user1", password="user1", role="user")
            dev = UserProfile(username="Pramodhraja", password="dev", role="dev", primary_location="ASIA_PACIFIC")
            db.add_all([admin, u1, dev])
            db.commit()
    except Exception as e:
        print(f"Init error: {e}")
    finally:
        db.close()
