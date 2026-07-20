import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { supabase } from '../lib/supabase'

const STATUS_DOT = {
  '接入中': 'bg-cyan-500',
  '已完成': 'bg-green-500',
  '暂停': 'bg-gray-400',
}

const STAGE_COLORS = {
  0: 'bg-green-100 text-green-700',
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-amber-100 text-amber-700',
  3: 'bg-purple-100 text-purple-700',
}

const STATUS_OPTIONS = ['接入中', '已完成', '暂停']

const DEV_STATUSES = ['待开发', '平台开发中', '游戏联调中']
const TEST_STATUSES = ['平台测试中', '游戏验收中', '已通过']

function getDisplayStatus(project, progress) {
  if (project.status === '暂停') return '暂停'
  const prog = progress[project.id] || { total: 0, completed: 0 }
  if (prog.total > 0 && prog.completed === prog.total) return '已完成'
  return project.status || '接入中'
}

function ProgressLine({ label, value, pct, color = 'bg-primary-500', muted = false }) {
  return (
    <div className="flex max-w-[300px] items-center gap-2">
      <span className={`w-14 text-[11px] ${muted ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full progress-bar ${muted ? 'bg-gray-200' : color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`w-9 text-right text-[11px] ${muted ? 'text-slate-400' : 'text-slate-500'}`}>{value}</span>
    </div>
  )
}

// 计划对外展示：仅未完成且真正逾期时展示逾期天数，其余展示填写日期。
function getLaunchDateInfo(launchDate, status) {
  if (!launchDate) return { type: 'none', text: '未填写', color: 'text-slate-400' }
  if (status === '已完成') return { type: 'done', text: launchDate, color: 'text-slate-500' }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const launch = new Date(launchDate + 'T00:00:00')
  const diff = Math.ceil((launch - today) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { type: 'overdue', days: -diff, text: `已逾期${Math.abs(diff)}天`, color: 'text-red-500 font-medium' }
  return { type: 'ok', days: diff, text: launchDate, color: 'text-slate-500' }
}

// 状态切换下拉
function StatusDropdown({ status, onChange, isOpen, onToggle }) {
  return (
    <div className="relative inline-block">
      <button
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium hover:bg-slate-100 transition-colors"
        style={{
          backgroundColor: status === '接入中' ? '#ecfeff' : status === '已完成' ? '#f0fdf4' : '#f3f4f6',
          color: status === '接入中' ? '#0891b2' : status === '已完成' ? '#16a34a' : '#6b7280'
        }}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
        {status}
        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 bottom-full mb-1 w-[110px] bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt}
              onClick={(e) => {
                e.stopPropagation()
                if (opt !== status) onChange(opt)
              }}
              className={`w-full text-left px-3 py-2 text-[13px] hover:bg-slate-50 flex items-center gap-2 ${
                opt === status ? 'font-semibold text-slate-950' : 'text-slate-600'
              }`}
            >
              <span className={`inline-block w-[7px] h-[7px] rounded-full ${STATUS_DOT[opt]}`} />
              {opt}
              {opt === status && (
                <svg className="ml-auto w-3.5 h-3.5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// 拖拽手柄
function DragHandle() {
  return (
    <div className="flex flex-col gap-[3px] cursor-grab active:cursor-grabbing text-gray-300 hover:text-slate-400">
      <span className="w-4 h-0.5 bg-current rounded" />
      <span className="w-4 h-0.5 bg-current rounded" />
      <span className="w-4 h-0.5 bg-current rounded" />
    </div>
  )
}

// 项目行
function ProjectRow({ project, progress, flowProgress, openStatusId, onToggleStatus, onStatusChange, isDragDisabled }) {
  const navigate = useNavigate()
  const prog = progress[project.id] || { total: 0, completed: 0 }
  const pct = prog.total > 0 ? Math.round(prog.completed / prog.total * 100) : 0
  const flow = flowProgress[project.id] || { total: 0, completed: 0, questionnairePending: false }
  const flowPct = flow.total > 0 ? Math.round(flow.completed / flow.total * 100) : 0
  const displayStatus = getDisplayStatus(project, progress)
  const stageNum = project.stage_id ? project.stage_id - 1 : 0

  return (
    <div
      className="group grid grid-cols-[40px_minmax(210px,1.25fr)_88px_88px_320px_118px_100px_112px] gap-x-4 px-5 py-4 border-b border-gray-50 text-[13px] items-center hover:bg-slate-50/50 transition-colors cursor-pointer"
      onClick={() => !isDragDisabled && navigate(`/project/${project.id}`)}
    >
      {!isDragDisabled ? (
        <div className="flex items-center">
          <div className="drag-handle opacity-0 group-hover:opacity-100 transition-opacity">
            <DragHandle />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center text-gray-300">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )}

      <div className={isDragDisabled ? 'opacity-60' : ''}>
        <div className="font-semibold text-slate-950">{project.game_name}</div>
        <div className="text-xs text-slate-400 mt-0.5">{project.game_id} · {project.business_type} · {project.department}</div>
      </div>

      <div className={isDragDisabled ? 'opacity-60' : ''}>
        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STAGE_COLORS[stageNum]}`}>
          阶段{stageNum}
        </span>
      </div>

      <div className={`text-sm ${isDragDisabled ? 'text-slate-500 opacity-60' : 'text-slate-600'}`}>{project.region}</div>

      <div className="space-y-1.5">
        <ProgressLine label="接入进度" value={`${flowPct}%`} pct={flowPct} color="bg-gradient-to-r from-teal-500 to-teal-400" muted={isDragDisabled} />
        {flow.questionnairePending && displayStatus === '已完成' && (
          <div className="pl-14 text-[10px] text-amber-500 leading-none">问卷待补</div>
        )}
      </div>

      <div className={`text-sm ${isDragDisabled ? 'text-slate-400 opacity-60' : ''}`}>
        {(() => {
          const info = getLaunchDateInfo(project.launch_date, displayStatus)
          return <span className={info.color}>{info.text}</span>
        })()}
      </div>

      <div className={`text-sm font-medium ${isDragDisabled ? 'text-slate-500 opacity-60' : 'text-slate-700'}`}>
        {project.leader_name}
      </div>

      <StatusDropdown
        status={displayStatus}
        onChange={(newStatus) => onStatusChange(project.id, newStatus)}
        isOpen={openStatusId === project.id}
        onToggle={(e) => {
          e.stopPropagation()
          onToggleStatus(project.id)
        }}
      />
    </div>
  )
}

