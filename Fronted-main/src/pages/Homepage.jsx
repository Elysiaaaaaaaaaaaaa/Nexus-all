import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Play, BookOpen, CaretLeft, CaretRight, CaretDown, SpeakerHigh, SpeakerSlash, Users, Code, GraduationCap, UserCircle, 
  GithubLogo, EnvelopeSimple, ArrowUpRight, 
  Monitor, Cpu, Globe, ShieldCheck, ArrowsOutSimple, ArrowsInSimple, 
  MagnifyingGlassPlus, MagnifyingGlassMinus, CaretLeft as CaretLeftIcon, CaretRight as CaretRightIcon, FilePdf, CodeBlock,
  Phone, MapPin, ArrowUp, Gift, Calculator, ShoppingCart, WechatLogo, FacebookLogo, TwitterLogo, LinkedinLogo, InstagramLogo, Quotes } from '@phosphor-icons/react';
import logoTransparent from '../assets/logo_transparent.png';
import test1Video from '../assets/test1.mp4';
import test2Video from '../assets/test2.mp4';
import teamPhoto from '../assets/team.png';
import zhjPhoto from '../assets/zhj.png';
import czxPhoto from '../assets/czx.png';
import hhcPhoto from '../assets/hhc.png';
import czyPhoto from '../assets/czy.png';
import './Homepage.css';
import '../pages/TeamIntroduction.css';
import '../pages/TechShowcase.css';
import { useApp } from '../contexts/AppContext';
import { isProduction } from '../utils/security';
import LoginModal from '../components/LoginModal';

