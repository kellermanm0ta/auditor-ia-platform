'use client';

import { createContext, useContext } from 'react';

interface FlowContextValue {
  onEditAgent: (id: string) => void;
  onDeleteAgent: (id: string) => void;
  onAddChildAgent: (id: string) => void;
}

const WorkflowFlowContext = createContext<FlowContextValue | null>(null);

export function WorkflowFlowProvider({ children, onEditAgent, onDeleteAgent, onAddChildAgent }: { children: React.ReactNode } & FlowContextValue) {
  return (
    <WorkflowFlowContext.Provider value={{ onEditAgent, onDeleteAgent, onAddChildAgent }}>
      {children}
    </WorkflowFlowContext.Provider>
  );
}

export function useWorkflowFlow(): FlowContextValue {
  const ctx = useContext(WorkflowFlowContext);
  if (!ctx) throw new Error('useWorkflowFlow must be used within WorkflowFlowProvider');
  return ctx;
}