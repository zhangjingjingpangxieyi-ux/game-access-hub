-- ============================================
-- 数据初始化脚本（自动生成）
-- 功能库 + 文档清单
-- 在 Supabase SQL Editor 中执行
-- ============================================

-- 清空旧数据
DELETE FROM project_features;
DELETE FROM features;
DELETE FROM documents;
-- UUID 主键，无需重置序列

-- ============================================
-- 插入 52 个功能
-- ============================================
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('渠道管理', '', '必须使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 0), 1, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('通行证查询', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 0), 2, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('沙盒用户管理', '', '必须使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 0), 3, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('黑名单管理', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 0), 4, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('防刷白名单', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 0), 5, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('账号绑定管理', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 0), 6, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('网上支付订单', '', '必须使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 0), 7, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('运营人员使用的相关报表', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 0), 8, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('投放人员使用的相关报表', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 0), 9, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('公告', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 1), 10, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('邮件', '', '推荐使用', '通用', '开通权限', '', '', '', '物品表（GoodsInfo），填写模板参考', (SELECT id FROM stages WHERE stage_num = 1), 11, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('邮件-指定角色校验兼容', '', '推荐使用', '通用', '游戏接入', '', '', '', '数据库不在中心库的游戏，需要兼容：1.自研游戏：提供数据库地址，并指定区服查询，2.外部游戏：提供调用接口查询', (SELECT id FROM stages WHERE stage_num = 1), 12, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('兑换码', '', '推荐使用', '通用', '开通权限', '', '', '', '物品表（GoodsInfo），填写模板参考', (SELECT id FROM stages WHERE stage_num = 1), 13, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('调查问卷', '', '推荐使用', '通用', '开通权限', '', '', '', '物品表（GoodsInfo），填写模板参考', (SELECT id FROM stages WHERE stage_num = 1), 14, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('问卷-指定角色校验兼容', '', '推荐使用', '通用', '游戏接入', '', '', '', '数据库不在中心库的游戏，需要兼容：1.自研游戏：提供数据库地址，并指定区服查询，2.外部游戏：提供调用接口查询', (SELECT id FROM stages WHERE stage_num = 1), 15, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('广播', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 1), 16, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('用户反馈', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 1), 17, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('内部号管理', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 1), 18, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('角色名审核', '', '必须使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 1), 19, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('内部充值', '', '推荐使用', '通用', '开通权限', '', '', '', '①若需发送“充值项”需提供充值项查询接口或配置表 ，填写模板参考', (SELECT id FROM stages WHERE stage_num = 1), 20, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('真实玩家补单', '', '推荐使用', '通用', '开通权限', '', '', '', '①需提供充值项查询接口或配置表 ，填写模板参考', (SELECT id FROM stages WHERE stage_num = 1), 21, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('流失干预', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 2), 22, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('邮件-角色邮件查询及回收', '', '推荐使用', '通用', '游戏接入+平台开发', '', '', '', '列表查询外部游戏需游戏提供接口调用，删除邮件由游戏提供接口平台调用', (SELECT id FROM stages WHERE stage_num = 2), 23, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('应用推送：平台推送', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 2), 24, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('应用推送：游戏自定义推送', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 2), 25, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('弹窗管理', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 2), 26, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('GS管理', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 2), 27, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('会员积分商城', '', '推荐使用', '通用', '开通权限', '', '', '', '①H5设计稿
②海外版本提供翻译物料
③道具图标（以图片id命名）', (SELECT id FROM stages WHERE stage_num = 2), 28, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('大玩家', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 2), 29, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('主播管理', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 2), 30, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('图片审核', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 2), 31, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('内部号管理', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 2), 32, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('玩家信息管理', '', '推荐使用', '通用', '游戏接入', '', '', '', '①下方填写需查询字段
② 提供查询接口或查询地址，如自研游戏可不提供', (SELECT id FROM stages WHERE stage_num = 2), 33, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('角色物品回收', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 2), 34, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('角色复制', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 2), 35, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('角色迁移', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 2), 36, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('海外Apple SKAN 归因', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 2), 37, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('广告变现收入数据查询', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 2), 38, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('AI呼叫', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 2), 39, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('专属客服', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 2), 40, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('直充服务', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 2), 41, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('退款管理', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 2), 42, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('订单拦截管理', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 2), 43, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('QQ群管理', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 3), 44, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('聊天频道管理', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 3), 45, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('推送配置', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 3), 46, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('红包活动', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 3), 47, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('社区入口配置', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 3), 48, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('优惠券管理', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 3), 49, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('联盟管理', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 3), 50, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('联盟报表', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 3), 51, true);
INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('玩家信息字段配置表', '', '推荐使用', '通用', '开通权限', '', '', '', '', (SELECT id FROM stages WHERE stage_num = 3), 52, true);

-- ============================================
-- 插入 105 条文档
-- ============================================
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 公告 - 技术接入文档', '根据运营场景，可针对不同区服/渠道/角色等维度，在指定游戏场景（如登录页、活动页）投放文本或banner公告', '接入文档', 'https://q1doc.yuque.com/staff-nseb80/it/bgd9eo?singleDoc# 《通用运营系统技术接入文档（多个功能）》 密码：hq5c', NULL, 1);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 公告 - 使用手册', '根据运营场景，可针对不同区服/渠道/角色等维度，在指定游戏场景（如登录页、活动页）投放文本或banner公告', '使用手册', 'https://q1doc.yuque.com/staff-nseb80/it/srgti8?singleDoc# 《公告-使用手册》', NULL, 2);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 公告 - 验收标准', '项目组自行验收，根据提供的测试用例进行测试验收：https://q1doc.yuque.com/ftdehn/apmo7x/hhi7rv012hwzgskq', '测试用例', '', NULL, 3);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 广播 - 技术接入文档', '根据运营场景，可针对不同区服/渠道/角色等维度，在指定游戏场景（如聊天窗、悬浮框等）投放广播消息', '接入文档', 'https://q1doc.yuque.com/staff-nseb80/it/bgd9eo?singleDoc# 《通用运营系统技术接入文档（多个功能）》 密码：hq5c', NULL, 4);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 广播 - 使用手册', '根据运营场景，可针对不同区服/渠道/角色等维度，在指定游戏场景（如聊天窗、悬浮框等）投放广播消息', '使用手册', 'https://q1doc.yuque.com/staff-nseb80/it/dfqsbs?singleDoc# 《广播-使用手册》', NULL, 5);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 广播 - 验收标准', '项目组自行验收，根据提供的测试用例进行测试验收：https://q1doc.yuque.com/ftdehn/apmo7x/hhi7rv012hwzgskq', '测试用例', '', NULL, 6);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 邮件 - 技术接入文档', '根据运营场景，可针对不同区服/渠道/角色等维度，发送物品、通知等信息', '接入文档', 'https://q1doc.yuque.com/staff-nseb80/it/bgd9eo?singleDoc# 《通用运营系统技术接入文档（多个功能）》 密码：hq5c', NULL, 7);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 邮件 - 使用手册', '根据运营场景，可针对不同区服/渠道/角色等维度，发送物品、通知等信息', '使用手册', 'https://q1doc.yuque.com/staff-nseb80/it/tzeq0w?singleDoc# 《邮件-使用手册》', NULL, 8);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 邮件 - 验收标准', '项目组自行验收，根据提供的测试用例进行测试验收：https://q1doc.yuque.com/ftdehn/apmo7x/hhi7rv012hwzgskq', '测试用例', '', NULL, 9);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 角色邮件查询及回收 - 技术接入文档', '角色所有邮件查询及回收（含平台发送及游戏内衍生邮件）', '接入文档', 'https://q1doc.yuque.com/staff-nseb80/it/fu7dgb6imqy124lk?singleDoc# 《角色邮件》 密码：pgeq', NULL, 10);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 兑换码 - 技术接入文档', '根据游戏运营需求，可针对不同区服/渠道/角色配置不同物品奖励的兑换码（支持设置多种限制领取条件）', '接入文档', 'https://q1doc.yuque.com/staff-nseb80/it/bgd9eo?singleDoc# 《通用运营系统技术接入文档（多个功能）》 密码：hq5c', NULL, 11);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 兑换码 - 验收标准', '项目组自行验收，根据提供的测试用例进行测试验收：https://q1doc.yuque.com/ftdehn/apmo7x/hhi7rv012hwzgskq', '测试用例', '', NULL, 12);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 调查问卷 - 技术接入文档', '根据游戏运营需求，可针对不同区服/渠道/角色生成并投放线上问卷（支持游戏内派奖）', '接入文档', 'https://q1doc.yuque.com/staff-nseb80/it/akr60m?singleDoc# 《问卷管理接入文档》 密码：tni9', NULL, 13);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 调查问卷 - 使用手册', '根据游戏运营需求，可针对不同区服/渠道/角色生成并投放线上问卷（支持游戏内派奖）', '使用手册', 'https://q1doc.yuque.com/staff-nseb80/it/vdtsmu?singleDoc# 《调查问卷-使用手册》', NULL, 14);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 调查问卷 - 验收标准', '项目组自行验收，根据提供的测试用例进行测试验收：https://q1doc.yuque.com/ftdehn/apmo7x/hhi7rv012hwzgskq', '测试用例', '', NULL, 15);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 应用推送：平台推送 - 技术接入文档', '根据游戏运营需求，可针对不同渠道/玩家向Android、iOS等设备推送应用消息', '接入文档', 'iOS：https://open.q1.com/doc?url=%2Fopendocs%2Fweb%2F%23%2F48%2F1002
Android：https://open.q1.com/doc?url=%2Fopendocs%2Fweb%2F%23%2F48%2F1023', NULL, 16);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 应用推送：平台推送 - 使用手册', '根据游戏运营需求，可针对不同渠道/玩家向Android、iOS等设备推送应用消息', '使用手册', 'https://q1doc.yuque.com/staff-nseb80/it/ilpln2?singleDoc# 《自定义推送（海外安卓）Firebase证书获取》 密码：bzyi
https://q1doc.yuque.com/staff-nseb80/it/pbbo6d?singleDoc# 《应用推送-使用手册》 密码：canz', NULL, 17);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 应用推送：平台推送 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 18);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 应用推送：游戏自定义推送 - 技术接入文档', '游戏调用平台封装的推送接口，自行向埋点玩家推送应用消息', '接入文档', 'https://q1doc.yuque.com/staff-nseb80/it/rlt263n6wb11zlq6?singleDoc# 《游戏App系统推送-接入文档》 密码：dima', NULL, 19);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 弹窗管理 - 技术接入文档', '游戏内登录弹框内容设置与管理', '接入文档', 'https://q1doc.yuque.com/staff-nseb80/it/bgd9eo?singleDoc# 《通用运营系统技术接入文档（多个功能）》 密码：hq5c', NULL, 20);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 弹窗管理 - 使用手册', '游戏内登录弹框内容设置与管理', '使用手册', 'https://q1doc.yuque.com/staff-nseb80/it/mfwc7w?singleDoc# 《活动弹窗管理-使用手册》', NULL, 21);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 弹窗管理 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 22);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 弹窗统计 - 技术接入文档', '配置弹窗埋点上报统计', '接入文档', 'https://q1doc.yuque.com/od352a/erk17w/seg5gh?singleDoc#', NULL, 23);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] GS管理 - 使用手册', 'GS任务分配及进驻数据追踪', '使用手册', 'https://q1doc.yuque.com/staff-nseb80/it/uoun2o8dzg3g8mb9?singleDoc# 《新GS管理-使用手册》', NULL, 24);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 旧-GS管理 - 技术接入文档', '类似于流失干预，包括玩家充值数据查询及流失用户规则设置、监控等功能，攻守之奕游戏已使用', '接入文档', 'https://q1doc.yuque.com/staff-nseb80/it/xg3dcx', NULL, 25);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 旧-GS管理 - 使用手册', '类似于流失干预，包括玩家充值数据查询及流失用户规则设置、监控等功能，攻守之奕游戏已使用', '使用手册', 'https://q1doc.yuque.com/staff-nseb80/it/xg3dcx?singleDoc# 《GS管理模块-使用手册》', NULL, 26);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 旧-GS管理 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 27);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 指令执行 - 技术接入文档', '通过预配置游戏内埋点，进行对应的指令任务执行，如用户日志收集等', '接入文档', 'https://q1doc.yuque.com/staff-nseb80/it/bgd9eo?singleDoc# 《通用运营系统技术接入文档（多个功能）》 密码：hq5c', NULL, 28);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 指令执行 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 29);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 用户反馈 - 技术接入文档', '游戏内玩家反馈入口以及反馈记录展示', '接入文档', '新接口文档：https://q1doc.yuque.com/staff-nseb80/it/epkxw8?singleDoc# 《用户反馈-接入文档》 密码：vhhy 
老接口文档：https://q1doc.yuque.com/staff-nseb80/it/epkxw8', NULL, 30);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 用户反馈 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 31);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] QQ群管理 - 技术接入文档', 'QQ群后台配置', '接入文档', '待补充', NULL, 32);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] QQ群管理 - 使用手册', 'QQ群后台配置', '使用手册', 'https://q1doc.yuque.com/staff-nseb80/it/wnhrcbvuqkgxbk22?singleDoc# 《QQ群管理-使用手册》', NULL, 33);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] QQ群管理 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 34);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 聊天频道管理 - 技术接入文档', '多语种跨服聊天频道配置', '接入文档', '待补充', NULL, 35);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 聊天频道管理 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 36);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 会员积分商城 - 技术接入文档', '（三方充值）红钻积分兑换商城', '接入文档', 'https://q1doc.yuque.com/ftdehn/zisci8/cki48gg4hu6bowr3?singleDoc# 《外部游戏 - 红钻积分商城接入文档》 密码：vqwg
https://q1doc.yuque.com/ftdehn/zisci8/ylqiut0ec4s8ysb1?singleDoc# 《红钻积分商城 接入文档》 密码：wksh', NULL, 37);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 会员积分商城 - 使用手册', '（三方充值）红钻积分兑换商城', '使用手册', 'https://q1doc.yuque.com/staff-nseb80/it/fmxddgpsi5gy6gpd?singleDoc# 《红钻积分商城-使用手册》', NULL, 38);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 会员积分商城 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 39);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 大玩家 - 技术接入文档', '冰川级论坛社区管理系统', '接入文档', 'https://q1doc.yuque.com/ftdehn/zg8hw7/vmogow85rkkhr2dc?singleDoc# 《大玩家社区 游戏内/渠道 接入文档》 密码：bls7', NULL, 40);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 大玩家 - 使用手册', '冰川级论坛社区管理系统', '使用手册', 'https://q1doc.yuque.com/ftdehn/zg8hw7/dcw9c4hz1ay8vzal?singleDoc# 《大玩家使用手册v1.1.0》', NULL, 41);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 大玩家 - 验收标准', '放置公共访问板块：功能显示正常即可游戏嵌入式论坛：根据提供的测试用例进行测试验收(暂无文档，后续补充)', '测试用例', '', NULL, 42);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 主播管理 - 技术接入文档', '主播以及绑定的角色信息的配置、管理、福利发放等', '接入文档', 'https://q1doc.yuque.com/staff-nseb80/it/dkrgrnfi3mfpr3s7?singleDoc# 《主播管理-接入文档》 密码：wwi3', NULL, 43);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 主播管理 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 44);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 推送配置 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 45);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 区服管理 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 46);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 国家联盟 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 47);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 图片审核 - 技术接入文档', '游戏空间玩家上传的图片审核，代号S游戏已使用', '接入文档', 'https://q1doc.yuque.com/staff-nseb80/it/bgd9eo?singleDoc# 《通用运营系统技术接入文档（多个功能）》 密码：hq5c', NULL, 48);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 图片审核 - 使用手册', '游戏空间玩家上传的图片审核，代号S游戏已使用', '使用手册', 'https://q1doc.yuque.com/staff-nseb80/it/ddndpex1pu3gxc9o?singleDoc# 《图片审核-使用手册》', NULL, 49);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 图片审核 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 50);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 主播管理 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 51);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 优惠券管理 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 52);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 红包活动 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 53);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 联盟管理 - 技术接入文档', '位面2系列游戏（如灯塔、代号SC）定制用于查询游戏内联盟信息、进行联盟操作、审核管理（解散联盟、变更联盟成员阶级等）', '接入文档', 'https://q1doc.yuque.com/staff-nseb80/it/bgd9eo?singleDoc# 《通用运营系统技术接入文档（多个功能）》 密码：hq5c', NULL, 54);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 联盟管理 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 55);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 联盟报表 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 56);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 封禁管理 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 57);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 阻挡管理 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 58);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 余额管理 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 59);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 仙盟信息 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 60);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 微社区 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 61);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 社区入口配置 - 技术接入文档', '游戏内关卡配置大玩家社区入口', '接入文档', 'https://q1doc.yuque.com/ftdehn/zg8hw7/ppw3zrk9sbtnw5gs?singleDoc# 《活动入口配置（定制化）》 密码：um0s', NULL, 62);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[运营中心] 社区入口配置 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 63);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[游戏中心] 渠道组管理 - 技术接入文档', '渠道合集创建、管理，支持在公告等运营功能中一键选择预设渠道组进行投放配置', '接入文档', '无', NULL, 64);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[游戏中心] 渠道组管理 - 使用手册', '渠道合集创建、管理，支持在公告等运营功能中一键选择预设渠道组进行投放配置', '使用手册', 'https://q1doc.yuque.com/staff-nseb80/it/ioy32h8l7gzahm6p?singleDoc# 《渠道组管理-使用手册》', NULL, 65);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[游戏中心] 渠道组管理 - 验收标准', '项目组自行验收，功能、数据显示正常即可', '测试用例', '', NULL, 66);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[玩家中心] 防刷白名单 - 技术接入文档', '通过设备号、身份证、IP、PID对内部人员进行白名单添加，主要用于内部人员测试、问题排查等场景', '接入文档', '无', NULL, 67);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[玩家中心] 防刷白名单 - 验收标准', '项目组自行验收，功能、数据显示正常即可', '测试用例', '', NULL, 68);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[玩家中心] 通行证查询 - 验收标准', '项目组自行验收，功能、数据显示正常即可', '测试用例', '', NULL, 69);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[玩家中心] 沙盒用户管理 - 验收标准', '项目组自行验收，功能、数据显示正常即可', '测试用例', '', NULL, 70);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[玩家中心] 账号绑定管理 - 验收标准', '项目组自行验收，功能、数据显示正常即可', '测试用例', '', NULL, 71);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[玩家中心] 角色名审核 - 技术接入文档', '游戏内玩家角色名信息修改审核：
①支持游戏自行上报角色名审核数据
②支持查看角色审核操作日志
③海外-游戏放开改名字符限制', '接入文档', 'https://q1doc.yuque.com/staff-nseb80/it/bgd9eo?singleDoc# 《通用运营系统技术接入文档（多个功能）》 密码：hq5c', NULL, 72);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[玩家中心] 角色名审核 - 使用手册', '游戏内玩家角色名信息修改审核：
①支持游戏自行上报角色名审核数据
②支持查看角色审核操作日志
③海外-游戏放开改名字符限制', '使用手册', 'https://q1doc.yuque.com/staff-nseb80/it/vhyrgt?singleDoc# 《角色名审核-使用手册》', NULL, 73);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[玩家中心] 角色名审核 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 74);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[玩家中心] 角色名审核 - 验收标准', '建议根据提供的测试用例进行测试验收：https://q1doc.yuque.com/ftdehn/apmo7x/hhi7rv012hwzgskq', '测试用例', '', NULL, 75);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[玩家中心] 内部号管理 - 技术接入文档', '内部号管理用于统一登记并管理品质、GS、运营等内部账号（冰川账号、角色ID、游戏账号），支持白名单设备绑定，非白名单登录拦截与预警。可与【内部充值】功能联动，用于测试、活动预演、问题复现等场景，保障账号使用安全与合规。', '接入文档', 'https://q1doc.yuque.com/staff-nseb80/it/cz2iv9yzp8sg2iad

https://q1doc.yuque.com/staff-nseb80/it/lsf9vpktit9y3q3d?singleDoc# 《内部号角色 - 设备白名单查询&预警 - 接入文档》 密码：trli', NULL, 76);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[玩家中心] 内部号管理 - 使用手册', '内部号管理用于统一登记并管理品质、GS、运营等内部账号（冰川账号、角色ID、游戏账号），支持白名单设备绑定，非白名单登录拦截与预警。可与【内部充值】功能联动，用于测试、活动预演、问题复现等场景，保障账号使用安全与合规。', '使用手册', 'https://q1doc.yuque.com/staff-nseb80/it/iwey5nk6gqc1fzxk?singleDoc# 《内部号管理-使用手册》', NULL, 77);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[玩家中心] 内部号管理 - 验收标准', '建议根据提供的测试用例进行测试验收：https://q1doc.yuque.com/ftdehn/apmo7x/hhi7rv012hwzgskq', '测试用例', '', NULL, 78);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[玩家中心] 账号绑定管理 - 验收标准', '项目组自行验收，功能、数据显示正常即可', '测试用例', '', NULL, 79);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[玩家中心] 玩家信息管理 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 80);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[玩家中心] 角色物品回收 - 技术接入文档', '玩家（角色维度）道具等资源回收', '接入文档', 'https://q1doc.yuque.com/staff-nseb80/it/bgd9eo?singleDoc# 《通用运营系统技术接入文档（多个功能）》 密码：hq5c', NULL, 81);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[玩家中心] 角色基础信息管理≈玩家信息管理 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 82);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[玩家中心] 角色复制 - 技术接入文档', '内、外网角色信息复制至内网， 用于游戏、角色、bug等问题排除。跟【角色数据导出】功能搭配使用', '接入文档', '-角色复制(可参考位面2)
1.游戏库 --PrWs_RoleCopy_Get (获取角色复制信息) 
2.中心库 --PrWs_RoleCopy_Create (生成游戏帐号ID 、角色ID)
3.游戏库 --PrWs_RoleCopy_Ins（插入角色复制数据）', NULL, 83);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[玩家中心] 角色复制 - 使用手册', '内、外网角色信息复制至内网， 用于游戏、角色、bug等问题排除。跟【角色数据导出】功能搭配使用', '使用手册', 'https://q1doc.yuque.com/staff-nseb80/it/fo1vpmwitfxiugbe?singleDoc# 《角色复制功能-使用手册》', NULL, 84);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[玩家中心] 角色复制 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 85);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[玩家中心] 角色迁移 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 86);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[玩家中心] 玩家称号管理 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 87);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[数据中心] 海外Apple SKAN 归因 - 技术接入文档', '海外iOS设备归因方案，可提高广告归因成功率 30%以上', '接入文档', 'https://q1doc.yuque.com/staff-nseb80/it/nqto3hgobk6xq9d5?singleDoc#', NULL, 88);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[数据中心] 广告变现收入数据查询 - 技术接入文档', '实现广告变现收入数据上报，后台变现收入多维统计', '接入文档', '国内APP：https://q1doc.yuque.com/staff-nseb80/it/dmkzhfzb3bofbnxu?singleDoc#

