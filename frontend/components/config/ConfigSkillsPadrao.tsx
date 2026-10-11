'use client';

import type { Skill } from '@/lib/types';

interface ConfigSkillsPadraoProps {
  skills: Skill[] | undefined;
  skillIds: string[] | undefined;
  onSkillToggle: (id: string) => void;
}

export default function ConfigSkillsPadrao({ skills, skillIds, onSkillToggle }: ConfigSkillsPadraoProps) {
  return (
    <div className="card">
      <div className="card-header">Skills Padrão</div>
      <div className="card-body">
        <div className="text-secondary" style={{ fontSize: '13px' }}>
          Skills que serão habilitadas por padrão em novas análises.
        </div>
        <div className="mt-3">
          {(skills ?? []).map((s) => (
            <div className="form-check form-check-inline" key={s.id}>
              <input
                className="form-check-input"
                type="checkbox"
                id={`def-${s.id}`}
                checked={skillIds?.includes(s.id) ?? false}
                onChange={() => onSkillToggle(s.id)}
              />
              <label className="form-check-label" htmlFor={`def-${s.id}`} style={{ fontSize: '13px' }}>
                {s.name}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}