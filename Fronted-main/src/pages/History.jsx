import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FilmStrip,
  MagnifyingGlass,
  Faders,
  Bell,
  DotsThree,
  Image,
} from '@phosphor-icons/react';
import './History.css';
import { useApp } from '../contexts/AppContext';
import { getProjectsList } from '../services/api';
import {
  extractProjectsFromListResponse,
  historyRowStyleByIndex,
} from '../utils/historyView';

const History = () => {
  const navigate = useNavigate();
  const { t } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus] = useState('全部');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const resp = await getProjectsList();
      setProjects(extractProjectsFromListResponse(resp));
    } catch (e) {
      setLoadError(e?.message || t('history.loadFailed'));
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const workflowLabel = useCallback(
    (workflowType) =>
      workflowType === 'image2video' ? t('history.workflowImage') : t('history.workflowText'),
    [t],
  );

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return projects.filter((p) => {
      const name = (p.project_name || '').toLowerCase();
      const task = String(p.now_task || '').toLowerCase();
      const wf = workflowLabel(p.workflow_type).toLowerCase();
      const matchesSearch = !q || name.includes(q) || task.includes(q) || wf.includes(q);
      const matchesFilter = filterStatus === '全部';
      return matchesSearch && matchesFilter;
    });
  }, [projects, searchQuery, filterStatus, workflowLabel]);

  const openDetail = (p) => {
    const name = p.project_name;
    if (!name) return;
    navigate(`/history/${encodeURIComponent(name)}`, {
      state: {
        summary: {
          project_name: name,
          workflow_type: p.workflow_type,
          now_task: p.now_task,
        },
      },
    });
  };

  return (
    <div className="history-container">
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
          <button type="button" className="filter-button" onClick={() => {}}>
            <Faders size={16} /> {t('history.filter')}
          </button>
          <button type="button" className="notification-button" onClick={() => {}}>
            <Bell size={18} />
          </button>
        </div>
      </header>

      <div className="history-content">
        <div className="history-inner">
          <h3 className="section-title">{t('history.recent')}</h3>

          {loading && <div className="history-state history-state-muted">{t('history.loadingList')}</div>}
          {!loading && loadError && (
            <div className="history-state history-state-error">
              {loadError}
              <button type="button" className="history-retry" onClick={load}>
                {t('history.retry')}
              </button>
            </div>
          )}
          {!loading && !loadError && filteredItems.length === 0 && (
            <div className="history-state history-state-muted">{t('history.emptyProjects')}</div>
          )}

          <div className="history-list">
            {!loading &&
              !loadError &&
              filteredItems.map((item, index) => {
                const style = historyRowStyleByIndex(index);
                const Icon = item.workflow_type === 'image2video' ? Image : FilmStrip;
                const taskLabel = String(item.now_task || '—');
                return (
                  <div
                    key={item.project_name}
                    className="history-item"
                    onClick={() => openDetail(item)}
                    style={{ cursor: 'pointer' }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openDetail(item);
                      }
                    }}
                  >
                    <div
                      className="history-item-icon"
                      style={{ background: style.color, color: style.textColor }}
                    >
                      <Icon size={20} weight="fill" />
                    </div>
                    <div className="history-item-content">
                      <div className="history-item-header">
                        <h4 className="history-item-title">{item.project_name}</h4>
                        <span
                          className="history-item-badge"
                          style={{
                            background: style.badgeColor,
                            borderColor: style.badgeBorder,
                            color: style.badgeText,
                          }}
                        >
                          {taskLabel}
                        </span>
                      </div>
                      <p className="history-item-time">{workflowLabel(item.workflow_type)}</p>
                    </div>
                    <div className="history-item-meta">
                      <span className="history-item-time-meta">{taskLabel}</span>
                    </div>
                    <div className="history-item-actions">
                      <DotsThree weight="bold" size={20} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;