export default function ProjectList() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [progress, setProgress] = useState({})
  const [flowProgress, setFlowProgress] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('接入中')
  const [search, setSearch] = useState('')
  const [openStatusId, setOpenStatusId] = useState(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (!openStatusId) return
    const handler = () => setOpenStatusId(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [openStatusId])

  async function fetchProjects() {
    setLoading(true)
    
    // 并行获取项目列表、功能进度和流程进度
    const [projectsResult, progressResult, stepsResult, recordsResult] = await Promise.all([
      supabase
        .from('projects')
        .select('*')
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('project_features')
        .select('project_id, status'),
      supabase
        .from('access_steps')
        .select('id, sort_order')
        .eq('is_active', true)
        .order('sort_order'),
      supabase
        .from('project_global_steps')
        .select('project_id, step_id, is_completed'),
    ])

    if (projectsResult.error) {
      console.error('Error fetching projects:', projectsResult.error)
      setLoading(false)
      return
    }

    setProjects(projectsResult.data || [])

    if (progressResult.data) {
      const stats = {}
      const statusByProject = {}
      progressResult.data.forEach(row => {
        if (!stats[row.project_id]) {
          stats[row.project_id] = { total: 0, completed: 0 }
        }
        if (!statusByProject[row.project_id]) statusByProject[row.project_id] = []
        statusByProject[row.project_id].push(row.status)
        stats[row.project_id].total++
        if (row.status === '已完成' || row.status === '已通过') stats[row.project_id].completed++
      })
      setProgress(stats)

      const steps = stepsResult.data || []
      const coreSteps = steps.filter(s => s.sort_order !== 8)
      const questionnaireStep = steps.find(s => s.sort_order === 8)
      const records = recordsResult.data || []
      const flowStats = {}

      ;(projectsResult.data || []).forEach(project => {
        const statuses = statusByProject[project.id] || []
        const featureTotal = statuses.length
        const featureCompleted = stats[project.id]?.completed || 0

        let completed = 0
        coreSteps.forEach(step => {
          const record = records.find(r => r.project_id === project.id && r.step_id === step.id)
          if (step.sort_order === 6) {
            const devCount = statuses.filter(s => DEV_STATUSES.includes(s)).length
            if (featureTotal > 0 && devCount === 0) completed++
          } else if (step.sort_order === 7) {
            if (featureTotal > 0 && featureCompleted === featureTotal) completed++
          } else if (record?.is_completed) {
            completed++
          }
        })

        const questionnaireRecord = questionnaireStep
          ? records.find(r => r.project_id === project.id && r.step_id === questionnaireStep.id)
          : null

        flowStats[project.id] = {
          total: coreSteps.length,
          completed,
          questionnairePending: featureTotal > 0 && featureCompleted === featureTotal && !questionnaireRecord?.is_completed,
        }
      })
      setFlowProgress(flowStats)
    }
    setLoading(false)
  }

  async function updateStatus(projectId, newStatus) {
    const { error } = await supabase
      .from('projects')
      .update({ status: newStatus })
      .eq('id', projectId)

    if (error) {
      console.error('更新状态失败:', error)
      return
    }
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p))
    setOpenStatusId(null)
  }

  async function onDragEnd(result) {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.index === source.index) return

    const activeProjects = getActiveProjects()
    const newProjects = Array.from(activeProjects)
    const [removed] = newProjects.splice(source.index, 1)
    newProjects.splice(destination.index, 0, removed)

    setProjects(prev => {
      const pausedProjects = prev.filter(p => p.status === '暂停')
      const updatedActive = newProjects.map((p, idx) => ({ ...p, sort_order: idx }))
      return [...updatedActive, ...pausedProjects]
    })

    try {
      for (const update of newProjects.map((p, idx) => ({ id: p.id, sort_order: idx }))) {
        await supabase
          .from('projects')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)
      }
    } catch (err) {
      console.error('保存排序失败:', err)
    }
  }

  function getActiveProjects() {
    return projects.filter(p => {
      const displayStatus = getDisplayStatus(p, progress)
      if (displayStatus === '暂停') return false
      if (filter !== 'all' && displayStatus !== filter) return false
      if (search && !p.game_name.toLowerCase().includes(search.toLowerCase()) && !p.game_id.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }

  function getPausedProjects() {
    return projects.filter(p => {
      if (p.status !== '暂停') return false
      if (search && !p.game_name.toLowerCase().includes(search.toLowerCase()) && !p.game_id.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }

  const activeProjects = getActiveProjects()
  const pausedProjects = getPausedProjects()
  const showPausedSection = pausedProjects.length > 0 && (filter === 'all' || filter === '暂停')

  const stats = {
    total: projects.length,
    active: projects.filter(p => getDisplayStatus(p, progress) === '接入中').length,
    done: projects.filter(p => getDisplayStatus(p, progress) === '已完成').length,
    paused: projects.filter(p => getDisplayStatus(p, progress) === '暂停').length,
  }

  const filterOptions = [
    { key: 'all', label: '全部项目', value: stats.total, color: 'text-slate-950', icon: 'folder' },
    { key: '接入中', label: '接入中', value: stats.active, color: 'text-cyan-600', icon: 'zap' },
    { key: '已完成', label: '已完成', value: stats.done, color: 'text-green-600', icon: 'check' },
    { key: '暂停', label: '已暂停', value: stats.paused, color: 'text-slate-400', icon: 'pause' },
  ]

  return (
    <div className="page-shell">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="page-title">运营后台接入工作台</h1>
          <p className="text-xs md:page-subtitle hidden sm:block">一站式管理游戏项目接入运营后台的全流程，可视化追踪接入状态和进度</p>
        </div>
        <Link to="/new" className="btn-primary flex-shrink-0">
          <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新建项目
        </Link>
      </div>

      {/* 统计卡片 - 移动端2列，桌面4列 */}
      <div className="grid grid-cols-2 md:flex md:gap-4 gap-3 mb-6">
        {filterOptions.map(opt => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={`stat-card surface-card p-3 md:p-4 cursor-pointer text-left transition-all ${
              filter === opt.key
                ? 'border-primary-500 shadow-sm'
                : 'border-transparent hover:border-slate-200'
            } md:flex-1`}
            
          >
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-2xl md:text-3xl font-bold ${filter === opt.key ? 'text-primary-600' : opt.color}`}>
                  {opt.value}
                </div>
                <div className="text-xs md:text-sm text-slate-500 mt-0.5 md:mt-1">{opt.label}</div>
              </div>
              <div className={`w-9 h-9 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                opt.key === 'all' ? 'bg-slate-100' :
                opt.key === '接入中' ? 'bg-cyan-50' :
                opt.key === '已完成' ? 'bg-green-50' : 'bg-slate-100'
              }`}>
                {opt.key === 'all' && (
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                )}
                {opt.key === '接入中' && (
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
                {opt.key === '已完成' && (
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {opt.key === '暂停' && (
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 搜索栏 */}
      <div className="surface-card p-3 md:p-4 mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg flex-1">
            <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="搜索游戏名称 / ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent outline-none flex-1 text-sm text-slate-700 min-w-0"
            />
          </div>
        </div>
      </div>

      {/* 桌面端项目表格 */}
      <div className="hidden md:block surface-card overflow-hidden">
        {/* 表头 */}
        <div className="grid grid-cols-[40px_minmax(210px,1.25fr)_88px_88px_320px_118px_100px_112px] gap-x-4 px-5 py-3.5 bg-slate-50/80 text-xs text-slate-400 font-semibold uppercase tracking-wide border-b border-slate-100">
          <span></span>
          <span>游戏项目</span>
          <span>阶段</span>
          <span>发行地区</span>
          <span>接入进度</span>
          <span>计划对外</span>
          <span>负责人</span>
          <span>状态</span>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400">加载中…</div>
        ) : activeProjects.length === 0 && pausedProjects.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-lg mb-2">📋</p>
            <p>暂无项目，点击右上角「新建项目」开始</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="project-list">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={snapshot.isDraggingOver ? 'bg-primary-50/30' : ''}
                >
                  {activeProjects.map((project, index) => (
                    <Draggable key={project.id} draggableId={project.id.toString()} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={snapshot.isDragging ? 'bg-primary-50 shadow-lg rounded' : ''}
                        >
                          <div {...provided.dragHandleProps}>
                            <ProjectRow
                              project={project}
                              progress={progress}
                              flowProgress={flowProgress}
                              openStatusId={openStatusId}
                              onToggleStatus={(id) => setOpenStatusId(openStatusId === id ? null : id)}
                              onStatusChange={updateStatus}
                              isDragDisabled={false}
                            />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {/* 暂停项目区域 */}
            {showPausedSection && (
              <>
                <div className="flex items-center gap-3 px-5 py-3 bg-slate-50/50 border-t border-b border-slate-100">
                  <span className="w-2 h-2 rounded-full bg-gray-300" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">已暂停项目</span>
                  <span className="text-xs text-slate-400">({pausedProjects.length})</span>
                </div>
                <div>
                  {pausedProjects.map(project => (
                    <ProjectRow
                      key={project.id}
                      project={project}
                      progress={progress}
                      flowProgress={flowProgress}
                      openStatusId={openStatusId}
                      onToggleStatus={(id) => setOpenStatusId(openStatusId === id ? null : id)}
                      onStatusChange={updateStatus}
                      isDragDisabled={true}
                    />
                  ))}
                </div>
              </>
            )}
          </DragDropContext>
        )}
      </div>

      {/* 移动端卡片列表 */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-400">加载中…</div>
        ) : activeProjects.length === 0 && pausedProjects.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-lg mb-2">📋</p>
            <p className="text-sm">暂无项目，点击右上角「新建项目」开始</p>
          </div>
        ) : (
          <>
            {activeProjects.map(project => {
              const prog = progress[project.id] || { total: 0, completed: 0 }
              const pct = prog.total > 0 ? Math.round(prog.completed / prog.total * 100) : 0
              const flow = flowProgress[project.id] || { total: 0, completed: 0, questionnairePending: false }
              const flowPct = flow.total > 0 ? Math.round(flow.completed / flow.total * 100) : 0
              const displayStatus = getDisplayStatus(project, progress)
              const stageNum = project.stage_id ? project.stage_id - 1 : 0
              return (
                <Link
                  key={project.id}
                  to={`/project/${project.id}`}
                  className="block surface-card p-4 active:bg-slate-50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="font-semibold text-slate-950 text-[15px]">{project.game_name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{project.game_id} · {project.department}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STAGE_COLORS[stageNum]}`}>阶段{stageNum}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        displayStatus === '接入中' ? 'bg-cyan-50 text-cyan-600' :
                        displayStatus === '已完成' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[displayStatus]}`} />
                        {displayStatus}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <ProgressLine label="接入进度" value={`${flowPct}%`} pct={flowPct} color="bg-gradient-to-r from-teal-500 to-teal-400" />
                    {flow.questionnairePending && displayStatus === '已完成' && (
                      <div className="pl-14 text-[10px] text-amber-500 leading-none">问卷待补</div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span>{project.region}</span>
                    {project.leader_name && <><span>·</span><span>{project.leader_name}</span></>}
                    {(() => {
                      const info = getLaunchDateInfo(project.launch_date, displayStatus)
                      return <span className={info.color}>{info.text}</span>
                    })()}
                  </div>
                </Link>
              )
            })}

            {showPausedSection && (
              <>
                <div className="flex items-center gap-2 px-1 py-2">
                  <span className="w-2 h-2 rounded-full bg-gray-300" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">已暂停项目</span>
                  <span className="text-xs text-slate-400">({pausedProjects.length})</span>
                </div>
                {pausedProjects.map(project => {
                  const flow = flowProgress[project.id] || { total: 0, completed: 0 }
                  const flowPct = flow.total > 0 ? Math.round(flow.completed / flow.total * 100) : 0
                  const stageNum = project.stage_id ? project.stage_id - 1 : 0
                  return (
                    <Link
                      key={project.id}
                      to={`/project/${project.id}`}
                      className="block surface-card p-4 opacity-60"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0 mr-3">
                          <div className="font-semibold text-slate-950 text-[15px]">{project.game_name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{project.game_id} · {project.department}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STAGE_COLORS[stageNum]}`}>阶段{stageNum}</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            暂停
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gray-200" style={{ width: `${flowPct}%` }} />
                        </div>
                        <span className="text-xs text-slate-400 w-8 text-right">{flowPct}%</span>
                      </div>
                    </Link>
                  )
                })}
              </>
            )}
          </>
        )}
      </div>

      {/* 提示（仅桌面） */}
      {!loading && activeProjects.length > 0 && (
        <p className="hidden md:block text-center text-xs text-slate-400 mt-4">
          💡 拖动左侧 ⋮⋮ 可对项目排序，暂停项目自动置底
        </p>
      )}
    </div>
  )
}
