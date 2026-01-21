
export interface Project {
  id: string;
  name: string;
}

// Updated Enums based on requirements
export type TypeOfMedia = 'video' | 'text' | 'audio' | 'dataset' | 'software';
export type TypeOfAccess = 'public' | 'private';
export type TypeOfStatus = 'problem_statement' | 'acquisition' | 'management' | 'analysis' | 'report';

export interface CurationMetadata {
  format: string; // Representation Information
  source: string; // Provenance
  dateCreated: string;
  consentObtained: boolean; // Legal/Ethical preservation
  preservationNotes?: string;
  
  // Link to specific Actor/Participant
  participantId?: string;
}

export interface Artifact {
  id: string; // Internal system ID
  hashID: string; // Unique identifier (e.g. Sha256)
  name: string;
  content: string;
  
  // Methodological type (kept for app logic)
  type: 'interview' | 'observation' | 'document' | 'protocol' | 'bibliography';
  
  // New properties
  media: TypeOfMedia;
  access: TypeOfAccess;
  status: TypeOfStatus;
  
  responsibleId?: string; // Link to Researcher
  
  curation: CurationMetadata;
}

// --- NEW GROUNDED THEORY ONTOLOGY ENTITIES ---

export interface Participant {
  id: string;
  anonymizedCode: string; // e.g., P-001
  description: string; // Demographics or role
  isCoConstructor: boolean; // Constructivist perspective flag
}

export interface ResearchQuestion {
  id: string;
  content: string; // The question text
}

export type TypeOfMethod = 'interview' | 'observation' | 'survey' | 'focusgroup';

export interface Method {
  id: string;
  type: TypeOfMethod;
  protocolContent: string; // The protocol document content
  participantIds?: string[]; // List of participants involved in this method
}

export interface Tool {
  id: string;
  name: string;
  referenceURL?: string;
  version?: string;
}

export interface FieldOfStudy {
  subjectOfStudy: string; // Description of the subject
  objectOfStudy: string; // Description of the object
  location: string;
}

export interface TheoreticalFramework {
  researchQuestions: ResearchQuestion[];
  methods: Method[];
  tools: Tool[];
  bibliographyContent: string; // Simple text content for bibliography
}

// ---------------------------

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
  type: 'theoretical' | 'procedural' | 'observational' | 'finding'; // Added 'finding'
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
  CATEGORIES = 'CATEGORIES', // New Layer
  AXIAL_CONNECTIONS = 'AXIAL_CONNECTIONS',
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
  
  // Extended Ontology
  fieldOfStudy: FieldOfStudy;
  theoreticalFramework: TheoreticalFramework;
  participants: Participant[];
}