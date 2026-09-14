import { useEffect, useState } from 'react';
import { Users, ClipboardList, ArrowRight, Layers, LockKeyhole } from 'lucide-react';
import { Layout, type Role } from '@/components/Layout';
import { DashboardPage } from '@/pages/coordenacao/Dashboard';
import { CursosPage } from '@/pages/coordenacao/Cursos';
import { TurmasPage } from '@/pages/coordenacao/Turmas';
import { DisciplinasPage } from '@/pages/coordenacao/Disciplinas';
import { ProfessoresPage } from '@/pages/coordenacao/Professores';
import { VinculacoesPage } from '@/pages/coordenacao/Vinculacoes';
import { PlanosPage } from '@/pages/coordenacao/Planos';
import { RevisarPlanoPage } from '@/pages/coordenacao/RevisarPlano';
import { RelatoriosPage } from '@/pages/coordenacao/Relatorios';
import { ConfiguracoesPage } from '@/pages/coordenacao/Configuracoes';
import { MeusPlanosPage } from '@/pages/professor/MeusPlanos';
import { EditarPlanoPage } from '@/pages/professor/EditarPlano';
import { VisualizarPlanoPage } from '@/pages/professor/VisualizarPlano';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase';
import type { Professor } from '@/lib/types';

type PageId =
  | 'dashboard' | 'planos' | 'cursos' | 'turmas' | 'disciplinas'
  | 'vinculacoes' | 'professores' | 'relatorios' | 'configuracoes'
  | 'revisar-plano'
  | 'meus-planos' | 'editar-plano' | 'visualizar-plano';

function App() {
  const [role, setRole] = useState<Role | null>(null);
  const [page, setPage] = useState<PageId>('dashboard');
  const [reviewPlanId, setReviewPlanId] = useState<string | null>(null);
  const [editPlanId, setEditPlanId] = useState<string | null>(null);
  const [viewPlanId, setViewPlanId] = useState<string | null>(null);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [selectedProfessorId, setSelectedProfessorId] = useState<string | null>(null);

  useEffect(() => {
    if (role === 'professor') {
      supabase.from('professors').select('*').order('name').then(({ data }) => {
        setProfessors(data || []);
      });
    }
  }, [role]);

  function navigate(p: string) {
    setPage(p as PageId);
    if (p !== 'revisar-plano') setReviewPlanId(null);
    if (p !== 'editar-plano') setEditPlanId(null);
    if (p !== 'visualizar-plano') setViewPlanId(null);
  }

  function switchRole() {
    setRole(null);
    setPage('dashboard');
    setSelectedProfessorId(null);
    setReviewPlanId(null);
    setEditPlanId(null);
    setViewPlanId(null);
  }

  if (!role) {
    return <RoleSelection onSelect={setRole} professors={professors} onProfessorsLoad={setProfessors} selectedProfessorId={selectedProfessorId} setSelectedProfessorId={setSelectedProfessorId} />;
  }

  const selectedProfessor = professors.find((p) => p.id === selectedProfessorId);
  const professorName = selectedProfessor ? selectedProfessor.name.split(' ')[0] : '';

  return (
    <Layout
      role={role}
      currentPage={page}
      onNavigate={navigate}
      onSwitchRole={switchRole}
      selectedProfessorName={professorName}
    >
      {role === 'coordenacao' && (
        <>
          {page === 'dashboard' && <DashboardPage />}
          {page === 'cursos' && <CursosPage />}
          {page === 'turmas' && <TurmasPage />}
          {page === 'disciplinas' && <DisciplinasPage />}
          {page === 'professores' && <ProfessoresPage />}
          {page === 'vinculacoes' && <VinculacoesPage />}
          {page === 'planos' && <PlanosPage onReview={(id) => { setReviewPlanId(id); setPage('revisar-plano'); }} />}
          {page === 'revisar-plano' && reviewPlanId && <RevisarPlanoPage planId={reviewPlanId} onBack={() => setPage('planos')} />}
          {page === 'relatorios' && <RelatoriosPage />}
          {page === 'configuracoes' && <ConfiguracoesPage />}
        </>
      )}

      {role === 'professor' && selectedProfessorId && (
        <>
          {page === 'meus-planos' && (
            <MeusPlanosPage
              professorId={selectedProfessorId}
              onEdit={(id) => { setEditPlanId(id); setPage('editar-plano'); }}
              onView={(id) => { setViewPlanId(id); setPage('visualizar-plano'); }}
            />
          )}
          {page === 'editar-plano' && editPlanId && (
            <EditarPlanoPage
              planId={editPlanId}
              onBack={() => setPage('meus-planos')}
              onView={() => { setViewPlanId(editPlanId); setPage('visualizar-plano'); }}
            />
          )}
          {page === 'visualizar-plano' && viewPlanId && (
            <VisualizarPlanoPage
              planId={viewPlanId}
              onBack={() => setPage('meus-planos')}
              onEdit={() => { setEditPlanId(viewPlanId); setPage('editar-plano'); }}
            />
          )}
        </>
      )}

      {role === 'professor' && !selectedProfessorId && (
        <ProfessorSelection
          professors={professors}
          onSelect={(id) => { setSelectedProfessorId(id); setPage('meus-planos'); }}
        />
      )}
    </Layout>
  );
}

