import type { TeachingPlan, Discipline, ClassYear, ClassEntity, Course, Professor } from '@/lib/types';

interface PlanDocumentProps {
  plan: TeachingPlan;
  discipline: Discipline;
  classYear: ClassYear;
  classEntity: ClassEntity;
  course: Course;
  professor: Professor | null;
  showStatus?: boolean;
  children?: React.ReactNode;
}

const SECTIONS = [
  { key: 'ementa', label: 'Ementa' },
  { key: 'competencias', label: 'Competências' },
  { key: 'conteudo', label: 'Conteúdo' },
  { key: 'bibliografia_basica', label: 'Bibliografia Básica' },
  { key: 'bibliografia_complementar', label: 'Bibliografia Complementar' },
  { key: 'bibliografia_aprofundamento', label: 'Bibliografia de Aprofundamento' },
] as const;

export function PlanDocument({ plan, discipline, classYear, classEntity, course, professor, showStatus, children }: PlanDocumentProps) {
  const anoSemestre = `${classYear.year}/${classYear.semestre}º`;
  const chCreditos = `${discipline.workload_hours}h / ${discipline.credits} créditos`;
  const codNome = `${discipline.code} — ${discipline.name}`;
  const profName = professor?.name || '—';

  return (
    <div className="bg-white text-slate-900" id="printable-plan" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="pb-4 mb-6 border-b-2 border-slate-900">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-base font-bold tracking-tight" style={{ fontSize: '13pt' }}>
              INSTITUTO ARQUIDIOCESANO DE FILOSOFIA E TEOLOGIA SÃO JOÃO PAULO II
            </h1>
            <p className="text-sm mt-1" style={{ fontSize: '12pt' }}>Plano de Ensino</p>
            {plan.plan_code && <p className="text-xs text-slate-500 mt-1">{plan.plan_code}</p>}
          </div>
          {showStatus && <div className="no-print">{children}</div>}
        </div>
      </div>

      {/* Identification table */}
      <table className="w-full border-collapse mb-6" style={{ fontSize: '11pt' }}>
        <tbody>
          <TableRow label="Curso:" value={course.name} />
          <TableRow label="Ano/Semestre:" value={anoSemestre} />
          <TableRow label="Código/Nome da disciplina:" value={codNome} />
          <TableRow label="CH/Créditos:" value={chCreditos} />
          <TableRow label="Professor Responsável:" value={profName} />
        </tbody>
      </table>

      {/* Content sections */}
      <div className="space-y-5">
        {SECTIONS.map((s) => (
          <div key={s.key}>
            <h2 className="font-bold mb-1.5" style={{ fontSize: '12pt' }}>{s.label}:</h2>
            <div className="text-justify leading-relaxed whitespace-pre-wrap" style={{ fontSize: '11pt', lineHeight: '1.4' }}>
              {(plan as any)[s.key]?.trim() || <span className="text-slate-400 italic">Não preenchido</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Review notes */}
      {plan.review_notes && (
        <div className="mt-8 pt-4 border-t border-slate-300">
          <h2 className="font-bold mb-1.5" style={{ fontSize: '12pt' }}>Observações da Coordenação:</h2>
          <p className="text-justify leading-relaxed whitespace-pre-wrap" style={{ fontSize: '11pt', lineHeight: '1.4' }}>{plan.review_notes}</p>
        </div>
      )}
    </div>
  );
}

function TableRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="border border-slate-400 px-2 py-1.5 font-bold align-top" style={{ width: '30%' }}>{label}</td>
      <td className="border border-slate-400 px-2 py-1.5">{value}</td>
    </tr>
  );
}
