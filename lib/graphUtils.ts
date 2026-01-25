import { Code, Coding } from '../types';

export interface GraphNode {
  id: string;
  name: string;
  color: string;
  group: number;
  val: number;
  isCore: boolean;
  kind: 'code' | 'category';
  parentId?: string;
  // D3 properties
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink {
  source: string;
  target: string;
  value: number;
  type: 'hierarchy' | 'association' | 'theoretical';
}

/**
 * Transforms Codes and Codings into a Node/Link graph structure.
 * 
 * Logic:
 * 1. Nodes: Created for every Code and Category.
 * 2. Hierarchy Links: Created between Codes and their Parent Category (Strong structural bond).
 * 3. Association Links: Created between Codes that appear in the same Artifact (Data-driven bond).
 */
export const buildTheoryGraph = (codes: Code[] = [], codings: Coding[] = []): { nodes: GraphNode[], links: GraphLink[] } => {
  // Defensive checks
  if (!codes) codes = [];
  if (!codings) codings = [];

  // 1. Prepare Nodes
  const nodes: GraphNode[] = codes.map(c => ({
    id: c.id,
    name: c.name,
    color: c.isCore ? '#f59e0b' : c.color,
    group: c.kind === 'category' ? 2 : 1,
    // Base size: Categories are larger. Core is largest. Usage adds weight.
    val: (c.kind === 'category' ? 10 : 2) + codings.filter(coding => coding.codeId === c.id).length,
    isCore: !!c.isCore,
    kind: c.kind,
    parentId: c.parentId
  }));

  const links: GraphLink[] = [];
  const linkMap = new Set<string>(); // To prevent duplicates

  const addLink = (source: string, target: string, type: GraphLink['type'], weight = 1) => {
      // Ensure canonical ordering for ID key to prevent A->B and B->A dupes
      const key = [source, target].sort().join('-');
      if (source === target) return;

      const existingIndex = links.findIndex(l => 
          (l.source === source && l.target === target) || 
          (l.source === target && l.target === source)
      );

      if (existingIndex >= 0) {
          // If a hierarchy link already exists, don't overwrite it with association, 
          // but if it's association, increase weight.
          if (links[existingIndex].type === 'association' && type === 'association') {
              links[existingIndex].value += weight;
          }
      } else {
          links.push({ source, target, value: weight, type });
      }
  };

  // 2. Hierarchy Links (Explicit Ontology)
  // Connect Child Code -> Parent Category
  codes.forEach(c => {
      if (c.parentId) {
          addLink(c.id, c.parentId, 'hierarchy', 5); // Stronger weight for hierarchy
      }
  });

  // 3. Association Links (Co-occurrence in Data)
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
  
  // 4. Core Category Theoretical Links
  // Ensure the Core Category acts as a gravity well
  const coreNode = nodes.find(n => n.isCore);
  if (coreNode) {
      nodes.forEach(n => {
          if (n.id !== coreNode.id && n.kind === 'category') {
              // Create a 'theoretical' link to other categories if no direct hierarchy exists
              // This visualizes the core category pulling other concepts together
              addLink(n.id, coreNode.id, 'theoretical', 0.5);
          }
      });
  }

  return { nodes, links };
};