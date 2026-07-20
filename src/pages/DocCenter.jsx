import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const CATEGORY_COLORS = {
  '接入文档': { bg: 'bg-blue-50 text-blue-600', dot: 'bg-blue-500', tag: 'bg-blue-50 text-blue-600' },
  '使用手册': { bg: 'bg-green-50 text-green-600', dot: 'bg-green-500', tag: 'bg-green-50 text-green-600' },
  '测试用例': { bg: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500', tag: 'bg-amber-50 text-amber-600' },
  '其他': { bg: 'bg-slate-50 text-slate-600', dot: 'bg-gray-400', tag: 'bg-slate-50 text-slate-600' },
}

const MODULE_ICONS = ['📦', '📊', '👤', '💳', '🛡️', '🎮', '🔧', '📢']
const DOC_CATEGORIES = ['全部', '接入文档', '使用手册', '测试用例', '其他']

function normalizeUrl(url) {
  if (!url || url === '#') return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return 'https://' + url
}

export default function DocCenter() {
  const [documents, setDocuments] = useState([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('全部')
  const [viewMode, setViewMode] = useState('module') // 'type' | 'module'
  const [moduleFilter, setModuleFilter] = useState('all')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data } = await supabase.from('documents').select('*').order('sort_order')
    setDocuments(data || [])
  }

  // 搜索过滤
  const searched = documents.filter(doc => {
    if (search && !doc.title.includes(search) && !(doc.description || '').includes(search)) return false
    return true
  })

  // 聚合所有模块名
  const allModules = [...new Set(searched.map(d => d.module_name).filter(Boolean))].sort()

  // 按类型过滤（按类型查看模式）
  const typeFiltered = searched.filter(doc => {
    if (typeFilter !== '全部' && doc.category !== typeFilter) return false
    return true
  })

  // 按模块过滤（按模块查看模式）
  const moduleFiltered = searched.filter(doc => {
    if (moduleFilter !== 'all' && doc.module_name !== moduleFilter) return false
    return true
  })

  // 按阶段分组（按类型查看模式用）
  const stageGroups = {}
  typeFiltered.forEach(doc => {
    const key = doc.related_stage !== null && doc.related_stage !== undefined ? doc.related_stage : 'other'
    if (!stageGroups[key]) stageGroups[key] = []
    stageGroups[key].push(doc)
  })

  // 按模块分组（按模块查看模式用）
  const moduleGroups = {}
  moduleFiltered.forEach(doc => {
    const key = doc.module_name || '未分类'
    if (!moduleGroups[key]) moduleGroups[key] = []
    moduleGroups[key].push(doc)
  })

  // 在模块分组中，按功能名聚合文档（提取功能名 = 去掉模块前缀和分类后缀）
  function getFeatureName(doc) {
    let name = doc.title
    // 去掉 [模块名] 前缀
    const moduleMatch = name.match(/^\[[^\]]+\]\s*/)
    if (moduleMatch) name = name.slice(moduleMatch[0].length)
    // 去掉常见分类后缀
    const suffixes = [' - 技术接入文档', ' - 使用手册', ' - 测试用例', ' - 验收标准', ' - 运营配置手册', ' - 商务对接手册', ' - 运营操作手册', ' - 合规接入文档', ' - 审核规则手册', ' 接入文档', ' 使用手册', ' 测试用例']
    for (const suffix of suffixes) {
      if (name.endsWith(suffix)) { name = name.slice(0, -suffix.length); break }
    }
    return name.trim()
  }

  // 按模块 → 功能 → 分类 组织
  const moduleFeatureMap = {}
  for (const [mod, docs] of Object.entries(moduleGroups)) {
    moduleFeatureMap[mod] = {}
    docs.forEach(doc => {
      const feature = getFeatureName(doc)
      if (!moduleFeatureMap[mod][feature]) moduleFeatureMap[mod][feature] = {}
      moduleFeatureMap[mod][feature][doc.category] = doc
    })
  }

  const getModuleIcon = (idx) => MODULE_ICONS[idx % MODULE_ICONS.length]
  const sortedModules = Object.keys(moduleGroups).sort((a, b) => {
    if (a === '未分类') return 1
    if (b === '未分类') return -1
    return a.localeCompare(b)
  })

  return (
    <div className="page-shell">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">文档中心</h1>
          <p className="page-subtitle">接入文档、使用手册、测试用例等</p>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="surface-card p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg flex-1">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="搜索文档名称…" value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent outline-none flex-1 text-sm text-slate-700 placeholder-gray-400" />
          </div>
        </div>
      </div>

      {/* 维度切换 Tab */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex bg-white border border-slate-200 rounded-lg p-1">
          <button onClick={() => setViewMode('module')} className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors ${viewMode === 'module' ? 'bg-primary-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
            按模块查看
          </button>
          <button onClick={() => setViewMode('type')} className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors ${viewMode === 'type' ? 'bg-primary-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
            按类型查看
          </button>
        </div>
        <div className="text-[12px] text-slate-400">
          共 <span className="font-bold text-slate-700">{documents.length}</span> 个文档
        </div>
      </div>

      {/* ============ 按类型查看 ============ */}
      {viewMode === 'type' && (
        <>
          {/* 类型筛选条 */}
          <div className="flex gap-2 mb-5">
            {DOC_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setTypeFilter(cat)} className={`px-3.5 py-1.5 rounded-full text-[12px] border transition-colors ${typeFilter === cat ? 'bg-primary-50 border-primary-500 text-primary-600 font-semibold' : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'}`}>
                {cat}
              </button>
            ))}
          </div>

          {/* 文档卡片列表 */}
          {Object.entries(stageGroups).sort(([a], [b]) => {
            if (a === 'other') return 1
            if (b === 'other') return -1
            return parseInt(a) - parseInt(b)
          }).map(([stageNum, items]) => (
            <div key={stageNum} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2.5 py-1 rounded-lg text-[12px] font-semibold ${stageNum === 'other' ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'}`}>
                  {stageNum === 'other' ? '通用文档' : `阶段${stageNum}`}
                </span>
                <span className="text-[12px] text-slate-400">{items.length} 个文档</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {items.map(doc => {
                  const url = normalizeUrl(doc.file_url)
                  const catStyle = CATEGORY_COLORS[doc.category] || CATEGORY_COLORS['其他']
                  const card = (
                    <div key={doc.id} className={`surface-card p-5 transition-shadow ${url ? 'cursor-pointer hover:shadow-lg hover:border-primary-200' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[15px] font-bold leading-tight flex-1 mr-2">{doc.title}</div>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0 ${catStyle.bg}`}>
                          {doc.category}
                        </span>
                      </div>
                      <div className="text-[12px] text-slate-500 mb-3 leading-relaxed">{doc.description}</div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        {doc.module_name && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-600">{doc.module_name}</span>
                        )}
                        <span>{doc.created_at?.slice(0, 10)}</span>
                        {url && <span className="ml-auto text-primary-500 font-medium">查看文档 →</span>}
                      </div>
                    </div>
                  )
                  return url ? (
                    <a key={doc.id} href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>{card}</a>
                  ) : card
                })}
              </div>
            </div>
          ))}

          {typeFiltered.length === 0 && (
            <div className="text-center py-20 text-slate-400">
              <p className="text-lg mb-2">🔍</p>
              <p>未找到匹配的文档</p>
            </div>
          )}
        </>
      )}

      {/* ============ 按模块查看 ============ */}
      {viewMode === 'module' && (
        <>
          {/* 模块筛选条 */}
          <div className="flex gap-2 flex-wrap mb-5">
            <button onClick={() => setModuleFilter('all')} className={`px-3.5 py-1.5 rounded-full text-[12px] border transition-colors ${moduleFilter === 'all' ? 'bg-primary-50 border-primary-500 text-primary-600 font-semibold' : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'}`}>
              全部
            </button>
            {allModules.map(mod => (
              <button key={mod} onClick={() => setModuleFilter(mod)} className={`px-3.5 py-1.5 rounded-full text-[12px] border transition-colors ${moduleFilter === mod ? 'bg-primary-50 border-primary-500 text-primary-600 font-semibold' : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'}`}>
                {mod}
              </button>
            ))}
          </div>

          {/* 模块分组表格 */}
          {sortedModules.map((mod, modIdx) => {
            const features = moduleFeatureMap[mod]
            const featureNames = Object.keys(features)
            if (featureNames.length === 0) return null

            return (
              <div key={mod} className="surface-card overflow-hidden mb-5">
                {/* 模块标题 */}
                <div className="flex items-center gap-2.5 px-5 py-3 bg-slate-50 border-b border-slate-100">
                  <span className="text-base">{getModuleIcon(modIdx)}</span>
                  <span className="text-[15px] font-bold text-slate-800">{mod}</span>
                  <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{featureNames.length} 个功能</span>
                </div>

                {/* 表格 */}
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80">
                      <th className="text-left px-5 py-2.5 text-[11px] text-slate-400 font-semibold w-[22%]">功能名称</th>
                      <th className="text-left px-4 py-2.5 text-[11px] text-slate-400 font-semibold w-[26%]">接入文档</th>
                      <th className="text-left px-4 py-2.5 text-[11px] text-slate-400 font-semibold w-[26%]">使用手册</th>
                      <th className="text-left px-4 py-2.5 text-[11px] text-slate-400 font-semibold w-[26%]">测试用例</th>
                    </tr>
                  </thead>
                  <tbody>
                    {featureNames.map(fname => {
                      const cats = features[fname]
                      return (
                        <tr key={fname} className="border-b border-gray-50 last:border-b-0 hover:bg-indigo-50/20">
                          <td className="px-5 py-3 text-[13px] font-semibold text-slate-700">{fname}</td>
                          {['接入文档', '使用手册', '测试用例'].map(cat => {
                            const doc = cats[cat]
                            if (!doc) return (
                              <td key={cat} className="px-4 py-3">
                                <span className="text-[12px] text-gray-300 border border-dashed border-slate-200 rounded-md px-2.5 py-1">暂无</span>
                              </td>
                            )
                            const url = normalizeUrl(doc.file_url)
                            const catStyle = CATEGORY_COLORS[cat] || CATEGORY_COLORS['其他']
                            const link = (
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium ${catStyle.bg} ${url ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`}></span>
                                {doc.description || cat}
                              </span>
                            )
                            return (
                              <td key={cat} className="px-4 py-3">
                                {url ? (
                                  <a href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>{link}</a>
                                ) : link}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          })}

          {moduleFiltered.length === 0 && (
            <div className="text-center py-20 text-slate-400">
              <p className="text-lg mb-2">🔍</p>
              <p>未找到匹配的文档</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