function RoleSelection({ onSelect, professors, onProfessorsLoad, selectedProfessorId, setSelectedProfessorId }: {
  onSelect: (role: Role) => void;
  professors: Professor[];
  onProfessorsLoad: (p: Professor[]) => void;
  selectedProfessorId: string | null;
  setSelectedProfessorId: (id: string | null) => void;
}) {
  const [showProfSelect, setShowProfSelect] = useState(false);
  const [coordPasswordOpen, setCoordPasswordOpen] = useState(false);
  const [coordPassword, setCoordPassword] = useState('');
  const [coordPasswordError, setCoordPasswordError] = useState('');
  const [profs, setProfs] = useState<Professor[]>([]);

  useEffect(() => {
    supabase.from('professors').select('*').order('name').then(({ data }) => {
      setProfs(data || []);
      onProfessorsLoad(data || []);
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Plano de Ensino</h1>
            <p className="text-sm text-slate-500">Sistema de Gestão</p>
          </div>
        </div>

        {!showProfSelect ? (
          <div className="space-y-3">
            <RoleCard
              icon={<ClipboardList className="w-6 h-6" />}
              title="Coordenação"
              description="Gerenciar estrutura acadêmica, vinculações e revisar planos"
              onClick={() => {
                setCoordPassword('');
                setCoordPasswordError('');
                setCoordPasswordOpen(true);
              }}
            />
            <RoleCard
              icon={<Users className="w-6 h-6" />}
              title="Professor"
              description="Visualizar e editar planos de ensino atribuídos"
              onClick={() => setShowProfSelect(true)}
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-1">Selecione o professor</h2>
            <p className="text-sm text-slate-500 mb-4">Escolha qual professor você é para acessar seus planos.</p>
            {profs.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Nenhum professor cadastrado. A coordenação precisa cadastrar professores primeiro.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {profs.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedProfessorId(p.id); onSelect('professor'); }}
                    className="w-full flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-semibold">
                      {p.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{p.name}</p>
                      {p.department && <p className="text-xs text-slate-500">{p.department}</p>}
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setShowProfSelect(false)} className="w-full mt-4 text-sm text-slate-500 hover:text-slate-900 transition-colors">
              Voltar
            </button>
          </div>
        )}

        <Modal
          open={coordPasswordOpen}
          onClose={() => setCoordPasswordOpen(false)}
          title="Acesso da Coordenação"
          size="sm"
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (coordPassword !== '32261340') {
                setCoordPasswordError('Senha incorreta. Tente novamente.');
                return;
              }
              setCoordPasswordOpen(false);
              onSelect('coordenacao');
            }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 p-3">
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <LockKeyhole className="w-4 h-4" />
              </div>
              <p className="text-sm text-slate-600">Digite a senha para acessar a área da Coordenação.</p>
            </div>
            <Input
              autoFocus
              label="Senha"
              type="password"
              value={coordPassword}
              onChange={(event) => {
                setCoordPassword(event.target.value);
                setCoordPasswordError('');
              }}
              error={coordPasswordError}
              placeholder="Digite a senha"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCoordPasswordOpen(false)}>Cancelar</Button>
              <Button type="submit">Entrar na Coordenação</Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}

function RoleCard({ icon, title, description, onClick }: { icon: React.ReactNode; title: string; description: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all text-left group"
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
    </button>
  );
}

function ProfessorSelection({ professors, onSelect }: { professors: Professor[]; onSelect: (id: string) => void }) {
  return (
    <div className="p-8 max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Selecione o professor</h2>
        <div className="space-y-2">
          {professors.map((p) => (
            <button key={p.id} onClick={() => onSelect(p.id)} className="w-full flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
              <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-semibold">
                {p.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
              <span className="text-sm font-medium text-slate-900">{p.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
