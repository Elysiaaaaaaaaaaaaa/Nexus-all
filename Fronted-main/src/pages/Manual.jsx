import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Play, Code, Gear, FilmStrip } from '@phosphor-icons/react';
import ReactMarkdown from 'react-markdown';
import './Manual.css';
import { useApp } from '../contexts/AppContext';

const Manual = () => {
  const navigate = useNavigate();
  const { t } = useApp();
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 加载 Markdown 内容
    fetch('/MANUAL.md')
      .then((res) => res.text())
      .then((text) => {
        setMarkdown(text);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setMarkdown('# 使用指南\n\n文档加载失败，请稍后重试。');
      });
  }, []);

  return (
    <div className="manual-container">
      {/* Header */}
      <header className="manual-header">
        <div className="manual-header-content">
          <BookOpen size={32} weight="fill" className="manual-header-icon" />
          <div>
            <h1 className="manual-header-title">{t('manual.title')}</h1>
            <p className="manual-header-subtitle">{t('manual.subtitle')}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="manual-content">
        {loading ? (
          <div className="manual-loading">
            <p>正在加载使用指南...</p>
          </div>
        ) : (
          <div className="manual-markdown">
            <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => <h1 className="manual-md-h1" {...props} />,
              h2: ({ node, ...props }) => <h2 className="manual-md-h2" {...props} />,
              h3: ({ node, ...props }) => <h3 className="manual-md-h3" {...props} />,
              h4: ({ node, ...props }) => <h4 className="manual-md-h4" {...props} />,
              p: ({ node, ...props }) => <p className="manual-md-p" {...props} />,
              ul: ({ node, ...props }) => <ul className="manual-md-ul" {...props} />,
              ol: ({ node, ...props }) => <ol className="manual-md-ol" {...props} />,
              li: ({ node, ...props }) => <li className="manual-md-li" {...props} />,
              hr: ({ node, ...props }) => <hr className="manual-md-hr" {...props} />,
              code: ({ node, inline, ...props }) => 
                inline ? (
                  <code className="manual-md-code-inline" {...props} />
                ) : (
                  <code className="manual-md-code-block" {...props} />
                ),
              pre: ({ node, ...props }) => <pre className="manual-md-pre" {...props} />,
              blockquote: ({ node, ...props }) => <blockquote className="manual-md-blockquote" {...props} />,
              a: ({ node, ...props }) => <a className="manual-md-link" target="_blank" rel="noopener noreferrer" {...props} />,
              strong: ({ node, ...props }) => <strong className="manual-md-strong" {...props} />,
              em: ({ node, ...props }) => <em className="manual-md-em" {...props} />,
            }}
          >
            {markdown}
          </ReactMarkdown>
          </div>
        )}

        {/* Quick Actions */}
        <div className="manual-quick-actions">
          <h3 className="manual-quick-actions-title">{t('manual.quickActions')}</h3>
          <div className="manual-quick-actions-grid">
            <button 
              className="manual-quick-action-card"
              onClick={() => navigate('/dashboard')}
            >
              <Play size={24} weight="fill" />
              <span>{t('manual.start')}</span>
            </button>
            <button 
              className="manual-quick-action-card"
              onClick={() => navigate('/agents')}
            >
              <Code size={24} weight="fill" />
              <span>查看智能体</span>
            </button>
            <button 
              className="manual-quick-action-card"
              onClick={() => navigate('/projects')}
            >
              <FilmStrip size={24} weight="fill" />
              <span>我的项目</span>
            </button>
            <button 
              className="manual-quick-action-card"
              onClick={() => navigate('/settings')}
            >
              <Gear size={24} weight="fill" />
              <span>{t('manual.settings')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Manual;
