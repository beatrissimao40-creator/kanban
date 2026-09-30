import React from 'react';
import { 
  Kanban, 
  Plus, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase.ts';

interface NavbarProps {
  onOpenNewTask: () => void;
  onOpenSupabaseGuide: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  dataSource: 'supabase' | 'local';
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewTask,
  onOpenSupabaseGuide,
  onRefresh,
  isRefreshing,
  dataSource,
}) => {
  const configured = isSupabaseConfigured();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo and App Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <Kanban className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 leading-none">
                CRM Kanban
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                Pipeline
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Gestão de tarefas, contatos e oportunidades
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Supabase Status Button */}
          <button
            onClick={onOpenSupabaseGuide}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              dataSource === 'supabase'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100/70'
                : configured
                ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100/70'
                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100/70'
            }`}
            title="Clique para ver configuração e script SQL do Supabase"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${dataSource === 'supabase' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {dataSource === 'supabase' ? 'Supabase Conectado' : 'Pronto p/ Supabase'}
            </span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Atualizar dados"
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* New Task Button */}
          <button
            onClick={onOpenNewTask}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs hover:shadow-md transition active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>
    </header>
  );
};
