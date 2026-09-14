import { type ReactNode } from 'react';
import {
  LayoutDashboard, FileText, GraduationCap, BookOpen, Users,
  BarChart3, Settings, LogOut, Layers, Link2, ClipboardList,
  BookMarked, ChevronRight,
} from 'lucide-react';

export type Role = 'coordenacao' | 'professor';
export type PageId = string;

interface NavItem {
  id: PageId;
  label: string;
  icon: ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface LayoutProps {
  role: Role;
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onSwitchRole: () => void;
  children: ReactNode;
  selectedProfessorName?: string;
}

export function Layout({ role, currentPage, onNavigate, onSwitchRole, children, selectedProfessorName }: LayoutProps) {
  const coordSections: NavSection[] = [
    {
      title: 'Menu Principal',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
        { id: 'planos', label: 'Planos', icon: <FileText className="w-[18px] h-[18px]" /> },
      ],
    },
    {
      title: 'Estrutura Acadêmica',
      items: [
        { id: 'cursos', label: 'Cursos', icon: <GraduationCap className="w-[18px] h-[18px]" /> },
        { id: 'turmas', label: 'Turmas', icon: <BookOpen className="w-[18px] h-[18px]" /> },
        { id: 'disciplinas', label: 'Disciplinas', icon: <BookMarked className="w-[18px] h-[18px]" /> },
        { id: 'vinculacoes', label: 'Vinculações', icon: <Link2 className="w-[18px] h-[18px]" /> },
      ],
    },
    {
      title: 'Gestão',
      items: [
        { id: 'professores', label: 'Professores', icon: <Users className="w-[18px] h-[18px]" /> },
        { id: 'relatorios', label: 'Relatórios', icon: <BarChart3 className="w-[18px] h-[18px]" /> },
        { id: 'configuracoes', label: 'Configurações', icon: <Settings className="w-[18px] h-[18px]" /> },
      ],
    },
  ];

  const profItems: NavItem[] = [
    { id: 'meus-planos', label: 'Meus Planos', icon: <ClipboardList className="w-[18px] h-[18px]" /> },
  ];

  const sections = role === 'coordenacao' ? coordSections : [{ title: 'Menu', items: profItems }];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">Plano de Ensino</h1>
              <p className="text-[11px] text-slate-500 leading-tight">Sistema de Gestão</p>
            </div>
          </div>
        </div>

        {/* Role badge */}
        <div className="px-4 py-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
            role === 'coordenacao' ? 'bg-slate-900 text-white' : 'bg-blue-50 text-blue-700'
          }`}>
            {role === 'coordenacao' ? (
              <>
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Coordenação</span>
              </>
            ) : (
              <>
                <Users className="w-3.5 h-3.5" />
                <span>Professor{selectedProfessorName ? `: ${selectedProfessorName}` : ''}</span>
              </>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {sections.map((section) => (
            <div key={section.title} className="mb-5">
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                        active
                          ? 'bg-slate-100 text-slate-900 font-medium'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {item.icon}
                      <span className="flex-1 text-left">{item.label}</span>
                      {active && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-slate-100 space-y-1">
          <button
            onClick={onSwitchRole}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Trocar perfil</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
