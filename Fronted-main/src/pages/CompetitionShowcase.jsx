import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowsLeftRight,
  CheckCircle,
  ClockCounterClockwise,
  Cube,
  Database,
  FileText,
  GitBranch,
  MonitorPlay,
  Pulse,
  Stack,
  Target,
  Terminal,
  TreeStructure,
  UsersThree,
} from '@phosphor-icons/react';
import './CompetitionShowcase.css';

const kpiCards = [
  { label: 'API 平均响应', value: '180ms', icon: <Pulse size={18} weight="duotone" />, tone: 'good' },
  { label: '任务调度耗时', value: '1.2s', icon: <GitBranch size={18} weight="duotone" />, tone: 'good' },
  { label: '并发连接数', value: '86', icon: <UsersThree size={18} weight="duotone" />, tone: 'warn' },
  { label: '服务可用性', value: '99.9%', icon: <MonitorPlay size={18} weight="duotone" />, tone: 'good' },
];

const tabs = [
  { id: 'request', title: '请求链路' },
  { id: 'generation', title: '生成链路' },
];

const flowMap = {
  request: [
    { title: 'API Gateway', desc: '接入与参数校验', icon: <FileText size={16} weight="fill" /> },
    { title: 'Auth 校验', desc: '用户权限与 token 校验', icon: <Target size={16} weight="fill" /> },
    { title: 'Session 路由', desc: '读取上下文并恢复状态', icon: <TreeStructure size={16} weight="fill" /> },
    { title: 'Task 调度', desc: '分发任务到执行队列', icon: <GitBranch size={16} weight="fill" /> },
    { title: '持久化', desc: '会话与素材写入存储', icon: <Database size={16} weight="fill" /> },
    { title: '响应返回', desc: 'SSE/JSON 输出执行结果', icon: <ArrowsLeftRight size={16} weight="fill" /> },
  ],
  generation: [
    { title: '需求解析', desc: '解析输入与模式', icon: <FileText size={16} weight="fill" /> },
    { title: '意图澄清', desc: 'assistant 归一化需求', icon: <Target size={16} weight="fill" /> },
    { title: '分镜生成', desc: 'outline 扩展与筛选', icon: <TreeStructure size={16} weight="fill" /> },
    { title: '提示词构建', desc: 'prompt agent 生成参数', icon: <Stack size={16} weight="fill" /> },
    { title: '执行引擎', desc: '调用模型渲染任务', icon: <Cube size={16} weight="fill" /> },
    { title: '结果回传', desc: '落库并返回 URL', icon: <Database size={16} weight="fill" /> },
  ],
};

const apiContracts = [
  {
    name: 'POST /api/v1/work',
    desc: '核心任务入口',
    sample: '{\n  "project_name": "string",\n  "user_input": "string",\n  "mode": "fast|quality",\n  "session_id": "string"\n}',
  },
  {
    name: 'POST /api/v1/projects/new',
    desc: '创建项目会话',
    sample: '{\n  "user_id": "string",\n  "project_name": "string",\n  "workflow_type": "text2video|image2video"\n}',
  },
  {
    name: 'POST /api/v1/upload_image',
    desc: '上传参考素材',
    sample: '{\n  "user_id": "string",\n  "project_name": "string",\n  "figure_name": "string",\n  "file": "binary"\n}',
  },
];

const steps = [
  { label: 'Client Request', desc: '接收前端请求', code: 'POST /api/v1/work {"mode":"fast"}' },
  { label: 'Gateway', desc: '鉴权与参数校验', code: '[gateway] auth=ok payload=ok' },
  { label: 'ACPs Hub', desc: '状态机调度', code: '[acps] load session -> route task' },
  { label: 'Agents Runtime', desc: '多智能体执行', code: 'assistant done | outline done | prompt running' },
  { label: 'Storage', desc: '持久化结果', code: 'UPDATE sessions; INSERT history; PUT video' },
  { label: 'Response', desc: '流式回传结果', code: 'event: done data: {"url":"/videos/demo.mp4"}' },
];

export default function CompetitionShowcase() {
  const [activeTab, setActiveTab] = useState('request');
  const [activeApi, setActiveApi] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const flow = useMemo(() => flowMap[activeTab], [activeTab]);

  useEffect(() => {
    const timer = setInterval(() => setStepIndex((prev) => (prev + 1) % steps.length), 2200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="server-page">
      <header className="hero-card">
        <div>
          <div className="hero-tag">Server Development Dashboard</div>
          <h1>后端服务开发看板</h1>
          <p>高可读模式：展示协议调用、服务链路、接口契约和服务端验收项。</p>
        </div>
        <div className="kpi-grid">
          {kpiCards.map((item) => (
            <div className={`kpi-item ${item.tone}`} key={item.label}>
              <div className="kpi-icon">{item.icon}</div>
              <div>
                <div className="kpi-value">{item.value}</div>
                <div className="kpi-label">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </header>

      <section className="panel">
        <div className="panel-head">
          <h2><Cube size={18} /> ACPs 动态调用过程</h2>
          <span className="status-pill">RUNNING</span>
        </div>
        <div className="grid-2">
          <div className="step-list">
            {steps.map((s, idx) => (
              <div key={s.label} className={`step-row ${idx === stepIndex ? 'active' : ''}`}>
                <span className="step-no">{idx + 1}</span>
                <div>
                  <strong>{s.label}</strong>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="terminal">
            <div className="terminal-head"><Terminal size={14} /> server-protocol.log</div>
            <pre>{steps[stepIndex].code}</pre>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2><TreeStructure size={18} /> 服务链路拆解</h2>
          <div className="tab-row">
            {tabs.map((tab) => (
              <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)} type="button">
                {tab.title}
              </button>
            ))}
          </div>
        </div>
        <div className="flow-row">
          {flow.map((item, idx) => (
            <div className="flow-card" key={item.title}>
              <div className="flow-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
              {idx < flow.length - 1 && <ArrowsLeftRight size={16} className="flow-arrow" />}
            </div>
          ))}
        </div>
      </section>

      <div className="grid-2">
        <section className="panel">
          <h2><Pulse size={18} /> 核心 API 契约</h2>
          <div className="api-grid">
            <div className="api-list">
              {apiContracts.map((api, idx) => (
                <button key={api.name} className={`api-item ${activeApi === idx ? 'active' : ''}`} onClick={() => setActiveApi(idx)} type="button">
                  {api.name}
                </button>
              ))}
            </div>
            <div className="api-detail">
              <div className="api-title">{apiContracts[activeApi].desc}</div>
              <pre>{apiContracts[activeApi].sample}</pre>
            </div>
          </div>
        </section>

        <section className="panel">
          <h2><CheckCircle size={18} /> 服务端验收项</h2>
          <ul className="check-list">
            <li><Target size={16} /><div><strong>请求校验完整</strong><p>参数与权限双重校验，异常请求可追踪。</p></div></li>
            <li><ClockCounterClockwise size={16} /><div><strong>状态回溯可恢复</strong><p>基于 session 状态机支持断点续跑。</p></div></li>
            <li><Database size={16} /><div><strong>存储一致性稳定</strong><p>执行日志、会话状态、素材地址一致。</p></div></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
