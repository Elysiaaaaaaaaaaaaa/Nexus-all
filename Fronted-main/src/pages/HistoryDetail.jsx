import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, FilmStrip, Image, FlowArrow } from '@phosphor-icons/react';
import './HistoryDetail.css';
import { useApp } from '../contexts/AppContext';
import { getProjectHistory } from '../services/api';
import {
  decodeProjectRouteParam,
  extractHistoryFromResponse,
  formatHistoryMaterial,
  historyRowStyleByIndex,
  buildMessagesFromChatHistory,
} from '../utils/historyView';
import {
  extractResolvedVideoUrlsFromSessionData,
  extractVideoPathsFromMaterial,
  resolveBackendVideoSrc,
} from '../utils/backendVideoUrl';
import { SessionVideoPlayers } from '../components/SessionVideoPlayers.jsx';

const HistoryDetail = () => {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useApp();

  const projectName = useMemo(() => decodeProjectRouteParam(routeId), [routeId]);
  const summary = location.state?.summary;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [sessionData, setSessionData] = useState(null);
  /** 后端 projects/history 返回的 session_id，用于继续对话时恢复会话上下文 */
  const [historySessionId, setHistorySessionId] = useState(null);

  const load = useCallback(async () => {
    if (!projectName) {
      setLoading(false);
      setError(t('history.invalidProject'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const resp = await getProjectHistory({ project_name: projectName });
      const { chat_history, session_data, session_id } = extractHistoryFromResponse(resp);
      setChatHistory(chat_history);
      setSessionData(session_data);
      setHistorySessionId(session_id);
    } catch (e) {
      setError(e?.message || t('history.loadFailed'));
      setChatHistory([]);
      setSessionData(null);
      setHistorySessionId(null);
    } finally {
      setLoading(false);
    }
  }, [projectName, t]);

  useEffect(() => {
    load();
  }, [load]);

  const workflowType = summary?.workflow_type || sessionData?.workflow_type;
  const rawNowTask = summary?.now_task ?? sessionData?.now_task;
  const nowTaskLabel =
    rawNowTask == null || rawNowTask === ''
      ? null
      : typeof rawNowTask === 'object'
        ? rawNowTask.name ||
          rawNowTask.title ||
          rawNowTask.task_type ||
          rawNowTask.step ||
          rawNowTask.stage ||
          rawNowTask.status ||
          JSON.stringify(rawNowTask)
        : String(rawNowTask);
  const nowState = sessionData?.now_state;
  const progressVal =
    sessionData?.now_task && typeof sessionData.now_task === 'object'
      ? sessionData.now_task.progress
      : typeof sessionData?.progress === 'number'
        ? sessionData.progress
        : null;
  const progress =
    typeof progressVal === 'number' && Number.isFinite(progressVal)
      ? Math.min(100, Math.max(0, progressVal))
      : null;

  const headerStyle = historyRowStyleByIndex(0);
  const Icon = workflowType === 'image2video' ? Image : FilmStrip;

  const lastUserPreview = useMemo(() => {
    if (!chatHistory.length) return '';
    const last = chatHistory[chatHistory.length - 1];
    const u = last?.user;
    if (typeof u === 'string') return u.slice(0, 200);
    return '';
  }, [chatHistory]);

  const sessionVideoUrls = useMemo(
    () => extractResolvedVideoUrlsFromSessionData(sessionData),
    [sessionData],
  );

  const turnVideoUrlSet = useMemo(() => {
    const s = new Set();
    for (const turn of chatHistory) {
      for (const u of extractVideoPathsFromMaterial(turn.material)
        .map(resolveBackendVideoSrc)
        .filter(Boolean)) {
        s.add(u);
      }
    }
    return s;
  }, [chatHistory]);

  /** 同一视频在多轮 material 中重复出现时，只在首次出现的轮次展示播放器，避免多个相同「生成视频」框 */
  const videoUrlFirstTurnIndex = useMemo(() => {
    const map = new Map();
    chatHistory.forEach((turn, idx) => {
      const urls = [
        ...new Set(
          extractVideoPathsFromMaterial(turn.material)
            .map(resolveBackendVideoSrc)
            .filter(Boolean),
        ),
      ];
      for (const u of urls) {
        if (!map.has(u)) map.set(u, idx);
      }
    });
    return map;
  }, [chatHistory]);

  const sessionOnlyVideoUrls = useMemo(
    () => [...new Set(sessionVideoUrls.filter((u) => !turnVideoUrlSet.has(u)))],
    [sessionVideoUrls, turnVideoUrlSet],
  );

  const continueToInteraction = () => {
    if (!projectName) return;
    localStorage.setItem('app-current-project', projectName);
    const wf = workflowType === 'image2video' ? 'image2video' : 'text2video';
    localStorage.setItem('app-current-workflow-type', wf);
    const workflow = wf === 'image2video' ? 'storyboard_precise' : 'text_to_video_fast';
    const messages = buildMessagesFromChatHistory(chatHistory);
    let mergedSession = sessionData;
    if (mergedSession != null && historySessionId) {
      mergedSession = {
        ...mergedSession,
        session_id: mergedSession.session_id ?? historySessionId,
      };
    } else if (mergedSession == null && historySessionId) {
      mergedSession = { session_id: historySessionId };
    }
    navigate('/interaction', {
      state: {
        workflow,
        projectName,
        resumeChat: {
          messages,
          sessionData: mergedSession,
        },
      },
    });
  };

  return (
    <div className="history-detail-container">
      <header className="history-detail-header">
        <button
          type="button"
          className="history-detail-back-button"
          onClick={() => navigate('/history')}
          aria-label={t('nav.back')}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="history-detail-title">{t('history.detailTitle')}</h1>
      </header>

      <div className="history-detail-content">
        <div className="history-detail-main">
          {loading && (
            <div className="history-detail-card history-detail-state">{t('history.loadingList')}</div>
          )}
          {!loading && error && (
            <div className="history-detail-card history-detail-state history-detail-state-error">
              {error}
              <button type="button" className="history-retry" onClick={load}>
                {t('history.retry')}
              </button>
            </div>
          )}
          {!loading && !error && (
            <div className="history-detail-card">
              <div className="history-detail-header-section">
                <div
                  className="history-detail-icon-container"
                  style={{ background: headerStyle.color, color: headerStyle.textColor }}
                >
                  <Icon size={40} weight="fill" />
                </div>
                <div className="history-detail-info">
                  <h2 className="history-detail-name">{projectName}</h2>
                  <div className="history-detail-meta">
                    <span
                      className="history-detail-badge"
                      style={{
                        background: headerStyle.badgeColor,
                        borderColor: headerStyle.badgeBorder,
                        color: headerStyle.badgeText,
                      }}
                    >
                      {workflowType === 'image2video'
                        ? t('history.workflowImage')
                        : t('history.workflowText')}
                    </span>
                    {nowTaskLabel != null && nowTaskLabel !== '' && (
                      <span className="history-detail-time">
                        {t('history.taskLabel')}: {nowTaskLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {nowState != null && nowState !== '' && (
                <div className="history-detail-description">
                  <h3>{t('history.sessionState')}</h3>
                  <p className="history-detail-now-state">{String(nowState)}</p>
                </div>
              )}

              <div className="history-detail-description">
                <h3>{t('history.summaryTitle')}</h3>
                <p>
                  {lastUserPreview || t('history.noSummary')}
                  {chatHistory.length > 0 && (
                    <span className="history-detail-turns">
                      {' '}
                      ({t('history.turns', { count: chatHistory.length })})
                    </span>
                  )}
                </p>
              </div>

              {progress != null && (
                <div className="history-detail-progress">
                  <h3>{t('history.progressTitle')}</h3>
                  <div className="progress-section">
                    <div className="progress-header">
                      <span>{t('history.progressTitle')}</span>
                      <span className="progress-value">{progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {sessionOnlyVideoUrls.length > 0 && (
                <div className="history-detail-session-videos">
                  <SessionVideoPlayers
                    urls={sessionOnlyVideoUrls}
                    title={t('interaction.generatedVideos')}
                    emptyHint={t('interaction.videoPlaybackError')}
                    variant="light"
                  />
                </div>
              )}

              <div className="history-detail-conversation">
                <h3>{t('history.conversation')}</h3>
                {chatHistory.length === 0 ? (
                  <p className="history-detail-empty-chat">{t('history.noChatYet')}</p>
                ) : (
                  <ul className="history-chat-list">
                    {chatHistory.map((turn, idx) => {
                      const turnVideoUrls = [
                        ...new Set(
                          extractVideoPathsFromMaterial(turn.material)
                            .map(resolveBackendVideoSrc)
                            .filter(Boolean),
                        ),
                      ];
                      const turnVideoUrlsFirstOnly = turnVideoUrls.filter(
                        (u) => videoUrlFirstTurnIndex.get(u) === idx,
                      );
                      return (
                        <li key={idx} className="history-chat-turn">
                          <div className="history-chat-role">{t('history.roleUser')}</div>
                          <pre className="history-chat-body">{String(turn.user ?? '')}</pre>
                          <div className="history-chat-role">{t('history.roleAssistant')}</div>
                          <pre className="history-chat-body">{String(turn.assistant ?? '')}</pre>
                          {turn.material != null && turn.material !== '' && (
                            <>
                              <div className="history-chat-role">{t('history.roleMaterial')}</div>
                              {turnVideoUrlsFirstOnly.length > 0 && (
                                <SessionVideoPlayers
                                  urls={turnVideoUrlsFirstOnly}
                                  title={t('interaction.generatedVideos')}
                                  emptyHint={t('interaction.videoPlaybackError')}
                                  variant="light"
                                />
                              )}
                              <pre className="history-chat-body history-chat-material">
                                {formatHistoryMaterial(turn.material)}
                              </pre>
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {sessionData && Object.keys(sessionData).length > 0 && (
                <div className="history-detail-raw-session">
                  <h3>{t('history.sessionJsonTitle')}</h3>
                  <pre className="history-session-pre">{JSON.stringify(sessionData, null, 2)}</pre>
                </div>
              )}

              <div className="history-detail-actions">
                <button type="button" className="action-button primary" onClick={continueToInteraction}>
                  <FlowArrow size={18} />
                  {t('history.continueChat')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryDetail;
