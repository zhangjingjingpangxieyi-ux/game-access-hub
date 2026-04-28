import pandas as pd, json, sys, re
sys.stdout.reconfigure(encoding='utf-8')

XLSX_PATH = r'c:\Users\zhangjing\WorkBuddy\20260424131247\游戏接入Hub-内容初始化模板.xlsx'
OUTPUT_PATH = r'c:\Users\zhangjing\WorkBuddy\20260424131247\game-access-hub\supabase\init-data.sql'

# ==============================
# 1. 解析功能库配置
# ==============================
print("1. 解析功能库配置...")
df_features = pd.read_excel(XLSX_PATH, sheet_name='功能库配置', header=None)
df_features = df_features.dropna(how='all', axis=1).reset_index(drop=True)

stage_pattern = re.compile(r'^阶段(\d)方案', re.IGNORECASE)
stage_end_pattern = re.compile(r'^填写说明', re.IGNORECASE)
module_names = ['运营中心', '玩家中心', '交易中心', '数据中心', '营销中心', '客服中心', '游戏中心']

features = []
current_stage = None
current_module = None

for idx, row in df_features.iterrows():
    val_a = str(row.iloc[0]) if pd.notna(row.iloc[0]) else ''
    val_b = str(row.iloc[1]) if pd.notna(row.iloc[1]) else ''
    val_c = str(row.iloc[2]) if pd.notna(row.iloc[2]) else ''

    if not val_a.strip() and not val_b.strip():
        continue
    skip_keywords = ['接入运营后台须知', '游戏基本信息填写', '填充黄色', '填充蓝色', '填写说明']
    if any(kw in val_a for kw in skip_keywords):
        continue
    if val_b.strip() and any(kw in val_b for kw in ['0.物料提供', '1.在搭建版本', '11.游戏接入']):
        continue

    stage_match = stage_pattern.match(val_a.strip())
    if stage_match:
        current_stage = int(stage_match.group(1))
        continue

    if stage_end_pattern.match(val_a.strip()):
        break

    # 检测模块（模块可能和功能在同一行，如 A列=模块 B列=功能）
    is_module_a = val_a.strip() in module_names
    if is_module_a:
        current_module = val_a.strip()
    # 不再 continue，因为同一行可能有功能

    if val_b.strip() and current_stage is not None:
        feature_raw = val_b.strip()

        # 跳过非功能行
        if feature_raw.startswith('2.') or feature_raw.startswith('3.') or feature_raw.startswith('4.') or feature_raw.startswith('5.') or feature_raw.startswith('6.') or feature_raw.startswith('7.') or feature_raw.startswith('8.') or feature_raw.startswith('9.'):
            continue
        if '请勾选' in feature_raw or '新增字段' in feature_raw or '自定义字段' in feature_raw:
            continue
        if feature_raw.startswith('1. ') and ('查询条件' in feature_raw or '列表字段' in feature_raw or '角色详情' in feature_raw):
            continue
        if '需要展示更多' in feature_raw or '若有更多' in feature_raw:
            continue

        # 纯 checkbox 行（true/false），跳过
        if feature_raw.lower() == 'true' or feature_raw.lower() == 'false':
            continue

        recommendation = '必须使用' if '必须使用' in feature_raw else '推荐使用'
        name = re.sub(r'[（(][^）)]*[）)]', '', feature_raw).strip().split('\n')[0].strip()

        if not name or len(name) < 2:
            continue

        # 跳过阶段3子配置维度标题
        if re.match(r'^[①②③]', name):
            continue

        team_needs = val_c.strip() if val_c.strip() and val_c.strip() != 'nan' else ''

        access_method = '开通权限'
        if team_needs:
            if '平台' in team_needs and '游戏' in team_needs:
                access_method = '游戏接入+平台开发'
            elif '游戏' in team_needs or '接入' in team_needs.lower():
                access_method = '游戏接入'
        # 基于名称推断
        if '平台定制开发' in name or '平台开发' in name:
            access_method = '平台开发'
        elif '游戏按文档接入' in name or '游戏按文档' in name:
            access_method = '游戏接入'

        features.append({
            'name': name,
            'description': '',
            'recommendation': recommendation,
            'feature_type': '通用',
            'access_method': access_method,
            'estimated_duration': '',
            'platform_responsibility': '',
            'team_responsibility': '',
            'team_needs': team_needs,
            'stage_num': current_stage,
            'sort_order': len(features) + 1,
        })

