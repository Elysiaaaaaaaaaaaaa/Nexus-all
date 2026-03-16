import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { messages } from '../i18n/messages';

const AppContext = createContext();

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
    const saved = localStorage.getItem('app-user-info');
    return saved ? JSON.parse(saved) : null;
  });

  const updateUserId = (newUserId) => {
    if (newUserId) {
      localStorage.setItem('app-user-id', newUserId);
      setUserId(newUserId);
    }
  };

  const updateUserInfo = (info) => {
    setUserInfo(info);
    localStorage.setItem('app-user-info', JSON.stringify(info));
  };

  // 检查用户是否已登录
  const isAuthenticated = userId && userInfo;

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
      logout,
      t
    }}>
      {children}
    </AppContext.Provider>
  );
};
