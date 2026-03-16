#!/usr/bin/env python3
"""
Register a user in the database
"""

import mysql.connector
import bcrypt

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def register_user(username, email, password):
    """Register a new user"""
    try:
        # Hash the password
        hashed_password = hash_password(password)

        # Connect to database
        conn = mysql.connector.connect(
            host='localhost',
            user='img_2_video',
            password='n2wwaxxYejDRhGWe',
            database='img_2_video'
        )
        cursor = conn.cursor()

        # Insert user
        cursor.execute('''
            INSERT INTO users (username, email, password_hash)
            VALUES (%s, %s, %s)
        ''', (username, email, hashed_password))

        conn.commit()

        # Get user ID
        user_id = cursor.lastrowid

        print(f"User registered successfully!")
        print(f"   Username: {username}")
        print(f"   Email: {email}")
        print(f"   User ID: {user_id}")

        conn.close()
        return True

    except mysql.connector.Error as e:
        print(f"Database error: {e}")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    print("User Registration Tool")
    print("=" * 40)

    # Student ID credentials - you can change the password here
    username = "2023211904"
    email = "2023211904@student.com"
    password = "123456"  # Default password - CHANGE THIS TO YOUR DESIRED PASSWORD

    print(f"\nRegistering user:")
    print(f"  Username: {username}")
    print(f"  Email: {email}")
    print(f"  Password: {password}")

    success = register_user(username, email, password)
    if success:
        print("\nRegistration complete! You can now login with:")
        print(f"   Username: {username}")
        print(f"   Password: {password}")
        print("\n   IMPORTANT: Change the password variable in this script if you want a different password!")
    else:
        print("\nRegistration failed")

if __name__ == "__main__":
    main()