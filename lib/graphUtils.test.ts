import { describe, it, expect } from 'vitest';
import { buildTheoryGraph } from './graphUtils';
import { Code, Coding } from '../types';

describe('buildTheoryGraph', () => {
  const mockCodes: Code[] = [
    { id: 'c1', name: 'Code A', color: 'red' },
    { id: 'c2', name: 'Code B', color: 'blue' },
    { id: 'c3', name: 'Code C', color: 'green' },
  ];

  it('should create nodes for all codes', () => {
    const codings: Coding[] = [];
    const { nodes } = buildTheoryGraph(mockCodes, codings);
    
    expect(nodes).toHaveLength(3);
    expect(nodes[0].id).toBe('c1');
    expect(nodes[0].val).toBe(1); // Default size
  });

  it('should calculate node values based on coding frequency', () => {
    const codings: Coding[] = [
      { id: '1', artifactId: 'a1', codeId: 'c1', start: 0, end: 10, textSnippet: '' },
      { id: '2', artifactId: 'a2', codeId: 'c1', start: 0, end: 10, textSnippet: '' },
    ];
    
    const { nodes } = buildTheoryGraph(mockCodes, codings);
    const nodeC1 = nodes.find(n => n.id === 'c1');
    
    expect(nodeC1?.val).toBe(3); // 2 codings + 1 base
  });

  it('should create links between codes in the same artifact', () => {
    const codings: Coding[] = [
      { id: '1', artifactId: 'a1', codeId: 'c1', start: 0, end: 10, textSnippet: '' },
      { id: '2', artifactId: 'a1', codeId: 'c2', start: 20, end: 30, textSnippet: '' },
    ];

    const { links } = buildTheoryGraph(mockCodes, codings);
    
    expect(links).toHaveLength(1);
    expect(links[0].source).toBe('c1');
    expect(links[0].target).toBe('c2');
    expect(links[0].value).toBe(1);
  });

  it('should increment link strength for multiple co-occurrences', () => {
    const codings: Coding[] = [
      // Artifact 1: c1 and c2
      { id: '1', artifactId: 'a1', codeId: 'c1', start: 0, end: 10, textSnippet: '' },
      { id: '2', artifactId: 'a1', codeId: 'c2', start: 20, end: 30, textSnippet: '' },
      // Artifact 2: c1 and c2
      { id: '3', artifactId: 'a2', codeId: 'c1', start: 0, end: 10, textSnippet: '' },
      { id: '4', artifactId: 'a2', codeId: 'c2', start: 20, end: 30, textSnippet: '' },
    ];

    const { links } = buildTheoryGraph(mockCodes, codings);
    
    expect(links).toHaveLength(1);
    expect(links[0].value).toBe(2);
  });

  it('should not link codes that are never in the same artifact', () => {
    const codings: Coding[] = [
      { id: '1', artifactId: 'a1', codeId: 'c1', start: 0, end: 10, textSnippet: '' },
      { id: '2', artifactId: 'a2', codeId: 'c2', start: 20, end: 30, textSnippet: '' },
    ];

    const { links } = buildTheoryGraph(mockCodes, codings);
    expect(links).toHaveLength(0);
  });

  it('should connect core category to isolated nodes', () => {
    const codesWithCore: Code[] = [
        { id: 'c1', name: 'Core', color: 'red', isCore: true },
        { id: 'c2', name: 'Isolated', color: 'blue' },
    ];
    // No codings, so no natural links
    const codings: Coding[] = [];

    const { links } = buildTheoryGraph(codesWithCore, codings);
    
    expect(links).toHaveLength(1);
    expect(links[0].source).toBe('c2');
    expect(links[0].target).toBe('c1');
    expect(links[0].value).toBe(0.5); // Weak theoretical link
  });
});
