#!/usr/bin/env python3
"""
快速设置脚本
选择使用MySQL或SQLite数据库
"""

import os
import sys

def choose_database():
    """让用户选择数据库类型"""
    print("=" * 50)
    print("数据库选择")
    print("=" * 50)

    print("\n请选择数据库类型:")
    print("1. MySQL (推荐用于生产环境)")
    print("2. SQLite (推荐用于快速测试)")

    while True:
        choice = input("\n请选择 (1 或 2): ").strip()

        if choice == "1":
            return "mysql"
        elif choice == "2":
            return "sqlite"
        else:
            print("请输入 1 或 2")

def setup_mysql():
    """设置MySQL数据库"""
    print("\n设置MySQL数据库...")

    # 检查.env文件
    env_file = ".env"
    if not os.path.exists(env_file):
        print("创建.env文件...")
        env_content = """# 后端环境变量配置

# 运行环境
ENV=development

# 后端服务配置
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8003

# CORS配置
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000

# 日志配置
BACKEND_LOG_LEVEL=INFO

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nexus_db
DB_USER=root
DB_PASSWORD=20050518Zzy

# AI服务配置（根据需要填写）
# OPENAI_API_KEY=your_openai_api_key
# DASHSCOPE_API_KEY=your_dashscope_api_key
# ELEVENLABS_API_KEY=your_elevenlabs_api_key
"""
        with open(env_file, "w", encoding="utf-8") as f:
            f.write(env_content)
        print(".env文件已创建")

    # 测试MySQL连接
    print("\n测试MySQL连接...")
    try:
        import subprocess
        result = subprocess.run([sys.executable, "check_mysql.py"], capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            print("MySQL连接测试通过")
            return True
        else:
            print("MySQL连接测试失败")
            print("请查看 README_MYSQL_SETUP.md 获取帮助")
            return False
    except Exception as e:
        print(f"连接测试出错: {e}")
        return False

def setup_sqlite():
    """设置SQLite数据库"""
    print("\n设置SQLite数据库...")

    # 修改database.py使用SQLite
    print("修改数据库配置为SQLite...")

    # 备份原文件
    if os.path.exists("database.py"):
        os.rename("database.py", "database_mysql.py")

    # 创建SQLite版本
    import shutil
    shutil.copy("database_sqlite.py", "database.py")

    print("SQLite配置完成")
    print("数据库文件将创建在: Backend-test/nexus.db")

    return True

def run_setup():
    """运行数据库初始化"""
    print("\n运行数据库初始化...")

    try:
        import subprocess
        result = subprocess.run([sys.executable, "setup_database.py"], capture_output=True, text=True, timeout=60)

        if result.returncode == 0:
            print("数据库初始化成功!")
            return True
        else:
            print("数据库初始化失败:")
            print(result.stdout)
            print(result.stderr)
            return False
    except Exception as e:
        print(f"初始化出错: {e}")
        return False

def main():
    """主函数"""
    print("欢迎使用Nexus用户认证系统快速设置向导")

    # 选择数据库
    db_type = choose_database()

    # 设置数据库
    if db_type == "mysql":
        if not setup_mysql():
            print("\nMySQL设置失败，是否尝试SQLite? (y/N): ", end="")
            if input().strip().lower() == 'y':
                db_type = "sqlite"
                setup_sqlite()
            else:
                print("设置取消")
                return 1
    else:
        setup_sqlite()

    # 运行初始化
    if run_setup():
        print("\n" + "=" * 50)
        print("设置完成! 接下来:")
        print("1. 启动后端: python app.py")
        print("2. 启动前端: cd ../Fronted-main && npm run dev")
        print("3. 访问: http://localhost:5173")
        print("4. 点击'还没有账户'进行注册")
        return 0
    else:
        print("\n数据库初始化失败，请检查错误信息")
        return 1

if __name__ == "__main__":
    sys.exit(main())