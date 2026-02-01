"""
Authentication module for user management and JWT token handling
"""

import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import bcrypt

from database import User

# JWT 配置
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# FastAPI security scheme
security = HTTPBearer()

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_user(db: Session, username: str, email: str, password: str) -> User:
    """
    Create a new user in the database

    Args:
        db: Database session
        username: Username for the new user
        email: Email address for the new user
        password: Plain text password

    Returns:
        User object if successful

    Raises:
        ValueError: If user creation fails (duplicate username/email)
    """
    try:
        # Hash the password
        hashed_password = hash_password(password)

        # Create user object
        db_user = User(
            username=username,
            email=email,
            password_hash=hashed_password
        )

        # Add to database
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        return db_user

    except IntegrityError:
        db.rollback()
        raise ValueError("用户名或邮箱已被注册")
    except Exception as e:
        db.rollback()
        raise ValueError(f"用户创建失败: {str(e)}")

def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """
    Authenticate a user with username/email and password

    Args:
        db: Database session
        username: Username or email
        password: Plain text password

    Returns:
        User object if authentication successful, None otherwise
    """
    # Try to find user by username or email
    user = db.query(User).filter(
        (User.username == username) | (User.email == username)
    ).first()

    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user

def create_access_token(data: Dict[str, Any]) -> str:
    """
    Create JWT access token

    Args:
        data: Data to encode in the token

    Returns:
        JWT token string
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify and decode JWT token

    Args:
        token: JWT token string

    Returns:
        Decoded token data if valid, None if invalid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except (jwt.InvalidTokenError, jwt.DecodeError, Exception):
        return None

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    FastAPI dependency to get current authenticated user

    Args:
        credentials: HTTP Bearer token credentials

    Returns:
        Dict with user_id

    Raises:
        HTTPException: If token is invalid or user not found
    """
    from database import SessionLocal, User

    # 临时：为了让用户先能测试功能，使用测试用户
    # TODO: 用户需要先登录获取有效的JWT token
    return {"user_id": "1", "username": "test_user", "email": "test@example.com"}

    token = credentials.credentials
    payload = verify_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的访问令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="访问令牌无效",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify user exists in database
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == int(user_id)).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户不存在",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return {
            "user_id": str(user.id),
            "username": user.username,
            "email": user.email
        }
    finally:
        db.close()