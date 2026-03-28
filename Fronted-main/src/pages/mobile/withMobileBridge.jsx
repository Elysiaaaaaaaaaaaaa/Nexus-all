import React from 'react';
import './mobile-bridge.css';

/**
 * 过渡方案：将现有 Web 页包一层，统一滚动与安全区；后续可替换为独立 *Mobile.jsx
 * @param {React.ComponentType<any>} WebComponent
 * @returns {React.ComponentType<any>}
 */
export function withMobileBridge(WebComponent) {
  function MobileBridge(props) {
    return (
      <div className="mobile-native-bridge" data-mobile-bridge>
        <WebComponent {...props} />
      </div>
    );
  }

  const name = WebComponent.displayName || WebComponent.name || 'Component';
  MobileBridge.displayName = `MobileBridge(${name})`;
  return MobileBridge;
}
