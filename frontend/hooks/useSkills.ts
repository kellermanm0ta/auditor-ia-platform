import useSWR from 'swr';
import type { Skill, SkillCreateInput, SkillInput } from '@/lib/types';
import { fetcher, poster, putter, deleter } from '@/lib/api';

export function useSkills() {
  const { data, error, isLoading, mutate } = useSWR<Skill[]>('/skills', fetcher);

  const createSkill = async (input: SkillCreateInput) => {
    const created = await poster<Skill>('/skills', input);
    await mutate();
    return created;
  };

  const updateSkill = async (id: string, input: SkillInput) => {
    const updated = await putter<Skill>(`/skills/${id}`, input);
    await mutate();
    return updated;
  };

  const deleteSkill = async (id: string) => {
    await deleter(`/skills/${id}`);
    await mutate();
  };

  const toggleSkill = async (skill: Skill) => {
    const enabled = !skill.enabled;
    await mutate(
      async () => {
        await putter<Skill>(`/skills/${skill.id}`, { enabled });
        return undefined;
      },
      {
        optimisticData: (current) =>
          (current ?? []).map((s) => (s.id === skill.id ? { ...s, enabled } : s)),
        rollbackOnError: true,
        revalidate: true,
        populateCache: false,
      }
    );
  };

  return { data, error, isLoading, createSkill, updateSkill, deleteSkill, toggleSkill };
}