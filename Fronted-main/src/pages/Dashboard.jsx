import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Paperclip, Microphone, ArrowUp,
  FilmStrip, Image
} from '@phosphor-icons/react';
import './Dashboard.css';
import { useApp } from '../contexts/AppContext';
import { isProduction } from '../utils/security';

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useApp();
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const handleSubmit = () => {
    if (inputValue.trim()) {
      // 跳转到操作示例页面
      navigate('/example');
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // 这里可以处理文件上传逻辑
    }
  };

  const handleMicrophoneClick = async () => {
    // 移除详细日志，避免泄露敏感信息
    if (isRecording) {
      // 停止录音
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    } else {
      // 开始录音
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        const chunks = [];
        mediaRecorder.ondataavailable = (e) => {
          chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/wav' });
          
          // 这里可以处理录音文件
          stream.getTracks().forEach(track => {
            track.stop();
          });
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        alert('无法访问麦克风，请检查权限设置');
      }
    }
  };

  const handleNotificationClick = () => {
    const email = prompt('请输入您的邮箱地址以订阅邮件通知:');
    if (email) {
      console.log('订阅邮件:', email);
      alert('订阅成功！我们将向 ' + email + ' 发送通知。');
    }
  };

  return (
    <div className="dashboard-container">
      {/* 顶部状态栏 */}
      <header className="dashboard-header">
        <div className="status-badge">
          <span className="status-dot"></span>
          系统运行正常
        </div>
        <button
          className="notification-button"
          onClick={handleNotificationClick}
        >
          <Bell size={18} />
        </button>
      </header>

      {/* 标题 */}
      <div className="title-section">
        <h1 className="title-main">
          {t('dashboard.headlineMain')} <span className="title-gradient">{t('dashboard.headlineHighlight')}</span> {t('dashboard.headlineTail')}
        </h1>
        <p className="title-subtitle">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* 输入区域 */}
      <div className="input-container-simple">
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button
          className="input-add-button-simple"
          onClick={handleFileSelect}
          title="选择文件"
          aria-label="上传文件"
        >
          <Paperclip size={20} weight="regular" />
        </button>
        <input
          type="text"
          className="input-simple"
          placeholder={t('dashboard.askPlaceholder')}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <button
          className="input-send-button-simple"
          onClick={inputValue.trim() ? handleSubmit : handleMicrophoneClick}
          style={isRecording ? { color: 'rgb(239, 68, 68)' } : {}}
          title={isRecording ? t('dashboard.stopRecording') : inputValue.trim() ? t('dashboard.send') : t('dashboard.startRecording')}
          aria-label={isRecording ? t('dashboard.stopRecording') : inputValue.trim() ? t('dashboard.send') : t('dashboard.startRecording')}
        >
          {inputValue.trim() ? (
            <ArrowUp weight="bold" size={20} />
          ) : (
            <Microphone size={20} weight={isRecording ? 'fill' : 'regular'} />
          )}
        </button>
      </div>

      {/* 快捷卡片 */}
      <div className="mode-grid-single">
        <ModeCard
          icon={<FilmStrip weight="fill" />}
          title={t('dashboard.workflowFastTitle')}
          desc={t('dashboard.workflowFastDesc')}
          color="rgb(219, 234, 254)"
          textColor="rgb(37, 99, 235)"
          path="/interaction"
          state={{ workflow: 'text_to_video_fast' }}
        />
        <ModeCard
          icon={<Image weight="fill" />}
          title={t('dashboard.workflowStoryboardTitle')}
          desc={t('dashboard.workflowStoryboardDesc')}
          color="rgb(243, 232, 255)"
          textColor="rgb(168, 85, 247)"
          path="/interaction"
          state={{ workflow: 'storyboard_precise' }}
        />
      </div>

      {/* 底部Footer */}
      <footer className="dashboard-footer">
        <div className="footer-divider">
          <div className="divider-line"></div>
          <span className="divider-text">Next-Gen Orchestrator</span>
          <div className="divider-line"></div>
        </div>
        <div className="footer-info">
          <div className="footer-dot"></div>
          <span className="footer-text">Nexus Studio v4.0.2 Active</span>
        </div>
      </footer>
    </div>
  );
};

const IconButton = ({ icon, title, onClick }) => (
  <button
    className="icon-button"
    title={title}
    onClick={onClick || (() => {})}
  >
    {icon}
  </button>
);

const ModeCard = ({ icon, title, desc, color, textColor, path, state }) => {
  const navigate = useNavigate();

  return (
    <button
      className="mode-card"
      onClick={() => navigate(path, state ? { state } : undefined)}
    >
      <div className="mode-icon-container" style={{ background: color, color: textColor }}>
        {icon}
      </div>
      <div className="mode-title">{title}</div>
      <div className="mode-desc">{desc}</div>
    </button>
  );
};

export default Dashboard;