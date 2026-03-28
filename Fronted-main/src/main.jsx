import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './styles/layout-native-mobile.css'
// 导入开发模式工具（仅在开发环境生效）
import './utils/devMode.js'
import { initNativeLayoutClassOnHtml } from './utils/runtimePlatform.js'

initNativeLayoutClassOnHtml()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)