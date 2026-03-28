import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TerminalWindow, Lightning } from '@phosphor-icons/react';
import { isNativeMobileLayout } from '../utils/runtimePlatform';
import './AcpsBoard.css';

const AcpsBoard = () => {
  const navigate = useNavigate();
  const nativeMobile = isNativeMobileLayout();

  const handleBack = () => {
    navigate(-1);
  };

  const executionLogs = [
    { id: 1, level: 'info', message: '正在初始化沙盒环境...' },
    { id: 2, level: 'info', message: '注入场景资源: [rain_texture_v2]' },
    { id: 3, level: 'info', message: '编译着色器...' },
    { id: 4, level: 'success', message: '成功：场景 "新东京" 已渲染。' },
  ];

  const systemMetrics = {
    vram: '4.2 GB',
    frameTime: '12.4ms',
    fps: '24fps',
    latency: '1.2ms',
  };

  return (
    <div className={`acps-board-page${nativeMobile ? ' acps-board-page--native-shell' : ''}`}>
      {!nativeMobile && (
        <header className="acps-board-header">
          <button type="button" className="acps-board-back" onClick={handleBack}>
            <ArrowLeft size={18} weight="bold" aria-hidden />
            返回
          </button>
          <div className="acps-board-title-wrap">
            <TerminalWindow size={18} weight="fill" aria-hidden />
            <h1 className="acps-board-title">ACPS 协议调用看板（设计版）</h1>
          </div>
        </header>
      )}

      <main className="acps-board-grid">
        <section className="acps-card">
          <div className="acps-card-title">实时执行</div>
          <div className="acps-log-list">
            {executionLogs.map((log) => (
              <div key={log.id} className={`acps-log-item ${log.level}`}>
                <span className="acps-log-dot" />
                <span className="acps-log-text">{log.message}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="acps-card">
          <div className="acps-card-title">活动模拟</div>
          <div className="acps-quote">
            “雨滴在霓虹灯闪烁中闪闪发光，24fps。湿路面上的反射实时更新。”
          </div>
        </section>

        <section className="acps-card">
          <div className="acps-card-title">系统指标</div>
          <div className="acps-metrics-grid">
            <div className="acps-metric-card">
              <div className="acps-metric-label">显存使用</div>
              <div className="acps-metric-value">{systemMetrics.vram}</div>
            </div>
            <div className="acps-metric-card">
              <div className="acps-metric-label">帧时间</div>
              <div className="acps-metric-value">{systemMetrics.frameTime}</div>
            </div>
            <div className="acps-metric-card">
              <div className="acps-metric-label">FPS</div>
              <div className="acps-metric-value">{systemMetrics.fps}</div>
            </div>
            <div className="acps-metric-card">
              <div className="acps-metric-label">延迟</div>
              <div className="acps-metric-value">{systemMetrics.latency}</div>
            </div>
          </div>
        </section>

        <section className="acps-card">
          <div className="acps-card-title">任务/素材</div>
          <div className="acps-task-list">
            <div className="acps-task-item">
              <span>当前任务</span>
              <span>分镜生成</span>
            </div>
            <div className="acps-task-item">
              <span>阶段</span>
              <span>outline</span>
            </div>
            <div className="acps-task-item">
              <span>进度</span>
              <span>42%</span>
            </div>
          </div>
          <div className="acps-material-title">
            <Lightning size={14} weight="fill" />
            创作素材
          </div>
          <ul className="acps-material-list">
            <li>第一镜：雨夜街道远景</li>
            <li>第二镜：角色特写，霓虹反射</li>
          </ul>
        </section>
      </main>
    </div>
  );
};

export default AcpsBoard;

