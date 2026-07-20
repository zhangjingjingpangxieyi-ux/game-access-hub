import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { supabase } from '../lib/supabase'
import { TeamNeedsFull, RichContentInline } from '../components/TeamNeedsCell'
import PlayerFieldConfig, { getPlayerInfoSummary, getPlayerInfoConfig, PlayerFieldConfigModal, buildDefaultConfig } from '../components/PlayerFieldConfig'
import { getAccessResponsibility, getMaterialInfo, getPlatformContacts } from '../lib/featureMeta'

const SATISFACTION_FORM_URL = 'https://alidocs.dingtalk.com/notable/share/form/v012M9qPBdJWKQgl015_dv19yqvsgs3oebp3pcjys_1qX0QQ0'

// ============================================
// 状态体系
// ============================================

const DEV_STATUSES = ['待开发', '平台开发中', '游戏联调中']
const TEST_STATUSES = ['平台测试中', '游戏验收中', '已通过']
const ALL_STATUSES = [...DEV_STATUSES, ...TEST_STATUSES]
const PLAYER_INFO_FEATURE_NAME = '玩家信息管理'

const STATUS_MIGRATE = {
  '开发中': '平台开发中',
  '联调中': '游戏联调中',
  '测试中': '平台测试中',
  '待验收': '游戏验收中',
}

function migrateStatus(status) {
  return STATUS_MIGRATE[status] || status
}

const STATUS_STYLE = {
  '待开发': 'bg-slate-100 text-slate-600',
  '平台开发中': 'bg-blue-100 text-blue-700',
  '游戏联调中': 'bg-purple-100 text-purple-700',
  '平台测试中': 'bg-amber-100 text-amber-700',
  '游戏验收中': 'bg-orange-100 text-orange-700',
  '已通过': 'bg-green-100 text-green-700',
}

const KANBAN_LABELS = {
  '待开发': { title: '待开发', color: 'text-slate-400', bg: 'bg-slate-50' },
  '平台开发中': { title: '平台开发中', color: 'text-blue-600', bg: 'bg-blue-50/50' },
  '游戏联调中': { title: '游戏联调中', color: 'text-purple-600', bg: 'bg-purple-50/50' },
  '平台测试中': { title: '平台测试中', color: 'text-amber-600', bg: 'bg-amber-50/50' },
  '游戏验收中': { title: '游戏验收中', color: 'text-orange-600', bg: 'bg-orange-50/50' },
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
  '项目组': 'bg-slate-50 text-slate-600',
  'PM/项目组': 'bg-pink-50 text-pink-600',
}

// ============================================
// 步骤编号
// ============================================

function getStepNumber(sortOrder) {
  const nums = ['', '①', '②', '③', '④', '⑤', '⑥', '⑦']
  return nums[sortOrder] || `${sortOrder}.`
}

function isCoreStep(step) {
  return step.sort_order !== 8
}

// ============================================
// 逾期 / 临近计算
// ============================================

