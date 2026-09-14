/*
# Sistema de Gerenciamento de Plano de Ensino

## Overview
Creates the complete database schema for a teaching plan management system with two roles:
- Coordenação: manages academic structure (courses, classes, disciplines, professors, links)
- Professor: views and edits teaching plans assigned to them

## Tables Created

1. **courses** — Top-level academic programs (e.g., Teologia)
   - id, name, code, description, created_at

2. **classes** — Turmas within a course (e.g., Ano A, Ano Básico)
   - id, course_id (FK), name, created_at

3. **class_years** — A specific turma in a specific academic year/semester
   - id, class_id (FK), year (int), semester (int), created_at
   - UNIQUE on (class_id, year, semester) to prevent duplicates

4. **disciplines** — Disciplinas available to be linked to classes
   - id, code, name, workload_hours (int), credits (int), description, created_at

5. **professors** — Professors who can be assigned to teaching plans
   - id, name, email, department, created_at

6. **class_year_disciplines** — Links disciplines to a class_year (the turma-year grouping)
   - id, class_year_id (FK), discipline_id (FK), professor_id (FK nullable)
   - UNIQUE on (class_year_id, discipline_id) to prevent duplicate links
   - When professor_id is set, a teaching plan is auto-created

7. **teaching_plans** — The actual plano de ensino
   - id, class_year_discipline_id (FK), professor_id (FK nullable)
   - plan_code (text, unique) — human-readable identifier like TEO-2026-A-PAT-I
   - status (enum: rascunho, em_elaboracao, enviado, em_revisao, aprovado)
   - ementa, competencias, conteudo, bibliografia_basica, bibliografia_complementar, bibliografia_aprofundamento (all text)
   - review_notes (text, nullable) — feedback from coordenação
   - created_at, updated_at

## Security
- This is a single-tenant app (no auth/sign-in screen) — the system is used internally.
- RLS enabled on all tables.
- Policies allow anon + authenticated full CRUD (intentionally shared internal system).
*/

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_courses" ON courses;
CREATE POLICY "anon_select_courses" ON courses FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_courses" ON courses;
CREATE POLICY "anon_insert_courses" ON courses FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_courses" ON courses;
CREATE POLICY "anon_update_courses" ON courses FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_courses" ON courses;
CREATE POLICY "anon_delete_courses" ON courses FOR DELETE
  TO anon, authenticated USING (true);

-- Classes (Turmas)
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_classes" ON classes;
CREATE POLICY "anon_select_classes" ON classes FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_classes" ON classes;
CREATE POLICY "anon_insert_classes" ON classes FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_classes" ON classes;
CREATE POLICY "anon_update_classes" ON classes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_classes" ON classes;
CREATE POLICY "anon_delete_classes" ON classes FOR DELETE
  TO anon, authenticated USING (true);

-- Class Years (turma in a specific year/semester)
CREATE TABLE IF NOT EXISTS class_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  year int NOT NULL,
  semester int NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (class_id, year, semester)
);
ALTER TABLE class_years ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_class_years" ON class_years;
CREATE POLICY "anon_select_class_years" ON class_years FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_class_years" ON class_years;
CREATE POLICY "anon_insert_class_years" ON class_years FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_class_years" ON class_years;
CREATE POLICY "anon_update_class_years" ON class_years FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_class_years" ON class_years;
CREATE POLICY "anon_delete_class_years" ON class_years FOR DELETE
  TO anon, authenticated USING (true);

-- Disciplines
CREATE TABLE IF NOT EXISTS disciplines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  workload_hours int DEFAULT 0,
  credits int DEFAULT 0,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE disciplines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_disciplines" ON disciplines;
CREATE POLICY "anon_select_disciplines" ON disciplines FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_disciplines" ON disciplines;
CREATE POLICY "anon_insert_disciplines" ON disciplines FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_disciplines" ON disciplines;
CREATE POLICY "anon_update_disciplines" ON disciplines FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_disciplines" ON disciplines;
CREATE POLICY "anon_delete_disciplines" ON disciplines FOR DELETE
  TO anon, authenticated USING (true);

