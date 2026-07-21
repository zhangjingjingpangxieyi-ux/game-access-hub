import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { getAccessMethodTone, getAccessResponsibility, getMaterialInfo, getPlatformContacts } from '../lib/featureMeta'

const FEATURE_FILTER_DEFAULTS = {
  query: '',
  module: '',
  stage: '',
  recommendation: '',
  accessMethod: '',
  material: '',
}

const DOC_FILTER_DEFAULTS = {
  query: '',
  module: '',
  category: '',
  stage: '',
  unlinkedOnly: false,
}

export default function Admin() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [verified, setVerified] = useState(false)
  const [activeMenu, setActiveMenu] = useState('features')
  const [features, setFeatures] = useState([])
  const [stages, setStages] = useState([])
  const [documents, setDocuments] = useState([])
  const [editFeature, setEditFeature] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({})
  const [showDocForm, setShowDocForm] = useState(false)
  const [docForm, setDocForm] = useState({})
  const [editDocId, setEditDocId] = useState(null)
  const [featureSort, setFeatureSort] = useState({ key: 'sort_order', dir: 'asc' })
  const [docSort, setDocSort] = useState({ key: 'sort_order', dir: 'asc' })
  const [featureFilters, setFeatureFilters] = useState(FEATURE_FILTER_DEFAULTS)
  const [docFilters, setDocFilters] = useState(DOC_FILTER_DEFAULTS)

  useEffect(() => {
    if (verified) fetchData()
  }, [verified, activeMenu])

  useEffect(() => {
    if (isAdmin) setVerified(true)
  }, [isAdmin])

  async function fetchData() {
    const [stageResult] = await Promise.all([
      supabase.from('stages').select('*').order('sort_order'),
    ])
    setStages(stageResult.data || [])

    if (activeMenu === 'features') {
      const { data } = await supabase
        .from('features')
        .select('*, stages(stage_num)')
        .eq('is_active', true)
        .order('sort_order')
      setFeatures(data || [])
    } else if (activeMenu === 'docs') {
      const { data } = await supabase.from('documents').select('*').order('sort_order')
      setDocuments(data || [])
    }
  }

  function toggleSort(currentSort, setSort, key) {
    if (currentSort.key === key) {
      setSort({ key, dir: currentSort.dir === 'asc' ? 'desc' : 'asc' })
    } else {
      setSort({ key, dir: 'asc' })
    }
  }

  function SortHeader({ label, sortState, setSort, field }) {
    const isActive = sortState.key === field
    return (
      <button
        type="button"
        onClick={() => toggleSort(sortState, setSort, field)}
        className="inline-flex items-center gap-1 text-left text-[12px] font-semibold text-slate-500 hover:text-slate-800"
      >
        {label}
        <span className="text-[10px]">{isActive ? (sortState.dir === 'asc' ? '↑' : '↓') : '↕'}</span>
      </button>
    )
  }

  function stageNumOf(feature) {
    return feature.stages?.stage_num ?? stages.find(s => s.id === feature.stage_id)?.stage_num ?? null
  }

  function materialInfo(value) {
    return getMaterialInfo(value)
  }

  function tagClass(tone) {
    const tones = {
      blue: 'bg-blue-50 text-blue-700 ring-blue-100',
      green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
      amber: 'bg-amber-50 text-amber-700 ring-amber-100',
      red: 'bg-red-50 text-red-700 ring-red-100',
      purple: 'bg-purple-50 text-purple-700 ring-purple-100',
      gray: 'bg-slate-100 text-slate-600 ring-slate-200',
    }
    return `inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${tones[tone] || tones.gray}`
  }

  function stageClass(stageNum) {
    if (stageNum === 0) return tagClass('green')
    if (stageNum === 1) return tagClass('blue')
    if (stageNum === 2) return tagClass('amber')
    if (stageNum === 3) return tagClass('purple')
    return tagClass('gray')
  }

  function categoryClass(category) {
    if (category === '接入文档') return tagClass('blue')
    if (category === '使用手册') return tagClass('green')
    if (category === '测试用例') return tagClass('amber')
    return tagClass('gray')
  }

  function moduleFromTitle(title) {
    const match = title?.match(/^\[([^\]]+)\]/)
    return match?.[1] || ''
  }

  function featureNameFromTitle(title) {
    const match = title?.match(/^\[[^\]]+\]\s*([^-—]+?)\s*[-—]/)
    return match?.[1]?.trim() || ''
  }

  const featureModules = useMemo(
    () => [...new Set(features.map(f => f.module_name).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-CN')),
    [features]
  )

  const featureAccessMethods = useMemo(
    () => [...new Set(features.map(f => f.access_method).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-CN')),
    [features]
  )

  const docModules = useMemo(
    () => [...new Set(documents.map(d => d.module_name || moduleFromTitle(d.title)).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-CN')),
    [documents]
  )

  const filteredFeatures = useMemo(() => {
    return features.filter(feature => {
      const q = featureFilters.query.trim().toLowerCase()
      const material = materialInfo(feature.team_needs)
      if (q && !`${feature.name || ''} ${feature.description || ''}`.toLowerCase().includes(q)) return false
      if (featureFilters.module && feature.module_name !== featureFilters.module) return false
      if (featureFilters.stage !== '' && String(stageNumOf(feature)) !== featureFilters.stage) return false
      if (featureFilters.recommendation && feature.recommendation !== featureFilters.recommendation) return false
      if (featureFilters.accessMethod && feature.access_method !== featureFilters.accessMethod) return false
      if (featureFilters.material === 'required' && material.label === '无需物料') return false
      if (featureFilters.material === 'none' && material.label !== '无需物料') return false
      return true
    })
  }, [features, featureFilters, stages])

  const sortedFeatures = useMemo(() => {
    return [...filteredFeatures].sort((a, b) => {
      const dir = featureSort.dir === 'asc' ? 1 : -1
      let va, vb
      switch (featureSort.key) {
        case 'module_name': va = (a.module_name || ''); vb = (b.module_name || ''); break
        case 'stage_num': va = stageNumOf(a) ?? 0; vb = stageNumOf(b) ?? 0; break
        case 'recommendation': va = a.recommendation || ''; vb = b.recommendation || ''; break
        case 'access_method': va = a.access_method || ''; vb = b.access_method || ''; break
        case 'owner': va = getAccessResponsibility(a.access_method); vb = getAccessResponsibility(b.access_method); break
        case 'material': va = materialInfo(a.team_needs).label; vb = materialInfo(b.team_needs).label; break
        default: va = a.sort_order || 0; vb = b.sort_order || 0; break
      }
      if (typeof va === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb), 'zh-CN') * dir
    })
  }, [filteredFeatures, featureSort, stages])

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const q = docFilters.query.trim().toLowerCase()
      const moduleName = doc.module_name || moduleFromTitle(doc.title)
      if (q && !`${doc.title || ''} ${doc.feature_name || featureNameFromTitle(doc.title) || ''} ${doc.description || ''} ${doc.file_url || ''}`.toLowerCase().includes(q)) return false
      if (docFilters.module && moduleName !== docFilters.module) return false
      if (docFilters.category && doc.category !== docFilters.category) return false
      if (docFilters.stage !== '' && String(doc.related_stage ?? '') !== docFilters.stage) return false
      if (docFilters.unlinkedOnly && doc.related_stage !== null && doc.related_stage !== undefined) return false
      return true
    })
  }, [documents, docFilters])

  const sortedDocs = useMemo(() => {
    return [...filteredDocs].sort((a, b) => {
      const dir = docSort.dir === 'asc' ? 1 : -1
      let va, vb
      switch (docSort.key) {
        case 'module_name': va = (a.module_name || moduleFromTitle(a.title)); vb = (b.module_name || moduleFromTitle(b.title)); break
        case 'category': va = a.category || ''; vb = b.category || ''; break
        case 'related_stage': va = a.related_stage ?? 99; vb = b.related_stage ?? 99; break
        case 'created_at': va = a.created_at || ''; vb = b.created_at || ''; break
        default: va = a.sort_order || 0; vb = b.sort_order || 0; break
      }
      if (typeof va === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb), 'zh-CN') * dir
    })
  }, [filteredDocs, docSort])

  async function handleFeatureDragEnd(result) {
    if (!result.destination) return
    const sourceIndex = result.source.index
    const destIndex = result.destination.index
    if (sourceIndex === destIndex) return

    const reordered = [...sortedFeatures]
    const [moved] = reordered.splice(sourceIndex, 1)
    reordered.splice(destIndex, 0, moved)
    setFeatures(prev => {
      const visibleIds = new Set(reordered.map(item => item.id))
      const hidden = prev.filter(item => !visibleIds.has(item.id))
      return [...reordered, ...hidden]
    })

    try {
      for (const [idx, feature] of reordered.entries()) {
        await supabase.from('features').update({ sort_order: idx + 1 }).eq('id', feature.id)
      }
    } catch (err) {
      console.error('排序保存失败:', err)
      alert('排序保存失败')
      fetchData()
    }
  }

  function openEditForm(feature) {
    setEditFeature(feature)
    setForm({
      name: feature.name,
      description: feature.description || '',
      recommendation: feature.recommendation,
      feature_type: feature.feature_type,
      access_method: feature.access_method,
      estimated_duration: feature.estimated_duration || '',
      platform_responsibility: feature.platform_responsibility || '',
      team_responsibility: feature.team_responsibility || '',
      team_needs: feature.team_needs || '',
      owner_dev: feature.owner_dev || '',
      owner_qa: feature.owner_qa || '',
      module_name: feature.module_name || '',
      stage_id: feature.stage_id,
    })
    setShowForm(true)
  }

  function openCreateForm() {
    setEditFeature(null)
    setForm({
      name: '',
      description: '',
      recommendation: '推荐使用',
      feature_type: '通用',
      access_method: '开通权限',
      estimated_duration: '',
      platform_responsibility: '',
      team_responsibility: '',
      team_needs: '',
      owner_dev: '',
      owner_qa: '',
      module_name: '',
      stage_id: null,
    })
    setShowForm(true)
  }

  async function saveFeature() {
    if (!form.name) { alert('请填写功能名称'); return }
    if (!form.stage_id) { alert('请选择所属阶段'); return }

    const baseFields = {
      name: form.name,
      description: form.description,
      recommendation: form.recommendation,
      feature_type: form.feature_type,
      access_method: form.access_method,
      estimated_duration: form.estimated_duration,
      platform_responsibility: form.platform_responsibility,
      team_responsibility: form.team_responsibility,
      team_needs: form.team_needs,
      owner_dev: form.owner_dev || null,
      owner_qa: form.owner_qa || null,
      stage_id: form.stage_id,
    }
    const moduleFields = { ...baseFields, module_name: form.module_name || null }

    if (editFeature) {
      let { error } = await supabase.from('features').update(moduleFields).eq('id', editFeature.id)
      if (error && error.message?.includes('module_name')) {
        ({ error } = await supabase.from('features').update(baseFields).eq('id', editFeature.id))
      }
      if (error) { alert('保存失败：' + error.message); return }
    } else {
      const { data: maxSort } = await supabase.from('features').select('sort_order').order('sort_order', { ascending: false }).limit(1).single()
      let { error } = await supabase.from('features').insert({
        ...moduleFields,
        sort_order: (maxSort?.sort_order || 0) + 1,
      })
      if (error && error.message?.includes('module_name')) {
        ({ error } = await supabase.from('features').insert({
          ...baseFields,
          sort_order: (maxSort?.sort_order || 0) + 1,
        }))
      }
      if (error) { alert('保存失败：' + error.message); return }
    }
    setShowForm(false)
    fetchData()
  }

  async function deleteFeature(featureId) {
    if (!confirm('确认删除该功能？删除后不可恢复，已关联此功能的项目数据不会受影响。')) return
    const { error } = await supabase.from('features').update({ is_active: false }).eq('id', featureId)
    if (error) { alert('删除失败：' + error.message); return }
    fetchData()
  }

  async function saveDocument() {
    if (!docForm.title) { alert('请填写文档名称'); return }
    if (editDocId) {
      const baseFields = {
        title: docForm.title,
        description: docForm.description,
        category: docForm.category,
        file_url: docForm.file_url,
        related_stage: docForm.related_stage,
        feature_name: docForm.feature_name || featureNameFromTitle(docForm.title) || null,
        updated_at: new Date().toISOString(),
      }
      let { error } = await supabase.from('documents').update({ ...baseFields, module_name: docForm.module_name || null }).eq('id', editDocId)
      if (error && error.message?.includes('module_name')) {
        ({ error } = await supabase.from('documents').update(baseFields).eq('id', editDocId))
      }
      if (error && error.message?.includes('feature_name')) {
        const { feature_name, ...fallbackFields } = baseFields
        ;({ error } = await supabase.from('documents').update({ ...fallbackFields, module_name: docForm.module_name || null }).eq('id', editDocId))
        if (error && error.message?.includes('module_name')) {
          ;({ error } = await supabase.from('documents').update(fallbackFields).eq('id', editDocId))
        }
      }
      if (error) { alert('保存失败：' + error.message); return }
    } else {
      const { data: maxSort } = await supabase.from('documents').select('sort_order').order('sort_order', { ascending: false }).limit(1).single()
      const baseFields = {
        title: docForm.title,
        description: docForm.description,
        category: docForm.category,
        file_url: docForm.file_url,
        related_stage: docForm.related_stage,
        feature_name: docForm.feature_name || featureNameFromTitle(docForm.title) || null,
        sort_order: (maxSort?.sort_order || 0) + 1,
      }
      let { error } = await supabase.from('documents').insert({ ...baseFields, module_name: docForm.module_name || null })
      if (error && error.message?.includes('module_name')) {
        ({ error } = await supabase.from('documents').insert(baseFields))
      }
      if (error && error.message?.includes('feature_name')) {
        const { feature_name, ...fallbackFields } = baseFields
        ;({ error } = await supabase.from('documents').insert({ ...fallbackFields, module_name: docForm.module_name || null }))
        if (error && error.message?.includes('module_name')) {
          ;({ error } = await supabase.from('documents').insert(fallbackFields))
        }
      }
      if (error) { alert('保存失败：' + error.message); return }
    }
    setShowDocForm(false)
    setEditDocId(null)
    fetchData()
  }

  function openCreateDocForm() {
    setDocForm({ title: '', description: '', category: '接入文档', file_url: '', related_stage: null, module_name: '', feature_name: '' })
    setEditDocId(null)
    setShowDocForm(true)
  }

  function openEditDocForm(doc) {
    setDocForm({
      title: doc.title,
      description: doc.description || '',
      category: doc.category,
      file_url: doc.file_url || '',
      related_stage: doc.related_stage,
      module_name: doc.module_name || moduleFromTitle(doc.title),
      feature_name: doc.feature_name || featureNameFromTitle(doc.title),
    })
    setEditDocId(doc.id)
    setShowDocForm(true)
  }

  if (!verified) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55">
        <div className="w-[420px] rounded-2xl bg-white p-7 shadow-2xl">
          <h2 className="mb-2 text-lg font-bold text-slate-900">无管理权限</h2>
          <p className="mb-5 text-[13px] leading-relaxed text-slate-500">当前企业账号不是本应用的管理员，请联系应用负责人开通 admin 或 owner 角色后再进入。</p>
          <div className="flex justify-end"><button onClick={() => navigate('/')} className="rounded-lg border border-slate-300 px-4 py-2 text-[13px] text-slate-600 hover:bg-slate-50">返回首页</button></div>
        </div>
      </div>
    )
  }

  const menus = [
    { key: 'features', label: '功能库配置', count: features.length },
    { key: 'stages', label: '阶段规则配置', count: stages.length },
    { key: 'docs', label: '文档管理', count: documents.length },
    { key: 'overview', label: '项目进度总览' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-7">
      <div className="mx-auto max-w-[1520px]">
        <button className="mb-4 text-[12px] text-slate-400 hover:text-slate-700" onClick={() => navigate('/')}>
          ← 返回前台
        </button>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">后台管理</h1>
            <p className="mt-1 text-sm text-slate-500">功能库配置 · 阶段规则 · 文档管理</p>
          </div>
        </div>

        <div className="grid grid-cols-[184px_minmax(0,1fr)] gap-4">
          <aside className="h-fit rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            {menus.map(menu => (
              <button
                key={menu.key}
                onClick={() => setActiveMenu(menu.key)}
                className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[13px] ${
                  activeMenu === menu.key ? 'bg-primary-50 font-semibold text-primary-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <span>{menu.label}</span>
                {menu.count !== undefined && <span className="rounded-full bg-white/80 px-1.5 text-[11px] text-slate-400">{menu.count}</span>}
              </button>
            ))}
          </aside>

          <main className="min-w-0">
            {activeMenu === 'features' && (
              <section className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-[15px] font-bold text-slate-900">功能库 · 共 {features.length} 个功能</h2>
                      <p className="mt-1 text-[12px] text-slate-500">默认只展示维护时最常用字段，完整信息可在编辑弹窗中查看。</p>
                    </div>
                    <button onClick={openCreateForm} className="rounded-lg bg-primary-500 px-4 py-2 text-[13px] font-semibold text-white hover:bg-primary-600">+ 新增功能</button>
                  </div>

                  <div className="grid grid-cols-[minmax(220px,1.4fr)_repeat(5,minmax(120px,1fr))_auto] gap-2">
                    <input
                      value={featureFilters.query}
                      onChange={e => setFeatureFilters({ ...featureFilters, query: e.target.value })}
                      placeholder="搜索功能名称 / 描述"
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] outline-none focus:border-primary-400 focus:bg-white"
                    />
                    <select value={featureFilters.module} onChange={e => setFeatureFilters({ ...featureFilters, module: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px]">
                      <option value="">全部模块</option>
                      {featureModules.map(module => <option key={module}>{module}</option>)}
                    </select>
                    <select value={featureFilters.stage} onChange={e => setFeatureFilters({ ...featureFilters, stage: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px]">
                      <option value="">全部阶段</option>
                      {stages.map(stage => <option key={stage.id} value={stage.stage_num}>阶段{stage.stage_num}</option>)}
                    </select>
                    <select value={featureFilters.recommendation} onChange={e => setFeatureFilters({ ...featureFilters, recommendation: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px]">
                      <option value="">全部等级</option>
                      <option>必须使用</option>
                      <option>推荐使用</option>
                    </select>
                    <select value={featureFilters.accessMethod} onChange={e => setFeatureFilters({ ...featureFilters, accessMethod: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px]">
                      <option value="">全部接入方式</option>
                      {featureAccessMethods.map(method => <option key={method}>{method}</option>)}
                    </select>
                    <select value={featureFilters.material} onChange={e => setFeatureFilters({ ...featureFilters, material: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px]">
                      <option value="">全部物料</option>
                      <option value="required">需要物料</option>
                      <option value="none">无需物料</option>
                    </select>
                    <button onClick={() => setFeatureFilters(FEATURE_FILTER_DEFAULTS)} className="rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-500 hover:bg-slate-50">重置</button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="grid grid-cols-[40px_minmax(260px,1.6fr)_110px_96px_110px_120px_100px_150px_170px_104px] items-center border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="text-center text-[12px] text-slate-400">排序</span>
                    <span className="text-[12px] font-semibold text-slate-500">功能名称</span>
                    <SortHeader label="所属模块" sortState={featureSort} setSort={setFeatureSort} field="module_name" />
                    <SortHeader label="阶段" sortState={featureSort} setSort={setFeatureSort} field="stage_num" />
                    <SortHeader label="推荐等级" sortState={featureSort} setSort={setFeatureSort} field="recommendation" />
                    <SortHeader label="接入方式" sortState={featureSort} setSort={setFeatureSort} field="access_method" />
                    <SortHeader label="权责方" sortState={featureSort} setSort={setFeatureSort} field="owner" />
                    <SortHeader label="物料要求" sortState={featureSort} setSort={setFeatureSort} field="material" />
                    <span className="text-[12px] font-semibold text-slate-500">平台负责人</span>
                    <span className="text-[12px] font-semibold text-slate-500">操作</span>
                  </div>

                  <DragDropContext onDragEnd={handleFeatureDragEnd}>
                    <Droppable droppableId="features-list">
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}>
                          {sortedFeatures.map((feature, index) => {
                            const stageNum = stageNumOf(feature)
                            const material = materialInfo(feature.team_needs)
                            const responsibility = getAccessResponsibility(feature.access_method)
                            const contacts = getPlatformContacts(feature)
                            return (
                              <Draggable key={feature.id} draggableId={feature.id} index={index}>
                                {(prov, snap) => (
                                  <div
                                    ref={prov.innerRef}
                                    {...prov.draggableProps}
                                    className={`grid grid-cols-[40px_minmax(260px,1.6fr)_110px_96px_110px_120px_100px_150px_170px_104px] items-center border-b border-slate-100 px-4 py-3 text-[13px] hover:bg-slate-50 ${
                                      snap.isDragging ? 'bg-primary-50 shadow-lg ring-2 ring-primary-200' : ''
                                    }`}
                                  >
                                    <div {...prov.dragHandleProps} className="cursor-grab text-center text-slate-300 hover:text-slate-500">⋮⋮</div>
                                    <div className="min-w-0 pr-4">
                                      <div className="font-semibold text-slate-950">{feature.name}</div>
                                      <div className="mt-1 line-clamp-2 max-w-[520px] text-[12px] leading-5 text-slate-400" title={feature.description || ''}>{feature.description || '-'}</div>
                                    </div>
                                    <span className="truncate text-[12px] text-slate-500" title={feature.module_name || ''}>{feature.module_name || '-'}</span>
                                    <span><span className={stageClass(stageNum)}>阶段{stageNum ?? '-'}</span></span>
                                    <span><span className={feature.recommendation === '必须使用' ? tagClass('red') : tagClass('amber')}>{feature.recommendation || '-'}</span></span>
                                    <span><span className={tagClass(getAccessMethodTone(feature.access_method))}>{feature.access_method || '-'}</span></span>
                                    <span><span className={tagClass('gray')} title="由接入方式自动判断">{responsibility}</span></span>
                                    <span><span className={tagClass(material.tone)} title={material.detail}>{material.label}</span></span>
                                    <span className="truncate text-[12px] text-slate-500" title={contacts.title}>{contacts.summary}</span>
                                    <div className="flex items-center gap-2">
                                      <button onClick={() => openEditForm(feature)} className="text-[12px] font-semibold text-primary-600 hover:underline">编辑</button>
                                      <details className="relative">
                                        <summary className="cursor-pointer list-none text-[12px] text-slate-500 hover:text-slate-800">更多</summary>
                                        <div className="absolute right-0 z-10 mt-2 w-24 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                                          <button onClick={() => deleteFeature(feature.id)} className="w-full rounded-md px-2 py-1.5 text-left text-[12px] text-red-600 hover:bg-red-50">删除</button>
                                        </div>
                                      </details>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            )
                          })}
                          {sortedFeatures.length === 0 && <div className="py-14 text-center text-sm text-slate-400">没有匹配的功能</div>}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
              </section>
            )}

            {activeMenu === 'stages' && (
              <section className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h2 className="text-[15px] font-bold text-slate-900">阶段规则配置 · 共 {stages.length} 个阶段</h2>
                </div>
                {stages.map(stage => (
                  <div key={stage.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="text-[11px] font-bold text-slate-400">阶段 {stage.stage_num}</span>
                      <span className="text-[14px] font-bold">{stage.name}</span>
                      <span className={tagClass('green')}>{stage.duration}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[12px]">
                      <div><span className="text-slate-400">工作量：</span>{stage.game_workload}</div>
                      <div><span className="text-slate-400">适合项目：</span>{stage.suitable_for}</div>
                      <div><span className="text-slate-400">接入目标：</span>{stage.goal}</div>
                      <div><span className="text-slate-400">前置条件：</span>{stage.prerequisite}</div>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {activeMenu === 'docs' && (
              <section className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-[15px] font-bold text-slate-900">文档管理 · 共 {documents.length} 个文档</h2>
                      <p className="mt-1 text-[12px] text-slate-500">列表突出文档定位信息，说明文本折叠为一行，便于批量维护。</p>
                    </div>
                    <button onClick={openCreateDocForm} className="rounded-lg bg-primary-500 px-4 py-2 text-[13px] font-semibold text-white hover:bg-primary-600">+ 新增文档</button>
                  </div>

                  <div className="grid grid-cols-[minmax(240px,1.5fr)_repeat(4,minmax(120px,1fr))_auto_auto] gap-2">
                    <input
                      value={docFilters.query}
                      onChange={e => setDocFilters({ ...docFilters, query: e.target.value })}
                      placeholder="搜索文档名称 / 编号 / 描述"
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] outline-none focus:border-primary-400 focus:bg-white"
                    />
                    <select value={docFilters.module} onChange={e => setDocFilters({ ...docFilters, module: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px]">
                      <option value="">全部模块</option>
                      {docModules.map(module => <option key={module}>{module}</option>)}
                    </select>
                    <select value={docFilters.category} onChange={e => setDocFilters({ ...docFilters, category: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px]">
                      <option value="">全部分类</option>
                      <option>接入文档</option>
                      <option>使用手册</option>
                      <option>测试用例</option>
                      <option>其他</option>
                    </select>
                    <select value={docFilters.stage} onChange={e => setDocFilters({ ...docFilters, stage: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px]">
                      <option value="">全部阶段</option>
                      {stages.map(stage => <option key={stage.id} value={stage.stage_num}>阶段{stage.stage_num}</option>)}
                    </select>
                    <label className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-600">
                      <input type="checkbox" checked={docFilters.unlinkedOnly} onChange={e => setDocFilters({ ...docFilters, unlinkedOnly: e.target.checked })} />
                      未关联阶段
                    </label>
                    <button onClick={() => setDocFilters(DOC_FILTER_DEFAULTS)} className="rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-500 hover:bg-slate-50">重置</button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="grid grid-cols-[minmax(320px,1.8fr)_120px_120px_120px_160px_112px] items-center border-b border-slate-200 bg-slate-50 px-5 py-3">
                    <span className="text-[12px] font-semibold text-slate-500">文档名称</span>
                    <SortHeader label="所属模块" sortState={docSort} setSort={setDocSort} field="module_name" />
                    <SortHeader label="分类" sortState={docSort} setSort={setDocSort} field="category" />
                    <SortHeader label="关联阶段" sortState={docSort} setSort={setDocSort} field="related_stage" />
                    <SortHeader label="创建时间" sortState={docSort} setSort={setDocSort} field="created_at" />
                    <span className="text-[12px] font-semibold text-slate-500">操作</span>
                  </div>
                  {sortedDocs.length === 0 ? (
                    <div className="py-14 text-center text-sm text-slate-400">没有匹配的文档</div>
                  ) : sortedDocs.map(doc => {
                    const moduleName = doc.module_name || moduleFromTitle(doc.title)
                    return (
                      <div key={doc.id} className="grid grid-cols-[minmax(320px,1.8fr)_120px_120px_120px_160px_112px] items-center border-b border-slate-100 px-5 py-3 text-[13px] hover:bg-slate-50">
                        <div className="min-w-0 pr-4">
                          <div className="font-semibold text-slate-950">{doc.title}</div>
                          <div className="mt-1 truncate text-[12px] text-slate-400" title={doc.description || ''}>{doc.description || '-'}</div>
                        </div>
                        <span className="truncate text-[12px] text-slate-500" title={moduleName || ''}>{moduleName || '-'}</span>
                        <span><span className={categoryClass(doc.category)}>{doc.category || '其他'}</span></span>
                        <span>
                          {doc.related_stage !== null && doc.related_stage !== undefined ? (
                            <span className={stageClass(doc.related_stage)}>阶段{doc.related_stage}</span>
                          ) : (
                            <span className={tagClass('gray')}>未关联</span>
                          )}
                        </span>
                        <span className="text-[12px] text-slate-400">{doc.created_at?.slice(0, 10) || '-'}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEditDocForm(doc)} className="text-[12px] font-semibold text-primary-600 hover:underline">编辑</button>
                          <details className="relative">
                            <summary className="cursor-pointer list-none text-[12px] text-slate-500 hover:text-slate-800">更多</summary>
                            <div className="absolute right-0 z-10 mt-2 w-24 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                              <button
                                onClick={async () => {
                                  if (confirm('确认删除该文档？')) {
                                    await supabase.from('documents').delete().eq('id', doc.id)
                                    fetchData()
                                  }
                                }}
                                className="w-full rounded-md px-2 py-1.5 text-left text-[12px] text-red-600 hover:bg-red-50"
                              >
                                删除
                              </button>
                            </div>
                          </details>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {activeMenu === 'overview' && (
              <div className="rounded-xl border border-slate-200 bg-white py-20 text-center text-slate-400 shadow-sm">
                <p className="mb-2 text-lg">项目进度总览</p>
                <p>开发中...</p>
              </div>
            )}
          </main>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-5" onClick={() => setShowForm(false)}>
          <div className="max-h-[92vh] w-[680px] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="mb-5 text-[16px] font-bold">{editFeature ? '编辑功能' : '新增功能'}</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="所属阶段" required>
                <select className="form-control" value={form.stage_id || ''} onChange={e => setForm({ ...form, stage_id: parseInt(e.target.value) })}>
                  <option value="">请选择阶段</option>
                  {stages.map(stage => <option key={stage.id} value={stage.id}>阶段{stage.stage_num} · {stage.name}</option>)}
                </select>
              </Field>
              <Field label="功能名称" required>
                <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="功能说明">
                <input className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </Field>
              <Field label="所属模块">
                <input className="form-control" placeholder="如：数据中心、运营中心" value={form.module_name || ''} onChange={e => setForm({ ...form, module_name: e.target.value })} />
              </Field>
              <Field label="推荐等级">
                <select className="form-control" value={form.recommendation} onChange={e => setForm({ ...form, recommendation: e.target.value })}>
                  <option>必须使用</option>
                  <option>推荐使用</option>
                </select>
              </Field>
              <Field label="功能类型">
                <select className="form-control" value={form.feature_type} onChange={e => setForm({ ...form, feature_type: e.target.value })}>
                  <option>通用</option>
                  <option>非通用</option>
                </select>
              </Field>
              <Field label="接入方式">
                <select className="form-control" value={form.access_method} onChange={e => setForm({ ...form, access_method: e.target.value })}>
                  <option>开通权限</option>
                  <option>游戏接入</option>
                  <option>平台开发</option>
                  <option>游戏接入+平台开发</option>
                </select>
              </Field>
              <Field label="权责方">
                <div className="form-control flex items-center text-slate-600 bg-slate-50">{getAccessResponsibility(form.access_method)}</div>
              </Field>
              <Field label="工期预估">
                <input className="form-control" value={form.estimated_duration} onChange={e => setForm({ ...form, estimated_duration: e.target.value })} />
              </Field>
              <Field label="平台负责事项" wide>
                <input className="form-control" value={form.platform_responsibility} onChange={e => setForm({ ...form, platform_responsibility: e.target.value })} />
              </Field>
              <Field label="项目组需提供" wide>
                <textarea className="form-control min-h-[88px] resize-none" value={form.team_needs} onChange={e => setForm({ ...form, team_needs: e.target.value })} placeholder="接入时需要项目组提供的物料、配置表、数据库地址等" />
              </Field>
              <Field label="平台开发负责人">
                <input className="form-control" value={form.owner_dev || ''} onChange={e => setForm({ ...form, owner_dev: e.target.value })} placeholder="平台开发负责人姓名" />
              </Field>
              <Field label="平台品质负责人">
                <input className="form-control" value={form.owner_qa || ''} onChange={e => setForm({ ...form, owner_qa: e.target.value })} placeholder="平台品质负责人姓名" />
              </Field>
            </div>
            <div className="mt-5 flex justify-end gap-2.5">
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-[13px] text-slate-600 hover:bg-slate-50">取消</button>
              <button onClick={saveFeature} className="rounded-lg bg-primary-500 px-4 py-2 text-[13px] font-medium text-white hover:bg-primary-600">保存</button>
            </div>
          </div>
        </div>
      )}

      {showDocForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-5" onClick={() => setShowDocForm(false)}>
          <div className="w-[620px] rounded-2xl bg-white p-7 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="mb-5 text-[16px] font-bold">{editDocId ? '编辑文档' : '新增文档'}</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="文档名称" required wide>
                <input
                  className="form-control"
                  value={docForm.title}
                  onChange={e => {
                    const nextTitle = e.target.value
                    const previousAutoFeature = featureNameFromTitle(docForm.title)
                    const nextFeature = featureNameFromTitle(nextTitle)
                    setDocForm({
                      ...docForm,
                      title: nextTitle,
                      feature_name: !docForm.feature_name || docForm.feature_name === previousAutoFeature ? nextFeature : docForm.feature_name,
                    })
                  }}
                  onBlur={e => {
                    const moduleName = moduleFromTitle(e.target.value)
                    const featureName = featureNameFromTitle(e.target.value)
                    if ((moduleName && !docForm.module_name) || (featureName && !docForm.feature_name)) {
                      setDocForm(prev => ({
                        ...prev,
                        module_name: moduleName && !prev.module_name ? moduleName : prev.module_name,
                        feature_name: featureName && !prev.feature_name ? featureName : prev.feature_name,
                      }))
                    }
                  }}
                />
              </Field>
              <Field label="功能名称" wide>
                <input
                  className="form-control"
                  placeholder="自动从文档名称中提取，如：公告"
                  value={docForm.feature_name || ''}
                  onChange={e => setDocForm({ ...docForm, feature_name: e.target.value })}
                />
              </Field>
              <Field label="所属模块" wide>
                <input className="form-control" placeholder="如：运营中心、数据中心" value={docForm.module_name || ''} onChange={e => setDocForm({ ...docForm, module_name: e.target.value })} />
              </Field>
              <Field label="文档说明" wide>
                <input className="form-control" value={docForm.description} onChange={e => setDocForm({ ...docForm, description: e.target.value })} />
              </Field>
              <Field label="文档分类">
                <select className="form-control" value={docForm.category} onChange={e => setDocForm({ ...docForm, category: e.target.value })}>
                  <option>接入文档</option>
                  <option>使用手册</option>
                  <option>测试用例</option>
                  <option>其他</option>
                </select>
              </Field>
              <Field label="关联阶段">
                <select className="form-control" value={docForm.related_stage ?? ''} onChange={e => setDocForm({ ...docForm, related_stage: e.target.value === '' ? null : parseInt(e.target.value) })}>
                  <option value="">无</option>
                  {stages.map(stage => <option key={stage.id} value={stage.stage_num}>阶段{stage.stage_num} · {stage.name}</option>)}
                </select>
              </Field>
              <Field label="文件链接" wide>
                <input className="form-control" placeholder="粘贴文件 URL，如 https://example.com/doc" value={docForm.file_url} onChange={e => setDocForm({ ...docForm, file_url: e.target.value })} />
              </Field>
            </div>
            <div className="mt-5 flex justify-end gap-2.5">
              <button onClick={() => setShowDocForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-[13px] text-slate-600 hover:bg-slate-50">取消</button>
              <button onClick={saveDocument} className="rounded-lg bg-primary-500 px-4 py-2 text-[13px] font-medium text-white hover:bg-primary-600">{editDocId ? '更新' : '保存'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, required, wide, children }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <label className="mb-1.5 block text-[12px] font-medium text-slate-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}
