#!/usr/bin/env python3
"""
数据库初始化脚本
创建MySQL数据库和表结构
"""

import os
import sys
from pathlib import Path
from urllib.parse import quote_plus
from dotenv import load_dotenv

# 加载环境变量文件
load_dotenv()

# 添加当前目录到Python路径
sys.path.append(str(Path(__file__).parent))

from database import engine, Base, init_database

def create_database():
    """创建数据库（如果不存在）"""
    try:
        # 从环境变量获取数据库配置
        host = os.getenv("DB_HOST", "localhost")
        port = os.getenv("DB_PORT", "3306")
        database = os.getenv("DB_NAME", "nexus_db")
        username = os.getenv("DB_USER", "root")
        password = os.getenv("DB_PASSWORD", "@20050518Zzy")

        # 对密码进行URL编码以处理特殊字符（如@符号）
        encoded_password = quote_plus(password)

        # 连接到MySQL服务器（不指定数据库）
        from sqlalchemy import create_engine, text
        server_engine = create_engine(f"mysql+pymysql://{username}:{encoded_password}@{host}:{port}")

        with server_engine.connect() as conn:
            # 创建数据库（如果不存在）
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
            print(f"数据库 '{database}' 创建成功")

        # 关闭服务器连接
        server_engine.dispose()

    except Exception as e:
        print(f"创建数据库失败: {e}")
        print("请确保MySQL服务正在运行，并且数据库用户有足够权限")
        return False

    return True

def main():
    """主函数"""
    print("开始初始化数据库...")

    # 1. 创建数据库
    if not create_database():
        return 1

    # 2. 初始化数据库表和连接
    if not init_database():
        return 1

    print("数据库初始化完成！")
    print("\n下一步操作：")
    print("1. 确保后端环境变量配置正确（可复制 Backend-test/.env.example 为 .env）")
    print("2. 启动后端服务器：python app.py")
    print("3. 前端可通过 /login 页面注册和登录用户")

    return 0

if __name__ == "__main__":
    sys.exit(main())