-- ============================================
-- 游戏运营后台接入管理系统 · 数据库初始化
-- 使用方法：复制全部内容，粘贴到 Supabase SQL Editor 中执行
-- ============================================

-- 1. 阶段规则表
CREATE TABLE IF NOT EXISTS stages (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stage_num INTEGER NOT NULL UNIQUE,          -- 0, 1, 2, 3
  name VARCHAR(50) NOT NULL,                   -- 超轻量接入包
  description TEXT,                            -- 定位描述
  duration VARCHAR(20),                        -- 0.5h / 3-7天
  game_workload VARCHAR(100),                  -- 无需介入 / 按文档开发 / 纯定制
  suitable_for TEXT,                           -- 适合项目类型
  goal TEXT,                                   -- 接入目标
  prerequisite TEXT,                           -- 前置条件
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 功能库表（核心配置表）
CREATE TABLE IF NOT EXISTS features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,                  -- 功能名称
  description TEXT,                            -- 功能说明（一句话）
  stage_id INTEGER NOT NULL REFERENCES stages(id),
  recommendation VARCHAR(20) NOT NULL DEFAULT '推荐使用',  -- 必须使用 / 推荐使用
  feature_type VARCHAR(20) NOT NULL DEFAULT '通用',       -- 通用 / 非通用
  access_method VARCHAR(20) NOT NULL DEFAULT '开通权限',  -- 开通权限 / 需要开发
  estimated_duration VARCHAR(20),              -- 0.5h / 2天 / 3天
  platform_responsibility TEXT,                -- 平台负责什么
  team_responsibility TEXT,                    -- 项目组负责什么
  team_needs TEXT,                             -- 项目组需要提供什么
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 项目表
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_name VARCHAR(100) NOT NULL,
  game_id VARCHAR(50) NOT NULL,
  region VARCHAR(50),                          -- 发行地区
  business_type VARCHAR(20) DEFAULT '自研',     -- 自研 / 代理
  db_type VARCHAR(20) DEFAULT '中心数据库',     -- 独立数据库 / 中心数据库
  department VARCHAR(50),                      -- 事业部
  leader_name VARCHAR(50),                     -- 负责人姓名
  leader_contact VARCHAR(100),                 -- 负责人联系方式
  environments TEXT[],                         -- 接入环境数组
  launch_date DATE,                            -- 计划对外日期
  stage_id INTEGER REFERENCES stages(id),      -- 当前阶段
  status VARCHAR(20) DEFAULT '接入中',          -- 接入中 / 已完成 / 暂停
  total_features INTEGER DEFAULT 0,            -- 已选功能总数
  completed_features INTEGER DEFAULT 0,        -- 已完成数
  notes TEXT,                                  -- 备注
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 项目-功能关联表（记录每个项目选了哪些功能及其状态）
CREATE TABLE IF NOT EXISTS project_features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES features(id),
  batch INTEGER DEFAULT 1,                     -- 分批：第1轮 / 第2轮
  status VARCHAR(20) DEFAULT '待接入',          -- 待接入/开发中/联调中/测试中/已完成
  work_order_url TEXT,                         -- 关联工单链接
  notes TEXT,
  status_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, feature_id)
);

-- 5. 时间线记录表
CREATE TABLE IF NOT EXISTS project_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  event TEXT NOT NULL,                         -- 事件描述
  event_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 系统配置表（存管理密钥等）
