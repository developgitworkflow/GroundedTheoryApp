
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

// Enumeration of Grounded Theory approaches
export type TheoryType = 'classic' | 'constructivist' | 'straussian';

// Represents the "Theory" Artefact
export interface Theory {
  id: string;
  type: TheoryType; // Defined by TypeOfTheory
  content: string; // Stored as TypeOfDocument (The narrative)
  categoryIds: string[]; // listOfCategories
}

// --- RESEARCH TEAM DOMAIN ---

export type ResearcherRole = 'Junior' | 'Senior';

export interface Researcher {
  id: string;
  name: string;
  role: ResearcherRole;
  color: string; // Visual distinction for multi-user coding
  initials: string;
}

export type TypeOfVote = 'unanimous' | 'majority' | 'consensus';

export interface ConsensusCriteria {
  id: string;
  name: string;
  description: string;
  votingType: TypeOfVote;
  active: boolean;
}

// New Types for Review Process
export type VoteStatus = 'approved' | 'rejected' | 'abstain';

export interface Vote {
  id: string;
  artifactId: string;
  criterionId: string; // Which rule are we voting on?
  researcherId: string;
  status: VoteStatus;
  comment?: string;
  timestamp: string;
}

export interface ResearchTeam {
  id: string;
  researchers: Researcher[];
  consensusCriteria: ConsensusCriteria[];
}

// ---------------------------

// Updates to Code to support "Code" vs "Category" distinction
export interface Code {
  id: string;
  name: string;
  color: string;
  description?: string;
  
  // Distinguish between a fine-grained 'code' and a conceptual 'category'
  kind: 'code' | 'category'; 
  
  parentId?: string; // Hierarchical link (Category -> Sub-category)
  isCore?: boolean; // The central phenomenon
  
  // Structs for lateral relationships
  relatedCodeIds: string[]; // listOfRelatedCodes / listOfRelatedCategories
}

export interface Coding {
  id: string;
  artifactId: string;
  codeId: string;
  start: number;
  end: number;
  textSnippet: string;
  // Track who created the coding
  researcherId?: string; 
}

export interface Memo {
  id: string;
  title: string;
  content: string;
  relatedIds: string[]; // Can relate to Artifact, Code, or Coding
  createdAt: string;
  type: 'theoretical' | 'procedural' | 'observational';
  number: number; // Added sequence number for reference
  authorId?: string; // Track author
  segment?: {
    start: number;
    end: number;
    text: string;
  };
}

export interface JournalEntry {
  id: string;
  timestamp: string;
  content: string;
  type: 'auto' | 'manual';
  authorId?: string;
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

export interface ProjectSettings {
  projectName: string;
  userName: string; // Legacy field, kept for backward compat, but UI should favor activeResearcher
  themeMode: 'dark' | 'light'; 
  stripeWidth: number; 
  aiModel: 'gemini-3-flash-preview' | 'gemini-3-pro-preview'; 
  stopWords: string[]; 
  
  // Global theory configuration
  theoryType: TheoryType;
}
