import { useState } from 'react';
import useSWR from 'swr';
import type { Config, ExecutionMode } from '@/lib/types';
import { fetcher, putter } from '@/lib/api';

export function useConfig() {
  const { data, error, isLoading, mutate } = useSWR<Config>('/config', fetcher);
  const [toast, setToast] = useState(false);

  const showToast = () => setToast(true);

  const update = async (config: Config) => {
    const updated = await putter<Config>('/config', config);
    await mutate(updated, false);
    showToast();
    return updated;
  };

  const setExecutionMode = async (mode: ExecutionMode) => {
    if (!data) return;
    await update({ ...data, executionMode: mode });
  };

  const setOutputFormat = async (outputFormatId: string) => {
    if (!data) return;
    await update({ ...data, outputFormatId });
  };

  const setSkillEnabled = async (id: string) => {
    if (!data) return;
    const skillIds = data.skillIds.includes(id)
      ? data.skillIds.filter((s) => s !== id)
      : [...data.skillIds, id];
    await update({ ...data, skillIds });
  };

  return { data, error, isLoading, mutate, update, setExecutionMode, setOutputFormat, setSkillEnabled, toast, setToast };
}