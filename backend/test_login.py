from database import SessionLocal, UserProfile
import uuid

def test_login(username, password):
    db = SessionLocal()
    user = db.query(UserProfile).filter(UserProfile.username == username).first()
    print(f"User found: {user.username if user else 'None'}")
    if user and user.password == password:
        print(f"Password match: True")
        if user.is_blocked:
            print("User is blocked")
            db.close()
            return
        
        token = str(uuid.uuid4())
        res = {
            "token": token,
            "role": user.role,
            "name": user.username.capitalize()
        }
        print(f"Result: {res}")
        db.close()
    else:
        print("Invalid credentials")
        db.close()

if __name__ == "__main__":
    print("Testing admin login...")
    test_login("admin", "admin")
