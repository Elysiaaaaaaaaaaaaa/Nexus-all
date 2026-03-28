import React, { useState } from 'react';
import { DownloadSimple, Copy, FileText } from '@phosphor-icons/react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext.jsx';
import './ExportCenter.css';

const ExportCenter = () => {
  const { t } = useApp();
  const { showToast } = useToast();
  const [sessionId, setSessionId] = useState('');

  const exportText = () => {
    const text = sessionId
      ? `session_id: ${sessionId}\nexport: chat transcript (placeholder)`
      : t('export.empty');
    navigator.clipboard.writeText(text).then(() => {
      showToast({ message: t('export.copied'), variant: 'success' });
    }).catch(() => {
      showToast({ message: t('interaction.toastCopyFailed'), variant: 'error' });
      prompt(t('export.copyFallback'), text);
    });
  };

  return (
    <div className="export-center">
      <header className="export-header">
        <div className="export-title">
          <DownloadSimple weight="fill" size={18} />
          <span>{t('export.title')}</span>
        </div>
        <div className="export-subtitle">{t('export.subtitle')}</div>
      </header>

      <div className="export-card">
        <div className="export-row">
          <label>{t('export.sessionId')}</label>
          <input value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="e.g. 2026-01-25-xxxx" />
        </div>
        <div className="export-actions">
          <button type="button" onClick={exportText} className="export-btn">
            <Copy size={16} /> {t('export.copy')}
          </button>
          <button type="button" onClick={() => showToast({ message: t('export.downloadSoon'), variant: 'info', duration: 3000 })} className="export-btn secondary">
            <FileText size={16} /> {t('export.download')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportCenter;

