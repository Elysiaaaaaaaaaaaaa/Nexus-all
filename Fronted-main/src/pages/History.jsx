import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FilmStrip, CodeBlock, ChartPolar, Translate, 
  MagnifyingGlass, Faders, Bell, Users, DotsThree, Image, FileText, MusicNote
} from '@phosphor-icons/react';
import './History.css';
import { useApp } from '../contexts/AppContext';
import { projectAPI } from '../services/api';

const History = () => {
  const navigate = useNavigate();
  const { t, userId } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus] = useState('全部');
  const [historyItems, setHistoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 从后端加载历史记录
  useEffect(() => {
    loadHistory();
  }, [userId]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const response = await projectAPI.getProjects();
      if (response.success && Array.isArray(response.projects)) {
        // 转换后端项目数据为历史记录格式
        const formattedHistory = response.projects.map((project, index) => {
          const nowTask = project.now_task || 'imagination';
          let status = '生成中';
          let icon = <FilmStrip weight="fill" />;
          let color = 'rgb(219, 234, 254)';
          let textColor = 'rgb(37, 99, 235)';
          let badgeColor = 'rgb(219, 234, 254)';
          let badgeBorder = 'rgb(191, 219, 254)';
          let badgeText = 'rgb(37, 99, 235)';

          // 根据工作流类型和任务状态设置图标和颜色
          if (project.workflow_type === 'text2video') {
            icon = <FilmStrip weight="fill" />;
          } else if (project.workflow_type === 'image2video') {
            icon = <Image weight="fill" />;
          }

          if (nowTask === 'video') {
            status = '已完成';
            badgeColor = 'rgb(209, 250, 229)';
            badgeBorder = 'rgb(167, 243, 208)';
            badgeText = 'rgb(16, 185, 129)';
          } else if (nowTask === 'imagination') {
            status = '进行中';
          }

          return {
            id: index + 1,
            title: project.project_name,
            icon: icon,
            status: status,
            time: '刚刚', // 后端没有返回时间，使用默认值
            info: project.workflow_type === 'text2video' ? '文本到视频' : '图片到视频',
            color: color,
            textColor: textColor,
            badgeColor: badgeColor,
            badgeBorder: badgeBorder,
            badgeText: badgeText,
            project_name: project.project_name,
            workflow_type: project.workflow_type,
            now_task: project.now_task,
          };
        });
        setHistoryItems(formattedHistory);
      }
    } catch (error) {
      console.error('加载历史记录失败:', error);
      setHistoryItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const mockHistoryItems = [
    { id: 1, title: '赛博朋克城市开场', icon: <FilmStrip weight="fill" />, status: '生成中', time: '2分钟前', info: '3个智能体', color: 'rgb(219, 234, 254)', textColor: 'rgb(37, 99, 235)', badgeColor: 'rgb(219, 234, 254)', badgeBorder: 'rgb(191, 219, 254)', badgeText: 'rgb(37, 99, 235)' },
    { id: 2, title: 'Python脚本重构', icon: <CodeBlock weight="fill" />, status: '已完成', time: '2小时前', info: 'Python', color: 'rgb(243, 232, 255)', textColor: 'rgb(147, 51, 234)', badgeColor: 'rgb(209, 250, 229)', badgeBorder: 'rgb(167, 243, 208)', badgeText: 'rgb(16, 185, 129)' },
    { id: 3, title: 'Q3财务报告分析', icon: <ChartPolar weight="fill" />, status: '草稿', time: '昨天 14:30', info: 'PDF', color: 'rgb(255, 237, 213)', textColor: 'rgb(249, 115, 22)', badgeColor: 'rgb(241, 245, 249)', badgeBorder: 'rgb(226, 232, 240)', badgeText: 'rgb(100, 116, 139)' },
    { id: 4, title: '合同翻译（中英）', icon: <Translate weight="fill" />, status: '已完成', time: '昨天 09:15', info: '双语', color: 'rgb(209, 250, 229)', textColor: 'rgb(16, 185, 129)', badgeColor: 'rgb(209, 250, 229)', badgeBorder: 'rgb(167, 243, 208)', badgeText: 'rgb(16, 185, 129)' },
    { id: 5, title: '品牌Logo设计', icon: <Image weight="fill" />, status: '已完成', time: '3天前', info: 'AI绘图', color: 'rgb(254, 226, 226)', textColor: 'rgb(239, 68, 68)', badgeColor: 'rgb(209, 250, 229)', badgeBorder: 'rgb(167, 243, 208)', badgeText: 'rgb(16, 185, 129)' },
    { id: 6, title: '技术文档编写', icon: <FileText weight="fill" />, status: '生成中', time: '5小时前', info: 'Markdown', color: 'rgb(229, 231, 235)', textColor: 'rgb(107, 114, 128)', badgeColor: 'rgb(219, 234, 254)', badgeBorder: 'rgb(191, 219, 254)', badgeText: 'rgb(37, 99, 235)' },
    { id: 7, title: '背景音乐生成', icon: <MusicNote weight="fill" />, status: '已完成', time: '1周前', info: '音频', color: 'rgb(243, 232, 255)', textColor: 'rgb(168, 85, 247)', badgeColor: 'rgb(209, 250, 229)', badgeBorder: 'rgb(167, 243, 208)', badgeText: 'rgb(16, 185, 129)' },
  ];

  const filteredItems = historyItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === '全部' || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="history-container">
      {/* Header */}
      <header className="history-header">
        <div className="history-header-left">
          <h1 className="history-title">{t('history.title')}</h1>
          <div className="header-divider"></div>
          <div className="search-container">
            <MagnifyingGlass className="search-icon" size={16} />
            <input 
              type="text" 
              placeholder={t('history.searchPlaceholder')} 
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="history-header-right">
          <button 
            className="filter-button"
            onClick={() => console.log('打开筛选')}
          >
            <Faders size={16} /> {t('history.filter')}
          </button>
          <button 
            className="notification-button"
            onClick={() => console.log('打开通知')}
          >
            <Bell size={18} />
          </button>
        </div>
      </header>

      {/* List Area */}
      <div className="history-content">
        <div className="history-inner">
          <h3 className="section-title">{t('history.recent')}</h3>
          <div className="history-list">
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgb(100, 116, 139)' }}>
                加载中...
              </div>
            ) : filteredItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgb(100, 116, 139)' }}>
                {searchQuery ? '没有找到匹配的历史记录' : '还没有历史记录'}
              </div>
            ) : (
              filteredItems.map((item) => (
                <div 
                  key={item.id} 
                  className="history-item"
                  onClick={() => {
                    // 导航到项目详情或交互页面
                    if (item.project_name) {
                      navigate('/interaction', { 
                        state: { 
                          projectName: item.project_name,
                          workflow: item.workflow_type === 'text2video' ? 'text_to_video_fast' : 'storyboard_precise'
                        } 
                      });
                    } else {
                      navigate(`/history/${item.id}`, { state: { historyItem: item } });
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                <div 
                  className="history-item-icon"
                  style={{ background: item.color, color: item.textColor }}
                >
                  {React.cloneElement(item.icon, { size: 20 })}
                </div>
                <div className="history-item-content">
                  <div className="history-item-header">
                    <h4 className="history-item-title">{item.title}</h4>
                    <span 
                      className="history-item-badge"
                      style={{ 
                        background: item.badgeColor, 
                        borderColor: item.badgeBorder, 
                        color: item.badgeText 
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="history-item-time">活动检测于 {item.time}</p>
                </div>
                <div className="history-item-meta">
                  <div className="history-item-meta-item">
                    <Users size={14} /> <span>{item.info}</span>
                  </div>
                  <span className="history-item-time-meta">{item.time}</span>
                </div>
                <div className="history-item-actions">
                  <DotsThree weight="bold" size={20} />
                </div>
              </div>
              ))
            )}
          </div>
          
          <div className="load-more">
            <button 
              className="load-more-button"
              onClick={() => console.log('加载更多历史记录')}
            >
              {t('history.loadMore')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;