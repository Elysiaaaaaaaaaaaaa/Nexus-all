import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, ArrowLeft, Copy, MagnifyingGlass } from '@phosphor-icons/react';
import { useApp } from '../contexts/AppContext';
import './AssetsLibrary.css';

const AssetsLibrary = () => {
  const navigate = useNavigate();
  const { t } = useApp();
  const [query, setQuery] = useState('');

  // 目前前端没有全局 session store：先用本地 mock，让页面“更丰满”
  // 后续可接入后端 /api/history 或 /api/interaction/messages。
  const items = useMemo(() => ([
    { id: 'demo-session-001', type: 'storyboard', title: '霓虹东京开场', updatedAt: '刚刚', tags: ['storyboard', 'v1'] },
    { id: 'demo-session-002', type: 'text-to-video', title: '雨天街道镜头', updatedAt: '10分钟前', tags: ['fast', 'draft'] },
    { id: 'demo-session-003', type: 'assets', title: '素材整理：分镜/提示词', updatedAt: '1小时前', tags: ['materials'] }
  ]), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i =>
      i.title.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q) ||
      i.tags.some(tag => tag.toLowerCase().includes(q))
    );
  }, [items, query]);

  const copyId = async (id) => {
    try {
      await navigator.clipboard.writeText(id);
      alert(`已复制：${id}`);
    } catch {
      prompt('请复制以下内容:', id);
    }
  };

  return (
    <div className="assets-library-container">
      <header className="assets-library-header">
        <button className="assets-back" onClick={() => navigate(-1)} type="button">
          <ArrowLeft size={18} />
        </button>
        <div className="assets-title">
          <Archive weight="fill" size={18} />
          <span>{t('assets.title')}</span>
        </div>
      </header>

      <div className="assets-toolbar">
        <div className="assets-search">
          <MagnifyingGlass size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('assets.search')}
          />
        </div>
      </div>

      <div className="assets-grid">
        {filtered.map((i) => (
          <div key={i.id} className="asset-card">
            <div className="asset-card-top">
              <div className="asset-meta">
                <div className="asset-id">{i.id}</div>
                <div className="asset-updated">{t('assets.updatedAt', { time: i.updatedAt })}</div>
              </div>
              <button className="asset-copy" type="button" onClick={() => copyId(i.id)} title={t('assets.copyId')}>
                <Copy size={16} />
              </button>
            </div>

            <div className="asset-title">{i.title}</div>
            <div className="asset-tags">
              {i.tags.map((tag) => (
                <span key={tag} className="asset-tag">{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssetsLibrary;

