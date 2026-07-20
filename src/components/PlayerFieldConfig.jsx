/**
 * PlayerFieldConfig v9 - UI文案+默认值+布局调整
 *
 * 变更：
 *   - [Change 1] 弹窗标题/说明：玩家信息 → 角色查询
 *   - [Change 2] 查询条件默认全选（6个默认字段初始即勾选）
 *   - [Change 3] 角色详情-总览/背包字段默认全勾选
 *   - [Change 4] 【添加维度】按钮从底部移至 Tab 栏右侧
 */

import { useState, useEffect } from 'react'

// ============ 查询条件默认字段 ============
const QUERY_FIELDS = [
  { key: 'server_id', label: '区服选择' },
  { key: 'role_id', label: '角色ID' },
  { key: 'role_name', label: '角色名称' },
  { key: 'passport_id', label: '冰川通行证ID' },
  { key: 'game_account_id', label: '游戏账号ID' },
  { key: 'create_time_range', label: '创建时间范围' },
]

// ============ 列表字段（固定排序）============
const LIST_FIELDS = [
  { key: 'list_server_id', label: '区服ID' },
  { key: 'list_server_name', label: '区服名称' },
  { key: 'list_role_id', label: '角色ID' },
  { key: 'list_role_name', label: '角色名称' },
  { key: 'list_game_account_id', label: '游戏账号ID' },
  { key: 'list_passport_id', label: '冰川通行证ID' },
  { key: 'list_channel_id', label: '渠道ID' },
  { key: '__custom_slot__', label: '', isSlot: true },
  { key: 'list_role_level', label: '角色等级' },
  { key: 'list_role_create_time', label: '角色创建时间' },
  { key: 'list_online_status', label: '在线状态' },
  { key: 'list_total_recharge', label: '累计充值金额' },
  { key: 'list_actual_recharge', label: '实际充值金额' },
  { key: 'list_last_login_time', label: '最后登录时间' },
  { key: 'list_last_offline_time', label: '最后离线时间' },
  { key: '__action__', label: '操作', isFixed: true, isAction: true },
]

// ============ 示例数据（用于列表预览）============
const SAMPLE_DATA = [
  {
    list_server_id: '10086521', list_server_name: '', list_role_id: '10086521',
    list_role_name: '旅行者', list_game_account_id: 'GA20240501',
    list_passport_id: '', list_channel_id: '官方', list_role_level: 'Lv68',
    list_role_create_time: '', list_online_status: '在线',
    list_total_recharge: '¥12,680', list_actual_recharge: '',
    list_last_login_time: '2026-06-13\n10:25', list_last_offline_time: '',
  },
  {
    list_server_id: '10086521', list_server_name: '', list_role_id: '10086521',
    list_role_name: '旅行者', list_game_account_id: 'GA20240501',
    list_passport_id: '', list_channel_id: '官方', list_role_level: 'Lv68',
    list_role_create_time: '', list_online_status: '在线',
    list_total_recharge: '¥12,680', list_actual_recharge: '',
    list_last_login_time: '2026-06-13\n10:25', list_last_offline_time: '',
  },
  {
    list_server_id: '10086521', list_server_name: '', list_role_id: '10086521',
    list_role_name: '旅行者', list_game_account_id: 'GA20240501',
    list_passport_id: '', list_channel_id: '官方', list_role_level: 'Lv68',
    list_role_create_time: '', list_online_status: '在线',
    list_total_recharge: '¥12,680', list_actual_recharge: '',
    list_last_login_time: '2026-06-13\n10:25', list_last_offline_time: '',
  },
]

// ============ 详情页默认Tab模板 ============
const DETAIL_TAB_PRESETS = {
  overview: {
    label: '总览',
    fields: [
      { key: 'list_server_id', label: '区服ID' },
      { key: 'list_server_name', label: '区服名称' },
      { key: 'list_role_id', label: '角色ID' },
      { key: 'list_role_name', label: '角色名称' },
      { key: 'list_game_account_id', label: '游戏账号ID' },
      { key: 'list_passport_id', label: '冰川通行证ID' },
      { key: 'list_channel_id', label: '渠道ID' },
      { key: '__custom_slot__', label: '', isSlot: true },
      { key: 'list_role_level', label: '角色等级' },
      { key: 'list_role_create_time', label: '角色创建时间' },
      { key: 'list_online_status', label: '在线状态' },
      { key: 'list_total_recharge', label: '累计充值金额' },
      { key: 'list_actual_recharge', label: '实际充值金额' },
      { key: 'list_last_login_time', label: '最后登录时间' },
      { key: 'list_last_offline_time', label: '最后离线时间' },
    ],
  },
  backpack: {
    label: '物品/背包',
    fields: [
      { key: 'item_icon', label: '物品图标' },
      { key: 'item_id', label: '物品ID' },
      { key: 'item_name', label: '物品名称' },
      { key: 'item_count', label: '物品数量' },
    ],
  },
}

