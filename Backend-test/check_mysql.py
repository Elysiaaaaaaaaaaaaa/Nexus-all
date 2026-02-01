#!/usr/bin/env python3
"""
MySQL连接检查脚本
帮助诊断MySQL连接问题
"""

import os
import sys
import pymysql
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

def check_mysql_connection():
    """检查MySQL连接"""
    try:
        # 获取数据库配置
        host = os.getenv("DB_HOST", "localhost")
        port = int(os.getenv("DB_PORT", "3306"))
        user = os.getenv("DB_USER", "root")
        password = os.getenv("DB_PASSWORD", "@20050518Zzy")

        print(f"正在连接到 MySQL: {user}@{host}:{port}")

        # 尝试连接到MySQL服务器（不指定数据库）
        connection = pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            connect_timeout=5
        )

        print("✅ MySQL连接成功！")

        # 获取MySQL版本信息
        with connection.cursor() as cursor:
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()
            print(f"MySQL版本: {version[0]}")

            # 检查是否有创建数据库的权限
            try:
                cursor.execute("CREATE DATABASE IF NOT EXISTS test_connection")
                cursor.execute("DROP DATABASE test_connection")
                print("✅ 数据库创建权限正常")
            except Exception as e:
                print(f"⚠️ 数据库创建权限可能受限: {e}")

        connection.close()
        return True

    except pymysql.err.OperationalError as e:
        error_code = e.args[0]
        error_msg = e.args[1]

        print(f"❌ MySQL连接失败 (错误码: {error_code})")
        print(f"错误信息: {error_msg}")

        # 提供具体的解决建议
        if error_code == 1045:  # Access denied
            print("\n🔧 解决建议:")
            print("1. 检查MySQL服务是否正在运行")
            print("2. 验证root用户密码是否正确")
            print("3. 尝试重置MySQL root密码")
            print("\n重置MySQL root密码的方法:")
            print("Windows: 运行MySQL安装目录下的 mysql_secure_installation.exe")
            print("或在命令行中: mysql -u root -p")
            print("然后执行: ALTER USER 'root'@'localhost' IDENTIFIED BY '20050518Zzy';")

        elif error_code == 2003:  # Can't connect
            print("\n🔧 解决建议:")
            print("1. 确保MySQL服务正在运行")
            print("2. 检查防火墙是否阻止了端口3306")
            print("3. 验证MySQL是否监听在localhost:3306")

        elif error_code == 1049:  # Unknown database
            print("\n🔧 解决建议:")
            print("数据库不存在，这是正常的，我们的脚本会自动创建")

        return False

    except Exception as e:
        print(f"❌ 未知错误: {e}")
        return False

def check_mysql_service():
    """检查MySQL服务状态"""
    print("\n检查MySQL服务状态...")

    import subprocess
    import platform

    system = platform.system().lower()

    try:
        if system == "windows":
            # Windows系统
            result = subprocess.run(
                ["sc", "query", "MySQL"],
                capture_output=True,
                text=True,
                timeout=10
            )

            if "RUNNING" in result.stdout:
                print("✅ MySQL服务正在运行")
                return True
            else:
                print("❌ MySQL服务未运行")
                print("\n启动MySQL服务:")
                print("1. 打开服务管理器 (services.msc)")
                print("2. 找到MySQL服务并启动")
                print("3. 或在命令行中: net start mysql")
                return False

        elif system == "linux":
            # Linux系统
            result = subprocess.run(
                ["systemctl", "is-active", "mysqld"],
                capture_output=True,
                text=True,
                timeout=5
            )

            if result.returncode == 0:
                print("✅ MySQL服务正在运行")
                return True
            else:
                print("❌ MySQL服务未运行")
                print("\n启动MySQL服务:")
                print("sudo systemctl start mysqld")
                return False

        else:
            print(f"不支持的操作系统: {system}")
            return False

    except Exception as e:
        print(f"无法检查服务状态: {e}")
        print("请手动检查MySQL服务是否正在运行")
        return False

def main():
    """主函数"""
    print("=" * 50)
    print("MySQL连接诊断工具")
    print("=" * 50)

    # 检查MySQL服务状态
    service_running = check_mysql_service()

    print("\n" + "=" * 30)
    print("测试数据库连接...")
    print("=" * 30)

    # 检查连接
    connection_ok = check_mysql_connection()

    print("\n" + "=" * 50)
    if connection_ok:
        print("🎉 MySQL配置正确！可以运行数据库初始化脚本了。")
        print("\n运行命令:")
        print("python setup_database.py")
    else:
        print("❌ MySQL连接仍有问题，请根据上述建议解决。")
        print("\n常见解决方案:")
        print("1. 确保MySQL服务正在运行")
        print("2. 重置MySQL root密码")
        print("3. 检查防火墙设置")
        print("4. 确认MySQL监听端口正确")

    return 0 if connection_ok else 1

if __name__ == "__main__":
    sys.exit(main())