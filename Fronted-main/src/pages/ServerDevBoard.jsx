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
import './ServerDevBoard.css';

const kpiCards = [
  { label: 'API 平均响应', value: '180ms', icon: <Pulse size={18} weight="duotone" />, tone: 'good' },
  { label: '任务调度耗时', value: '1.2s', icon: <GitBranch size={18} weight="duotone" />, tone: 'good' },
  { label: '并发连接数', value: '86', icon: <UsersThree size={18} weight="duotone" />, tone: 'warn' },
  { label: '服务可用性', value: '99.9%', icon: <MonitorPlay size={18} weight="duotone" />, tone: 'good' },
];

const tabs = [{ id: 'request', title: '请求链路' }, { id: 'generation', title: '生成链路' }];
const flows = {
  request: [
    { t: 'API Gateway', d: '接入与参数校验', i: <FileText size={16} weight="fill" /> },
    { t: 'Auth 校验', d: '权限与 token 校验', i: <Target size={16} weight="fill" /> },
    { t: 'Session 路由', d: '恢复上下文状态', i: <TreeStructure size={16} weight="fill" /> },
    { t: 'Task 调度', d: '分发到执行队列', i: <GitBranch size={16} weight="fill" /> },
    { t: '数据持久化', d: '写入 DB 与存储', i: <Database size={16} weight="fill" /> },
    { t: '响应返回', d: 'SSE/JSON 输出', i: <ArrowsLeftRight size={16} weight="fill" /> },
  ],
  generation: [
    { t: '需求解析', d: '解析输入与模式', i: <FileText size={16} weight="fill" /> },
    { t: '意图澄清', d: 'assistant 归一化需求', i: <Target size={16} weight="fill" /> },
    { t: '分镜生成', d: 'outline 扩展与筛选', i: <TreeStructure size={16} weight="fill" /> },
    { t: '提示词构建', d: 'prompt 结构化参数', i: <Stack size={16} weight="fill" /> },
    { t: '执行引擎', d: '模型渲染任务', i: <Cube size={16} weight="fill" /> },
    { t: '结果回传', d: '落库并返回 URL', i: <Database size={16} weight="fill" /> },
  ],
};
const steps = [
  { l: 'Client', d: '接收前端请求', c: 'POST /api/v1/work {"mode":"fast"}' },
  { l: 'Gateway', d: '鉴权与参数校验', c: '[gateway] auth=ok payload=ok' },
  { l: 'ACPs Hub', d: '状态机调度', c: '[acps] load session -> route task' },
  { l: 'Agents', d: '多智能体执行', c: 'assistant done | outline done | prompt running' },
  { l: 'Storage', d: '持久化结果', c: 'UPDATE sessions; INSERT history; PUT video' },
  { l: 'Response', d: '流式回传', c: 'event: done data: {"url":"/videos/demo.mp4"}' },
];

const apis = [
  { n: 'POST /api/v1/work', d: '核心任务入口', s: '{\n  "project_name":"string",\n  "user_input":"string",\n  "mode":"fast|quality"\n}' },
  { n: 'POST /api/v1/projects/new', d: '创建项目会话', s: '{\n  "user_id":"string",\n  "project_name":"string",\n  "workflow_type":"text2video|image2video"\n}' },
  { n: 'POST /api/v1/upload_image', d: '上传参考素材', s: '{\n  "user_id":"string",\n  "project_name":"string",\n  "file":"binary"\n}' },
];

export default function ServerDevBoard() {
  const [tab, setTab] = useState('request');
  const [apiIdx, setApiIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const flow = useMemo(() => flows[tab], [tab]);

  useEffect(() => {
    const timer = setInterval(() => setStepIdx((p) => (p + 1) % steps.length), 2200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="sdb-page">
      <header className="sdb-hero">
        <div>
          <div className="sdb-tag">Server Development Dashboard</div>
          <h1>后端服务开发看板</h1>
          <p>高可读浅色模式，聚焦协议调用与服务链路。</p>
        </div>
        <div className="sdb-kpis">
          {kpiCards.map((k) => (
            <div key={k.label} className={`sdb-kpi ${k.tone}`}>
              <div className="sdb-kpi-icon">{k.icon}</div>
              <div><div className="sdb-kpi-value">{k.value}</div><div className="sdb-kpi-label">{k.label}</div></div>
            </div>
          ))}
        </div>
      </header>

      <section className="sdb-panel">
        <div className="sdb-head"><h2><Cube size={18} /> ACPs 动态调用过程</h2><span className="sdb-pill">RUNNING</span></div>
        <div className="sdb-grid2">
          <div className="sdb-steps">
            {steps.map((s, i) => (
              <div key={s.l} className={`sdb-step ${i === stepIdx ? 'active' : ''}`}>
                <span className="sdb-no">{i + 1}</span><div><strong>{s.l}</strong><p>{s.d}</p></div>
              </div>
            ))}
          </div>
          <div className="sdb-terminal"><div className="sdb-terminal-head"><Terminal size={14} /> server-protocol.log</div><pre>{steps[stepIdx].c}</pre></div>
        </div>
      </section>

      <section className="sdb-panel">
        <div className="sdb-head">
          <h2><TreeStructure size={18} /> 服务链路拆解</h2>
          <div className="sdb-tabs">{tabs.map((t) => <button key={t.id} className={`sdb-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)} type="button">{t.title}</button>)}</div>
        </div>
        <div className="sdb-flow">{flow.map((f, i) => <div key={f.t} className="sdb-flow-card"><div className="sdb-flow-icon">{f.i}</div><h3>{f.t}</h3><p>{f.d}</p>{i < flow.length - 1 && <ArrowsLeftRight size={16} className="sdb-flow-arrow" />}</div>)}</div>
      </section>

      <div className="sdb-grid2">
        <section className="sdb-panel">
          <h2><Pulse size={18} /> 核心 API 契约</h2>
          <div className="sdb-api-grid">
            <div className="sdb-api-list">{apis.map((a, i) => <button key={a.n} className={`sdb-api-item ${apiIdx === i ? 'active' : ''}`} onClick={() => setApiIdx(i)} type="button">{a.n}</button>)}</div>
            <div className="sdb-api-detail"><div className="sdb-api-title">{apis[apiIdx].d}</div><pre>{apis[apiIdx].s}</pre></div>
          </div>
        </section>
        <section className="sdb-panel">
          <h2><CheckCircle size={18} /> 服务端验收项</h2>
          <ul className="sdb-check">
            <li><Target size={16} /><div><strong>请求校验完整</strong><p>参数与权限双重校验。</p></div></li>
            <li><ClockCounterClockwise size={16} /><div><strong>状态回溯可恢复</strong><p>session 状态机支持断点续跑。</p></div></li>
            <li><Database size={16} /><div><strong>存储一致性稳定</strong><p>会话状态与素材地址一致。</p></div></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
