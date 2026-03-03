import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { 
  Brain, Check, Play, Plus, ArrowUp, 
  Share, Sidebar, Copy, Aperture, Lightning,
  TerminalWindow, X, Paperclip, Microphone, FolderPlus
} from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import logoCircle from '../assets/logo_circle.png';
import './Interaction.css';
import { useApp } from '../contexts/AppContext';
import { workflowAPI, API_BASE_URL } from '../services/api';

const Interaction = () => {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
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
  const [endSession, setEndSession] = useState(false);
  const { t, userId } = useApp();
  const [rightPanelTab, setRightPanelTab] = useState('execution');
  // 跟踪每个视频的加载状态
  const [videoStates, setVideoStates] = useState({});
  
  // 项目名称：从路由参数、location state或localStorage获取
  const [projectName, setProjectName] = useState(() => {
    return params.projectName || 
           location.state?.projectName || 
           localStorage.getItem('current-project-name') || 
           '默认项目';
  });

  // 跟踪上一个项目名称，用于检测项目变化
  const prevProjectNameRef = useRef(projectName);

  const workflow = useMemo(() => location.state?.workflow || 'text_to_video_fast', [location.state]);
  const workflowType = useMemo(() => location.state?.workflowType || 'text2video', [location.state]);
  const workflowLabel = useMemo(() => {
    if (workflowType === 'image2video' || workflow === 'image_to_video') {
      return '图片到视频';
    }
    if (workflow === 'storyboard_precise') return t('dashboard.workflowStoryboardTitle');
    return t('dashboard.workflowFastTitle');
  }, [workflow, workflowType, t]);

  // 保存项目名称到localStorage
  useEffect(() => {
    if (projectName) {
      localStorage.setItem('current-project-name', projectName);
    }
  }, [projectName]);

  // 检测项目名称变化，如果项目名称改变，清空会话数据
  useEffect(() => {
    const currentProjectName = params.projectName || 
                               location.state?.projectName || 
                               localStorage.getItem('current-project-name') || 
                               '默认项目';
    
    // 如果项目名称发生变化，清空所有会话状态
    if (prevProjectNameRef.current !== currentProjectName && prevProjectNameRef.current !== '默认项目') {
      console.log(`项目名称变化：${prevProjectNameRef.current} -> ${currentProjectName}，清空会话数据`);
      setMessages([]);
      setSessionData(null);
      setInputValue('');
      setIsSending(false);
      setIsModifyDialogOpen(false);
      setModifyNums([]);
      setVideoStates({});
      setEndSession(false);
    }
    
    setProjectName(currentProjectName);
    prevProjectNameRef.current = currentProjectName;
  }, [params.projectName, location.state?.projectName]);

  // 页面加载时，如果是从Dashboard创建的新项目，清空旧的会话数据并确保使用新的项目名称
  useEffect(() => {
    // 检查是否是从Dashboard创建的新项目
    if (location.state?.isNewProject || location.state?.clearPreviousProject) {
      console.log('检测到新项目创建，清空旧的会话数据');
      
      // 如果传递了新的项目名称，使用新的项目名称
      if (location.state?.projectName) {
        console.log(`使用新项目名称: ${location.state.projectName}`);
        setProjectName(location.state.projectName);
        localStorage.setItem('current-project-name', location.state.projectName);
        prevProjectNameRef.current = location.state.projectName;
      } else {
        // 如果没有传递项目名称，生成一个新的项目名称
        const newProjectName = `新项目_${Date.now()}`;
        console.log(`生成新项目名称: ${newProjectName}`);
        setProjectName(newProjectName);
        localStorage.setItem('current-project-name', newProjectName);
        prevProjectNameRef.current = newProjectName;
      }
      
      // 清空所有会话状态
      setMessages([]);
      setSessionData(null);
      setInputValue('');
      setIsSending(false);
      setIsModifyDialogOpen(false);
      setModifyNums([]);
      setVideoStates({});
      setEndSession(false);
      
      // 清除location state，避免刷新时重复清空
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    // 处理后端的修改确认状态
    const isModifyState = sessionData?.now_state === 'modify_confirm' || sessionData?.now_state === 'modify_comfirm';
    const isText2Video = workflowType === 'text2video';
    const isModifyStage = !isText2Video || sessionData?.now_task === 'screen';
    const shouldOpen = isModifyState && isModifyStage && !endSession && sessionData?.chat_with_assistant !== false;
    setIsModifyDialogOpen(shouldOpen);
  }, [sessionData?.now_state, sessionData?.now_task, sessionData?.chat_with_assistant, endSession, workflowType]);

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
      // 移除无效的链接（example.com、ai-video-generator、yfdnza.com等）
      let cleaned = value;
      // 移除方括号中的无效链接，格式：[链接]（说明文字）或 [链接]
      cleaned = cleaned.replace(/\[https?:\/\/[^\s]*(?:example\.com|ai-video-generator[^\s]*\.com|yfdnza\.com)[^\s]*\]\([^)]*\)/gi, '');
      cleaned = cleaned.replace(/\[https?:\/\/[^\s]*(?:example\.com|ai-video-generator[^\s]*\.com|yfdnza\.com)[^\s]*\]/gi, '');
      // 移除单独的无效链接
      cleaned = cleaned.replace(/https?:\/\/[^\s]*(?:example\.com|ai-video-generator[^\s]*\.com|yfdnza\.com)[^\s]*/gi, '');
      return cleaned;
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  // 处理创建新项目
  const handleCreateNewProject = () => {
    if (window.confirm('确定要开启新项目吗？当前项目的进度将被保存，但会跳转到新项目创建页面。')) {
      // 清除当前项目信息
      const oldProjectName = projectName;
      localStorage.removeItem('current-project-name');
      // 清空当前会话状态
      setMessages([]);
      setSessionData(null);
      setInputValue('');
      setIsSending(false);
      setIsModifyDialogOpen(false);
      setModifyNums([]);
      setVideoStates({});
      // 重置项目名称引用
      prevProjectNameRef.current = '';
      // 生成新的项目名称（带时间戳，确保唯一）
      const newProjectName = `新项目_${Date.now()}`;
      // 跳转到 Dashboard 页面创建新项目，并传递新项目名称
      navigate('/dashboard', { 
        state: { 
          clearPreviousProject: true,
          previousProjectName: oldProjectName,
          newProjectName: newProjectName,
          forceNewProject: true  // 强制创建新项目标志
        } 
      });
    }
  };

  // 清空当前会话，重新开始
  const handleClearSession = () => {
    if (window.confirm('确定要清空当前会话并重新开始吗？这将清除所有消息和进度。')) {
      // 清空所有状态
      setMessages([]);
      setSessionData(null);
      setInputValue('');
      setIsSending(false);
      setIsModifyDialogOpen(false);
      setModifyNums([]);
      setVideoStates({});
      setEndSession(false);
      // 清空项目名称，让用户重新开始
      localStorage.removeItem('current-project-name');
      setProjectName('默认项目');
    }
  };

  const sendToBackend = async (payload) => {
    const { content, modify_num = [] } = payload;
    
    try {
      const response = await workflowAPI.processWork(projectName, content, 'production', null, modify_num);

      // 更新项目名称（如果后端返回了新的项目名称）
      if (response.project_name && response.project_name !== projectName) {
        setProjectName(response.project_name);
      }

      // 更新session_id（如果返回了）
      if (response.session_id && sessionData?.session_id !== response.session_id) {
        setSessionData(prev => ({
          ...prev,
          session_id: response.session_id,
        }));
      }

      return response;
    } catch (error) {
      throw error;
    }
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
    
    // 添加超时提示
    let timeoutHint = null;
    timeoutHint = setTimeout(() => {
      setMessages(prev => {
        // 检查是否已经有超时提示
        const hasTimeoutHint = prev.some(msg => 
          msg.type === 'ai' && msg.content.includes('处理时间较长')
        );
        if (!hasTimeoutHint) {
          return [...prev, {
            id: Date.now() + 0.5,
            type: 'ai',
            content: '⏳ 后端正在处理中，这可能需要几分钟时间，请耐心等待...（如果超过10分钟仍无响应，请检查后端日志）',
            timestamp: new Date()
          }];
        }
        return prev;
      });
    }, 30000); // 30秒后显示提示
    
    try {
      const resp = await sendToBackend({ content });
      if (timeoutHint) clearTimeout(timeoutHint);
      
      // 调试日志
      console.log('📥 收到后端响应:', resp);
      console.log('📥 响应详情:', {
        success: resp?.success,
        message: resp?.message,
        messageType: typeof resp?.message,
        messageLength: resp?.message?.length,
        hasReply: !!resp?.reply,
        replyText: resp?.reply?.text,
        sessionData: resp?.session_data,
        nowTask: resp?.session_data?.now_task,
        nowState: resp?.session_data?.now_state
      });
      
      // 后端响应格式：{ success, message, session_data, ... }
      const nextSessionData = resp?.session_data || null;
      
      // 检查是否有错误
      if (resp?.success === false) {
        const errorMsg = resp?.error?.message || resp?.error?.detail || '后端处理出错';
        console.error('❌ 后端返回错误:', resp.error);
        console.error('❌ 完整错误响应:', JSON.stringify(resp, null, 2));
        
        // 显示详细的错误信息
        let errorContent = `❌ 后端处理出错：${errorMsg}`;
        if (resp?.error?.code) {
          errorContent += `\n错误代码: ${resp.error.code}`;
        }
        errorContent += '\n\n建议：\n1. 检查后端终端日志\n2. 确认AI服务配置正确\n3. 尝试重新发送请求';
        
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 2,
            type: 'ai',
            content: errorContent,
            timestamp: new Date()
          }
        ]);
        setIsSending(false);
        return; // 提前返回，不继续处理
      }
      
      // 提取AI回复文本，支持多种格式
      let aiText = '';
      if (resp?.message) {
        aiText = normalizeAiContent(resp.message);
        console.log('✅ 从 message 字段提取:', aiText);
      } else if (resp?.reply?.text) {
        aiText = normalizeAiContent(resp.reply.text);
        console.log('✅ 从 reply.text 字段提取:', aiText);
      } else if (resp?.response) {
        aiText = normalizeAiContent(resp.response);
        console.log('✅ 从 response 字段提取:', aiText);
      } else {
        console.warn('⚠️ 后端响应中没有找到消息字段:', resp);
      }
      
      // 如果还是没有内容，根据当前任务状态生成友好提示
      if (!aiText || aiText.trim() === '') {
        const currentTask = nextSessionData?.now_task || sessionData?.now_task;
        if (currentTask === 'outline') {
          aiText = '正在生成大纲，请稍候...';
        } else if (currentTask === 'screen') {
          aiText = '正在生成剧本，请稍候...';
        } else if (currentTask === 'video' || currentTask === 'animator') {
          aiText = '正在生成视频，这可能需要几分钟时间，请耐心等待...';
        } else if (nextSessionData?.now_state === 'modify_confirm') {
          aiText = '请确认是否需要修改当前内容？';
        } else {
          aiText = '处理中，请稍候...';
        }
      }

      if (nextSessionData) {
        // 清理video_address数组中的None值
        if (nextSessionData.material?.video_address && Array.isArray(nextSessionData.material.video_address)) {
          nextSessionData.material.video_address = nextSessionData.material.video_address.filter(
            v => v !== null && v !== 'None' && v !== undefined && v !== ''
          );
        }
        
        console.log('📊 更新 session_data:', nextSessionData);
        console.log('📊 当前任务状态:', {
          now_task: nextSessionData?.now_task,
          now_state: nextSessionData?.now_state,
          video_generating: nextSessionData?.video_generating,
          video_count: nextSessionData?.material?.video_address?.length || 0,
          screen_count: nextSessionData?.material?.screen?.length || 0,
          outline_count: nextSessionData?.material?.outline?.length || 0,
        });
        setSessionData(prev => ({
          ...prev,
          ...nextSessionData,
          session_id: resp?.session_id || prev?.session_id,
        }));
      }
      setEndSession(Boolean(resp?.end_session));

      console.log('💬 准备添加消息，内容:', aiText);
      
      // 检查是否有新生成的视频需要显示
      let newVideos = [];
      if (nextSessionData?.material?.video_address) {
        const currentVideos = (sessionData?.material?.video_address || []).filter(v => v && v !== null && v !== 'None');
        const nextVideos = (nextSessionData.material.video_address || []).filter(v => v && v !== null && v !== 'None');
        // 找出新增的视频（过滤掉None/null值）
        newVideos = nextVideos.slice(currentVideos.length).filter(v => v && v !== null && v !== 'None');
        console.log('📹 视频检测:', {
          currentVideosCount: currentVideos.length,
          nextVideosCount: nextVideos.length,
          newVideosCount: newVideos.length,
          newVideos: newVideos
        });
      }
      
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          type: 'ai',
          content: aiText,
          videos: newVideos.length > 0 ? newVideos : undefined, // 添加视频数组
          timestamp: new Date()
        }
      ]);
      console.log('✅ 消息已添加到列表', newVideos.length > 0 ? `，包含 ${newVideos.length} 个新视频` : '');
    } catch (e) {
      if (timeoutHint) clearTimeout(timeoutHint);
      const errorMessage = e?.message || e?.data?.error?.message || '未知错误';
      
      // 如果是超时错误，提供更详细的提示
      let errorContent = `请求失败：${errorMessage}`;
      if (errorMessage.includes('超时') || errorMessage.includes('timeout')) {
        errorContent = `⏱️ ${errorMessage}\n\n建议：\n1. 检查后端服务是否正常运行\n2. 查看后端终端日志\n3. 如果后端正在处理，可以稍后刷新页面查看结果`;
      }
      
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 2,
          type: 'ai',
          content: errorContent,
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
      let aiText = normalizeAiContent(resp?.message || resp?.reply?.text || resp?.response || '');
      if (!aiText || aiText.trim() === '') {
        aiText = '已确认，正在处理...';
      }
      const nextSessionData = resp?.session_data || null;
      
      if (nextSessionData) {
        setSessionData(prev => ({
          ...prev,
          ...nextSessionData,
          session_id: resp?.session_id || prev?.session_id,
        }));
      }
      setEndSession(Boolean(resp?.end_session));
      setEndSession(Boolean(resp?.end_session));

      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, type: 'ai', content: aiText || '已确认。', timestamp: new Date() }
      ]);
    } catch (e) {
      const errorMessage = e?.message || e?.data?.error?.message || '未知错误';
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 2, type: 'ai', content: `确认失败：${errorMessage}`, timestamp: new Date() }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const submitModifyDecision = async ({ needModify }) => {
    if (isSending) return;
    setIsModifyDialogOpen(false);

    if (!needModify) {
      // 直接告知后端“不需要”
      setMessages(prev => [...prev, { id: Date.now(), type: 'user', content: '不需要', timestamp: new Date() }]);
      setIsSending(true);
      try {
        const resp = await sendToBackend({ content: '不需要', modify_num: [] });
        let aiText = normalizeAiContent(resp?.message || resp?.reply?.text || resp?.response || '');
        if (!aiText || aiText.trim() === '') {
          aiText = '已提交：不需要修改，继续下一步处理...';
        }
        const nextSessionData = resp?.session_data || null;
        
        if (nextSessionData) {
          setSessionData(prev => ({
            ...prev,
            ...nextSessionData,
            session_id: resp?.session_id || prev?.session_id,
          }));
        }
        setEndSession(Boolean(resp?.end_session));
        
        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          type: 'ai', 
          content: aiText || '已提交：不需要修改。', 
          timestamp: new Date() 
        }]);
      } catch (e) {
        const errorMessage = e?.message || e?.data?.error?.message || '未知错误';
        setMessages(prev => [...prev, { 
          id: Date.now() + 2, 
          type: 'ai', 
          content: `提交失败：${errorMessage}`, 
          timestamp: new Date() 
        }]);
      } finally {
        setIsSending(false);
      }
      return;
    }

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
      let aiText = normalizeAiContent(resp?.message || resp?.reply?.text || resp?.response || '');
      if (!aiText || aiText.trim() === '') {
        aiText = '已提交修改请求，正在处理...';
      }
      const nextSessionData = resp?.session_data || null;
      
      if (nextSessionData) {
        setSessionData(prev => ({
          ...prev,
          ...nextSessionData,
          session_id: resp?.session_id || prev?.session_id,
        }));
      }
      
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        type: 'ai', 
        content: aiText || '已提交修改请求。', 
        timestamp: new Date() 
      }]);
    } catch (e) {
      const errorMessage = e?.message || e?.data?.error?.message || '未知错误';
      setMessages(prev => [...prev, { 
        id: Date.now() + 2, 
        type: 'ai', 
        content: `提交失败：${errorMessage}`, 
        timestamp: new Date() 
      }]);
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
        console.error('无法访问麦克风:', error);
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
    }).catch((error) => {
      console.error('复制失败:', error);
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
                <img key="loading-img" src={logoCircle} alt="loading" className="spin-logo" />
              ) : (
                <span key="status-dot" className="status-dot"></span>
              )}
              {t('interaction.statusRunning')}
            </span>
          </div>
          <div className="header-actions">
            <button 
              className="header-button" 
              title="开启新项目：跳转到项目创建页面"
              onClick={handleCreateNewProject}
              style={{ 
                color: 'rgb(37, 99, 235)',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(37, 99, 235, 0.1)'
              }}
            >
              <FolderPlus size={18} weight="bold" />
              <span style={{ fontSize: '14px' }}>新项目</span>
            </button>
            <button 
              className="header-button" 
              title="清空会话：重新开始生成视频"
              onClick={handleClearSession}
              style={{ color: 'rgb(239, 68, 68)' }}
            >
              <X size={18} weight="bold" />
            </button>
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
            <React.Fragment key="default-messages">
              {/* 默认示例消息 */}
              <div className="message-user">
                <div className="message-avatar message-avatar-user">
                  <span className="message-avatar-text">张</span>
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
            </React.Fragment>
          ) : (
            messages.map((msg) => {
              if (msg.type === 'user') {
                return (
                  <div key={msg.id} className="message-user">
                    <div className="message-avatar message-avatar-user">
                      <span className="message-avatar-text">张</span>
                    </div>
                    <div className="message-bubble">
                      {msg.content}
                      {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                        <div className="message-attachments">
                          {msg.attachments
                            .filter(a => a.type === 'image')
                            .map((a, idx) => (
                              <img
                                key={`${msg.id}-attachment-${idx}`}
                                className="message-attachment-image"
                                src={a.url}
                                alt={a.name || `image-${idx}`}
                              />
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={msg.id} className="message-ai">
                    <div className="message-avatar message-avatar-ai">
                      <img src={logoCircle} alt="AI" className="ai-avatar-image" />
                    </div>
                    <div className="message-bubble">
                      {/* 从消息内容中提取视频路径并显示 */}
                      {(() => {
                        // 提取消息内容中的视频路径（支持多种格式：./user_files/.../X.mp4, /videos/.../X.mp4, 📹 视频地址: /videos/.../X.mp4）
                        const videoPathRegex = /(?:📹\s*视频地址:\s*)?((?:\/videos\/|\.\/user_files\/|user_files\/)[^\s]*\.mp4)/gi;
                        const contentVideos = [];
                        let match;
                        const contentText = msg.content || '';

                        // 从文本中提取视频路径 - 使用捕获组1提取纯粹的URL部分
                        while ((match = videoPathRegex.exec(contentText)) !== null) {
                          let videoPath = match[1]; // 提取捕获组中的URL部分

                          // 转换为前端期望的格式
                          let processedPath = videoPath;
                          if (processedPath.startsWith('./user_files/')) {
                            processedPath = processedPath.replace('./user_files', '/videos');
                          } else if (processedPath.startsWith('user_files/')) {
                            processedPath = '/' + processedPath.replace('user_files', 'videos');
                          }
                          // 清理双斜杠
                          processedPath = processedPath.replace(/\/+/g, '/');

                          // 避免重复添加
                          if (!contentVideos.includes(processedPath) &&
                              !(msg.videos && msg.videos.includes(processedPath))) {
                            contentVideos.push(processedPath);
                          }
                        }
                        
                        // 合并 msg.videos 和从内容中提取的视频，过滤掉None/null值
                        const allVideos = [
                          ...(msg.videos && Array.isArray(msg.videos) ? msg.videos.filter(v => v && v !== null && v !== 'None') : []),
                          ...contentVideos.filter(v => v && v !== null && v !== 'None')
                        ].filter((v, idx, arr) => arr.indexOf(v) === idx); // 去重
                        
                        // 如果找到了视频，从内容中移除视频路径文本，避免重复显示
                        let displayContent = contentText;
                        if (allVideos.length > 0) {
                          allVideos.forEach(videoPath => {
                            // 移除视频路径文本，保留其他内容
                            displayContent = displayContent.replace(new RegExp(videoPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
                          });
                          // 清理多余的空行
                          displayContent = displayContent.replace(/\n{3,}/g, '\n\n').trim();
                        }
                        
                        return (
                          <>
                            {displayContent && <div>{normalizeAiContent(displayContent)}</div>}
                            {/* 显示视频 */}
                            {allVideos.length > 0 && (
                        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {allVideos
                            .filter(videoUrl => videoUrl && videoUrl !== null && videoUrl !== 'None') // 再次过滤确保没有None值
                            .map((videoUrl, idx) => {
                            // 使用统一的后端URL配置
                            const backendUrl = API_BASE_URL || window.location.origin;
                            
                            // 路径转换后备逻辑：如果检测到本地路径，转换为URL
                            let processedVideoUrl = videoUrl;
                            if (typeof videoUrl === 'string') {
                              // 如果是本地路径（以./user_files/或user_files/开头），转换为/videos/URL
                              if (videoUrl.startsWith('./user_files/')) {
                                processedVideoUrl = videoUrl.replace('./user_files', '/videos');
                                console.log(`[聊天视频 ${idx + 1}] 转换本地路径: ${videoUrl} -> ${processedVideoUrl}`);
                              } else if (videoUrl.startsWith('user_files/')) {
                                processedVideoUrl = '/' + videoUrl.replace('user_files', 'videos');
                                console.log(`[聊天视频 ${idx + 1}] 转换本地路径: ${videoUrl} -> ${processedVideoUrl}`);
                              }
                              
                              // 清理双斜杠（包括路径中的双斜杠）
                              processedVideoUrl = processedVideoUrl.replace(/\/+/g, '/');
                            }
                            
                            // 检查是否是视频URL
                            const isVideoUrl = typeof processedVideoUrl === 'string' && 
                              (processedVideoUrl.startsWith('/videos/') || processedVideoUrl.startsWith('http') || processedVideoUrl.endsWith('.mp4'));
                            // 如果是相对路径，转换为完整URL
                            let fullVideoUrl = isVideoUrl && processedVideoUrl.startsWith('/') 
                              ? `${backendUrl}${processedVideoUrl}` 
                              : processedVideoUrl;
                            
                            // 验证URL有效性，避免无效链接
                            if (fullVideoUrl && (fullVideoUrl.includes('example.com') || fullVideoUrl === 'undefined' || !fullVideoUrl.trim())) {
                              console.warn(`[聊天视频 ${idx + 1}] 无效的URL: ${fullVideoUrl}`);
                              fullVideoUrl = null;
                            }
                            
                            const chatVideoKey = `chat_video_${msg.id}_${idx}_${videoUrl}`;
                            const chatVideoState = videoStates[chatVideoKey] || { loading: true, error: null };
                            
                            return isVideoUrl ? (
                              <div key={idx} style={{ marginTop: '8px' }}>
                                {chatVideoState.loading && !chatVideoState.error && (
                                  <div style={{ 
                                    padding: '20px', 
                                    textAlign: 'center', 
                                    backgroundColor: '#f1f5f9', 
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    color: 'rgb(100, 116, 139)',
                                    marginBottom: '8px'
                                  }}>
                                    正在加载视频...
                                  </div>
                                )}
                                {chatVideoState.error && (
                                  <div style={{ 
                                    padding: '20px', 
                                    textAlign: 'center', 
                                    backgroundColor: '#fee2e2', 
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    color: '#dc2626',
                                    marginBottom: '8px'
                                  }}>
                                    <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                                      视频加载失败: {chatVideoState.error}
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#991b1b', marginBottom: '8px', wordBreak: 'break-all' }}>
                                      URL: {fullVideoUrl}
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#991b1b', marginBottom: '12px', wordBreak: 'break-all' }}>
                                      原始路径: {videoUrl}
                                    </div>
                                  </div>
                                )}
                                <video 
                                  controls 
                                  style={{ 
                                    width: '100%', 
                                    maxWidth: '400px', 
                                    borderRadius: '8px',
                                    backgroundColor: '#000',
                                    display: chatVideoState.error ? 'none' : 'block'
                                  }}
                                  src={fullVideoUrl}
                                  onError={(e) => {
                                    const errorMsg = e.target?.error?.message || '未知错误';
                                    const errorCode = e.target?.error?.code;
                                            console.error(`[聊天视频 ${idx + 1}] 加载失败:`, {
                                      videoUrl: fullVideoUrl,
                                      originalPath: videoUrl,
                                      error: errorMsg,
                                      errorCode,
                                      networkState: e.target?.networkState,
                                      readyState: e.target?.readyState,
                                      backendUrl: API_BASE_URL || window.location.origin
                                    });
                                    
                                    // 提供更详细的错误信息
                                    let detailedError = '无法加载视频文件';
                                    if (errorCode === 4) {
                                      detailedError = '视频格式不支持或文件损坏';
                                    } else if (errorCode === 3) {
                                      detailedError = '视频解码失败';
                                    } else if (errorCode === 2) {
                                      detailedError = '网络错误，无法获取视频';
                                    } else if (errorCode === 1) {
                                      detailedError = '视频加载中断';
                                    }
                                    
                                    setVideoStates(prev => ({
                                      ...prev,
                                      [chatVideoKey]: { loading: false, error: detailedError }
                                    }));
                                  }}
                                  onLoadedData={() => {
                                    console.log(`[聊天视频 ${idx + 1}] 加载成功:`, fullVideoUrl);
                                    setVideoStates(prev => ({
                                      ...prev,
                                      [chatVideoKey]: { loading: false, error: null }
                                    }));
                                  }}
                                  onLoadStart={() => {
                                    setVideoStates(prev => ({
                                      ...prev,
                                      [chatVideoKey]: { loading: true, error: null }
                                    }));
                                  }}
                                >
                                  您的浏览器不支持视频播放。
                                </video>
                                {fullVideoUrl && fullVideoUrl !== 'undefined' && !fullVideoUrl.includes('example.com') && fullVideoUrl.trim() && (
                                  <a 
                                    href={fullVideoUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ 
                                      display: 'block', 
                                      marginTop: '4px', 
                                      fontSize: '12px', 
                                      color: '#3b82f6',
                                      textDecoration: 'none'
                                    }}
                                  >
                                    在新窗口打开视频
                                  </a>
                                )}
                              </div>
                            ) : null;
                          })}
                        </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                );
              }
            })
          )}
        </div>

        {/* 创建新项目提示（当项目完成时显示） */}
        {sessionData?.chat_with_assistant === false && (
          <div style={{
            padding: '16px',
            margin: '16px 0',
            backgroundColor: '#f0f9ff',
            border: '1px solid #0ea5e9',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 12px 0', color: '#0369a1', fontSize: '14px' }}>
              🎉 当前项目已完成！想要生成新项目吗？
            </p>
            <button
              onClick={handleCreateNewProject}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0ea5e9',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              <Plus size={16} weight="bold" style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              创建新项目
            </button>
          </div>
        )}

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
            <button
              className="input-add-button-simple"
              onClick={handleCreateNewProject}
              title="创建新项目"
              aria-label="创建新项目"
              style={{ marginLeft: '8px' }}
            >
              <Plus size={20} />
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
                      <span>当前任务</span>
                      <span style={{ 
                        color: sessionData.now_task === 'imagination' ? '#3b82f6' :
                               sessionData.now_task === 'outline' ? '#8b5cf6' :
                               sessionData.now_task === 'screen' ? '#ec4899' :
                               sessionData.now_task === 'video' ? '#10b981' : '#6b7280'
                      }}>
                        {sessionData.now_task === 'imagination' ? '💭 创意构思' :
                         sessionData.now_task === 'outline' ? '📝 大纲编写' :
                         sessionData.now_task === 'screen' ? '🎬 剧本编写' :
                         sessionData.now_task === 'video' ? '🎥 视频生成' :
                         sessionData.now_task}
                      </span>
                    </div>
                    <div className="preview-metric">
                      <span>状态</span>
                      <span>{sessionData.now_task?.step || sessionData.now_task?.stage || sessionData.now_task?.status || sessionData?.now_state || '处理中...'}</span>
                    </div>
                    <div className="preview-metric">
                      <span>预计时间</span>
                      <span>
                        {sessionData.now_task === 'imagination' ? '1-2分钟' :
                         sessionData.now_task === 'outline' ? '2-3分钟' :
                         sessionData.now_task === 'screen' ? '3-5分钟' :
                         sessionData.now_task === 'video' ? '5-10分钟（取决于视频长度）' :
                         '处理中...'}
                      </span>
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
                {sessionData?.material ? (
                  (() => {
                    const material = sessionData.material;
                    const hasContent = 
                      (Array.isArray(material.idea) && material.idea.length > 0) ||
                      (Array.isArray(material.outline) && material.outline.length > 0) ||
                      (Array.isArray(material.screen) && material.screen.length > 0) ||
                      (Array.isArray(material.video_address) && material.video_address.length > 0);
                    
                    if (hasContent) {
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {material.idea && Array.isArray(material.idea) && material.idea.length > 0 && (
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'rgb(100, 116, 139)' }}>创意</div>
                              {material.idea.map((item, idx) => (
                                <div key={idx} className="preview-metric" style={{ alignItems: 'flex-start' }}>
                                  <span style={{ minWidth: 24 }}>{idx + 1}</span>
                                  <span style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>{normalizeAiContent(item)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {material.outline && Array.isArray(material.outline) && material.outline.length > 0 && (
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'rgb(100, 116, 139)' }}>大纲</div>
                              {material.outline.map((item, idx) => (
                                <div key={idx} className="preview-metric" style={{ alignItems: 'flex-start' }}>
                                  <span style={{ minWidth: 24 }}>{idx + 1}</span>
                                  <span style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>{normalizeAiContent(item)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {material.screen && Array.isArray(material.screen) && material.screen.length > 0 && (
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'rgb(100, 116, 139)' }}>剧本</div>
                              {material.screen.map((item, idx) => (
                                <div key={idx} className="preview-metric" style={{ alignItems: 'flex-start' }}>
                                  <span style={{ minWidth: 24 }}>{idx + 1}</span>
                                  <span style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>{normalizeAiContent(item)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {material.video_address && Array.isArray(material.video_address) && material.video_address.length > 0 && (
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'rgb(100, 116, 139)' }}>
                                视频 {material.video_address.filter(v => v && v !== null && v !== 'None').length} 个
                                {sessionData?.material?.screen && Array.isArray(sessionData.material.screen) && (
                                  <span style={{ fontSize: '10px', color: 'rgb(148, 163, 184)', marginLeft: '8px' }}>
                                    (共 {sessionData.material.screen.length} 个剧本)
                                  </span>
                                )}
                              </div>
                              {material.video_address
                                .filter(item => item && item !== null && item !== 'None') // 过滤掉None/null值
                                .map((item, idx) => {
                                // 使用统一的后端URL配置
                                const backendUrl = API_BASE_URL || window.location.origin;
                                
                                // 路径转换后备逻辑：如果检测到本地路径，转换为URL
                                let processedItem = item;
                                if (typeof item === 'string') {
                                  // 如果是本地路径（以./user_files/或user_files/开头），转换为/videos/URL
                                  if (item.startsWith('./user_files/')) {
                                    processedItem = item.replace('./user_files', '/videos');
                                    console.log(`[视频 ${idx + 1}] 转换本地路径: ${item} -> ${processedItem}`);
                                  } else if (item.startsWith('user_files/')) {
                                    processedItem = '/' + item.replace('user_files', 'videos');
                                    console.log(`[视频 ${idx + 1}] 转换本地路径: ${item} -> ${processedItem}`);
                                  }
                                  
                                  // 清理双斜杠
                                  while (processedItem.includes('//')) {
                                    processedItem = processedItem.replace('//', '/');
                                  }
                                }
                                
                                // 检查是否是视频URL（以/videos/或http开头）
                                const isVideoUrl = typeof processedItem === 'string' && 
                                  (processedItem.startsWith('/videos/') || processedItem.startsWith('http') || processedItem.endsWith('.mp4'));
                                
                                // 如果是相对路径，转换为完整URL
                                let videoUrl = processedItem;
                                if (isVideoUrl && processedItem.startsWith('/')) {
                                  videoUrl = `${backendUrl}${processedItem}`;
                                }
                                
                                // 验证URL有效性
                                if (videoUrl && (videoUrl.includes('example.com') || videoUrl === 'undefined' || !videoUrl.trim())) {
                                  console.warn(`[视频 ${idx + 1}] 无效的URL: ${videoUrl}`);
                                  videoUrl = null;
                                }
                                
                                // 调试日志
                                console.log(`[视频 ${idx + 1}] 原始路径: ${item}, 处理后路径: ${processedItem}, 完整URL: ${videoUrl}, 是视频URL: ${isVideoUrl}`);
                                
                                // 获取当前视频的加载状态
                                const videoKey = `video_${idx}_${item}`;
                                const videoState = videoStates[videoKey] || { loading: true, error: null };
                                
                                return (
                                  <div key={idx} className="preview-metric" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '8px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgb(100, 116, 139)' }}>视频 {idx + 1}</span>
                                    {isVideoUrl ? (
                                      <div style={{ width: '100%', maxWidth: '400px' }}>
                                        {videoState.loading && !videoState.error && (
                                          <div style={{ 
                                            padding: '20px', 
                                            textAlign: 'center', 
                                            backgroundColor: '#f1f5f9', 
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            color: 'rgb(100, 116, 139)'
                                          }}>
                                            正在加载视频...
                                          </div>
                                        )}
                                        {videoState.error && (
                                          <div style={{ 
                                            padding: '20px', 
                                            textAlign: 'center', 
                                            backgroundColor: '#fee2e2', 
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            color: '#dc2626'
                                          }}>
                                            <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                                              视频加载失败: {videoState.error}
                                            </div>
                                            <div style={{ fontSize: '10px', color: '#991b1b', marginBottom: '8px', wordBreak: 'break-all' }}>
                                              URL: {videoUrl}
                                            </div>
                                            <div style={{ fontSize: '10px', color: '#991b1b', marginBottom: '12px', wordBreak: 'break-all' }}>
                                              原始路径: {item}
                                            </div>
                                            {videoUrl && videoUrl !== 'undefined' && !videoUrl.includes('example.com') && videoUrl.trim() && (
                                              <a 
                                                href={videoUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                style={{ 
                                                  marginTop: '8px',
                                                  display: 'inline-block',
                                                  fontSize: '12px', 
                                                  color: '#3b82f6',
                                                  textDecoration: 'none',
                                                  padding: '4px 8px',
                                                  border: '1px solid #3b82f6',
                                                  borderRadius: '4px'
                                                }}
                                              >
                                                尝试在新窗口打开
                                              </a>
                                            )}
                                          </div>
                                        )}
                                        <video 
                                          controls 
                                          style={{ 
                                            width: '100%', 
                                            maxWidth: '400px', 
                                            borderRadius: '8px',
                                            backgroundColor: '#000',
                                            display: videoState.error ? 'none' : 'block'
                                          }}
                                          src={videoUrl}
                                          onError={(e) => {
                                            const errorMsg = e.target?.error?.message || '未知错误';
                                            const errorCode = e.target?.error?.code;
                                            console.error(`[视频 ${idx + 1}] 加载失败:`, {
                                              videoUrl,
                                              originalPath: item,
                                              error: errorMsg,
                                              errorCode,
                                              networkState: e.target?.networkState,
                                              readyState: e.target?.readyState,
                                              backendUrl: API_BASE_URL || window.location.origin
                                            });
                                            
                                            // 提供更详细的错误信息
                                            let detailedError = '无法加载视频文件';
                                            if (errorCode === 4) {
                                              detailedError = '视频格式不支持或文件损坏';
                                            } else if (errorCode === 3) {
                                              detailedError = '视频解码失败';
                                            } else if (errorCode === 2) {
                                              detailedError = '网络错误，无法获取视频';
                                            } else if (errorCode === 1) {
                                              detailedError = '视频加载中断';
                                            }
                                            
                                            setVideoStates(prev => ({
                                              ...prev,
                                              [videoKey]: { loading: false, error: detailedError }
                                            }));
                                          }}
                                          onLoadedData={() => {
                                            console.log(`[视频 ${idx + 1}] 加载成功:`, videoUrl);
                                            setVideoStates(prev => ({
                                              ...prev,
                                              [videoKey]: { loading: false, error: null }
                                            }));
                                          }}
                                          onLoadStart={() => {
                                            setVideoStates(prev => ({
                                              ...prev,
                                              [videoKey]: { loading: true, error: null }
                                            }));
                                          }}
                                        >
                                          您的浏览器不支持视频播放。
                                        </video>
                                        {videoUrl && videoUrl !== 'undefined' && !videoUrl.includes('example.com') && videoUrl.trim() && (
                                          <a 
                                            href={videoUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ 
                                              display: 'block', 
                                              marginTop: '4px', 
                                              fontSize: '12px', 
                                              color: '#3b82f6',
                                              textDecoration: 'none'
                                            }}
                                          >
                                            在新窗口打开视频
                                          </a>
                                        )}
                                      </div>
                                    ) : (
                                      <span style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>{normalizeAiContent(item)}</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return (
                      <p className="preview-simulation-text">
                        {t('interaction.noMaterials')}
                      </p>
                    );
                  })()
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
        <div className="modify-overlay" role="dialog" aria-modal="true">
          <div className="modify-modal">
            <div className="modify-title">{t('interaction.modifyTitle')}</div>
            <div className="modify-desc">{t('interaction.modifyDesc')}</div>

            <div className="modify-actions">
              <button
                className="modify-secondary"
                onClick={() => submitModifyDecision({ needModify: false })}
                disabled={isSending}
              >
                {t('interaction.noNeedModify')}
              </button>
              <button
                className="modify-primary"
                onClick={() => submitModifyDecision({ needModify: true })}
                disabled={isSending}
              >
                {t('interaction.needModify')}
              </button>
            </div>

            <div className="modify-picker">
              <div className="modify-picker-title">{t('interaction.modifyPickTitle')}</div>
              {sessionData?.material ? (
                (() => {
                  const material = sessionData.material;
                  const currentTask = sessionData.now_task;
                  let itemsToShow = [];
                  
                  // 根据当前任务显示对应的材料
                  if (currentTask === 'outline' && material.outline && Array.isArray(material.outline)) {
                    itemsToShow = material.outline;
                  } else if (currentTask === 'screen' && material.screen && Array.isArray(material.screen)) {
                    itemsToShow = material.screen;
                  } else if (material.outline && Array.isArray(material.outline) && material.outline.length > 0) {
                    itemsToShow = material.outline;
                  } else if (material.screen && Array.isArray(material.screen) && material.screen.length > 0) {
                    itemsToShow = material.screen;
                  }
                  
                  if (itemsToShow.length > 0) {
                    return (
                      <div className="modify-checklist">
                        {itemsToShow.map((m, idx) => {
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
                    );
                  }
                  
                  return (
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
                  );
                })()
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
