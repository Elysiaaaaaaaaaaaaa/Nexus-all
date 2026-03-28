import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { messages } from '../i18n/messages';

const AppContext = createContext();

function readAuthTokenTrimmed() {
  try {
    const t = localStorage.getItem('auth_token');
    return t && String(t).trim() !== '' ? String(t).trim() : '';
  } catch {
    return '';
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('app-language');
    return saved || 'zh-CN';
  });

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('app-theme');
    return saved || 'light';
  });

  // 用户认证管理
  const [userId, setUserId] = useState(() => {
    return localStorage.getItem('app-user-id') || null;
  });

  const [userInfo, setUserInfo] = useState(() => {
    const token = readAuthTokenTrimmed();
    const saved = localStorage.getItem('app-user-info');
    // 无 token 时不应展示「已登录」资料；顺带清掉上次登录残留的 app-user-info（匿名场景本来就不会写该键）
    if (!token) {
      if (saved) {
        try {
          localStorage.removeItem('app-user-info');
        } catch {
          /* ignore */
        }
      }
      return null;
    }
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      try {
        localStorage.removeItem('app-user-info');
      } catch {
        /* ignore */
      }
      return null;
    }
  });

  const updateUserId = (newUserId) => {
    if (newUserId) {
      localStorage.setItem('app-user-id', newUserId);
      setUserId(newUserId);
    }
  };

  const updateUserInfo = (info) => {
    setUserInfo(info);
    if (info == null) {
      localStorage.removeItem('app-user-info');
      return;
    }
    localStorage.setItem('app-user-info', JSON.stringify(info));
  };

  // 登录态：历史写法 userId && userInfo 在 JS 中会得到 userInfo 对象而非 boolean，易导致判断/日志困惑
  const isAuthenticated = userId && userInfo;
  const hasProfile =
    typeof userInfo === 'object' &&
    userInfo != null &&
    ((typeof userInfo.username === 'string' && userInfo.username.trim() !== '') ||
      (typeof userInfo.email === 'string' && userInfo.email.trim() !== ''));
  // 必须同时有 access token，否则仅 localStorage 里残留的用户资料也会被判成「已登录」
  const hasValidToken = readAuthTokenTrimmed() !== '';
  const safeIsAuthenticated = Boolean(
    hasValidToken &&
    userId &&
    String(userId).trim() !== '' &&
    hasProfile
  );

  // 登出函数
  const logout = () => {
    localStorage.removeItem('app-user-id');
    localStorage.removeItem('app-user-info');
    localStorage.removeItem('auth_token');
    setUserId(null);
    setUserInfo(null);
  };

  useEffect(() => {
    localStorage.setItem('app-language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (resolvedTheme) => {
      const next = resolvedTheme === 'dark' ? 'dark' : 'light';
      root.classList.remove('dark', 'light');
      root.classList.add(next);
      root.dataset.theme = next;
    };

    if (theme === 'auto') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(media.matches ? 'dark' : 'light');
      const handler = (e) => applyTheme(e.matches ? 'dark' : 'light');
      media.addEventListener?.('change', handler);
      return () => media.removeEventListener?.('change', handler);
    }

    // 手动主题：直接应用
    applyTheme(theme);
  }, [theme]);

  const t = useMemo(() => {
    const dict = messages[language] || messages['zh-CN'];
    const fallback = messages['zh-CN'];

    const get = (obj, path) => {
      return path.split('.').reduce((acc, key) => (acc && acc[key] != null ? acc[key] : undefined), obj);
    };

    return (key, vars) => {
      const raw = get(dict, key) ?? get(fallback, key) ?? key;
      if (!vars) return raw;
      return String(raw).replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
    };
  }, [language]);

  return (
    <AppContext.Provider value={{
      language,
      setLanguage,
      theme,
      setTheme,
      userId,
      setUserId: updateUserId,
      userInfo,
      setUserInfo: updateUserInfo,
      isAuthenticated,
      safeIsAuthenticated,
      logout,
      t
    }}>
      {children}
    </AppContext.Provider>
  );
};
