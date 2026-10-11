import useSWR, { useSWRConfig } from 'swr';
import type { WorkflowAgent } from '@/lib/types';
import { fetcher, poster, putter, deleter } from '@/lib/api';

export function useWorkflowAgents() {
  const { data, error, isLoading } = useSWR<WorkflowAgent[]>('/workflow-agents', fetcher);
  const { mutate } = useSWRConfig();

  const createAgent = async (nome: string, dependeDe: string | null) => {
    const created = await poster<WorkflowAgent>('/workflow-agents', { nome, dependeDe });
    await mutate('/workflow-agents');
    return created;
  };

  const updateAgent = async (id: string, nome: string, dependeDe: string | null) => {
    const updated = await putter<WorkflowAgent>(`/workflow-agents/${id}`, { nome, dependeDe });
    await mutate('/workflow-agents');
    return updated;
  };

  const deleteAgent = async (id: string) => {
    const dependents = (data ?? []).filter((a) => a.dependeDe === id);
    if (dependents.length > 0) {
      const names = dependents.map((a) => `"${a.nome}"`).join(', ');
      throw new Error(`Não é possível excluir este agente pois ${names} depende(m) dele.`);
    }
    await deleter(`/workflow-agents/${id}`);
    await mutate('/workflow-agents');
  };

  return { data, error, isLoading, createAgent, updateAgent, deleteAgent };
}