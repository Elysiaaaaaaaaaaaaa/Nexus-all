import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Homepage from './pages/Homepage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Example from './pages/Example.jsx';
import Manual from './pages/Manual.jsx';
import Interaction from './pages/Interaction.jsx';
import History from './pages/History.jsx';
import Settings from './pages/Settings.jsx';
import Agents from './pages/Agents.jsx';
import Projects from './pages/Projects.jsx';
import Analytics from './pages/Analytics.jsx';
import VideoGeneration from './pages/VideoGeneration.jsx';
import UIDesign from './pages/UIDesign.jsx';
import ImageGeneration from './pages/ImageGeneration.jsx';
import AudioProcessing from './pages/AudioProcessing.jsx';
import Profile from './pages/Profile.jsx';
import Login from './pages/Login.jsx';
import AgentDetail from './pages/AgentDetail.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import HistoryDetail from './pages/HistoryDetail.jsx';
import AssetsLibrary from './pages/AssetsLibrary.jsx';
import WorkflowHub from './pages/WorkflowHub.jsx';
import PlatformLab from './pages/PlatformLab.jsx';
import ExportCenter from './pages/ExportCenter.jsx';
import SecurityCenter from './pages/SecurityCenter.jsx';
import SimpleTest from './pages/SimpleTest.jsx';

// 简单的测试组件
function TestPage() {
  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'sans-serif',
      background: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333' }}>React 应用测试</h1>
      <p>如果你能看到这个页面，说明React基本工作正常。</p>
      <p>当前时间: {new Date().toLocaleString()}</p>
      <div style={{ marginTop: '20px', padding: '20px', background: 'white', borderRadius: '8px' }}>
        <h2>检查清单：</h2>
        <ul>
          <li>React 已加载 ✓</li>
          <li>路由系统已加载 ✓</li>
          <li>样式系统已加载 ✓</li>
        </ul>
      </div>
    </div>
  );
}

function App() {
  console.log('📱 App 组件开始渲染...');
  try {
    return (
      <AppProvider>
        <Router>
          <Routes>
            {/* 测试路由 - 用于诊断 */}
            <Route path="/test" element={<TestPage />} />
            <Route path="/simple" element={<SimpleTest />} />
            
            {/* 独立页面（不在Layout内） */}
            <Route path="/homepage" element={<Homepage />} />
            <Route path="/" element={<Homepage />} />
            
            {/* 需要Layout的页面 */}
            <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/manual" element={<ProtectedRoute><Layout><Manual /></Layout></ProtectedRoute>} />
            <Route path="/example" element={<ProtectedRoute><Layout><Example /></Layout></ProtectedRoute>} />
            <Route path="/interaction" element={<ProtectedRoute><Layout><Interaction /></Layout></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><Layout><History /></Layout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
            <Route path="/agents" element={<ProtectedRoute><Layout><Agents /></Layout></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Layout><Projects /></Layout></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Layout><Analytics /></Layout></ProtectedRoute>} />
            <Route path="/video-generation" element={<ProtectedRoute><Layout><VideoGeneration /></Layout></ProtectedRoute>} />
            <Route path="/ui-design" element={<ProtectedRoute><Layout><UIDesign /></Layout></ProtectedRoute>} />
            <Route path="/image-generation" element={<ProtectedRoute><Layout><ImageGeneration /></Layout></ProtectedRoute>} />
            <Route path="/audio-processing" element={<ProtectedRoute><Layout><AudioProcessing /></Layout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
            <Route path="/assets" element={<ProtectedRoute><Layout><AssetsLibrary /></Layout></ProtectedRoute>} />
            <Route path="/workflows" element={<ProtectedRoute><Layout><WorkflowHub /></Layout></ProtectedRoute>} />
            <Route path="/lab" element={<ProtectedRoute><Layout><PlatformLab /></Layout></ProtectedRoute>} />
            <Route path="/export" element={<ProtectedRoute><Layout><ExportCenter /></Layout></ProtectedRoute>} />
            <Route path="/security" element={<ProtectedRoute><Layout><SecurityCenter /></Layout></ProtectedRoute>} />
            <Route path="/login" element={<Layout><Login /></Layout>} />
            <Route path="/agent/:id" element={<ProtectedRoute><Layout><AgentDetail /></Layout></ProtectedRoute>} />
            <Route path="/project/:id" element={<ProtectedRoute><Layout><ProjectDetail /></Layout></ProtectedRoute>} />
            <Route path="/history/:id" element={<ProtectedRoute><Layout><HistoryDetail /></Layout></ProtectedRoute>} />
          </Routes>
        </Router>
      </AppProvider>
    );
  } catch (error) {
    console.error('❌ App组件渲染错误:', error);
    return (
      <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
        <h1 style={{ color: '#ef4444' }}>应用启动失败</h1>
        <p>错误: {error.message}</p>
        <pre style={{ background: '#f5f5f5', padding: '20px', borderRadius: '4px' }}>
          {error.stack}
        </pre>
      </div>
    );
  }
}

export default App;