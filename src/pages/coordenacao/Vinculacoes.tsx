import { useEffect, useState } from 'react';
import { Link2, Plus, Trash2, Search, GraduationCap, BookOpen, Calendar, User, FileText, ChevronDown, ChevronRight, Copy, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Course, ClassEntity, ClassYear, Discipline, Professor, ClassYearDiscipline } from '@/lib/types';
import { generatePlanCode } from '@/lib/helpers';
import { PageHeader } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Vinculo {
  cyd: ClassYearDiscipline;
  discipline: Discipline;
  professor: Professor | null;
  teaching_plan: { id: string; status: string; plan_code: string | null } | null;
}

interface ClassYearWithDetails extends ClassYear {
  class: ClassEntity;
  vinculos: Vinculo[];
}

export function VinculacoesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [classYears, setClassYears] = useState<ClassYearWithDetails[]>([]);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForClassYear, setAddForClassYear] = useState<string | null>(null);
  const [addDisciplineId, setAddDisciplineId] = useState('');
  const [addProfessorId, setAddProfessorId] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteVinculo, setDeleteVinculo] = useState<{ cydId: string; disciplineName: string } | null>(null);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importTarget, setImportTarget] = useState<{ cydId: string; disciplineName: string; disciplineId: string } | null>(null);
  const [importSourcePlan, setImportSourcePlan] = useState<{ id: string; plan_code: string; year: number; semester: number; class_name: string } | null>(null);
  const [availablePriorPlans, setAvailablePriorPlans] = useState<Array<{ id: string; plan_code: string; year: number; semester: number; class_name: string }>>([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => { loadInitial(); }, []);

  async function loadInitial() {
    setLoading(true);
    const [{ data: c }, { data: d }, { data: p }] = await Promise.all([
      supabase.from('courses').select('*').order('name'),
      supabase.from('disciplines').select('*').order('name'),
      supabase.from('professors').select('*').order('name'),
    ]);
    setCourses(c || []);
    setDisciplines(d || []);
    setProfessors(p || []);
    setLoading(false);
  }

  useEffect(() => {
    if (selectedCourseId) loadClassYears();
    else setClassYears([]);
  }, [selectedCourseId]);

  async function loadClassYears() {
    if (!selectedCourseId) return;
    const { data: classes } = await supabase.from('classes').select('*').eq('course_id', selectedCourseId).order('name');
    if (!classes || classes.length === 0) { setClassYears([]); return; }

    const classIds = classes.map((c) => c.id);
    const { data: cyData } = await supabase.from('class_years').select('*').in('class_id', classIds).order('year', { ascending: false });
    if (!cyData || cyData.length === 0) { setClassYears([]); return; }

    const cyIds = cyData.map((cy) => cy.id);
    const { data: cydData } = await supabase.from('class_year_disciplines').select('*').in('class_year_id', cyIds);

    const discMap = new Map(disciplines.map((d) => [d.id, d]));
    const profMap = new Map(professors.map((p) => [p.id, p]));
    const classMap = new Map(classes.map((c) => [c.id, c]));

    const cydIds = (cydData || []).map((c) => c.id);
    const { data: plans } = await supabase.from('teaching_plans').select('id, status, plan_code, class_year_discipline_id').in('class_year_discipline_id', cydIds);
    const planMap = new Map<string, { id: string; status: string; plan_code: string | null }>();
    plans?.forEach((p) => planMap.set(p.class_year_discipline_id, p));

    const vinculoMap = new Map<string, Vinculo[]>();
    (cydData || []).forEach((cyd) => {
      const v: Vinculo = {
        cyd,
        discipline: discMap.get(cyd.discipline_id)!,
        professor: cyd.professor_id ? profMap.get(cyd.professor_id) || null : null,
        teaching_plan: planMap.get(cyd.id) || null,
      };
      if (!vinculoMap.has(cyd.class_year_id)) vinculoMap.set(cyd.class_year_id, []);
      vinculoMap.get(cyd.class_year_id)!.push(v);
    });

    const result: ClassYearWithDetails[] = cyData.map((cy) => ({
      ...cy,
      class: classMap.get(cy.class_id)!,
      vinculos: (vinculoMap.get(cy.id) || []).sort((a, b) => a.discipline.name.localeCompare(b.discipline.name)),
    }));

    setClassYears(result);
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function openAddModal(cyId: string) {
    setAddForClassYear(cyId);
    setAddDisciplineId('');
    setAddProfessorId('');
    setAddModalOpen(true);
  }

  async function addVinculo() {
    if (!addForClassYear || !addDisciplineId) return;
    setSaving(true);

    const existingVinculos = classYears.find((cy) => cy.id === addForClassYear)?.vinculos || [];
    const alreadyLinked = existingVinculos.some((v) => v.discipline.id === addDisciplineId);
    if (alreadyLinked) {
      setSaving(false);
      setAddModalOpen(false);
      return;
    }

    const { data: cyd, error } = await supabase.from('class_year_disciplines').insert({
      class_year_id: addForClassYear,
      discipline_id: addDisciplineId,
      professor_id: addProfessorId || null,
    }).select().single();

    if (!error && cyd) {
      const cy = classYears.find((c) => c.id === addForClassYear);
      const disc = disciplines.find((d) => d.id === addDisciplineId);
      const prof = addProfessorId ? professors.find((p) => p.id === addProfessorId) : null;
      const course = courses.find((c) => c.id === selectedCourseId);
      if (cy && disc && course) {
        const planCode = generatePlanCode(course.code, cy.year, cy.class.name, disc.code);
        await supabase.from('teaching_plans').insert({
          class_year_discipline_id: cyd.id,
          professor_id: addProfessorId || null,
          plan_code: planCode,
          status: 'rascunho',
        });
      }
    }

    setSaving(false);
    setAddModalOpen(false);
    loadClassYears();
  }

  async function updateVinculoProfessor(cydId: string, newProfId: string) {
    await supabase.from('class_year_disciplines').update({ professor_id: newProfId || null }).eq('id', cydId);
    await supabase.from('teaching_plans').update({ professor_id: newProfId || null }).eq('class_year_discipline_id', cydId);
    loadClassYears();
  }

  async function confirmDeleteVinculo() {
    if (!deleteVinculo) return;
    await supabase.from('class_year_disciplines').delete().eq('id', deleteVinculo.cydId);
    setDeleteVinculo(null);
    loadClassYears();
  }

  async function openImportModal(cydId: string, disciplineName: string, disciplineId: string) {
    setImportTarget({ cydId, disciplineName, disciplineId });
    setImportSourcePlan(null);
    setImportModalOpen(true);

    const { data: priorCyd } = await supabase.from('class_year_disciplines').select('id, class_year_id').eq('discipline_id', disciplineId);
    if (!priorCyd || priorCyd.length === 0) { setAvailablePriorPlans([]); return; }

    const priorCydIds = priorCyd.map((c) => c.id).filter((id) => id !== cydId);
    const { data: priorPlans } = await supabase.from('teaching_plans').select('id, plan_code, class_year_discipline_id').in('class_year_discipline_id', priorCydIds);
    if (!priorPlans || priorPlans.length === 0) { setAvailablePriorPlans([]); return; }

    const cydToCy = new Map(priorCyd.map((c) => [c.id, c.class_year_id]));
    const cyIds = [...new Set(priorCyd.map((c) => c.class_year_id))];
    const { data: cyData } = await supabase.from('class_years').select('id, year, semester, class_id').in('id', cyIds);
    const { data: classData } = await supabase.from('classes').select('id, name').in('id', [...new Set((cyData || []).map((c) => c.class_id))]);
    const classMap = new Map((classData || []).map((c) => [c.id, c.name]));
    const cyMap = new Map((cyData || []).map((c) => [c.id, c]));

    const plans = priorPlans.map((p) => {
      const cyId = cydToCy.get(p.class_year_discipline_id);
      const cy = cyId ? cyMap.get(cyId) : null;
      return {
        id: p.id,
        plan_code: p.plan_code || '—',
        year: cy?.year || 0,
        semester: cy?.semester || 0,
        class_name: cy ? classMap.get(cy.class_id) || '—' : '—',
      };
    }).sort((a, b) => b.year - a.year);

    setAvailablePriorPlans(plans);
  }

  async function doImport() {
    if (!importTarget || !importSourcePlan) return;
    setImporting(true);
    const { data: sourcePlan } = await supabase.from('teaching_plans').select('ementa, competencias, conteudo, bibliografia_basica, bibliografia_complementar, bibliografia_aprofundamento').eq('id', importSourcePlan.id).single();
    if (sourcePlan) {
      await supabase.from('teaching_plans').update({
        ementa: sourcePlan.ementa,
        competencias: sourcePlan.competencias,
        conteudo: sourcePlan.conteudo,
        bibliografia_basica: sourcePlan.bibliografia_basica,
        bibliografia_complementar: sourcePlan.bibliografia_complementar,
        bibliografia_aprofundamento: sourcePlan.bibliografia_aprofundamento,
        status: 'em_elaboracao',
      }).eq('class_year_discipline_id', importTarget.cydId);
    }
    setImporting(false);
    setImportModalOpen(false);
    setImportTarget(null);
    setImportSourcePlan(null);
    loadClassYears();
  }

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Vinculações"
        subtitle="Vincule disciplinas e professores às turmas em cada ano letivo"
      />

      {loading ? (
        <div className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse" />
      ) : courses.length === 0 || disciplines.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200">
          <EmptyState icon={<Link2 className="w-7 h-7" />} title="Estrutura incompleta" description="Você precisa cadastrar cursos, turmas e disciplinas antes de fazer vinculações." />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
            <Select label="Selecione o curso para gerenciar vinculações" value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
              <option value="">Selecione um curso...</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>

          {selectedCourseId && (
            classYears.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200">
                <EmptyState icon={<Calendar className="w-7 h-7" />} title="Nenhum ano letivo encontrado" description="Cadastre turmas e anos letivos para este curso antes de vincular disciplinas." />
              </div>
            ) : (
              <div className="space-y-3">
                {classYears.map((cy) => {
                  const isOpen = expanded.has(cy.id);
                  return (
                    <div key={cy.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => toggleExpand(cy.id)}>
                        <button className="p-0.5 text-slate-400">
                          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 text-sm">{cy.class.name} — {cy.year}/{cy.semester}º</h3>
                          <p className="text-xs text-slate-500">{selectedCourse?.name} · {cy.vinculos.length} disciplina(s)</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openAddModal(cy.id); }}>
                          <Plus className="w-3.5 h-3.5" /> Vincular
                        </Button>
                      </div>

                      {isOpen && (
                        <div className="border-t border-slate-100">
                          {cy.vinculos.length === 0 ? (
                            <p className="px-5 py-6 text-sm text-slate-400 text-center">Nenhuma disciplina vinculada. Clique em "Vincular" para adicionar.</p>
                          ) : (
                            <table className="w-full">
                              <thead>
                                <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wider">
                                  <th className="px-5 py-2.5 font-medium">Disciplina</th>
                                  <th className="px-5 py-2.5 font-medium">Professor</th>
                                  <th className="px-5 py-2.5 font-medium">Plano</th>
                                  <th className="px-5 py-2.5 font-medium w-32">Ações</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {cy.vinculos.map((v) => (
                                  <tr key={v.cyd.id} className="hover:bg-slate-50/50">
                                    <td className="px-5 py-3">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{v.discipline.code}</span>
                                        <span className="text-sm font-medium text-slate-900">{v.discipline.name}</span>
                                      </div>
                                    </td>
                                    <td className="px-5 py-3">
                                      <select
                                        value={v.cyd.professor_id || ''}
                                        onChange={(e) => updateVinculoProfessor(v.cyd.id, e.target.value)}
                                        className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                      >
                                        <option value="">— Sem professor —</option>
                                        {professors.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                      </select>
                                    </td>
                                    <td className="px-5 py-3">
                                      {v.teaching_plan ? (
                                        <div className="flex items-center gap-2">
                                          <StatusBadge status={v.teaching_plan.status as any} />
                                          <button
                                            onClick={() => openImportModal(v.cyd.id, v.discipline.name, v.discipline.id)}
                                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                            title="Importar plano anterior"
                                          >
                                            <Copy className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="text-xs text-slate-400">—</span>
                                      )}
                                    </td>
                                    <td className="px-5 py-3">
                                      <button onClick={() => setDeleteVinculo({ cydId: v.cyd.id, disciplineName: v.discipline.name })} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50">
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </>
      )}

      {/* Add vinculo modal */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Vincular Disciplina">
        <div className="space-y-4">
          <Select label="Disciplina *" value={addDisciplineId} onChange={(e) => setAddDisciplineId(e.target.value)}>
            <option value="">Selecione...</option>
            {disciplines.map((d) => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
          </Select>
          <Select label="Professor (opcional)" value={addProfessorId} onChange={(e) => setAddProfessorId(e.target.value)}>
            <option value="">— Sem professor —</option>
            {professors.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
            Ao vincular a disciplina, um plano de ensino em status "Rascunho" será criado automaticamente. O professor poderá então acessá-lo em "Meus Planos".
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>Cancelar</Button>
            <Button onClick={addVinculo} disabled={saving || !addDisciplineId}>{saving ? 'Vinculando...' : 'Vincular'}</Button>
          </div>
        </div>
      </Modal>

      {/* Import plan modal */}
      <Modal open={importModalOpen} onClose={() => setImportModalOpen(false)} title="Importar Plano Anterior">
        {importTarget && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Existe(m) plano(s) anterior(es) para <strong>{importTarget.disciplineName}</strong>. Escolha um plano para usar como base. O conteúdo será copiado para o novo plano, e o plano original não será alterado.
            </p>
            {availablePriorPlans.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Nenhum plano anterior encontrado para esta disciplina.</p>
            ) : (
              <div className="space-y-2">
                {availablePriorPlans.map((p) => (
                  <label key={p.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${importSourcePlan?.id === p.id ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="importPlan" checked={importSourcePlan?.id === p.id} onChange={() => setImportSourcePlan(p)} className="accent-slate-900" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{p.class_name} — {p.year}/{p.semester}º</p>
                      <p className="text-xs text-slate-500">{p.plan_code}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setImportModalOpen(false)}>Cancelar</Button>
              <Button onClick={doImport} disabled={importing || !importSourcePlan}>{importing ? 'Importando...' : 'Importar como base'}</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteVinculo} onClose={() => setDeleteVinculo(null)} onConfirm={confirmDeleteVinculo}
        title="Remover vinculação" message={`Remover a disciplina "${deleteVinculo?.disciplineName}" desta turma? O plano de ensino associado também será removido.`} confirmLabel="Remover" />
    </div>
  );
}
