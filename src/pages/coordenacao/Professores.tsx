import { useEffect, useState } from 'react';
import { Users, Plus, Pencil, Trash2, Search, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Professor } from '@/lib/types';
import { PageHeader } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export function ProfessoresPage() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Professor | null>(null);
  const [form, setForm] = useState({ name: '', email: '', department: '' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Professor | null>(null);
  const [planCounts, setPlanCounts] = useState<Record<string, number>>({});

  useEffect(() => { loadProfessors(); }, []);

  async function loadProfessors() {
    setLoading(true);
    const { data } = await supabase.from('professors').select('*').order('name');
    setProfessors(data || []);
    if (data && data.length > 0) {
      const counts: Record<string, number> = {};
      for (const p of data) {
        const { count } = await supabase.from('teaching_plans').select('id', { count: 'exact', head: true }).eq('professor_id', p.id);
        counts[p.id] = count || 0;
      }
      setPlanCounts(counts);
    }
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm({ name: '', email: '', department: '' });
    setModalOpen(true);
  }

  function openEdit(p: Professor) {
    setEditing(p);
    setForm({ name: p.name, email: p.email, department: p.department });
    setModalOpen(true);
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editing) {
      await supabase.from('professors').update(form).eq('id', editing.id);
    } else {
      await supabase.from('professors').insert(form);
    }
    setSaving(false);
    setModalOpen(false);
    loadProfessors();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await supabase.from('professors').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    loadProfessors();
  }

  const filtered = professors.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Professores"
        subtitle="Cadastre os professores que serão vinculados às disciplinas"
        action={<Button onClick={openNew}><Plus className="w-4 h-4" /> Novo Professor</Button>}
      />

      {professors.length > 0 && (
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
          />
        </div>
      )}

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse" />)}
        </div>
      ) : professors.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200">
          <EmptyState icon={<Users className="w-7 h-7" />} title="Nenhum professor cadastrado" description="Cadastre os professores para que possam ser vinculados às disciplinas." action={<Button onClick={openNew}><Plus className="w-4 h-4" /> Novo Professor</Button>} />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 group hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white text-sm font-semibold">
                  {p.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="font-semibold text-slate-900">{p.name}</h3>
              {p.email && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span className="text-xs text-slate-500">{p.email}</span>
                </div>
              )}
              {p.department && <p className="text-xs text-slate-500 mt-1">{p.department}</p>}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-500">{planCounts[p.id] || 0} plano(s) de ensino</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Professor' : 'Novo Professor'}>
        <div className="space-y-4">
          <Input label="Nome *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Pe. João Silva" />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@instituicao.edu" />
          <Input label="Departamento" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Ex: Teologia Sistemática" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving || !form.name.trim()}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete}
        title="Excluir professor" message={`Excluir o professor "${deleteTarget?.name}"? Os planos de ensino vinculados a ele ficarão sem professor.`} confirmLabel="Excluir" />
    </div>
  );
}
