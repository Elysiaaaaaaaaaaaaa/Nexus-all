import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { ToastProvider } from './contexts/ToastContext.jsx';
import { SecurityProvider } from './middleware/security';
import Layout from './components/Layout.jsx';
import { ProtectedLayoutRoute } from './components/ProtectedLayoutRoute.jsx';
import MobileLayout from './layouts/MobileLayout.jsx';
import Homepage from './pages/Homepage.jsx';
import HomepageMobile from './pages/mobile/HomepageMobile.jsx';
import Dashboard from './pages/Dashboard.jsx';
import DashboardMobile from './pages/mobile/DashboardMobile.jsx';
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
import LoginMobile from './pages/mobile/LoginMobile.jsx';
import AgentDetail from './pages/AgentDetail.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import HistoryDetail from './pages/HistoryDetail.jsx';
import AssetsLibrary from './pages/AssetsLibrary.jsx';
import WorkflowHub from './pages/WorkflowHub.jsx';
import PlatformLab from './pages/PlatformLab.jsx';
import ExportCenter from './pages/ExportCenter.jsx';
import SecurityCenter from './pages/SecurityCenter.jsx';
import TechShowcase from './pages/TechShowcase.jsx';
import TeamIntroduction from './pages/TeamIntroduction.jsx';
import AcpsBoard from './pages/AcpsBoard.jsx';
import ServerDevBoard from './pages/ServerDevBoard.jsx';
import MoreHub from './pages/MoreHub.jsx';
import * as MB from './pages/mobile/bridgedExports.jsx';
import { isNativeMobileLayout } from './utils/runtimePlatform';
import { isProduction } from './utils/security';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch() {
    // 已由 ErrorBoundary 处理
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
          <h1 style={{ color: '#ef4444' }}>页面加载失败</h1>
          <p>请刷新页面重试。</p>
          {!isProduction() && this.state.error && (
            <pre style={{ background: '#f5f5f5', padding: '20px', borderRadius: '4px', marginTop: '20px' }}>
              {this.state.error.toString()}
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

function TestPage() {
  if (isProduction()) {
    return (
      <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
        <h1 style={{ color: '#ef4444' }}>404 - 页面不存在</h1>
        <p>您访问的页面不存在。</p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '40px',
      fontFamily: 'sans-serif',
      background: '#f0f0f0',
      minHeight: '100vh',
    }}
    >
      <h1 style={{ color: '#333' }}>React 应用测试</h1>
      <p>如果你能看到这个页面，说明React基本工作正常。</p>
      <p>
        当前时间:
        {new Date().toLocaleString()}
      </p>
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
  const homeEntry = isNativeMobileLayout() ? <HomepageMobile /> : <Homepage />;
  const loginEntry = isNativeMobileLayout() ? (
    <MobileLayout hideTabBar>
      <LoginMobile />
    </MobileLayout>
  ) : (
    <Layout>
      <Login />
    </Layout>
  );

  return (
    <SecurityProvider>
      <AppProvider>
        <ToastProvider>
          <AppErrorBoundary>
            <Router>
              <Routes>
                {!isProduction() && <Route path="/test" element={<TestPage />} />}

                <Route path="/homepage" element={homeEntry} />
                <Route path="/" element={homeEntry} />

                <Route path="/dashboard" element={<ProtectedLayoutRoute web={Dashboard} mobile={DashboardMobile} />} />
                <Route path="/more" element={<ProtectedLayoutRoute web={MoreHub} mobile={MoreHub} />} />
                <Route path="/manual" element={<ProtectedLayoutRoute web={Manual} mobile={MB.ManualMobile} />} />
                <Route path="/example" element={<ProtectedLayoutRoute web={Example} mobile={MB.ExampleMobile} />} />
                <Route path="/interaction" element={<ProtectedLayoutRoute web={Interaction} mobile={MB.InteractionMobile} />} />
                <Route path="/history" element={<ProtectedLayoutRoute web={History} mobile={MB.HistoryMobile} />} />
                <Route path="/settings" element={<ProtectedLayoutRoute web={Settings} mobile={MB.SettingsMobile} />} />
                <Route path="/agents" element={<ProtectedLayoutRoute web={Agents} mobile={MB.AgentsMobile} />} />
                <Route path="/projects" element={<ProtectedLayoutRoute web={Projects} mobile={MB.ProjectsMobile} />} />
                <Route path="/analytics" element={<ProtectedLayoutRoute web={Analytics} mobile={MB.AnalyticsMobile} />} />
                <Route path="/video-generation" element={<ProtectedLayoutRoute web={VideoGeneration} mobile={MB.VideoGenerationMobile} />} />
                <Route path="/ui-design" element={<ProtectedLayoutRoute web={UIDesign} mobile={MB.UIDesignMobile} />} />
                <Route path="/image-generation" element={<ProtectedLayoutRoute web={ImageGeneration} mobile={MB.ImageGenerationMobile} />} />
                <Route path="/audio-processing" element={<ProtectedLayoutRoute web={AudioProcessing} mobile={MB.AudioProcessingMobile} />} />
                <Route path="/profile" element={<ProtectedLayoutRoute web={Profile} mobile={MB.ProfileMobile} />} />
                <Route path="/assets" element={<ProtectedLayoutRoute web={AssetsLibrary} mobile={MB.AssetsLibraryMobile} />} />
                <Route path="/workflows" element={<ProtectedLayoutRoute web={WorkflowHub} mobile={MB.WorkflowHubMobile} />} />
                <Route path="/lab" element={<ProtectedLayoutRoute web={PlatformLab} mobile={MB.PlatformLabMobile} />} />
                <Route path="/export" element={<ProtectedLayoutRoute web={ExportCenter} mobile={MB.ExportCenterMobile} />} />
                <Route path="/security" element={<ProtectedLayoutRoute web={SecurityCenter} mobile={MB.SecurityCenterMobile} />} />
                <Route path="/login" element={loginEntry} />
                <Route path="/agent/:id" element={<ProtectedLayoutRoute web={AgentDetail} mobile={MB.AgentDetailMobile} />} />
                <Route path="/project/:id" element={<ProtectedLayoutRoute web={ProjectDetail} mobile={MB.ProjectDetailMobile} />} />
                <Route path="/history/:id" element={<ProtectedLayoutRoute web={HistoryDetail} mobile={MB.HistoryDetailMobile} />} />
                <Route path="/tech-showcase" element={<ProtectedLayoutRoute web={TechShowcase} mobile={MB.TechShowcaseMobile} />} />
                <Route path="/competition-showcase" element={<ProtectedLayoutRoute web={ServerDevBoard} mobile={MB.ServerDevBoardMobile} />} />
                <Route path="/team" element={<ProtectedLayoutRoute web={TeamIntroduction} mobile={MB.TeamIntroductionMobile} />} />
                <Route
                  path="/acps-board"
                  element={
                    <ProtectedLayoutRoute
                      web={AcpsBoard}
                      mobile={MB.AcpsBoardMobile}
                      mobileShellProps={{
                        showBack: true,
                        titleI18nKey: 'moreHub.linkAcpsBoard',
                      }}
                    />
                  }
                />
              </Routes>
            </Router>
          </AppErrorBoundary>
        </ToastProvider>
      </AppProvider>
    </SecurityProvider>
  );
}

export default App;
