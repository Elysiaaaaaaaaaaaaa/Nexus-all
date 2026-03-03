#!/usr/bin/env python3
"""
简化的MySQL状态检查
"""

import subprocess
import sys

def run_cmd(cmd, desc):
    """运行命令"""
    print(f"\n{desc}...")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
        print(f"Exit code: {result.returncode}")
        if result.stdout.strip():
            print(f"Output: {result.stdout.strip()}")
        if result.stderr.strip():
            print(f"Error: {result.stderr.strip()}")
        return result.returncode == 0
    except Exception as e:
        print(f"Failed: {e}")
        return False

def main():
    print("=" * 50)
    print("MySQL Status Check")
    print("=" * 50)

    # Check service
    print("\nChecking MySQL80 service...")
    success = run_cmd("sc query MySQL80", "Service status")
    if success:
        print("MySQL80 service is running")
    else:
        print("MySQL80 service check failed")

    # Check processes
    print("\nChecking MySQL processes...")
    run_cmd('tasklist /FI "IMAGENAME eq mysqld.exe"', "Process check")

    # Try different passwords
    print("\nTesting MySQL connections...")
    passwords = ["n2wwaxxYejDRhGWe", "20050518Zzy", "", "root"]

    mysql_exe = r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

    for password in passwords:
        print(f"\nTesting password: '{password}'")
        cmd = f'"{mysql_exe}" -u root -p{password} -e "SELECT VERSION();"'
        success = run_cmd(cmd, f"Connect with password '{password}'")
        if success:
            print(f"SUCCESS! Working password: '{password}'")
            print("\nUpdate your .env file:")
            print(f"DB_PASSWORD={password}")
            print("\nThen run: python setup_database.py")
            return True

    print("\nFAILED: Could not connect with any tested password")
    print("\nSolutions:")
    print("1. Reset MySQL root password: python mysql_reset.py")
    print("2. Use SQLite instead: python quick_setup.py (choose option 2)")
    return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)