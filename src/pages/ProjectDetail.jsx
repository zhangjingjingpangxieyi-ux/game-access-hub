import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { supabase } from '../lib/supabase'

// ============================================
// 状态体系
// ============================================

// ⑥ 功能开发阶段的状态
const DEV_STATUSES = ['待开发', '开发中', '联调中']
// ⑦ 测试验收阶段的状态
const TEST_STATUSES = ['测试中', '待验收', '已通过']

// 所有功能可能的状态（用于拖拽校验和列表视图筛选）
const ALL_STATUSES = [...DEV_STATUSES, ...TEST_STATUSES]

const STATUS_STYLE = {
  '待开发': 'bg-gray-100 text-gray-600',
  '开发中': 'bg-blue-100 text-blue-700',
  '联调中': 'bg-purple-100 text-purple-700',
  '测试中': 'bg-amber-100 text-amber-700',
  '待验收': 'bg-orange-100 text-orange-700',
  '已通过': 'bg-green-100 text-green-700',
}

const KANBAN_LABELS = {
  '待开发': { title: '待开发', color: 'text-gray-400', bg: 'bg-gray-50' },
  '开发中': { title: '开发中', color: 'text-blue-600', bg: 'bg-blue-50/50' },
  '联调中': { title: '联调中', color: 'text-purple-600', bg: 'bg-purple-50/50' },
  '测试中': { title: '测试中', color: 'text-amber-600', bg: 'bg-amber-50/50' },
  '待验收': { title: '待验收', color: 'text-orange-600', bg: 'bg-orange-50/50' },
  '已通过': { title: '已通过', color: 'text-green-600', bg: 'bg-green-50/50' },
}

const STAGE_COLORS = {
  0: 'bg-green-100 text-green-700',
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-amber-100 text-amber-700',
  3: 'bg-purple-100 text-purple-700',
}

const ROLE_COLORS = {
  '运维': 'bg-orange-50 text-orange-600',
  'PM': 'bg-purple-50 text-purple-600',
  '开发': 'bg-blue-50 text-blue-600',
  '开发/运维': 'bg-indigo-50 text-indigo-600',
  '测试': 'bg-amber-50 text-amber-600',
  '运营/运维': 'bg-teal-50 text-teal-600',
  '项目组': 'bg-gray-50 text-gray-600',
  'PM/项目组': 'bg-pink-50 text-pink-600',
}

// ============================================
// 辅助函数
// ============================================

function getAccessMethodLabel(method) {
  if (!method) return '-'
  return method
}

function getResponsibility(method) {
  if (!method) return '-'
  if (method === '开通权限') return '平台配置'
  if (method === '游戏接入') return '游戏侧接入'
  if (method === '平台开发') return '平台开发'
  if (method === '游戏接入+平台开发') return '双方协作'
  return '游戏侧接入'
}

// ============================================
// 功能卡片组件（可拖拽）
// ============================================