print(f"  解析到 {len(features)} 个功能")

# ==============================
# 2. 解析文档清单
# ==============================
print("2. 解析文档清单...")
df_docs = pd.read_excel(XLSX_PATH, sheet_name='文档清单', header=None)
df_docs = df_docs.dropna(how='all', axis=0).dropna(how='all', axis=1).reset_index(drop=True)

docs = []
current_module = ''
doc_sort = 1

for idx, row in df_docs.iterrows():
    if idx == 0:
        continue

    val_a = str(row.iloc[0]) if pd.notna(row.iloc[0]) else ''
    val_b = str(row.iloc[1]) if pd.notna(row.iloc[1]) else ''
    val_c = str(row.iloc[2]) if pd.notna(row.iloc[2]) else ''
    val_g = str(row.iloc[6]) if pd.notna(row.iloc[6]) else ''
    val_i = str(row.iloc[8]) if pd.notna(row.iloc[8]) else ''
    val_j = str(row.iloc[9]) if pd.notna(row.iloc[9]) else ''

    if not val_b.strip() and not val_a.strip():
        continue

    if val_a.strip() in module_names + ['游戏中心']:
        current_module = val_a.strip()
        continue

    func_name = val_b.strip().split('\n')[0].strip()
    if not func_name:
        continue

    display_name = re.sub(r'[（(][^）)]*[）)]', '', func_name).strip()
    prefix = f"[{current_module}] " if current_module else ""
    title = f"{prefix}{display_name}"
    description = val_c.strip() if val_c.strip() and val_c != 'nan' else ''

    # 技术接入文档
    file_url = val_g.strip() if val_g.strip() and val_g != 'nan' and val_g != '-' else ''
    if file_url:
        docs.append({
            'title': f"{title} - 技术接入文档",
            'description': description[:500] if description else '',
            'category': '接入文档',
            'file_url': file_url,
            'sort_order': doc_sort,
        })
        doc_sort += 1

    # 操作说明文档
    op_url = val_j.strip() if val_j.strip() and val_j != 'nan' else ''
    if op_url and '使用手册' in op_url:
        docs.append({
            'title': f"{title} - 使用手册",
            'description': description[:500] if description else '',
            'category': '使用手册',
            'file_url': op_url,
            'sort_order': doc_sort,
        })
        doc_sort += 1

    # 验收标准
    acceptance = val_i.strip() if val_i.strip() and val_i != 'nan' else ''
    if acceptance:
        docs.append({
            'title': f"{title} - 验收标准",
            'description': acceptance[:500],
            'category': '测试用例',
            'file_url': '',
            'sort_order': doc_sort,
        })
        doc_sort += 1

print(f"  解析到 {len(docs)} 条文档")

# ==============================
# 3. 生成 SQL
# ==============================
print("3. 生成 SQL 脚本...")

sql_lines = []
sql_lines.append("-- ============================================")
sql_lines.append("-- 数据初始化脚本（自动生成）")
sql_lines.append("-- 功能库 + 文档清单")
sql_lines.append("-- 在 Supabase SQL Editor 中执行")
sql_lines.append("-- ============================================")
sql_lines.append("")

# 清空旧数据
sql_lines.append("-- 清空旧数据")
sql_lines.append("DELETE FROM project_features;")
sql_lines.append("DELETE FROM features;")
sql_lines.append("DELETE FROM documents;")
sql_lines.append("ALTER SEQUENCE features_id_seq RESTART WITH 1;")
sql_lines.append("ALTER SEQUENCE documents_id_seq RESTART WITH 1;")
sql_lines.append("")

