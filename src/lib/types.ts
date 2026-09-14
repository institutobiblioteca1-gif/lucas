export type PlanStatus = 'rascunho' | 'em_elaboracao' | 'enviado' | 'em_revisao' | 'aprovado';

export interface Course {
  id: string;
  name: string;
  code: string;
  description: string;
  created_at: string;
}

export interface ClassEntity {
  id: string;
  course_id: string;
  name: string;
  created_at: string;
}

export interface ClassYear {
  id: string;
  class_id: string;
  year: number;
  semester: number;
  created_at: string;
}

export interface Discipline {
  id: string;
  code: string;
  name: string;
  workload_hours: number;
  credits: number;
  description: string;
  created_at: string;
}

export interface Professor {
  id: string;
  name: string;
  email: string;
  department: string;
  created_at: string;
}

export interface ClassYearDiscipline {
  id: string;
  class_year_id: string;
  discipline_id: string;
  professor_id: string | null;
  created_at: string;
}

export interface TeachingPlan {
  id: string;
  class_year_discipline_id: string;
  professor_id: string | null;
  plan_code: string | null;
  status: PlanStatus;
  ementa: string;
  competencias: string;
  conteudo: string;
  bibliografia_basica: string;
  bibliografia_complementar: string;
  bibliografia_aprofundamento: string;
  review_notes: string;
  created_at: string;
  updated_at: string;
}

export interface ClassYearDisciplineJoined extends ClassYearDiscipline {
  discipline: Discipline;
  professor: Professor | null;
  class_year: ClassYear;
  class_entity: ClassEntity;
  course: Course;
  teaching_plan: TeachingPlan | null;
}

export interface TeachingPlanJoined extends TeachingPlan {
  class_year_discipline: ClassYearDiscipline;
  professor: Professor | null;
}

export interface TeachingPlanFull extends TeachingPlan {
  class_year_discipline: ClassYearDiscipline & {
    discipline: Discipline;
    class_year: ClassYear;
    class_entity: ClassEntity;
    course: Course;
    professor: Professor | null;
  };
  professor: Professor | null;
}
