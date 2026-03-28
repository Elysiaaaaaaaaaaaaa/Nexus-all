import React from 'react';
import { isNativeMobileLayout } from '../utils/runtimePlatform';
import Layout from './Layout.jsx';
import MobileLayout from '../layouts/MobileLayout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

/**
 * 受保护路由：Web 用 Layout + web 页；Capacitor 用 MobileLayout + mobile 页（未提供 mobile 时回退 web）
 * @param {{ web: React.ComponentType<any>; mobile?: React.ComponentType<any>; mobileShellProps?: Record<string, unknown> }} props
 */
export function ProtectedLayoutRoute({ web: Web, mobile: Mobile, mobileShellProps = {} }) {
  const native = isNativeMobileLayout();
  const Page = native && Mobile ? Mobile : Web;
  const Shell = native ? MobileLayout : Layout;

  return (
    <ProtectedRoute>
      <Shell {...(native ? mobileShellProps : {})}>
        <Page />
      </Shell>
    </ProtectedRoute>
  );
}
