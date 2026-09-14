import { useEffect, useState } from 'react';
import { ArrowLeft, Printer, FileDown, Edit3, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { TeachingPlan, Discipline, ClassYear, ClassEntity, Course, Professor } from '@/lib/types';
import { downloadDocx } from '@/lib/exportWord';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PlanDocument } from '@/components/PlanDocument';

interface FullPlanData {
  plan: TeachingPlan;
  discipline: Discipline;
  classYear: ClassYear;
  classEntity: ClassEntity;
  course: Course;
  professor: Professor | null;
}

export function VisualizarPlanoPage({ planId, onBack, onEdit }: { planId: string; onBack: () => void; onEdit: () => void }) {
  const [data, setData] = useState<FullPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendModal, setSendModal] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => { loadPlan(); }, [planId]);

  async function loadPlan() {
    setLoading(true);
    const { data: plan } = await supabase.from('teaching_plans').select('*').eq('id', planId).single();
    if (!plan) { setLoading(false); return; }

    const { data: cyd } = await supabase.from('class_year_disciplines').select('*').eq('id', plan.class_year_discipline_id).single();
    if (!cyd) { setLoading(false); return; }

    const [disc, prof, cy] = await Promise.all([
      supabase.from('disciplines').select('*').eq('id', cyd.discipline_id).single(),
      cyd.professor_id ? supabase.from('professors').select('*').eq('id', cyd.professor_id).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from('class_years').select('*').eq('id', cyd.class_year_id).single(),
    ]);
    if (!cy.data) { setLoading(false); return; }

    const cls = await supabase.from('classes').select('*').eq('id', cy.data.class_id).single();
    const course = await supabase.from('courses').select('*').eq('id', cls.data.course_id).single();

    setData({
      plan: plan as TeachingPlan,
      discipline: disc.data as Discipline,
      classYear: cy.data as ClassYear,
      classEntity: cls.data as ClassEntity,
      course: course.data as Course,
      professor: prof.data as Professor | null,
    });
    setLoading(false);
  }

  function handlePrint() { window.print(); }
  function handleExportWord() { if (data) downloadDocx(data); }

  async function sendForReview() {
    setSending(true);
    await supabase.from('teaching_plans').update({ status: 'enviado' }).eq('id', planId);
    setSending(false);
    setSendModal(false);
    onBack();
  }

  if (loading) return <div className="p-8"><p className="text-slate-500">Carregando plano...</p></div>;
  if (!data) return <div className="p-8"><p className="text-slate-500">Plano não encontrado.</p></div>;

  const canEdit = data.plan.status === 'rascunho' || data.plan.status === 'em_elaboracao';

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Toolbar (no-print) */}
      <div className="no-print flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Edit3 className="w-4 h-4" /> Editar
            </Button>
          )}
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4" /> Imprimir
          </Button>
          <Button variant="outline" onClick={handleExportWord}>
            <FileDown className="w-4 h-4" /> Word
          </Button>
          {canEdit && (
            <Button variant="secondary" onClick={() => setSendModal(true)}>
              <Send className="w-4 h-4" /> Enviar para Coordenação
            </Button>
          )}
        </div>
      </div>

      {/* Printable document */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 print:border-0 print:shadow-none print:p-0">
        <PlanDocument
          plan={data.plan}
          discipline={data.discipline}
          classYear={data.classYear}
          classEntity={data.classEntity}
          course={data.course}
          professor={data.professor}
          showStatus
        >
          <StatusBadge status={data.plan.status} />
        </PlanDocument>
      </div>

      {/* Send modal */}
      <Modal open={sendModal} onClose={() => setSendModal(false)} title="Enviar Plano para Coordenação" size="sm">
        <p className="text-sm text-slate-600 mb-4">
          Ao enviar o plano, ele não poderá mais ser editado até que a coordenação aprove ou solicite correções.
          Tem certeza que deseja enviar?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setSendModal(false)}>Cancelar</Button>
          <Button variant="secondary" onClick={sendForReview} disabled={sending}>{sending ? 'Enviando...' : 'Enviar'}</Button>
        </div>
      </Modal>
    </div>
  );
}
