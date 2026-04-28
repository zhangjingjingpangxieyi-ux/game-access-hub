import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const STAGE_COLORS = {
  0: 'bg-green-100 text-green-700',
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-amber-100 text-amber-700',
  3: 'bg-purple-100 text-purple-700',
}

const CATEGORY_COLORS = {
  '接入文档': 'bg-blue-50 text-blue-600',
  '使用手册': 'bg-green-50 text-green-600',
  '测试用例': 'bg-amber-50 text-amber-600',
  '其他': 'bg-gray-50 text-gray-600',
}

const DOC_CATEGORIES = ['全部', '接入文档', '使用手册', '测试用例', '其他']

export default function DocCenter() {
  const [documents, setDocuments] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('全部')
  const [stages, setStages] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: stageData } = await supabase.from('stages').select('*').order('sort_order')
    setStages(stageData || [])
    const { data } = await supabase.from('documents').select('*').order('sort_order')
    setDocuments(data || [])
  }

  const filtered = documents.filter(doc => {
    if (filter !== '全部' && doc.category !== filter) return false
    if (search && !doc.title.includes(search) && !(doc.description || '').includes(search)) return false
    return true
  })

  // 按阶段分组
  const grouped = {}
  filtered.forEach(doc => {
    const sNum = doc.related_stage !== null && doc.related_stage !== undefined ? doc.related_stage : 'other'
    if (!grouped[sNum]) grouped[sNum] = []
    grouped[sNum].push(doc)
  })

  function getStageLabel(stageNum) {
    if (stageNum === 'other') return '通用文档'
    const stage = stages.find(s => s.stage_num === stageNum)
    return stage ? `阶段${stageNum} · ${stage.name}` : `阶段${stageNum}`
  }

  function getStageColor(stageNum) {
    if (stageNum === 'other') return 'bg-gray-100 text-gray-600'
    return STAGE_COLORS[stageNum] || 'bg-gray-100 text-gray-600'
  }

  // 确保 URL 有协议前缀
  function normalizeUrl(url) {
    if (!url || url === '#') return null
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    return 'https://' + url
  }

  const sortedGroups = Object.entries(grouped).sort(([a], [b]) => {
    if (a === 'other') return 1
    if (b === 'other') return -1
    return parseInt(a) - parseInt(b)
  })

  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">文档中心</h1>
          <p className="text-[13px] text-gray-400 mt-1">接入文档、使用手册、测试用例等</p>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex gap-2.5 mb-5 items-center">
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-[13px] text-gray-400 w-[260px]">
          <span>🔍</span>
          <input type="text" placeholder="搜索文档名称…" value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent outline-none flex-1 text-gray-700 placeholder-gray-400" />
        </div>
        {DOC_CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} className={`px-3.5 py-1.5 rounded-full text-[12px] border transition-colors ${filter === cat ? 'bg-primary-50 border-primary-500 text-primary-600 font-semibold' : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* 统计 */}
      <div className="flex gap-4 mb-5 text-[12px] text-gray-400">
        <span>共 <span className="font-bold text-gray-700">{documents.length}</span> 个文档</span>
        <span>当前显示 <span className="font-bold text-gray-700">{filtered.length}</span> 个</span>
      </div>

      {/* 按阶段分组展示 */}
      {sortedGroups.map(([stageNum, items]) => (
        <div key={stageNum} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2.5 py-1 rounded-lg text-[12px] font-semibold ${getStageColor(stageNum)}`}>
              {getStageLabel(stageNum)}
            </span>
            <span className="text-[12px] text-gray-400">{items.length} 个文档</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {items.map(doc => {
              const url = normalizeUrl(doc.file_url)
              const card = (
                <div key={doc.id} className="bg-white rounded-xl p-5 border border-gray-200 transition-shadow ${url ? 'cursor-pointer hover:shadow-lg hover:border-primary-200' : ''}">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[15px] font-bold leading-tight flex-1 mr-2">{doc.title}</div>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0 ${CATEGORY_COLORS[doc.category] || 'bg-gray-50 text-gray-500'}`}>
                      {doc.category}
                    </span>
                  </div>
                  <div className="text-[12px] text-gray-500 mb-3 leading-relaxed">{doc.description}</div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    {doc.related_stage !== null && doc.related_stage !== undefined && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${STAGE_COLORS[doc.related_stage] || ''}`}>
                        阶段{doc.related_stage}
                      </span>
                    )}
                    <span>{doc.created_at?.slice(0, 10)}</span>
                    {url && (
                      <span className="ml-auto text-primary-500 font-medium">查看文档 →</span>
                    )}
                  </div>
                </div>
              )

              // 有链接则点击跳转新标签页
              return url ? (
                <a key={doc.id} href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                  {card}
                </a>
              ) : (
                card
              )
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">🔍</p>
          <p>未找到匹配的文档</p>
        </div>
      )}
    </div>
  )
}
