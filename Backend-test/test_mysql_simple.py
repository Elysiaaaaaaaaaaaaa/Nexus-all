#!/usr/bin/env python3
"""
简单的MySQL连接测试
"""

import pymysql
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

def test_mysql():
    try:
        # 获取配置
        host = os.getenv("DB_HOST", "localhost")
        port = int(os.getenv("DB_PORT", "3306"))
        user = os.getenv("DB_USER", "img_2_video")
        password = os.getenv("DB_PASSWORD", "n2wwaxxYejDRhGWe")

        print(f"尝试连接到: {user}@{host}:{port}")
        print(f"使用密码: {password}")

        # 连接MySQL
        connection = pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            connect_timeout=5
        )

        with connection.cursor() as cursor:
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()
            print(f"连接成功! MySQL版本: {version[0]}")

            cursor.execute("SHOW DATABASES")
            databases = cursor.fetchall()
            print("可用数据库:")
            for db in databases:
                print(f"  - {db[0]}")

        connection.close()
        print("测试完成!")
        return True

    except pymysql.err.OperationalError as e:
        print(f"MySQL连接失败: {e}")
        return False
    except Exception as e:
        print(f"其他错误: {e}")
        return False

if __name__ == "__main__":
    success = test_mysql()
    if success:
        print("\n下一步: 运行 python setup_database.py")
    else:
        print("\n请检查MySQL配置或运行 python mysql_reset.py 重置密码")