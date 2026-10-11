import type { Node, Edge } from '@xyflow/react';
import type { WorkflowAgent } from './types';

const nodeColors = [
  '#6c5ce7', '#00b894', '#fd79a8', '#00cec9',
  '#e17055', '#a29bfe', '#fdcb6e', '#74b9ff',
  '#e84393', '#55efc4', '#fab1a0', '#81ecec',
];

export function buildFlow(agents: WorkflowAgent[]): { nodes: Node[]; edges: Edge[] } {
  if (agents.length === 0) return { nodes: [], edges: [] };

  const childrenMap = new Map<string | null, string[]>();
  for (const a of agents) {
    const key = a.dependeDe;
    if (!childrenMap.has(key)) childrenMap.set(key, []);
    childrenMap.get(key)!.push(a.id);
  }
  const byId = new Map(agents.map((a) => [a.id, a]));

  const root = agents.find((a) => a.dependeDe === null) ?? agents[0];

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let step = 0;

  function assign(nodeId: string, x: number, y: number, xOffset: number) {
    const agent = byId.get(nodeId)!;
    step++;
    const color = nodeColors[(step - 1) % nodeColors.length];
    nodes.push({
      id: String(nodeId),
      type: 'workflowAgent',
      position: { x, y },
      data: { nome: agent.nome, stepNumber: step, color, agentId: agent.id, isRoot: agent.id === root.id },
      draggable: true,
    });

    const children = childrenMap.get(nodeId) ?? [];
    const totalWidth = Math.max(0, children.length - 1) * xOffset;
    const startX = x - totalWidth / 2;

    children.forEach((childId, i) => {
      edges.push({
        id: `e${nodeId}-${childId}`,
        source: String(nodeId),
        target: String(childId),
        type: 'smoothstep',
        animated: true,
        style: { stroke: color },
      });
      assign(childId, startX + i * xOffset, y + 130, xOffset);
    });
  }

  assign(root.id, 0, 0, 350);
  return { nodes, edges };
}