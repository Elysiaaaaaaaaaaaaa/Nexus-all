import React, { useState, useEffect } from 'react';
import { 
  // LinkedinLogo, // 已注释：去掉领英
  GithubLogo, EnvelopeSimple, 
  ArrowUpRight, IdentificationCard, Student
} from '@phosphor-icons/react';
import './TeamIntroduction.css';
import { useApp } from '../contexts/AppContext';

// 导入图片
import teamPhoto from '../assets/team.png';
// 个人头像图片
import zhjPhoto from '../assets/zhj.png';
import czxPhoto from '../assets/czx.png';
import hhcPhoto from '../assets/hhc.png';
import czyPhoto from '../assets/czy.png';

const TeamIntroduction = () => {
  const { t } = useApp();

  // 机构映射表 (Academic Affiliations) - 使用国际化
  const affiliationsList = t('teamIntroduction.affiliations');
  const affiliations = Array.isArray(affiliationsList) 
    ? affiliationsList.map((name, index) => ({ id: index + 1, name }))
    : [
        { id: 1, name: "School of Computer Science (National Pilot Software Engineering School), BUPT", short: "Computer Science" },
        { id: 2, name: "International School, Beijing University of Posts and Telecommunications", short: "International School" },
        { id: 3, name: "School of Artificial Intelligence, Beijing University of Posts and Telecommunications", short: "School of AI" }
      ];

  // 团队成员数据 - 使用国际化
  const members = [
    {
      id: "hengji",
      name: "Hengji Zhang",
      photo: zhjPhoto,
      affiliationIds: [1],
      role: t('teamIntroduction.roles.zixuan') || "Research Engineer", // 调换职能
      tags: [
        t('teamIntroduction.tags.algorithms') || "Algorithms",
        t('teamIntroduction.tags.systemDesign') || "System Design"
      ],
      link: "https://github.com/bosprimigenious",
      github: "https://github.com/bosprimigenious",
      // linkedin: "https://linkedin.com/in/hengji", // 已注释：去掉领英
      email: "bosprimigenious@foxmail.com"
    },
    {
      id: "zixuan",
      name: "Zixuan Chen",
      photo: czxPhoto,
      affiliationIds: [2],
      role: t('teamIntroduction.roles.hengji') || "Project Lead & Core Architect", // 调换职能
      tags: [
        t('teamIntroduction.tags.fullStack') || "Full Stack",
        t('teamIntroduction.tags.product') || "Product",
        t('teamIntroduction.tags.vision') || "Vision"
      ],
      link: "https://github.com/zhengyang-web",
      github: "https://github.com/zhengyang-web",
      // linkedin: "https://linkedin.com/in/zixuan", // 已注释：去掉领英
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
      link: "https://github.com/orgs/Nexus-Best/people/huang-haocheng",
      github: "https://github.com/orgs/Nexus-Best/people/huang-haocheng",
      // linkedin: "https://linkedin.com/in/haocheng", // 已注释：去掉领英
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
      // linkedin: "https://linkedin.com/in/zhengyang", // 已注释：去掉领英
      email: "2453262448@qq.com"
    }
  ];

  return (
    <div className="team-container">
        {/* 顶部背景装饰 */}
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

        {/* 团队合照区域 */}
        <div className="team-photo-section">
          <div className="team-photo-wrapper">
            <img src={teamPhoto} alt="Nexus Intelligence Team" className="team-photo" />
            <div className="photo-overlay">
              <span className="photo-caption">{t('teamIntroduction.photoCaption') || 'Our Team @ BUPT Campus 2024'}</span>
            </div>
          </div>
        </div>

      {/* 核心成员网格 */}
      <div className="members-grid">
        {members.map((member, index) => (
          <div 
            key={member.id} 
            className="member-card"
          >
            <div className="member-card-header">
              <a href={member.link} className="member-link-icon">
                <ArrowUpRight size={20} />
              </a>
            </div>

            {/* 头像部分 */}
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

            {/* 悬浮时显示的社交链接 */}
            <div className="member-socials">
              <a href={member.github} target="_blank" rel="noopener noreferrer" className="social-btn">
                <GithubLogo weight="fill" />
              </a>
              {/* 已注释：去掉领英
              <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="social-btn">
                <LinkedinLogo weight="fill" />
              </a>
              */}
              <a href={`mailto:${member.email}`} className="social-btn">
                <EnvelopeSimple />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* 机构归属脚注 (类似论文引用) */}
      <footer className="affiliations-footer">
        <div className="divider-line"></div>
        <div className="affiliations-list">
          {affiliations.map(aff => (
            <div key={aff.id} className="affiliation-item">
              <span className="aff-index">{aff.id}</span>
              <span className="aff-name">{aff.name}</span>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default TeamIntroduction;