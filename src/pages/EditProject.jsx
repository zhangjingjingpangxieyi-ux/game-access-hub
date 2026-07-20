import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { TeamNeedsCell } from '../components/TeamNeedsCell'
import PlayerFieldConfig, { PlayerFieldConfigTrigger, PlayerFieldConfigModal, buildDefaultConfig } from '../components/PlayerFieldConfig'
import { getAccessResponsibility } from '../lib/featureMeta'

const ENV_OPTIONS = ['正式版本', '版署版本', '先遣版本', '预演版本', '测试版本']
const PLAYER_INFO_FEATURE_NAME = '玩家信息管理'

// 仅「独立数据库」可见的功能
const DB_DEPENDENT_FEATURES = ['邮件-指定角色校验兼容', '问卷-指定角色校验兼容']

function isDbDependentFeature(featureName) {
  return DB_DEPENDENT_FEATURES.includes((featureName || '').replace(/\s+/g, ''))
}

const STAGE_DESC = {
  0: { num: '阶段 0', name: '超轻量接入包', time: '⏱ 0.5h', desc: '适合新项目首轮验证期。无需游戏侧介入，平台开通权限即可用。' },
  1: { num: '阶段 1', name: '基础接入包', time: '⏱ 3–7天', desc: '适合有数据基础的项目推广期或换皮项目。按文档开发，几乎无需定制。' },
  2: { num: '阶段 2', name: '升级接入包', time: '⏱ 7–14天', desc: '适合稳定运营期、战略级项目。小部分需配合定制。' },
  3: { num: '阶段 3', name: '深度开发包', time: '⏱ 7–14天', desc: '适合长期核心头部产品。纯定制，需深度协作联合评审。' },
}

const STAGE_BG = {
  0: 'bg-green-50 border-green-200',
  1: 'bg-blue-50 border-blue-200',
  2: 'bg-amber-50 border-amber-200',
  3: 'bg-purple-50 border-purple-200',
}

const STAGE_TAG = {
  0: 'bg-green-50 text-green-700',
  1: 'bg-blue-50 text-blue-700',
  2: 'bg-amber-50 text-amber-700',
  3: 'bg-purple-50 text-purple-700',
}