微信小游戏https://q1doc.yuque.com/staff-nseb80/it/gf694pwlb99tw52q?singleDoc##

海外APPhttps://q1doc.yuque.com/staff-nseb80/it/tgtfexgwvgkmd09p?singleDoc#c#', NULL, 89);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[数据中心] 活动查询 - 技术接入文档', '按区服查询游戏内的活动列表', '接入文档', 'https://q1doc.yuque.com/staff-nseb80/it/age7ky085dnqx2fe?singleDoc# 《活动查询》', NULL, 90);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[交易中心] 网上支付订单 - 验收标准', '项目组自行验收，功能、数据显示正常即可', '测试用例', '', NULL, 91);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[交易中心] 内部充值 - 技术接入文档', '内部人员如品质、GS、运营专用的内部充值功能，需先把角色录入内部号管理中，方可对内部号发放道具或充值项等', '接入文档', 'https://q1doc.yuque.com/staff-nseb80/it/rzfyfurc9riig1u3?singleDoc# 《充值补单&内部充值 - 接入文档》 密码：wnqe', NULL, 92);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[交易中心] 内部充值 - 验收标准', '项目组自行验收，根据提供的测试用例进行测试验收：https://q1doc.yuque.com/ftdehn/apmo7x/hhi7rv012hwzgskq', '测试用例', '', NULL, 93);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[交易中心] 真实玩家补单 - 技术接入文档', '针对已支付但游戏未到账的线上订单，校验角色准确性后，进行充值项的补单', '接入文档', 'https://q1doc.yuque.com/staff-nseb80/it/rzfyfurc9riig1u3 密码：wnqe', NULL, 94);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[交易中心] 真实玩家补单 - 验收标准', '自研系游戏：项目组自行验收，功能显示正常即可
其余游戏：项目组自行验收，根据提供的测试用例进行测试验收：https://q1doc.yuque.com/ftdehn/apmo7x/hhi7rv012hwzgskq', '测试用例', '', NULL, 95);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[交易中心] 充值订单 - 验收标准', '项目组自行验收，功能、数据显示正常即可', '测试用例', '', NULL, 96);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[交易中心] 剑仙充值订单 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 97);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[营销中心] 广告投放 - 验收标准', '以平台品质测试用例及规范进行测试，以功能、数据显示正常进行验收', '测试用例', '', NULL, 98);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[营销中心] AI呼叫 - 技术接入文档', '使用机器人用特定的话术对玩家进行呼叫', '接入文档', 'https://q1doc.yuque.com/staff-nseb80/it/nm3w949t4lg6moli?singleDoc#', NULL, 99);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[营销中心] AI呼叫 - 验收标准', '项目组自行验收，功能、数据显示正常即可', '测试用例', '', NULL, 100);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[客服中心] 直充服务 - 验收标准', '项目组自行验收，功能、数据显示正常即可', '测试用例', '', NULL, 101);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[客服中心] 退款管理 - 验收标准', '项目组自行验收，功能、数据显示正常即可', '测试用例', '', NULL, 102);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[客服中心] 订单拦截管理 - 使用手册', '用于退款补缴场景的订单拦截，防止玩家退款后重新充值自动发货。', '使用手册', 'https://q1doc.yuque.com/staff-nseb80/it/gmf504tna93n0itl?singleDoc# 《订单拦截管理-使用手册》', NULL, 103);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[客服中心] 订单拦截管理 - 验收标准', '项目组自行验收，功能、数据显示正常即可', '测试用例', '', NULL, 104);
INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('[客服中心] 客服按灯统计 - 验收标准', '项目组自行验收，功能、数据显示正常即可', '测试用例', '', NULL, 105);

-- ============================================
-- 重建现有项目的功能关联（所有功能状态设为 待开发）
-- ============================================

INSERT INTO project_features (project_id, feature_id, batch, status)
SELECT p.id, f.id, 1, '待开发'
FROM projects p
CROSS JOIN features f
WHERE f.is_active = true
ON CONFLICT DO NOTHING;

-- 更新项目功能总数

UPDATE projects SET total_features = (
    SELECT COUNT(*) FROM project_features WHERE project_id = projects.id
);


-- ============================================
SELECT '初始化完成！' as status;
SELECT '功能库: 52 条' as info;
SELECT '文档清单: 105 条' as info;