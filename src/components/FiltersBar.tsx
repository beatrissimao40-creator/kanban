import React from 'react';
import { Search, Filter, X, LayoutGrid, List } from 'lucide-react';
import { TaskFilter, TASK_PRIORITIES } from '../types/crm.ts';

interface FiltersBarProps {
  filter: TaskFilter;
  onFilterChange: (newFilter: TaskFilter) => void;
  availableAssignees: string[];
  viewMode: 'kanban' | 'table';
  onViewModeChange: (mode: 'kanban' | 'table') => void;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  filter,
  onFilterChange,
  availableAssignees,
  viewMode,
  onViewModeChange,
}) => {
  const hasActiveFilters = Boolean(
    filter.search || filter.priority || filter.assigned_to || filter.tag
  );

  const handleClearFilters = () => {
    onFilterChange({
      search: '',
      priority: '',
      assigned_to: '',
      tag: '',
    });
  };

  return (
    <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
      {/* Left: Search & Filter Selectors */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filter.search}
            onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
            placeholder="Buscar por título, cliente, empresa ou tag..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
          />
          {filter.search && (
            <button
              onClick={() => onFilterChange({ ...filter, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Priority Filter */}
        <select
          value={filter.priority}
          onChange={(e) => onFilterChange({ ...filter, priority: e.target.value })}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-medium"
        >
          <option value="">Todas as Prioridades</option>
          {TASK_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              Prioridade: {p}
            </option>
          ))}
        </select>

        {/* Assignee Filter */}
        {availableAssignees.length > 0 && (
          <select
            value={filter.assigned_to}
            onChange={(e) => onFilterChange({ ...filter, assigned_to: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-medium"
          >
            <option value="">Todos os Responsáveis</option>
            {availableAssignees.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center gap-1 font-medium transition"
          >
            <X className="w-3.5 h-3.5" /> Limpar filtros
          </button>
        )}
      </div>

      {/* Right: View Switcher */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-end md:self-auto">
        <button
          onClick={() => onViewModeChange('kanban')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
            viewMode === 'kanban'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Kanban</span>
        </button>
        <button
          onClick={() => onViewModeChange('table')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
            viewMode === 'table'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span>Tabela</span>
        </button>
      </div>
    </div>
  );
};