function FeatureCard({ feature, isExpanded, onToggleExpand, provided, isDragging }) {
  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`bg-white rounded-md p-2.5 text-[12px] mb-1.5 border transition-shadow ${
        isDragging ? 'border-primary-400 shadow-lg ring-2 ring-primary-100' : 'border-gray-200 hover:shadow-md'
      }`}
      style={{
        ...provided.draggableProps.style,
      }}
    >
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => onToggleExpand(feature.id)}
      >
        <div className="flex-1 min-w-0">
          <div className="font-semibold mb-0.5 truncate">{feature.features?.name}</div>
          <div className="flex items-center gap-1.5 text-gray-400">
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${STAGE_COLORS[feature.features?.stage_id - 1]}`}>
              阶段{feature.features?.stage_id - 1}
            </span>
            <span className="text-[10px]">{getAccessMethodLabel(feature.features?.access_method)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          {feature.features?.team_needs && <span className="text-[10px] text-amber-500" title={feature.features.team_needs}>📝</span>}
          <span className="text-[10px] text-gray-300">⠿</span>
          <span className="text-[10px] text-gray-300">{isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>
      {/* 备注摘要 */}
      {!isExpanded && feature.features?.team_needs && (
        <div className="mt-1.5 pt-1.5 border-t border-gray-100 text-[11px] text-amber-600 truncate" title={feature.features.team_needs}>
          📝 {feature.features.team_needs}
        </div>
      )}
      {/* 展开详情 */}
      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          {feature.features?.team_needs && (
            <div className="text-[11px] text-amber-600">
              <div className="text-[10px] text-gray-400 mb-0.5">备注</div>
              {feature.features.team_needs}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================
// 看板列组件
// ============================================

function KanbanColumn({ droppableId, status, items, expandedId, onToggleExpand }) {
  const label = KANBAN_LABELS[status] || { title: status, color: 'text-gray-400', bg: 'bg-gray-50' }
  return (
    <div className={`${label.bg} rounded-lg p-2.5 min-h-[80px]`}>
      <div className={`text-[11px] font-bold uppercase mb-2 px-1 ${label.color}`}>
        {label.title} · {items.length}
      </div>
      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[40px] rounded transition-colors ${snapshot.isDraggingOver ? 'bg-primary-50 ring-1 ring-primary-200 ring-dashed' : ''}`}
          >
            {items.map((pf, index) => (
              <Draggable key={pf.id} draggableId={pf.id} index={index}>
                {(dragProvided, dragSnapshot) => (
                  <FeatureCard
                    feature={pf}
                    isExpanded={expandedId === pf.id}
                    onToggleExpand={onToggleExpand}
                    provided={dragProvided}
                    isDragging={dragSnapshot.isDragging}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}

// ============================================
// 主页面
// ============================================

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [features, setFeatures] = useState([])
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)

  // 接入流程（8 阶段步骤）
  const [allSteps, setAllSteps] = useState([])
  const [stepRecords, setStepRecords] = useState([])
  const [expandedFeature, setExpandedFeature] = useState(null)

  // ⑥⑦ 看板/列表视图切换
  const [kanbanView, setKanbanView] = useState(true) // true=看板 false=列表
  const [statusFilter, setStatusFilter] = useState('all')

  // 获取步骤
  const checkboxSteps = allSteps.filter(s => (s.step_category || 'checkbox') === 'checkbox')
  const devStep = allSteps.find(s => s.step_category === 'kanban' && s.sort_order === 6)
  const testStep = allSteps.find(s => s.step_category === 'kanban' && s.sort_order === 7)

  useEffect(() => {
    fetchDetail()
  }, [id])

  async function fetchDetail() {
    setLoading(true)
    const { data: proj } = await supabase.from('projects').select('*').eq('id', id).single()
    if (!proj) { setLoading(false); return }
    setProject(proj)

    const { data: pf } = await supabase
      .from('project_features')
      .select('*, features(*)')
      .eq('project_id', id)
    const features = pf || []
    // 旧状态兼容映射：待接入 → 待开发，已完成 → 已通过
    const STATUS_MAP = { '待接入': '待开发', '已完成': '已通过' }
    let needMigrate = []
    const migrated = features.map(f => {
      const mapped = STATUS_MAP[f.status]
      if (mapped) {
        needMigrate.push({ id: f.id, newStatus: mapped })
        return { ...f, status: mapped }
      }
      return f
    })
    // 批量更新旧状态到数据库
    if (needMigrate.length > 0) {
      await Promise.all(needMigrate.map(m =>
        supabase.from('project_features').update({ status: m.newStatus }).eq('id', m.id)
      ))
    }
    setFeatures(migrated)

    const { data: tl } = await supabase
      .from('project_timeline')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true })
    setTimeline(tl || [])

    // 获取接入流程步骤模板
    try {
      const { data: steps } = await supabase
        .from('access_steps')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      if (steps) setAllSteps(steps)
      // 获取项目步骤记录
      const { data: records } = await supabase
        .from('project_global_steps')
        .select('*')
        .eq('project_id', id)
      setStepRecords(records || [])
    } catch (e) {
      console.warn('接入流程表尚未创建，跳过步骤加载')
    }

    setLoading(false)
  }

  // 更新功能状态
  async function updateFeatureStatus(pfId, newStatus) {
    const oldFeatures = [...features]
    setFeatures(prev => prev.map(f => f.id === pfId ? { ...f, status: newStatus, status_updated_at: new Date().toISOString() } : f))
    try {
      const { error } = await supabase
        .from('project_features')
        .update({ status: newStatus, status_updated_at: new Date().toISOString() })
        .eq('id', pfId)
      if (error) { setFeatures(oldFeatures); alert('更新失败') }
      else {
        // 记录时间线
        const pf = oldFeatures.find(f => f.id === pfId)
        if (pf && pf.features?.name) {
          await supabase.from('project_timeline').insert({
            project_id: id,
            event: `${pf.features.name} 状态更新为「${newStatus}」`,
          })
          setTimeline(prev => [...prev, { event: `${pf.features.name} 状态更新为「${newStatus}」`, created_at: new Date().toISOString() }])
        }
      }
    } catch (e) {
      setFeatures(oldFeatures)
      alert('更新失败')
    }
  }

  // 勾选/取消全局步骤
  async function toggleGlobalStep(stepId, currentStatus) {
    const newCompleted = !currentStatus
    setStepRecords(prev => prev.map(r =>
      r.step_id === stepId ? { ...r, is_completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null } : r
    ))
    const existing = stepRecords.find(r => r.step_id === stepId)
    try {
      if (existing) {
        await supabase.from('project_global_steps').update({
          is_completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        }).eq('id', existing.id)
      } else {
        const { data } = await supabase.from('project_global_steps').insert({
          project_id: id, step_id: stepId, is_completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null,
        }).select().single()
        if (data) setStepRecords(prev => [...prev, data])
      }
      // 记录时间线
      const step = allSteps.find(s => s.id === stepId)
      if (newCompleted && step) {
        await supabase.from('project_timeline').insert({
          project_id: id, event: `${step.step_name} 已完成（${step.responsible_role}）`,
        })
        setTimeline(prev => [...prev, { event: `${step.step_name} 已完成（${step.responsible_role}）`, created_at: new Date().toISOString() }])
      }
    } catch (e) {
      setStepRecords(stepRecords)
      alert('更新失败')
    }
  }

  function getStepRecord(stepId) {
    return stepRecords.find(r => r.step_id === stepId)
  }

  // 拖拽处理
  const onDragEnd = useCallback(async (result) => {
    const { source, destination, draggableId } = result
    if (!destination) return

    const destColumnId = destination.droppableId // 格式: "dev-开发中" 或 "test-测试中"
    const [phase, newStatus] = destColumnId.split('-')

    // 状态校验：⑥阶段只能到⑥的状态，⑦阶段只能到⑦的状态
    if (phase === 'dev' && !DEV_STATUSES.includes(newStatus)) return
    if (phase === 'test' && !TEST_STATUSES.includes(newStatus)) return

    // 乐观更新
    const oldFeatures = [...features]
    setFeatures(prev => prev.map(f =>
      f.id === draggableId ? { ...f, status: newStatus, status_updated_at: new Date().toISOString() } : f
    ))
    try {
      const { error } = await supabase
        .from('project_features')
        .update({ status: newStatus, status_updated_at: new Date().toISOString() })
        .eq('id', draggableId)
      if (error) { setFeatures(oldFeatures); alert('拖拽更新失败') }
      else {
        const pf = oldFeatures.find(f => f.id === draggableId)
        if (pf && pf.features?.name) {
          await supabase.from('project_timeline').insert({
            project_id: id, event: `${pf.features.name} 拖拽至「${newStatus}」`,
          })
          setTimeline(prev => [...prev, { event: `${pf.features.name} 拖拽至「${newStatus}」`, created_at: new Date().toISOString() }])
        }
      }
    } catch (e) {
      setFeatures(oldFeatures)
    }
  }, [features, id])

  // 看板数据
  const devKanbanData = {}
  DEV_STATUSES.forEach(s => { devKanbanData[s] = features.filter(f => f.status === s) })

  const testKanbanData = {}
  TEST_STATUSES.forEach(s => { testKanbanData[s] = features.filter(f => f.status === s) })

  // 总体进度统计
  const stats = {
    total: features.length,
    devDone: features.filter(f => DEV_STATUSES.includes(f.status)).length,
    testDone: features.filter(f => f.status === '已通过').length,
    inDev: features.filter(f => ['待开发', '开发中', '联调中'].includes(f.status)).length,
    inTest: features.filter(f => ['测试中', '待验收'].includes(f.status)).length,
    pending: features.filter(f => f.status === '待开发').length,
  }

  // 勾选步骤完成率（仅统计 checkbox 类型的步骤）
  const checkboxDone = checkboxSteps.filter(s => getStepRecord(s.id)?.is_completed).length
  const checkboxPct = checkboxSteps.length > 0 ? Math.round(checkboxDone / checkboxSteps.length * 100) : 0

  // 列表视图筛选
  const filteredFeatures = statusFilter === 'all'
    ? features
    : features.filter(f => f.status === statusFilter)

  // 如果有功能处于旧状态（已完成/待接入），映射到新状态
  // 已完成 → 已通过, 待接入 → 待开发
  const hasLegacyStatus = features.some(f => f.status === '已完成' || f.status === '待接入')

  if (loading) return <div className="p-7 text-gray-400">加载中…</div>
  if (!project) return <div className="p-7 text-gray-400">项目不存在</div>

  const stageNum = project.stage_id ? project.stage_id - 1 : 0

  return (
    <div className="p-7">
      {/* 面包屑 */}
      <div className="text-[12px] text-gray-400 mb-4 flex items-center gap-1.5">
        <span onClick={() => navigate('/')} className="text-primary-500 cursor-pointer hover:underline">项目管理</span>
        <span>›</span>
        <span>{project.game_name}</span>
      </div>

      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">{project.game_name}</h1>
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${STAGE_COLORS[stageNum]}`}>阶段{stageNum}</span>
          <span className="flex items-center gap-1.5 text-[13px] text-gray-500">
            <span className={`w-[7px] h-[7px] rounded-full ${project.status === '接入中' ? 'bg-blue-500' : project.status === '已完成' ? 'bg-green-500' : 'bg-gray-300'}`} />
            {project.status}
          </span>
        </div>
        <div className="flex gap-2">
          <Link to="/admin" className="px-3 py-1.5 border border-gray-300 rounded-lg text-[12px] text-gray-600 hover:bg-gray-50">管理后台</Link>
          <Link to={`/project/${id}/edit`} className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-[12px] hover:bg-primary-600">编辑项目</Link>
        </div>
      </div>

      <div className="grid grid-cols-[280px_1fr] gap-5">
        {/* 左侧栏 */}
        <div className="flex flex-col gap-4">
          {/* 项目信息 */}
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-3.5">项目信息</div>
            {[
              ['游戏ID', project.game_id],
              ['发行地区', project.region],
              ['业务类型', project.business_type],
              ['数据库类型', project.db_type || '-'],
              ['事业部', project.department],
              ['负责人', project.leader_name],
              ['接入环境', project.environments?.join(' · ') || '-'],
              ['计划对外', <span key="ld" className={new Date(project.launch_date) < new Date() ? 'text-amber-500 font-medium' : ''}>{project.launch_date || '-'}</span>],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between items-start mb-2.5 last:mb-0 text-[13px]">
                <span className="text-gray-400 flex-shrink-0">{label}</span>
                <span className="font-medium text-right max-w-[60%]">{val}</span>
              </div>
            ))}
          </div>

          {/* 接入进度总览 */}
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-3.5">接入进度</div>
            <div className="mb-3">
              <div className="flex justify-between text-[13px] mb-1.5">
                <span>阶段完成率</span>
                <span className="font-bold text-primary-500">{checkboxPct}%（{checkboxDone}/{checkboxSteps.length}）</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${checkboxPct}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              {[
                { val: stats.testDone, label: '已通过', color: 'text-green-500' },
                { val: stats.inDev + stats.inTest, label: '进行中', color: 'text-blue-500' },
                { val: stats.inTest, label: '测试中', color: 'text-amber-500' },
                { val: stats.pending, label: '待开发', color: 'text-gray-400' },
              ].map(s => (
                <div key={s.label} className="text-center bg-gray-50 rounded-lg py-2">
                  <div className={`text-base font-bold ${s.color}`}>{s.val}</div>
                  <div className="text-gray-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 时间线 */}
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-3.5">接入时间线</div>
            <div>
              {timeline.length === 0 ? (
                <div className="text-[13px] text-gray-300 text-center py-4">暂无动态</div>
              ) : timeline.map((t, i) => (
                <div key={t.id || i} className="flex gap-3.5 pb-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-[10px] h-[10px] rounded-full flex-shrink-0 mt-1 ${i === timeline.length - 1 ? 'bg-gray-300' : 'bg-primary-500'}`} />
                    {i < timeline.length - 1 && <div className="w-[2px] flex-1 bg-gray-200 mt-1" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className={`text-[11px] mb-1 ${i === timeline.length - 1 ? 'text-gray-300' : 'text-gray-400'}`}>{t.event_date || t.created_at?.slice(0, 10)}</div>
                    <div className="text-[13px]">{t.event}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧主区域：接入总览 */}
        <div className="flex flex-col gap-4">
          {/* 标题栏 */}
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-gray-900">接入总览</h2>
            {/* ⑥⑦ 的视图切换按钮 */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setKanbanView(true)}
                className={`px-3 py-1 text-[12px] rounded-md transition-colors ${kanbanView ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500'}`}
              >
                看板
              </button>
              <button
                onClick={() => setKanbanView(false)}
                className={`px-3 py-1 text-[12px] rounded-md transition-colors ${!kanbanView ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500'}`}
              >
                列表
              </button>
            </div>
          </div>

          {/* 8 阶段 */}
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="space-y-3">
              {allSteps.map(step => {
                const isKanbanStep = (step.step_category || 'checkbox') === 'kanban'
                const record = getStepRecord(step.id)
                const done = record?.is_completed

                // ⑥ 功能开发阶段
                if (step.sort_order === 6) {
                  return (
                    <div key={step.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[14px] font-bold text-blue-600">⑥ {step.step_name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${ROLE_COLORS[step.responsible_role] || 'bg-gray-50 text-gray-500'}`}>
                            {step.responsible_role}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400">
                          共 {features.filter(f => DEV_STATUSES.includes(f.status)).length} 个功能
                        </span>
                      </div>
                      <div className="p-4">
                        {kanbanView ? (
                          <div className="grid grid-cols-3 gap-2.5">
                            {DEV_STATUSES.map(status => (
                              <KanbanColumn
                                key={status}
                                droppableId={`dev-${status}`}
                                status={status}
                                items={devKanbanData[status]}
                                expandedId={expandedFeature}
                                onToggleExpand={(fid) => setExpandedFeature(expandedFeature === fid ? null : fid)}
                              />
                            ))}
                          </div>
                        ) : (
                          <FeatureList
                            features={features.filter(f => DEV_STATUSES.includes(f.status))}
                            statusFilter={statusFilter}
                            onStatusFilterChange={setStatusFilter}
                            onStatusChange={updateFeatureStatus}
                            expandedId={expandedFeature}
                            onToggleExpand={(fid) => setExpandedFeature(expandedFeature === fid ? null : fid)}
                          />
                        )}
                      </div>
                    </div>
                  )
                }

                // ⑦ 测试验收阶段
                if (step.sort_order === 7) {
                  return (
                    <div key={step.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-white">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[14px] font-bold text-amber-600">⑦ {step.step_name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${ROLE_COLORS[step.responsible_role] || 'bg-gray-50 text-gray-500'}`}>
                            {step.responsible_role}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400">
                          共 {features.filter(f => TEST_STATUSES.includes(f.status)).length} 个功能
                        </span>
                      </div>
                      <div className="p-4">
                        {kanbanView ? (
                          <div className="grid grid-cols-3 gap-2.5">
                            {TEST_STATUSES.map(status => (
                              <KanbanColumn
                                key={status}
                                droppableId={`test-${status}`}
                                status={status}
                                items={testKanbanData[status]}
                                expandedId={expandedFeature}
                                onToggleExpand={(fid) => setExpandedFeature(expandedFeature === fid ? null : fid)}
                              />
                            ))}
                          </div>
                        ) : (
                          <FeatureList
                            features={features.filter(f => TEST_STATUSES.includes(f.status))}
                            statusFilter={statusFilter}
                            onStatusFilterChange={setStatusFilter}
                            onStatusChange={updateFeatureStatus}
                            expandedId={expandedFeature}
                            onToggleExpand={(fid) => setExpandedFeature(expandedFeature === fid ? null : fid)}
                          />
                        )}
                      </div>
                    </div>
                  )
                }

                // 单点勾选步骤（①②③④⑤⑧）
                return (
                  <div key={step.id} className="bg-white rounded-xl border border-gray-200 px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => toggleGlobalStep(step.id, done)}
                        className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center cursor-pointer border-2 transition-all ${
                          done ? 'bg-green-500 border-green-500 shadow-sm' : 'border-gray-300 hover:border-primary-400'
                        }`}
                      >
                        {done && <span className="text-white text-[11px]">✓</span>}
                      </div>
                      <div className="flex-1">
                        <span className={`text-[13px] font-semibold ${done ? 'text-green-700 line-through' : 'text-gray-800'}`}>
                          {getStepNumber(step.sort_order)} {step.step_name}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${ROLE_COLORS[step.responsible_role] || 'bg-gray-50 text-gray-500'}`}>
                        {step.responsible_role}
                      </span>
                      {done && (
                        <span className="text-[10px] text-green-500">✓ 已完成</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </DragDropContext>

          {/* 旧状态兼容提示 */}
          {hasLegacyStatus && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-[12px] text-amber-700">
              ⚠️ 部分功能使用了旧状态（待接入/已完成），建议通过编辑将状态更新为新流程中的状态。
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 步骤编号
function getStepNumber(sortOrder) {
  const nums = ['', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧']
  return nums[sortOrder] || `${sortOrder}.`
}

// ============================================
// 功能列表组件（⑥⑦ 的列表视图）
// ============================================

function FeatureList({ features, statusFilter, onStatusFilterChange, onStatusChange, expandedId, onToggleExpand }) {
  const allStatuses = [...DEV_STATUSES, ...TEST_STATUSES]
  const filtered = statusFilter === 'all' ? features : features.filter(f => f.status === statusFilter)

  return (
    <div className="bg-gray-50 rounded-lg overflow-hidden">
      {/* 筛选栏 */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-gray-200">
        <div className="text-[12px] text-gray-500">共 {features.length} 个功能</div>
        <div className="flex gap-1.5">
          {['all', ...allStatuses].map(s => (
            <button
              key={s}
              onClick={() => onStatusFilterChange(s)}
              className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
                statusFilter === s ? 'bg-primary-50 text-primary-600 font-medium' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {s === 'all' ? '全部' : s}
            </button>
          ))}
        </div>
      </div>
      {/* 表头 */}
      <div className="grid grid-cols-[2fr_80px_100px_120px] px-4 py-2 text-[11px] text-gray-400 font-semibold border-b border-gray-200">
        <span>功能</span><span>接入方式</span><span>阶段</span><span>状态</span>
      </div>
      {/* 列表 */}
      {filtered.map(pf => (
        <div key={pf.id}>
          <div className="grid grid-cols-[2fr_80px_100px_120px] px-4 py-2.5 border-b border-gray-100 text-[13px] items-center hover:bg-white/60 cursor-pointer"
            onClick={() => onToggleExpand(pf.id)}
          >
            <div>
              <div className="font-semibold">{pf.features?.name}</div>
              {pf.features?.team_needs && <div className="text-[10px] text-amber-600 mt-0.5">📝 {pf.features.team_needs.length > 30 ? pf.features.team_needs.slice(0, 30) + '...' : pf.features.team_needs}</div>}
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              pf.features?.access_method === '开通权限' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
            }`}>
              {getAccessMethodLabel(pf.features?.access_method)}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${STAGE_COLORS[pf.features?.stage_id - 1]}`}>
              阶段{pf.features?.stage_id - 1}
            </span>
            <div>
              <select
                value={pf.status}
                onChange={e => onStatusChange(pf.id, e.target.value)}
                onClick={e => e.stopPropagation()}
                className="text-[11px] border border-gray-200 rounded px-1.5 py-0.5 outline-none bg-white"
              >
                {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {/* 展开详情 */}
          {expandedId === pf.id && (
            <div className="px-4 pb-2.5 bg-white/50">
              <div className="border border-gray-200 rounded-lg p-3 bg-white">
                {pf.features?.team_needs && (
                  <div className="text-[12px] text-amber-600">
                    <div className="text-[11px] text-gray-400 mb-0.5">备注</div>
                    {pf.features.team_needs}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
      {filtered.length === 0 && (
        <div className="text-center py-6 text-gray-400 text-[12px]">暂无功能</div>
      )}
    </div>
  )
}
