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
  { label: 'API 平均响应', value: '180ms', icon: <Pulse size={20} weight="duotone" />, tone: 'good' },
  { label: '任务调度耗时', value: '1.2s', icon: <GitBranch size={20} weight="duotone" />, tone: 'good' },
  { label: '并发连接数', value: '86', icon: <UsersThree size={20} weight="duotone" />, tone: 'warn' },
  { label: '服务可用性', value: '99.9%', icon: <MonitorPlay size={20} weight="duotone" />, tone: 'good' },
];

const serviceTabs = [
  { id: 'request', title: '请求处理链路' },
  { id: 'generation', title: '内容生成链路' },
];

const flowMap = {
  request: [
    { title: 'API Gateway', desc: '接入请求并校验协议头', icon: <FileText size={18} weight="fill" /> },
    { title: 'Auth 校验', desc: '验证 Token 与权限范围', icon: <Target size={18} weight="fill" /> },
    { title: 'Session 路由', desc: '定位会话并装载上下文', icon: <TreeStructure size={18} weight="fill" /> },
    { title: 'Task 调度', desc: '分发到对应 Agent 队列', icon: <GitBranch size={18} weight="fill" /> },
    { title: '数据持久化', desc: '写入 DB 与对象存储', icon: <Database size={18} weight="fill" /> },
    { title: 'SSE/JSON 返回', desc: '流式输出执行进度与结果', icon: <ArrowsLeftRight size={18} weight="fill" /> },
  ],
  generation: [
    { title: '需求解析', desc: '解析 user_input 与 mode', icon: <FileText size={18} weight="fill" /> },
    { title: '意图澄清', desc: 'assistant 归一化输入', icon: <Target size={18} weight="fill" /> },
    { title: '分镜生成', desc: 'outline 扩展分支并评估', icon: <TreeStructure size={18} weight="fill" /> },
    { title: '提示词构建', desc: 'prompt agent 产出结构化参数', icon: <Stack size={18} weight="fill" /> },
    { title: '执行引擎', desc: '调用模型执行渲染任务', icon: <Cube size={18} weight="fill" /> },
    { title: '结果回传', desc: '落库并推送 URL 与状态', icon: <Database size={18} weight="fill" /> },
  ],
};

const apiContracts = [
  {
    name: 'POST /api/v1/work',
    purpose: '核心任务入口',
    key: '{\n  "project_name": "string",\n  "user_input": "string",\n  "mode": "fast|quality",\n  "session_id": "string"\n}',
  },
  {
    name: 'POST /api/v1/projects/new',
    purpose: '创建会话项目',
    key: '{\n  "user_id": "string",\n  "project_name": "string",\n  "workflow_type": "text2video|image2video"\n}',
  },
  {
    name: 'POST /api/v1/upload_image',
    purpose: '上传参考素材',
    key: '{\n  "user_id": "string",\n  "project_name": "string",\n  "figure_name": "string",\n  "file": "binary"\n}',
  },
  {
    name: 'POST /api/v1/projects/history',
    purpose: '恢复项目历史',
    key: '{\n  "user_id": "string",\n  "project_name": "string"\n}',
  },
];

const acpsSteps = [
  {
    id: 'client',
    label: 'Client Request',
    desc: '发起工作流请求',
    code: 'POST /api/v1/work\nX-Request-ID: req_1024\n{"mode":"fast","project_name":"demo"}',
  },
  {
    id: 'gateway',
    label: 'Gateway & ACL',
    desc: '校验鉴权与参数',
    code: '[gateway] auth=ok\n[gateway] payload validated\n[gateway] route -> acps_hub',
  },
  {
    id: 'hub',
    label: 'ACPs Hub',
    desc: '状态机路由和调度',
    code: '[acps] session loaded\n[acps] task=outline_generate\n[acps] dispatch -> agent_queue',
  },
  {
    id: 'agents',
    label: 'Agents Runtime',
    desc: '多智能体协作执行',
    code: 'assistant: done\noutline: done\nprompt: running...\nprogress=66%',
  },
  {
    id: 'storage',
    label: 'DB & Object Store',
    desc: '持久化状态和素材',
    code: 'UPDATE sessions SET now_state="rendering"\nINSERT INTO chat_history (...)\nPUT /videos/demo_01.mp4',
  },
  {
    id: 'response',
    label: 'Stream Response',
    desc: '向前端回传结果',
    code: 'event: step\ndata: {"status":"done","url":"/videos/demo_01.mp4"}',
  },
];

