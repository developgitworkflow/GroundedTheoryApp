import { Code, Coding } from '../types';

export interface GraphNode {
  id: string;
  name: string;
  color: string;
  group: number;
  val: number;
  isCore: boolean;
  // D3 properties that might be added later by the simulation
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink {
  source: string; // Initially string ID
  target: string; // Initially string ID
  value: number;
}

/**
 * Transforms Codes and Codings into a Node/Link graph structure based on co-occurrence.
 * 
 * Logic:
 * 1. Codes become Nodes. Size (val) is determined by frequency of coding.
 * 2. Links are created between Codes if they appear in the same Artifact.
 * 3. Link strength (value) increases with multiple co-occurrences.
 * 4. If a Core Category exists, ensure it has connections (logic can be extended here).
 */
export const buildTheoryGraph = (codes: Code[], codings: Coding[]): { nodes: GraphNode[], links: GraphLink[] } => {
  // 1. Prepare Nodes
  const nodes: GraphNode[] = codes.map(c => ({
    id: c.id,
    name: c.name,
    color: c.isCore ? '#f59e0b' : c.color, // Gold for core
    group: 1,
    val: codings.filter(coding => coding.codeId === c.id).length + 1,
    isCore: !!c.isCore
  }));

  // 2. Prepare Links
  const links: GraphLink[] = [];
  
  // Group codes by artifact to find co-occurrences
  const artifactGroups: Record<string, string[]> = {};
  codings.forEach(c => {
    if (!artifactGroups[c.artifactId]) artifactGroups[c.artifactId] = [];
    // Only add unique codes per artifact for the "co-occurrence" check in this specific pass
    // (Or allow multiples if we want to weight based on frequency within the same doc)
    if (!artifactGroups[c.artifactId].includes(c.codeId)) artifactGroups[c.artifactId].push(c.codeId);
  });

  // Generate links for every pair in the same artifact
  Object.values(artifactGroups).forEach(groupCodes => {
    for (let i = 0; i < groupCodes.length; i++) {
      for (let j = i + 1; j < groupCodes.length; j++) {
         const source = groupCodes[i];
         const target = groupCodes[j];

         // Check if link exists
         const existing = links.find(l => 
           (l.source === source && l.target === target) || 
           (l.source === target && l.target === source)
         );

         if (existing) {
           existing.value++;
         } else {
           links.push({ source, target, value: 1 });
         }
      }
    }
  });
  
  // 3. Core Category Handling
  // Ensure the Core Category is connected to isolated nodes (Theoretical Sampling heuristic)
  const coreNode = nodes.find(n => n.isCore);
  if (coreNode) {
      nodes.forEach(n => {
          if (n.id !== coreNode.id) {
              const hasLink = links.some(l => 
                  (l.source === n.id && l.target === coreNode.id) || 
                  (l.target === n.id && l.source === coreNode.id)
              );
              
              // If node is isolated from Core, create a weak "theoretical" link
              // This represents the researcher's need to relate everything to the core
              if (!hasLink) {
                   links.push({ source: n.id, target: coreNode.id, value: 0.5 });
              }
          }
      });
  }

  return { nodes, links };
};