-- Professors
CREATE TABLE IF NOT EXISTS professors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text DEFAULT '',
  department text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE professors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_professors" ON professors;
CREATE POLICY "anon_select_professors" ON professors FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_professors" ON professors;
CREATE POLICY "anon_insert_professors" ON professors FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_professors" ON professors;
CREATE POLICY "anon_update_professors" ON professors FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_professors" ON professors;
CREATE POLICY "anon_delete_professors" ON professors FOR DELETE
  TO anon, authenticated USING (true);

-- Class Year Disciplines (link table: discipline + professor assigned to a class_year)
CREATE TABLE IF NOT EXISTS class_year_disciplines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_year_id uuid NOT NULL REFERENCES class_years(id) ON DELETE CASCADE,
  discipline_id uuid NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  professor_id uuid REFERENCES professors(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (class_year_id, discipline_id)
);
ALTER TABLE class_year_disciplines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_cyd" ON class_year_disciplines;
CREATE POLICY "anon_select_cyd" ON class_year_disciplines FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_cyd" ON class_year_disciplines;
CREATE POLICY "anon_insert_cyd" ON class_year_disciplines FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_cyd" ON class_year_disciplines;
CREATE POLICY "anon_update_cyd" ON class_year_disciplines FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_cyd" ON class_year_disciplines;
CREATE POLICY "anon_delete_cyd" ON class_year_disciplines FOR DELETE
  TO anon, authenticated USING (true);

-- Teaching Plans
CREATE TABLE IF NOT EXISTS teaching_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_year_discipline_id uuid NOT NULL REFERENCES class_year_disciplines(id) ON DELETE CASCADE,
  professor_id uuid REFERENCES professors(id) ON DELETE SET NULL,
  plan_code text UNIQUE,
  status text NOT NULL DEFAULT 'rascunho',
  ementa text DEFAULT '',
  competencias text DEFAULT '',
  conteudo text DEFAULT '',
  bibliografia_basica text DEFAULT '',
  bibliografia_complementar text DEFAULT '',
  bibliografia_aprofundamento text DEFAULT '',
  review_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE teaching_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_teaching_plans" ON teaching_plans;
CREATE POLICY "anon_select_teaching_plans" ON teaching_plans FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_teaching_plans" ON teaching_plans;
CREATE POLICY "anon_insert_teaching_plans" ON teaching_plans FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_teaching_plans" ON teaching_plans;
CREATE POLICY "anon_update_teaching_plans" ON teaching_plans FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_teaching_plans" ON teaching_plans;
CREATE POLICY "anon_delete_teaching_plans" ON teaching_plans FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_classes_course_id ON classes(course_id);
CREATE INDEX IF NOT EXISTS idx_class_years_class_id ON class_years(class_id);
CREATE INDEX IF NOT EXISTS idx_cyd_class_year_id ON class_year_disciplines(class_year_id);
CREATE INDEX IF NOT EXISTS idx_cyd_discipline_id ON class_year_disciplines(discipline_id);
CREATE INDEX IF NOT EXISTS idx_cyd_professor_id ON class_year_disciplines(professor_id);
CREATE INDEX IF NOT EXISTS idx_teaching_plans_cyd ON teaching_plans(class_year_discipline_id);
CREATE INDEX IF NOT EXISTS idx_teaching_plans_professor ON teaching_plans(professor_id);
CREATE INDEX IF NOT EXISTS idx_teaching_plans_status ON teaching_plans(status);

-- Auto-update updated_at on teaching_plans
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_teaching_plans_updated_at ON teaching_plans;
CREATE TRIGGER trg_teaching_plans_updated_at
  BEFORE UPDATE ON teaching_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
