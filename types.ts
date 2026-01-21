export interface Project {
  id: string;
  name: string;
}

export interface Artifact {
  id: string;
  name: string;
  content: string;
  type: 'interview' | 'observation' | 'document';
}

export interface Code {
  id: string;
  name: string;
  color: string;
  description?: string;
  parentId?: string; // For hierarchical/axial coding
}

export interface Coding {
  id: string;
  artifactId: string;
  codeId: string;
  start: number;
  end: number;
  textSnippet: string;
}

export interface Memo {
  id: string;
  title: string;
  content: string;
  relatedIds: string[]; // Can relate to Artifact, Code, or Coding
  createdAt: string;
}

export interface LayerConfig {
  id: LayerType;
  label: string;
  visible: boolean;
  color: string;
}

export enum LayerType {
  ARTIFACT = 'ARTIFACT',
  OPEN_CODING = 'OPEN_CODING',
  AXIAL_CONNECTIONS = 'AXIAL_CONNECTIONS', // Visualization of links
  THEORY_MEMOS = 'THEORY_MEMOS',
}

export interface Point {
  x: number;
  y: number;
}
