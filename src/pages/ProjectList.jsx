import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const STATUS_COLORS = {
  '接入中': 'bg-blue-100 text-blue-700',
  '已完成': 'bg-green-100 text-green-700',
  '暂停': 'bg-gray-100 text-gray-500',
}

const STAGE_COLORS = {
  0: 'bg-green-100 text-green-700',
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-amber-100 text-amber-700',
  3: 'bg-purple-100 text-purple-700',
}

export default function ProjectList() {
  const [projects, setProjects] = useState([])
  const [progress, setProgress] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    setLoading(true)
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
      setLoading(false)
      return
    }

    setProjects(data || [])

    // 拉取进度统计
    const { data: progressData } = await supabase
      .from('project_features')
      .select('project_id, status')

    if (progressData) {
      const stats = {}
      progressData.forEach(row => {
        if (!stats[row.project_id]) {
          stats[row.project_id] = { total: 0, completed: 0 }
        }
        stats[row.project_id].total++
        if (row.status === '已完成') stats[row.project_id].completed++
      })
      setProgress(stats)
    }
    setLoading(false)
  }

  const filtered = projects.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false
    if (filter.startsWith('阶段') && p.stage_id !== parseInt(filter.replace('阶段', '')) + 1) return false
    if (search && !p.game_name.toLowerCase().includes(search.toLowerCase()) && !p.game_id.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === '接入中').length,
    done: projects.filter(p => p.status === '已完成').length,
    paused: projects.filter(p => p.status === '暂停').length,
  }

  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">游戏项目接入管理</h1>
          <p className="text-[13px] text-gray-400 mt-1">追踪所有游戏项目的运营后台接入状态</p>
        </div>
        <Link to="/new" className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white rounded-lg text-[13px] font-medium hover:bg-primary-600 transition-colors">
          ＋ 新建项目
        </Link>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '全部项目', val: stats.total, color: 'text-primary-500' },
          { label: '接入中', val: stats.active, color: 'text-amber-500' },
          { label: '已完成', val: stats.done, color: 'text-green-500' },
          { label: '暂停', val: stats.paused, color: 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-[18px_20px] border border-gray-200">
            <div className="text-[12px] text-gray-400 mb-2">{s.label}</div>
            <div className={`text-[26px] font-bold ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* 筛选栏 */}
      <div className="flex gap-2.5 mb-5 items-center">
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-[13px] text-gray-400 w-[220px]">
          <span>🔍</span>
          <input
            type="text"
            placeholder="搜索游戏名称 / ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent outline-none flex-1 text-gray-700 placeholder-gray-400"
          />
        </div>
        {['all', '接入中', '已完成', '暂停'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-[12px] border transition-colors ${
              filter === f
                ? 'bg-primary-50 border-primary-500 text-primary-600 font-semibold'
                : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? '全部' : f}
          </button>
        ))}
      </div>

      {/* 项目表格 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-[2fr_80px_100px_140px_120px_100px_100px] px-5 py-3 bg-gray-50 text-[12px] text-gray-400 font-semibold border-b border-gray-200">
          <span>游戏项目</span>
          <span>阶段</span>
          <span>发行地区</span>
          <span>接入进度</span>
          <span>计划对外</span>
          <span>负责人</span>
          <span>状态</span>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">加载中…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">📋</p>
            <p>暂无项目，点击右上角「新建项目」开始</p>
          </div>
        ) : (
          filtered.map(p => {
            const prog = progress[p.id] || { total: 0, completed: 0 }
            const pct = prog.total > 0 ? Math.round(prog.completed / prog.total * 100) : 0
            const stageNum = p.stage_id ? p.stage_id - 1 : 0
            return (
              <Link
                key={p.id}
                to={`/project/${p.id}`}
                className="grid grid-cols-[2fr_80px_100px_140px_120px_100px_100px] px-5 py-3.5 border-b border-gray-100 text-[13px] items-center hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div>
                  <div className="font-semibold">{p.game_name}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{p.game_id} · {p.business_type} · {p.department}</div>
                </div>
                <span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${STAGE_COLORS[stageNum]}`}>
                    阶段{stageNum}
                  </span>
                </span>
                <span>{p.region}</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-[5px] bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[11px] text-gray-500 whitespace-nowrap">{prog.completed}/{prog.total}</span>
                </div>
                <span className="text-gray-500">{p.launch_date}</span>
                <span>{p.leader_name}</span>
                <span>
                  <span className={`inline-block w-[7px] h-[7px] rounded-full mr-1.5 ${
                    p.status === '接入中' ? 'bg-blue-500' :
                    p.status === '已完成' ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  {p.status}
                </span>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
