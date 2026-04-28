-- ============================================
-- 接入流程阶段步骤表 迁移脚本
-- 从 7 条步骤 → 8 阶段步骤
-- 在 Supabase SQL Editor 中执行
-- ============================================

-- 1. 清空旧数据并重置自增
TRUNCATE access_steps RESTART IDENTITY;

-- 2. 删除旧的 per_feature 相关表（不再需要逐功能步骤）
-- project_feature_steps 表已废弃
DROP TABLE IF EXISTS project_feature_steps;

-- 3. 插入新的 8 阶段步骤（全部为 global 类型）
INSERT INTO access_steps (step_name, responsible_role, step_type, sort_order) VALUES
('配置控制中心添加版本', '运维', 'global', 1),
('版本/功能绑定', 'PM', 'global', 2),
('权限开通', 'PM', 'global', 3),
('添加功能配置表', 'PM', 'global', 4),
('开区服、配渠道', '运维/运营', 'global', 5),
('功能开发', '项目组', 'global', 6),
('测试验收', '项目组', 'global', 7),
('满意度问卷填写', 'PM/项目组', 'global', 8);

-- 4. 清空旧的项目步骤记录（因为 step_id 变了，需要重新初始化）
TRUNCATE project_global_steps;

-- 5. 重建所有项目的全局步骤记录
INSERT INTO project_global_steps (project_id, step_id, is_completed)
SELECT p.id, s.id, false
FROM projects p
CROSS JOIN access_steps s
WHERE s.is_active = true;

-- ============================================
-- 添加 step_category 字段用于区分阶段类型
-- checkbox = 单点勾选任务（①②③④⑤⑧）
-- kanban = 看板容器（⑥⑦）
-- ============================================
ALTER TABLE access_steps ADD COLUMN IF NOT EXISTS step_category VARCHAR(20) DEFAULT 'checkbox';

UPDATE access_steps SET step_category = 'kanban' WHERE sort_order IN (6, 7);

-- ============================================
-- 更新功能状态可选值说明
-- ⑥ 功能开发：待开发 / 开发中 / 联调中
-- ⑦ 测试验收：测试中 / 待验收 / 已通过
-- project_features.status 字段的可用值扩展
-- ============================================

-- 验证结果
SELECT id, step_name, responsible_role, step_type, step_category, sort_order
FROM access_steps
ORDER BY sort_order;

SELECT '迁移完成！已更新为 8 阶段步骤，project_feature_steps 表已废弃' as status;