# 插入功能
sql_lines.append("-- ============================================")
sql_lines.append(f"-- 插入 {len(features)} 个功能")
sql_lines.append("-- ============================================")

for f in features:
    name_escaped = f['name'].replace("'", "''")
    desc_escaped = f['description'].replace("'", "''")
    needs_escaped = f['team_needs'].replace("'", "''") if f['team_needs'] else ''
    platform_escaped = f['platform_responsibility'].replace("'", "''")
    team_escaped = f['team_responsibility'].replace("'", "''")
    duration_escaped = f['estimated_duration'].replace("'", "''")

    sql_lines.append(f"""INSERT INTO features (name, description, recommendation, feature_type, access_method, estimated_duration, platform_responsibility, team_responsibility, team_needs, stage_id, sort_order, is_active)
VALUES ('{name_escaped}', '{desc_escaped}', '{f['recommendation']}', '{f['feature_type']}', '{f['access_method']}', '{duration_escaped}', '{platform_escaped}', '{team_escaped}', '{needs_escaped}', (SELECT id FROM stages WHERE stage_num = {f['stage_num']}), {f['sort_order']}, true);""")

sql_lines.append("")

# 插入文档
sql_lines.append("-- ============================================")
sql_lines.append(f"-- 插入 {len(docs)} 条文档")
sql_lines.append("-- ============================================")

for d in docs:
    title_escaped = d['title'].replace("'", "''")
    desc_escaped = d['description'].replace("'", "''")
    url_escaped = d['file_url'].replace("'", "''")

    sql_lines.append(f"""INSERT INTO documents (title, description, category, file_url, related_stage, sort_order)
VALUES ('{title_escaped}', '{desc_escaped}', '{d['category']}', '{url_escaped}', NULL, {d['sort_order']});""")

sql_lines.append("")

# 重建现有项目的功能关联（标记为待开发）
sql_lines.append("-- ============================================")
sql_lines.append("-- 重建现有项目的功能关联（所有功能状态设为 待开发）")
sql_lines.append("-- ============================================")
sql_lines.append("""
INSERT INTO project_features (project_id, feature_id, batch, status)
SELECT p.id, f.id, 1, '待开发'
FROM projects p
CROSS JOIN features f
WHERE f.is_active = true
ON CONFLICT DO NOTHING;
""")

# 更新项目功能总数
sql_lines.append("-- 更新项目功能总数")
sql_lines.append("""
UPDATE projects SET total_features = (
    SELECT COUNT(*) FROM project_features WHERE project_id = projects.id
);
""")

sql_lines.append("")
sql_lines.append("-- ============================================")
sql_lines.append("SELECT '初始化完成！' as status;")
sql_lines.append("SELECT '功能库: {} 条' as info;".format(len(features)))
sql_lines.append("SELECT '文档清单: {} 条' as info;".format(len(docs)))

sql_content = '\n'.join(sql_lines)
with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
    f.write(sql_content)

print(f"  SQL 脚本已生成: {OUTPUT_PATH}")
print(f"  文件大小: {len(sql_content)} 字符")
print(f"\n功能明细（按阶段）:")
for stage_num in [0, 1, 2, 3]:
    stage_features = [f for f in features if f['stage_num'] == stage_num]
    print(f"  阶段{stage_num}: {len(stage_features)} 个功能")
    for f in stage_features[:5]:
        print(f"    - {f['name']} ({f['recommendation']})")
    if len(stage_features) > 5:
        print(f"    ... 还有 {len(stage_features)-5} 个")

print(f"\n文档明细（按分类）:")
for cat in ['接入文档', '使用手册', '测试用例']:
    cat_docs = [d for d in docs if d['category'] == cat]
    print(f"  {cat}: {len(cat_docs)} 条")
