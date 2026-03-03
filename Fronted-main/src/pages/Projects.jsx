import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Plus, MagnifyingGlass, Faders, DotsThree, Clock, Users, CheckCircle, Circle, XCircle, X, FilmStrip, Image } from '@phosphor-icons/react';
import './Projects.css';
import { projectAPI } from '../services/api';
import { useApp } from '../contexts/AppContext';

const Projects = () => {
  const navigate = useNavigate();
  const { userId } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus] = useState('全部');
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState('text2video');

  // 从后端加载项目列表
  useEffect(() => {
    loadProjects();
  }, [userId]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const response = await projectAPI.getProjects();
      if (response.success && Array.isArray(response.projects)) {
        // 转换后端数据格式为前端需要的格式
        const formattedProjects = response.projects.map((project, index) => {
          // 根据now_task确定状态和进度
          const nowTask = project.now_task || 'imagination';
          let status = '进行中';
          let progress = 0;
          
          if (nowTask === 'imagination') {
            progress = 25;
          } else if (nowTask === 'outline') {
            progress = 50;
          } else if (nowTask === 'screen') {
            progress = 75;
          } else if (nowTask === 'video') {
            progress = 100;
            status = '已完成';
          }

          return {
            id: index + 1,
            name: project.project_name,
            description: `${project.workflow_type === 'text2video' ? '文本到视频' : '图片到视频'}工作流`,
            status: status,
            progress: progress,
            members: 1,
            updated: '刚刚',
            color: status === '已完成' ? 'rgb(16, 185, 129)' : 'rgb(37, 99, 235)',
            bgColor: status === '已完成' ? 'rgb(209, 250, 229)' : 'rgb(239, 246, 255)',
            workflow_type: project.workflow_type,
            now_task: project.now_task,
          };
        });
        setProjects(formattedProjects);
      }
    } catch (error) {
      console.error('加载项目列表失败:', error);
      // 保持空数组，显示无项目状态
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = () => {
    setProjectName('');
    setSelectedWorkflow('text2video');
    setShowCreateDialog(true);
  };

  const handleCloseDialog = () => {
    if (!isCreating) {
      setShowCreateDialog(false);
      setProjectName('');
      setSelectedWorkflow('text2video');
    }
  };

  const handleConfirmCreate = async () => {
    const trimmedName = projectName.trim();
    if (!trimmedName) {
      alert('请输入项目名称');
      return;
    }

    try {
      setIsCreating(true);
      const response = await projectAPI.createProject(
        trimmedName,
        selectedWorkflow
      );

      if (response.success) {
        // 重新加载项目列表
        await loadProjects();
        // 关闭对话框
        setShowCreateDialog(false);
        setProjectName('');
        // 导航到交互页面，根据工作流类型设置workflow参数
        const workflowParam = selectedWorkflow === 'image2video' ? 'image_to_video' : 'text_to_video_fast';
        navigate('/interaction', { 
          state: { 
            projectName: response.project_name,
            workflow: workflowParam,
            workflowType: selectedWorkflow
          } 
        });
      }
    } catch (error) {
      console.error('创建项目失败:', error);
      alert(`创建项目失败: ${error.message || '未知错误'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const mockProjects = [
    { 
      id: 1, 
      name: '霓虹东京开场视频', 
      description: '赛博朋克风格的3D动画开场', 
      status: '进行中', 
      progress: 65,
      members: 3,
      updated: '2小时前',
      color: 'rgb(37, 99, 235)',
      bgColor: 'rgb(239, 246, 255)'
    },
    { 
      id: 2, 
      name: '企业官网重构', 
      description: '响应式网站设计与开发', 
      status: '已完成', 
      progress: 100,
      members: 5,
      updated: '1天前',
      color: 'rgb(16, 185, 129)',
      bgColor: 'rgb(209, 250, 229)'
    },
    { 
      id: 3, 
      name: '数据分析仪表盘', 
      description: '实时数据可视化平台', 
      status: '规划中', 
      progress: 20,
      members: 2,
      updated: '3天前',
      color: 'rgb(249, 115, 22)',
      bgColor: 'rgb(255, 237, 213)'
    },
    { 
      id: 4, 
      name: '移动应用UI设计', 
      description: 'iOS和Android原生应用界面', 
      status: '进行中', 
      progress: 45,
      members: 4,
      updated: '5小时前',
      color: 'rgb(147, 51, 234)',
      bgColor: 'rgb(243, 232, 255)'
    },
    { 
      id: 5, 
      name: '品牌标识设计', 
      description: '完整的品牌视觉识别系统', 
      status: '已完成', 
      progress: 100,
      members: 2,
      updated: '1周前',
      color: 'rgb(16, 185, 129)',
      bgColor: 'rgb(209, 250, 229)'
    },
    { 
      id: 6, 
      name: 'API文档生成', 
      description: '自动化API文档和测试', 
      status: '已暂停', 
      progress: 30,
      members: 1,
      updated: '2周前',
      color: 'rgb(107, 114, 128)',
      bgColor: 'rgb(229, 231, 235)'
    },
  ];

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === '全部' || project.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status) => {
    switch(status) {
      case '已完成':
        return <CheckCircle weight="fill" size={16} />;
      case '进行中':
        return <Circle weight="fill" size={16} />;
      case '已暂停':
        return <XCircle weight="fill" size={16} />;
      default:
        return <Clock weight="fill" size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case '已完成':
        return { color: 'rgb(16, 185, 129)', bg: 'rgb(209, 250, 229)' };
      case '进行中':
        return { color: 'rgb(37, 99, 235)', bg: 'rgb(239, 246, 255)' };
      case '已暂停':
        return { color: 'rgb(107, 114, 128)', bg: 'rgb(229, 231, 235)' };
      default:
        return { color: 'rgb(249, 115, 22)', bg: 'rgb(255, 237, 213)' };
    }
  };

  return (
    <div className="projects-container">
      <header className="projects-header">
        <div className="projects-header-left">
          <h1 className="projects-title">
            <FolderOpen weight="bold" className="projects-title-icon" size={28} /> 项目
          </h1>
          <p className="projects-subtitle">管理和跟踪您的所有项目</p>
        </div>
        <button 
          className="projects-create-button"
          onClick={handleCreateProject}
          disabled={isCreating}
        >
          <Plus size={18} weight="bold" /> {isCreating ? '创建中...' : '新建项目'}
        </button>
      </header>

      <div className="projects-toolbar">
        <div className="projects-search">
          <MagnifyingGlass size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgb(148, 163, 184)' }} />
          <input
            type="text"
            placeholder="搜索项目..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="projects-search-input"
          />
        </div>
        <button 
          className="projects-filter-button"
          onClick={() => console.log('打开筛选')}
        >
          <Faders size={16} /> 筛选
        </button>
      </div>

      <div className="projects-grid">
        {isLoading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'rgb(100, 116, 139)' }}>
            加载中...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'rgb(100, 116, 139)' }}>
            {searchQuery ? '没有找到匹配的项目' : '还没有项目，点击"新建项目"开始创建'}
          </div>
        ) : (
          filteredProjects.map((project) => {
          const statusStyle = getStatusColor(project.status);
          return (
            <div 
              key={project.id} 
              className="project-card"
              onClick={() => navigate(`/project/${project.id}`, { state: { project: project } })}
              style={{ cursor: 'pointer' }}
            >
              <div className="project-card-header">
                <div className="project-icon" style={{ background: project.bgColor, color: project.color }}>
                  <FolderOpen weight="fill" size={24} />
                </div>
                <button 
                  className="project-actions"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log(`打开项目菜单: ${project.name}`);
                  }}
                >
                  <DotsThree weight="bold" size={20} />
                </button>
              </div>
              <div className="project-content">
                <h3 className="project-name">{project.name}</h3>
                <p className="project-description">{project.description}</p>
                <div className="project-progress">
                  <div className="project-progress-header">
                    <span className="project-progress-label">进度</span>
                    <span className="project-progress-value">{project.progress}%</span>
                  </div>
                  <div className="project-progress-bar">
                    <div 
                      className="project-progress-fill"
                      style={{ width: `${project.progress}%`, background: project.color }}
                    ></div>
                  </div>
                </div>
                <div className="project-footer">
                  <div className="project-meta">
                    <div className="project-meta-item" style={{ color: statusStyle.color }}>
                      {getStatusIcon(project.status)}
                      <span>{project.status}</span>
                    </div>
                    <div className="project-meta-item">
                      <Users size={14} />
                      <span>{project.members}人</span>
                    </div>
                    <div className="project-meta-item">
                      <Clock size={14} />
                      <span>{project.updated}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }))}
      </div>

      {/* 创建项目对话框 */}
      {showCreateDialog && (
        <div className="create-dialog-overlay" onClick={handleCloseDialog}>
          <div className="create-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="create-dialog-header">
              <h2 className="create-dialog-title">创建新项目</h2>
              <button 
                className="create-dialog-close"
                onClick={handleCloseDialog}
                disabled={isCreating}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="create-dialog-content">
              <div className="create-dialog-field">
                <label className="create-dialog-label">项目名称</label>
                <input
                  type="text"
                  className="create-dialog-input"
                  placeholder="请输入项目名称"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={isCreating}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isCreating) {
                      handleConfirmCreate();
                    }
                  }}
                />
              </div>

              <div className="create-dialog-field">
                <label className="create-dialog-label">工作流类型</label>
                <div className="workflow-options">
                  <div 
                    className={`workflow-option ${selectedWorkflow === 'text2video' ? 'selected' : ''}`}
                    onClick={() => !isCreating && setSelectedWorkflow('text2video')}
                  >
                    <div className="workflow-option-icon" style={{ background: 'rgb(239, 246, 255)', color: 'rgb(37, 99, 235)' }}>
                      <FilmStrip size={24} weight="fill" />
                    </div>
                    <div className="workflow-option-content">
                      <div className="workflow-option-title">文本到视频</div>
                      <div className="workflow-option-desc">通过文本描述生成视频</div>
                    </div>
                    {selectedWorkflow === 'text2video' && (
                      <CheckCircle size={20} weight="fill" className="workflow-option-check" />
                    )}
                  </div>

                  <div 
                    className={`workflow-option ${selectedWorkflow === 'image2video' ? 'selected' : ''}`}
                    onClick={() => !isCreating && setSelectedWorkflow('image2video')}
                  >
                    <div className="workflow-option-icon" style={{ background: 'rgb(255, 237, 213)', color: 'rgb(249, 115, 22)' }}>
                      <Image size={24} weight="fill" />
                    </div>
                    <div className="workflow-option-content">
                      <div className="workflow-option-title">图片到视频</div>
                      <div className="workflow-option-desc">将图片转换为动态视频</div>
                    </div>
                    {selectedWorkflow === 'image2video' && (
                      <CheckCircle size={20} weight="fill" className="workflow-option-check" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="create-dialog-footer">
              <button 
                className="create-dialog-cancel"
                onClick={handleCloseDialog}
                disabled={isCreating}
              >
                取消
              </button>
              <button 
                className="create-dialog-confirm"
                onClick={handleConfirmCreate}
                disabled={isCreating || !projectName.trim()}
              >
                {isCreating ? '创建中...' : '创建项目'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
