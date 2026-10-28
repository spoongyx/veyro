p = 'C:/Users/HP/veyro/supabase_schema.sql'
s = open(p, encoding='utf-8').read()

pairs = [
    ('CREATE POLICY "Users can manage own tasks" ON tasks FOR ALL USING (auth.uid() = user_id);',
     'DROP POLICY IF EXISTS "Users can manage own tasks" ON tasks;\nCREATE POLICY "Users can manage own tasks" ON tasks FOR ALL USING (auth.uid() = user_id);'),
    ('CREATE POLICY "Users can manage own habits" ON habits FOR ALL USING (auth.uid() = user_id);',
     'DROP POLICY IF EXISTS "Users can manage own habits" ON habits;\nCREATE POLICY "Users can manage own habits" ON habits FOR ALL USING (auth.uid() = user_id);'),
    ('CREATE POLICY "Users can manage own habit_completions" ON habit_completions FOR ALL USING (auth.uid() = user_id);',
     'DROP POLICY IF EXISTS "Users can manage own habit_completions" ON habit_completions;\nCREATE POLICY "Users can manage own habit_completions" ON habit_completions FOR ALL USING (auth.uid() = user_id);'),
    ('CREATE POLICY "Users can manage own goals" ON goals FOR ALL USING (auth.uid() = user_id);',
     'DROP POLICY IF EXISTS "Users can manage own goals" ON goals;\nCREATE POLICY "Users can manage own goals" ON goals FOR ALL USING (auth.uid() = user_id);'),
    ('CREATE POLICY "Users can manage own focus_sessions" ON focus_sessions FOR ALL USING (auth.uid() = user_id);',
     'DROP POLICY IF EXISTS "Users can manage own focus_sessions" ON focus_sessions;\nCREATE POLICY "Users can manage own focus_sessions" ON focus_sessions FOR ALL USING (auth.uid() = user_id);'),
]

for old, new in pairs:
    assert s.count(old) == 1, (old, s.count(old))
    s = s.replace(old, new)

trig_pairs = [
    ('CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
     'DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;\nCREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();'),
    ('CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
     'DROP TRIGGER IF EXISTS update_habits_updated_at ON habits;\nCREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();'),
    ('CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
     'DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;\nCREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();'),
]

for old, new in trig_pairs:
    assert s.count(old) == 1, (old, s.count(old))
    s = s.replace(old, new)

open(p, 'w', encoding='utf-8').write(s)
print('PATCHED_OK')
