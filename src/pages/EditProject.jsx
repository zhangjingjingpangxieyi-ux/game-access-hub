import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const ENV_OPTIONS = ['正式版本', '版署版本', '预演版本', '测试版本']

const STAGE_DESC = {
  0: { num: '阶段 0', name: '超轻量接入包', time: '⏱ 0.5h', desc: '无需游戏侧介入，平台开通权限即可用。适合新项目首轮验证期。' },
  1: { num: '阶段 1', name: '基础接入包', time: '⏱ 3–7天', desc: '按文档开发，几乎无需定制。适合有数据基础的项目推广期或换皮项目。' },
  2: { num: '阶段 2', name: '升级接入包', time: '⏱ 7–14天', desc: '小部分需配合定制。适合稳定运营期、战略级项目。' },
  3: { num: '阶段 3', name: '深度开发包', time: '⏱ 7–14天', desc: '纯定制，需深度协作联合评审。适合长期核心头部产品。' },
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

    // 获取项目已关联的功能ID
    const { data: pf } = await supabase.from('project_features').select('feature_id').eq('project_id', id)
    const ids = new Set((pf || []).map(f => f.feature_id))
    setExistingFeatureIds(ids)
    setSelectedFeatures(new Set(ids))
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
  }

  function toggleFeature(featureId) {
    const next = new Set(selectedFeatures)
    // 已关联的功能不能取消（只允许新增，不允许删除已有功能）
    if (existingFeatureIds.has(featureId)) return

    const feature = allFeatures.find(f => f.id === featureId)
    const targetStages = stages.filter(s => s.stage_num <= selectedStage)
    const isIncludedStage = targetStages.some(s => s.id === feature.stage_id)
    if (isIncludedStage && feature.recommendation === '必须使用') return

    if (next.has(featureId)) next.delete(featureId)
    else next.add(featureId)
    setSelectedFeatures(next)
  }

  // 计算新增的功能
  function getNewFeatureIds() {
    return Array.from(selectedFeatures).filter(fid => !existingFeatureIds.has(fid))
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

      // 2. 添加新选的功能（不删除已有功能）
      const newFeatureIds = getNewFeatureIds()
      if (newFeatureIds.length > 0) {
        const projectFeatures = newFeatureIds.map(featureId => ({
          project_id: id,
          feature_id: featureId,
          batch: 1,
          status: '待接入',
        }))
        const { error: pfError } = await supabase
          .from('project_features')
          .insert(projectFeatures)
        if (pfError) throw pfError
      }

      // 3. 更新项目功能总数
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

  if (loading) return <div className="p-7 text-gray-400">加载中…</div>

  return (
    <div className="p-7">
      <div className="text-[12px] text-gray-400 mb-4 flex items-center gap-1.5">
        <span onClick={() => navigate('/')} className="text-primary-500 cursor-pointer hover:underline">项目管理</span>
        <span>›</span>
        <span onClick={() => navigate(`/project/${id}`)} className="text-primary-500 cursor-pointer hover:underline">{form.game_name}</span>
        <span>›</span>
        <span>编辑项目</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">编辑项目信息</h1>
          <p className="text-[13px] text-gray-400 mt-1">修改项目基本信息和接入配置</p>
        </div>
      </div>

      {/* 基本信息 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 mb-5">
        <h2 className="text-[15px] font-bold text-gray-900 mb-5">📋 基本信息</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">游戏名称 <span className="text-red-500">*</span></label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" value={form.game_name} onChange={e => setForm({...form, game_name: e.target.value})} />
          </div>
          <div>
            <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">游戏ID <span className="text-red-500">*</span></label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" value={form.game_id} onChange={e => setForm({...form, game_id: e.target.value})} />
          </div>
          <div>
            <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">接入环境 <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-2 mt-1">
              {ENV_OPTIONS.map(env => (
                <label key={env} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] cursor-pointer transition-all ${
                  form.environments.includes(env) ? 'border-primary-500 bg-primary-50 text-primary-600 font-medium' : 'border-gray-300 text-gray-500 hover:border-primary-300'
                }`}>
                  <input type="checkbox" checked={form.environments.includes(env)} onChange={() => toggleEnvironment(env)} className="sr-only" />
                  {form.environments.includes(env) ? '✓' : ''} {env}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">发行地区</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500" value={form.region} onChange={e => setForm({...form, region: e.target.value})}>
              <option>国内</option><option>海外</option><option>港澳台</option><option>国内 · 海外</option>
            </select>
          </div>
          <div>
            <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">业务类型</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500" value={form.business_type} onChange={e => setForm({...form, business_type: e.target.value})}>
              <option>自研</option><option>代理</option>
            </select>
          </div>
          <div>
            <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">数据库类型</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500" value={form.db_type} onChange={e => setForm({...form, db_type: e.target.value})}>
              <option>独立数据库</option><option>中心数据库</option>
            </select>
          </div>
          <div>
            <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">所属事业部</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500" value={form.department} onChange={e => setForm({...form, department: e.target.value})} />
          </div>
          <div>
            <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">项目负责人</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500" value={form.leader_name} onChange={e => setForm({...form, leader_name: e.target.value})} />
          </div>
          <div>
            <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">计划对外日期</label>
            <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500" value={form.launch_date} onChange={e => setForm({...form, launch_date: e.target.value})} />
          </div>
          <div>
            <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">项目状态</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option>接入中</option><option>已完成</option><option>暂停</option>
            </select>
          </div>
        </div>
      </div>

      {/* 功能管理 */}
      <div className="bg-white rounded-xl border border-gray-200 mb-5 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-[15px] font-bold text-gray-900">🔧 功能管理</h2>
            <p className="text-[12px] text-gray-400 mt-1">
              已关联 <span className="font-bold text-primary-500">{existingFeatureIds.size}</span> 个功能
              {getNewFeatureIds().length > 0 && <span className="text-green-500 ml-2">+ 新增 {getNewFeatureIds().length} 个</span>}
            </p>
          </div>
          <button
            onClick={() => setShowFeaturePanel(!showFeaturePanel)}
            className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-[12px] hover:bg-primary-600"
          >
            {showFeaturePanel ? '收起' : '＋ 添加功能'}
          </button>
        </div>

        {/* 已有功能列表 */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-[1fr_80px_100px_80px_100px] px-4 py-2.5 bg-gray-50 text-[11px] text-gray-400 font-semibold border-b border-gray-200 rounded-t-lg">
            <span>功能名称</span><span>接入方式</span><span>权责</span><span>工期</span><span>状态</span>
          </div>
          {allFeatures.filter(f => existingFeatureIds.has(f.id)).map(f => (
            <div key={f.id} className="grid grid-cols-[1fr_80px_100px_80px_100px] px-4 py-2.5 border-b border-gray-100 text-[13px] items-center hover:bg-gray-50">
              <div className="font-semibold">{f.name}</div>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                f.access_method === '开通权限' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
              }`}>{f.access_method}</span>
              <span className="text-[12px] text-gray-500">
                {f.access_method === '开通权限' ? '平台配置' : f.access_method === '游戏接入' ? '游戏侧接入' : f.access_method === '平台开发' ? '平台开发' : '双方协作'}
              </span>
              <span className="text-[12px] text-gray-400">{f.estimated_duration}</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600">已关联</span>
            </div>
          ))}
          {existingFeatureIds.size === 0 && (
            <div className="text-center py-8 text-gray-400 text-[13px]">暂无关联功能，点击「添加功能」开始选择</div>
          )}
        </div>

        {/* 功能选择面板 */}
        {showFeaturePanel && (
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50/50">
            {/* 阶段选择 */}
            <div className="mb-4">
              <h3 className="text-[13px] font-bold text-gray-700 mb-3">选择接入阶段（新增功能的范围）</h3>
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(STAGE_DESC).map(([num, info]) => (
                  <div
                    key={num}
                    onClick={() => handleStageSelect(parseInt(num))}
                    className={`border-2 rounded-xl p-3 cursor-pointer transition-all relative ${
                      selectedStage === parseInt(num)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/30'
                    }`}
                  >
                    {selectedStage === parseInt(num) && (
                      <div className="absolute top-2 right-2 w-[16px] h-[16px] rounded-full bg-primary-500 flex items-center justify-center text-white text-[10px]">✓</div>
                    )}
                    <div className="text-[11px] font-bold text-gray-400 mb-0.5">{info.num}</div>
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
                    {!isIncludedStage && <span className="text-gray-400 font-normal text-[11px]">（跨阶段可选）</span>}
                  </div>
                  <div className={`rounded-lg border overflow-hidden ${STAGE_BG[stage.stage_num]}`}>
                    <div className="grid grid-cols-[28px_1fr_100px_80px_140px_80px_80px] items-center gap-3 px-4 py-2 bg-black/[0.03] text-[11px] text-gray-400 font-semibold border-b border-gray-200">
                      <span></span><span>功能名称</span><span>推荐等级</span><span>功能类型</span><span>接入方式</span><span>工期</span><span>权责</span>
                    </div>
                    {features.map(feature => {
                      const isMust = feature.recommendation === '必须使用' && isIncludedStage
                      const isSelected = selectedFeatures.has(feature.id)
                      const isExisting = existingFeatureIds.has(feature.id)
                      return (
                        <div key={feature.id} className={`grid grid-cols-[28px_1fr_100px_80px_140px_80px_80px] items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 text-[13px] hover:bg-white/60 ${isExisting ? 'opacity-60' : ''}`}>
                          <div
                            onClick={() => !isMust && !isExisting && toggleFeature(feature.id)}
                            className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                              isExisting ? 'bg-gray-300 border-gray-300 cursor-not-allowed' :
                              isMust ? 'bg-green-500 border-green-500 cursor-not-allowed' :
                              isSelected ? 'bg-primary-500 border-primary-500 cursor-pointer' :
                              'border-2 border-gray-300 cursor-pointer hover:border-primary-300'
                            }`}
                          >
                            {(isMust || isSelected) && <span className="text-white text-[10px]">✓</span>}
                          </div>
                          <div>
                            <div className="font-semibold">{feature.name}</div>
                            <div className="text-[11px] text-gray-400">{feature.description}</div>
                          </div>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            feature.recommendation === '必须使用' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                          }`}>{feature.recommendation}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            feature.feature_type === '通用' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                          }`}>{feature.feature_type}</span>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            feature.access_method === '开通权限' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                          }`}>{feature.access_method}</span>
                          <span className={`text-[12px] ${feature.access_method === '开通权限' ? 'text-green-600' : 'text-blue-600'}`}>{feature.estimated_duration}</span>
                          <span className="text-[12px] text-gray-400">
                            {isExisting ? '已关联' :
                            feature.access_method === '开通权限' ? '平台配置' : feature.access_method === '游戏接入' ? '游戏侧接入' : feature.access_method === '平台开发' ? '平台开发' : '双方协作'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {selectedStage !== null && (
              <div className="mt-3 text-[13px] text-gray-500">
                已选 <span className="font-bold text-primary-500">{selectedFeatures.size}</span> 个功能（含 {existingFeatureIds.size} 个已关联 + {getNewFeatureIds().length} 个新增）
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-end mt-6">
        <button onClick={() => navigate(`/project/${id}`)} className="px-4 py-2 border border-gray-300 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50">
          取消
        </button>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary-500 text-white rounded-lg text-[13px] font-medium hover:bg-primary-600 disabled:opacity-50">
          {saving ? '保存中…' : '保存修改'}
        </button>
      </div>
    </div>
  )
}