const CompetitionShowcase = () => {
  const [activeService, setActiveService] = useState('request');
  const [activeApi, setActiveApi] = useState(0);
  const [acpsStepIndex, setAcpsStepIndex] = useState(0);
  const activeFlow = useMemo(() => flowMap[activeService], [activeService]);

  useEffect(() => {
    const timer = setInterval(() => {
      setAcpsStepIndex((prev) => (prev + 1) % acpsSteps.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="server-showcase">
      <header className="hero-section">
        <div className="hero-content">
          <span className="hero-tag">Server Development Dashboard</span>
          <h1>后端服务开发与协议调度看板</h1>
          <p>聚焦 API 接入、ACPs 协议调度、任务执行与数据持久化，展示服务端完整处理过程。</p>
        </div>
        <div className="kpi-dashboard">
          {kpiCards.map((item) => (
            <div key={item.label} className={`kpi-card ${item.tone}`}>
              <div className="kpi-icon-wrap">{item.icon}</div>
              <div className="kpi-data">
                <span className="kpi-val">{item.value}</span>
                <span className="kpi-lbl">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <div className="title-group">
            <Cube size={22} weight="duotone" />
            <h2>ACPs 协议动态调用过程</h2>
          </div>
          <span className="live-badge">RUNNING</span>
        </div>
        <div className="architecture-grid">
          <div className="topo-map">
            {acpsSteps.map((step, index) => {
              const isActive = index === acpsStepIndex;
              const isPassed = index < acpsStepIndex;
              return (
                <div key={step.id} className={`topo-node ${isActive ? 'active' : ''} ${isPassed ? 'passed' : ''}`}>
                  <div className="node-marker">{index + 1}</div>
                  <div className="node-info">
                    <h4>{step.label}</h4>
                    <p>{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="protocol-terminal">
            <div className="terminal-header">
              <span className="terminal-title">
                <Terminal size={14} weight="bold" />
                server-protocol.log
              </span>
            </div>
            <div className="terminal-body">
              <pre>
                <code>{acpsSteps[acpsStepIndex].code}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>
            <TreeStructure size={22} weight="duotone" /> 服务链路拆解
          </h2>
          <div className="tabs">
            {serviceTabs.map((tab) => (
              <button key={tab.id} type="button" className={`tab-btn ${activeService === tab.id ? 'active' : ''}`} onClick={() => setActiveService(tab.id)}>
                {tab.title}
              </button>
            ))}
          </div>
        </div>
        <div className="flow-stepper">
          {activeFlow.map((step, idx) => (
            <div key={step.title} className="step-card">
              <div className="step-icon">{step.icon}</div>
              <div className="step-content">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
              {idx < activeFlow.length - 1 && <ArrowsLeftRight size={18} className="step-arrow" />}
            </div>
          ))}
        </div>
      </section>

      <div className="bottom-grid">
        <section className="panel">
          <h2>
            <Pulse size={22} weight="duotone" /> 核心 API 契约
          </h2>
          <div className="api-layout">
            <div className="api-list">
              {apiContracts.map((api, index) => (
                <button key={api.name} type="button" className={`api-list-item ${activeApi === index ? 'active' : ''}`} onClick={() => setActiveApi(index)}>
                  {api.name}
                </button>
              ))}
            </div>
            <div className="api-detail">
              <div className="detail-title">{apiContracts[activeApi].purpose}</div>
              <pre>
                <code>{apiContracts[activeApi].key}</code>
              </pre>
            </div>
          </div>
        </section>

        <section className="panel">
          <h2>
            <CheckCircle size={22} weight="duotone" /> 服务端验收项
          </h2>
          <ul className="check-list">
            <li>
              <Target size={18} weight="duotone" />
              <div>
                <strong>请求校验完整</strong>
                <p>参数与权限双重校验，非法请求可追踪。</p>
              </div>
            </li>
            <li>
              <ClockCounterClockwise size={18} weight="duotone" />
              <div>
                <strong>状态回溯可恢复</strong>
                <p>基于 session 状态机支持断点续跑与重试。</p>
              </div>
            </li>
            <li>
              <Database size={18} weight="duotone" />
              <div>
                <strong>存储一致性稳定</strong>
                <p>执行日志、会话状态、素材地址保持一致。</p>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default CompetitionShowcase;
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
  { label: 'API 平均响应', value: '180ms', icon: <Pulse size={20} weight="duotone" />, tone: 'good' },
  { label: '任务调度耗时', value: '1.2s', icon: <GitBranch size={20} weight="duotone" />, tone: 'good' },
  { label: '并发连接数', value: '86', icon: <UsersThree size={20} weight="duotone" />, tone: 'warn' },
  { label: '服务可用性', value: '99.9%', icon: <MonitorPlay size={20} weight="duotone" />, tone: 'good' },
];

const serviceTabs = [
  { id: 'request', title: '请求处理链路' },
  { id: 'generation', title: '内容生成链路' },
];

const flowMap = {
  request: [
    { title: 'API Gateway', desc: '接入请求并校验协议头', icon: <FileText size={18} weight="fill" /> },
    { title: 'Auth 校验', desc: '验证 Token 与权限范围', icon: <Target size={18} weight="fill" /> },
    { title: 'Session 路由', desc: '定位会话并装载上下文', icon: <TreeStructure size={18} weight="fill" /> },
    { title: 'Task 调度', desc: '分发到对应 Agent 队列', icon: <GitBranch size={18} weight="fill" /> },
    { title: '数据持久化', desc: '写入 DB 与对象存储', icon: <Database size={18} weight="fill" /> },
    { title: 'SSE/JSON 返回', desc: '流式输出执行进度与结果', icon: <ArrowsLeftRight size={18} weight="fill" /> },
  ],
  generation: [
    { title: '需求解析', desc: '解析 user_input 与 mode', icon: <FileText size={18} weight="fill" /> },
    { title: '意图澄清', desc: 'assistant 归一化输入', icon: <Target size={18} weight="fill" /> },
    { title: '分镜生成', desc: 'outline 扩展分支并评估', icon: <TreeStructure size={18} weight="fill" /> },
    { title: '提示词构建', desc: 'prompt agent 产出结构化参数', icon: <Stack size={18} weight="fill" /> },
    { title: '执行引擎', desc: '调用模型执行渲染任务', icon: <Cube size={18} weight="fill" /> },
    { title: '结果回传', desc: '落库并推送 URL 与状态', icon: <Database size={18} weight="fill" /> },
  ],
};

const apiContracts = [
  {
    name: 'POST /api/v1/work',
    purpose: '核心任务入口',
    key: '{\n  "project_name": "string",\n  "user_input": "string",\n  "mode": "fast|quality",\n  "session_id": "string"\n}',
  },
  {
    name: 'POST /api/v1/projects/new',
    purpose: '创建会话项目',
    key: '{\n  "user_id": "string",\n  "project_name": "string",\n  "workflow_type": "text2video|image2video"\n}',
  },
  {
    name: 'POST /api/v1/upload_image',
    purpose: '上传参考素材',
    key: '{\n  "user_id": "string",\n  "project_name": "string",\n  "figure_name": "string",\n  "file": "binary"\n}',
  },
  {
    name: 'POST /api/v1/projects/history',
    purpose: '恢复项目历史',
    key: '{\n  "user_id": "string",\n  "project_name": "string"\n}',
  },
];

const acpsSteps = [
  {
    id: 'client',
    label: 'Client Request',
    desc: '发起工作流请求',
    code: 'POST /api/v1/work\nX-Request-ID: req_1024\n{"mode":"fast","project_name":"demo"}',
  },
  {
    id: 'gateway',
    label: 'Gateway & ACL',
    desc: '校验鉴权与参数',
    code: '[gateway] auth=ok\n[gateway] payload validated\n[gateway] route -> acps_hub',
  },
  {
    id: 'hub',
    label: 'ACPs Hub',
    desc: '状态机路由和调度',
    code: '[acps] session loaded\n[acps] task=outline_generate\n[acps] dispatch -> agent_queue',
  },
  {
    id: 'agents',
    label: 'Agents Runtime',
    desc: '多智能体协作执行',
    code: 'assistant: done\noutline: done\nprompt: running...\nprogress=66%',
  },
  {
    id: 'storage',
    label: 'DB & Object Store',
    desc: '持久化状态和素材',
    code: 'UPDATE sessions SET now_state="rendering"\nINSERT INTO chat_history (...)\nPUT /videos/demo_01.mp4',
  },
  {
    id: 'response',
    label: 'Stream Response',
    desc: '向前端回传结果',
    code: 'event: step\ndata: {"status":"done","url":"/videos/demo_01.mp4"}',
  },
];

const CompetitionShowcase = () => {
  const [activeService, setActiveService] = useState('request');
  const [activeApi, setActiveApi] = useState(0);
  const [acpsStepIndex, setAcpsStepIndex] = useState(0);
  const activeFlow = useMemo(() => flowMap[activeService], [activeService]);

  useEffect(() => {
    const timer = setInterval(() => {
      setAcpsStepIndex((prev) => (prev + 1) % acpsSteps.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="server-showcase">
      <header className="hero-section">
        <div className="hero-content">
          <span className="hero-tag">Server Development Dashboard</span>
          <h1>后端服务开发与协议调度看板</h1>
          <p>聚焦 API 接入、ACPs 协议调度、任务执行与数据持久化，展示服务端完整处理过程。</p>
        </div>
        <div className="kpi-dashboard">
          {kpiCards.map((item) => (
            <div key={item.label} className={`kpi-card ${item.tone}`}>
              <div className="kpi-icon-wrap">{item.icon}</div>
              <div className="kpi-data">
                <span className="kpi-val">{item.value}</span>
                <span className="kpi-lbl">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <div className="title-group">
            <Cube size={22} weight="duotone" />
            <h2>ACPs 协议动态调用过程</h2>
          </div>
          <span className="live-badge">RUNNING</span>
        </div>
        <div className="architecture-grid">
          <div className="topo-map">
            {acpsSteps.map((step, index) => {
              const isActive = index === acpsStepIndex;
              const isPassed = index < acpsStepIndex;
              return (
                <div key={step.id} className={`topo-node ${isActive ? 'active' : ''} ${isPassed ? 'passed' : ''}`}>
                  <div className="node-marker">{index + 1}</div>
                  <div className="node-info">
                    <h4>{step.label}</h4>
                    <p>{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="protocol-terminal">
            <div className="terminal-header">
              <span className="terminal-title">
                <Terminal size={14} weight="bold" />
                server-protocol.log
              </span>
            </div>
            <div className="terminal-body">
              <pre>
                <code>{acpsSteps[acpsStepIndex].code}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>
            <TreeStructure size={22} weight="duotone" /> 服务链路拆解
          </h2>
          <div className="tabs">
            {serviceTabs.map((tab) => (
              <button key={tab.id} type="button" className={`tab-btn ${activeService === tab.id ? 'active' : ''}`} onClick={() => setActiveService(tab.id)}>
                {tab.title}
              </button>
            ))}
          </div>
        </div>
        <div className="flow-stepper">
          {activeFlow.map((step, idx) => (
            <div key={step.title} className="step-card">
              <div className="step-icon">{step.icon}</div>
              <div className="step-content">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
              {idx < activeFlow.length - 1 && <ArrowsLeftRight size={18} className="step-arrow" />}
            </div>
          ))}
        </div>
      </section>

      <div className="bottom-grid">
        <section className="panel">
          <h2>
            <Pulse size={22} weight="duotone" /> 核心 API 契约
          </h2>
          <div className="api-layout">
            <div className="api-list">
              {apiContracts.map((api, index) => (
                <button key={api.name} type="button" className={`api-list-item ${activeApi === index ? 'active' : ''}`} onClick={() => setActiveApi(index)}>
                  {api.name}
                </button>
              ))}
            </div>
            <div className="api-detail">
              <div className="detail-title">{apiContracts[activeApi].purpose}</div>
              <pre>
                <code>{apiContracts[activeApi].key}</code>
              </pre>
            </div>
          </div>
        </section>

        <section className="panel">
          <h2>
            <CheckCircle size={22} weight="duotone" /> 服务端验收项
          </h2>
          <ul className="check-list">
            <li>
              <Target size={18} weight="duotone" />
              <div>
                <strong>请求校验完整</strong>
                <p>参数与权限双重校验，非法请求可追踪。</p>
              </div>
            </li>
            <li>
              <ClockCounterClockwise size={18} weight="duotone" />
              <div>
                <strong>状态回溯可恢复</strong>
                <p>基于 session 状态机支持断点续跑与重试。</p>
              </div>
            </li>
            <li>
              <Database size={18} weight="duotone" />
              <div>
                <strong>存储一致性稳定</strong>
                <p>执行日志、会话状态、素材地址保持一致。</p>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default CompetitionShowcase;

const kpiCards = [
  { label: 'API 平均响应', value: '180ms', icon: <Pulse size={20} weight="duotone" />, tone: 'good' },
  { label: '任务调度耗时', value: '1.2s', icon: <GitBranch size={20} weight="duotone" />, tone: 'good' },
  { label: '并发连接数', value: '86', icon: <UsersThree size={20} weight="duotone" />, tone: 'warn' },
  { label: '服务可用性', value: '99.9%', icon: <MonitorPlay size={20} weight="duotone" />, tone: 'good' },
];

const serviceTabs = [
  { id: 'request', title: '请求处理链路' },
  { id: 'generation', title: '内容生成链路' },
];

const flowMap = {
  request: [
    { title: 'API Gateway', desc: '接入请求并校验协议头', icon: <FileText size={18} weight="fill" /> },
    { title: 'Auth 校验', desc: '验证 Token 与权限范围', icon: <Target size={18} weight="fill" /> },
    { title: 'Session 路由', desc: '定位会话并装载上下文', icon: <TreeStructure size={18} weight="fill" /> },
    { title: 'Task 调度', desc: '分发到对应 Agent 队列', icon: <GitBranch size={18} weight="fill" /> },
    { title: '数据持久化', desc: '写入 DB 与对象存储', icon: <Database size={18} weight="fill" /> },
    { title: 'SSE/JSON 返回', desc: '流式输出执行进度与结果', icon: <ArrowsLeftRight size={18} weight="fill" /> },
  ],
  generation: [
    { title: '需求解析', desc: '解析 user_input 与 mode', icon: <FileText size={18} weight="fill" /> },
    { title: '意图澄清', desc: 'assistant 归一化输入', icon: <Target size={18} weight="fill" /> },
    { title: '分镜生成', desc: 'outline 扩展分支并评估', icon: <TreeStructure size={18} weight="fill" /> },
    { title: '提示词构建', desc: 'prompt agent 产出结构化参数', icon: <Stack size={18} weight="fill" /> },
    { title: '执行引擎', desc: '调用模型执行渲染任务', icon: <Cube size={18} weight="fill" /> },
    { title: '结果回传', desc: '落库并推送 URL 与状态', icon: <Database size={18} weight="fill" /> },
  ],
};

const apiContracts = [
  {
    name: 'POST /api/v1/work',
    purpose: '核心任务入口',
    key: '{\n  "project_name": "string",\n  "user_input": "string",\n  "mode": "fast|quality",\n  "session_id": "string"\n}',
  },
  {
    name: 'POST /api/v1/projects/new',
    purpose: '创建会话项目',
    key: '{\n  "user_id": "string",\n  "project_name": "string",\n  "workflow_type": "text2video|image2video"\n}',
  },
  {
    name: 'POST /api/v1/upload_image',
    purpose: '上传参考素材',
    key: '{\n  "user_id": "string",\n  "project_name": "string",\n  "figure_name": "string",\n  "file": "binary"\n}',
  },
  {
    name: 'POST /api/v1/projects/history',
    purpose: '恢复项目历史',
    key: '{\n  "user_id": "string",\n  "project_name": "string"\n}',
  },
];

const acpsSteps = [
  {
    id: 'client',
    label: 'Client Request',
    desc: '发起工作流请求',
    code: 'POST /api/v1/work\nX-Request-ID: req_1024\n{"mode":"fast","project_name":"demo"}',
  },
  {
    id: 'gateway',
    label: 'Gateway & ACL',
    desc: '校验鉴权与参数',
    code: '[gateway] auth=ok\n[gateway] payload validated\n[gateway] route -> acps_hub',
  },
  {
    id: 'hub',
    label: 'ACPs Hub',
    desc: '状态机路由和调度',
    code: '[acps] session loaded\n[acps] task=outline_generate\n[acps] dispatch -> agent_queue',
  },
  {
    id: 'agents',
    label: 'Agents Runtime',
    desc: '多智能体协作执行',
    code: 'assistant: done\noutline: done\nprompt: running...\nprogress=66%',
  },
  {
    id: 'storage',
    label: 'DB & Object Store',
    desc: '持久化状态和素材',
    code: 'UPDATE sessions SET now_state="rendering"\nINSERT INTO chat_history (...)\nPUT /videos/demo_01.mp4',
  },
  {
    id: 'response',
    label: 'Stream Response',
    desc: '向前端回传结果',
    code: 'event: step\ndata: {"status":"done","url":"/videos/demo_01.mp4"}',
  },
];

const CompetitionShowcase = () => {
  const [activeService, setActiveService] = useState('request');
  const [activeApi, setActiveApi] = useState(0);
  const [acpsStepIndex, setAcpsStepIndex] = useState(0);
  const activeFlow = useMemo(() => flowMap[activeService], [activeService]);

  useEffect(() => {
    const timer = setInterval(() => {
      setAcpsStepIndex((prev) => (prev + 1) % acpsSteps.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="server-showcase">
      <header className="hero-section">
        <div className="hero-content">
          <span className="hero-tag">Server Development Dashboard</span>
          <h1>后端服务开发与协议调度看板</h1>
          <p>聚焦 API 接入、ACPs 协议调度、任务执行与数据持久化，展示服务端完整处理过程。</p>
        </div>
        <div className="kpi-dashboard">
          {kpiCards.map((item) => (
            <div key={item.label} className={`kpi-card ${item.tone}`}>
              <div className="kpi-icon-wrap">{item.icon}</div>
              <div className="kpi-data">
                <span className="kpi-val">{item.value}</span>
                <span className="kpi-lbl">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <div className="title-group">
            <Cube size={22} weight="duotone" />
            <h2>ACPs 协议动态调用过程</h2>
          </div>
          <span className="live-badge">RUNNING</span>
        </div>
        <div className="architecture-grid">
          <div className="topo-map">
            {acpsSteps.map((step, index) => {
              const isActive = index === acpsStepIndex;
              const isPassed = index < acpsStepIndex;
              return (
                <div key={step.id} className={`topo-node ${isActive ? 'active' : ''} ${isPassed ? 'passed' : ''}`}>
                  <div className="node-marker">{index + 1}</div>
                  <div className="node-info">
                    <h4>{step.label}</h4>
                    <p>{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="protocol-terminal">
            <div className="terminal-header">
              <span className="terminal-title">
                <Terminal size={14} weight="bold" />
                server-protocol.log
              </span>
            </div>
            <div className="terminal-body">
              <pre>
                <code>{acpsSteps[acpsStepIndex].code}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>
            <TreeStructure size={22} weight="duotone" /> 服务链路拆解
          </h2>
          <div className="tabs">
            {serviceTabs.map((tab) => (
              <button key={tab.id} type="button" className={`tab-btn ${activeService === tab.id ? 'active' : ''}`} onClick={() => setActiveService(tab.id)}>
                {tab.title}
              </button>
            ))}
          </div>
        </div>
        <div className="flow-stepper">
          {activeFlow.map((step, idx) => (
            <div key={step.title} className="step-card">
              <div className="step-icon">{step.icon}</div>
              <div className="step-content">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
              {idx < activeFlow.length - 1 && <ArrowsLeftRight size={18} className="step-arrow" />}
            </div>
          ))}
        </div>
      </section>

      <div className="bottom-grid">
        <section className="panel">
          <h2>
            <Pulse size={22} weight="duotone" /> 核心 API 契约
          </h2>
          <div className="api-layout">
            <div className="api-list">
              {apiContracts.map((api, index) => (
                <button key={api.name} type="button" className={`api-list-item ${activeApi === index ? 'active' : ''}`} onClick={() => setActiveApi(index)}>
                  {api.name}
                </button>
              ))}
            </div>
            <div className="api-detail">
              <div className="detail-title">{apiContracts[activeApi].purpose}</div>
              <pre>
                <code>{apiContracts[activeApi].key}</code>
              </pre>
            </div>
          </div>
        </section>

        <section className="panel">
          <h2>
            <CheckCircle size={22} weight="duotone" /> 服务端验收项
          </h2>
          <ul className="check-list">
            <li>
              <Target size={18} weight="duotone" />
              <div>
                <strong>请求校验完整</strong>
                <p>参数与权限双重校验，非法请求可追踪。</p>
              </div>
            </li>
            <li>
              <ClockCounterClockwise size={18} weight="duotone" />
              <div>
                <strong>状态回溯可恢复</strong>
                <p>基于 session 状态机支持断点续跑与重试。</p>
              </div>
            </li>
            <li>
              <Database size={18} weight="duotone" />
              <div>
                <strong>存储一致性稳定</strong>
                <p>执行日志、会话状态、素材地址保持一致。</p>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default CompetitionShowcase;
import React, { useMemo, useState, useEffect } from 'react';
import {
  CheckCircle,
  ClockCounterClockwise,
  Cube,
  FileText,
  FlagBanner,
  GitBranch,
  MonitorPlay,
  Pulse,
  Stack,
  Target,
  TreeStructure,
  UsersThree,
  VideoCamera,
  Terminal,
  ArrowsLeftRight,
} from '@phosphor-icons/react';
import './CompetitionShowcase.css';

const kpiCards = [
  { label: '文本智能体响应', value: '< 2s', icon: <Pulse size={20} weight="duotone" />, tone: 'good' },
  { label: '多模态生成响应', value: '< 3min', icon: <VideoCamera size={20} weight="duotone" />, tone: 'good' },
  { label: 'Web 页面切换', value: '< 3s', icon: <MonitorPlay size={20} weight="duotone" />, tone: 'good' },
  { label: '并发稳定目标', value: '< 100', icon: <UsersThree size={20} weight="duotone" />, tone: 'warn' },
];

const workflowTabs = [
  { id: 'text2video', title: '文生视频工作流', subtitle: '从创意输入到成片生成' },
  { id: 'image2video', title: '图生视频工作流', subtitle: '参考图驱动的叙事生成' },
];

const flowMap = {
  text2video: [
    { title: '创意输入', desc: '建立 session', icon: <FileText size={18} weight="fill" /> },
    { title: '意图澄清', desc: 'assistant 多轮澄清', icon: <Target size={18} weight="fill" /> },
    { title: 'TOT 分镜树', desc: '生成候选分镜链', icon: <TreeStructure size={18} weight="fill" /> },
    { title: '提示词工程', desc: '输出正负向提示词', icon: <Stack size={18} weight="fill" /> },
    { title: '预览确认', desc: 'VideoLCM 快速预览', icon: <MonitorPlay size={18} weight="fill" /> },
    { title: '正式生成', desc: '多模态智能体工作', icon: <VideoCamera size={18} weight="fill" /> },
  ],
  image2video: [
    { title: '图文输入', desc: '绑定 session', icon: <FileText size={18} weight="fill" /> },
    { title: '意图澄清', desc: '完善核心元素', icon: <Target size={18} weight="fill" /> },
    { title: 'TOT 分镜树', desc: '筛出推荐分镜链', icon: <TreeStructure size={18} weight="fill" /> },
    { title: '首帧脚本', desc: '生成首帧与运动', icon: <GitBranch size={18} weight="fill" /> },
    { title: '提示词工程', desc: '融合动作意图', icon: <Stack size={18} weight="fill" /> },
    { title: '视频生成', desc: '写入素材库', icon: <VideoCamera size={18} weight="fill" /> },
  ],
};

const apiContracts = [
  {
    name: 'POST /projects/new',
    purpose: '新建项目 + 创建会话',
    key: '{\n  "user_id": "string",\n  "project_name": "string",\n  "workflow_type": "enum"\n}',
  },
  {
    name: 'POST /work',
    purpose: '核心工作流调度',
    key: '{\n  "project_name": "string",\n  "user_input": "string",\n  "mode": "fast|quality"\n}',
  },
  {
    name: 'POST /upload_image',
    purpose: '参考图与素材上传',
    key: '{\n  "user_id": "string",\n  "file": "binary",\n  "type": "reference"\n}',
  },
  {
    name: 'GET /projects/history',
    purpose: '恢复项目上下文',
    key: '{\n  "user_id": "string",\n  "project_id": "uuid"\n}',
  },
];

const acpsSteps = [
  {
    id: 'client',
    label: 'Client (Web)',
    desc: '发起创作请求',
    code: 'POST /api/v1/work\nContent-Type: application/json\n\n{"action": "start_generate", "acps_version": "1.0"}',
  },
  {
    id: 'hub',
    label: 'ACPs Hub',
    desc: '协议解析与路由分发',
    code: '[ACPs HUB] Parsing Protocol...\n-> Validating session_id\n-> Routing to Outline Agent',
  },
  {
    id: 'agents',
    label: 'Multi-Agents',
    desc: '多智能体协作生成',
    code: 'Agent[Assistant]: Intent clear.\nAgent[Outline]: Generating TOT tree...\nAgent[Prompt]: Optimizing prompts...',
  },
  {
    id: 'generation',
    label: 'AIGC Engine',
    desc: '底层模型渲染',
    code: '[Model: Veo / VideoLCM]\nStatus: Rendering...\nProgress: ▓▓▓▓▓▓▓░░░ 75%',
  },
  {
    id: 'database',
    label: 'Vector & DB',
    desc: '状态与物料持久化',
    code: 'INSERT INTO materials \nVALUES (vid_091, s3_link);\nUPDATE session SET status="done";',
  },
  {
    id: 'response',
    label: 'SSE Stream',
    desc: '流式返回前端',
    code: 'data: {"step": "complete", "url": "..."}\n\n[Connection Closed]',
  },
];

const CompetitionShowcase = () => {
  const [activeWorkflow, setActiveWorkflow] = useState('text2video');
  const [activeApi, setActiveApi] = useState(0);
  const [acpsStepIndex, setAcpsStepIndex] = useState(0);

  const activeFlow = useMemo(() => flowMap[activeWorkflow], [activeWorkflow]);

  useEffect(() => {
    const timer = setInterval(() => {
      setAcpsStepIndex((prev) => (prev + 1) % acpsSteps.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="nexus-showcase">
      <div className="ambient-light light-1" />
      <div className="ambient-light light-2" />

      <header className="hero-section">
        <div className="hero-content">
          <div className="badge-glow">
            <FlagBanner size={16} weight="duotone" />
            <span>第十九届全国大学生软件创新大赛</span>
          </div>
          <h1 className="gradient-text">Nexus 项目中枢平台</h1>
          <p className="hero-subtext">
            基于 <strong>ACPs 协议</strong> 的全链路多模态 AIGC 协作系统。将黑盒生成重塑为可视、可溯、可控的现代工作流。
          </p>
        </div>

        <div className="kpi-dashboard">
          {kpiCards.map((item) => (
            <div key={item.label} className={`kpi-glass-card ${item.tone}`}>
              <div className="kpi-icon-wrap">{item.icon}</div>
              <div className="kpi-data">
                <span className="kpi-val">{item.value}</span>
                <span className="kpi-lbl">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </header>

      <section className="glass-panel dynamic-architecture">
        <div className="panel-header">
          <div className="title-group">
            <Cube size={24} weight="duotone" className="icon-cyan" />
            <h2>ACPs 协议协同调度全景 (实时监控)</h2>
          </div>
          <span className="live-badge">
            <span className="dot" />
            LIVE TRAFFIC
          </span>
        </div>

        <div className="architecture-grid">
          <div className="topo-map">
            {acpsSteps.map((step, index) => {
              const isActive = index === acpsStepIndex;
              const isPassed = index < acpsStepIndex;
              return (
                <div key={step.id} className={`topo-node ${isActive ? 'active' : ''} ${isPassed ? 'passed' : ''}`}>
                  <div className="node-marker">{index + 1}</div>
                  <div className="node-info">
                    <h4>{step.label}</h4>
                    <p>{step.desc}</p>
                  </div>
                  {index < acpsSteps.length - 1 && (
                    <div className={`topo-connector ${isActive ? 'flowing' : ''}`}>
                      <div className="particle" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="protocol-terminal">
            <div className="terminal-header">
              <span className="mac-btn red" />
              <span className="mac-btn yellow" />
              <span className="mac-btn green" />
              <span className="terminal-title">
                <Terminal size={14} weight="bold" />
                acps-protocol-logger.sh
              </span>
            </div>
            <div className="terminal-body">
              <pre>
                <code className="code-typing">{acpsSteps[acpsStepIndex].code}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-panel workflow-panel">
        <div className="panel-header">
          <h2>
            <TreeStructure size={24} weight="duotone" className="icon-purple" /> 业务工作流拆解
          </h2>
          <div className="cyber-tabs">
            {workflowTabs.map((tab) => (
              <button key={tab.id} type="button" className={`cyber-tab ${activeWorkflow === tab.id ? 'active' : ''}`} onClick={() => setActiveWorkflow(tab.id)}>
                {tab.title}
              </button>
            ))}
          </div>
        </div>

        <div className="flow-stepper">
          {activeFlow.map((step, idx) => (
            <div key={step.title} className="step-card">
              <div className="step-icon">{step.icon}</div>
              <div className="step-content">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
              {idx < activeFlow.length - 1 && <ArrowsLeftRight size={20} className="step-arrow" weight="bold" />}
            </div>
          ))}
        </div>
      </section>

      <div className="bottom-grid">
        <section className="glass-panel api-panel">
          <h2>
            <Pulse size={24} weight="duotone" className="icon-cyan" /> 核心接口契约
          </h2>
          <div className="api-layout">
            <div className="api-list">
              {apiContracts.map((api, index) => (
                <button key={api.name} type="button" className={`api-list-item ${activeApi === index ? 'active' : ''}`} onClick={() => setActiveApi(index)}>
                  <span className="method">{api.name.split(' ')[0]}</span>
                  <span className="route">{api.name.split(' ').slice(1).join(' ')}</span>
                </button>
              ))}
            </div>
            <div className="api-detail code-window">
              <div className="detail-title">// {apiContracts[activeApi].purpose}</div>
              <pre>
                <code>{apiContracts[activeApi].key}</code>
              </pre>
            </div>
          </div>
        </section>

        <section className="glass-panel acceptance-panel">
          <h2>
            <CheckCircle size={24} weight="duotone" className="icon-purple" /> 答辩演示验收重点
          </h2>
          <ul className="check-list">
            <li>
              <Target size={20} weight="duotone" className="text-cyan" />
              <div>
                <strong>多轮澄清与指令转化</strong>
                <p>展示 Assistant 如何将模糊输入转为结构化 ACPs 报文。</p>
              </div>
            </li>
            <li>
              <ClockCounterClockwise size={20} weight="duotone" className="text-cyan" />
              <div>
                <strong>精准回溯与状态恢复</strong>
                <p>演示修改请求时，系统按分镜局部重算，而非全量返工。</p>
              </div>
            </li>
            <li>
              <MonitorPlay size={20} weight="duotone" className="text-cyan" />
              <div>
                <strong>高并发与流式响应体验</strong>
                <p>页面切换 &lt; 3s，流式吐出过程日志，前端感知零卡顿。</p>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default CompetitionShowcase;
