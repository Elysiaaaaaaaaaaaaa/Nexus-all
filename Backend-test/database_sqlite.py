"""
SQLite版本的数据库配置
用于快速测试和开发环境
"""

import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, JSON, ForeignKey, UniqueConstraint, Index
from sqlalchemy.dialects.sqlite import JSON as SQLiteJSON
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.sql import func

# 创建SQLite数据库连接
SQLITE_DB_PATH = os.path.join(os.path.dirname(__file__), "nexus.db")
DATABASE_URL = f"sqlite:///{SQLITE_DB_PATH}"

# 创建引擎
engine = create_engine(
    DATABASE_URL,
    echo=False,  # 设置为True可以看到SQL语句
    connect_args={"check_same_thread": False},  # SQLite需要这个参数
)

# 创建Session类
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基类
from sqlalchemy.ext.declarative import declarative_base
Base = declarative_base()

# 用户表
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # 关联
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")

# 项目表
class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    project_name = Column(String(255), nullable=False)
    session_id = Column(String(100), nullable=False)
    workflow_type = Column(String(50), default="text2video")
    material = Column(SQLiteJSON, nullable=True)  # SQLite使用JSON类型
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # 唯一约束：每个用户不能有同名项目
    __table_args__ = (
        UniqueConstraint('user_id', 'project_name', name='user_project'),
    )

    # 关联
    user = relationship("User", back_populates="projects")
    chat_history = relationship("ChatHistory", back_populates="project", cascade="all, delete-orphan")

# 对话历史表
class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    user_input = Column(Text, nullable=False)
    assistant_reply = Column(Text, nullable=False)
    material = Column(SQLiteJSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)

    # 关联
    project = relationship("Project", back_populates="chat_history")

# 会话表
class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    session_id = Column(String(100), unique=True, nullable=False, index=True)
    session_data = Column(SQLiteJSON, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # 关联
    user = relationship("User", back_populates="sessions")

def create_tables():
    """创建所有表"""
    try:
        Base.metadata.create_all(bind=engine)
        print("SQLite数据库表创建成功")
        print(f"数据库文件位置: {SQLITE_DB_PATH}")
    except Exception as e:
        print(f"数据库表创建失败: {e}")
        raise

def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_database():
    """初始化数据库"""
    try:
        # 创建表
        create_tables()
        print("SQLite数据库初始化成功")
        return True
    except Exception as e:
        print(f"数据库初始化失败: {e}")
        return False

# 为了兼容性，提供别名
from sqlalchemy.orm import relationship  # 需要导入relationship