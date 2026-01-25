import { Code, Coding, Memo, ProjectSettings } from '../types';

export interface GraphNode {
  id: string;
  name: string;
  color: string;
  group: number;
  val: number;
  isCore: boolean;
  kind: 'code' | 'category' | 'finding' | 'rq' | 'method';
  parentId?: string;
  // D3 properties
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  // Full object reference for inspector
  fullObj?: any; 
}

export interface GraphLink {
  source: string;
  target: string;
  value: number;
  type: 'hierarchy' | 'association' | 'theoretical';
}

/**
 * Transforms Codes and Codings into a Node/Link graph structure.
 * Optionally integrates Project Ontology (RQs, Methods, Findings).
 */
export const buildTheoryGraph = (
    codes: Code[] = [], 
    codings: Coding[] = [], 
    memos?: Memo[], 
    settings?: ProjectSettings
): { nodes: GraphNode[], links: GraphLink[] } => {
  // Defensive checks
  if (!codes) codes = [];
  if (!codings) codings = [];

  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const linkSet = new Set<string>();

  const addLink = (source: string, target: string, type: GraphLink['type'], weight = 1) => {
      // Ensure canonical ordering for ID key to prevent A->B and B->A dupes
      const key = [source, target].sort().join('-');
      if (source === target) return;

      const existingIndex = links.findIndex(l => 
          (l.source === source && l.target === target) || 
          (l.source === target && l.target === source)
      );

      if (existingIndex >= 0) {
          if (links[existingIndex].type === 'association' && type === 'association') {
              links[existingIndex].value += weight;
          }
      } else {
          links.push({ source, target, value: weight, type });
      }
  };

  // 1. Codes & Categories
  codes.forEach(c => {
      nodes.push({
        id: c.id,
        name: c.name,
        color: c.isCore ? '#f59e0b' : c.color,
        group: c.kind === 'category' ? 2 : 1,
        val: (c.kind === 'category' ? 10 : 2) + codings.filter(coding => coding.codeId === c.id).length,
        isCore: !!c.isCore,
        kind: c.kind,
        parentId: c.parentId,
        fullObj: c
      });
  });

  // 2. Hierarchy Links (Codes)
  codes.forEach(c => {
      if (c.parentId) {
          addLink(c.id, c.parentId, 'hierarchy', 5);
      }
  });

  // 3. Association Links (Codes)
  const artifactGroups: Record<string, string[]> = {};
  codings.forEach(c => {
    if (!artifactGroups[c.artifactId]) artifactGroups[c.artifactId] = [];
    if (!artifactGroups[c.artifactId].includes(c.codeId)) artifactGroups[c.artifactId].push(c.codeId);
  });

  Object.values(artifactGroups).forEach(groupCodes => {
    for (let i = 0; i < groupCodes.length; i++) {
      for (let j = i + 1; j < groupCodes.length; j++) {
         addLink(groupCodes[i], groupCodes[j], 'association', 1);
      }
    }
  });

  // 4. Extended Ontology (RQs, Findings, Methods)
  if (memos && settings) {
      // Research Questions
      settings.theoreticalFramework.researchQuestions.forEach(rq => {
          nodes.push({
              id: rq.id,
              name: rq.content.length > 30 ? rq.content.substring(0, 30) + '...' : rq.content,
              color: '#3b82f6', // Blue
              group: 3,
              val: 12,
              isCore: false,
              kind: 'rq',
              fullObj: rq
          });
      });

      // Methods
      settings.theoreticalFramework.methods.forEach(m => {
          nodes.push({
              id: m.id,
              name: `${m.type} Protocol`,
              color: '#8b5cf6', // Purple
              group: 5,
              val: 8,
              isCore: false,
              kind: 'method',
              fullObj: m
          });
          // Link Method -> RQ? Not explicit in type def but logical. 
          // Assuming for now methods serve all RQs or unlinked.
      });

      // Findings (Memos with type 'finding')
      const findings = memos.filter(m => m.type === 'finding');
      findings.forEach(f => {
          nodes.push({
              id: f.id,
              name: f.title,
              color: '#10b981', // Emerald
              group: 4,
              val: 10,
              isCore: false,
              kind: 'finding',
              fullObj: f
          });

          // Link Finding -> RQs (via relatedIds)
          f.relatedIds.forEach(rid => {
              if (settings.theoreticalFramework.researchQuestions.some(rq => rq.id === rid)) {
                  addLink(f.id, rid, 'theoretical', 3);
              }
              // Link Finding -> Codes (via relatedIds)
              if (codes.some(c => c.id === rid)) {
                  addLink(f.id, rid, 'theoretical', 2);
              }
          });
      });
  }
  
  // 5. Core Category Gravity
  const coreNode = nodes.find(n => n.isCore);
  if (coreNode) {
      nodes.forEach(n => {
          if (n.id !== coreNode.id && n.kind === 'category') {
              addLink(n.id, coreNode.id, 'theoretical', 0.5);
          }
      });
  }

  return { nodes, links };
};
