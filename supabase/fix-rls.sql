-- ============================================
-- RLS 修复脚本
-- 修复：新增功能报错、编辑功能保存不生效、文档管理问题
-- 使用方法：复制全部内容，粘贴到 Supabase SQL Editor 中执行
-- ============================================

-- 1. 为 features 表添加 INSERT/UPDATE/DELETE 策略
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'features' AND policyname = 'Public insert features'
    ) THEN
        CREATE POLICY "Public insert features" ON features FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'features' AND policyname = 'Public update features'
    ) THEN
        CREATE POLICY "Public update features" ON features FOR UPDATE USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'features' AND policyname = 'Public delete features'
    ) THEN
        CREATE POLICY "Public delete features" ON features FOR DELETE USING (true);
    END IF;
END $$;

-- 2. 确保 documents 表的 RLS 策略完整
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'documents' AND policyname = 'Public insert documents'
    ) THEN
        CREATE POLICY "Public insert documents" ON documents FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'documents' AND policyname = 'Public update documents'
    ) THEN
        CREATE POLICY "Public update documents" ON documents FOR UPDATE USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'documents' AND policyname = 'Public delete documents'
    ) THEN
        CREATE POLICY "Public delete documents" ON documents FOR DELETE USING (true);
    END IF;
END $$;

-- 3. 修复 documents 表的 SELECT 策略（允许读取所有文档）
DROP POLICY IF EXISTS "Public read documents" ON documents;
CREATE POLICY "Public read documents" ON documents FOR SELECT USING (true);

-- 4. 修复 features 表的 SELECT 策略（允许读取所有功能，包括管理时需看到所有）
DROP POLICY IF EXISTS "Public read active features" ON features;
CREATE POLICY "Public read active features" ON features FOR SELECT USING (true);

SELECT 'RLS 修复完成！' as status;