function getOverdueInfo(launchDate, status) {
  if (!launchDate) return { type: 'none', text: '未填写计划对外日期', color: 'text-slate-400' }
  if (status === '已完成') return { type: 'done', days: null, text: `计划对外 ${launchDate}`, color: 'text-slate-500' }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const launch = new Date(launchDate + 'T00:00:00')
  const diff = Math.ceil((launch - today) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { type: 'overdue', days: -diff, text: `已逾期 ${Math.abs(diff)} 天`, color: 'text-red-500' }
  if (diff <= 30) return { type: 'near', days: diff, text: `距离对外 ${diff} 天`, color: 'text-amber-500' }
  return { type: 'ok', days: diff, text: `计划对外 ${launchDate}`, color: 'text-slate-500' }
}

// ============================================
// 相对时间
// ============================================

function relativeTime(dateStr) {
  if (!dateStr) return '-'
  const now = new Date()
  const d = new Date(dateStr)
  const diffMs = now - d
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 60) return `${diffMin} 分钟前`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} 小时前`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 30) return `${diffDay} 天前`
  return dateStr.slice(0, 10)
}

function truncateCanvasText(ctx, text, maxWidth) {
  const value = String(text || '-')
  if (ctx.measureText(value).width <= maxWidth) return value
  let result = value
  while (result.length > 0 && ctx.measureText(result + '...').width > maxWidth) {
    result = result.slice(0, -1)
  }
  return result + '...'
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function fillRoundRect(ctx, x, y, width, height, radius, fillStyle) {
  ctx.fillStyle = fillStyle
  roundRect(ctx, x, y, width, height, radius)
  ctx.fill()
}

function drawCanvasText(ctx, text, x, y, options = {}) {
  ctx.fillStyle = options.color || '#0f172a'
  ctx.font = `${options.weight || 400} ${options.size || 14}px -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif`
  ctx.textBaseline = 'top'
  ctx.fillText(text, x, y)
}

function drawProgressBar(ctx, x, y, width, pct, color) {
  fillRoundRect(ctx, x, y, width, 8, 4, '#e8eef6')
  fillRoundRect(ctx, x, y, Math.max(0, Math.min(width, width * pct / 100)), 8, 4, color)
}

// ============================================
// 状态下拉选择器
// ============================================

function StatusSelect({ value, onChange, confirmBeforeChange }) {
  const [open, setOpen] = useState(false)

  function handleSelect(s) {
    setOpen(false)
    if (s === value) return
    confirmBeforeChange(s)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border cursor-pointer ${STATUS_STYLE[value] || 'bg-slate-100 text-slate-600'}`}
      >
        {value}
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[110px]">
            {ALL_STATUSES.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => handleSelect(opt)}
                className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-slate-50 flex items-center gap-2 ${
                  opt === value ? 'font-semibold text-slate-950 bg-slate-50' : 'text-slate-600'
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full ${STATUS_STYLE[opt]?.split(' ')[0] || 'bg-slate-100'}`} />
                {opt}
                {opt === value && (
                  <svg className="ml-auto w-3.5 h-3.5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================
// 状态变更确认弹窗
// ============================================

function MaterialDetailInline({ text }) {
  const value = String(text || '')
  const urlPattern = /(https?:\/\/[^\s）\)，,。\u3000]+)/g
  const parts = []
  let lastIndex = 0
  let match
  while ((match = urlPattern.exec(value)) !== null) {
    if (match.index > lastIndex) parts.push({ type: 'text', value: value.slice(lastIndex, match.index) })
    parts.push({ type: 'url', value: match[0] })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < value.length) parts.push({ type: 'text', value: value.slice(lastIndex) })

  return (
    <>
      {parts.map((part, index) => part.type === 'url' ? (
        <a
          key={index}
          href={part.value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 underline break-all hover:text-primary-700"
          onClick={event => event.stopPropagation()}
        >
          {part.value}
        </a>
      ) : (
        <span key={index}>{part.value}</span>
      ))}
    </>
  )
}
function MaterialRequirementBadge({ material, prefix = '', className = '' }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const hideTimer = useRef(null)
  const detail = material?.detail && material.detail !== '-' ? material.detail : material?.label
  const canOpen = !!detail

  function showTooltip() {
    if (!canOpen) return
    clearTimeout(hideTimer.current)
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) {
      const width = 420
      const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12)
      setPosition({ top: rect.bottom + 8, left })
    }
    setOpen(true)
  }

  function scheduleHide() {
    hideTimer.current = setTimeout(() => setOpen(false), 180)
  }

  return (
    <>
      <span
        ref={triggerRef}
        className={`inline-flex px-2 py-1 rounded-md text-[11px] font-medium cursor-default ${material?.tone === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'} ${className}`}
        onMouseEnter={showTooltip}
        onMouseLeave={scheduleHide}
      >
        {prefix}{material?.label || '-'}
      </span>
      {open && (
        <div
          className="fixed z-[9999] w-[420px] max-w-[calc(100vw-24px)] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[12px] leading-[1.7] text-slate-700 shadow-2xl"
          style={{ top: position.top, left: position.left, whiteSpace: 'pre-wrap', wordBreak: 'break-word', userSelect: 'text' }}
          onMouseEnter={showTooltip}
          onMouseLeave={scheduleHide}
        >
          <div className="mb-1 text-[11px] font-bold text-slate-500">所需物料</div>
          <MaterialDetailInline text={detail} />
        </div>
      )}
    </>
  )
}
function StatusConfirmDialog({ open, featureName, oldStatus, newStatus, onConfirm, onCancel, onReasonChange, reason }) {
  if (!open) return null

  const isToPassed = newStatus === '已通过'
  const isFromPassed = oldStatus === '已通过' && newStatus !== '已通过'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-2xl w-[420px] max-w-[90vw] p-6 animate-[fadeIn_0.15s_ease-out]">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
          isToPassed ? 'bg-green-50' : isFromPassed ? 'bg-amber-50' : 'bg-blue-50'
        }`}>
          {isToPassed && (
            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {isFromPassed && (
            <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.364 5.636a9 9 0 1112.728 0l-.364-.364a9 9 0 00-12 0l-.364.364z" />
            </svg>
          )}
          {!isToPassed && !isFromPassed && (
            <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        <h3 className="text-center text-[15px] font-bold text-slate-950 mb-2">
          {isToPassed ? `确认「${featureName}」已验收通过？` : isFromPassed ? `将「${featureName}」从「已通过」改回「${newStatus}」` : `确认将「${featureName}」状态变更为「${newStatus}」`}
        </h3>

        <p className="text-center text-[13px] text-slate-500 mb-4">
          {isToPassed ? '确认后该功能的完成状态将更新，计入项目完成率。' : isFromPassed ? '⚠️ 该操作会降低项目完成率，确定要继续吗？' : `状态将从「${oldStatus}」变更为「${newStatus}」`}
        </p>

        <div className="mb-4">
          <label className="block text-[12px] text-slate-500 mb-1">备注（可选）</label>
          <textarea
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] bg-slate-50 focus:bg-white focus:border-primary-500 outline-none resize-none"
            rows={2}
            placeholder="填写状态变更原因"
            value={reason}
            onChange={e => onReasonChange(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-[13px] text-slate-600 hover:bg-slate-50">取消</button>
          <button type="button" onClick={onConfirm} className={`flex-1 px-4 py-2.5 rounded-lg text-[13px] text-white font-medium ${isFromPassed ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary-500 hover:bg-primary-600'}`}>确认变更</button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// 功能卡片组件（看板用�?
// ============================================

function FeatureCard({ feature, provided, isDragging, onConfigFieldClick }) {
  const hasPlayerFieldConfig = !!getPlayerInfoSummary(feature.extra_config)
  const isPlayerInfoFeature = feature.features?.name === PLAYER_INFO_FEATURE_NAME
  const updatedRelative = relativeTime(feature.status_updated_at)
  const responsibility = getAccessResponsibility(feature.features?.access_method)
  const contacts = getPlatformContacts(feature.features)
  const material = getMaterialInfo(feature.features?.team_needs)

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`bg-white rounded-lg p-3 text-[12px] border transition-all ${
        isDragging ? 'border-primary-400 shadow-lg ring-2 ring-primary-100' : 'border-slate-200 hover:border-gray-300 hover:shadow-sm'
      } cursor-grab active:cursor-grabbing`}
      style={{ ...provided.draggableProps.style }}
    >
      <div className="font-semibold text-[13px] leading-5 text-slate-950 mb-2 flex items-start gap-1 flex-wrap">
        {feature.features?.name}
        {feature.notes && <span className="text-[10px] text-primary-500">💬</span>}
        {(isPlayerInfoFeature || hasPlayerFieldConfig) && (
          <span className="text-[10px] text-blue-500 cursor-pointer hover:underline" onClick={e => { e.stopPropagation(); onConfigFieldClick?.(feature) }}>字段配置</span>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1.5 flex-wrap">
        <span className={`px-1 py-0.5 rounded text-[10px] ${STAGE_COLORS[feature.features?.stage_id - 1]}`}>阶段{feature.features?.stage_id - 1}</span>
        <span>{feature.features?.access_method || '-'}</span>
        <span>/ {responsibility}</span>
      </div>

      <div className="text-[11px] text-slate-500 mb-1.5" title={contacts.title}>平台联系人：{contacts.summary}</div>
      <div className="mb-2">
        <MaterialRequirementBadge material={material} prefix="物料：" />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_STYLE[feature.status] || 'bg-slate-100 text-slate-600'}`}>{feature.status}</span>
        <span className="text-[10px] text-slate-400">{updatedRelative}</span>
      </div>
    </div>
  )
}

// ============================================
// 看板列组�?
// ============================================

function KanbanColumn({ droppableId, status, items, onConfigFieldClick }) {
  const label = KANBAN_LABELS[status] || { title: status, color: 'text-slate-400', bg: 'bg-slate-50' }
  return (
    <div className={`${label.bg} rounded-lg border border-slate-200 p-2.5 min-h-[260px]`}>
      <div className={`text-[12px] font-bold mb-2 px-1 ${label.color}`}>{label.title} · {items.length}</div>
      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[210px] rounded transition-colors space-y-2 ${snapshot.isDraggingOver ? 'bg-primary-50 ring-1 ring-primary-200 ring-dashed' : ''}`}
          >
            {items.map((pf, index) => (
              <Draggable key={pf.id} draggableId={String(pf.id)} index={index}>
                {(dragProvided, dragSnapshot) => (
                  <FeatureCard
                    feature={pf}
                    provided={dragProvided}
                    isDragging={dragSnapshot.isDragging}
                    onConfigFieldClick={onConfigFieldClick}
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
// 功能列表组件（列表视图）�?紧凑�?
// ============================================

function FeatureListCompact({ features, statusFilter, onStatusFilterChange, onStatusChange, onConfigFieldClick, emptyText, visibleStatuses }) {
  const displayStatuses = visibleStatuses || ALL_STATUSES
  const filtered = statusFilter !== 'all' ? features.filter(f => f.status === statusFilter) : features

  return (
    <div className="bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 flex-wrap">
        <button
          onClick={() => onStatusFilterChange('all')}
          className={`px-2.5 py-1 rounded-full text-[11px] cursor-pointer transition-colors ${
            statusFilter === 'all' ? 'bg-gray-900 text-white font-medium' : 'bg-slate-100 text-slate-500 hover:bg-gray-200'
          }`}
        >
          全部 ({features.length})
        </button>
        {displayStatuses.map(s => (
          <button
            key={s}
            onClick={() => onStatusFilterChange(s)}
            className={`px-2.5 py-1 rounded-full text-[11px] cursor-pointer transition-colors ${
              statusFilter === s ? 'bg-primary-500 text-white font-medium' : 'bg-slate-100 text-slate-500 hover:bg-gray-200'
            }`}
          >
            {s} ({features.filter(f => f.status === s).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-300 text-[12px]">{emptyText || '暂无功能'}</div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[920px]">
            <div className="grid grid-cols-[minmax(260px,1.45fr)_190px_180px_150px_120px_90px] px-4 py-3 bg-slate-50 border-b border-slate-200 text-[12px] font-semibold text-slate-500">
              <span>功能</span>
              <span>接入与权责</span>
              <span>平台联系人</span>
              <span>物料要求</span>
              <span>当前状态</span>
              <span className="text-right">更新时间</span>
            </div>
          {filtered.map(pf => {
            const hasPlayerFieldConfig = !!getPlayerInfoSummary(pf.extra_config)
            const isPlayerInfoFeature = pf.features?.name === PLAYER_INFO_FEATURE_NAME
            const responsibility = getAccessResponsibility(pf.features?.access_method)
            const contacts = getPlatformContacts(pf.features)
            const material = getMaterialInfo(pf.features?.team_needs)
            return (
              <div key={pf.id} className="grid grid-cols-[minmax(260px,1.45fr)_190px_180px_150px_120px_90px] items-center px-4 py-3.5 border-b border-slate-100 text-[13px] hover:bg-slate-50/80 transition-colors">
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-[13px] text-slate-950">{pf.features?.name}</span>
                      {pf.notes && <span className="text-[10px] text-primary-500">💬</span>}
                      {(isPlayerInfoFeature || hasPlayerFieldConfig) && (
                        <span className="text-[11px] text-blue-500 cursor-pointer hover:text-blue-700 hover:underline" onClick={e => { e.stopPropagation(); onConfigFieldClick?.(pf) }}>字段配置</span>
                      )}
                    </div>
                    {pf.notes && <div className="mt-1 truncate text-[11px] text-primary-400" title={pf.notes}>备注：{pf.notes}</div>}
                  </div>

                  <div className="text-[12px] text-slate-500">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${STAGE_COLORS[pf.features?.stage_id - 1]}`}>阶段{pf.features?.stage_id - 1}</span>
                    <div className="mt-1 truncate" title={`${pf.features?.access_method || '-'} / ${responsibility}`}>{pf.features?.access_method || '-'} / {responsibility}</div>
                  </div>

                  <div className="truncate text-[12px] font-medium text-slate-700" title={contacts.title}>{contacts.summary}</div>

                  <div>
                    <MaterialRequirementBadge material={material} />
                  </div>

                  <div>
                    <StatusSelect
                      value={pf.status}
                      confirmBeforeChange={(newStatus) => onStatusChange(pf, newStatus)}
                    />
                  </div>

                  <div className="text-right text-[11px] text-slate-400">
                    {relativeTime(pf.status_updated_at)}
                  </div>
              </div>
            )
          })}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// Checkbox 步骤勾选列表（点击 ①②③④⑤⑧ 时显示）
// ============================================

function StepChecklist({ steps, stepRecords, selectedStepId, onToggleStep }) {
  // 只显�?checkbox 类型的步骤（sort_order: 1,2,3,4,5,8�?
  const checkboxSteps = steps.filter(s => {
    const cat = s.step_category || 'checkbox'
    return cat === 'checkbox' && [1, 2, 3, 4, 5, 8].includes(s.sort_order)
  })

  // 如果选中了某个特定节点，只显示该节点；否则显示全�?checkbox 步骤
  const displaySteps = selectedStepId
    ? checkboxSteps.filter(s => s.id === selectedStepId)
    : checkboxSteps

  return (
    <div className="space-y-2">
      {displaySteps.map(step => {
        const record = stepRecords.find(r => r.step_id === step.id)
        const done = !!record?.is_completed

        return (
          <div
            key={step.id}
            onClick={() => onToggleStep(step.id, done)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${
              done
                ? 'bg-white border-green-200 hover:border-green-300 hover:shadow-sm'
                : 'bg-white border-slate-200 hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            {/* Checkbox */}
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              done ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'
            }`}>
              {done && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>

            {/* 步骤名称 */}
            <div className="flex-1 min-w-0">
              <span className={`text-[13px] font-medium ${done ? 'text-green-700 line-through' : 'text-slate-800'}`}>
                {step.sort_order === 8 ? step.step_name : `${getStepNumber(step.sort_order)} ${step.step_name}`}
              </span>
              {step.sort_order === 8 && (
                <div className="mt-2">
                  <a
                    href={SATISFACTION_FORM_URL}
                    target="_blank"
                    rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-pink-50 text-pink-600 text-[12px] font-medium hover:bg-pink-100 transition-colors"
                  >
                    打开满意度问卷
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M9 7h8v8" />
                    </svg>
                  </a>
                </div>
              )}
            </div>

            {/* 右侧：负责人角色 + 完成状�?*/}
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${ROLE_COLORS[step.responsible_role] || 'bg-slate-50 text-slate-500'}`}>
                {step.responsible_role}
              </span>
              <span className={`text-[12px] font-medium ${done ? 'text-green-600' : 'text-slate-400'}`}>
                {done ? '✓ 已完成' : ''}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================
// 接入流程路线图组件（左侧导航�?
// ============================================

function getStepFeatureCount(step, features) {
  if (step.sort_order === 6) return features.filter(f => DEV_STATUSES.includes(f.status)).length
  if (step.sort_order === 7) return features.filter(f => TEST_STATUSES.includes(f.status)).length
  return features.filter(f => f.features?.stage_id === step.sort_order).length
}

function getStepProgressState(step, stepRecords, features) {
  const record = stepRecords.find(r => r.step_id === step.id)

  if (step.sort_order === 6) {
    const devCount = features.filter(f => DEV_STATUSES.includes(f.status)).length
    return devCount === 0 ? 'done' : 'current'
  }

  if (step.sort_order === 7) {
    const passedCount = features.filter(f => f.status === '已通过').length
    const testingCount = features.filter(f => TEST_STATUSES.includes(f.status) && f.status !== '已通过').length
    if (features.length > 0 && passedCount === features.length) return 'done'
    if (testingCount > 0 || passedCount > 0) return 'current'
    return 'pending'
  }

  return record?.is_completed ? 'done' : 'pending'
}

function getCurrentStep(steps, stepRecords, features) {
  const coreSteps = steps.filter(isCoreStep)
  for (const step of coreSteps) {
    if (getStepProgressState(step, stepRecords, features) !== 'done') return step
  }
  return coreSteps.length > 0 ? coreSteps[coreSteps.length - 1] : null
}

function RoadmapNav({ steps, stepRecords, features, selectedStepId, onStepClick }) {
  const currentStepId = getCurrentStep(steps, stepRecords, features)?.id || null

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-200 text-[16px] font-bold text-slate-950">接入流程路线图</div>
      <div className="p-3 space-y-1">
        {steps.map((step, idx) => {
          const stepState = getStepProgressState(step, stepRecords, features)
          const done = stepState === 'done'
          const isQuestionnaire = step.sort_order === 8
          const record = stepRecords.find(r => r.step_id === step.id)
          const isCurrent = !isQuestionnaire && step.id === currentStepId && !done
          const isSelected = step.id === selectedStepId
          const featCount = getStepFeatureCount(step, features)

          return (
            <div
              key={step.id}
              onClick={() => onStepClick(step.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors border ${
                isSelected ? 'bg-blue-50 border-blue-200' : isCurrent ? 'bg-blue-50/60 border-blue-100' : 'border-transparent hover:bg-slate-50'
              }`}
            >
              {/* 编号圆圈 */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 ${
                isQuestionnaire
                  ? 'bg-pink-50 text-pink-500'
                  : done ? 'bg-emerald-600 text-white' : isCurrent ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {isQuestionnaire ? '问' : done ? '✓' : idx + 1}
              </div>

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <div className={`text-[13px] font-semibold leading-tight ${done ? 'text-emerald-700' : isCurrent ? 'text-primary-700' : 'text-slate-900'}`}>
                  {isQuestionnaire ? step.step_name : `${getStepNumber(step.sort_order)} ${step.step_name}`}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${ROLE_COLORS[step.responsible_role] || 'bg-slate-50 text-slate-500'}`}>
                    {step.responsible_role}
                  </span>
                  {featCount > 0 && (
                    <span className="text-[11px] text-slate-400">{featCount} 个功能</span>
                  )}
                </div>
              </div>

              {/* 右侧状�?*/}
              <div className="flex-shrink-0">
                {isQuestionnaire ? (
                  <span className={`text-[10px] font-medium ${record?.is_completed ? 'text-emerald-600' : 'text-amber-500'}`}>
                    {record?.is_completed ? '已填写' : '待补'}
                  </span>
                ) : (
                  <>
                    {done && <span className="text-[10px] text-emerald-600 font-medium">已完成</span>}
                    {isCurrent && <span className="text-[10px] text-primary-600 font-medium">进行中</span>}
                    {!done && !isCurrent && <span className="text-[10px] text-slate-300">未开始</span>}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// 风险提醒卡片（紧凑版�?
// ============================================

function RiskBadge({ label, count, description, color, active, onClick }) {
  const styles = {
    red: 'border-l-red-500',
    amber: 'border-l-amber-500',
    blue: 'border-l-blue-500',
    teal: 'border-l-teal-600',
    purple: 'border-l-indigo-500',
  }
  const activeStyles = {
    red: 'ring-red-100 bg-red-50/30',
    amber: 'ring-amber-100 bg-amber-50/30',
    blue: 'ring-blue-100 bg-blue-50/30',
    teal: 'ring-teal-100 bg-teal-50/30',
    purple: 'ring-indigo-100 bg-indigo-50/30',
  }
  return (
    <div
      onClick={onClick}
      className={`rounded-lg border border-l-4 border-slate-200 bg-white px-4 py-3 cursor-pointer transition-all shadow-sm hover:shadow-md ${styles[color] || 'border-l-gray-300'} ${active ? `ring-2 ${activeStyles[color] || 'ring-gray-100'}` : ''}`}
    >
      <div className="text-[15px] font-bold text-gray-950">{count} {label}</div>
      <div className="mt-1 text-[12px] text-slate-500">{description}</div>
    </div>
  )
}

// ============================================
// 主页�?
// ============================================

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [features, setFeatures] = useState([])
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)

  // 接入流程�? 阶段步骤�?
  const [allSteps, setAllSteps] = useState([])
  const [stepRecords, setStepRecords] = useState([])

  // 视图切换
  const [kanbanView, setKanbanView] = useState(false)

  // 筛选
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedStepId, setSelectedStepId] = useState(null) // 选中的路线图节点
  const [riskFilter, setRiskFilter] = useState(null)

  // 状态变更确认弹窗
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [confirmReason, setConfirmReason] = useState('')

  // 玩家信息配置编辑弹窗
  const [editingPlayerInfo, setEditingPlayerInfo] = useState(null)

  // 时间线展开
  const [timelineExpanded, setTimelineExpanded] = useState(false)

  // 接入流程步骤分类
  // ============================================
  // 数据获取
  // ============================================

  useEffect(() => {
    fetchDetail()
  }, [id])

  async function fetchDetail() {
    setLoading(true)

    const [projResult, pfResult, tlResult] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('project_features').select('*, features(*)').eq('project_id', id),
      supabase.from('project_timeline').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    ])

    const { data: proj } = projResult
    if (!proj) { setLoading(false); return }
    setProject(proj)

    const featuresData = pfResult.data || []
    // 旧状态兼容映�?
    const STATUS_MAP = { '待接入': '待开发', '已完成': '已通过', '开发中': '平台开发中', '联调中': '游戏联调中', '测试中': '平台测试中', '待验收': '游戏验收中' }
    let needMigrate = []
    const migrated = featuresData.map(f => {
      const mapped = STATUS_MAP[f.status]
      if (mapped) { needMigrate.push({ id: f.id, newStatus: mapped }); return { ...f, status: mapped } }
      return f
    })
    if (needMigrate.length > 0) {
      await Promise.all(needMigrate.map(m =>
        supabase.from('project_features').update({ status: m.newStatus }).eq('id', m.id)
      ))
    }
    setFeatures(migrated)
    setTimeline(tlResult.data || [])

    try {
      const [stepsResult, recordsResult] = await Promise.all([
        supabase.from('access_steps').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('project_global_steps').select('*').eq('project_id', id),
      ])
      if (stepsResult.data) setAllSteps(stepsResult.data)
      setStepRecords(recordsResult.data || [])
    } catch (e) {
      console.warn('接入流程表尚未创建，跳过步骤加载')
    }

    setLoading(false)
  }

  // ============================================
  // 状态变更处理（含确认弹窗）
  // ============================================

  function handleStatusChangeRequest(pf, newStatus) {
    const oldStatus = pf.status
    if (newStatus !== '已通过' && oldStatus !== '已通过') {
      executeStatusChange(pf.id, oldStatus, newStatus, '')
      return
    }
    setConfirmDialog({ pfId: pf.id, featureName: pf.features?.name, oldStatus, newStatus })
    setConfirmReason('')
  }

  async function executeStatusChange(pfId, oldStatus, newStatus, reason) {
    const oldFeatures = [...features]
    setFeatures(prev => prev.map(f => f.id === pfId ? { ...f, status: newStatus, status_updated_at: new Date().toISOString() } : f))
    setConfirmDialog(null)
    setConfirmReason('')

    try {
      const { error } = await supabase
        .from('project_features')
        .update({ status: newStatus, status_updated_at: new Date().toISOString() })
        .eq('id', pfId)
      if (error) { setFeatures(oldFeatures); alert('更新失败') }
      else {
        const pf = oldFeatures.find(f => f.id === pfId)
        if (pf && pf.features?.name) {
          await supabase.from('project_timeline').insert({
            project_id: id,
            event: `${pf.features.name} 状态更新为「${newStatus}」`,
            target_name: pf.features.name,
            operator_name: '当前用户',
            old_status: oldStatus,
            new_status: newStatus,
            remark: reason || null,
          })
          const { data: newTl } = await supabase.from('project_timeline').select('*').eq('project_id', id).order('created_at', { ascending: false })
          if (newTl) setTimeline(newTl)
        }
      }
    } catch (e) {
      setFeatures(oldFeatures)
      alert('更新失败')
    }
  }

  // ============================================
  // 勾�?取消全局步骤
  // ============================================

  async function toggleGlobalStep(stepId, currentStatus) {
    const newCompleted = !currentStatus
    setStepRecords(prev => prev.map(r =>
      r.step_id === stepId ? { ...r, is_completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null } : r
    ))
    const existing = stepRecords.find(r => r.step_id === stepId)
    try {
      if (existing) {
        await supabase.from('project_global_steps').update({
          is_completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null, updated_at: new Date().toISOString(),
        }).eq('id', existing.id)
      } else {
        const { data } = await supabase.from('project_global_steps').insert({
          project_id: id, step_id: stepId, is_completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null,
        }).select().single()
        if (data) setStepRecords(prev => [...prev, data])
      }
      const step = allSteps.find(s => s.id === stepId)
      if (newCompleted && step) {
        await supabase.from('project_timeline').insert({
          project_id: id, event: `${step.step_name} 已完成（${step.responsible_role}）`,
          target_name: step.step_name, operator_name: '当前用户', old_status: '未开始', new_status: '已完成',
        })
        const { data: newTl } = await supabase.from('project_timeline').select('*').eq('project_id', id).order('created_at', { ascending: false })
        if (newTl) setTimeline(newTl)
      }
    } catch (e) { setStepRecords(stepRecords); alert('更新失败') }
  }

  function getStepRecord(stepId) { return stepRecords.find(r => r.step_id === stepId) }

  // ============================================
  // 保存玩家信息配置
  // ============================================

  async function savePlayerInfoConfig(pfId, newConfig) {
    try {
      const { error } = await supabase.from('project_features').update({ extra_config: Object.keys(newConfig).length > 0 ? { player_info: newConfig } : null }).eq('id', pfId)
      if (error) { alert('保存失败：' + error.message); return }
      setFeatures(prev => prev.map(f => f.id === pfId ? { ...f, extra_config: Object.keys(newConfig).length > 0 ? { player_info: newConfig } : null } : f))
      setEditingPlayerInfo(null)
    } catch (err) { alert('保存失败：' + err.message) }
  }

  function openPlayerInfoConfig(feature) {
    setEditingPlayerInfo({
      pfId: feature.id,
      config: buildDefaultConfig(getPlayerInfoConfig(feature.extra_config)),
      featureName: feature.features?.name,
    })
  }

  // ============================================
  // 拖拽处理
  // ============================================

  const onDragEnd = useCallback(async (result) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return
    const destColumnId = destination.droppableId
    const [phase, newStatus] = destColumnId.split('-')
    if (phase === 'dev' && !DEV_STATUSES.includes(newStatus)) return
    if (phase === 'test' && !TEST_STATUSES.includes(newStatus)) return

    const oldFeatures = [...features]
    const now = new Date().toISOString()
    setFeatures(prev => prev.map(f => String(f.id) === draggableId ? { ...f, status: newStatus, status_updated_at: now } : f))
    try {
      const { error } = await supabase.from('project_features').update({ status: newStatus, status_updated_at: now }).eq('id', draggableId)
      if (error) { setFeatures(oldFeatures); alert('拖拽更新失败') }
      else {
        const pf = oldFeatures.find(f => String(f.id) === draggableId)
        if (pf && pf.features?.name) {
          await supabase.from('project_timeline').insert({
            project_id: id, event: `${pf.features.name} 拖拽至「${newStatus}」`,
            target_name: pf.features.name, operator_name: '当前用户', old_status: pf.status, new_status: newStatus,
          })
          const { data: newTl } = await supabase.from('project_timeline').select('*').eq('project_id', id).order('created_at', { ascending: false })
          if (newTl) setTimeline(newTl)
        }
      }
    } catch (e) { setFeatures(oldFeatures) }
  }, [features, id])

  // ============================================
  // 计算属性
  // ============================================

  const coreFlowSteps = allSteps.filter(isCoreStep)
  const flowStepDone = coreFlowSteps.filter(s => getStepProgressState(s, stepRecords, features) === 'done').length
  const flowStepTotal = coreFlowSteps.length
  const flowStepPct = flowStepTotal > 0 ? Math.round(flowStepDone / flowStepTotal * 100) : 0
  const currentStep = getCurrentStep(allSteps, stepRecords, features)
  const activeStepId = selectedStepId || currentStep?.id || null

  useEffect(() => {
    if (loading || !currentStep?.id) return
    const selectedStepExists = selectedStepId ? allSteps.some(s => s.id === selectedStepId) : false
    if (!selectedStepId || !selectedStepExists) {
      setSelectedStepId(currentStep.id)
      setStatusFilter('all')
    }
  }, [loading, currentStep?.id, selectedStepId, allSteps, stepRecords])

  const totalFeatures = features.length
  const passedFeatures = features.filter(f => f.status === '已通过').length
  const featurePct = totalFeatures > 0 ? Math.round(passedFeatures / totalFeatures * 100) : 0
  const statusCounts = {}
  ALL_STATUSES.forEach(s => { statusCounts[s] = features.filter(f => f.status === s).length })

  // 根据选中节点过滤功能列表
  const filteredFeatures = (() => {
    let list = features
    if (!activeStepId) {
      list = []
    } else {
    const step = allSteps.find(s => s.id === activeStepId)
      if (!step) list = []
      else if (step.sort_order === 6) list = features.filter(f => DEV_STATUSES.includes(f.status))
      else if (step.sort_order === 7) list = features.filter(f => TEST_STATUSES.includes(f.status))
    // checkbox 步骤：按 stage_id 关联
      else list = features.filter(f => f.features?.stage_id === step.sort_order)
    }

    if (riskFilter === 'materials') return list.filter(f => f.features?.team_needs && f.status !== '已通过')
    if (riskFilter === 'owner') return list.filter(f => ['待开发', '平台开发中', '游戏联调中'].includes(f.status))
    if (riskFilter === 'stale') return list.filter(f => {
      if (f.status === '已通过' || !f.status_updated_at) return false
      return (new Date() - new Date(f.status_updated_at)) / (1000 * 60 * 60 * 24) > 3
    })
    return list
  })()

  const overdueInfo = getOverdueInfo(project?.launch_date, project?.status)
  const missingMaterialCount = features.filter(f => f.features?.team_needs && f.status !== '已通过').length
  const pendingGroupCount = features.filter(f => ['待开发', '平台开发中', '游戏联调中'].includes(f.status)).length
  const staleCount = features.filter(f => { if (f.status === '已通过') return false; if (!f.status_updated_at) return false; return (new Date() - new Date(f.status_updated_at)) / (1000 * 60 * 60 * 24) > 3 }).length

  const devKanbanData = {}
  DEV_STATUSES.forEach(s => { devKanbanData[s] = filteredFeatures.filter(f => f.status === s) })
  const testKanbanData = {}
  TEST_STATUSES.forEach(s => { testKanbanData[s] = filteredFeatures.filter(f => f.status === s) })

  const displayedTimeline = timelineExpanded ? timeline : timeline.slice(0, 10)

  // 当前选中节点信息（用于决定右侧显示什么）
  const selectedStep = activeStepId ? allSteps.find(s => s.id === activeStepId) : null
  // checkbox 步骤�?sort_order: 1,2,3,4,5,8
  const isCheckboxStep = selectedStep ? (selectedStep.step_category === 'checkbox' || [1, 2, 3, 4, 5, 8].includes(selectedStep.sort_order)) : false

  // 当前选中节点的名称（用于标题显示）
  const selectedStepName = selectedStep?.step_name || null
  const launchRiskBadge = (() => {
    if (overdueInfo.type === 'overdue') {
      return {
        label: '已逾期',
        count: `${overdueInfo.days} 天`,
        description: project.launch_date ? `计划对外：${project.launch_date}` : '未填写计划对外日期',
        color: 'red',
      }
    }
    if (overdueInfo.type === 'near') {
      return {
        label: '计划对外',
        count: project.launch_date,
        description: `距离对外 ${overdueInfo.days} 天`,
        color: 'amber',
      }
    }
    return {
      label: '计划对外',
      count: overdueInfo.type === 'none' ? '未填写' : project.launch_date,
      description: overdueInfo.type === 'none' ? '未填写计划对外日期' : '未逾期',
      color: 'blue',
    }
  })()

  function getProgressExportGroups(statuses) {
    return statuses.map(status => ({
      status,
      items: features.filter(f => f.status === status),
    }))
  }

  function strokeRoundRect(ctx, x, y, width, height, radius, strokeStyle = '#e2e8f0', lineWidth = 1) {
    ctx.save()
    ctx.strokeStyle = strokeStyle
    ctx.lineWidth = lineWidth
    roundRect(ctx, x, y, width, height, radius)
    ctx.stroke()
    ctx.restore()
  }

  function drawExportPanel(ctx, x, y, width, height, radius = 8) {
    fillRoundRect(ctx, x, y, width, height, radius, '#ffffff')
    strokeRoundRect(ctx, x, y, width, height, radius, '#dbe3ee')
  }

  function drawExportPill(ctx, text, x, y, color, bg) {
    ctx.font = `700 12px -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif`
    const width = Math.ceil(ctx.measureText(text).width) + 18
    fillRoundRect(ctx, x, y, width, 24, 6, bg)
    drawCanvasText(ctx, text, x + 9, y + 5, { size: 12, weight: 700, color })
    return width
  }

  function getListItems(groups) {
    return groups.flatMap(group => group.items)
  }

  function getListSectionHeight(groups) {
    const rowCount = getListItems(groups).length
    return 58 + 42 + 34 + Math.max(1, rowCount) * 52 + 8
  }

  function drawTablePill(ctx, text, x, y, color, bg, minWidth = 0) {
    ctx.font = `700 10px -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif`
    const width = Math.max(minWidth, Math.ceil(ctx.measureText(text).width) + 16)
    fillRoundRect(ctx, x, y, width, 22, 5, bg)
    drawCanvasText(ctx, text, x + 8, y + 5, { size: 10, weight: 700, color })
    return width
  }

  function drawFeatureListSection(ctx, title, tag, groups, x, y, width, accentColor, accentBg) {
    const height = getListSectionHeight(groups)
    const items = getListItems(groups)
    const innerX = x + 16
    const innerW = width - 32

    drawExportPanel(ctx, x, y, width, height, 8)
    drawCanvasText(ctx, '接入步骤', x + 16, y + 17, { size: 16, weight: 800, color: '#0f172a' })
    const tagWidth = drawExportPill(ctx, tag, x + 96, y + 13, accentColor, accentBg)
    drawCanvasText(ctx, `${items.length}/${totalFeatures}`, x + 106 + tagWidth, y + 19, { size: 11, weight: 700, color: '#94a3b8' })

    let tabX = innerX
    tabX += drawTablePill(ctx, `全部 (${items.length})`, tabX, y + 70, '#ffffff', '#0f172a', 58) + 8
    groups.forEach(group => {
      tabX += drawTablePill(ctx, `${group.status} (${group.items.length})`, tabX, y + 70, '#64748b', '#eef2f7') + 8
    })

    const headY = y + 108
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(x + 1, headY, width - 2, 34)
    ctx.strokeStyle = '#e2e8f0'
    ctx.beginPath()
    ctx.moveTo(x, headY)
    ctx.lineTo(x + width, headY)
    ctx.moveTo(x, headY + 34)
    ctx.lineTo(x + width, headY + 34)
    ctx.stroke()

    const col = {
      feature: innerX,
      access: innerX + innerW * 0.43,
      contact: innerX + innerW * 0.58,
      material: innerX + innerW * 0.72,
      status: innerX + innerW * 0.84,
      updated: innerX + innerW * 0.94,
    }
    drawCanvasText(ctx, '功能', col.feature, headY + 10, { size: 11, weight: 800, color: '#64748b' })
    drawCanvasText(ctx, '接入与权责', col.access, headY + 10, { size: 11, weight: 800, color: '#64748b' })
    drawCanvasText(ctx, '平台联系人', col.contact, headY + 10, { size: 11, weight: 800, color: '#64748b' })
    drawCanvasText(ctx, '物料要求', col.material, headY + 10, { size: 11, weight: 800, color: '#64748b' })
    drawCanvasText(ctx, '当前状态', col.status, headY + 10, { size: 11, weight: 800, color: '#64748b' })
    drawCanvasText(ctx, '更新时间', col.updated, headY + 10, { size: 11, weight: 800, color: '#64748b' })

    if (items.length === 0) {
      drawCanvasText(ctx, '暂无功能', innerX, headY + 54, { size: 12, color: '#94a3b8' })
      return height
    }

    items.forEach((item, idx) => {
      const rowY = headY + 34 + idx * 52
      ctx.strokeStyle = '#edf2f7'
      ctx.beginPath()
      ctx.moveTo(x + 1, rowY + 52)
      ctx.lineTo(x + width - 1, rowY + 52)
      ctx.stroke()

      const material = getMaterialInfo(item.features?.team_needs)
      const contacts = getPlatformContacts(item.features)
      const responsibility = getAccessResponsibility(item.features?.access_method)
      const stageText = `阶段${(item.features?.stage_id || 1) - 1}`
      const statusTone = item.status === '已通过' ? ['#047857', '#dcfce7'] : TEST_STATUSES.includes(item.status) ? ['#ea580c', '#ffedd5'] : item.status === '待开发' ? ['#475569', '#f1f5f9'] : ['#7c3aed', '#f3e8ff']

      drawCanvasText(ctx, truncateCanvasText(ctx, item.features?.name || '-', innerW * 0.38), col.feature, rowY + 18, { size: 12, weight: 800, color: '#0f172a' })
      drawTablePill(ctx, stageText, col.access, rowY + 10, '#d97706', '#fef3c7', 38)
      drawCanvasText(ctx, truncateCanvasText(ctx, `${item.features?.access_method || '-'} / ${responsibility}`, innerW * 0.13), col.access, rowY + 34, { size: 10, color: '#64748b' })
      drawCanvasText(ctx, truncateCanvasText(ctx, contacts.summary, innerW * 0.12), col.contact, rowY + 20, { size: 11, weight: 700, color: '#64748b' })
      drawTablePill(ctx, material.label, col.material, rowY + 15, material.tone === 'amber' ? '#b45309' : '#059669', material.tone === 'amber' ? '#fff7ed' : '#dcfce7', 64)
      drawTablePill(ctx, item.status || '-', col.status, rowY + 15, statusTone[0], statusTone[1], 70)
      drawCanvasText(ctx, relativeTime(item.status_updated_at), col.updated, rowY + 20, { size: 10, color: '#94a3b8' })
    })
    return height
  }

  function drawRoadmapExport(ctx, x, y, width, height) {
    drawExportPanel(ctx, x, y, width, height, 8)
    drawCanvasText(ctx, '接入流程路线图', x + 16, y + 15, { size: 16, weight: 800, color: '#0f172a' })
    const currentStepId = getCurrentStep(allSteps, stepRecords, features)?.id || null
    let cursor = y + 50
    allSteps.forEach((step, idx) => {
      const state = getStepProgressState(step, stepRecords, features)
      const done = state === 'done'
      const isQuestionnaire = step.sort_order === 8
      const isCurrent = !isQuestionnaire && step.id === currentStepId && !done
      const featCount = getStepFeatureCount(step, features)
      if (isCurrent) {
        fillRoundRect(ctx, x + 12, cursor - 3, width - 24, 47, 7, '#eff6ff')
        strokeRoundRect(ctx, x + 12, cursor - 3, width - 24, 47, 7, '#bfdbfe')
      }
      fillRoundRect(ctx, x + 22, cursor + 5, 24, 24, 12, isQuestionnaire ? '#fdf2f8' : done ? '#059669' : isCurrent ? '#2563eb' : '#eef2f7')
      drawCanvasText(ctx, isQuestionnaire ? '问' : done ? '✓' : String(idx + 1), x + 30, cursor + 9, { size: 11, weight: 800, color: done || isCurrent ? '#ffffff' : isQuestionnaire ? '#db2777' : '#94a3b8' })
      drawCanvasText(ctx, truncateCanvasText(ctx, `${isQuestionnaire ? '' : getStepNumber(step.sort_order) + ' '}${step.step_name}`, width - 96), x + 56, cursor + 2, { size: 12, weight: 800, color: done ? '#047857' : isCurrent ? '#1d4ed8' : '#0f172a' })
      const meta = `${step.responsible_role || '-'}${featCount > 0 ? ` · ${featCount} 个功能` : ''}`
      drawCanvasText(ctx, meta, x + 56, cursor + 22, { size: 10, color: '#64748b' })
      drawCanvasText(ctx, isQuestionnaire ? '待补' : done ? '已完成' : isCurrent ? '进行中' : '未开始', x + width - 54, cursor + 14, { size: 10, weight: 700, color: done ? '#059669' : isCurrent ? '#2563eb' : isQuestionnaire ? '#f97316' : '#cbd5e1' })
      cursor += 48
    })
  }

  function downloadSyncProgressImage() {
    const devGroups = getProgressExportGroups(DEV_STATUSES)
    const testGroups = getProgressExportGroups(TEST_STATUSES)
    const width = 1200
    const pagePad = 32
    const overviewHeight = 344
    const devListHeight = getListSectionHeight(devGroups)
    const roadmapHeight = 56 + allSteps.length * 48
    const middleHeight = Math.max(devListHeight, roadmapHeight)
    const testHeight = getListSectionHeight(testGroups)
    const height = pagePad + overviewHeight + 20 + middleHeight + 20 + testHeight + pagePad
    const dpr = Math.max(1, window.devicePixelRatio || 1)
    const canvas = document.createElement('canvas')
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    ctx.fillStyle = '#f5f7fb'
    ctx.fillRect(0, 0, width, height)

    drawCanvasText(ctx, project.game_name || '-', 32, 20, { size: 28, weight: 800, color: '#0f172a' })
    let badgeX = 170
    badgeX += drawExportPill(ctx, `阶段${stageNum} · 基础接入包`, badgeX, 22, '#2563eb', '#e8f0ff') + 8
    badgeX += drawExportPill(ctx, project.status || '-', badgeX, 22, '#ea580c', '#fff7ed') + 8
    drawExportPill(ctx, overdueInfo.text || '-', badgeX, 22, overdueInfo.type === 'overdue' ? '#ef4444' : '#64748b', overdueInfo.type === 'overdue' ? '#fff1f2' : '#f1f5f9')
    const exportEnvironmentText = Array.isArray(project.environments) && project.environments.length > 0 ? project.environments.join('、') : '-'
    drawCanvasText(ctx, `${project.game_id || '-'} · ${project.business_type || '-'} · ${project.region || '-'} · 负责人：${project.leader_name || '-'}`, 32, 60, { size: 13, color: '#475569' })
    drawCanvasText(ctx, `${exportEnvironmentText} · ${project.db_type || '-'}`, 32, 82, { size: 12, color: '#475569' })
    drawCanvasText(ctx, `同步时间：${new Date().toLocaleString('zh-CN', { hour12: false })}`, 32, 104, { size: 11, color: '#94a3b8' })

    drawExportPanel(ctx, 32, 116, 548, 124, 8)
    drawCanvasText(ctx, '流程节点进度', 48, 132, { size: 16, weight: 800, color: '#0f172a' })
    drawExportPill(ctx, `当前节点：${currentStep?.step_name || '-'}`, 404, 128, '#2563eb', '#e8f0ff')
    drawCanvasText(ctx, '节点完成', 48, 174, { size: 12, weight: 800, color: '#334155' })
    drawCanvasText(ctx, `${flowStepDone}/${flowStepTotal}`, 528, 174, { size: 12, weight: 800, color: '#0f172a' })
    drawProgressBar(ctx, 48, 198, 508, flowStepPct, '#2563eb')
    drawCanvasText(ctx, '用于表达项目接入流程推进到哪一步，不和功能任务数量混算。', 48, 218, { size: 11, color: '#64748b' })

    drawExportPanel(ctx, 620, 116, 548, 124, 8)
    drawCanvasText(ctx, '功能任务进度', 636, 132, { size: 16, weight: 800, color: '#0f172a' })
    drawExportPill(ctx, `${passedFeatures}/${totalFeatures} 已通过`, 1054, 128, '#0f766e', '#e7f7f5')
    drawCanvasText(ctx, '功能完成', 636, 174, { size: 12, weight: 800, color: '#334155' })
    drawCanvasText(ctx, `${featurePct}%`, 1118, 174, { size: 12, weight: 800, color: '#0f172a' })
    drawProgressBar(ctx, 636, 198, 508, featurePct, '#0f766e')
    ALL_STATUSES.forEach((status, idx) => {
      const statW = 82
      const sx = 636 + idx * 84
      drawExportPanel(ctx, sx, 216, statW, 46, 5)
      drawCanvasText(ctx, String(statusCounts[status] || 0), sx + 10, 224, { size: 13, weight: 800, color: '#0f172a' })
      drawCanvasText(ctx, status, sx + 10, 242, { size: 9, color: '#64748b' })
    })

    const cardY = 278
    const riskCards = [
      { title: launchRiskBadge.label, value: launchRiskBadge.count, color: launchRiskBadge.color === 'red' ? '#ef4444' : '#2563eb' },
      { title: '缺物料', value: `${missingMaterialCount} 个功能`, color: '#f59e0b' },
      { title: '项目组处理', value: `${pendingGroupCount} 个任务`, color: '#0f766e' },
      { title: '3天未更新', value: `${staleCount} 个功能`, color: '#2563eb' },
    ]
    riskCards.forEach((card, idx) => {
      const x = 32 + idx * 292
      drawExportPanel(ctx, x, cardY, 268, 54, 7)
      drawCanvasText(ctx, card.title, x + 16, cardY + 12, { size: 12, color: '#64748b' })
      drawCanvasText(ctx, String(card.value), x + 16, cardY + 30, { size: 15, weight: 800, color: card.color })
    })

    const middleTop = pagePad + overviewHeight + 20
    drawRoadmapExport(ctx, 32, middleTop, 200, roadmapHeight)
    drawFeatureListSection(ctx, '接入步骤', '功能开发', devGroups, 248, middleTop, 920, '#2563eb', '#e8f0ff')
    drawFeatureListSection(ctx, '接入步骤', '测试验收', testGroups, 32, middleTop + middleHeight + 20, width - 64, '#d97706', '#fff7ed')

    canvas.toBlob(blob => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)
      link.href = url
      link.download = `${project.game_name || '项目'}-接入进度-${date}.png`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  // ============================================
  // 加载/空状态
  // ============================================

  if (loading) return <div className="p-7 text-slate-400">加载中…</div>
  if (!project) return <div className="p-7 text-slate-400">项目不存在</div>

  const stageNum = project.stage_id ? project.stage_id - 1 : 0
  const environmentText = Array.isArray(project.environments) && project.environments.length > 0 ? project.environments.join('、') : '-'
  const databaseTypeText = project.db_type || '-'

  return (
    <>
      <div className="page-shell text-slate-900">

        {/* ============================================ */}
        {/* �?项目头部 �?紧凑一行式                           */}
        {/* ============================================ */}

        <div className="mb-5">
          {/* 面包�?*/}
          <div className="text-[12px] text-slate-500 mb-3 flex items-center gap-1.5">
            <span onClick={() => navigate('/')} className="text-primary-500 cursor-pointer hover:underline">项目管理</span>
            <span>›</span>
            <span className="truncate max-w-[140px]">{project.game_name}</span>
            <span>›</span>
            <span className="text-slate-600">接入进度</span>
          </div>

          {/* 第一行：标题 + 状�?+ 操作按钮 + 逾期 */}
          <div className="flex items-start md:items-end justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="w-full text-[28px] leading-8 font-bold text-slate-950 tracking-normal md:w-auto">{project.game_name}</h1>
                <span className={`px-2.5 py-1 rounded-md text-[12px] font-semibold ${STAGE_COLORS[stageNum]}`}>阶段{stageNum} · 基础接入包</span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-50 text-orange-700 text-[12px] font-semibold">
                <span className={`w-[6px] h-[6px] rounded-full ${project.status === '接入中' ? 'bg-blue-500' : project.status === '已完成' ? 'bg-green-500' : 'bg-gray-300'}`} />
                {project.status}
                </span>
                <span className={`px-2.5 py-1 rounded-md bg-red-50 text-[12px] font-semibold ${overdueInfo.type === 'overdue' ? 'text-red-600' : overdueInfo.color}`}>
                  {overdueInfo.type === 'overdue' && `已逾期 ${overdueInfo.days} 天`}
                  {overdueInfo.type === 'near' && `距离对外 ${overdueInfo.days} 天`}
                  {overdueInfo.type === 'ok' && overdueInfo.text}
                  {overdueInfo.type === 'none' && <span className="text-slate-400">未填写计划对外日期</span>}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[13px] text-slate-500">
                <span>{project.game_id}</span>
                <span>·</span>
                <span>{project.business_type || '-'}</span>
                <span>·</span>
                <span>{project.region || '-'}</span>
                <span>·</span>
                <span>负责人：{project.leader_name || '-'}</span>
                <span>·</span>
                <span>{environmentText}</span>
                <span>·</span>
                <span>{databaseTypeText}</span>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button type="button" onClick={downloadSyncProgressImage} className="px-4 py-2 bg-primary-500 rounded-md text-[13px] font-medium text-white shadow-sm hover:bg-primary-600">同步进度</button>
              <Link to={`/project/${id}/edit`} className="px-4 py-2 border border-slate-200 bg-white rounded-md text-[13px] font-medium text-slate-700 shadow-sm hover:bg-slate-50">编辑项目</Link>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* �?双进度总览 �?单行紧凑�?                       */}
        {/* ============================================ */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* 流程节点进度 */}
          <div className="bg-white rounded-lg border border-slate-200 px-5 py-5 shadow-sm min-h-[170px]">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[16px] font-bold text-slate-950">流程节点进度</span>
              {currentStep && <span className="px-2 py-1 rounded-md text-[12px] font-semibold bg-blue-50 text-blue-600">当前节点：{currentStep.step_name}</span>}
            </div>
            <div className="flex items-center justify-between text-[13px] font-semibold text-slate-800 mb-3">
              <span>节点完成</span>
              <span>{flowStepDone}/{flowStepTotal}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary-600 rounded-full transition-all" style={{ width: `${flowStepPct}%` }} />
              </div>
            </div>
            <p className="mt-4 text-[12px] text-slate-500">用于表达项目接入流程推进到哪一步，不和功能任务数量混算。</p>
          </div>

          {/* 功能任务进度 */}
          <div className="bg-white rounded-lg border border-slate-200 px-5 py-5 shadow-sm min-h-[170px]">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[16px] font-bold text-slate-950">功能任务进度</span>
              <span className="px-2 py-1 rounded-md text-[12px] font-semibold bg-teal-50 text-teal-700">{passedFeatures}/{totalFeatures} 已通过</span>
            </div>
            <div className="flex items-center justify-between text-[13px] font-semibold text-slate-800 mb-3">
              <span>功能完成</span>
              <span>{featurePct}%</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-600 rounded-full transition-all" style={{ width: `${featurePct}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4">
              {ALL_STATUSES.map(s => (
                <div key={s} className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
                  <div className="text-[15px] font-bold text-slate-950">{statusCounts[s] || 0}</div>
                  <div className="mt-0.5 text-[11px] text-slate-600">{s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* �?风险提醒 �?横向紧凑标签                       */}
        {/* ============================================ */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <RiskBadge label={launchRiskBadge.label} count={launchRiskBadge.count} description={launchRiskBadge.description} color={launchRiskBadge.color} active={riskFilter === 'overdue'} onClick={() => setRiskFilter(riskFilter === 'overdue' ? null : 'overdue')} />
          <RiskBadge label="个功能缺物料" count={missingMaterialCount} description="点击筛选需项目提供内容" color="amber" active={riskFilter === 'materials'} onClick={() => setRiskFilter(riskFilter === 'materials' ? null : 'materials')} />
          <RiskBadge label="个任务待项目组处理" count={pendingGroupCount} description="集中在功能开发与联调" color="teal" active={riskFilter === 'owner'} onClick={() => setRiskFilter(riskFilter === 'owner' ? null : 'owner')} />
          <RiskBadge label="个功能 3 天未更新" count={staleCount} description="建议 PM 跟进状态" color="blue" active={riskFilter === 'stale'} onClick={() => setRiskFilter(riskFilter === 'stale' ? null : 'stale')} />
        </div>

        {/* ============================================ */}
        {/* �?左右分栏：路线图（左�? 功能任务（右�?          */}
        {/* ============================================ */}

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 mb-6">
          {/* 左侧：路线图导航 */}
          <div className="lg:order-1 order-2">
            <RoadmapNav
              steps={allSteps}
              stepRecords={stepRecords}
              features={features}
              selectedStepId={activeStepId}
              onStepClick={(stepId) => { setSelectedStepId(stepId); setStatusFilter('all') }}
            />
          </div>

          {/* 右侧：功能任�?/ 步骤勾�?区域 */}
          <div className="lg:order-2 order-1 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            {/* 标题�?*/}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-2">
                <div>
                  <h2 className="text-[16px] font-bold text-slate-950">接入步骤</h2>
                </div>
                {activeStepId && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-blue-50 text-blue-600 border border-blue-200">
                    {selectedStepName}
                    <button type="button" onClick={() => setSelectedStepId(currentStep?.id || activeStepId)} className="text-blue-400 hover:text-blue-600 text-[10px]">✕</button>
                  </span>
                )}
                {riskFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-amber-50 text-amber-700 border border-amber-200">
                    风险筛选 <button type="button" onClick={() => setRiskFilter(null)} className="text-amber-500 hover:text-amber-700 text-[10px]">✕</button>
                  </span>
                )}
                {!isCheckboxStep && (
                  <span className="text-[11px] text-slate-400">{filteredFeatures.length}/{totalFeatures}</span>
                )}
              </div>
              {!isCheckboxStep && (
                <div className="flex gap-2">
                  <button onClick={() => setKanbanView(false)} className={`px-3.5 py-2 text-[13px] rounded-md transition-colors ${!kanbanView ? 'bg-slate-900 text-white shadow-sm font-medium' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>列表</button>
                  <button onClick={() => setKanbanView(true)} className={`px-3.5 py-2 text-[13px] rounded-md transition-colors ${kanbanView ? 'bg-slate-900 text-white shadow-sm font-medium' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>看板</button>
                </div>
              )}
            </div>

            {/* 内容区：checkbox 步骤 �?勾选列表；其他 �?功能任务列表/看板 */}
            {isCheckboxStep ? (
              /* ===== Checkbox 步骤勾选视�?===== */
              <div className="p-4">
              <StepChecklist
                steps={allSteps}
                stepRecords={stepRecords}
                selectedStepId={activeStepId}
                onToggleStep={(stepId, currentStatus) => toggleGlobalStep(stepId, currentStatus)}
              />
              </div>
            ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              {kanbanView ? (
                /* ===== 看板视图 —�?根据选中节点只显示对应阶�?===== */
                <div className="space-y-4">
                  {/* 仅选中 �?或未选中具体节点时，显示功能开发看�?*/}
                  {selectedStep?.sort_order === 6 && (
                    <div className="bg-white overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-gradient-to-r from-blue-50 to-white">
                        <span className="text-[13px] font-bold text-blue-600">⑥ 功能开发</span>
                        <span className="text-[10px] text-slate-400">{filteredFeatures.filter(f => DEV_STATUSES.includes(f.status)).length} 个功能</span>
                      </div>
                      <div className="p-4 grid grid-cols-1 xl:grid-cols-3 gap-3">
                        {DEV_STATUSES.map(status => (
                          <KanbanColumn
                            key={status}
                            droppableId={`dev-${status}`}
                            status={status}
                            items={devKanbanData[status]}
                            onConfigFieldClick={openPlayerInfoConfig}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 仅选中 �?或未选中具体节点时，显示测试验收看板 */}
                  {selectedStep?.sort_order === 7 && (
                    <div className="bg-white overflow-hidden border-t border-slate-100">
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-gradient-to-r from-amber-50 to-white">
                        <span className="text-[13px] font-bold text-amber-600">⑦ 测试验收</span>
                        <span className="text-[10px] text-slate-400">{filteredFeatures.filter(f => TEST_STATUSES.includes(f.status)).length} 个功能</span>
                      </div>
                      <div className="p-4 grid grid-cols-1 xl:grid-cols-3 gap-3">
                        {TEST_STATUSES.map(status => (
                          <KanbanColumn
                            key={status}
                            droppableId={`test-${status}`}
                            status={status}
                            items={testKanbanData[status]}
                            onConfigFieldClick={openPlayerInfoConfig}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ===== 列表视图（紧凑版�?===== */
                <FeatureListCompact
                  features={filteredFeatures}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  onStatusChange={handleStatusChangeRequest}
                  onConfigFieldClick={openPlayerInfoConfig}
                  emptyText={activeStepId ? '该节点暂无关联功能' : '暂无功能'}
                  visibleStatuses={
                    selectedStep?.sort_order === 6 ? DEV_STATUSES
                      : selectedStep?.sort_order === 7 ? TEST_STATUSES
                      : ALL_STATUSES
                  }
                />
              )}
            </DragDropContext>
            )}
          </div>
        </div>

        {/* ============================================ */}
        {/* �?操作日志                                         */}
        {/* ============================================ */}

        <div className="surface-card p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">操作日志</span>
            {timeline.length > 10 && (
              <button type="button" onClick={() => setTimelineExpanded(!timelineExpanded)} className="text-[11px] text-primary-500 hover:underline">
                {timelineExpanded ? '收起' : `展开全部（${timeline.length}条）`}
              </button>
            )}
          </div>
          {displayedTimeline.length === 0 ? (
            <div className="text-[12px] text-gray-300 text-center py-3">暂无操作记录</div>
          ) : (
            <div>
              {displayedTimeline.map((t, i) => {
                if (t.old_status && t.new_status) {
                  return (
                    <div key={t.id || i} className="flex gap-2.5 pb-2 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div className={`w-[8px] h-[8px] rounded-full flex-shrink-0 mt-1 ${i === 0 ? 'bg-primary-500' : 'bg-gray-300'}`} />
                        {i < displayedTimeline.length - 1 && <div className="w-[1.5px] flex-1 bg-gray-200 mt-1" />}
                      </div>
                      <div className="flex-1 pb-1">
                        <div className={`text-[10px] mb-0 ${i === 0 ? 'text-slate-500' : 'text-slate-400'}`}>
                          {t.operator_name || '系统'} · {t.created_at?.slice(0, 16).replace('T', ' ')}
                        </div>
                        <div className="text-[12px]">
                          将「<span className="font-medium">{t.target_name}</span>」从 <span className="text-slate-400">{t.old_status}</span> 改为 <span className="text-primary-600 font-medium">{t.new_status}</span>
                          {t.remark && <span className="text-slate-400 ml-1">（{t.remark}）</span>}
                        </div>
                      </div>
                    </div>
                  )
                }
                return (
                  <div key={t.id || i} className="flex gap-2.5 pb-2 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={`w-[8px] h-[8px] rounded-full flex-shrink-0 mt-1 ${i === 0 ? 'bg-primary-500' : 'bg-gray-300'}`} />
                      {i < displayedTimeline.length - 1 && <div className="w-[1.5px] flex-1 bg-gray-200 mt-1" />}
                    </div>
                    <div className="flex-1 pb-1">
                      <div className={`text-[10px] mb-0 ${i === 0 ? 'text-slate-500' : 'text-slate-400'}`}>{t.event_date || t.created_at?.slice(0, 10)}</div>
                      <div className="text-[12px]">{t.event}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* 状态变更确认弹窗*/}
      {confirmDialog && (
        <StatusConfirmDialog
          open={!!confirmDialog}
          featureName={confirmDialog.featureName}
          oldStatus={confirmDialog.oldStatus}
          newStatus={confirmDialog.newStatus}
          reason={confirmReason}
          onReasonChange={setConfirmReason}
          onConfirm={() => executeStatusChange(confirmDialog.pfId, confirmDialog.oldStatus, confirmDialog.newStatus, confirmReason)}
          onCancel={() => { setConfirmDialog(null); setConfirmReason('') }}
        />
      )}

      {/* 角色查询字段配置完整弹窗 */}
      <PlayerFieldConfigModal
        open={!!editingPlayerInfo}
        onClose={() => setEditingPlayerInfo(null)}
        config={editingPlayerInfo?.config || null}
        onSave={cfg => editingPlayerInfo && savePlayerInfoConfig(editingPlayerInfo.pfId, cfg)}
      />
    </>
  )
}