const MAX_CUSTOM_TABS = 10

// ============ 工具函数 ============

export function getPlayerInfoConfig(extraConfig) {
  if (!extraConfig?.player_info) return null
  return extraConfig.player_info
}

export function getPlayerInfoSummary(extraConfig) {
  const cfg = getPlayerInfoConfig(extraConfig)
  if (!cfg) return null
  const parts = []
  const qCount = (cfg.query || []).length + (cfg.custom_query || []).length
  const lCount = (cfg.list || []).length + (cfg.custom_list || []).length
  const detailTabs = cfg.detail_tabs || []
  if (cfg.detail_enabled !== false && detailTabs.length > 0) {
    const tabNames = detailTabs.map(t => {
      const fieldCount = (t.fields || []).length + (t.custom_fields || []).length
      const tabLabel = t.preset ? DETAIL_TAB_PRESETS[t.tab_key]?.label : t.tab_name
      return `${tabLabel}${fieldCount > 0 ? `(${fieldCount}字段)` : ''}`
    })
    parts.push(`详情${tabNames.length}维度`)
  }
  if (qCount > 0) parts.push(`查询${qCount}字段`)
  if (lCount > 0) parts.push(`列表${lCount}字段`)
  return parts.length > 0 ? parts.join(' / ') : null
}

export function buildDefaultConfig(existing) {
  // Change 2: 查询条件默认全选
  const base = {
    query: QUERY_FIELDS.map(f => f.key),
    list: [],
    detail_tabs: [],
    detail_enabled: false,
    custom_query: [],
    custom_list: [],
  }
  if (!existing) return base
  if (existing.detail && !existing.detail_tabs) {
    const tabs = []
    const oldDetailMap = { detail_overview: 'overview', detail_backpack: 'backpack' }
    for (const key of existing.detail) {
      const tabKey = oldDetailMap[key]
      if (tabKey) {
        const tpl = DETAIL_TAB_PRESETS[tabKey]
        // Change 3: 兼容旧数据迁移时也默认全勾选字段
        tabs.push({ tab_key: tabKey, tab_name: tpl.label, preset: 'fixed', fields: tpl.fields.filter(f => !f.isSlot).map(f => f.key), custom_fields: [] })
      }
    }
    if (existing.custom_detail?.length > 0) {
      for (const item of existing.custom_detail) {
        tabs.push({ tab_key: item.key || item.label, tab_name: item.label, preset: 'custom', fields: [], custom_fields: [] })
      }
    }
    return { ...base, ...existing, detail_tabs: tabs, detail: undefined, custom_detail: undefined }
  }
  // Change 2: 兼容旧数据 — 如果 query 为空数组，视为需要默认全选（首次打开旧项目）
  const queryExisting = existing.query
  const finalQuery = (Array.isArray(queryExisting) && queryExisting.length > 0)
    ? queryExisting
    : QUERY_FIELDS.map(f => f.key)

  // 兼容旧数据：没有 detail_enabled 字段时，如果有 detail_tabs 则默认开启
  const detailEnabled = existing.detail_enabled !== undefined ? existing.detail_enabled : ((existing.detail_tabs || []).length > 0)
  // Change 3: 兼容旧数据 — 如果已有 detail_tabs 但 fields 为空，补上默认字段
  let detailTabs = existing.detail_tabs || []
  if (detailTabs.length > 0) {
    detailTabs = detailTabs.map(t => {
      if (t.preset === 'fixed' && (!t.fields || t.fields.length === 0)) {
        const tpl = DETAIL_TAB_PRESETS[t.tab_key]
        if (tpl) {
          return { ...t, fields: tpl.fields.filter(f => !f.isSlot).map(f => f.key) }
        }
      }
      return t
    })
  }

  return { ...base, ...existing, query: finalQuery, detail_tabs: detailTabs, detail_enabled: detailEnabled }
}

/** 获取所有可见的列表列定义（含默认+自定义） */
function getVisibleListColumns(config) {
  const selected = config.list || []
  const customList = config.custom_list || []
  const columns = []

  for (const f of LIST_FIELDS) {
    if (f.isFixed) {
      columns.push({ ...f })
      continue
    }
    if (f.isSlot) {
      for (const cf of customList) {
        columns.push({ key: `custom_list_${cf.label}`, label: cf.label, isCustom: true })
      }
      continue
    }
    columns.push({ ...f, visible: true }) // 默认全部显示
  }
  return columns
}

/** 获取所有可见的查询项（含默认+自定义） */
function getVisibleQueryItems(config) {
  const selected = config.query || []
  const customQuery = config.custom_query || []
  const items = []

  for (const f of QUERY_FIELDS) {
    items.push({ ...f, active: selected.includes(f.key) || true })
  }
  for (const cq of customQuery) {
    items.push({ key: `cq_${cq.label}`, label: cq.label, isCustom: true, active: true })
  }
  return items
}