CREATE TABLE IF NOT EXISTS system_config (
  key VARCHAR(50) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 插入默认阶段数据
-- ============================================
INSERT INTO stages (stage_num, name, description, duration, game_workload, suitable_for, goal, prerequisite, sort_order) VALUES
(0, '超轻量接入包', '无需游戏侧介入，平台开通权限即可快速使用基础运营能力', '0.5h', '无需介入', '新项目首轮验证期', '快速验证数据表现', '无', 0),
(1, '基础接入包', '在阶段0基础上新增，按文档开发几乎无需定制', '3-7天', '按文档开发，几乎无需定制', '有数据基础的项目推广期、换皮项目', '深度触达玩家游戏体验', '阶段0已完成', 1),
(2, '升级接入包', '在阶段1基础上新增，小部分需配合定制', '7-14天', '按文档开发，小部分需配合定制', '稳定运营期项目、战略级项目', '规模化运营、定制化需求', '阶段1已完成', 2),
(3, '深度开发包', '在阶段2基础上新增，纯定制需深度协作联合评审', '7-14天', '纯定制，需深度协作联合评审', '长期核心项目、特殊生态头部产品', '深度定制运营能力、差异化竞争优势', '需技术可行性评审 + ROI评估', 3);

-- ============================================
-- 插入示例功能数据
-- ============================================
INSERT INTO features (name, description, stage_id, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, sort_order) VALUES
-- 阶段0
('数据报表', 'DAU、收入、留存等核心游戏数据大盘', 1, '必须使用', '通用', '开通权限', '0.5h', '配置数据看板、开通权限', '无', 1),
('公告管理', '游戏内滚动公告、活动公告发布', 1, '必须使用', '通用', '开通权限', '0.5h', '开通公告模块权限', '无', 2),
('权限管理', '游戏运营后台的基础访问权限配置', 1, '必须使用', '通用', '开通权限', '0.5h', '开通后台权限、配置角色', '提交人员名单', 3),
-- 阶段1
('渠道管理', '管理游戏各渠道的分包和分发配置', 2, '必须使用', '非通用', '需要开发', '2天', '提供渠道SDK、技术支持', '游戏侧接入渠道SDK', 4),
('服务器管理', '区服创建、合服、维护等管理操作', 2, '必须使用', '非通用', '需要开发', '3天', '提供服务器管理接口', '游戏侧对接服务器接口', 5),
('邮件系统', '向玩家发送游戏内邮件（道具、通知等）', 2, '推荐使用', '非通用', '需要开发', '2天', '提供邮件发送API', '游戏侧接入邮件接口', 6),
('活动配置', '通用游戏运营活动模板配置与发布', 2, '推荐使用', '通用', '开通权限', '0.5h', '配置活动模板', '无', 7),
-- 阶段2
('礼包码管理', '批量生成和核销礼包码，支持多渠道发放', 3, '推荐使用', '通用', '开通权限', '0.5h', '开通礼包码模块', '提供礼包配置表', 8),
('充值日志', '玩家充值流水查询与对账', 3, '推荐使用', '非通用', '需要开发', '3天', '提供充值对账接口', '游戏侧对接支付回调', 9),
('VIP系统', '玩家VIP等级配置与权益管理', 3, '推荐使用', '非通用', '需要开发', '3天', '提供VIP配置后台', '游戏侧实现VIP逻辑', 10),
('竞技场排行', '游戏内竞技场排行榜配置与展示', 3, '推荐使用', '非通用', '需要开发', '5天', '提供排行榜接口', '游戏侧对接排行榜', 11),
('客服工单', '玩家问题反馈与客服工单管理', 3, '推荐使用', '通用', '开通权限', '0.5h', '开通客服模块', '无', 12),
-- 阶段3
('实时聊天', '游戏内实时聊天系统（世界/公会/私聊）', 4, '推荐使用', '非通用', '需要开发', '7天', '提供聊天服务器', '游戏侧深度接入聊天系统', 13),
('公会系统', '公会创建、管理、排行等功能', 4, '推荐使用', '非通用', '需要开发', '7天', '提供公会管理后台', '游戏侧实现公会逻辑', 14),
('自定义运营活动', '完全定制的运营活动开发', 4, '推荐使用', '非通用', '需要开发', '14天', '联合开发活动功能', '提供活动需求文档、配合联调', 15),
('数据分析平台', '深度玩家行为分析与精细化运营', 4, '推荐使用', '非通用', '需要开发', '14天', '提供数据分析工具', '提供埋点需求、配合实施', 16);

-- ============================================
-- 插入默认管理员密钥
-- ============================================
INSERT INTO system_config (key, value) VALUES
('admin_key', 'gameops2026'),
('system_name', '游戏接入Hub');

-- ============================================
-- Row Level Security（关键！控制前端访问权限）
-- ============================================

-- 公开读取：所有表都允许匿名读取
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- stages: 所有人可读
CREATE POLICY "Public read stages" ON stages FOR SELECT USING (true);

-- features: 所有人可读（仅启用的）
CREATE POLICY "Public read active features" ON features FOR SELECT USING (is_active = true);

-- projects: 所有人可读、可创建、可更新
CREATE POLICY "Public read projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Public insert projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update projects" ON projects FOR UPDATE USING (true);

-- project_features: 所有人可读、可创建、可更新
CREATE POLICY "Public read project_features" ON project_features FOR SELECT USING (true);
CREATE POLICY "Public insert project_features" ON project_features FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update project_features" ON project_features FOR UPDATE USING (true);

-- project_timeline: 所有人可读、可创建
CREATE POLICY "Public read project_timeline" ON project_timeline FOR SELECT USING (true);
CREATE POLICY "Public insert project_timeline" ON project_timeline FOR INSERT WITH CHECK (true);

-- system_config: 仅可读取，不允许前端直接修改密钥
CREATE POLICY "Public read system_config" ON system_config FOR SELECT USING (true);

-- ============================================
-- 创建视图：项目进度统计
-- ============================================
CREATE OR REPLACE VIEW project_progress AS
SELECT 
  p.id as project_id,
  p.game_name,
  p.status,
  COUNT(pf.id) as total_features,
  COUNT(pf.id) FILTER (WHERE pf.status = '已完成') as completed_features,
  COUNT(pf.id) FILTER (WHERE pf.status = '开发中') as dev_count,
  COUNT(pf.id) FILTER (WHERE pf.status = '联调中') as integration_count,
  COUNT(pf.id) FILTER (WHERE pf.status = '测试中') as testing_count,
  COUNT(pf.id) FILTER (WHERE pf.status = '待接入') as pending_count
FROM projects p
LEFT JOIN project_features pf ON p.id = pf.project_id
GROUP BY p.id, p.game_name, p.status;