const Homepage = () => {
  const navigate = useNavigate();
  const { t, language, isAuthenticated } = useApp();
  const videoRef = useRef(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [activePdfIndex, setActivePdfIndex] = useState(0);
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [iframeKey, setIframeKey] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [faqOpenIndex, setFaqOpenIndex] = useState(null);
  
  const videos = [test1Video, test2Video];
  
  // 团队成员数据
  const affiliationsList = t('teamIntroduction.affiliations');
  const affiliations = Array.isArray(affiliationsList) 
    ? affiliationsList.map((name, index) => ({ id: index + 1, name }))
    : [
        { id: 1, name: "School of Computer Science (National Pilot Software Engineering School), BUPT", short: "Computer Science" },
        { id: 2, name: "International School, Beijing University of Posts and Telecommunications", short: "International School" },
        { id: 3, name: "School of Artificial Intelligence, Beijing University of Posts and Telecommunications", short: "School of AI" }
      ];

  const members = [
    {
      id: "hengji",
      name: "Hengji Zhang",
      photo: zhjPhoto,
      affiliationIds: [1],
      role: t('teamIntroduction.roles.zixuan') || "Research Engineer",
      tags: [
        t('teamIntroduction.tags.algorithms') || "Algorithms",
        t('teamIntroduction.tags.systemDesign') || "System Design"
      ],
      link: "https://github.com/bosprimigenious",
      github: "https://github.com/bosprimigenious",
      email: "bosprimigenious@foxmail.com"
    },
    {
      id: "zixuan",
      name: "Zixuan Chen",
      photo: czxPhoto,
      affiliationIds: [2],
      role: t('teamIntroduction.roles.hengji') || "Project Lead & Core Architect",
      tags: [
        t('teamIntroduction.tags.fullStack') || "Full Stack",
        t('teamIntroduction.tags.product') || "Product",
        t('teamIntroduction.tags.vision') || "Vision"
      ],
      link: "https://github.com/zhengyang-web",
      github: "https://github.com/zhengyang-web",
      email: "czx_0000@qq.com"
    },
    {
      id: "haocheng",
      name: "Haocheng Huang",
      photo: hhcPhoto,
      affiliationIds: [2],
      role: t('teamIntroduction.roles.haocheng') || "Frontend Engineer",
      tags: [
        t('teamIntroduction.tags.uiux') || "UI/UX",
        t('teamIntroduction.tags.interaction') || "Interaction"
      ],
      link: "https://github.com/huang-haocheng",
      github: "https://github.com/huang-haocheng",
      email: "2671715549@qq.com"
    },
    {
      id: "zhengyang",
      name: "Zhengyang Cui",
      photo: czyPhoto,
      affiliationIds: [3],
      role: t('teamIntroduction.roles.zhengyang') || "AI Researcher",
      tags: [
        t('teamIntroduction.tags.deepLearning') || "Deep Learning",
        t('teamIntroduction.tags.modelOpt') || "Model Opt"
      ],
      link: "https://github.com/Elysiaaaaaaaaaaaaa",
      github: "https://github.com/Elysiaaaaaaaaaaaaa",
      email: "2453262448@qq.com"
    }
  ];
  
  // Tech展示数据
  const pdfFiles = [
    { url: '/pdfs/Nexus.pdf', title: 'Nexus Architecture v4.0', type: 'System Core' },
  ];
  
  const handleZoom = (delta) => {
    setZoomLevel(prev => Math.min(Math.max(0.5, prev + delta), 2.0));
  };

  const toggleCinemaMode = () => {
    setIsCinemaMode(!isCinemaMode);
    setZoomLevel(1);
    setTimeout(() => setIframeKey(prev => prev + 1), 300);
  };

  // 合并视频控制逻辑：监听索引变化，处理播放和事件绑定
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 确保静音状态同步
    video.muted = isMuted;

    // 定义自动播放函数
    const playVideo = async () => {
      try {
        // 重置时间（以防万一）
        video.currentTime = 0;
        await video.play();
      } catch (error) {
        // 自动播放被浏览器拦截或失败
      }
    };

    // 定义结束时的回调
    const handleEnded = () => {
      // 直接更新索引，避免循环依赖
      setCurrentVideoIndex((prev) => {
        const newIndex = prev + 1;
        return newIndex >= videos.length ? 0 : newIndex;
      });
    };

    // 绑定结束事件
    video.addEventListener('ended', handleEnded);

    // 执行播放
    playVideo();

    // 清理函数
    return () => {
      video.removeEventListener('ended', handleEnded);
    };
    // 依赖项：当索引改变(DOM重建)或静音状态改变时重新执行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVideoIndex, isMuted]);

  // 优化切换函数 (防止快速点击导致的计算错误)
  const handlePrevVideo = () => {
    setCurrentVideoIndex((prev) => {
      const newIndex = prev - 1;
      // 如果小于0，跳到最后一个
      return newIndex < 0 ? videos.length - 1 : newIndex;
    });
  };

  const handleNextVideo = () => {
    setCurrentVideoIndex((prev) => {
      const newIndex = prev + 1;
      // 如果超过长度，回到第一个
      return newIndex >= videos.length ? 0 : newIndex;
    });
  };

  const handleToggleMute = () => {
    // 状态更新会自动触发上面的 useEffect 同步 video.muted
    setIsMuted((prev) => !prev);
  };


  // 使用 Portal 将顶栏渲染到 document.body，避免父级 transform/filter 导致 position:fixed 失效
  const navbarEl = (
    <nav className="homepage-nav" aria-label="主导航">
      <div className="homepage-nav-content">
        <div className="homepage-nav-left">
          <div className="homepage-logo-box">
            <img src={logoTransparent} alt="Nexus" className="homepage-logo-img" />
          </div>
          <span className="homepage-nav-title">NEXUS</span>
        </div>
        <div className="homepage-nav-right">
          <span className="homepage-status-tag">
            <span className="homepage-status-dot"></span>
            {t('homepage.statusReady')}
          </span>
          <button
            className="homepage-start-button"
            onClick={() => {
              if (isAuthenticated) {
                navigate('/dashboard');
              } else {
                setShowLoginModal(true);
              }
            }}
            type="button"
          >
            {t('homepage.startCreate')}
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <>
      {createPortal(navbarEl, document.body)}
      <div className="homepage-container">
      {/* Hero Section */}
      <section className="homepage-hero">
        <div className="homepage-hero-content">
          <div className="homepage-hero-left">
            <h1 className="homepage-hero-title">
              {t('dashboard.headlineMain')} <span className="homepage-hero-highlight">{t('dashboard.headlineHighlight')}</span> {t('dashboard.headlineTail')}
            </h1>
            <div className="homepage-hero-subtitle">
              <p className="homepage-hero-subtitle-line">
                <span className="homepage-hero-subtitle-version">Nexus Studio V4.0.2</span>
                <span className="homepage-hero-subtitle-separator">·</span>
                <span className="homepage-hero-subtitle-tagline">{t('homepage.heroTagline')}</span>
              </p>
              <p className="homepage-hero-subtitle-line">
                {language === 'zh-CN' ? (
                  <>基于 <span className="homepage-hero-subtitle-highlight">LangGraph</span> 与 <span className="homepage-hero-subtitle-highlight">ACPs 协议</span>，将创意构思<span className="homepage-hero-subtitle-emphasis">秒级转化</span>为高质量视频</>
                ) : language === 'en-US' ? (
                  <>Built on <span className="homepage-hero-subtitle-highlight">LangGraph</span> and <span className="homepage-hero-subtitle-highlight">ACPs Protocol</span>, transforming ideas into <span className="homepage-hero-subtitle-emphasis">high-quality videos</span> in seconds</>
                ) : (
                  <><span className="homepage-hero-subtitle-highlight">LangGraph</span> と <span className="homepage-hero-subtitle-highlight">ACPs</span> を基盤に、アイデアを<span className="homepage-hero-subtitle-emphasis">秒単位</span>で高品質な動画へ変換</>
                )}
              </p>
            </div>
            <div className="homepage-hero-actions">
              <button 
                className="homepage-button-primary"
                onClick={() => {
                  if (isAuthenticated) {
                    navigate('/dashboard');
                  } else {
                    setShowLoginModal(true);
                  }
                }}
                type="button"
              >
                {t('homepage.tryFree')}
              </button>
              <button 
                className="homepage-button-secondary"
                onClick={() => navigate('/manual')}
              >
                {t('homepage.docs')}
              </button>
            </div>
          </div>
          
          <div className="homepage-video-container">
            <video
              ref={videoRef}
              className="homepage-video-bg"
              autoPlay
              muted={isMuted}
              playsInline
              key={currentVideoIndex}
            >
              <source src={videos[currentVideoIndex]} type="video/mp4" />
            </video>
            <div className="homepage-video-overlay">
              <p className="homepage-video-text">{t('homepage.demo')}</p>
            </div>
            {/* 视频控制按钮 - 左侧 */}
            <button 
              className="homepage-video-control-btn-left"
              onClick={handlePrevVideo}
              aria-label="上一个视频"
            >
              <CaretLeft size={24} weight="bold" />
            </button>
            {/* 视频控制按钮 - 右侧 */}
            <button 
              className="homepage-video-control-btn-right"
              onClick={handleNextVideo}
              aria-label="下一个视频"
            >
              <CaretRight size={24} weight="bold" />
            </button>
            {/* 视频控制按钮 - 底部 */}
            <div className="homepage-video-controls-bottom">
              <div className="homepage-video-indicators">
                {videos.map((_, index) => (
                  <button
                    key={index}
                    className={`homepage-video-indicator ${index === currentVideoIndex ? 'active' : ''}`}
                    onClick={() => setCurrentVideoIndex(index)}
                    aria-label={`切换到视频 ${index + 1}`}
                  />
                ))}
              </div>
              <button 
                className="homepage-video-mute-btn"
                onClick={handleToggleMute}
                aria-label={isMuted ? '开启声音' : '静音'}
              >
                {isMuted ? (
                  <SpeakerSlash size={20} weight="bold" />
                ) : (
                  <SpeakerHigh size={20} weight="bold" />
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 功能展示 Section */}
      <section className="homepage-features">
        <div className="homepage-features-content">
          <h2 className="homepage-features-title">由智能 Agent 驱动的全流程</h2>
          <div className="homepage-features-grid">
            
            <div className="homepage-feature-card">
              <div 
                className="homepage-feature-bg homepage-feature-bg-1"
                style={{
                  backgroundImage: 'url(https://images.unsplash.com/photo-1518932945647-7a1c969f8be2?auto=format&fit=crop&w=800&q=80)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              ></div>
              <div className="homepage-feature-overlay">
                <h3 className="homepage-feature-title">导演助手 & 剧本 Writer</h3>
                <p className="homepage-feature-desc">基于 LangGraph 的多智能体协作，自动提炼创意并编写专业剧本。</p>
              </div>
            </div>

            <div className="homepage-feature-card">
              <div 
                className="homepage-feature-bg homepage-feature-bg-2"
                style={{
                  backgroundImage: 'url(https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=2000&auto=format&fit=crop)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              ></div>
              <div className="homepage-feature-overlay">
                <h3 className="homepage-feature-title">智能动画师 Agent</h3>
                <p className="homepage-feature-desc">通过异步任务流，将剧本逻辑无缝转化为高保真视频资产。</p>
              </div>
            </div>

            <div className="homepage-feature-card">
              <div 
                className="homepage-feature-bg homepage-feature-bg-3"
                style={{
                  backgroundImage: 'url(https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              ></div>
              <div className="homepage-feature-overlay">
                <h3 className="homepage-feature-title">AIP 协议自动化</h3>
                <p className="homepage-feature-desc">采用 ACPs 通信协议，确保创作全流程的自动化体验与数据安全。</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 团队介绍 Section */}
      <section className="homepage-team-section">
        <div className="homepage-team-content">
          <div className="team-bg-gradient"></div>
          <header className="team-hero">
            <h1 className="team-headline">
              {t('teamIntroduction.headline') || 'The Minds Behind'} <br />
              <span className="gradient-text">{t('teamIntroduction.headlineHighlight') || 'Nexus Intelligence'}</span>
            </h1>
            <p className="team-subheadline">
              {t('teamIntroduction.subtitle') || 'Bridging the gap between academic research and industrial innovation.\nWe are builders from BUPT.'}
            </p>
          </header>

          <div className="team-photo-section">
            <div className="team-photo-wrapper">
              <img src={teamPhoto} alt="Nexus Intelligence Team" className="team-photo" />
              <div className="photo-overlay">
                <span className="photo-caption">{t('teamIntroduction.photoCaption') || 'Our Team @ BUPT Campus 2024'}</span>
              </div>
            </div>
          </div>

          <div className="members-grid">
            {members.map((member, index) => (
              <div key={member.id} className="member-card">
                <div className="member-card-header">
                  <a href={member.link} className="member-link-icon">
                    <ArrowUpRight size={20} />
                  </a>
                </div>
                <div className="member-visual">
                  <div className="avatar-container">
                    <img 
                      src={member.photo} 
                      alt={member.name}
                      className="avatar-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const placeholder = e.target.nextElementSibling;
                        if (placeholder) {
                          placeholder.style.display = 'flex';
                        }
                      }}
                    />
                    <div className="avatar-placeholder" style={{display: 'none'}}>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  </div>
                </div>
                <div className="member-info-group">
                  <h2 className="member-name">
                    {member.name}
                  </h2>
                  <div className="member-role">{member.role}</div>
                  <div className="member-tags">
                    {member.tags.map(tag => (
                      <span key={tag} className="tech-tag">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="member-socials">
                  <a href={member.github} target="_blank" rel="noopener noreferrer" className="social-btn">
                    <GithubLogo weight="fill" />
                  </a>
                  <a href={`mailto:${member.email}`} className="social-btn">
                    <EnvelopeSimple />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 合作伙伴 Section */}
      <section className="homepage-partners">
        <div className="homepage-partners-content">
          <h2 className="homepage-partners-title">{t('homepage.partnersTitle')}</h2>
          <div className="homepage-partner-modern">
            <div className="homepage-partner-modern-icon">
              <GraduationCap size={64} weight="duotone" />
            </div>
            <div className="homepage-partner-modern-content">
              <h3 className="homepage-partner-modern-name">{t('homepage.partnerBUPT')}</h3>
              <p className="homepage-partner-modern-desc">{t('homepage.partnerDesc')}</p>
              <div className="homepage-partner-modern-badge">
                <span className="homepage-partner-modern-badge-text">{t('homepage.strategicPartner')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 导师介绍 Section */}
      <section className="homepage-mentor">
        <div className="homepage-mentor-content">
          <h2 className="homepage-mentor-title">{t('homepage.mentorTitle')}</h2>
          <div className="homepage-mentor-card">
            <div className="homepage-mentor-avatar">
              <img 
                src="https://teacher.bupt.edu.cn/_resources/group1/M00/00/02/CgM3mmYo_tGAEud8AAEmzd97cbY633.png" 
                alt={t('homepage.mentorName')}
                className="homepage-mentor-avatar-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const placeholder = e.target.nextElementSibling;
                  if (placeholder) {
                    placeholder.style.display = 'flex';
                  }
                }}
              />
              <UserCircle size={120} weight="duotone" className="homepage-mentor-icon" style={{display: 'none'}} />
            </div>
            <div className="homepage-mentor-info">
              <div className="homepage-mentor-header">
                <h3 className="homepage-mentor-name">{t('homepage.mentorName')}</h3>
                <span className="homepage-mentor-title-en">{t('homepage.mentorNameEn')}</span>
              </div>
              <div className="homepage-mentor-titles">
                <span className="homepage-mentor-title-tag">{t('homepage.mentorTitle1')}</span>
                <span className="homepage-mentor-title-tag">{t('homepage.mentorTitle2')}</span>
                <span className="homepage-mentor-title-tag">{t('homepage.mentorTitle3')}</span>
              </div>
              <p className="homepage-mentor-role">{t('homepage.mentorRole')}</p>
              <div className="homepage-mentor-details">
                <div className="homepage-mentor-detail-item">
                  <strong>{t('homepage.mentorEmail')}:</strong>
                  <a href={`mailto:${t('homepage.mentorEmailValue')}`}>{t('homepage.mentorEmailValue')}</a>
                </div>
                <div className="homepage-mentor-detail-item">
                  <strong>{t('homepage.mentorPosition')}:</strong>
                  <span>{t('homepage.mentorPositionValue')}</span>
                </div>
                <div className="homepage-mentor-detail-item">
                  <strong>{t('homepage.mentorResearch')}:</strong>
                  <span>{t('homepage.mentorResearchValue')}</span>
                </div>
              </div>
              <p className="homepage-mentor-bio">{t('homepage.mentorBio')}</p>
              <div className="homepage-mentor-links">
                <a 
                  href="https://xueshu.baidu.com/scholarID/CN-B5HATZFK" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="homepage-mentor-link"
                >
                  {t('homepage.mentorLink')} →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 技术展示 Section */}
      <section className="homepage-tech-section">
        <div className="homepage-tech-content-new">
          <header className="homepage-tech-header-new">
            <div className="homepage-tech-header-center">
              <h2 className="homepage-tech-title-new">{t('techShowcase.title') || '技术展示'}</h2>
              <p className="homepage-tech-subtitle-new">{t('techShowcase.description') || '探索我们的技术解决方案和创新展示'}</p>
            </div>
          </header>

          <div className="homepage-tech-main-card">
            <div className="homepage-tech-card-header">
              <div className="homepage-tech-card-title-group">
                <FilePdf size={24} weight="fill" className="homepage-tech-pdf-icon" />
                <div>
                  <h3 className="homepage-tech-card-title">{pdfFiles[activePdfIndex].title}</h3>
                  <span className="homepage-tech-card-tag">{pdfFiles[activePdfIndex].type}</span>
                </div>
              </div>
              <div className="homepage-tech-card-actions">
                <button onClick={() => handleZoom(-0.1)} className="homepage-tech-action-btn" title={t('techShowcase.zoomOut') || '缩小'}>
                  <MagnifyingGlassMinus size={20} weight="bold" />
                </button>
                <span className="homepage-tech-zoom-text">{Math.round(zoomLevel * 100)}%</span>
                <button onClick={() => handleZoom(0.1)} className="homepage-tech-action-btn" title={t('techShowcase.zoomIn') || '放大'}>
                  <MagnifyingGlassPlus size={20} weight="bold" />
                </button>
                <button onClick={toggleCinemaMode} className="homepage-tech-action-btn homepage-tech-action-btn-primary" title={isCinemaMode ? (t('techShowcase.exitCinemaMode') || '退出全屏') : (t('techShowcase.cinemaMode') || '全屏')}>
                  {isCinemaMode ? <ArrowsInSimple size={20} weight="bold" /> : <ArrowsOutSimple size={20} weight="bold" />}
                </button>
              </div>
            </div>
            <div className="homepage-tech-pdf-container">
              <div 
                className="homepage-tech-pdf-wrapper"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <iframe
                  key={iframeKey}
                  src={`${pdfFiles[activePdfIndex].url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                  title="Tech Specification PDF"
                  className="homepage-tech-iframe"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Q&A Section */}
      <section className="homepage-faq-section" id="faq">
        <div className="homepage-faq-content">
          <header className="homepage-faq-header">
            <h2 className="homepage-faq-title">{t('faq.title')}</h2>
            <p className="homepage-faq-description">{t('faq.description')}</p>
          </header>
          <div className="homepage-faq-list" role="list">
            {Array.isArray(t('faq.items')) && t('faq.items').map((item, index) => {
              const isOpen = faqOpenIndex === index;
              return (
                <div
                  key={index}
                  className={`homepage-faq-item ${isOpen ? 'is-open' : ''}`}
                  role="listitem"
                >
                  <button
                    type="button"
                    className="homepage-faq-question"
                    onClick={() => setFaqOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                    id={`faq-question-${index}`}
                  >
                    <span className="homepage-faq-question-text">{item?.question ?? ''}</span>
                    <CaretDown size={20} weight="bold" className="homepage-faq-icon" aria-hidden />
                  </button>
                  <div
                    id={`faq-answer-${index}`}
                    className="homepage-faq-answer"
                    role="region"
                    aria-labelledby={`faq-question-${index}`}
                    hidden={!isOpen}
                  >
                    <p className="homepage-faq-answer-text">{item?.answer ?? ''}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 用户评价 Section */}
      <section className="homepage-testimonials-section" id="testimonials">
        <div className="homepage-testimonials-content">
          <header className="homepage-testimonials-header">
            <h2 className="homepage-testimonials-title">{t('testimonials.title')}</h2>
            <p className="homepage-testimonials-description">{t('testimonials.description')}</p>
          </header>
          <div className="homepage-testimonials-grid" role="list">
            {Array.isArray(t('testimonials.items')) && t('testimonials.items').map((item, index) => (
              <article
                key={index}
                className="homepage-testimonial-card"
                role="listitem"
              >
                <Quotes size={28} weight="fill" className="homepage-testimonial-icon" aria-hidden />
                <blockquote className="homepage-testimonial-quote">{item?.quote ?? ''}</blockquote>
                <footer className="homepage-testimonial-author">
                  {item?.avatarUrl ? (
                    <img
                      src={item.avatarUrl}
                      alt=""
                      className="homepage-testimonial-avatar-img"
                      width={44}
                      height={44}
                      loading="lazy"
                    />
                  ) : (
                    <span className="homepage-testimonial-avatar" aria-hidden>
                      {(item?.authorName ?? '').charAt(0)}
                    </span>
                  )}
                  <div className="homepage-testimonial-meta">
                    <cite className="homepage-testimonial-name">{item?.authorName ?? ''}</cite>
                    <span className="homepage-testimonial-role">{item?.authorRole ?? ''}</span>
                  </div>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="homepage-footer">
        <div className="homepage-footer-content">
          <div className="homepage-footer-main">
            {/* 左侧：公司信息 */}
            <div className="homepage-footer-section">
              <h3 className="homepage-footer-section-title">Nexus Studio</h3>
              <p className="homepage-footer-section-desc">您身边的智能创作助手</p>
              
              <div className="homepage-footer-contact">
                <div className="homepage-footer-contact-item">
                  <MapPin size={16} weight="fill" />
                  <span>公司地址</span>
                </div>
                <p className="homepage-footer-contact-value">北京市海淀区西土城路10号 北京邮电大学</p>
                
                <div className="homepage-footer-contact-item">
                  <Phone size={16} weight="fill" />
                  <span>联系电话</span>
                </div>
                <p className="homepage-footer-contact-value">400-8652-296</p>
                
                <div className="homepage-footer-contact-item">
                  <EnvelopeSimple size={16} weight="fill" />
                  <span>公司邮箱</span>
                </div>
                <p className="homepage-footer-contact-value">info@nexus-engine.com</p>
              </div>
              
              <div className="homepage-footer-social">
                <span className="homepage-footer-social-title">关注我们的自媒体平台</span>
                <div className="homepage-footer-social-icons">
                  <a href="#" className="homepage-footer-social-icon" aria-label="微信">
                    <WechatLogo size={20} weight="fill" />
                  </a>
                  <a href="#" className="homepage-footer-social-icon" aria-label="微博">
                    <TwitterLogo size={20} weight="fill" />
                  </a>
                  <a href="#" className="homepage-footer-social-icon" aria-label="LinkedIn">
                    <LinkedinLogo size={20} weight="fill" />
                  </a>
                  <a href="#" className="homepage-footer-social-icon" aria-label="GitHub">
                    <GithubLogo size={20} weight="fill" />
                  </a>
                </div>
              </div>
            </div>

            {/* 中间：服务内容 */}
            <div className="homepage-footer-section">
              <h3 className="homepage-footer-section-title">服务内容</h3>
              <ul className="homepage-footer-services">
                <li><a href="#" onClick={(e) => e.preventDefault()}>智能视频生成服务</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()}>分镜脚本创作服务</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()}>AI 辅助编辑服务</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()}>素材库管理服务</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()}>工作流编排服务</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()}>项目导出服务</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()}>技术咨询支持</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()}>定制化解决方案</a></li>
              </ul>
            </div>

            {/* 右侧：功能链接 */}
            <div className="homepage-footer-section">
              <h3 className="homepage-footer-section-title">快速操作</h3>
              <div className="homepage-footer-actions">
                <a href="#" className="homepage-footer-action-btn" onClick={(e) => e.preventDefault()}>
                  <Calculator size={18} />
                  <span>预估报价</span>
                </a>
                <a href="#" className="homepage-footer-action-btn" onClick={(e) => e.preventDefault()}>
                  <ShoppingCart size={18} />
                  <span>立即下单</span>
                </a>
                <a href="#" className="homepage-footer-action-btn" onClick={(e) => e.preventDefault()}>
                  <Phone size={18} />
                  <span>联系我们</span>
                </a>
                <a href="#" className="homepage-footer-action-btn" onClick={(e) => e.preventDefault()}>
                  <Gift size={18} />
                  <span>推荐好友</span>
                </a>
              </div>
              
              <div className="homepage-footer-referral">
                <h4 className="homepage-footer-referral-title">推荐好友</h4>
                <p className="homepage-footer-referral-desc">奖励机制大升级</p>
                <p className="homepage-footer-referral-text">
                  推荐好友成功下单（订单金额满1000元），您将享受下单金额10%的返现奖励！添加客服微信开始推荐吧！
                </p>
              </div>
            </div>
          </div>

          {/* 底部版权信息 */}
          <div className="homepage-footer-bottom">
            <div className="homepage-footer-tech">
              <span className="homepage-footer-tech-item">Python 3.10+</span>
              <span className="homepage-footer-separator">|</span>
              <span className="homepage-footer-tech-item">LangGraph</span>
              <span className="homepage-footer-separator">|</span>
              <span className="homepage-footer-tech-item">Asyncio</span>
            </div>
            <p className="homepage-footer-copyright">
              京ICP备18054059号-1 | © 2026 Nexus Studio. 智能 Agent 视频创作辅助系统. All Rights Reserved.
            </p>
            <button 
              className="homepage-footer-backtop" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label="返回顶部"
            >
              <ArrowUp size={20} />
              <span>返回顶部</span>
            </button>
          </div>
        </div>
      </footer>

      {/* 登录模态框 */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => navigate('/dashboard')}
      />
      </div>
    </>
  );
};

export default Homepage;
