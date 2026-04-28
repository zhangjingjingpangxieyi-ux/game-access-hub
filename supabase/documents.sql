-- 文档表
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT '接入文档',
  file_url TEXT,
  file_type VARCHAR(50),
  related_stage INTEGER,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read documents" ON documents FOR SELECT USING (is_active = true);
CREATE POLICY "Public insert documents" ON documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update documents" ON documents FOR UPDATE USING (true);
CREATE POLICY "Public delete documents" ON documents FOR DELETE USING (true);

-- 插入示例文档
INSERT INTO documents (title, description, category, file_url, file_type, related_stage, sort_order) VALUES
('运营后台接入指南（阶段0）', '超轻量接入包完整接入流程文档，包含权限开通、基础配置步骤', '接入文档', '#', 'PDF', 0, 1),
('数据报表对接说明', 'DAU/收入/留存等核心数据看板配置指南', '接入文档', '#', 'PDF', 0, 2),
('公告系统使用手册', '游戏内公告管理模块操作指南', '使用手册', '#', 'PDF', 0, 3),
('渠道SDK接入文档', '各渠道分包和分发配置的技术接入文档', '接入文档', '#', 'Word', 1, 4),
('服务器管理接口文档', '区服创建、合服、维护等管理API文档', '接入文档', '#', 'PDF', 1, 5),
('邮件系统接入指南', '游戏内邮件系统对接API文档', '接入文档', '#', 'PDF', 1, 6),
('礼包码系统说明', '礼包码批量生成和核销流程说明', '接入文档', '#', 'PDF', 2, 7),
('充值对账接入文档', '支付回调对接与对账流程文档', '接入文档', '#', 'Word', 2, 8),
('实时聊天系统架构文档', '聊天服务器架构设计与接入方案', '技术文档', '#', 'PDF', 3, 9),
('公会系统设计文档', '公会创建、管理、排行功能设计方案', '设计文档', '#', 'PDF', 3, 10);
