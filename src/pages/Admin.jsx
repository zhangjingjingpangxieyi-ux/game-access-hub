import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Admin() {
  const navigate = useNavigate()
  const [verified, setVerified] = useState(false)
  const [key, setKey] = useState('')
  const [activeMenu, setActiveMenu] = useState('features')
  const [features, setFeatures] = useState([])
  const [stages, setStages] = useState([])
  const [documents, setDocuments] = useState([])
  const [editFeature, setEditFeature] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({})
  const [showDocForm, setShowDocForm] = useState(false)
  const [docForm, setDocForm] = useState({})
  const [editDocId, setEditDocId] = useState(null)  // 追踪正在编辑的文档ID

  useEffect(() => {
    if (verified) fetchData()
  }, [verified, activeMenu])

  async function handleVerify() {
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'admin_key')
      .single()
    if (error || !data) { alert('验证失败'); return }
    if (data.value === key) { setVerified(true) }
    else { alert('密钥错误') }
  }

  async function fetchData() {
    const { data: stageData } = await supabase.from('stages').select('*').order('sort_order')
    setStages(stageData || [])

    if (activeMenu === 'features') {
      const { data } = await supabase.from('features').select('*, stages(stage_num)').eq('is_active', true).order('sort_order')
      setFeatures(data || [])
    } else if (activeMenu === 'docs') {
      const { data } = await supabase.from('documents').select('*').order('sort_order')
      setDocuments(data || [])
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
      stage_id: feature.stage_id,
    })
    setShowForm(true)
  }

  function openCreateForm() {
    setEditFeature(null)
    setForm({
      name: '', description: '', recommendation: '推荐使用',
      feature_type: '通用', access_method: '开通权限',
      estimated_duration: '', platform_responsibility: '',
      team_responsibility: '', team_needs: '', stage_id: null,
    })
    setShowForm(true)
  }

  async function saveFeature() {
    if (!form.name) { alert('请填写功能名称'); return }
    if (!form.stage_id) { alert('请选择所属阶段'); return }
    if (editFeature) {
      const { error } = await supabase.from('features').update({
        name: form.name,
        description: form.description,
        recommendation: form.recommendation,
        feature_type: form.feature_type,
        access_method: form.access_method,
        estimated_duration: form.estimated_duration,
        platform_responsibility: form.platform_responsibility,
        team_responsibility: form.team_responsibility,
        team_needs: form.team_needs,
        stage_id: form.stage_id,
      }).eq('id', editFeature.id)
      if (error) { alert('保存失败：' + error.message); return }
    } else {
      const { data: maxSort } = await supabase.from('features').select('sort_order').order('sort_order', { ascending: false }).limit(1).single()
      const { error } = await supabase.from('features').insert({
        name: form.name,
        description: form.description,
        recommendation: form.recommendation,
        feature_type: form.feature_type,
        access_method: form.access_method,
        estimated_duration: form.estimated_duration,
        platform_responsibility: form.platform_responsibility,
        team_responsibility: form.team_responsibility,
        team_needs: form.team_needs,
        stage_id: form.stage_id,
        sort_order: (maxSort?.sort_order || 0) + 1,
      })
      if (error) { alert('保存失败：' + error.message); return }
    }
    setShowForm(false)
    fetchData()
  }

  if (!verified) {
    return (
      <div className="fixed inset-0 bg-black/45 z-[100] flex items-center justify-center">
        <div className="bg-white rounded-2xl p-7 w-[420px] shadow-2xl">
          <h2 className="text-[17px] font-bold mb-2">🔑 管理员验证</h2>
          <p className="text-[13px] text-gray-500 leading-relaxed mb-5">请输入管理密钥以进入后台管理，可进行功能库配置、文档管理、进度状态维护等操作。</p>
          <input
            type="password"
            placeholder="请输入管理密钥"
            value={key}
            onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleVerify()}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-[14px] outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 mb-4"
            autoFocus
          />
          <div className="flex gap-2.5 justify-end">
            <button onClick={() => navigate('/')} className="px-4 py-2 border border-gray-300 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50">取消</button>
            <button onClick={handleVerify} className="px-4 py-2 bg-primary-500 text-white rounded-lg text-[13px] font-medium hover:bg-primary-600">验证并进入</button>
          </div>
        </div>
      </div>
    )
  }

  const menus = [
    { key: 'features', label: '📦 功能库配置' },
    { key: 'stages', label: '📐 阶段规则配置' },
    { key: 'docs', label: '📁 文档管理' },
    { key: 'overview', label: '👥 项目进度总览' },
  ]

  return (
    <div className="p-7">
      <div className="text-[12px] text-gray-400 mb-4 cursor-pointer flex items-center gap-1.5" onClick={() => navigate('/')}>
        ← 返回前台
      </div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">🛠 后台管理</h1>
          <p className="text-[13px] text-gray-400 mt-1">功能库配置 · 阶段规则 · 文档管理</p>
        </div>
      </div>

      <div className="grid grid-cols-[200px_1fr] gap-5">
        <div className="bg-white rounded-xl p-3 border border-gray-200 h-fit">
          {menus.map(m => (
            <div key={m.key} onClick={() => setActiveMenu(m.key)}
              className={`px-3.5 py-2.5 rounded-lg text-[13px] cursor-pointer flex items-center gap-2 ${
                activeMenu === m.key ? 'bg-primary-50 text-primary-600 font-semibold' : 'text-gray-500 hover:bg-gray-50'
              }`}>
              {m.label}
            </div>
          ))}
        </div>

        <div>
          {activeMenu === 'features' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-[15px] font-bold">功能库 · 共{features.length}个功能</div>
                <button onClick={openCreateForm} className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-[12px] hover:bg-primary-600">＋ 新增功能</button>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-[2fr_80px_80px_80px_80px_100px_80px] px-5 py-3 bg-gray-50 text-[12px] text-gray-400 font-semibold border-b border-gray-200">
                  <span>功能名称</span><span>所属阶段</span><span>推荐等级</span><span>功能类型</span><span>接入方式</span><span>工期预估</span><span>操作</span>
                </div>
                {features.map(f => (
                  <div key={f.id} className="grid grid-cols-[2fr_80px_80px_80px_80px_100px_80px] px-5 py-3 border-b border-gray-100 text-[13px] items-center hover:bg-gray-50">
                    <div>
                      <div className="font-semibold">{f.name}</div>
                      <div className="text-[11px] text-gray-400">{f.description}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${f.stages?.stage_num === 0 ? 'bg-green-100 text-green-700' : f.stages?.stage_num === 1 ? 'bg-blue-100 text-blue-700' : f.stages?.stage_num === 2 ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>
                      阶段{f.stages?.stage_num}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${f.recommendation === '必须使用' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                      {f.recommendation}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${f.feature_type === '通用' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                      {f.feature_type}
                    </span>
                    <span className="text-[12px]">{f.access_method}</span>
                    <span className="text-[12px]">{f.estimated_duration}</span>
                    <span onClick={() => openEditForm(f)} className="text-primary-500 text-[12px] cursor-pointer hover:underline">编辑</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeMenu === 'stages' && (
            <div>
              <div className="text-[15px] font-bold mb-4">阶段规则配置</div>
              <div className="space-y-3">
                {stages.map(s => (
                  <div key={s.id} className="bg-white rounded-xl p-5 border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[11px] font-bold text-gray-400">阶段 {s.stage_num}</span>
                      <span className="text-[14px] font-bold">{s.name}</span>
                      <span className="text-[11px] text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">{s.duration}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[12px]">
                      <div><span className="text-gray-400">工作量：</span>{s.game_workload}</div>
                      <div><span className="text-gray-400">适合项目：</span>{s.suitable_for}</div>
                      <div><span className="text-gray-400">接入目标：</span>{s.goal}</div>
                      <div><span className="text-gray-400">前置条件：</span>{s.prerequisite}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeMenu === 'docs' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-[15px] font-bold">文档管理 · 共{documents.length}个文档</div>
                <button onClick={() => { setDocForm({ title: '', description: '', category: '接入文档', file_url: '', related_stage: null }); setEditDocId(null); setShowDocForm(true) }} className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-[12px] hover:bg-primary-600">＋ 新增文档</button>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-[2fr_100px_80px_100px_80px] px-5 py-3 bg-gray-50 text-[12px] text-gray-400 font-semibold border-b border-gray-200">
                  <span>文档名称</span><span>分类</span><span>关联阶段</span><span>创建时间</span><span>操作</span>
                </div>
                {documents.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">暂无文档</div>
                ) : documents.map(doc => (
                  <div key={doc.id} className="grid grid-cols-[2fr_100px_80px_100px_80px] px-5 py-3 border-b border-gray-100 text-[13px] items-center hover:bg-gray-50">
                    <div>
                      <div className="font-semibold">{doc.title}</div>
                      <div className="text-[11px] text-gray-400">{doc.description}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      doc.category === '接入文档' ? 'bg-blue-50 text-blue-600' :
                      doc.category === '使用手册' ? 'bg-green-50 text-green-600' :
                      doc.category === '测试用例' ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-600'
                    }`}>{doc.category}</span>
                    <span className="text-[12px]">
                      {doc.related_stage !== null && doc.related_stage !== undefined ? (
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${stages.find(s => s.stage_num === doc.related_stage) ? ['', 'bg-green-100 text-green-700', 'bg-blue-100 text-blue-700', 'bg-amber-100 text-amber-700', 'bg-purple-100 text-purple-700'][doc.related_stage + 1] : 'bg-gray-100 text-gray-600'}`}>
                          阶段{doc.related_stage}
                        </span>
                      ) : '-'}
                    </span>
                    <span className="text-[12px] text-gray-400">{doc.created_at?.slice(0, 10)}</span>
                    <div className="flex gap-2">
                      <span onClick={() => { setDocForm({ title: doc.title, description: doc.description || '', category: doc.category, file_url: doc.file_url || '', related_stage: doc.related_stage }); setEditDocId(doc.id); setShowDocForm(true) }} className="text-primary-500 text-[12px] cursor-pointer hover:underline">编辑</span>
                      <span onClick={async () => { if (confirm('确认删除该文档？')) { await supabase.from('documents').delete().eq('id', doc.id); fetchData() } }} className="text-red-500 text-[12px] cursor-pointer hover:underline">删除</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeMenu === 'overview' && (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg mb-2">👥</p>
              <p>项目进度总览开发中…</p>
            </div>
          )}
        </div>
      </div>

      {/* 编辑弹窗 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/45 z-[100] flex items-center justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-7 w-[560px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-[16px] font-bold mb-5">{editFeature ? '编辑功能' : '新增功能'}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">所属阶段 <span className="text-red-500">*</span></label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500" value={form.stage_id || ''} onChange={e => setForm({...form, stage_id: parseInt(e.target.value)})}>
                  <option value="">请选择阶段</option>
                  {stages.map(s => (
                    <option key={s.id} value={s.id}>阶段{s.stage_num} · {s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">功能名称 <span className="text-red-500">*</span></label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">功能说明</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">推荐等级</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none" value={form.recommendation} onChange={e => setForm({...form, recommendation: e.target.value})}>
                  <option>必须使用</option><option>推荐使用</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">功能类型</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none" value={form.feature_type} onChange={e => setForm({...form, feature_type: e.target.value})}>
                  <option>通用</option><option>非通用</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">接入方式</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none" value={form.access_method} onChange={e => setForm({...form, access_method: e.target.value})}>
                  <option>开通权限</option><option>游戏接入</option><option>平台开发</option><option>游戏接入+平台开发</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">工期预估</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500" value={form.estimated_duration} onChange={e => setForm({...form, estimated_duration: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">平台负责</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500" value={form.platform_responsibility} onChange={e => setForm({...form, platform_responsibility: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">项目组负责</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500" value={form.team_responsibility} onChange={e => setForm({...form, team_responsibility: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">备注 <span className="text-gray-400 font-normal">（接入时需要项目组提供的物料、配置表、数据库地址等）</span></label>
                <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500 resize-none" value={form.team_needs} onChange={e => setForm({...form, team_needs: e.target.value})} rows={3} placeholder="如：需提供角色配置表、数据库连接地址等" />
              </div>
            </div>
            <div className="flex gap-2.5 justify-end mt-5">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50">取消</button>
              <button onClick={saveFeature} className="px-4 py-2 bg-primary-500 text-white rounded-lg text-[13px] font-medium hover:bg-primary-600">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* 文档编辑弹窗 */}
      {showDocForm && (
        <div className="fixed inset-0 bg-black/45 z-[100] flex items-center justify-center" onClick={() => setShowDocForm(false)}>
          <div className="bg-white rounded-2xl p-7 w-[560px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-[16px] font-bold mb-5">{editDocId ? '编辑文档' : '新增文档'}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">文档名称 <span className="text-red-500">*</span></label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500" value={docForm.title} onChange={e => setDocForm({...docForm, title: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">文档说明</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500" value={docForm.description} onChange={e => setDocForm({...docForm, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">文档分类</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none" value={docForm.category} onChange={e => setDocForm({...docForm, category: e.target.value})}>
                  <option>接入文档</option><option>使用手册</option><option>测试用例</option><option>其他</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">关联阶段</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none" value={docForm.related_stage ?? ''} onChange={e => setDocForm({...docForm, related_stage: e.target.value === '' ? null : parseInt(e.target.value)})}>
                  <option value="">无</option>
                  {stages.map(s => (
                    <option key={s.id} value={s.stage_num}>阶段{s.stage_num} · {s.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">文件链接</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-primary-500" placeholder="粘贴文件URL，如 https://example.com/doc" value={docForm.file_url} onChange={e => setDocForm({...docForm, file_url: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-2.5 justify-end mt-5">
              <button onClick={() => setShowDocForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50">取消</button>
              <button onClick={async () => {
                if (!docForm.title) { alert('请填写文档名称'); return }
                if (editDocId) {
                  // 编辑模式：更新已有文档
                  await supabase.from('documents').update({
                    title: docForm.title,
                    description: docForm.description,
                    category: docForm.category,
                    file_url: docForm.file_url,
                    related_stage: docForm.related_stage,
                    updated_at: new Date().toISOString(),
                  }).eq('id', editDocId)
                } else {
                  // 新增模式：插入新文档
                  const { data: maxSort } = await supabase.from('documents').select('sort_order').order('sort_order', { ascending: false }).limit(1).single()
                  await supabase.from('documents').insert({
                    title: docForm.title,
                    description: docForm.description,
                    category: docForm.category,
                    file_url: docForm.file_url,
                    related_stage: docForm.related_stage,
                    sort_order: (maxSort?.sort_order || 0) + 1,
                  })
                }
                setShowDocForm(false)
                setEditDocId(null)
                fetchData()
              }} className="px-4 py-2 bg-primary-500 text-white rounded-lg text-[13px] font-medium hover:bg-primary-600">{editDocId ? '更新' : '保存'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
