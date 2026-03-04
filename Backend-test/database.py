"""
数据库配置和模型定义
使用SQLAlchemy 2.0连接MySQL数据库
"""

import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from urllib.parse import quote_plus
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, JSON, ForeignKey, UniqueConstraint, Index, text
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from sqlalchemy.sql import func

# 创建数据库连接
def get_database_url():
    """获取数据库URL配置"""
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "3306")
    # database = os.getenv("DB_NAME", "img_2_video")
    # username = os.getenv("DB_USER", "img_2_video")
    username = os.getenv("DB_USER", "root")
    database = os.getenv("DB_NAME", "nexus_db")

    # password = os.getenv("DB_PASSWORD", "n2wwaxxYejDRhGWe")
    password = os.getenv("DB_PASSWORD", "20050923czx")

    # 对密码进行URL编码以处理特殊字符（如@符号）
    encoded_password = quote_plus(password)

    return f"mysql+pymysql://{username}:{encoded_password}@{host}:{port}/{database}"

# 创建引擎
engine = create_engine(
    get_database_url(),
    echo=False,  # 设置为True可以看到SQL语句
    pool_pre_ping=True,  # 连接池健康检查
    pool_recycle=3600,  # 连接回收时间
)

# 创建Session类
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基类
Base = declarative_base()

# 用户表
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 关联
    projects = relationship("Project", back_populates="user")
    sessions = relationship("Session", back_populates="user")

# 项目表
class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    project_name = Column(String(255), nullable=False)
    session_id = Column(String(100), nullable=False)
    workflow_type = Column(String(50), default="text2video")
    material = Column(JSON, nullable=True)  # 存储项目素材数据
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

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
    user_input = Column(LONGTEXT, nullable=False)
    assistant_reply = Column(LONGTEXT, nullable=False)
    material = Column(JSON, nullable=True)  # 存储素材数据
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # 关联
    project = relationship("Project", back_populates="chat_history")

# 会话表
class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    session_id = Column(String(100), unique=True, nullable=False, index=True)
    session_data = Column(JSON, nullable=False)  # 存储会话数据
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 关联
    user = relationship("User", back_populates="sessions")

def create_tables():
    """创建所有表"""
    try:
        Base.metadata.create_all(bind=engine)
        print("数据库表创建成功")
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
        # 测试连接
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("数据库连接成功")

        # 创建表
        create_tables()

        return True
    except Exception as e:
        print(f"数据库初始化失败: {e}")
        return False

if __name__ == "__main__":
    # 测试数据库连接
    init_database()