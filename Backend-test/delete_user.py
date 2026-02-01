#!/usr/bin/env python3
"""
Delete a user from the database
"""

import mysql.connector

def delete_user(username):
    """Delete a user by username"""
    try:
        # Connect to database
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='@20050518Zzy',
            database='nexus_db'
        )
        cursor = conn.cursor()

        # Delete user
        cursor.execute('DELETE FROM users WHERE username = %s', (username,))
        deleted_count = cursor.rowcount

        conn.commit()
        conn.close()

        if deleted_count > 0:
            print(f"User '{username}' deleted successfully!")
            return True
        else:
            print(f"User '{username}' not found!")
            return False

    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    print("User Deletion Tool")
    print("=" * 30)

    username = input("Enter username to delete: ").strip()

    if not username:
        print("Username cannot be empty")
        return

    confirm = input(f"Are you sure you want to delete user '{username}'? (yes/no): ").strip().lower()
    if confirm not in ['yes', 'y']:
        print("Deletion cancelled")
        return

    success = delete_user(username)
    if success:
        print("User deleted. You can now register with this username again.")
    else:
        print("Failed to delete user")

if __name__ == "__main__":
    main()