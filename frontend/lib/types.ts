export interface Skill {
  id: string;
  name: string;
  icon: string;
  desc: string;
  enabled: boolean;
  prompt: string;
}

export type SkillInput = Omit<Skill, 'id'>;
export type SkillCreateInput = Omit<Skill, 'id'>;

export interface HistoryItem {
  id: string;
  repo: string;
  date: string;
  issues: number;
  severity: string;
  agents: number;
  time: string;
  createdAt: string;
}

export interface Integration {
  id: string;
  name: string;
  icon: string;
  desc: string;
  status: 'connected' | 'disconnected';
  statusLabel: string;
  docUrl: string;
  steps: string[];
  yaml: string;
}

export interface WorkflowAgent {
  id: string;
  nome: string;
  dependeDe: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OutputFormat {
  id: string;
  value: string;
  label: string;
}

export enum ExecutionMode {
  PARALELO = 'PARALELO',
  SERIE = 'SERIE',
}

export interface Config {
  id: string;
  executionMode: ExecutionMode;
  outputFormatId: string;
  skillIds: string[];
}