// ============ 弹窗遮罩 ============
function ModalOverlay({ children, onClose }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh]">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl max-h-[84vh] flex flex-col rounded-xl shadow-2xl border border-gray-200 bg-white animate-in">
        {children}
      </div>
    </div>
  )
}

// ============ 入口按钮组件 ============

export function PlayerFieldConfigTrigger({ config, onClick }) {
  const summary = getPlayerInfoSummary(config ? { player_info: config } : null)
  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onClick?.() }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] text-primary-600 bg-primary-50 border border-primary-200 hover:bg-primary-100 transition-colors cursor-pointer"
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="14" height="10" rx="2" />
        <line x1="5" y1="6" x2="11" y2="6" />
        <line x1="5" y1="9" x2="9" y2="9" />
        <circle cx="3" cy="6" r="0.5" fill="currentColor" />
        <circle cx="3" cy="9" r="0.5" fill="currentColor" />
      </svg>
      字段配置
      {summary && <span className="text-[11px] text-primary-400 font-normal">({summary})</span>}
    </button>
  )
}

// ============ 查询条件 Section ============

function QuerySection({ config, onToggle, onAddCustom, onRemoveCustom, listHandlers }) {
  const [showInput, setShowInput] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const selected = config.query || []
  const customFields = config.custom_query || []

  function handleAdd() {
    if (!inputVal.trim()) return
    onAddCustom({ label: inputVal.trim(), desc: '' })
    setInputVal('')
    setShowInput(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-[14px] font-semibold text-gray-800">查询条件</h3>
        <span className="text-[12px] text-gray-400">点击标签切换启用 / 关闭</span>
      </div>

      {/* 查询项标签行 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {QUERY_FIELDS.map(f => {
          const active = selected.includes(f.key)
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => onToggle(f.key)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[13px] transition-all cursor-pointer border ${
                active
                  ? 'bg-white text-gray-800 border-gray-300 shadow-sm font-medium'
                  : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {active && <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
              {f.label}
            </button>
          )
        })}
        {/* 自定义查询条件 */}
        {customFields.map((cf, idx) => (
          <span
            key={`cq_${idx}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium"
          >
            {cf.label}
            <span className="text-indigo-300 hover:text-red-500 cursor-pointer" onClick={() => onRemoveCustom(idx)}>✕</span>
          </span>
        ))}
        {showInput ? (
          <div className="inline-flex items-center gap-1.5">
            <input
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="条件名称"
              className="w-28 px-2.5 py-1.5 text-[13px] border border-gray-300 rounded-lg outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-100"
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowInput(false) }}
              autoFocus
            />
            <button onClick={handleAdd} className="px-3 py-1.5 text-[12px] bg-primary-500 text-white rounded-lg hover:bg-primary-600 cursor-pointer">添加</button>
            <button onClick={() => setShowInput(false)} className="px-2 py-1.5 text-[12px] text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer">取消</button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowInput(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[13px] text-primary-600 border border-dashed border-primary-300 hover:bg-primary-50 transition-colors cursor-pointer"
          >
            + 自定义查询条件
          </button>
        )}
      </div>

      {/* 列表预览区 */}
      <ListPreviewTable
        config={config}
        onToggleList={listHandlers?.onToggle}
        onAddCustomList={listHandlers?.onAddCustom}
        onRemoveCustomList={listHandlers?.onRemoveCustom}
      />
    </div>
  )
}

// ============ 列表预览表格（真实表格样式 + 横向滚动）============

function ListPreviewTable({ config, onToggleList, onAddCustomList, onRemoveCustomList }) {
  const [showInput, setShowInput] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const customFields = config.custom_list || []
  const columns = getVisibleListColumns(config)

  function handleAdd() {
    if (!inputVal.trim() || !onAddCustomList) return
    onAddCustomList({ label: inputVal.trim(), desc: '' })
    setInputVal('')
    setShowInput(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-[14px] font-semibold text-gray-800">列表字段预览</h3>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-gray-400">{columns.length} 列 · 左右滑动查看更多</span>
          {showInput ? (
            <div className="inline-flex items-center gap-1.5">
              <input
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder="输入列名"
                className="w-28 px-2.5 py-1 text-[12px] border border-gray-300 rounded-md outline-none focus:border-primary-500"
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowInput(false) }}
                autoFocus
              />
              <button onClick={handleAdd} className="px-2.5 py-1 text-[11px] bg-primary-500 text-white rounded cursor-pointer">确认</button>
              <button onClick={() => setShowInput(false)} className="px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100 rounded cursor-pointer">取消</button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowInput(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px] text-primary-600 border border-dashed border-primary-300 hover:bg-primary-50 transition-colors cursor-pointer"
            >
              + 点击添加更多列
            </button>
          )}
        </div>
      </div>

      {/* 真实表格预览 + 横向滚动 */}
      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-[13px]">
            <thead>
              <tr className="bg-gray-50/90">
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={!col.isFixed && !col.isCustom ? () => onToggleList?.(col.key) : undefined}
                    className={`px-4 py-3 text-left text-[12px] font-semibold whitespace-nowrap border-b border-r last:border-r-0 border-gray-200 ${
                      col.isFixed
                        ? 'text-gray-500 bg-gray-100/80'
                        : col.isCustom
                          ? 'text-indigo-600 bg-indigo-50/60'
                          : 'text-gray-600 cursor-pointer hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      {col.isCustom && (
                        <span className="text-[10px] px-1 py-px rounded bg-indigo-100 text-indigo-500 font-normal">自</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SAMPLE_DATA.map((row, rowIdx) => (
                <tr key={rowIdx} className={`${rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-primary-50/30 transition-colors`}>
                  {columns.map(col => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 whitespace-nowrap border-b border-r last:border-r-0 border-gray-100 ${
                        col.isFixed
                          ? 'text-gray-400'
                          : col.isCustom
                            ? 'text-indigo-600 font-medium'
                            : 'text-gray-700'
                      }`}
                    >
                      {col.isAction ? (
                        <span className="text-primary-500 text-[12px] cursor-pointer hover:text-primary-700">查看详情</span>
                      ) : col.isCustom ? (
                        <span className="text-gray-400 text-[11px]">—</span>
                      ) : (
                        row[col.key] || '—'
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ============ 详情页 Section ============

function DetailSection({ config, onToggleField, onAddCustomField, onRemoveCustomField, addTab, removeTab, renameTab, setDetailEnabled }) {
  // 默认关闭
  const [enabled, setEnabled] = useState(() => config.detail_enabled ?? false)
  const [activeTab, setActiveTab] = useState(() => {
    const tabs = config.detail_tabs || []
    return tabs.length > 0 ? tabs[0].tab_key : 'overview'
  })
  const [showTabInput, setShowTabInput] = useState(false)
  const [showFieldInput, setShowFieldInput] = useState({})
  const [fieldInputVal, setFieldInputVal] = useState({})

  // 同步外部 enabled 状态
  useEffect(() => {
    setEnabled(config.detail_enabled ?? false)
  }, [config.detail_enabled])

  function handleToggle(newEnabled) {
    setEnabled(newEnabled)
    setDetailEnabled(newEnabled)
    // 如果开启但还没有 tabs，初始化默认 tabs（Change 3: 字段默认全勾选）
    if (newEnabled && (!config.detail_tabs || config.detail_tabs.length === 0)) {
      addTab('__init_overview__')
      addTab('__init_backpack__')
    }
  }

  let tabs = config.detail_tabs || []

  // 如果开启了但没有这些 tab，显示内置的（Change 3: 字段默认全勾选）
  const displayTabs = enabled && tabs.length === 0
    ? [
        { tab_key: 'overview', tab_name: '总览维度', preset: 'fixed', fields: DETAIL_TAB_PRESETS.overview.fields.filter(f => !f.isSlot).map(f => f.key), custom_fields: [] },
        { tab_key: 'backpack', tab_name: '物品/背包维度', preset: 'fixed', fields: DETAIL_TAB_PRESETS.backpack.fields.map(f => f.key), custom_fields: [] },
      ]
    : tabs

  // Change 4: 计算自定义Tab数量，用于控制【添加维度】按钮显示
  const customTabCount = displayTabs.filter(t => t.preset === 'custom').length

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-[14px] font-semibold text-gray-800">角色详情页</h3>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-gray-400">{enabled ? '已开启' : '已关闭'}</span>
          <button
            type="button"
            onClick={() => handleToggle(!enabled)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
              enabled ? 'bg-primary-500' : 'bg-gray-300'
            }`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
              enabled ? 'translate-x-[18px]' : 'translate-x-[2px]'
            }`} />
          </button>
        </div>
      </div>

      {enabled && displayTabs.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Tab 导航 + Change 4: 【添加维度】按钮在右侧 */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-white overflow-x-auto">
            <div className="flex items-center overflow-x-auto flex-1">
              {displayTabs.map(tab => {
                const isActive = activeTab === tab.tab_key
                const isFixed = tab.preset === 'fixed'
                const preset = isFixed ? DETAIL_TAB_PRESETS[tab.tab_key] : null
                const fieldCount = (tab.fields || []).length + (tab.custom_fields || []).length
                return (
                  <button
                    key={tab.tab_key}
                    type="button"
                    onClick={() => setActiveTab(tab.tab_key)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-[13px] whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                      isActive
                        ? 'border-primary-500 text-primary-700 font-medium bg-primary-50/50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {preset ? preset.label : tab.tab_name || '未命名维度'}
                    {!isFixed && <span className="text-[10px] px-1 py-0.5 rounded bg-indigo-100 text-indigo-500">自定义</span>}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${fieldCount > 0 ? 'bg-primary-100 text-primary-500' : 'bg-gray-100 text-gray-400'}`}>
                      {fieldCount}
                    </span>
                    {!isFixed && tab.tab_key !== 'overview' && tab.tab_key !== 'backpack' && (
                      <span className="text-[11px] text-gray-300 hover:text-red-500 cursor-pointer ml-1" onClick={e => { e.stopPropagation(); removeTab(tab.tab_key) }}>✕</span>
                    )}
                  </button>
                )
              })}
            </div>
            {/* Change 4: 【添加维度】按钮移到 Tab 栏右侧 */}
            {customTabCount < MAX_CUSTOM_TABS && (
              <div className="flex-shrink-0 pr-2">
                {showTabInput ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      value={fieldInputVal['__new_tab__'] || ''}
                      onChange={e => setFieldInputVal(prev => ({ ...prev, __new_tab__: e.target.value }))}
                      placeholder="输入维度名称"
                      className="w-28 px-2.5 py-1 text-[12px] border border-gray-300 rounded-md outline-none focus:border-primary-500"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const val = fieldInputVal['__new_tab__'] || ''
                          if (val.trim()) { addTab(val.trim()); setFieldInputVal(prev => ({ ...prev, __new_tab__: '' })); setShowTabInput(false) }
                        }
                        if (e.key === 'Escape') setShowTabInput(false)
                      }}
                      autoFocus
                    />
                    <button onClick={() => {
                      const val = fieldInputVal['__new_tab__'] || ''
                      if (val.trim()) { addTab(val.trim()); setFieldInputVal(prev => ({ ...prev, __new_tab__: '' })); setShowTabInput(false) }
                    }} className="px-2 py-1 text-[11px] bg-primary-500 text-white rounded cursor-pointer">确认</button>
                    <button onClick={() => setShowTabInput(false)} className="px-1.5 py-1 text-[11px] text-gray-500 hover:bg-gray-100 rounded cursor-pointer">取消</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowTabInput(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[12px] text-primary-600 border border-dashed border-primary-300 hover:bg-primary-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    + 添加维度
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Tab 内容 */}
          {displayTabs.map(tab => {
            if (activeTab !== tab.tab_key) return null
            const isFixed = tab.preset === 'fixed'
            const preset = isFixed ? DETAIL_TAB_PRESETS[tab.tab_key] : null
            const presetFields = preset ? preset.fields : []
            const selectedKeys = tab.fields || []
            const customFields = tab.custom_fields || []
            const isShowFieldInput = showFieldInput[tab.tab_key] || false
            const tk = tab.tab_key

            // 判断是否有 slot 位置（用于放置自定义字段）
            const hasSlot = presetFields.some(f => f.isSlot)

            return (
              <div key={tab.tab_key} className="p-3">
                {/* 自定义Tab名称编辑 */}
                {!isFixed && (
                  <div className="mb-3">
                    <input
                      value={tab.tab_name || ''}
                      onChange={e => renameTab(tab.tab_key, e.target.value)}
                      placeholder="输入维度名称"
                      className="px-3 py-1.5 text-[13px] font-medium border border-gray-200 rounded-lg outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-100 w-48"
                    />
                  </div>
                )}

                {/* 字段网格 */}
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {/* === 固定Tab：渲染预设字段（含slot） === */}
                    {isFixed && presetFields.map(f => {
                      if (f.isSlot) {
                        // slot位置：渲染已添加的自定义字段 + 添加按钮
                        return (
                          <div key="__custom_slot__" className="contents">
                            {customFields.map((cf, idx) => (
                              <div key={`cf_${idx}`} className="flex items-center justify-between py-2 px-3 bg-indigo-50 rounded-lg border border-indigo-100">
                                <span className="text-[12px] font-medium text-indigo-700">{cf.label}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] px-1.5 py-px rounded bg-indigo-100 text-indigo-500">自定义</span>
                                  <span className="text-[11px] text-indigo-300 hover:text-red-500 cursor-pointer" onClick={() => onRemoveCustomField(tk, idx)}>移除</span>
                                </div>
                              </div>
                            ))}
                            {isShowFieldInput ? (
                              <div className="col-span-2 flex items-center gap-2 py-2 px-3 bg-white rounded-lg border border-gray-200 mt-1">
                                <input
                                  value={fieldInputVal[tk] || ''}
                                  onChange={e => setFieldInputVal(prev => ({ ...prev, [tk]: e.target.value }))}
                                  placeholder="字段名"
                                  className="flex-1 px-2 py-1.5 text-[12px] border border-gray-300 rounded-md outline-none focus:border-primary-500"
                                  onKeyDown={e => {
                                    const val = fieldInputVal[tk] || ''
                                    if (e.key === 'Enter' && val.trim()) {
                                      onAddCustomField(tk, { label: val.trim(), desc: '' })
                                      setFieldInputVal(prev => ({ ...prev, [tk]: '' }))
                                      setShowFieldInput(prev => ({ ...prev, [tk]: false }))
                                    }
                                    if (e.key === 'Escape') setShowFieldInput(prev => ({ ...prev, [tk]: false }))
                                  }}
                                  autoFocus
                                />
                                <button onClick={() => {
                                  const val = fieldInputVal[tk] || ''
                                  if (val.trim()) {
                                    onAddCustomField(tk, { label: val.trim(), desc: '' })
                                    setFieldInputVal(prev => ({ ...prev, [tk]: '' }))
                                    setShowFieldInput(prev => ({ ...prev, [tk]: false }))
                                  }
                                }} className="px-2.5 py-1 text-[11px] bg-primary-500 text-white rounded cursor-pointer">确认</button>
                                <button onClick={() => setShowFieldInput(prev => ({ ...prev, [tk]: false }))} className="px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100 rounded cursor-pointer">取消</button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setShowFieldInput(prev => ({ ...prev, [tk]: true }))}
                                className="col-span-2 py-2 text-[12px] text-primary-600 border border-dashed border-primary-200 rounded-lg hover:bg-primary-50 transition-colors cursor-pointer text-center mt-1"
                              >
                                + 添加自定义字段
                              </button>
                            )}
                          </div>
                        )
                      }
                      // 普通预设字段：checkbox 勾选
                      const active = selectedKeys.includes(f.key)
                      return (
                        <label
                          key={f.key}
                          className={`flex items-center justify-between py-2 px-3 rounded-lg border cursor-pointer transition-all ${
                            active ? 'bg-white border-gray-200 shadow-sm' : 'bg-transparent border-transparent hover:bg-gray-50'
                          }`}
                        >
                          <span className={`text-[12px] ${active ? 'font-medium text-gray-700' : 'text-gray-400'}`}>
                            {f.label}
                          </span>
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => onToggleField(tk, f.key)}
                            className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-400 cursor-pointer"
                          />
                        </label>
                      )
                    })}

                    {/* === 固定Tab无slot（如背包）：在预设字段后追加自定义字段区 === */}
                    {isFixed && !hasSlot && (
                      <>
                        {customFields.map((cf, idx) => (
                          <div key={`cf_noslot_${idx}`} className="flex items-center justify-between py-2 px-3 bg-indigo-50 rounded-lg border border-indigo-100">
                            <span className="text-[12px] font-medium text-indigo-700">{cf.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] px-1.5 py-px rounded bg-indigo-100 text-indigo-500">自定义</span>
                              <span className="text-[11px] text-indigo-300 hover:text-red-500 cursor-pointer" onClick={() => onRemoveCustomField(tk, idx)}>移除</span>
                            </div>
                          </div>
                        ))}
                        {isShowFieldInput ? (
                          <div className="col-span-2 flex items-center gap-2 py-2 px-3 bg-white rounded-lg border border-gray-200 mt-1">
                            <input
                              value={fieldInputVal[tk] || ''}
                              onChange={e => setFieldInputVal(prev => ({ ...prev, [tk]: e.target.value }))}
                              placeholder="字段名"
                              className="flex-1 px-2 py-1.5 text-[12px] border border-gray-300 rounded-md outline-none focus:border-primary-500"
                              onKeyDown={e => {
                                const val = fieldInputVal[tk] || ''
                                if (e.key === 'Enter' && val.trim()) {
                                  onAddCustomField(tk, { label: val.trim(), desc: '' })
                                  setFieldInputVal(prev => ({ ...prev, [tk]: '' }))
                                  setShowFieldInput(prev => ({ ...prev, [tk]: false }))
                                }
                                if (e.key === 'Escape') setShowFieldInput(prev => ({ ...prev, [tk]: false }))
                              }}
                              autoFocus
                            />
                            <button onClick={() => {
                              const val = fieldInputVal[tk] || ''
                              if (val.trim()) {
                                onAddCustomField(tk, { label: val.trim(), desc: '' })
                                setFieldInputVal(prev => ({ ...prev, [tk]: '' }))
                                setShowFieldInput(prev => ({ ...prev, [tk]: false }))
                              }
                            }} className="px-2.5 py-1 text-[11px] bg-primary-500 text-white rounded cursor-pointer">确认</button>
                            <button onClick={() => setShowFieldInput(prev => ({ ...prev, [tk]: false }))} className="px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100 rounded cursor-pointer">取消</button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowFieldInput(prev => ({ ...prev, [tk]: true }))}
                            className="col-span-2 py-2 text-[12px] text-primary-600 border border-dashed border-primary-200 rounded-lg hover:bg-primary-50 transition-colors cursor-pointer text-center mt-1"
                          >
                            + 添加自定义字段
                          </button>
                        )}
                      </>
                    )}

                    {/* === 自定义Tab：完全靠用户自己添加字段 === */}
                    {!isFixed && (
                      <>
                        {customFields.length === 0 && !isShowFieldInput && (
                          <div className="col-span-2 py-6 text-center text-[12px] text-gray-400">
                            暂无字段，点击下方按钮添加
                          </div>
                        )}
                        {customFields.map((cf, idx) => (
                          <div key={`cf_custom_${idx}`} className="flex items-center justify-between py-2 px-3 bg-indigo-50 rounded-lg border border-indigo-100">
                            <span className="text-[12px] font-medium text-indigo-700">{cf.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] px-1.5 py-px rounded bg-indigo-100 text-indigo-500">自定义</span>
                              <span className="text-[11px] text-indigo-300 hover:text-red-500 cursor-pointer" onClick={() => onRemoveCustomField(tk, idx)}>移除</span>
                            </div>
                          </div>
                        ))}
                        {isShowFieldInput ? (
                          <div className="col-span-2 flex items-center gap-2 py-2 px-3 bg-white rounded-lg border border-gray-200 mt-1">
                            <input
                              value={fieldInputVal[tk] || ''}
                              onChange={e => setFieldInputVal(prev => ({ ...prev, [tk]: e.target.value }))}
                              placeholder="字段名"
                              className="flex-1 px-2 py-1.5 text-[12px] border border-gray-300 rounded-md outline-none focus:border-primary-500"
                              onKeyDown={e => {
                                const val = fieldInputVal[tk] || ''
                                if (e.key === 'Enter' && val.trim()) {
                                  onAddCustomField(tk, { label: val.trim(), desc: '' })
                                  setFieldInputVal(prev => ({ ...prev, [tk]: '' }))
                                  setShowFieldInput(prev => ({ ...prev, [tk]: false }))
                                }
                                if (e.key === 'Escape') setShowFieldInput(prev => ({ ...prev, [tk]: false }))
                              }}
                              autoFocus
                            />
                            <button onClick={() => {
                              const val = fieldInputVal[tk] || ''
                              if (val.trim()) {
                                onAddCustomField(tk, { label: val.trim(), desc: '' })
                                setFieldInputVal(prev => ({ ...prev, [tk]: '' }))
                                setShowFieldInput(prev => ({ ...prev, [tk]: false }))
                              }
                            }} className="px-2.5 py-1 text-[11px] bg-primary-500 text-white rounded cursor-pointer">确认</button>
                            <button onClick={() => setShowFieldInput(prev => ({ ...prev, [tk]: false }))} className="px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100 rounded cursor-pointer">取消</button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowFieldInput(prev => ({ ...prev, [tk]: true }))}
                            className="col-span-2 py-2 text-[12px] text-primary-600 border border-dashed border-primary-200 rounded-lg hover:bg-primary-50 transition-colors cursor-pointer text-center mt-1"
                          >
                            + 添加自定义字段
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============ 弹窗主组件 ============

export function PlayerFieldConfigModal({ open, onClose, config, onChange, onSave }) {
  const [localConfig, setLocalConfig] = useState(() => buildDefaultConfig(config))

  // 同步外部config
  useEffect(() => {
    if (open) setLocalConfig(buildDefaultConfig(config))
  }, [open, config])

  // ---- 查询条件操作 ----
  function toggleQuery(key) {
    setLocalConfig(prev => {
      const next = prev.query.includes(key) ? prev.query.filter(k => k !== key) : [...prev.query, key]
      const c = { ...prev, query: next }
      return c
    })
  }
  function addQueryCustom(field) {
    setLocalConfig(prev => {
      const c = { ...prev, custom_query: [...(prev.custom_query || []), field] }
      return c
    })
  }
  function removeQueryCustom(idx) {
    setLocalConfig(prev => {
      const list = [...(prev.custom_query || [])]; list.splice(idx, 1)
      const c = { ...prev, custom_query: list }
      return c
    })
  }

  // ---- 列表字段操作 ----
  function toggleList(key) {
    setLocalConfig(prev => {
      const next = prev.list.includes(key) ? prev.list.filter(k => k !== key) : [...prev.list, key]
      const c = { ...prev, list: next }
      return c
    })
  }
  function addListCustom(field) {
    setLocalConfig(prev => {
      const c = { ...prev, custom_list: [...(prev.custom_list || []), field] }
      return c
    })
  }
  function removeListCustom(idx) {
    setLocalConfig(prev => {
      const list = [...(prev.custom_list || [])]; list.splice(idx, 1)
      const c = { ...prev, custom_list: list }
      return c
    })
  }

  // ---- 详情页操作 ----
  function toggleDetailField(tabKey, fieldKey) {
    setLocalConfig(prev => {
      const tabs = (prev.detail_tabs || []).map(t => {
        if (t.tab_key !== tabKey) return t
        const fields = t.fields.includes(fieldKey) ? t.fields.filter(k => k !== fieldKey) : [...t.fields, fieldKey]
        return { ...t, fields }
      })
      const c = { ...prev, detail_tabs: tabs }
      return c
    })
  }
  function addDetailCustomField(tabKey, field) {
    setLocalConfig(prev => {
      const tabs = (prev.detail_tabs || []).map(t => {
        if (t.tab_key !== tabKey) return t
        return { ...t, custom_fields: [...(t.custom_fields || []), field] }
      })
      const c = { ...prev, detail_tabs: tabs }
      return c
    })
  }
  function removeDetailCustomField(tabKey, idx) {
    setLocalConfig(prev => {
      const tabs = (prev.detail_tabs || []).map(t => {
        if (t.tab_key !== tabKey) return t
        const list = [...(t.custom_fields || [])]; list.splice(idx, 1)
        return { ...t, custom_fields: list }
      })
      const c = { ...prev, detail_tabs: tabs }
      return c
    })
  }
  function addDetailTab(nameOrKey) {
    setLocalConfig(prev => {
      let tabs = prev.detail_tabs || []
      if (nameOrKey === '__init_overview__' && !tabs.find(t => t.tab_key === 'overview')) {
        const tpl = DETAIL_TAB_PRESETS.overview
        // Change 3: 初始化时默认全勾选字段
        tabs = [...tabs, { tab_key: 'overview', tab_name: tpl.label, preset: 'fixed', fields: tpl.fields.filter(f => !f.isSlot).map(f => f.key), custom_fields: [] }]
      } else if (nameOrKey === '__init_backpack__' && !tabs.find(t => t.tab_key === 'backpack')) {
        const tpl = DETAIL_TAB_PRESETS.backpack
        // Change 3: 初始化时默认全勾选字段
        tabs = [...tabs, { tab_key: 'backpack', tab_name: tpl.label, preset: 'fixed', fields: tpl.fields.map(f => f.key), custom_fields: [] }]
      } else {
        if (tabs.filter(t => t.preset === 'custom').length >= MAX_CUSTOM_TABS) return prev
        const tabId = `custom_${Date.now()}`
        tabs = [...tabs, { tab_key: tabId, tab_name: nameOrKey || '', preset: 'custom', fields: [], custom_fields: [] }]
      }
      const c = { ...prev, detail_tabs: tabs, detail_enabled: true }
      return c
    })
  }
  function removeDetailTab(tabKey) {
    setLocalConfig(prev => {
      const tabs = (prev.detail_tabs || []).filter(t => t.tab_key !== tabKey)
      const c = { ...prev, detail_tabs: tabs }
      return c
    })
  }
  function renameDetailTab(tabKey, newName) {
    setLocalConfig(prev => {
      const tabs = (prev.detail_tabs || []).map(t => t.tab_key !== tabKey ? t : { ...t, tab_name: newName })
      const c = { ...prev, detail_tabs: tabs }
      return c
    })
  }
  function setDetailEnabled(enabled) {
    setLocalConfig(prev => {
      const c = { ...prev, detail_enabled: enabled }
      return c
    })
  }

  function handleSave() {
    if (onSave) onSave(localConfig)
    else onChange?.(localConfig)
    onClose?.()
  }

  // 列表操作 handlers 传递给 QuerySection -> ListPreviewTable
  const listHandlers = {
    onToggle: toggleList,
    onAddCustom: addListCustom,
    onRemoveCustom: removeListCustom,
  }

  if (!open) return null

  const qCount = (localConfig.query || []).length + (localConfig.custom_query || []).length
  const lCount = (localConfig.list || []).length + (localConfig.custom_list || []).length
  const tabCount = (localConfig.detail_tabs || []).length

  return (
    <ModalOverlay onClose={onClose}>
      {/* Header — Change 1: 文案替换 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white rounded-t-xl">
        <div>
          <h2 className="text-[16px] font-bold text-gray-900">角色查询字段配置</h2>
          <p className="text-[12px] text-gray-400 mt-0.5">配置角色查询的查询条件、列表展示字段和详情页维度</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[12px]">
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{qCount} 查询条件</span>
            <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-600">{lCount} 列表字段</span>
            {tabCount > 0 && <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">{tabCount} 详情维度</span>}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer transition-colors">✕</button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 bg-gray-50/50">
        <QuerySection
          config={localConfig}
          onToggle={toggleQuery}
          onAddCustom={addQueryCustom}
          onRemoveCustom={removeQueryCustom}
          listHandlers={listHandlers}
        />

        <DetailSection
          config={localConfig}
          onToggleField={toggleDetailField}
          onAddCustomField={addDetailCustomField}
          onRemoveCustomField={removeDetailCustomField}
          addTab={addDetailTab}
          removeTab={removeDetailTab}
          renameTab={renameDetailTab}
          setDetailEnabled={setDetailEnabled}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-gray-100 bg-white rounded-b-xl">
        <button onClick={onClose} className="px-5 py-2 text-[13px] text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          取消
        </button>
        <button onClick={handleSave} className="px-5 py-2 text-[13px] text-white bg-primary-500 rounded-lg hover:bg-primary-600 cursor-pointer transition-colors">
          保存
        </button>
      </div>
    </ModalOverlay>
  )
}

// ============ 兼容旧代码：default export ============
export default function PlayerFieldConfig(props) {
  if ('open' in props) {
    return <PlayerFieldConfigModal {...props} />
  }
  return (
    <PlayerFieldConfigTrigger
      config={props.config}
      onClick={() => {}}
    />
  )
}
