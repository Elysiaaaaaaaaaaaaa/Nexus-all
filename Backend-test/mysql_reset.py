#!/usr/bin/env python3
"""
MySQL root密码重置脚本
用于Windows系统重置MySQL root密码
"""

import os
import subprocess
import sys

def reset_mysql_root_password():
    """重置MySQL root密码为 20050518Zzy"""

    print("=" * 50)
    print("MySQL Root密码重置工具")
    print("=" * 50)

    print("\n重要提示:")
    print("- 此脚本需要管理员权限运行")
    print("- 请确保MySQL服务已停止")
    print("- 重置密码为: 20050518Zzy")

    # 停止MySQL服务
    print("\n1. 停止MySQL服务...")
    try:
        result = subprocess.run(
            ["net", "stop", "mysql"],
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode == 0 or "服务已停止" in result.stdout:
            print("MySQL服务已停止")
        else:
            print(f"停止服务结果: {result.stdout}")
    except Exception as e:
        print(f"停止服务时出错: {e}")

    # 查找MySQL安装目录
    print("\n2. 查找MySQL安装目录...")
    mysql_paths = [
        "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin",
        "C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin",
        "C:\\Program Files (x86)\\MySQL\\MySQL Server 8.0\\bin",
        "C:\\Program Files (x86)\\MySQL\\MySQL Server 5.7\\bin",
    ]

    mysqld_path = None
    for path in mysql_paths:
        if os.path.exists(os.path.join(path, "mysqld.exe")):
            mysqld_path = os.path.join(path, "mysqld.exe")
            print(f"找到MySQL: {mysqld_path}")
            break

    if not mysqld_path:
        print("未找到MySQL安装目录，请手动指定mysqld.exe路径")
        mysqld_path = input("请输入mysqld.exe的完整路径: ").strip()

    if not os.path.exists(mysqld_path):
        print(f"路径不存在: {mysqld_path}")
        return False

    # 以安全模式启动MySQL
    print("\n3. 以安全模式启动MySQL...")
    try:
        cmd = f'"{mysqld_path}" --skip-grant-tables --skip-networking'
        print(f"执行命令: {cmd}")

        # 使用CREATE_NEW_PROCESS_GROUP避免子进程被中断
        process = subprocess.Popen(
            cmd,
            shell=True,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        print("MySQL安全模式已启动 (等待几秒钟...)")
        import time
        time.sleep(5)

        # 连接到MySQL并重置密码
        print("\n4. 连接MySQL并重置密码...")
        reset_cmd = '''
mysql -u root -e "
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'n2wwaxxYejDRhGWe';
FLUSH PRIVILEGES;
"
'''
        result = subprocess.run(
            reset_cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=30
        )

        if result.returncode == 0:
            print("密码重置成功!")
        else:
            print(f"密码重置可能失败: {result.stderr}")

        # 停止MySQL进程
        print("\n5. 停止MySQL安全模式...")
        subprocess.run(["taskkill", "/F", "/IM", "mysqld.exe"], capture_output=True)

        # 重新启动MySQL服务
        print("\n6. 重新启动MySQL服务...")
        result = subprocess.run(
            ["net", "start", "mysql"],
            capture_output=True,
            text=True,
            timeout=30
        )

        if result.returncode == 0:
            print("MySQL服务重新启动成功!")
            return True
        else:
            print(f"启动服务失败: {result.stderr}")
            return False

    except Exception as e:
        print(f"重置过程中出错: {e}")
        return False

def test_connection():
    """测试数据库连接"""
    print("\n7. 测试数据库连接...")
    try:
        import pymysql
        connection = pymysql.connect(
            host="localhost",
            user="root",
            password="20050518Zzy",
            connect_timeout=5
        )
        connection.close()
        print("数据库连接测试成功!")
        return True
    except Exception as e:
        print(f"连接测试失败: {e}")
        return False

def main():
    """主函数"""
    print("此脚本将重置MySQL root用户的密码为 '20050518Zzy'")
    confirm = input("\n确认继续? (y/N): ").strip().lower()

    if confirm != 'y':
        print("操作已取消")
        return 0

    if reset_mysql_root_password():
        if test_connection():
            print("\n" + "=" * 50)
            print("密码重置完成! 现在可以运行数据库初始化脚本了:")
            print("python setup_database.py")
            return 0
        else:
            print("\n密码重置可能成功，但连接测试失败。请手动检查。")
            return 1
    else:
        print("\n密码重置失败。请检查错误信息。")
        return 1

if __name__ == "__main__":
    sys.exit(main())