export interface Project {
  id: string;
  name: string;
}

export type LifecycleStatus = 'inbox' | 'appraisal' | 'active' | 'archived' | 'disposed';

export interface CurationMetadata {
  format: string; // Representation Information
  source: string; // Provenance
  dateCreated: string;
  consentObtained: boolean; // Legal/Ethical preservation
  preservationNotes?: string;
}

export interface Artifact {
  id: string;
  name: string;
  content: string;
  type: 'interview' | 'observation' | 'document';
  status: LifecycleStatus;
  curation: CurationMetadata;
}

export interface Code {
  id: string;
  name: string;
  color: string;
  description?: string;
  parentId?: string; // For hierarchical/axial coding
  isCore?: boolean; // The central phenomenon in the curated model
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
  type: 'theoretical' | 'procedural' | 'observational';
}

export interface JournalEntry {
  id: string;
  timestamp: string;
  content: string;
  type: 'auto' | 'manual';
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