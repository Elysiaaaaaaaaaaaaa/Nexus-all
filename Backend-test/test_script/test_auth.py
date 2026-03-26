#!/usr/bin/env python3
import requests
import json
import time

# 测试服务器地址
BASE_URL = "http://localhost:8003"

def test_register():
    """测试用户注册功能"""
    print("\n=== 测试用户注册 ===")
    
    # 生成唯一的测试用户
    timestamp = int(time.time())
    test_user = {
        "username": f"test_user_{timestamp}",
        "email": f"test_{timestamp}@example.com",
        "password": "TestPassword123!"
    }
    
    url = f"{BASE_URL}/api/v1/auth/register"
    
    try:
        response = requests.post(url, json=test_user, timeout=10)
        
        print(f"状态码: {response.status_code}")
        print(f"响应内容: {json.dumps(response.json(), ensure_ascii=False, indent=2)}")
        
        if response.status_code == 200:
            print("✅ 注册成功")
            return response.json()
        else:
            print("❌ 注册失败")
            return None
    except Exception as e:
        print(f"❌ 注册请求失败: {e}")
        return None

def test_login(username, password):
    """测试用户登录功能"""
    print("\n=== 测试用户登录 ===")
    
    login_data = {
        "username": username,
        "password": password
    }
    
    url = f"{BASE_URL}/api/v1/auth/login"
    
    try:
        response = requests.post(url, json=login_data, timeout=10)
        
        print(f"状态码: {response.status_code}")
        print(f"响应内容: {json.dumps(response.json(), ensure_ascii=False, indent=2)}")
        
        if response.status_code == 200:
            print("✅ 登录成功")
            return response.json()
        else:
            print("❌ 登录失败")
            return None
    except Exception as e:
        print(f"❌ 登录请求失败: {e}")
        return None

def test_login_with_email(email, password):
    """测试使用邮箱登录"""
    print("\n=== 测试使用邮箱登录 ===")
    
    login_data = {
        "username": email,  # 使用邮箱作为username
        "password": password
    }
    
    url = f"{BASE_URL}/api/v1/auth/login"
    
    try:
        response = requests.post(url, json=login_data, timeout=10)
        
        print(f"状态码: {response.status_code}")
        print(f"响应内容: {json.dumps(response.json(), ensure_ascii=False, indent=2)}")
        
        if response.status_code == 200:
            print("✅ 使用邮箱登录成功")
            return response.json()
        else:
            print("❌ 使用邮箱登录失败")
            return None
    except Exception as e:
        print(f"❌ 登录请求失败: {e}")
        return None

def test_invalid_login():
    """测试无效登录"""
    print("\n=== 测试无效登录 ===")
    
    invalid_data = {
        "username": "non_existent_user",
        "password": "wrong_password"
    }
    
    url = f"{BASE_URL}/api/v1/auth/login"
    
    try:
        response = requests.post(url, json=invalid_data, timeout=10)
        
        print(f"状态码: {response.status_code}")
        print(f"响应内容: {json.dumps(response.json(), ensure_ascii=False, indent=2)}")
        
        if response.status_code == 401:
            print("✅ 无效登录测试通过")
            return True
        else:
            print("❌ 无效登录测试失败")
            return False
    except Exception as e:
        print(f"❌ 登录请求失败: {e}")
        return False

def main():
    """主测试函数"""
    print("开始测试用户认证功能...")
    
    # 测试注册
    register_result = test_register()
    
    if register_result:
        # 获取注册的用户信息
        username = register_result['user']['username']
        email = register_result['user']['email']
        password = "TestPassword123!"  # 与注册时使用的密码一致
        
        # 测试使用用户名登录
        test_login(username, password)
        
        # 测试使用邮箱登录
        test_login_with_email(email, password)
    
    # 测试无效登录
    test_invalid_login()
    
    print("\n测试完成！")

if __name__ == "__main__":
    main()
