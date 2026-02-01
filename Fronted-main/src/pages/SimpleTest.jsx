// 最简单的测试页面
import React from 'react';

function SimpleTest() {
  return (
    <div style={{
      padding: '40px',
      fontFamily: 'Arial, sans-serif',
      background: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333', fontSize: '32px' }}>✅ React 工作正常！</h1>
      <p style={{ color: '#666', fontSize: '18px', marginTop: '20px' }}>
        如果你能看到这个页面，说明 React 和路由系统都正常工作。
      </p>
      <div style={{
        marginTop: '30px',
        padding: '20px',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#333' }}>当前状态：</h2>
        <ul style={{ color: '#666', lineHeight: '1.8' }}>
          <li>✅ React 已加载</li>
          <li>✅ 路由系统正常</li>
          <li>✅ 样式系统正常</li>
          <li>✅ 页面渲染成功</li>
        </ul>
      </div>
      <div style={{ marginTop: '30px' }}>
        <a 
          href="/" 
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#3b82f6',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '16px'
          }}
        >
          返回首页
        </a>
      </div>
    </div>
  );
}

export default SimpleTest;
