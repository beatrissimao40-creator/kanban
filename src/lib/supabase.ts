import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CRMTask, TaskStatus } from '../types/crm.ts';

const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Check if credentials look like actual Supabase credentials (not default placeholders)
export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(envUrl) &&
    Boolean(envKey) &&
    !envUrl.includes('seu-projeto') &&
    !envKey.includes('sua-anon-key') &&
    envUrl.startsWith('http')
  );
};

export const SUPABASE_URL = envUrl;

let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!clientInstance) {
    try {
      clientInstance = createClient(envUrl, envKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.error('Erro ao inicializar Supabase client:', err);
      return null;
    }
  }
  return clientInstance;
};

// SQL script template to paste into Supabase SQL Editor
export const SUPABASE_SETUP_SQL = `-- Script de Configuração e Correção de Permissões para o CRM Kanban no Supabase
-- Execute este script no painel do Supabase > SQL Editor > New Query

-- 1. Criação da tabela de tarefas do CRM (caso ainda não exista)
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  status text not null check (status in ('Não iniciado', 'Em Andamento', 'Finalizado')),
  client_name text default '',
  client_email text default '',
  client_phone text default '',
  client_company text default '',
  value numeric default 0,
  priority text default 'Média',
  due_date text default '',
  assigned_to text default '',
  tags text[] default array[]::text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Índices para performance
create index if not exists idx_tasks_status on public.tasks (status);
create index if not exists idx_tasks_created_at on public.tasks (created_at desc);

-- 3. CONCESSÃO DE PRIVILÉGIOS (Resolve o erro 42501 - permission denied for table tasks)
-- Concede permissões para as roles do Supabase (anon para chave pública, authenticated para usuários logados)
grant usage on schema public to anon, authenticated, service_role;
grant all on table public.tasks to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

-- 4. Habilitar Row Level Security (RLS)
alter table public.tasks enable row level security;

-- 5. Políticas de Acesso RLS
drop policy if exists "Permitir acesso completo a tarefas" on public.tasks;
drop policy if exists "Permitir leitura de tarefas para todos" on public.tasks;
drop policy if exists "Permitir inserção de tarefas para todos" on public.tasks;
drop policy if exists "Permitir atualização de tarefas para todos" on public.tasks;
drop policy if exists "Permitir exclusão de tarefas para todos" on public.tasks;

create policy "Permitir acesso completo a tarefas" 
  on public.tasks 
  for all 
  using (true) 
  with check (true);

-- 6. Habilitar Realtime para a tabela tasks
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'tasks'
  ) then
    alter publication supabase_realtime add table public.tasks;
  end if;
end;
$$;
`;

const LOCAL_STORAGE_KEY = 'crm_kanban_tasks_v1';

// Local storage helpers
export const getLocalTasks = (): CRMTask[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (e) {
    console.error('Erro ao ler tarefas locais:', e);
    return [];
  }
};

export const saveLocalTasks = (tasks: CRMTask[]): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Erro ao salvar tarefas locais:', e);
  }
};

// Test connection to Supabase and verify if the 'tasks' table exists
export const testSupabaseConnection = async (): Promise<{
  success: boolean;
  message: string;
  tableExists: boolean;
}> => {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não configuradas no arquivo .env',
      tableExists: false,
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      message: 'Falha ao instanciar o cliente Supabase.',
      tableExists: false,
    };
  }

  try {
    const { data, error } = await supabase.from('tasks').select('id').limit(1);

    if (error) {
      if (error.code === '42P01' || error.message?.includes('relation "public.tasks" does not exist') || error.message?.includes('does not exist')) {
        return {
          success: true,
          message: 'Conectado ao Supabase com sucesso! Porém a tabela "tasks" ainda não foi criada. Execute o script SQL no painel do Supabase.',
          tableExists: false,
        };
      }
      return {
        success: false,
        message: `Erro ao consultar Supabase: ${error.message}`,
        tableExists: false,
      };
    }

    return {
      success: true,
      message: 'Conectado e tabela "tasks" verificada com sucesso no Supabase!',
      tableExists: true,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Erro de rede ou conexão com o Supabase.',
      tableExists: false,
    };
  }
};

// Fetch tasks from Supabase or fallback to Local Storage
export const fetchTasksService = async (): Promise<{
  tasks: CRMTask[];
  source: 'supabase' | 'local';
  tableMissing?: boolean;
}> => {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Erro ao buscar tarefas do Supabase:', error);
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return {
            tasks: getLocalTasks(),
            source: 'local',
            tableMissing: true,
          };
        }
        return {
          tasks: getLocalTasks(),
          source: 'local',
        };
      }

      if (data) {
        // Map database records to CRMTask format
        const formatted: CRMTask[] = data.map((item: any) => ({
          id: String(item.id),
          title: item.title || '',
          description: item.description || '',
          status: (item.status as TaskStatus) || 'Não iniciado',
          client_name: item.client_name || '',
          client_email: item.client_email || '',
          client_phone: item.client_phone || '',
          client_company: item.client_company || '',
          value: Number(item.value) || 0,
          priority: item.priority || 'Média',
          due_date: item.due_date || '',
          assigned_to: item.assigned_to || '',
          tags: Array.isArray(item.tags) ? item.tags : [],
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
        }));

        // Keep local mirror updated in case user goes offline
        saveLocalTasks(formatted);

        return {
          tasks: formatted,
          source: 'supabase',
        };
      }
    } catch (err) {
      console.warn('Falha de conexão com Supabase, usando armazenamento local:', err);
    }
  }

  return {
    tasks: getLocalTasks(),
    source: 'local',
  };
};

