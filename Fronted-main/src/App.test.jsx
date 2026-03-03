// 临时测试文件 - 用于诊断问题
import React from 'react';

function TestApp() {
  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#333' }}>测试页面</h1>
      <p>如果你能看到这个，说明React基本工作正常。</p>
      <p>当前时间: {new Date().toLocaleString()}</p>
    </div>
  );
}

export default TestApp;
