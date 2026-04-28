import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

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

export default function NewProject() {
  const navigate = useNavigate()
  const [stages, setStages] = useState([])
  const [allFeatures, setAllFeatures] = useState([])
  const [selectedStage, setSelectedStage] = useState(null)
  const [selectedFeatures, setSelectedFeatures] = useState(new Set())
  const [step, setStep] = useState(1)
  const ENV_OPTIONS = ['正式版本', '版署版本', '预演版本', '测试版本']

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
    const { data: stageData } = await supabase.from('stages').select('*').order('sort_order')
    setStages(stageData || [])

    const { data: featureData } = await supabase.from('features').select('*').eq('is_active', true).order('sort_order')
    setAllFeatures(featureData || [])
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
    // 默认只选中「必须使用」的功能
    const features = getFeaturesForStage(stageNum)
    setSelectedFeatures(new Set(features.filter(f => f.recommendation === '必须使用').map(f => f.id)))
  }

  function toggleFeature(featureId) {
    const next = new Set(selectedFeatures)
    // 检查是否是必须使用且属于当前阶段或之前阶段
    const feature = allFeatures.find(f => f.id === featureId)
    const targetStages = stages.filter(s => s.stage_num <= selectedStage)
    const isIncludedStage = targetStages.some(s => s.id === feature.stage_id)
    if (isIncludedStage && feature.recommendation === '必须使用') return // 不能取消必须使用

    if (next.has(featureId)) next.delete(featureId)
    else next.add(featureId)
    setSelectedFeatures(next)
  }

  function toggleEnvironment(env) {
    const next = form.environments.includes(env)
      ? form.environments.filter(e => e !== env)
      : [...form.environments, env]
    setForm({ ...form, environments: next })
  }

  async function handleSave() {
    if (!form.game_name || !form.game_id || form.environments.length === 0 || selectedStage === null) {
      alert('请填写必填项（游戏名称、游戏ID、接入环境）并选择接入阶段')
      return
    }
    setSaving(true)

    try {
      const stageRecord = stages.find(s => s.stage_num === selectedStage)
      // 创建项目
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

      // 批量插入项目功能关联
      const projectFeatures = Array.from(selectedFeatures).map(featureId => ({
        project_id: project.id,
        feature_id: featureId,
        batch: 1,
        status: '待接入',
      }))

      if (projectFeatures.length > 0) {
        const { error: pfError } = await supabase
          .from('project_features')
          .insert(projectFeatures)
        if (pfError) throw pfError
      }

      // 初始化接入流程步骤（8阶段，全部为 global 类型）
      const { data: allSteps } = await supabase
        .from('access_steps')
        .select('id')
        .eq('is_active', true)
      if (allSteps && allSteps.length > 0) {
        await supabase.from('project_global_steps').insert(
          allSteps.map(s => ({
            project_id: project.id,
            step_id: s.id,
            is_completed: false,
          }))
        )
      }

      // 插入时间线
      await supabase.from('project_timeline').insert({
        project_id: project.id,
        event: '项目建档完成，进入功能选择',
      })
      await supabase.from('project_timeline').insert({
        project_id: project.id,
        event: `完成功能勾选，共${selectedFeatures.size}个功能，第一轮启动`,
      })

      navigate(`/project/${project.id}`)
    } catch (err) {
      console.error('Save error:', err)
      alert('保存失败：' + err.message)
    }
    setSaving(false)
  }

  return (
    <div className="p-7">
      {/* 面包屑 */}
      <div className="text-[12px] text-gray-400 mb-4 flex items-center gap-1.5">
        <span onClick={() => navigate('/')} className="text-primary-500 cursor-pointer hover:underline">项目管理</span>
        <span>›</span>
        <span>新建项目</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">新建游戏接入项目</h1>
          <p className="text-[13px] text-gray-400 mt-1">填写基本信息并选择接入阶段，系统将为你推荐功能清单</p>
        </div>
      </div>

      {/* 步骤条 */}
      <div className="flex items-center gap-0 mb-7">
        {[1, 2, 3].map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`flex items-center gap-2.5 px-5 py-2.5 text-[13px] ${
              step >= s ? (step === s ? 'text-primary-500 font-semibold' : 'text-green-500') : 'text-gray-400'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold ${
                step === s ? 'bg-primary-500 text-white' :
                step > s ? 'bg-green-500 text-white' :
                'bg-gray-200 text-gray-400'
              }`}>
                {step > s ? '✓' : s}
              </div>
              {s === 1 ? '项目建档' : s === 2 ? '功能选择' : '确认计划'}
            </div>
            {i < 2 && <span className="text-gray-300 text-lg">›</span>}
          </div>
        ))}
      </div>

      {/* Step 1: 项目建档 */}
      {step >= 1 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-5">
          <h2 className="text-[15px] font-bold text-gray-900 mb-5 flex items-center gap-2">📋 基本信息</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">游戏名称 <span className="text-red-500">*</span></label>
              <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" placeholder="请输入游戏名称" value={form.game_name} onChange={e => setForm({...form, game_name: e.target.value})} />
            </div>
            <div>
              <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">游戏ID <span className="text-red-500">*</span></label>
              <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" placeholder="如 G10086" value={form.game_id} onChange={e => setForm({...form, game_id: e.target.value})} />
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
              <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500" placeholder="如 事业一部" value={form.department} onChange={e => setForm({...form, department: e.target.value})} />
            </div>
            <div>
              <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">项目负责人</label>
              <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500" placeholder="姓名（钉钉号）" value={form.leader_name} onChange={e => setForm({...form, leader_name: e.target.value})} />
            </div>
            <div>
              <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">计划对外日期</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500" value={form.launch_date} onChange={e => setForm({...form, launch_date: e.target.value})} />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: 阶段选择 */}
      {step >= 2 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-5">
          <h2 className="text-[15px] font-bold text-gray-900 mb-1 flex items-center gap-2">
            🎯 选择接入阶段
            <span className="text-[12px] font-normal text-gray-400">— 根据项目当前情况选择，后续可调整</span>
          </h2>
          <div className="grid grid-cols-4 gap-3.5 mt-4">
            {Object.entries(STAGE_DESC).map(([num, info]) => (
              <div
                key={num}
                onClick={() => handleStageSelect(parseInt(num))}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all relative ${
                  selectedStage === parseInt(num)
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/30'
                }`}
              >
                {selectedStage === parseInt(num) && (
                  <div className="absolute top-2.5 right-2.5 w-[18px] h-[18px] rounded-full bg-primary-500 flex items-center justify-center text-white text-[11px]">✓</div>
                )}
                <div className="text-[11px] font-bold text-gray-400 mb-1">{info.num}</div>
                <div className="text-[14px] font-bold mb-1.5">{info.name}</div>
                <div className="text-[11px] text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full inline-block mb-1.5">{info.time}</div>
                <div className="text-[12px] text-gray-500 leading-relaxed">{info.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: 功能选择 */}
      {step >= 3 && selectedStage !== null && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-5">
          <h2 className="text-[15px] font-bold text-gray-900 mb-1 flex items-center gap-2">
            ✅ 功能选择
            <span className="text-[12px] font-normal text-gray-400">— 已为你推荐阶段{selectedStage}功能，可跨阶段调整</span>
          </h2>
          <div className="text-[13px] text-gray-500 mb-4">已选 <span className="font-bold text-primary-500">{selectedFeatures.size}</span> 个功能</div>

          {getFeaturesGrouped().map(({ stage, features }) => {
            const isIncludedStage = stage.stage_num <= selectedStage
            return (
              <div key={stage.id} className="mb-4">
                <div className="text-[12px] font-bold mb-2 flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded ${STAGE_TAG[stage.stage_num]}`}>
                    阶段{stage.stage_num} · {stage.name}
                  </span>
                  {!isIncludedStage && <span className="text-gray-400 font-normal">（跨阶段可选）</span>}
                  {isIncludedStage && stage.stage_num === selectedStage && <span className="text-gray-400 font-normal">（新增）</span>}
                  {isIncludedStage && stage.stage_num < selectedStage && <span className="text-gray-400 font-normal">（已包含，不可取消）</span>}
                </div>
                <div className={`rounded-lg border overflow-hidden ${STAGE_BG[stage.stage_num]}`}>
                  {/* 表头 */}
                  <div className="grid grid-cols-[28px_1fr_100px_80px_140px_80px_80px] items-center gap-3 px-5 py-2.5 bg-black/[0.03] text-[11px] text-gray-400 font-semibold border-b border-gray-200">
                    <span></span><span>功能名称</span><span>推荐等级</span><span>功能类型</span><span>接入方式</span><span>工期</span><span>权责</span>
                  </div>
                  {features.map(feature => {
                    const isMust = feature.recommendation === '必须使用' && isIncludedStage
                    const isSelected = selectedFeatures.has(feature.id)
                    return (
                      <div key={feature.id} className="grid grid-cols-[28px_1fr_100px_80px_140px_80px_80px] items-center gap-3 px-5 py-3.5 border-b border-gray-100 last:border-b-0 text-[13px] hover:bg-white/60">
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
                          <div className="text-[12px] text-gray-400 mt-0.5">{feature.description}</div>
                          {feature.team_needs && <div className="text-[11px] text-amber-600 mt-0.5">📝 {feature.team_needs.length > 60 ? feature.team_needs.slice(0, 60) + '...' : feature.team_needs}</div>}
                        </div>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          feature.recommendation === '必须使用' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {feature.recommendation}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          feature.feature_type === '通用' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {feature.feature_type}
                        </span>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          feature.access_method === '开通权限' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {feature.access_method}
                        </span>
                        <span className={`text-[12px] ${feature.access_method === '开通权限' ? 'text-green-600' : 'text-blue-600'}`}>
                          {feature.estimated_duration}
                        </span>
                        <span className="text-[12px] text-gray-400">
                          {feature.access_method === '开通权限' ? '平台配置' : feature.access_method === '游戏接入' ? '游戏侧接入' : feature.access_method === '平台开发' ? '平台开发' : '双方协作'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* 跨阶段提示 */}
          {selectedStage < 3 && (
            <div className="border border-dashed border-gray-300 rounded-lg p-3 flex items-center gap-2.5 cursor-pointer text-gray-500 text-[13px] hover:bg-gray-50 mt-1">
              ＋ 已支持跨阶段选择所有功能
            </div>
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3 justify-end mt-6">
        <button onClick={() => navigate('/')} className="px-4 py-2 border border-gray-300 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50">
          取消
        </button>
        {step < 3 && (
          <button onClick={() => setStep(step + 1)} className="px-4 py-2 bg-primary-500 text-white rounded-lg text-[13px] font-medium hover:bg-primary-600">
            下一步 →
          </button>
        )}
        {step === 3 && (
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary-500 text-white rounded-lg text-[13px] font-medium hover:bg-primary-600 disabled:opacity-50">
            {saving ? '保存中…' : '创建项目'}
          </button>
        )}
      </div>
    </div>
  )
}
