import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { TeamNeedsCell } from '../components/TeamNeedsCell'
import PlayerFieldConfig, { PlayerFieldConfigTrigger, PlayerFieldConfigModal, buildDefaultConfig } from '../components/PlayerFieldConfig'
import { getAccessMethodTone, getAccessResponsibility } from '../lib/featureMeta'

// 玩家信息管理功能的标识名称
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

// 步骤配置
const STEPS = [
  { num: 1, label: '填写基本信息' },
  { num: 2, label: '选择阶段与功能' },
  { num: 3, label: '确认创建内容' },
]

export default function NewProject() {
  const navigate = useNavigate()
  const [stages, setStages] = useState([])
  const [allFeatures, setAllFeatures] = useState([])
  const [selectedStage, setSelectedStage] = useState(null)
  const [selectedFeatures, setSelectedFeatures] = useState(new Set())
  const [featureNotes, setFeatureNotes] = useState({})
  const [featureConfigs, setFeatureConfigs] = useState({})
  const [expandedNoteId, setExpandedNoteId] = useState(null)
  const [step, setStep] = useState(1)
  const ENV_OPTIONS = ['正式版本', '版署版本', '先遣版本', '预演版本', '测试版本']

  // 自定义功能
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customFeature, setCustomFeature] = useState({ name: '', description: '', access_method: '游戏接入' })
  const [customFeatures, setCustomFeatures] = useState([])
  const [showFieldConfigModal, setShowFieldConfigModal] = useState(false)

  // 阶段切换保护弹窗
  const [stageSwitchDialog, setStageSwitchDialog] = useState(null) // { from, to }

  // 创建成功态
  const [createdSuccess, setCreatedSuccess] = useState(null) // { projectName, featureCount, stepCount, projectId }

  const [form, setForm] = useState({
    game_name: '', game_id: '', environments: [], region: '国内', business_type: '自研', db_type: '中心数据库',
    department: '', leader_name: '', leader_contact: '',
    launch_date: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [stageResult, featureResult] = await Promise.all([
      supabase.from('stages').select('*').order('sort_order'),
      supabase.from('features').select('*').eq('is_active', true).order('sort_order'),
    ])
    setStages(stageResult.data || [])
    setAllFeatures(featureResult.data || [])
  }

  // 获取某阶段及其之前所有阶段的功能
  function getFeaturesForStage(stageNum) {
    if (stageNum === null) return []
    const targetStages = stages.filter(s => s.stage_num <= stageNum)
    const stageIds = targetStages.map(s => s.id)
    return allFeatures.filter(f => stageIds.includes(f.stage_id))
  }

  // 按阶段分组（包含自定义功能）
  function getFeaturesGrouped() {
    if (selectedStage === null) return []
    const targetStages = stages.filter(s => s.stage_num <= selectedStage)
    const groups = targetStages.map(stage => ({
      stage,
      features: allFeatures.filter(f => f.stage_id === stage.id)
    }))
    if (customFeatures.length > 0) {
      groups.push({
        stage: { id: 'custom', stage_num: -1, name: '自定义功能' },
        features: customFeatures
      })
    }
    return groups
  }

  // 通过 ID 获取功能对象（含自定义）
  function getFeatureById(fid) {
    return allFeatures.find(f => f.id === fid) || customFeatures.find(f => f.id === fid)
  }

  // 计算摘要数据
  function getSummary() {
    let totalDuration = ''
    let needsMaterialCount = 0
    const durations = []

    Array.from(selectedFeatures).forEach(fid => {
      const f = getFeatureById(fid)
      if (f?.estimated_duration) durations.push(f.estimated_duration)
      if (f?.team_needs) needsMaterialCount++
    })

    if (durations.length > 0) {
      // 简单拼接显示
      totalDuration = durations.join(' + ')
    }

    return {
      stageName: STAGE_DESC[selectedStage]?.name,
      selectedCount: selectedFeatures.size,
      totalDuration,
      needsMaterialCount,
    }
  }

  // 阶段选择（带切换保护）
  function handleStageSelect(stageNum) {
    // 首次选择：直接选，自动勾选必须功能
    if (selectedStage === null) {
      setSelectedStage(stageNum)
      const features = getFeaturesForStage(stageNum)
      const mustFeatures = features.filter(f => f.recommendation === '必须使用')
      setSelectedFeatures(new Set(mustFeatures.map(f => f.id)))
      const playerInfo = mustFeatures.find(f => f.name === PLAYER_INFO_FEATURE_NAME)
      if (playerInfo) {
        setFeatureConfigs(prev => prev[playerInfo.id] ? prev : ({ ...prev, [playerInfo.id]: { player_info: buildDefaultConfig(null) } }))
      }
      return
    }
    // 同一阶段不处理
    if (stageNum === selectedStage) return

    // 切换阶段：弹出保护对话框
    setStageSwitchDialog({ from: selectedStage, to: stageNum })
  }

  // 确认切换阶段
  function confirmStageSwitch(keepSelection) {
    const targetStage = stageSwitchDialog.to
    setSelectedStage(targetStage)

    if (!keepSelection) {
      // 重置：清空后按新阶段默认勾选
      setSelectedFeatures(new Set())
      setFeatureNotes({})
      setFeatureConfigs({})
      setExpandedNoteId(null)
      const features = getFeaturesForStage(targetStage)
      const mustFeatures = features.filter(f => f.recommendation === '必须使用')
      setSelectedFeatures(new Set(mustFeatures.map(f => f.id)))
      const playerInfo = mustFeatures.find(f => f.name === PLAYER_INFO_FEATURE_NAME)
      if (playerInfo) {
        setFeatureConfigs(prev => ({ ...prev, [playerInfo.id]: { player_info: buildDefaultConfig(null) } }))
      }
    }
    // keepSelection=true 时只更新 selectedStage，不清空已选

    setStageSwitchDialog(null)
  }

  function toggleFeature(featureId) {
    const next = new Set(selectedFeatures)
    const feature = allFeatures.find(f => f.id === featureId) || customFeatures.find(f => f.id === featureId)
    if (!feature) return

    if (!customFeatures.find(f => f.id === featureId)) {
      const targetStages = stages.filter(s => s.stage_num <= selectedStage)
      const isIncludedStage = targetStages.some(s => s.id === feature.stage_id)
      if (isIncludedStage && feature.recommendation === '必须使用') return
    }

    if (next.has(featureId)) {
      next.delete(featureId)
      setFeatureNotes(prev => { const n = { ...prev }; delete n[featureId]; return n })
      setFeatureConfigs(prev => { const n = { ...prev }; delete n[featureId]; return n })
      if (expandedNoteId === featureId) setExpandedNoteId(null)
    } else {
      next.add(featureId)
      setExpandedNoteId(featureId)
      if (feature.name === PLAYER_INFO_FEATURE_NAME) {
        setFeatureConfigs(prev => prev[featureId] ? prev : ({ ...prev, [featureId]: { player_info: buildDefaultConfig(null) } }))
        setTimeout(() => setShowFieldConfigModal(true), 0)
      }
    }
    setSelectedFeatures(next)
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

  function removeCustomFeature(id) {
    setCustomFeatures(prev => prev.filter(f => f.id !== id))
    setSelectedFeatures(prev => { const n = new Set(prev); n.delete(id); return n })
    setFeatureNotes(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  function toggleEnvironment(env) {
    const next = form.environments.includes(env)
      ? form.environments.filter(e => e !== env)
      : [...form.environments, env]
    setForm({ ...form, environments: next })
  }

  // Step 1 → Step 2 验证
  function goToStep2() {
    if (!form.game_name || !form.game_id || form.environments.length === 0) {
      alert('请先填写必填项：游戏名称、游戏ID、接入环境')
      return
    }
    setStep(2)
  }

  async function handleSave() {
    if (!form.game_name || !form.game_id || form.environments.length === 0 || selectedStage === null) {
      alert('请填写必填项（游戏名称、游戏ID、接入环境）并选择接入阶段')
      return
    }
    setSaving(true)

    try {
      const stageRecord = stages.find(s => s.stage_num === selectedStage)
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
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
          stage_id: stageRecord.id,
          status: '接入中',
          total_features: selectedFeatures.size,
        })
        .select()
        .single()

      if (projectError) throw projectError

      // 保存自定义功能到 features 表
      const customIdMap = {}
      for (const cf of customFeatures) {
        if (!selectedFeatures.has(cf.id)) continue
        const { data, error } = await supabase.from('features').insert({
          name: cf.name,
          description: cf.description,
          stage_id: stageRecord.id,
          recommendation: '推荐使用',
          feature_type: '非通用',
          access_method: cf.access_method,
          is_active: true,
          sort_order: 999,
        }).select().single()
        if (error) console.warn('自定义功能保存失败:', cf.name, error)
        else customIdMap[cf.id] = data.id
      }

      // 批量插入项目功能关联
      const projectFeatures = Array.from(selectedFeatures).map(featureId => {
        const realFeatureId = customIdMap[featureId] || featureId
        const fc = featureConfigs[featureId]
        return {
          project_id: project.id,
          feature_id: realFeatureId,
          batch: 1,
          status: '待开发',
          notes: featureNotes[featureId] || null,
          extra_config: fc && Object.keys(fc).length > 0 ? fc : null,
        }
      })

      if (projectFeatures.length > 0) {
        const { error: pfError } = await supabase.from('project_features').insert(projectFeatures)
        if (pfError) throw pfError
      }

      // 初始化接入流程步骤
      const { data: allSteps, error: stepsError } = await supabase.from('access_steps').select('id').eq('is_active', true).order('sort_order')
      if (stepsError) throw stepsError
      let stepCount = 0
      if (allSteps && allSteps.length > 0) {
        const { error: stepInsertError } = await supabase.from('project_global_steps').insert(
          allSteps.map(s => ({ project_id: project.id, step_id: s.id, is_completed: false }))
        )
        if (stepInsertError) throw stepInsertError
        stepCount = allSteps.length
      }

      // 插入时间线
      await supabase.from('project_timeline').insert({
        project_id: project.id,
        event: '项目建档完成，进入功能选择',
      })
      const customCount = customFeatures.filter(cf => selectedFeatures.has(cf.id)).length
      await supabase.from('project_timeline').insert({
        project_id: project.id,
        event: `完成功能勾选，共${selectedFeatures.size}个功能${customCount > 0 ? `（含${customCount}个自定义）` : ''}，第一轮启动`,
      })

      // 成功态：不跳转，展示成功反馈
      setCreatedSuccess({
        projectName: form.game_name,
        featureCount: selectedFeatures.size,
        stepCount,
        projectId: project.id,
        stepsData: allSteps || [],
      })
      setStep(4) // 进入成功态步骤
    } catch (err) {
      console.error('Save error:', err)
      alert('保存失败：' + err.message)
    }
    setSaving(false)
  }

  // ============================================
  // 渲染
  // ============================================

  // 创建成功态
  if (createdSuccess) {
    return (
      <div className="page-shell">
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="page-title mb-3">项目创建成功！</h1>
          <p className="text-slate-500 mb-2">
            「{createdSuccess.projectName}」已创建
          </p>
          <p className="text-sm text-slate-400 mb-8">
            已生成 <span className="font-semibold text-primary-500">{createdSuccess.featureCount}</span> 个功能任务和{' '}
            <span className="font-semibold text-primary-500">{createdSuccess.stepCount}</span> 个接入节点。
          </p>
          <button
            onClick={() => navigate(`/project/${createdSuccess.projectId}`)}
            className="px-6 py-2.5 bg-primary-500 text-white rounded-lg text-[14px] font-medium hover:bg-primary-600"
          >
            查看项目详情 →
          </button>
        </div>
      </div>
    )
  }

  const summary = getSummary()

  return (
    <div className="page-shell">
      {/* 面包屑 */}
      <div className="text-[12px] text-slate-400 mb-4 flex items-center gap-1.5">
        <span onClick={() => navigate('/')} className="text-primary-500 cursor-pointer hover:underline">项目管理</span>
        <span>›</span>
        <span>新建项目</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">新建游戏接入项目</h1>
          <p className="page-subtitle">分三步完成项目建档，系统将为你推荐功能清单</p>
        </div>
      </div>

      {/* 步骤条 — 3 步 */}
      <div className="flex items-center gap-0 mb-7">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className={`flex items-center gap-2.5 px-4 py-2.5 text-[13px] ${
              step >= s.num ? (step === s.num ? 'text-primary-500 font-semibold' : 'text-green-500') : 'text-slate-400'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold ${
                step === s.num ? 'bg-primary-500 text-white' :
                step > s.num ? 'bg-green-500 text-white' :
                'bg-gray-200 text-slate-400'
              }`}>
                {step > s.num ? '✓' : s.num}
              </div>
              {s.label}
            </div>
            {i < STEPS.length - 1 && <span className="text-gray-300 text-lg mx-1">—</span>}
          </div>
        ))}
      </div>

      {/* ============================================ */}
      {/* Step 1: 填写基本信息                              */}
      {/* ============================================ */}
      {step === 1 && (
        <>
          <div className="surface-card p-4 md:p-6 mb-5">
            <h2 className="text-[15px] font-bold text-slate-950 mb-5 flex items-center gap-2">📋 基本信息</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[12px] text-slate-500 mb-1.5 font-medium">游戏名称 <span className="text-red-500">*</span></label>
                <input className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-[13px] outline-none focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100" placeholder="请输入游戏名称" value={form.game_name} onChange={e => setForm({...form, game_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-[12px] text-slate-500 mb-1.5 font-medium">游戏ID <span className="text-red-500">*</span></label>
                <input className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-[13px] outline-none focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100" placeholder="如 G10086" value={form.game_id} onChange={e => setForm({...form, game_id: e.target.value})} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <label className="text-[12px] text-slate-500 font-medium">接入环境 <span className="text-red-500">*</span></label>
                  <a href="https://q1doc.yuque.com/staff-nseb80/it/uhn8e7zsm8gucdxf?singleDoc#" target="_blank" rel="noopener noreferrer" title="查看接入环境说明文档" className="w-4 h-4 rounded-full bg-gray-200 text-slate-500 hover:bg-primary-100 hover:text-primary-600 flex items-center justify-center text-[10px] font-bold transition-colors leading-none">?</a>
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
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-[13px] outline-none focus:bg-white focus:border-primary-500" value={form.region} onChange={e => setForm({...form, region: e.target.value})}>
                  <option>国内</option><option>海外</option><option>港澳台</option><option>国内 · 海外</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] text-slate-500 mb-1.5 font-medium">业务类型</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-[13px] outline-none focus:bg-white focus:border-primary-500" value={form.business_type} onChange={e => setForm({...form, business_type: e.target.value})}>
                  <option>自研</option><option>代理</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] text-slate-500 mb-1.5 font-medium">数据库类型</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-[13px] outline-none focus:bg-white focus:border-primary-500" value={form.db_type} onChange={e => setForm({...form, db_type: e.target.value})}>
                  <option>独立数据库</option><option>中心数据库</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] text-slate-500 mb-1.5 font-medium">所属事业部</label>
                <input className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-[13px] outline-none focus:bg-white focus:border-primary-500" placeholder="如 事业一部" value={form.department} onChange={e => setForm({...form, department: e.target.value})} />
              </div>
              <div>
                <label className="block text-[12px] text-slate-500 mb-1.5 font-medium">项目负责人</label>
                <input className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-[13px] outline-none focus:bg-white focus:border-primary-500" placeholder="姓名（钉钉号）" value={form.leader_name} onChange={e => setForm({...form, leader_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-[12px] text-slate-500 mb-1.5 font-medium">计划对外日期</label>
                <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-[13px] outline-none focus:bg-white focus:border-primary-500" value={form.launch_date} onChange={e => setForm({...form, launch_date: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Step 1 底部操作 */}
          <div className="flex gap-3 justify-end">
            <button onClick={() => navigate('/')} className="px-4 py-2 border border-gray-300 rounded-lg text-[13px] text-slate-600 hover:bg-slate-50">取消</button>
            <button onClick={goToStep2} className="px-5 py-2 bg-primary-500 text-white rounded-lg text-[13px] font-medium hover:bg-primary-600">
              下一步：选择接入功能 →
            </button>
          </div>
        </>
      )}

      {/* ============================================ */}
      {/* Step 2: 选择阶段与功能                             */}
      {/* ============================================ */}
      {step === 2 && (
        <>
          {/* 阶段卡片 */}
          <div className="surface-card p-5 md:p-6 mb-5">
            <h2 className="text-[15px] font-bold text-slate-950 mb-1 flex items-center gap-2">
              🎯 选择接入阶段
              <span className="text-[12px] font-normal text-slate-400">— 根据项目当前情况选择</span>
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              {Object.entries(STAGE_DESC).map(([num, info]) => (
                <div
                  key={num}
                  onClick={() => handleStageSelect(parseInt(num))}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all relative ${
                    selectedStage === parseInt(num)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-slate-200 hover:border-blue-200 hover:bg-blue-50/30'
                  }`}
                >
                  {selectedStage === parseInt(num) && (
                    <div className="absolute top-2.5 right-2.5 w-[18px] h-[18px] rounded-full bg-primary-500 flex items-center justify-center text-white text-[11px]">✓</div>
                  )}
                  <div className="text-[11px] font-bold text-slate-400 mb-1">{info.num}</div>
                  <div className="text-[14px] font-bold mb-1.5">{info.name}</div>
                  <div className="text-[11px] text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full inline-block mb-1.5">{info.time}</div>
                  <div className="text-[12px] text-slate-500 leading-relaxed">{info.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 功能清单 + 右侧摘要 */}
          {selectedStage !== null && (
            <div className="flex flex-col lg:flex-row gap-5 mb-5">
              {/* 主内容区：功能清单 */}
              <div className="flex-1 min-w-0 surface-card p-5 md:p-6">
                <h2 className="text-[15px] font-bold text-slate-950 mb-1 flex items-center gap-2">
                  ✅ 功能选择
                  <span className="text-[12px] font-normal text-slate-400">— 已推荐阶段{selectedStage}功能</span>
                </h2>
                <div className="text-[13px] text-slate-500 mb-4">已选 <span className="font-bold text-primary-500">{selectedFeatures.size}</span> 个功能</div>

                {getFeaturesGrouped().map(({ stage, features }) => {
                  const isIncludedStage = stage.stage_num <= selectedStage
                  const isCustomGroup = stage.id === 'custom'
                  return (
                    <div key={stage.id} className="mb-4">
                      <div className="text-[12px] font-bold mb-2 flex items-center gap-2">
                        {isCustomGroup ? (
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">✨ 自定义功能</span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded ${STAGE_TAG[stage.stage_num]}`}>阶段{stage.stage_num} · {stage.name}</span>
                        )}
                        {!isCustomGroup && !isIncludedStage && <span className="text-slate-400 font-normal">（跨阶段可选）</span>}
                        {!isCustomGroup && isIncludedStage && stage.stage_num === selectedStage && <span className="text-slate-400 font-normal">（新增）</span>}
                        {!isCustomGroup && isIncludedStage && stage.stage_num < selectedStage && <span className="text-slate-400 font-normal">（已包含，不可取消）</span>}
                      </div>
                      <div className={`rounded-lg border overflow-hidden ${isCustomGroup ? 'bg-indigo-50/50 border-indigo-200' : STAGE_BG[stage.stage_num]}`}>
                        {/* 表头 */}
                        <div className="grid grid-cols-[28px_1fr_80px_80px_80px_90px_90px_70px_140px] items-center gap-2 px-4 py-2 bg-black/[0.03] text-[11px] text-slate-400 font-semibold border-b border-slate-200">
                          <span></span><span>功能名称</span><span>模块</span><span>推荐等级</span><span>类型</span><span>接入方式</span><span>权责方</span><span>工期</span><span>物料</span>
                        </div>
                        {features.filter(f => !(isDbDependentFeature(f.name) && form.db_type !== '独立数据库')).map(feature => {
                          const isCustom = feature.is_custom
                          const isMust = !isCustom && feature.recommendation === '必须使用' && isIncludedStage
                          const isSelected = selectedFeatures.has(feature.id)
                          const note = featureNotes[feature.id]
                          const isNoteExpanded = expandedNoteId === feature.id
                          return (
                            <div key={feature.id}>
                              <div className={`grid grid-cols-[28px_1fr_80px_80px_80px_90px_90px_70px_140px] items-center gap-2 px-4 py-3 border-b border-slate-100 last:border-b-0 text-[13px] hover:bg-white/60 ${isSelected && !isMust ? 'bg-primary-50/30' : ''}`}>
                                <div onClick={() => toggleFeature(feature.id)} className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                                  isMust ? 'bg-green-500 border-green-500 cursor-not-allowed' :
                                  isSelected ? 'bg-primary-500 border-primary-500 cursor-pointer' :
                                  'border-2 border-gray-300 cursor-pointer hover:border-primary-300'
                                }`}>
                                  {(isMust || isSelected) && <span className="text-white text-[10px]">✓</span>}
                                </div>
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold flex items-center gap-1.5">
                                      {feature.name}
                                      {isCustom && <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-600 font-medium">自定义</span>}
                                      {isSelected && feature.name === PLAYER_INFO_FEATURE_NAME && (
                                        <PlayerFieldConfigTrigger config={featureConfigs[feature.id]?.player_info || null} onClick={() => openPlayerFieldConfig(feature.id)} />
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">{feature.description}</div>
                                    {isSelected && note && !isNoteExpanded && (
                                      <div className="text-[11px] text-primary-500 mt-1 truncate">💬 {note}</div>
                                    )}
                                  </div>
                                  {isSelected && !isMust && (
                                    <button onClick={() => setExpandedNoteId(isNoteExpanded ? null : feature.id)} className="flex-shrink-0 text-[11px] text-primary-500 hover:text-primary-700 px-1.5 py-0.5 rounded hover:bg-primary-100 transition-colors">
                                      {isNoteExpanded ? '收起备注' : '✏️ 备注'}
                                    </button>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-500 truncate hidden sm:block">{feature.module_name || '-'}</span>
                                <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${feature.recommendation === '必须使用' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>{feature.recommendation}</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${feature.feature_type === '通用' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>{feature.feature_type}</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${getAccessMethodTone(feature.access_method) === 'green' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>{feature.access_method}</span>
                                <span className="text-[11px] font-medium text-slate-600">{getAccessResponsibility(feature.access_method)}</span>
                                <span className={`text-[11px] ${getAccessMethodTone(feature.access_method) === 'green' ? 'text-green-600' : 'text-blue-600'}`}>{feature.estimated_duration || '-'}</span>
                                <TeamNeedsCell text={feature.team_needs} />
                              </div>
                              {/* 展开备注 */}
                              {isSelected && !isMust && isNoteExpanded && (
                                <div className="px-4 py-3 bg-primary-50/30 border-b border-slate-100">
                                  <div className="text-[11px] text-slate-400 mb-1.5">
                                    💬 对「{feature.name}」的特殊要求或备注（选填）
                                    {isCustom && <span onClick={() => removeCustomFeature(feature.id)} className="text-red-400 ml-3 cursor-pointer hover:text-red-600">✕ 删除此自定义功能</span>}
                                  </div>
                                  <textarea value={note || ''} onChange={e => updateNote(feature.id, e.target.value)} placeholder="例如：需要定制XX字段、对接XX系统、特殊权限要求等" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 resize-none bg-white" rows={2} />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                {/* 跨阶段提示 + 自定义入口 */}
                <div className="flex flex-col sm:flex-row items-stretch gap-3 mt-4">
                  {selectedStage < 3 && (
                    <div className="border border-dashed border-gray-300 rounded-lg p-3 flex items-center gap-2.5 cursor-default text-slate-400 text-[13px] flex-1">
                      ＋ 已支持跨阶段选择所有功能
                    </div>
                  )}
                  <div onClick={() => setShowCustomForm(true)} className="border border-dashed border-indigo-300 rounded-lg p-3 flex items-center gap-2.5 cursor-pointer text-indigo-500 text-[13px] hover:bg-indigo-50 flex-1">
                    ✨ 添加自定义功能（功能库中不存在的新功能）
                  </div>
                </div>

                {/* 自定义功能表单 */}
                {showCustomForm && (
                  <div className="mt-4 bg-indigo-50/50 border border-indigo-200 rounded-lg p-4">
                    <div className="text-[13px] font-bold text-indigo-700 mb-3">✨ 添加自定义功能</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[12px] text-slate-500 mb-1">功能名称 <span className="text-red-500">*</span></label>
                        <input className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-[13px] outline-none focus:bg-white focus:border-indigo-400" placeholder="如：数据分析面板" value={customFeature.name} onChange={e => setCustomFeature({ ...customFeature, name: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-[12px] text-slate-500 mb-1">功能说明</label>
                        <input className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-[13px] outline-none focus:bg-white focus:border-indigo-400" placeholder="简要描述功能用途" value={customFeature.description} onChange={e => setCustomFeature({ ...customFeature, description: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-[12px] text-slate-500 mb-1">接入方式</label>
                        <select className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-[13px] outline-none focus:bg-white focus:border-indigo-400" value={customFeature.access_method} onChange={e => setCustomFeature({ ...customFeature, access_method: e.target.value })}>
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

              {/* 右侧摘要栏 */}
              <div className="lg:w-[260px] flex-shrink-0">
                <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-lg border border-primary-200 p-5 lg:sticky lg:top-4">
                  <div className="text-[13px] font-bold text-slate-950 mb-4">📊 选择摘要</div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-slate-500">当前阶段</span>
                      <span className="font-semibold text-primary-600">{summary.stageName}</span>
                    </div>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-slate-500">已选功能</span>
                      <span className="font-bold text-slate-950 text-[15px]">{summary.selectedCount} <span className="text-[11px] font-normal text-slate-400">个</span></span>
                    </div>
                    {summary.totalDuration && (
                      <div className="flex items-start justify-between text-[12px]">
                        <span className="text-slate-500">累计工期</span>
                        <span className="font-medium text-slate-700 text-right max-w-[140px]">{summary.totalDuration}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-slate-500">需提供物料</span>
                      <span className={`font-semibold ${summary.needsMaterialCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {summary.needsMaterialCount > 0 ? `${summary.needsMaterialCount} 项需要提供` : '无'}
                      </span>
                    </div>
                    {summary.needsMaterialCount > 0 && (
                      <div className="pt-2 border-t border-primary-100">
                        <div className="text-[11px] text-slate-400 mb-2">物料预览</div>
                        <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                          {Array.from(selectedFeatures).filter(fid => getFeatureById(fid)?.team_needs).slice(0, 5).map(fid => {
                            const f = getFeatureById(fid)
                            return (
                              <div key={fid} className="text-[11px] text-slate-600 truncate" title={f.team_needs}>· {f.name}</div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 未选择阶段时的提示 */}
          {selectedStage === null && (
            <div className="bg-slate-50 rounded-lg border border-dashed border-gray-300 p-8 text-center text-slate-400 mb-5">
              👆 请先在上方选择接入阶段，查看对应的功能清单
            </div>
          )}

          {/* Step 2 底部操作 */}
          <div className="flex gap-3 justify-between">
            <button onClick={() => setStep(1)} className="px-4 py-2 border border-gray-300 rounded-lg text-[13px] text-slate-600 hover:bg-slate-50">
              ← 上一步
            </button>
            <div className="flex gap-3">
              <button onClick={() => navigate('/')} className="px-4 py-2 border border-gray-300 rounded-lg text-[13px] text-slate-600 hover:bg-slate-50">取消</button>
              {selectedStage !== null && selectedFeatures.size > 0 && (
                <button onClick={() => setStep(3)} className="px-5 py-2 bg-primary-500 text-white rounded-lg text-[13px] font-medium hover:bg-primary-600">
                  下一步：确认创建内容 →
                </button>
              )}
              {selectedStage !== null && selectedFeatures.size === 0 && (
                <button disabled className="px-5 py-2 bg-gray-300 text-slate-500 rounded-lg text-[13px] font-medium cursor-not-allowed">
                  下一步：确认创建内容 →
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* ============================================ */}
      {/* Step 3: 确认创建内容                               */}
      {/* ============================================ */}
      {step === 3 && (
        <>
          <div className="surface-card p-5 md:p-6 mb-5">
            <h2 className="text-[15px] font-bold text-slate-950 mb-5 flex items-center gap-2">📋 确认创建内容</h2>

            {/* 项目基本信息摘要 */}
            <div className="mb-6">
              <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-3">项目基本信息</div>
              <div className="rounded-lg bg-slate-50 p-4 grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-[13px]">
                <div><span className="text-slate-400">游戏名称：</span><span className="font-medium text-slate-800">{form.game_name || '-'}</span></div>
                <div><span className="text-slate-400">游戏ID：</span><span className="font-medium text-slate-800">{form.game_id || '-'}</span></div>
                <div><span className="text-slate-400">接入环境：</span><span className="font-medium text-primary-600">{form.environments.join('、') || '-'}</span></div>
                <div><span className="text-slate-400">发行地区：</span><span className="font-medium text-slate-800">{form.region}</span></div>
                <div><span className="text-slate-400">业务类型：</span><span className="font-medium text-slate-800">{form.business_type}</span></div>
                <div><span className="text-slate-400">数据库类型：</span><span className="font-medium text-slate-800">{form.db_type}</span></div>
                {form.department && <div><span className="text-slate-400">所属事业部：</span><span className="font-medium text-slate-800">{form.department}</span></div>}
                {form.leader_name && <div><span className="text-slate-400">项目负责人：</span><span className="font-medium text-slate-800">{form.leader_name}{form.leader_contact ? `（${form.leader_contact}）` : ''}</span></div>}
                {form.launch_date && <div><span className="text-slate-400">计划日期：</span><span className="font-medium text-slate-800">{form.launch_date}</span></div>}
              </div>
            </div>

            {/* 接入配置 */}
            <div className="mb-6">
              <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-3">接入配置</div>
              <div className="rounded-lg bg-slate-50 p-4 text-[13px] space-y-2">
                <div><span className="text-slate-400">选择阶段：</span><span className="font-semibold text-primary-600">{STAGE_DESC[selectedStage]?.name}</span></div>
                <div><span className="text-slate-400">已选功能：</span><span className="font-bold text-slate-950">{selectedFeatures.size} 个</span></div>
              </div>

              {/* 已选功能列表按阶段分组 */}
              <div className="mt-4 space-y-3">
                {getFeaturesGrouped().map(({ stage, features }) => {
                  const groupSelected = features.filter(f => selectedFeatures.has(f.id))
                  if (groupSelected.length === 0) return null
                  const isCustomGroup = stage.id === 'custom'
                  return (
                    <div key={stage.id}>
                      <div className="text-[12px] font-bold mb-1.5 flex items-center gap-2">
                        {isCustomGroup ? (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600">✨ 自定义功能</span>
                        ) : (
                          <span className={`px-1.5 py-0.5 rounded ${STAGE_TAG[stage.stage_num]}`}>阶段{stage.stage_num}（{stage.name}）</span>
                        )}
                      </div>
                      <div className="space-y-1">
                        {groupSelected.map(f => (
                          <div key={f.id} className="flex items-start gap-2 text-[13px] py-1">
                            <span className="text-green-500 mt-0.5">✓</span>
                            <span className="font-medium text-slate-800">{f.name}</span>
                            {featureNotes[f.id] && <span className="text-[11px] text-primary-500 ml-1">💬 {featureNotes[f.id].length > 30 ? featureNotes[f.id].slice(0, 30) + '…' : featureNotes[f.id]}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 需要项目组提供的物料 */}
            {(function() {
              const materialFeatures = Array.from(selectedFeatures)
                .map(fid => ({ fid, f: getFeatureById(fid), notes: featureNotes[fid] }))
                .filter(({ f }) => f?.team_needs)
              if (materialFeatures.length === 0) return null
              return (
                <div className="mb-6">
                  <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-3">📦 需项目组提供的物料</div>
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-2">
                    {materialFeatures.map(({ fid, f }) => (
                      <div key={fid} className="text-[13px] flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">·</span>
                        <div>
                          <span className="font-medium text-slate-800">{f.name}：</span>
                          <TeamNeedsCell text={f.team_needs} className="text-slate-600 inline" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* 将生成的接入节点 */}
            <div>
              <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-3">将生成的接入节点</div>
              <div className="rounded-lg bg-blue-50/50 border border-blue-200 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { icon: '①', label: '配置控制中心添加版本' },
                    { icon: '②', label: '版本/功能绑定' },
                    { icon: '③', label: '权限开通' },
                    { icon: '④', label: '添加功能配置表' },
                    { icon: '⑤', label: '开区服、配渠道' },
                    { icon: '⑥', label: '功能开发（看板）' },
                    { icon: '⑦', label: '测试验收（看板）' },
                    { icon: '⑧', label: '满意度问卷填写' },
                  ].map((node, i) => (
                    <div key={i} className="flex items-center gap-2 text-[13px] py-1">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[11px] font-bold flex-shrink-0">{node.icon}</span>
                      <span className="text-slate-700">{node.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 底部操作 */}
          <div className="flex gap-3 justify-between">
            <button onClick={() => setStep(2)} className="px-4 py-2 border border-gray-300 rounded-lg text-[13px] text-slate-600 hover:bg-slate-50">
              ← 上一步修改
            </button>
            <div className="flex gap-3">
              <button onClick={() => navigate('/')} className="px-4 py-2 border border-gray-300 rounded-lg text-[13px] text-slate-600 hover:bg-slate-50">取消</button>
              <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-primary-500 text-white rounded-lg text-[13px] font-semibold hover:bg-primary-600 disabled:opacity-50 flex items-center gap-2">
                ✨ {saving ? '创建中…' : '创建项目'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ============================================ */}
      {/* 阶段切换保护弹窗                                     */}
      {/* ============================================ */}
      {stageSwitchDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setStageSwitchDialog(null)}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="text-[15px] font-bold text-slate-950">切换接入阶段</div>
            </div>
            <div className="px-6 py-5">
              <p className="text-[13px] text-slate-600 mb-4">
                切换到「<span className="font-semibold text-primary-600">{STAGE_DESC[stageSwitchDialog.to]?.name}</span>」将按新阶段推荐重置功能选择。
              </p>
              <div className="space-y-2.5">
                <label className="flex items-start gap-3 p-3 rounded-lg border-2 border-primary-200 bg-primary-50 cursor-pointer">
                  <input type="radio" name="stageSwitch" defaultChecked className="mt-0.5 accent-primary-500" />
                  <div className="text-[13px]">
                    <div className="font-semibold text-slate-950">保留我已手动选择的功能</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">仅切换推荐阶段，不改变当前已勾选的功能</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-gray-300 cursor-pointer transition-colors">
                  <input type="radio" name="stageSwitch" className="mt-0.5 accent-primary-500" />
                  <div className="text-[13px]">
                    <div className="font-semibold text-slate-950">按新阶段推荐重置</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">清空当前选择，按新阶段重新勾选推荐功能</div>
                  </div>
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2.5">
              <button onClick={() => setStageSwitchDialog(null)} className="px-4 py-1.5 border border-gray-300 rounded-lg text-[13px] text-slate-600 hover:bg-slate-50">取消</button>
              <button
                onClick={() => confirmStageSwitch(true)}
                className="px-4 py-1.5 bg-primary-500 text-white rounded-lg text-[13px] font-medium hover:bg-primary-600"
              >
                确认切换
              </button>
            </div>
          </div>
        </div>
      )}

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
