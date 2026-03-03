#!/usr/bin/env python3
"""
检查MySQL状态和配置
"""

import subprocess
import sys
import os

def run_command(cmd, description):
    """运行命令并返回结果"""
    print(f"\n{description}...")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
        print(f"退出码: {result.returncode}")
        if result.stdout:
            print(f"输出: {result.stdout.strip()}")
        if result.stderr:
            print(f"错误: {result.stderr.strip()}")
        return result.returncode == 0, result.stdout.strip(), result.stderr.strip()
    except Exception as e:
        print(f"执行失败: {e}")
        return False, "", str(e)

def check_mysql_service():
    """检查MySQL服务状态"""
    success, stdout, stderr = run_command("sc query MySQL80", "检查MySQL80服务状态")
    if success and "RUNNING" in stdout:
        print("✅ MySQL80服务正在运行")
        return True
    else:
        print("❌ MySQL80服务未运行或不存在")
        return False

def check_mysql_processes():
    """检查MySQL进程"""
    success, stdout, stderr = run_command("tasklist /FI \"IMAGENAME eq mysqld.exe\"", "检查MySQL进程")
    if success and "mysqld.exe" in stdout:
        print("✅ MySQL进程正在运行")
        return True
    else:
        print("❌ MySQL进程未运行")
        return False

def test_mysql_connection(password):
    """测试MySQL连接"""
    mysql_path = r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    cmd = f'"{mysql_path}" -u root -p{password} -e "SELECT VERSION();"'
    success, stdout, stderr = run_command(cmd, f"测试MySQL连接 (密码: {password})")

    if success:
        # 提取版本信息
        lines = stdout.split('\n')
        for line in lines:
            if line.strip() and not line.startswith('VERSION()'):
                print(f"✅ 连接成功! MySQL版本: {line.strip()}")
                return True
    else:
        print(f"❌ 连接失败: {stderr}")
        return False

    return False

def try_different_passwords():
    """尝试不同的密码组合"""
    passwords_to_try = [
        "n2wwaxxYejDRhGWe",  # 用户指定的密码
        "20050518Zzy",   # 不带@的密码
        "",              # 空密码
        "root",          # 默认密码
    ]

    print("\n尝试不同的密码...")
    for password in passwords_to_try:
        print(f"\n测试密码: '{password}'")
        if test_mysql_connection(password):
            print(f"🎉 找到正确的密码: '{password}'")
            return password

    print("❌ 所有常用密码都无法连接")
    return None

def check_mysql_config():
    """检查MySQL配置文件"""
    config_paths = [
        r"C:\ProgramData\MySQL\MySQL Server 8.0\my.ini",
        r"C:\Program Files\MySQL\MySQL Server 8.0\my.ini",
    ]

    print("\n检查MySQL配置文件...")
    for path in config_paths:
        if os.path.exists(path):
            print(f"找到配置文件: {path}")
            try:
                with open(path, 'r') as f:
                    content = f.read()
                    if 'skip-grant-tables' in content:
                        print("⚠️ 配置文件中包含 'skip-grant-tables'，MySQL可能处于安全模式")
                    if 'port=' in content:
                        for line in content.split('\n'):
                            if line.strip().startswith('port='):
                                print(f"配置端口: {line.strip()}")
                                break
            except Exception as e:
                print(f"无法读取配置文件: {e}")
            return path

    print("未找到MySQL配置文件")
    return None

def main():
    """主函数"""
    print("=" * 60)
    print("MySQL状态检查工具")
    print("=" * 60)

    # 检查服务
    service_ok = check_mysql_service()
    process_ok = check_mysql_processes()

    if not service_ok and not process_ok:
        print("\n❌ MySQL既没有作为服务运行，也没有进程在运行")
        print("请先启动MySQL服务:")
        print("1. 打开服务管理器 (services.msc)")
        print("2. 找到MySQL80服务，右键启动")
        print("3. 或在管理员命令提示符中运行: net start MySQL80")
        return

    # 检查配置文件
    config_path = check_mysql_config()

    # 尝试连接
    print("\n" + "=" * 40)
    print("测试数据库连接")
    print("=" * 40)

    correct_password = try_different_passwords()

    print("\n" + "=" * 60)
    print("检查结果总结")
    print("=" * 60)

    if correct_password:
        print(f"✅ MySQL连接成功! 密码是: '{correct_password}'")
        print("\n请更新 .env 文件中的 DB_PASSWORD:")
        print(f"DB_PASSWORD={correct_password}")
        print("\n然后运行:")
        print("python setup_database.py")
    else:
        print("❌ 无法连接到MySQL")
        print("\n可能的解决方案:")
        print("1. 重置MySQL root密码 (需要管理员权限)")
        print("   python mysql_reset.py")
        print("2. 使用SQLite作为替代方案")
        print("   python quick_setup.py  # 选择选项2")
        print("3. 手动安装和配置MySQL")

if __name__ == "__main__":
    main()