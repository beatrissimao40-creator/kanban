import React, { useState } from 'react';
import { 
  Database, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertTriangle, 
  ExternalLink, 
  X,
  CloudUpload
} from 'lucide-react';
import { 
  SUPABASE_SETUP_SQL, 
  isSupabaseConfigured, 
  testSupabaseConnection, 
  syncLocalTasksToSupabase,
  SUPABASE_URL
} from '../lib/supabase.ts';
import { CRMTask } from '../types/crm.ts';

interface SupabaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  localTasks: CRMTask[];
  onTasksSynced: () => void;
}

export const SupabaseGuideModal: React.FC<SupabaseGuideModalProps> = ({
  isOpen,
  onClose,
  localTasks,
  onTasksSynced,
}) => {
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    tableExists: boolean;
  }>({
    tested: false,
    success: false,
    message: '',
    tableExists: false,
  });
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runConnectionTest = async () => {
    setTesting(true);
    setTestResult((prev) => ({ ...prev, tested: false }));
    try {
      const res = await testSupabaseConnection();
      setTestResult({
        tested: true,
        success: res.success,
        message: res.message,
        tableExists: res.tableExists,
      });
    } catch (e: any) {
      setTestResult({
        tested: true,
        success: false,
        message: e.message || 'Erro ao testar conexão.',
        tableExists: false,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSyncToSupabase = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await syncLocalTasksToSupabase(localTasks);
      if (res.error) {
        setSyncMessage(`Erro ao sincronizar: ${res.error}`);
      } else {
        setSyncMessage(`${res.count} tarefas sincronizadas com sucesso para o Supabase!`);
        onTasksSynced();
      }
    } catch (e: any) {
      setSyncMessage(`Erro: ${e.message || 'Falha ao sincronizar'}`);
    } finally {
      setSyncing(false);
    }
  };

  const configured = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Conexão com o Supabase
              </h2>
              <p className="text-xs text-slate-500">
                Pronto para salvar e sincronizar todas as suas tarefas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Status Box */}
          <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
            configured 
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
              : 'bg-amber-50/70 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                {configured ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-semibold text-sm">
                    {configured
                      ? 'Credenciais do Supabase detectadas no ambiente'
                      : 'Modo Local Ativo (Aguardando configuração de .env)'}
                  </h4>
                  <p className="text-xs mt-0.5 opacity-90">
                    {configured
                      ? `Conectado ao endpoint: ${SUPABASE_URL}`
                      : 'Suas tarefas criadas manualmente ficam salvas no navegador. Para sincronizar em tempo real com seu projeto na nuvem, adicione as variáveis no .env.'}
                  </p>
                </div>
              </div>

              <button
                onClick={runConnectionTest}
                disabled={testing}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-current hover:bg-black/5 flex items-center gap-1.5 shrink-0 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                {testing ? 'Testando...' : 'Testar Conexão'}
              </button>
            </div>

            {testResult.tested && (
              <div className={`text-xs p-2.5 rounded-lg border mt-1 ${
                testResult.success 
                  ? 'bg-emerald-100/70 border-emerald-300 text-emerald-800' 
                  : 'bg-red-100/70 border-red-300 text-red-800'
              }`}>
                <div className="flex items-center gap-1.5 font-medium">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-700" />
                  )}
                  {testResult.message}
                </div>
              </div>
            )}
          </div>

          {/* Sync Local Data if Configured */}
          {configured && localTasks.length > 0 && (
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold">
                  Existem {localTasks.length} tarefas criadas localmente.
                </p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Deseja exportar e sincronizar todas as tarefas existentes diretamente para a tabela do Supabase?
                </p>
              </div>
              <button
                onClick={handleSyncToSupabase}
                disabled={syncing}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5 shrink-0 shadow-xs transition"
              >
                <CloudUpload className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sincronizando...' : 'Sincronizar Agora'}
              </button>
            </div>
          )}

          {syncMessage && (
            <div className="text-xs p-3 rounded-lg bg-slate-100 text-slate-800 font-medium">
              {syncMessage}
            </div>
          )}

          {/* Step 1: Environment Variables */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">1</span>
                Variáveis no arquivo .env
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              No arquivo <code className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded font-mono text-xs">.env</code> do projeto, defina sua URL e a Public/Anon Key do Supabase:
            </p>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto select-all">
{`VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
VITE_SUPABASE_ANON_KEY="sua-anon-key-publica-aqui"`}
            </pre>
          </div>

          {/* Step 2: SQL Script */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">2</span>
                Script SQL para criar a tabela no Supabase
              </h3>
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar SQL</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Acesse seu painel do Supabase, clique em <strong>SQL Editor</strong> &gt; <strong>New Query</strong>, cole o código abaixo e clique em <strong>Run</strong>:
            </p>
            <div className="relative">
              <pre className="p-3 bg-slate-950 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto max-h-56 select-all border border-slate-800">
                {SUPABASE_SETUP_SQL}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-600 hover:text-emerald-700 font-medium flex items-center gap-1 transition"
          >
            Abrir Supabase Dashboard
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition shadow-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
