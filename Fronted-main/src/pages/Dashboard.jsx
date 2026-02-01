import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bell, Paperclip, Microphone, ArrowUp,
  FilmStrip, Image
} from '@phosphor-icons/react';
import './Dashboard.css';
import { useApp } from '../contexts/AppContext';
import { projectAPI } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { t, userId } = useApp();
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
      console.log('选择的文件:', file.name);
      // 这里可以处理文件上传逻辑
    }
  };

  const handleMicrophoneClick = async () => {
    console.log('🎤 麦克风按钮被点击了！');
    console.log('当前录音状态:', isRecording ? '正在录音' : '未录音');
    console.log('输入框内容:', inputValue);
    console.log('输入框是否为空:', !inputValue.trim());
    
    if (isRecording) {
      console.log('🛑 停止录音流程开始...');
      // 停止录音
      if (mediaRecorderRef.current) {
        console.log('🛑 调用 mediaRecorder.stop()');
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        console.log('✅ 录音已停止，isRecording 设为 false');
      } else {
        console.warn('⚠️ mediaRecorderRef.current 为 null，无法停止录音');
      }
    } else {
      console.log('🎙️ 开始录音流程开始...');
      // 开始录音
      try {
        console.log('🔑 正在请求麦克风权限...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('✅ 麦克风权限获取成功，stream:', stream);
        
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        console.log('✅ MediaRecorder 创建成功:', mediaRecorder);

        const chunks = [];
        mediaRecorder.ondataavailable = (e) => {
          console.log('📦 收到音频数据块，大小:', e.data.size);
          chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          console.log('⏹️ MediaRecorder onstop 事件触发');
          const blob = new Blob(chunks, { type: 'audio/wav' });
          console.log('✅ 录音完成，音频大小:', blob.size, 'bytes');
          console.log('📁 生成的 Blob:', blob);
          
          // 这里可以处理录音文件
          stream.getTracks().forEach(track => {
            console.log('🔌 停止音轨:', track);
            track.stop();
          });
        };

        console.log('▶️ 开始录音...');
        mediaRecorder.start();
        setIsRecording(true);
        console.log('✅ 录音已开始，isRecording 设为 true');
        console.log('🎤 可以开始说话了...');
      } catch (error) {
        console.error('❌ 无法访问麦克风:', error);
        console.error('错误详情:', error.name, error.message);
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
      <div className="mode-grid">
        <ModeCard
          icon={<FilmStrip weight="fill" />}
          title={t('dashboard.workflowFastTitle')}
          desc={t('dashboard.workflowFastDesc')}
          color="rgb(219, 234, 254)"
          textColor="rgb(37, 99, 235)"
          path="/interaction"
          state={{ workflow: 'text_to_video_fast', workflowType: 'text2video' }}
        />
        <ModeCard
          icon={<Image weight="fill" />}
          title="图片到视频 · 图生视频"
          desc="将图片转换为动态视频"
          color="rgb(255, 237, 213)"
          textColor="rgb(249, 115, 22)"
          path="/interaction"
          state={{ workflow: 'image_to_video', workflowType: 'image2video' }}
          onCreateProject={async () => {
            const projectName = `图生视频_${Date.now()}`;
            return await projectAPI.createProject(projectName, 'image2video');
          }}
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
          <span className="footer-text">Nexus Engine v4.0.2 Active</span>
        </div>
      </footer>
    </div>
  );
};

const IconButton = ({ icon, title, onClick }) => (
  <button
    className="icon-button"
    title={title}
    onClick={onClick || (() => console.log(title))}
  >
    {icon}
  </button>
);

const ModeCard = ({ icon, title, desc, color, textColor, path, state, onCreateProject }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = async () => {
    // 检查是否是从Interaction页面跳转过来的，需要创建新项目
    const forceNewProject = location.state?.forceNewProject;
    const newProjectName = location.state?.newProjectName;
    
    // 如果需要创建项目（图片到视频），先创建项目再跳转
    if (onCreateProject) {
      try {
        const response = await onCreateProject();
        if (response && response.success) {
          navigate(path, {
            state: {
              ...state,
              projectName: response.project_name,
              isNewProject: true,  // 标记这是新创建的项目
              session_id: response.session_id  // 传递新的session_id
            }
          });
        } else {
          // 如果创建失败，仍然跳转（让后端处理）
          navigate(path, state ? { state } : undefined);
        }
      } catch (error) {
        console.error('创建项目失败:', error);
        // 创建失败时仍然跳转
        navigate(path, state ? { state } : undefined);
      }
    } else if (forceNewProject && newProjectName) {
      // 如果强制创建新项目，先调用API创建项目，然后跳转
      try {
        const { projectAPI } = await import('../services/api');
        const workflowType = state?.workflowType || 'text2video';
        const response = await projectAPI.createProject(newProjectName, workflowType);
        if (response && response.success) {
          navigate(path, {
            state: {
              ...state,
              projectName: response.project_name,
              isNewProject: true,
              session_id: response.session_id
            }
          });
        } else {
          // 如果创建失败，使用传递的项目名称直接跳转
          navigate(path, {
            state: {
              ...state,
              projectName: newProjectName,
              isNewProject: true
            }
          });
        }
      } catch (error) {
        console.error('创建新项目失败:', error);
        // 创建失败时使用传递的项目名称直接跳转
        navigate(path, {
          state: {
            ...state,
            projectName: newProjectName,
            isNewProject: true
          }
        });
      }
    } else {
      navigate(path, state ? { state } : undefined);
    }
  };

  return (
    <button
      className="mode-card"
      onClick={handleClick}
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