import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { 
  Monitor, Cpu, Globe, ShieldCheck, 
  ArrowsOutSimple, ArrowsInSimple, 
  MagnifyingGlassPlus, MagnifyingGlassMinus,
  CaretLeft, CaretRight, FilePdf, Code
} from '@phosphor-icons/react';
import './TechShowcase.css';

const TechShowcase = () => {
  const { t } = useApp();
  const [activePdfIndex, setActivePdfIndex] = useState(0);
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [iframeKey, setIframeKey] = useState(0); // 用于强制刷新 iframe

  const pdfFiles = [
    { url: '/pdfs/Nexus.pdf', title: 'Nexus Architecture v4.0', type: 'System Core' },
    // 您可以在这里添加更多 PDF
  ];

  const metrics = [
    { 
      label: t('techShowcase.frontendCore') || 'Frontend Core', 
      value: 'React 18', 
      status: 'Stable', 
      icon: <Monitor weight="duotone" /> 
    },
    { 
      label: t('techShowcase.serverRuntime') || 'Server Runtime', 
      value: 'Node.js 20', 
      status: 'Active', 
      icon: <Cpu weight="duotone" /> 
    },
    { 
      label: t('techShowcase.globalCDN') || 'Global CDN', 
      value: 'Edge Network', 
      status: '98ms', 
      icon: <Globe weight="duotone" /> 
    },
    { 
      label: t('techShowcase.securityProtocol') || 'Security Protocol', 
      value: 'OAuth 2.0', 
      status: 'Encrypted', 
      icon: <ShieldCheck weight="duotone" /> 
    },
  ];

  // 处理缩放
  const handleZoom = (delta) => {
    setZoomLevel(prev => Math.min(Math.max(0.5, prev + delta), 2.0));
  };

  // 切换全屏模式
  const toggleCinemaMode = () => {
    setIsCinemaMode(!isCinemaMode);
    setZoomLevel(1); // 重置缩放
    // 强制重绘 iframe 以适应新尺寸
    setTimeout(() => setIframeKey(prev => prev + 1), 300);
  };

  return (
    <div className={`tech-dashboard ${isCinemaMode ? 'cinema-mode-active' : ''}`}>
      
      {/* 顶部控制栏 (非全屏时显示) */}
      {!isCinemaMode && (
        <header className="tech-header">
          <div className="tech-title-group">
            <Code weight="bold" size={24} className="tech-title-icon" />
            <h1 className="tech-title">
              {t('techShowcase.title') || 'SYSTEM ARCHITECTURE'}
            </h1>
            <span className="tech-badge">
              <span className="live-dot"></span> {t('techShowcase.liveMonitoring') || 'LIVE MONITORING'}
            </span>
          </div>
          
          <div className="tech-controls">
             {/* 模拟的时间或版本号 */}
             <span className="system-version">{t('techShowcase.buildVersion') || 'BUILD 2024.10.45-RC'}</span>
          </div>
        </header>
      )}

      {/* 核心布局 */}
      <div className="tech-grid-layout">
        
        {/* 左侧/主视图：PDF 监控器 */}
        <div className="main-viewer-panel">
          
          {/* 监控器顶部栏 */}
          <div className="viewer-toolbar">
            <div className="file-info">
              <FilePdf size={20} weight="fill" className="file-icon"/>
              <span className="file-name">{pdfFiles[activePdfIndex].title}</span>
              <span className="file-tag">{pdfFiles[activePdfIndex].type}</span>
            </div>
            
            <div className="viewer-actions">
              <button onClick={() => handleZoom(-0.1)} className="action-btn" title={t('techShowcase.zoomOut') || 'Zoom Out'}>
                <MagnifyingGlassMinus size={20} weight="bold" />
              </button>
              <span className="zoom-indicator">{Math.round(zoomLevel * 100)}%</span>
              <button onClick={() => handleZoom(0.1)} className="action-btn" title={t('techShowcase.zoomIn') || 'Zoom In'}>
                <MagnifyingGlassPlus size={20} weight="bold" />
              </button>
              <div className="divider-vertical"></div>
              <button onClick={toggleCinemaMode} className="action-btn primary" title={isCinemaMode ? (t('techShowcase.exitCinemaMode') || 'Exit Cinema Mode') : (t('techShowcase.cinemaMode') || 'Cinema Mode')}>
                {isCinemaMode ? <ArrowsInSimple size={20} weight="bold" /> : <ArrowsOutSimple size={20} weight="bold" />}
              </button>
            </div>
          </div>

          {/* PDF 容器 */}
          <div className="pdf-viewport">
            <div 
              className="pdf-transform-layer"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <iframe
                key={iframeKey}
                src={`${pdfFiles[activePdfIndex].url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                title="Tech Specification PDF"
                className="tech-iframe"
              />
            </div>
          </div>
        </div>

        {/* 右侧/底部：数据指标 (全屏模式下隐藏) */}
        {!isCinemaMode && (
          <div className="side-panel">
            {/* 状态指标卡片 */}
            <div className="metrics-grid">
              {metrics.map((item, index) => (
                <div key={index} className="metric-card">
                  <div className="metric-icon">{item.icon}</div>
                  <div className="metric-info">
                    <div className="metric-label">{item.label}</div>
                    <div className="metric-value">{item.value}</div>
                  </div>
                  <div className={`metric-status ${item.status.includes('ms') ? 'latency' : 'active'}`}>
                    {item.status}
                  </div>
                </div>
              ))}
            </div>

            {/* 技术栈详情 */}
            <div className="stack-details-card">
              <h3>{t('techShowcase.coreTechnologies') || 'CORE TECHNOLOGIES'}</h3>
              <ul className="tech-list">
                <li>
                  <span className="tech-name">{t('techShowcase.frontendArchitecture') || 'Frontend Architecture'}</span>
                  <div className="progress-bar"><div className="fill" style={{width: '92%'}}></div></div>
                </li>
                <li>
                  <span className="tech-name">{t('techShowcase.apiResponseRate') || 'API Response Rate'}</span>
                  <div className="progress-bar"><div className="fill" style={{width: '99%'}}></div></div>
                </li>
                <li>
                  <span className="tech-name">{t('techShowcase.systemCoverage') || 'System Coverage'}</span>
                  <div className="progress-bar"><div className="fill" style={{width: '88%'}}></div></div>
                </li>
              </ul>
            </div>
            
            {/* 简单的文档切换导航 (如果有多份PDF) */}
            {pdfFiles.length > 1 && (
              <div className="doc-navigator">
                 <button 
                   onClick={() => setActivePdfIndex(prev => (prev - 1 + pdfFiles.length) % pdfFiles.length)}
                   className="nav-arrow"
                 >
                   <CaretLeft />
                 </button>
                 <span>{t('techShowcase.document') || 'DOCUMENT'} {activePdfIndex + 1} / {pdfFiles.length}</span>
                 <button 
                   onClick={() => setActivePdfIndex(prev => (prev + 1) % pdfFiles.length)}
                   className="nav-arrow"
                 >
                   <CaretRight />
                 </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TechShowcase;