export default function EditProject() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    game_name: '', game_id: '', environments: [], region: '国内',
    business_type: '自研', db_type: '中心数据库',
    department: '', leader_name: '', leader_contact: '',
    launch_date: '', status: '接入中',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 功能相关状态
  const [stages, setStages] = useState([])
  const [allFeatures, setAllFeatures] = useState([])
  const [selectedStage, setSelectedStage] = useState(null)
  const [selectedFeatures, setSelectedFeatures] = useState(new Set())
  const [existingFeatureIds, setExistingFeatureIds] = useState(new Set())
  const [showFeaturePanel, setShowFeaturePanel] = useState(false)

  // 备注相关
  const [featureNotes, setFeatureNotes] = useState({})  // { featureId: '备注' }
  const [existingPfNotes, setExistingPfNotes] = useState({})  // { featureId: { pfId, notes } } 已有功能的备注
  const [featureConfigs, setFeatureConfigs] = useState({})  // { featureId: { player_info: { ... } } }
  const [existingPfConfigs, setExistingPfConfigs] = useState({})  // { featureId: { pfId, extra_config } } 已有功能的配置
  const [expandedNoteId, setExpandedNoteId] = useState(null)

  // 自定义功能
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customFeature, setCustomFeature] = useState({ name: '', description: '', access_method: '游戏接入' })
  const [customFeatures, setCustomFeatures] = useState([])
  const [showFieldConfigModal, setShowFieldConfigModal] = useState(false)

  useEffect(() => {
    fetchProject()
    fetchFeatureData()
  }, [id])

  async function fetchProject() {
    const { data, error } = await supabase.from('projects').select('*').eq('id', id).single()
    if (error || !data) { navigate('/'); return }
    setForm({
      game_name: data.game_name || '',
      game_id: data.game_id || '',
      environments: data.environments || [],
      region: data.region || '国内',
      business_type: data.business_type || '自研',
      db_type: data.db_type || '中心数据库',
      department: data.department || '',
      leader_name: data.leader_name || '',
      leader_contact: data.leader_contact || '',
      launch_date: data.launch_date || '',
      status: data.status || '接入中',
    })
    // 设置当前阶段
    if (data.stage_id) {
      const stageRecord = stages.find(s => s.id === data.stage_id)
      if (stageRecord) setSelectedStage(stageRecord.stage_num)
    }
    setLoading(false)
  }

  async function fetchFeatureData() {
    const { data: stageData } = await supabase.from('stages').select('*').order('sort_order')
    setStages(stageData || [])

    const { data: featureData } = await supabase.from('features').select('*').order('sort_order')
    setAllFeatures(featureData || [])

    // 获取项目已关联的功能（含备注 + extra_config）
    const { data: pf } = await supabase.from('project_features').select('feature_id, id, notes, extra_config').eq('project_id', id)
    const ids = new Set((pf || []).map(f => f.feature_id))
    setExistingFeatureIds(ids)
    setSelectedFeatures(new Set(ids))
    // 加载已有备注
    const notesMap = {}
    const notesPfMap = {}
    const configsMap = {}
    const configsPfMap = {}
    ;(pf || []).forEach(f => {
      const featureDef = (featureData || []).find(item => item.id === f.feature_id)
      if (f.notes) notesMap[f.feature_id] = f.notes
      notesPfMap[f.feature_id] = { pfId: f.id, notes: f.notes }
      if (f.extra_config) configsMap[f.feature_id] = f.extra_config
      else if (featureDef?.name === PLAYER_INFO_FEATURE_NAME) configsMap[f.feature_id] = { player_info: buildDefaultConfig(null) }
      configsPfMap[f.feature_id] = { pfId: f.id, extra_config: f.extra_config }
    })
    setFeatureNotes(notesMap)
    setExistingPfNotes(notesPfMap)
    setFeatureConfigs(configsMap)
    setExistingPfConfigs(configsPfMap)
  }

  function toggleEnvironment(env) {
    const next = form.environments.includes(env)
      ? form.environments.filter(e => e !== env)
      : [...form.environments, env]
    setForm({ ...form, environments: next })
  }

  // 获取某阶段及其之前所有阶段的功能
  function getFeaturesForStage(stageNum) {
    if (stageNum === null) return []
    const targetStages = stages.filter(s => s.stage_num <= stageNum)
    const stageIds = targetStages.map(s => s.id)
    return allFeatures.filter(f => stageIds.includes(f.stage_id))
  }

  // 按阶段分组
  function getFeaturesGrouped() {
    if (selectedStage === null) return []
    const targetStages = stages.filter(s => s.stage_num <= selectedStage)
    return targetStages.map(stage => ({
      stage,
      features: allFeatures.filter(f => f.stage_id === stage.id)
    }))
  }

  function handleStageSelect(stageNum) {
    setSelectedStage(stageNum)
    // 新增的功能中，默认只选中「必须使用」的
    const features = getFeaturesForStage(stageNum)
    const mustFeatures = features.filter(f => f.recommendation === '必须使用')
    setSelectedFeatures(new Set([...existingFeatureIds, ...mustFeatures.map(f => f.id)]))
    const playerInfo = mustFeatures.find(f => f.name === PLAYER_INFO_FEATURE_NAME)
    if (playerInfo) {
      setFeatureConfigs(prev => prev[playerInfo.id] ? prev : ({ ...prev, [playerInfo.id]: { player_info: buildDefaultConfig(null) } }))
    }
  }

  function toggleFeature(featureId) {
    const next = new Set(selectedFeatures)

    const feature = allFeatures.find(f => f.id === featureId) || customFeatures.find(f => f.id === featureId)
    if (!feature) return

    // 自定义功能不限制取消
    if (!customFeatures.find(f => f.id === featureId)) {
      // 必须使用且在选中阶段范围内的功能不允许取消
      if (selectedStage !== null) {
        const targetStages = stages.filter(s => s.stage_num <= selectedStage)
        const isIncludedStage = targetStages.some(s => s.id === feature.stage_id)
        if (isIncludedStage && feature.recommendation === '必须使用') return
      }
    }

    if (next.has(featureId)) {
      next.delete(featureId)
      setFeatureNotes(prev => { const n = { ...prev }; delete n[featureId]; return n })
      setFeatureConfigs(prev => { const n = { ...prev }; delete n[featureId]; return n })
      if (expandedNoteId === featureId) setExpandedNoteId(null)
    } else {
      next.add(featureId)
      setExpandedNoteId(featureId)
      // 勾选玩家信息管理时自动弹出配置弹窗
      if (feature.name === PLAYER_INFO_FEATURE_NAME) {
        setFeatureConfigs(prev => prev[featureId] ? prev : ({ ...prev, [featureId]: { player_info: buildDefaultConfig(null) } }))
        // 延迟一帧确保状态已更新
        setTimeout(() => setShowFieldConfigModal(true), 0)
      }
    }
    setSelectedFeatures(next)
  }

  function getFeatureById(featureId) {
    return allFeatures.find(f => f.id === featureId) || customFeatures.find(f => f.id === featureId)
  }

  function getPlayerInfoFeatureId() {
    return Array.from(selectedFeatures).find(fid => getFeatureById(fid)?.name === PLAYER_INFO_FEATURE_NAME)
  }

  function openPlayerFieldConfig(featureId) {
    setFeatureConfigs(prev => prev[featureId] ? prev : ({ ...prev, [featureId]: { player_info: buildDefaultConfig(null) } }))
    setShowFieldConfigModal(true)
  }

  function updateNote(featureId, note) {
    setFeatureNotes(prev => ({ ...prev, [featureId]: note }))
  }

  // 自定义功能
  function addCustomFeature() {
    if (!customFeature.name.trim()) { alert('请输入功能名称'); return }
    const id = `custom-${Date.now()}`
    const newFeature = {
      id,
      name: customFeature.name.trim(),
      description: customFeature.description.trim() || '自定义功能',
      access_method: customFeature.access_method,
      feature_type: '非通用',
      recommendation: '推荐使用',
      is_custom: true,
    }
    setCustomFeatures(prev => [...prev, newFeature])
    setSelectedFeatures(prev => new Set([...prev, id]))
    setCustomFeature({ name: '', description: '', access_method: '游戏接入' })
    setShowCustomForm(false)
  }

  function removeCustomFeature(featureId) {
    setCustomFeatures(prev => prev.filter(f => f.id !== featureId))
    setSelectedFeatures(prev => { const n = new Set(prev); n.delete(featureId); return n })
    setFeatureNotes(prev => { const n = { ...prev }; delete n[featureId]; return n })
  }

  // 计算新增的功能
  function getNewFeatureIds() {
    return Array.from(selectedFeatures).filter(fid => !existingFeatureIds.has(fid))
  }

  // 计算被取消的功能
  function getRemovedFeatureIds() {
    return Array.from(existingFeatureIds).filter(fid => !selectedFeatures.has(fid))
  }

  async function handleSave() {
    if (!form.game_name || !form.game_id || form.environments.length === 0) {
      alert('请填写必填项（游戏名称、游戏ID、接入环境）')
      return
    }
    setSaving(true)

    try {
      // 1. 更新项目基本信息
      const updatePayload = {
        game_name: form.game_name,
        game_id: form.game_id,
        environments: form.environments,
        region: form.region,
        business_type: form.business_type,
        db_type: form.db_type,
        department: form.department,
        leader_name: form.leader_name,
        leader_contact: form.leader_contact,
        launch_date: form.launch_date || null,
        status: form.status,
        updated_at: new Date().toISOString(),
      }

      // 如果阶段变更了，更新 stage_id
      if (selectedStage !== null) {
        const stageRecord = stages.find(s => s.stage_num === selectedStage)
        if (stageRecord) updatePayload.stage_id = stageRecord.id
      }

      const { error: updateError } = await supabase
        .from('projects')
        .update(updatePayload)
        .eq('id', id)
      if (updateError) throw updateError

      // 2. 保存自定义功能到 features 表，拿到真实 ID
      const customIdMap = {}
      const defaultStageId = stages[0]?.id
      for (const cf of customFeatures) {
        if (!selectedFeatures.has(cf.id)) continue
        const stageRecord = stages.find(s => s.stage_num === selectedStage)
        const featureStageId = stageRecord ? stageRecord.id : defaultStageId
        if (!featureStageId) throw new Error('阶段数据未加载，无法保存自定义功能，请刷新页面重试')
        const { data, error } = await supabase.from('features').insert({
          name: cf.name,
          description: cf.description,
          stage_id: featureStageId,
          recommendation: '推荐使用',
          feature_type: '非通用',
          access_method: cf.access_method,
          is_active: true,
          sort_order: 999,
        }).select().single()
        if (error) throw new Error(`自定义功能「${cf.name}」保存失败：${error.message}`)
        customIdMap[cf.id] = data.id
      }

      // 3. 添加新选的功能（含备注）
      const newFeatureIds = getNewFeatureIds()
      if (newFeatureIds.length > 0) {
        const projectFeatures = newFeatureIds.map(featureId => {
          const realFeatureId = customIdMap[featureId] || featureId
          return {
            project_id: id,
            feature_id: realFeatureId,
            batch: 1,
            status: '待开发',
            notes: featureNotes[featureId] || null,
            extra_config: featureConfigs[featureId] && Object.keys(featureConfigs[featureId]).length > 0 ? featureConfigs[featureId] : null,
          }
        })
        const { error: pfError } = await supabase
          .from('project_features')
          .insert(projectFeatures)
        if (pfError) throw pfError
      }

      // 3.5 更新已有功能的备注和 extra_config（如果有修改）
      const { data: existingPfData } = await supabase
        .from('project_features')
        .select('feature_id, id, notes, extra_config')
        .eq('project_id', id)
      if (existingPfData) {
        for (const pf of existingPfData) {
          const newNote = featureNotes[pf.feature_id]
          const newConfig = featureConfigs[pf.feature_id]
          const updates = {}
          if (newNote !== undefined && newNote !== pf.notes) updates.notes = newNote
          if (newConfig !== undefined) {
            const configChanged = JSON.stringify(newConfig) !== JSON.stringify(pf.extra_config)
            if (configChanged) updates.extra_config = Object.keys(newConfig).length > 0 ? newConfig : null
          }
          if (Object.keys(updates).length > 0) {
            await supabase.from('project_features').update(updates).eq('id', pf.id)
          }
        }
      }

      // 4. 删除取消的功能
      const removedFeatureIds = getRemovedFeatureIds()
      if (removedFeatureIds.length > 0) {
        // 需要将临时 custom id 映射为真实 feature id
        const realRemovedIds = removedFeatureIds.map(fid => customIdMap[fid] || fid)
        const confirmMsg = `确定取消 ${removedFeatureIds.length} 个功能的接入吗？\n取消后相关的开发/测试进度数据也会被清除。`
        if (!window.confirm(confirmMsg)) {
          setSaving(false)
          return
        }
        // 逐个删除，确保每个都成功
        const failedDeletions = []
        for (const fid of realRemovedIds) {
          const { error: delError } = await supabase
            .from('project_features')
            .delete()
            .eq('project_id', id)
            .eq('feature_id', fid)
          if (delError) {
            console.error(`删除功能 ${fid} 失败:`, delError)
            failedDeletions.push({ fid, error: delError })
          }
        }
        // 删除后校验：重新查询确认是否还有残留
        const { data: remaining } = await supabase
          .from('project_features')
          .select('feature_id')
          .eq('project_id', id)
          .in('feature_id', realRemovedIds)
        if (remaining && remaining.length > 0) {
          const remainingIds = remaining.map(r => r.feature_id).join(', ')
          throw new Error(`以下功能取消失败（数据库未删除）：${remainingIds}。请刷新页面重试，若仍失败请联系管理员检查数据库权限。`)
        }
        if (failedDeletions.length > 0) {
          throw new Error(`${failedDeletions.length} 个功能删除时遇到错误，请检查控制台日志。`)
        }
      }

      // 5. 更新项目功能总数
      const { error: countError } = await supabase
        .from('projects')
        .update({ total_features: selectedFeatures.size })
        .eq('id', id)
      if (countError) throw countError

      navigate(`/project/${id}`)
    } catch (err) {
      console.error('Save error:', err)
      alert('保存失败：' + err.message)
    }
    setSaving(false)
  }

  if (loading) return <div className="p-7 text-slate-400">加载中…</div>

  return (
    <div className="page-shell">
      <div className="text-[12px] text-slate-400 mb-4 flex items-center gap-1.5">
        <span onClick={() => navigate('/')} className="text-primary-500 cursor-pointer hover:underline">项目管理</span>
        <span>›</span>
        <span onClick={() => navigate(`/project/${id}`)} className="text-primary-500 cursor-pointer hover:underline truncate max-w-[100px]">{form.game_name}</span>
        <span>›</span>
        <span>编辑项目</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">编辑项目信息</h1>
          <p className="page-subtitle">修改项目基本信息和接入配置</p>
        </div>
      </div>

      {/* 基本信息 */}
      <div className="surface-card p-4 md:p-6 mb-5">
        <h2 className="text-[15px] font-bold text-slate-950 mb-5">📋 基本信息</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[12px] text-slate-500 mb-1.5 font-medium">游戏名称 <span className="text-red-500">*</span></label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" value={form.game_name} onChange={e => setForm({...form, game_name: e.target.value})} />
          </div>
          <div>
            <label className="block text-[12px] text-slate-500 mb-1.5 font-medium">游戏ID <span className="text-red-500">*</span></label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" value={form.game_id} onChange={e => setForm({...form, game_id: e.target.value})} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="text-[12px] text-slate-500 font-medium">接入环境 <span className="text-red-500">*</span></label>
              <a
                href="https://q1doc.yuque.com/staff-nseb80/it/uhn8e7zsm8gucdxf?singleDoc#"
                target="_blank"
                rel="noopener noreferrer"
                title="查看接入环境说明文档"
                className="w-4 h-4 rounded-full bg-gray-200 text-slate-500 hover:bg-primary-100 hover:text-primary-600 flex items-center justify-center text-[10px] font-bold transition-colors leading-none"
              >?</a>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {ENV_OPTIONS.map(env => (
                <label key={env} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] cursor-pointer transition-all ${
                  form.environments.includes(env) ? 'border-primary-500 bg-primary-50 text-primary-600 font-medium' : 'border-gray-300 text-slate-500 hover:border-primary-300'
                }`}>
                  <input type="checkbox" checked={form.environments.includes(env)} onChange={() => toggleEnvironment(env)} className="sr-only" />
                  {form.environments.includes(env) ? '✓' : ''} {env}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[12px] text-slate-500 mb-1.5 font-medium">发行地区</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500" value={form.region} onChange={e => setForm({...form, region: e.target.value})}>
              <option>国内</option><option>海外</option><option>港澳台</option><option>国内 · 海外</option>
            </select>
          </div>
          <div>
            <label className="block text-[12px] text-slate-500 mb-1.5 font-medium">业务类型</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500" value={form.business_type} onChange={e => setForm({...form, business_type: e.target.value})}>
              <option>自研</option><option>代理</option>
            </select>
          </div>
          <div>
            <label className="block text-[12px] text-slate-500 mb-1.5 font-medium">数据库类型</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500" value={form.db_type} onChange={e => setForm({...form, db_type: e.target.value})}>
              <option>独立数据库</option><option>中心数据库</option>
            </select>
          </div>
          <div>
            <label className="block text-[12px] text-slate-500 mb-1.5 font-medium">所属事业部</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500" value={form.department} onChange={e => setForm({...form, department: e.target.value})} />
          </div>
          <div>
            <label className="block text-[12px] text-slate-500 mb-1.5 font-medium">项目负责人</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500" value={form.leader_name} onChange={e => setForm({...form, leader_name: e.target.value})} />
          </div>
          <div>
            <label className="block text-[12px] text-slate-500 mb-1.5 font-medium">计划对外日期</label>
            <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500" value={form.launch_date} onChange={e => setForm({...form, launch_date: e.target.value})} />
          </div>
          <div>
            <label className="block text-[12px] text-slate-500 mb-1.5 font-medium">项目状态</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option>接入中</option><option>已完成</option><option>暂停</option>
            </select>
          </div>
        </div>
      </div>

      {/* 功能管理 */}
      <div className="surface-card mb-5 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-[15px] font-bold text-slate-950">🔧 功能管理</h2>
            <p className="text-[12px] text-slate-400 mt-1">
              已关联 <span className="font-bold text-primary-500">{selectedFeatures.size}</span> 个功能
              {getNewFeatureIds().length > 0 && <span className="text-green-500 ml-2">+ 新增 {getNewFeatureIds().length} 个</span>}
              {getRemovedFeatureIds().length > 0 && <span className="text-red-500 ml-2">- 取消 {getRemovedFeatureIds().length} 个</span>}
            </p>
          </div>
          <button
            onClick={() => setShowFeaturePanel(!showFeaturePanel)}
            className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-[12px] hover:bg-primary-600"
          >
            {showFeaturePanel ? '收起' : '＋ 添加功能'}
          </button>
        </div>

        {/* 已有功能列表（含备注编辑） */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-[1fr_80px_100px_80px_100px_80px] px-4 py-2.5 bg-slate-50 text-[11px] text-slate-400 font-semibold border-b border-slate-200 rounded-t-lg">
            <span>功能名称</span><span>接入方式</span><span>权责方</span><span>工期</span><span>状态</span><span>操作</span>
          </div>
          {[...allFeatures, ...customFeatures].filter(f => selectedFeatures.has(f.id)).map(f => {
            const isCustom = f.is_custom
            const isExisting = existingFeatureIds.has(f.id) || isCustom
            const note = featureNotes[f.id]
            const isNoteExpanded = expandedNoteId === f.id
            return (
              <div key={f.id}>
                <div className="grid grid-cols-[1fr_80px_100px_80px_100px_80px] px-4 py-2.5 border-b border-slate-100 text-[13px] items-center hover:bg-slate-50">
                  <div className="font-semibold flex items-center gap-1.5">
                    {f.name}
                    {isCustom && <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-600 font-medium">自定义</span>}
                    {f.name === PLAYER_INFO_FEATURE_NAME && (
                      <PlayerFieldConfigTrigger
                        config={featureConfigs[f.id]?.player_info || null}
                        onClick={() => openPlayerFieldConfig(f.id)}
                      />
                    )}
                    {note && !isNoteExpanded && <span className="text-[11px] text-primary-500 truncate max-w-[200px]">💬 {note}</span>}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    f.access_method === '开通权限' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                  }`}>{f.access_method}</span>
                  <span className="text-[12px] text-slate-500">
                    {getAccessResponsibility(f.access_method)}
                  </span>
                  <span className="text-[12px] text-slate-400">{f.estimated_duration || '-'}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    existingFeatureIds.has(f.id) && !isCustom ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                  }`}>{existingFeatureIds.has(f.id) && !isCustom ? '已关联' : '待新增'}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedNoteId(isNoteExpanded ? null : f.id)}
                      className="text-[11px] text-primary-500 hover:text-primary-700"
                    >✏️</button>
                    <span
                      onClick={() => isCustom ? removeCustomFeature(f.id) : toggleFeature(f.id)}
                      className="text-[12px] text-red-500 cursor-pointer hover:underline hover:text-red-700"
                    >取消</span>
                  </div>
                </div>
                {isNoteExpanded && (
                  <div className="px-4 py-2.5 bg-primary-50/30 border-b border-slate-100">
                    <div className="text-[11px] text-slate-400 mb-1">💬 对「{f.name}」的备注</div>
                    <textarea
                      value={note || ''}
                      onChange={e => updateNote(f.id, e.target.value)}
                      placeholder="输入特殊要求或备注…"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-primary-400 resize-none bg-white"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            )
          })}
          {selectedFeatures.size === 0 && (
            <div className="text-center py-8 text-slate-400 text-[13px]">暂无关联功能，点击「添加功能」开始选择</div>
          )}
        </div>

        {/* 功能选择面板 */}
        {showFeaturePanel && (
          <div className="border-t border-slate-200 px-6 py-4 bg-slate-50/50">
            {/* 阶段选择 */}
            <div className="mb-4">
              <h3 className="text-[13px] font-bold text-slate-700 mb-3">选择接入阶段（新增功能的范围）</h3>
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(STAGE_DESC).map(([num, info]) => (
                  <div
                    key={num}
                    onClick={() => handleStageSelect(parseInt(num))}
                    className={`border-2 rounded-lg p-3 cursor-pointer transition-all relative ${
                      selectedStage === parseInt(num)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-slate-200 hover:border-blue-200 hover:bg-blue-50/30'
                    }`}
                  >
                    {selectedStage === parseInt(num) && (
                      <div className="absolute top-2 right-2 w-[16px] h-[16px] rounded-full bg-primary-500 flex items-center justify-center text-white text-[10px]">✓</div>
                    )}
                    <div className="text-[11px] font-bold text-slate-400 mb-0.5">{info.num}</div>
                    <div className="text-[13px] font-bold mb-1">{info.name}</div>
                    <div className="text-[11px] text-green-600 font-semibold">{info.time}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 功能列表 */}
            {selectedStage !== null && getFeaturesGrouped().map(({ stage, features }) => {
              const isIncludedStage = stage.stage_num <= selectedStage
              return (
                <div key={stage.id} className="mb-3">
                  <div className="text-[12px] font-bold mb-1.5 flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded ${STAGE_TAG[stage.stage_num]}`}>
                      阶段{stage.stage_num} · {stage.name}
                    </span>
                    {!isIncludedStage && <span className="text-slate-400 font-normal text-[11px]">（跨阶段可选）</span>}
                  </div>
                  <div className={`rounded-lg border overflow-hidden ${STAGE_BG[stage.stage_num]}`}>
                    <div className="grid grid-cols-[28px_1fr_80px_100px_80px_90px_90px_80px_160px] items-center gap-3 px-4 py-2 bg-black/[0.03] text-[11px] text-slate-400 font-semibold border-b border-slate-200">
                      <span></span><span>功能名称</span><span>所属模块</span><span>推荐等级</span><span>功能类型</span><span>接入方式</span><span>权责方</span><span>工期</span><span>物料</span>
                    </div>
                    {features.filter(f => !(isDbDependentFeature(f.name) && form.db_type !== '独立数据库')).map(feature => {
                      const isMust = feature.recommendation === '必须使用' && isIncludedStage
                      const isSelected = selectedFeatures.has(feature.id)
                      const isExisting = existingFeatureIds.has(feature.id)
                      return (
                        <div key={feature.id} className={`grid grid-cols-[28px_1fr_80px_100px_80px_90px_90px_80px_160px] items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0 text-[13px] hover:bg-white/60`}>
                          <div
                            onClick={() => !isMust && toggleFeature(feature.id)}
                            className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                              isMust ? 'bg-green-500 border-green-500 cursor-not-allowed' :
                              isSelected ? 'bg-primary-500 border-primary-500 cursor-pointer' :
                              'border-2 border-gray-300 cursor-pointer hover:border-primary-300'
                            }`}
                          >
                            {(isMust || isSelected) && <span className="text-white text-[10px]">✓</span>}
                          </div>
                          <div>
                            <div className="font-semibold">{feature.name}</div>
                            <div className="text-[11px] text-slate-400">{feature.description}</div>
                          </div>
                          <span className="text-[12px] text-slate-500 truncate">{feature.module_name || '-'}</span>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            feature.recommendation === '必须使用' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                          }`}>{feature.recommendation}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            feature.feature_type === '通用' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                          }`}>{feature.feature_type}</span>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            feature.access_method === '开通权限' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                          }`}>{feature.access_method}</span>
                          <span className="text-[12px] font-medium text-slate-600">
                            {getAccessResponsibility(feature.access_method)}
                          </span>
                          <span className={`text-[12px] ${feature.access_method === '开通权限' ? 'text-green-600' : 'text-blue-600'}`}>{feature.estimated_duration}</span>
                          <TeamNeedsCell text={feature.team_needs} />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {selectedStage !== null && (
              <div className="mt-3 text-[13px] text-slate-500">
                已选 <span className="font-bold text-primary-500">{selectedFeatures.size}</span> 个功能（含 {existingFeatureIds.size} 个已关联 + {getNewFeatureIds().length} 个新增{getRemovedFeatureIds().length > 0 ? ` - ${getRemovedFeatureIds().length} 个取消` : ''}）
              </div>
            )}

            {/* 自定义功能入口 */}
            <div
              onClick={() => setShowCustomForm(true)}
              className="border border-dashed border-indigo-300 rounded-lg p-3 flex items-center gap-2.5 cursor-pointer text-indigo-500 text-[13px] hover:bg-indigo-50 mt-3"
            >
              ✨ 添加自定义功能（功能库中不存在的新功能）
            </div>

            {/* 自定义功能表单 */}
            {showCustomForm && (
              <div className="mt-3 bg-indigo-50/50 border border-indigo-200 rounded-lg p-4">
                <div className="text-[13px] font-bold text-indigo-700 mb-3">✨ 添加自定义功能</div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[12px] text-slate-500 mb-1">功能名称 <span className="text-red-500">*</span></label>
                    <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-indigo-400 bg-white" placeholder="如：数据分析面板" value={customFeature.name} onChange={e => setCustomFeature({ ...customFeature, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[12px] text-slate-500 mb-1">功能说明</label>
                    <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-indigo-400 bg-white" placeholder="简要描述功能用途" value={customFeature.description} onChange={e => setCustomFeature({ ...customFeature, description: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[12px] text-slate-500 mb-1">接入方式</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-indigo-400 bg-white" value={customFeature.access_method} onChange={e => setCustomFeature({ ...customFeature, access_method: e.target.value })}>
                      <option>游戏接入</option><option>平台开发</option><option>开通权限</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={addCustomFeature} className="px-4 py-1.5 bg-indigo-500 text-white rounded-lg text-[12px] font-medium hover:bg-indigo-600">添加到功能列表</button>
                  <button onClick={() => { setShowCustomForm(false); setCustomFeature({ name: '', description: '', access_method: '游戏接入' }) }} className="px-4 py-1.5 border border-gray-300 rounded-lg text-[12px] text-slate-600 hover:bg-slate-50">取消</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-end mt-6">
        <button onClick={() => navigate(`/project/${id}`)} className="px-4 py-2 border border-gray-300 rounded-lg text-[13px] text-slate-600 hover:bg-slate-50">
          取消
        </button>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary-500 text-white rounded-lg text-[13px] font-medium hover:bg-primary-600 disabled:opacity-50">
          {saving ? '保存中…' : '保存修改'}
        </button>
      </div>

      {/* 玩家信息字段配置弹窗 */}
      <PlayerFieldConfigModal
        open={showFieldConfigModal}
        onClose={() => setShowFieldConfigModal(false)}
        config={(() => {
          const pfId = getPlayerInfoFeatureId()
          return featureConfigs[pfId]?.player_info || null
        })()}
        onSave={cfg => {
          const pfId = getPlayerInfoFeatureId()
          if (pfId) {
            setFeatureConfigs(prev => ({ ...prev, [pfId]: { ...prev[pfId], player_info: cfg } }))
          }
        }}
      />
    </div>
  )
}