// Create a task
export const createTaskService = async (
  taskData: Omit<CRMTask, 'id' | 'created_at' | 'updated_at'>
): Promise<{ task: CRMTask; source: 'supabase' | 'local' }> => {
  const now = new Date().toISOString();
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            title: taskData.title,
            description: taskData.description,
            status: taskData.status,
            client_name: taskData.client_name,
            client_email: taskData.client_email,
            client_phone: taskData.client_phone,
            client_company: taskData.client_company,
            value: taskData.value,
            priority: taskData.priority,
            due_date: taskData.due_date,
            assigned_to: taskData.assigned_to,
            tags: taskData.tags,
            created_at: now,
            updated_at: now,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        const newTask: CRMTask = {
          id: String(data.id),
          title: data.title,
          description: data.description || '',
          status: data.status,
          client_name: data.client_name || '',
          client_email: data.client_email || '',
          client_phone: data.client_phone || '',
          client_company: data.client_company || '',
          value: Number(data.value) || 0,
          priority: data.priority || 'Média',
          due_date: data.due_date || '',
          assigned_to: data.assigned_to || '',
          tags: Array.isArray(data.tags) ? data.tags : [],
          created_at: data.created_at,
          updated_at: data.updated_at,
        };

        // Update local mirror
        const currentLocal = getLocalTasks();
        saveLocalTasks([newTask, ...currentLocal]);

        return { task: newTask, source: 'supabase' };
      }
    } catch (err) {
      console.warn('Falha ao salvar no Supabase, salvando localmente:', err);
    }
  }

  // Fallback to local storage
  const newTask: CRMTask = {
    ...taskData,
    id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    created_at: now,
    updated_at: now,
  };

  const currentLocal = getLocalTasks();
  const updated = [newTask, ...currentLocal];
  saveLocalTasks(updated);

  return { task: newTask, source: 'local' };
};

// Update a task (e.g. status change, content edit)
export const updateTaskService = async (
  id: string,
  updates: Partial<CRMTask>
): Promise<{ task: CRMTask; source: 'supabase' | 'local' }> => {
  const now = new Date().toISOString();
  const supabase = getSupabaseClient();

  if (supabase && !id.startsWith('local_')) {
    try {
      const payload: any = {
        ...updates,
        updated_at: now,
      };
      delete payload.id;

      const { data, error } = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        const updatedTask: CRMTask = {
          id: String(data.id),
          title: data.title,
          description: data.description || '',
          status: data.status,
          client_name: data.client_name || '',
          client_email: data.client_email || '',
          client_phone: data.client_phone || '',
          client_company: data.client_company || '',
          value: Number(data.value) || 0,
          priority: data.priority || 'Média',
          due_date: data.due_date || '',
          assigned_to: data.assigned_to || '',
          tags: Array.isArray(data.tags) ? data.tags : [],
          created_at: data.created_at,
          updated_at: data.updated_at,
        };

        // Update local cache
        const local = getLocalTasks();
        const updatedList = local.map((t) => (t.id === id ? updatedTask : t));
        saveLocalTasks(updatedList);

        return { task: updatedTask, source: 'supabase' };
      }
    } catch (err) {
      console.warn('Erro ao atualizar no Supabase, usando local:', err);
    }
  }

  // Local update
  const local = getLocalTasks();
  const existing = local.find((t) => t.id === id);
  const updatedTask: CRMTask = existing
    ? { ...existing, ...updates, updated_at: now }
    : ({
        id,
        title: updates.title || '',
        description: updates.description || '',
        status: updates.status || 'Não iniciado',
        client_name: updates.client_name || '',
        client_email: updates.client_email || '',
        client_phone: updates.client_phone || '',
        client_company: updates.client_company || '',
        value: updates.value || 0,
        priority: updates.priority || 'Média',
        due_date: updates.due_date || '',
        assigned_to: updates.assigned_to || '',
        tags: updates.tags || [],
        created_at: now,
        updated_at: now,
      } as CRMTask);

  const updatedList = local.map((t) => (t.id === id ? updatedTask : t));
  if (!existing) {
    updatedList.unshift(updatedTask);
  }
  saveLocalTasks(updatedList);

  return { task: updatedTask, source: 'local' };
};

// Delete a task
export const deleteTaskService = async (id: string): Promise<boolean> => {
  const supabase = getSupabaseClient();

  if (supabase && !id.startsWith('local_')) {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (!error) {
        const local = getLocalTasks().filter((t) => t.id !== id);
        saveLocalTasks(local);
        return true;
      }
    } catch (err) {
      console.warn('Erro ao deletar no Supabase, deletando local:', err);
    }
  }

  const local = getLocalTasks().filter((t) => t.id !== id);
  saveLocalTasks(local);
  return true;
};

// Sincroniza tarefas locais para o Supabase
export const syncLocalTasksToSupabase = async (
  localTasks: CRMTask[]
): Promise<{ count: number; error?: string }> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { count: 0, error: 'Supabase não está configurado.' };
  }

  if (localTasks.length === 0) {
    return { count: 0 };
  }

  try {
    const payload = localTasks.map((t) => ({
      title: t.title,
      description: t.description,
      status: t.status,
      client_name: t.client_name,
      client_email: t.client_email,
      client_phone: t.client_phone,
      client_company: t.client_company,
      value: t.value,
      priority: t.priority,
      due_date: t.due_date,
      assigned_to: t.assigned_to,
      tags: t.tags,
      created_at: t.created_at,
      updated_at: t.updated_at,
    }));

    const { data, error } = await supabase.from('tasks').insert(payload).select();

    if (error) {
      return { count: 0, error: error.message };
    }

    return { count: data?.length || 0 };
  } catch (err: any) {
    return { count: 0, error: err.message || 'Erro inesperado na sincronização.' };
  }
};
