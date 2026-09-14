import { useEffect, useState } from 'react';
import { BookOpen, Plus, Pencil, Trash2, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Course, ClassEntity, ClassYear } from '@/lib/types';
import { PageHeader } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface ClassWithYears extends ClassEntity {
  class_years: ClassYear[];
}

export function TurmasPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<ClassWithYears[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [classModalOpen, setClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassEntity | null>(null);
  const [classForm, setClassForm] = useState({ course_id: '', name: '' });
  const [savingClass, setSavingClass] = useState(false);

  const [yearModalOpen, setYearModalOpen] = useState(false);
  const [yearForClass, setYearForClass] = useState<string | null>(null);
  const [yearForm, setYearForm] = useState({ year: new Date().getFullYear(), semester: 1 });
  const [savingYear, setSavingYear] = useState(false);

  const [deleteClass, setDeleteClass] = useState<ClassEntity | null>(null);
  const [deleteYear, setDeleteYear] = useState<ClassYear | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [{ data: cData }, { data: clData }] = await Promise.all([
      supabase.from('courses').select('*').order('name'),
      supabase.from('classes').select('*, class_years(*)').order('name'),
    ]);
    setCourses(cData || []);
    setClasses(clData || []);
    setLoading(false);
  }

  function openNewClass(courseId?: string) {
    setEditingClass(null);
    setClassForm({ course_id: courseId || '', name: '' });
    setClassModalOpen(true);
  }

  function openEditClass(c: ClassEntity) {
    setEditingClass(c);
    setClassForm({ course_id: c.course_id, name: c.name });
    setClassModalOpen(true);
  }

  async function saveClass() {
    if (!classForm.name.trim() || !classForm.course_id) return;
    setSavingClass(true);
    if (editingClass) {
      await supabase.from('classes').update({ name: classForm.name, course_id: classForm.course_id }).eq('id', editingClass.id);
    } else {
      await supabase.from('classes').insert({ name: classForm.name, course_id: classForm.course_id });
    }
    setSavingClass(false);
    setClassModalOpen(false);
    loadData();
  }

  function openNewYear(classId: string) {
    setYearForClass(classId);
    setYearForm({ year: new Date().getFullYear(), semester: 1 });
    setYearModalOpen(true);
  }

  async function saveYear() {
    if (!yearForClass) return;
    setSavingYear(true);
    await supabase.from('class_years').insert({ class_id: yearForClass, year: yearForm.year, semester: yearForm.semester });
    setSavingYear(false);
    setYearModalOpen(false);
    loadData();
  }

  async function confirmDeleteClass() {
    if (!deleteClass) return;
    await supabase.from('classes').delete().eq('id', deleteClass.id);
    setDeleteClass(null);
    loadData();
  }

  async function confirmDeleteYear() {
    if (!deleteYear) return;
    await supabase.from('class_years').delete().eq('id', deleteYear.id);
    setDeleteYear(null);
    loadData();
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const courseMap = new Map(courses.map((c) => [c.id, c]));
  const classesByCourse = courses.map((c) => ({ course: c, items: classes.filter((cl) => cl.course_id === c.id) }));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Turmas"
        subtitle="Cadastre as turmas de cada curso e defina os anos letivos"
        action={
          <Button onClick={() => openNewClass()} disabled={courses.length === 0}>
            <Plus className="w-4 h-4" /> Nova Turma
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => <div key={i} className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse" />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200">
          <EmptyState icon={<BookOpen className="w-7 h-7" />} title="Cadastre um curso primeiro" description="Você precisa cadastrar um curso antes de criar turmas." />
        </div>
      ) : (
        <div className="space-y-4">
          {classesByCourse.map(({ course, items }) => (
            <div key={course.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">{course.name}</h3>
                    <p className="text-xs text-slate-500">{course.code} · {items.length} turma(s)</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => openNewClass(course.id)}><Plus className="w-3.5 h-3.5" /> Turma</Button>
              </div>

              {items.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-400 text-center">Nenhuma turma cadastrada neste curso.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {items.map((cl) => {
                    const isOpen = expanded.has(cl.id);
                    return (
                      <div key={cl.id}>
                        <div className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                          <button onClick={() => toggleExpand(cl.id)} className="p-0.5 text-slate-400 hover:text-slate-700">
                            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          <span className="text-sm font-medium text-slate-900 flex-1">{cl.name}</span>
                          <span className="text-xs text-slate-500">{cl.class_years?.length || 0} ano(s) letivo(s)</span>
                          <div className="flex gap-1">
                            <button onClick={() => openNewYear(cl.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50" title="Adicionar ano letivo">
                              <Calendar className="w-4 h-4" />
                            </button>
                            <button onClick={() => openEditClass(cl)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteClass(cl)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {isOpen && (
                          <div className="px-5 pb-4 pl-12">
                            {(!cl.class_years || cl.class_years.length === 0) ? (
                              <p className="text-xs text-slate-400 py-2">Nenhum ano letivo cadastrado.</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {cl.class_years.sort((a, b) => b.year - a.year || a.semester - b.semester).map((cy) => (
                                  <div key={cy.id} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                                    <Calendar className="w-3 h-3 text-slate-400" />
                                    <span className="font-medium text-slate-700">{cy.year}/{cy.semester}º</span>
                                    <button onClick={() => setDeleteYear(cy)} className="text-slate-300 hover:text-red-500">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Class modal */}
      <Modal open={classModalOpen} onClose={() => setClassModalOpen(false)} title={editingClass ? 'Editar Turma' : 'Nova Turma'}>
        <div className="space-y-4">
          <Select label="Curso *" value={classForm.course_id} onChange={(e) => setClassForm({ ...classForm, course_id: e.target.value })}>
            <option value="">Selecione...</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input label="Nome da turma *" value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} placeholder="Ex: Ano A, 1º Ano, Ano Básico" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setClassModalOpen(false)}>Cancelar</Button>
            <Button onClick={saveClass} disabled={savingClass || !classForm.name.trim() || !classForm.course_id}>{savingClass ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </div>
      </Modal>

      {/* Year modal */}
      <Modal open={yearModalOpen} onClose={() => setYearModalOpen(false)} title="Adicionar Ano Letivo" size="sm">
        <div className="space-y-4">
          <Input
            label="Ano *"
            type="number"
            value={yearForm.year}
            onChange={(e) => setYearForm({ ...yearForm, year: parseInt(e.target.value) || 0 })}
          />
          <Select label="Semestre *" value={String(yearForm.semester)} onChange={(e) => setYearForm({ ...yearForm, semester: parseInt(e.target.value) })}>
            <option value="1">1º Semestre</option>
            <option value="2">2º Semestre</option>
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setYearModalOpen(false)}>Cancelar</Button>
            <Button onClick={saveYear} disabled={savingYear}>{savingYear ? 'Salvando...' : 'Adicionar'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteClass} onClose={() => setDeleteClass(null)} onConfirm={confirmDeleteClass}
        title="Excluir turma" message={`Excluir a turma "${deleteClass?.name}"? Todos os anos letivos, vinculações e planos associados serão removidos.`} confirmLabel="Excluir" />
      <ConfirmDialog open={!!deleteYear} onClose={() => setDeleteYear(null)} onConfirm={confirmDeleteYear}
        title="Excluir ano letivo" message={`Excluir o ano letivo ${deleteYear?.year}/${deleteYear?.semester}º? Todas as vinculações e planos deste período serão removidos.`} confirmLabel="Excluir" />
    </div>
  );
}
