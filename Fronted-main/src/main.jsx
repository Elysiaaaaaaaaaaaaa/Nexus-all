import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

// 添加错误处理和调试日志
console.log('🚀 开始加载应用...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ 找不到 root 元素！');
  document.body.innerHTML = `
    <div style="padding: 40px; font-family: sans-serif; text-align: center;">
      <h1 style="color: #ef4444;">错误：找不到 root 元素</h1>
      <p>请检查 index.html 中是否有 &lt;div id="root"&gt;&lt;/div&gt;</p>
    </div>
  `;
} else {
  console.log('✅ 找到 root 元素');
  try {
    console.log('✅ 开始渲染 React 应用...');
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>,
    );
    console.log('✅ React 应用渲染完成');
  } catch (error) {
    console.error('❌ 应用启动失败:', error);
    rootElement.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif; background: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; margin: 40px;">
        <h1 style="color: #ef4444; margin-bottom: 20px;">应用启动失败</h1>
        <p style="color: #991b1b; margin-bottom: 10px;"><strong>错误信息:</strong> ${error.message}</p>
        <pre style="background: white; padding: 15px; border-radius: 4px; overflow: auto; color: #7f1d1d; font-size: 12px;">
${error.stack}
        </pre>
        <p style="margin-top: 20px; color: #991b1b;">请检查浏览器控制台（F12）获取更多信息。</p>
      </div>
    `;
  }
}