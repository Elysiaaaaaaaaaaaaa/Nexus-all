import React, { useCallback, useState } from 'react';
import './SessionVideoPlayers.css';

/**
 * 处理视频URL，去除域名和端口部分，只保留 /videos/... 路径
 * @param {string} url - 完整的视频URL
 * @returns {string} - 处理后的相对路径
 */
function processVideoUrl(url) {
  if (!url) return url;
  
  // 匹配并移除 http:// 或 https:// 开头的域名和端口部分
  let processedUrl = url.replace(/^https?:\/\/[^/]+/, '');
  
  // 确保路径以斜杠开头
  if (!processedUrl.startsWith('/')) {
    processedUrl = '/' + processedUrl;
  }
  
  return processedUrl;
}

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
        {urls.map((src, i) => {
          const processedSrc = processVideoUrl(src);
          return (
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
                  <source src={processedSrc} type="video/mp4" />
                  <source src={processedSrc} type="video/webm" />
                  <source src={processedSrc} type="video/avi" />
                  <source src={processedSrc} type="video/mov" />
                  <source src={processedSrc} type="video/wmv" />
                  <source src={processedSrc} type="video/flv" />
                  <source src={processedSrc} type="video/mkv" />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
