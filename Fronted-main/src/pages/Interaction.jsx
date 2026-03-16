import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Brain, Check, Play, Plus, ArrowUp, 
  Share, Sidebar, Copy, Aperture, Lightning,
  TerminalWindow, X, Paperclip, Microphone
} from '@phosphor-icons/react';
import logoCircle from '../assets/logo_circle.png';
import './Interaction.css';
import { useApp } from '../contexts/AppContext';
import { getUserAvatarUrl } from '../utils/avatar';

const Interaction = () => {
  const location = useLocation();
  const scrollRef = useRef(null);
  const imageInputRef = useRef(null);
  const [showPreview, setShowPreview] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]);
  const [sessionData, setSessionData] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const [isModifyDialogOpen, setIsModifyDialogOpen] = useState(false);
  const [modifyNums, setModifyNums] = useState([]);
  const { t } = useApp();
  const [rightPanelTab, setRightPanelTab] = useState('execution');

  const { userInfo } = useApp();
  const workflow = useMemo(() => location.state?.workflow || 'text_to_video_fast', [location.state]);
  
  // 生成用户头像 URL
  const userAvatarUrl = useMemo(() => {
    const username = userInfo?.username || 'User';
    return getUserAvatarUrl(null, username);
  }, [userInfo?.username]);

  const workflowLabel = useMemo(() => {
    if (workflow === 'storyboard_precise') return t('dashboard.workflowStoryboardTitle');
    return t('dashboard.workflowFastTitle');
  }, [workflow, t]);

  useEffect(() => {
    if (sessionData?.now_state === 'modify_comfirm') {
      setIsModifyDialogOpen(true);
    }
  }, [sessionData?.now_state]);

  useEffect(() => {
    // 如果有从Dashboard传递的初始消息，添加到消息列表
    if (location.state?.initialMessage) {
      const initialMsg = location.state.initialMessage;
      // 使用 setTimeout 避免在 effect 中同步调用 setState
      setTimeout(() => {
      setMessages([{
        id: 1,
        type: 'user',
        content: initialMsg,
        timestamp: new Date()
      }]);
      }, 0);
      // 清空location state，避免刷新时重复添加
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const normalizeAiContent = (value) => {
    if (value == null) return '';
    if (typeof value === 'string') {
      const trimmed = value.trim();
      // 处理后端把 JSON/数组“序列化成字符串”返回的情况
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            // 数组里多为字符串/对象时，尽量变成可读文本
            return parsed.map((x, i) => `${i + 1}. ${normalizeAiContent(x)}`).join('\n');
          }
          return JSON.stringify(parsed, null, 2);
        } catch {
          // 回退为原始字符串
          return value;
        }
      }
      return value;
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  const sendToBackend = async (payload) => {
    const body = {
      ...payload,
      workflow,
      session_id: sessionData?.session_id
    };

    const res = await fetch('/api/interaction/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = json?.message || `请求失败(${res.status})`;
      throw new Error(msg);
    }
    return json;
  };

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content || isSending) return;

    const newMessage = {
      id: Date.now(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    setInputValue('');

    setIsSending(true);
    try {
      const resp = await sendToBackend({ content });
      const data = resp?.data ?? resp;
      const aiText = normalizeAiContent(data?.response ?? data?.message ?? data?.content ?? '');
      const nextSessionData = data?.session_data ?? data?.sessionData ?? null;

      if (nextSessionData) setSessionData(nextSessionData);

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          type: 'ai',
          content: aiText || '（后端未返回可展示内容）',
          timestamp: new Date()
        }
      ]);
    } catch (e) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 2,
          type: 'ai',
          content: `请求失败：${e?.message || '未知错误'}`,
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirm = async () => {
    if (isSending) return;

    setMessages(prev => [
      ...prev,
      { id: Date.now(), type: 'user', content: '确认', timestamp: new Date() }
    ]);

    setIsSending(true);
    try {
      const resp = await sendToBackend({ content: '确认' });
      const data = resp?.data ?? resp;
      const aiText = normalizeAiContent(data?.response ?? data?.message ?? data?.content ?? '');
      const nextSessionData = data?.session_data ?? data?.sessionData ?? null;
      if (nextSessionData) setSessionData(nextSessionData);

      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, type: 'ai', content: aiText || '已确认。', timestamp: new Date() }
      ]);
    } catch (e) {
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 2, type: 'ai', content: `确认失败：${e?.message || '未知错误'}`, timestamp: new Date() }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const submitModifyDecision = async ({ needModify }) => {
    if (isSending) return;
    setIsModifyDialogOpen(false);

    if (!needModify) {
      // 用户点击「不需要修改」：直接给后端 API 返回 content: '不需要'
      setMessages(prev => [...prev, { id: Date.now(), type: 'user', content: '不需要', timestamp: new Date() }]);
      setIsSending(true);
      try {
        const resp = await sendToBackend({ content: '不需要', modify_num: [] });
        const data = resp?.data ?? resp;
        const aiText = normalizeAiContent(data?.response ?? data?.message ?? data?.content ?? '');
        const nextSessionData = data?.session_data ?? data?.sessionData ?? null;
        if (nextSessionData) setSessionData(nextSessionData);
        setMessages(prev => [...prev, { id: Date.now() + 1, type: 'ai', content: aiText || '已提交：不需要修改。', timestamp: new Date() }]);
      } catch (e) {
        setMessages(prev => [...prev, { id: Date.now() + 2, type: 'ai', content: `提交失败：${e?.message || '未知错误'}`, timestamp: new Date() }]);
      } finally {
        setIsSending(false);
      }
      return;
    }

    // 用户点击「需要修改」：给后端 API 返回 content: '需要修改' 及 modify_num
    const nums = Array.from(new Set(modifyNums))
      .map(n => Number(n))
      .filter(n => Number.isFinite(n) && n > 0)
      .sort((a, b) => a - b);

    setMessages(prev => [
      ...prev,
      { id: Date.now(), type: 'user', content: `需要修改：${nums.length ? nums.join(', ') : '（未选择）'}`, timestamp: new Date() }
    ]);

    setIsSending(true);
    try {
      const resp = await sendToBackend({ content: '需要修改', modify_num: nums });
      const data = resp?.data ?? resp;
      const aiText = normalizeAiContent(data?.response ?? data?.message ?? data?.content ?? '');
      const nextSessionData = data?.session_data ?? data?.sessionData ?? null;
      if (nextSessionData) setSessionData(nextSessionData);
      setMessages(prev => [...prev, { id: Date.now() + 1, type: 'ai', content: aiText || '已提交修改请求。', timestamp: new Date() }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now() + 2, type: 'ai', content: `提交失败：${e?.message || '未知错误'}`, timestamp: new Date() }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleMicrophoneClick = async () => {
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
          console.log('录音完成，音频大小:', blob.size);
          // 这里可以处理录音文件，比如转换为文本
          // 暂时显示一个提示
          alert('录音完成！音频已保存。');
          stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        alert('无法访问麦克风，请检查权限设置');
      }
    }
  };

  const handlePickImages = () => {
    imageInputRef.current?.click();
  };

  const handleImagesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const attachments = files.map((file) => ({
      type: 'image',
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file)
    }));

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: 'user',
        content: files.length === 1 ? `上传图片：${files[0].name}` : `上传图片：${files.length}张`,
        attachments,
        timestamp: new Date()
      }
    ]);

    // 清空 input，允许重复选择同一张图
    e.target.value = '';
  };

  const handleShare = () => {
    const currentUrl = window.location.href;
    const sessionId = sessionData?.session_id || sessionData?.sessionId || sessionData?.id || '';
    const exportText = sessionId
      ? `session_id: ${sessionId}\nurl: ${currentUrl}`
      : `url: ${currentUrl}\n（暂无 session_id，先发送一条消息让后端返回 session_data）`;

    navigator.clipboard.writeText(exportText).then(() => {
      alert(sessionId ? `已复制对话ID：${sessionId}` : '已复制链接（暂无对话ID）');
    }).catch(() => {
      prompt('请复制以下内容:', exportText);
    });
  };

  const executionLogs = useMemo(() => {
    const logs =
      sessionData?.now_task?.logs ||
      sessionData?.logs ||
      sessionData?.now_task?.timeline ||
      null;

    if (Array.isArray(logs) && logs.length > 0) {
      return logs.map((l, idx) => {
        const message = l?.message ?? l?.log ?? l?.text ?? l?.content ?? normalizeAiContent(l);
        const level = l?.level ?? l?.status ?? 'info';
        const time = l?.time ?? l?.timestamp ?? null;
        return { id: idx, time, level, message };
      });
    }

    // 默认展示（更像“实时执行”）
    return [
      { id: 1, level: 'info', message: '正在初始化沙盒环境...' },
      { id: 2, level: 'info', message: '注入场景资源: [rain_texture_v2]' },
      { id: 3, level: 'info', message: '编译着色器...' },
      { id: 4, level: 'success', message: '成功：场景 \"新东京\" 已渲染。' }
    ];
  }, [sessionData]);

  const systemMetrics = useMemo(() => {
    const m = sessionData?.now_task?.metrics || sessionData?.metrics || null;
    return {
      vram: m?.vram || m?.gpu_memory || '4.2 GB',
      frameTime: m?.frameTime || m?.frame_time || '12.4ms',
      fps: m?.fps || '24fps',
      latency: m?.latency || '1.2ms'
    };
  }, [sessionData]);

  return (
    <div className="interaction-container">
      {/* 左侧主要交互区 */}
      <div className={`interaction-main ${showPreview ? 'with-preview' : ''}`}>
        {/* Header */}
        <header className="interaction-header">
          <div className="header-left">
            <h1 className="header-title">交互编排 · {workflowLabel}</h1>
            <span className="status-badge">
              {isSending ? (
                <img src={logoCircle} alt="loading" className="spin-logo" />
              ) : (
                <span className="status-dot"></span>
              )}
              {t('interaction.statusRunning')}
            </span>
          </div>
          <div className="header-actions">
            <button 
              className="header-button" 
              title="分享：导出当前对话ID(session_id)"
              onClick={handleShare}
            >
              <Share size={18} />
            </button>
            <button 
              onClick={() => setShowPreview(!showPreview)}
              className={`header-button ${showPreview ? 'active' : ''}`}
              title="预览面板"
            >
              <Sidebar size={18} />
            </button>
          </div>
        </header>

        {/* 聊天内容流 */}
        <div ref={scrollRef} className="chat-content">
          {messages.length === 0 ? (
            <>
              {/* 默认示例消息 */}
              <div className="message-user">
                <div className="message-avatar message-avatar-user">
                  <img 
                    src={userAvatarUrl} 
                    alt={userInfo?.username || 'User'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const parent = e.target.parentElement;
                      if (parent && !parent.querySelector('.message-avatar-text')) {
                        const fallback = document.createElement('span');
                        fallback.className = 'message-avatar-text';
                        fallback.textContent = (userInfo?.username || 'User').charAt(0).toUpperCase();
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>
                <div className="message-bubble">
                  生成一个高端的电影级雨天街道预览。
                </div>
              </div>

              {/* AI 响应卡片 */}
              <div className="message-ai">
                <div className="message-avatar message-avatar-ai">
                  <img src={logoCircle} alt="AI" className="ai-avatar-image" />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="ai-planning">
                    <div className="planning-header">
                      <Brain style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} size={14} />
                      编排器规划
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className="planning-item">
                        <Check weight="bold" className="planning-check" size={14} />
                        <span>脚本模拟已准备执行。</span>
                      </div>
                    </div>
                  </div>

                  {/* 脚本卡片 */}
                  <div className="code-card">
                    <div className="code-header">
                      <span className="code-filename">scene_runner.sh</span>
                      <div className="code-actions">
                        <button 
                          onClick={() => setShowPreview(!showPreview)}
                          className="code-action-button"
                        >
                          <Play size={12} weight="fill" /> 运行预览
                        </button>
                        <button className="code-action-button secondary">
                          <Copy size={12}/> 复制
                        </button>
                      </div>
                    </div>
                    <div className="code-body">
                      <div className="code-line">
                        <span className="code-line-number">01</span>
                        <span># 初始化赛博朋克环境</span>
                      </div>
                      <div className="code-line">
                        <span className="code-line-number">02</span>
                        <span>render --scene "neon_city" --weather "heavy_rain"</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            messages.map((msg) => (
              msg.type === 'user' ? (
                <div key={msg.id} className="message-user">
                  <div className="message-avatar message-avatar-user">
                    <img 
                      src={userAvatarUrl} 
                      alt={userInfo?.username || 'User'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const parent = e.target.parentElement;
                        if (parent && !parent.querySelector('.message-avatar-text')) {
                          const fallback = document.createElement('span');
                          fallback.className = 'message-avatar-text';
                          fallback.textContent = (userInfo?.username || 'User').charAt(0).toUpperCase();
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  </div>
                  <div className="message-bubble">
                    {msg.content}
                    {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                      <div className="message-attachments">
                        {msg.attachments
                          .filter(a => a.type === 'image')
                          .map((a, idx) => (
                            <img
                              key={idx}
                              className="message-attachment-image"
                              src={a.url}
                              alt={a.name || `image-${idx}`}
                            />
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="message-ai">
                  <div className="message-avatar message-avatar-ai">
                    <img src={logoCircle} alt="AI" className="ai-avatar-image" />
                  </div>
                  <div className="message-bubble">
                    {msg.content}
                  </div>
                </div>
              )
            ))
          )}
        </div>

        {/* 底部输入框 */}
        <div className="input-section">
          <div className="input-container-simple">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleImagesSelected}
            />
            <button
              className="input-add-button-simple"
              onClick={handlePickImages}
              title={t('interaction.uploadImage')}
              aria-label={t('interaction.uploadImage')}
            >
              <Paperclip size={20} />
            </button>
            <input 
              type="text"
              className="input-simple"
              placeholder="有问题，尽管问"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              className="input-confirm-button"
              onClick={handleConfirm}
              disabled={isSending}
              title={t('interaction.confirmTitle')}
            >
              {t('interaction.confirm')}
            </button>
            <button 
              className="input-send-button-simple"
              onClick={inputValue.trim() ? handleSend : handleMicrophoneClick}
              disabled={!inputValue.trim() && !isRecording}
              style={isRecording ? { color: 'rgb(239, 68, 68)' } : {}}
              title={isRecording ? '停止录音' : inputValue.trim() ? '发送' : '开始录音'}
            >
              {inputValue.trim() ? (
                <ArrowUp weight="bold" size={20} />
              ) : (
                <Microphone size={20} weight={isRecording ? 'fill' : 'regular'} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 右侧实时预览面板 */}
      <aside className={`preview-panel ${showPreview ? '' : 'hidden'}`}>
        <div className="preview-header">
          <div className="preview-header-left">
            <TerminalWindow size={18} className="preview-header-icon" weight="fill" />
            <span className="preview-header-title">{t('interaction.rightTitle')}</span>
          </div>
          <div className="preview-tabs">
            <button
              className={`preview-tab ${rightPanelTab === 'execution' ? 'active' : ''}`}
              onClick={() => setRightPanelTab('execution')}
              type="button"
            >
              实时执行
            </button>
            <button
              className={`preview-tab ${rightPanelTab === 'assets' ? 'active' : ''}`}
              onClick={() => setRightPanelTab('assets')}
              type="button"
            >
              任务/素材
            </button>
          </div>
          <button 
            onClick={() => setShowPreview(false)} 
            className="preview-close-button"
          >
            <X size={18} weight="bold" />
          </button>
        </div>
        
        <div className="preview-content">
          {rightPanelTab === 'execution' ? (
            <>
              <div className="exec-card">
                <div className="exec-card-title">实时执行</div>
                <div className="exec-log-list">
                  {executionLogs.map((log) => (
                    <div key={log.id} className={`exec-log-item ${String(log.level).toLowerCase()}`}>
                      <span className="exec-log-dot" />
                      <div className="exec-log-main">
                        <div className="exec-log-text">{log.message}</div>
                        {log.time && <div className="exec-log-time">{String(log.time)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="exec-card">
                <div className="exec-card-title">活动模拟</div>
                <div className="exec-quote">
                  “雨滴在霓虹灯闪烁中闪闪发光，24fps。湿路面上的反射实时更新。”
                </div>
              </div>

              <div className="exec-card">
                <div className="exec-card-title">系统指标</div>
                <div className="exec-metrics-grid">
                  <div className="exec-metric-card">
                    <div className="exec-metric-label">显存使用</div>
                    <div className="exec-metric-value">{systemMetrics.vram}</div>
                  </div>
                  <div className="exec-metric-card">
                    <div className="exec-metric-label">帧时间</div>
                    <div className="exec-metric-value">{systemMetrics.frameTime}</div>
                  </div>
                  <div className="exec-metric-card">
                    <div className="exec-metric-label">FPS</div>
                    <div className="exec-metric-value">{systemMetrics.fps}</div>
                  </div>
                  <div className="exec-metric-card">
                    <div className="exec-metric-label">延迟</div>
                    <div className="exec-metric-value">{systemMetrics.latency}</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="preview-metrics">
                <p className="preview-metrics-title">{t('interaction.progressTitle')}</p>
                {sessionData?.now_task ? (
                  <>
                    <div className="preview-metric">
                      <span>任务</span>
                      <span>{sessionData.now_task?.name || sessionData.now_task?.title || sessionData.now_task?.task_type || '进行中'}</span>
                    </div>
                    <div className="preview-metric">
                      <span>阶段</span>
                      <span>{sessionData.now_task?.step || sessionData.now_task?.stage || sessionData.now_task?.status || sessionData?.now_state || '-'}</span>
                    </div>
                    <div className="preview-metric">
                      <span>进度</span>
                      <span>{typeof sessionData.now_task?.progress === 'number' ? `${sessionData.now_task.progress}%` : (sessionData.now_task?.progress || '-')}</span>
                    </div>
                  </>
                ) : (
                  <p className="preview-line">{'>'} {t('interaction.noProgress')}</p>
                )}
              </div>
              
              <div className="preview-simulation">
                <div className="preview-simulation-bg">
                  <Lightning size={40} weight="fill" />
                </div>
                <div className="preview-simulation-header">
                  <Lightning weight="fill" style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} size={16} /> {t('interaction.materialsTitle')}
                </div>
                {Array.isArray(sessionData?.material) && sessionData.material.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {sessionData.material.map((m, idx) => (
                      <div key={idx} className="preview-metric" style={{ alignItems: 'flex-start' }}>
                        <span style={{ minWidth: 24 }}>{idx + 1}</span>
                        <span style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>{normalizeAiContent(m)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="preview-simulation-text">
                    {t('interaction.noMaterials')}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </aside>

      {isModifyDialogOpen && (
        <div
          className="modify-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modify-dialog-title"
          aria-describedby="modify-dialog-desc"
        >
          <div className="modify-modal">
            <h2 id="modify-dialog-title" className="modify-title">{t('interaction.modifyTitle')}</h2>
            <p id="modify-dialog-desc" className="modify-desc">{t('interaction.modifyDesc')}</p>

            <div className="modify-actions">
              <button
                type="button"
                className="modify-secondary"
                onClick={() => submitModifyDecision({ needModify: false })}
                disabled={isSending}
                aria-label={t('interaction.noNeedModify')}
              >
                {t('interaction.noNeedModify')}
              </button>
              <button
                type="button"
                className="modify-primary"
                onClick={() => submitModifyDecision({ needModify: true })}
                disabled={isSending}
                aria-label={t('interaction.needModify')}
              >
                {t('interaction.needModify')}
              </button>
            </div>

            <div className="modify-picker">
              <div className="modify-picker-title">{t('interaction.modifyPickTitle')}</div>
              {Array.isArray(sessionData?.material) && sessionData.material.length > 0 ? (
                <div className="modify-checklist">
                  {sessionData.material.map((m, idx) => {
                    const num = idx + 1;
                    const checked = modifyNums.includes(num);
                    return (
                      <label key={idx} className="modify-checkitem">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setModifyNums(prev => {
                              if (e.target.checked) return Array.from(new Set([...prev, num]));
                              return prev.filter(x => x !== num);
                            });
                          }}
                        />
                        <span className="modify-checkitem-num">{num}</span>
                        <span className="modify-checkitem-text">{normalizeAiContent(m)}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <input
                  className="modify-input"
                  placeholder={t('interaction.modifyPlaceholder')}
                  value={modifyNums.join(',')}
                  onChange={(e) => {
                    const nums = e.target.value
                      .split(',')
                      .map(s => s.trim())
                      .filter(Boolean)
                      .map(s => Number(s))
                      .filter(n => Number.isFinite(n) && n > 0);
                    setModifyNums(Array.from(new Set(nums)));
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Interaction;