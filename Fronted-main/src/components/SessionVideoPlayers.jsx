import React, { useCallback, useState } from 'react';
import './SessionVideoPlayers.css';

/**
 * @param {{ urls: string[]; title?: string; emptyHint?: string; variant?: 'dark' | 'light' }} props
 */
export function SessionVideoPlayers({ urls, title, emptyHint, variant = 'dark' }) {
  const [broken, setBroken] = useState({});

  const onVideoError = useCallback((index) => {
    setBroken((prev) => ({ ...prev, [index]: true }));
  }, []);

  if (!urls || urls.length === 0) {
    return null;
  }

  return (
    <div
      className={`nx-session-videos${variant === 'light' ? ' nx-session-videos--light' : ''}`}
      data-session-videos
    >
      {title ? <div className="nx-session-videos-title">{title}</div> : null}
      <div className="nx-session-videos-list">
        {urls.map((src, i) => (
          <div key={`${src}-${i}`} className="nx-session-video-item">
            {broken[i] ? (
              <p className="nx-session-video-fallback">{emptyHint || '—'}</p>
            ) : (
              <video
                className="nx-session-video"
                controls
                playsInline
                preload="metadata"
                onError={() => onVideoError(i)}
              >
                <source src={src} type="video/mp4" />
                <source src={src} type="video/webm" />
                <source src={src} type="video/avi" />
                <source src={src} type="video/mov" />
                <source src={src} type="video/wmv" />
                <source src={src} type="video/flv" />
                <source src={src} type="video/mkv" />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
