import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Database, 
  Plus, 
  AlertCircle, 
  Check, 
  Sparkles, 
  Layers 
} from 'lucide-react';
import { CRMTask, TaskStatus, TaskFilter } from './types/crm.ts';
import { 
  fetchTasksService, 
  createTaskService, 
  updateTaskService, 
  deleteTaskService,
  isSupabaseConfigured,
  getSupabaseClient
} from './lib/supabase.ts';
import { Navbar } from './components/Navbar.tsx';
import { MetricsBar } from './components/MetricsBar.tsx';
import { FiltersBar } from './components/FiltersBar.tsx';
import { KanbanBoard } from './components/KanbanBoard.tsx';
import { TableView } from './components/TableView.tsx';
import { TaskModal } from './components/TaskModal.tsx';
import { TaskDetailModal } from './components/TaskDetailModal.tsx';
import { SupabaseGuideModal } from './components/SupabaseGuideModal.tsx';

export default function App() {
  const [tasks, setTasks] = useState<CRMTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState<'supabase' | 'local'>('local');
  const [tableMissing, setTableMissing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSupabaseGuideOpen, setIsSupabaseGuideOpen] = useState(false);
  
  // Selected or editing task
  const [selectedTask, setSelectedTask] = useState<CRMTask | null>(null);
  const [editingTask, setEditingTask] = useState<CRMTask | null>(null);
  const [defaultStatusForNew, setDefaultStatusForNew] = useState<TaskStatus>('Não iniciado');

  // View & Filters
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [filter, setFilter] = useState<TaskFilter>({
    search: '',
    priority: '',
    assigned_to: '',
    tag: '',
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  }, []);

  // Load tasks on mount
  const loadTasks = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setRefreshing(true);
    try {
      const result = await fetchTasksService();
      setTasks(result.tasks);
      setDataSource(result.source);
      if (result.tableMissing) {
        setTableMissing(true);
      } else {
        setTableMissing(false);
      }
    } catch (e) {
      console.error('Erro ao carregar tarefas:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Real-time Supabase Subscription
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const channel = supabase
        .channel('tasks-realtime-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks' },
          () => {
            loadTasks(true);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Realtime subscription error:', err);
    }
  }, [loadTasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filter.search) {
        const query = filter.search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesClient = task.client_name?.toLowerCase().includes(query);
        const matchesCompany = task.client_company?.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query);
        const matchesTag = task.tags?.some((t) => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesClient && !matchesCompany && !matchesDesc && !matchesTag) {
          return false;
        }
      }
      if (filter.priority && task.priority !== filter.priority) {
        return false;
      }
      if (filter.assigned_to && task.assigned_to !== filter.assigned_to) {
        return false;
      }
      if (filter.tag && !task.tags?.includes(filter.tag)) {
        return false;
      }
      return true;
    });
  }, [tasks, filter]);

  // List of distinct assignees for filtering
  const availableAssignees = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.assigned_to && t.assigned_to.trim()) {
        set.add(t.assigned_to.trim());
      }
    });
    return Array.from(set).sort();
  }, [tasks]);

  // Handlers for Task CRUD
  const handleOpenNewTask = (status: TaskStatus = 'Não iniciado') => {
    setEditingTask(null);
    setDefaultStatusForNew(status);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: CRMTask) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSelectTask = (task: CRMTask) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  const handleSaveTask = async (
    taskData: Omit<CRMTask, 'id' | 'created_at' | 'updated_at'>,
    taskId?: string
  ) => {
    if (taskId) {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...taskData, updated_at: new Date().toISOString() } : t))
      );
      if (selectedTask?.id === taskId) {
        setSelectedTask((prev) => (prev ? { ...prev, ...taskData } : null));
      }
      const res = await updateTaskService(taskId, taskData);
      showToast('Tarefa atualizada com sucesso!');
      if (res.source === 'supabase') setDataSource('supabase');
    } else {
      const res = await createTaskService(taskData);
      setTasks((prev) => [res.task, ...prev]);
      showToast('Nova tarefa criada no Kanban!');
      if (res.source === 'supabase') setDataSource('supabase');
    }
  };

  const handleStatusChange = async (id: string, newStatus: TaskStatus) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t))
    );
    if (selectedTask?.id === id) {
      setSelectedTask((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      await updateTaskService(id, { status: newStatus });
      showToast(`Tarefa movida para "${newStatus}"`);
    } catch (e) {
      console.error('Erro ao atualizar status:', e);
      loadTasks(true);
    }
  };

  const handleDeleteTask = async (id: string) => {
    // Optimistic delete
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (selectedTask?.id === id) {
      setSelectedTask(null);
      setIsDetailModalOpen(false);
    }
    await deleteTaskService(id);
    showToast('Tarefa excluída.');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom-2 fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        onOpenNewTask={() => handleOpenNewTask('Não iniciado')}
        onOpenSupabaseGuide={() => setIsSupabaseGuideOpen(true)}
        onRefresh={() => loadTasks(false)}
        isRefreshing={refreshing}
        dataSource={dataSource}
      />

      {/* Alert Banner if Table doesn't exist yet in Supabase */}
      {tableMissing && (
        <div className="bg-amber-500 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Conexão com Supabase ativa, mas a tabela <strong>tasks</strong> ainda não foi criada.
            </span>
            <button
              onClick={() => setIsSupabaseGuideOpen(true)}
              className="ml-auto underline hover:opacity-80 transition font-bold"
            >
              Ver script SQL
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex flex-col gap-6">
        {/* Metrics Row */}
        <MetricsBar tasks={tasks} />

        {/* Filters and View Switcher */}
        <FiltersBar
          filter={filter}
          onFilterChange={setFilter}
          availableAssignees={availableAssignees}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Content Area (Kanban or Table) */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-8 h-8 border-3 border-slate-300 border-t-slate-800 rounded-full animate-spin mb-3" />
            <p className="text-xs font-medium">Carregando tarefas do CRM...</p>
          </div>
        ) : tasks.length === 0 ? (
          /* Empty CRM State (Clean, no pre-filled fake data as strictly requested) */
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-10 md:p-14 text-center max-w-xl mx-auto my-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <Layers className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Seu Kanban está pronto e aguardando tarefas
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
              Você pode criar suas tarefas e oportunidades manualmente e movê-las livremente entre as colunas <strong>Não iniciado</strong>, <strong>Em Andamento</strong> e <strong>Finalizado</strong>.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => handleOpenNewTask('Não iniciado')}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                Criar Primeira Tarefa
              </button>
              <button
                onClick={() => setIsSupabaseGuideOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <Database className="w-4 h-4 text-emerald-600" />
                Conectar ao Supabase
              </button>
            </div>
          </div>
        ) : viewMode === 'kanban' ? (
          <KanbanBoard
            tasks={filteredTasks}
            onSelectTask={handleSelectTask}
            onEditTask={handleOpenEditTask}
            onDeleteTask={handleDeleteTask}
            onStatusChange={handleStatusChange}
            onAddTask={(st) => handleOpenNewTask(st)}
          />
        ) : (
          <TableView
            tasks={filteredTasks}
            onSelectTask={handleSelectTask}
            onEditTask={handleOpenEditTask}
            onDeleteTask={handleDeleteTask}
            onStatusChange={handleStatusChange}
          />
        )}
      </main>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        initialTask={editingTask}
        defaultStatus={defaultStatusForNew}
      />

      <TaskDetailModal
        task={selectedTask}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onEdit={(task) => {
          setIsDetailModalOpen(false);
          handleOpenEditTask(task);
        }}
        onDelete={handleDeleteTask}
        onStatusChange={handleStatusChange}
      />

      <SupabaseGuideModal
        isOpen={isSupabaseGuideOpen}
        onClose={() => setIsSupabaseGuideOpen(false)}
        localTasks={tasks.filter((t) => t.id.startsWith('local_'))}
        onTasksSynced={() => loadTasks(false)}
      />
    </div>
  );
}
