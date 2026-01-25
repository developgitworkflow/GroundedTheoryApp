import React, { useState, useRef } from 'react';
import { LayerControl } from './components/LayerControl';
import { ArtifactView } from './components/ArtifactView';
import { TheoryGraph } from './components/TheoryGraph';
import { ReflexivityJournal } from './components/ReflexivityJournal';
import { TheoryBuilder } from './components/TheoryBuilder';
import { CurationWorkflow } from './components/CurationWorkflow'; 
import { MemoDirectory } from './components/MemoDirectory'; 
import { SettingsDialog } from './components/SettingsDialog'; 
import { Visualizations } from './components/Visualizations'; 
import { ReportView } from './components/ReportView';
import { OntologyManager } from './components/OntologyManager'; 
import { suggestOntology } from './services/geminiService'; 
import { Artifact, Code, Coding, LayerConfig, LayerType, Memo, JournalEntry, ProjectSettings, Theory, ResearchTeam, Researcher, Vote, VoteStatus, MemoCategory } from './types';
import { 
  BrainCircuit,
  BookMarked,
  Settings,
  Database,
  Search,
  Lightbulb,
  Layout,
  FileText,
  CheckCircle2,
  Plus,
  Tag,
  GitMerge,
  ArrowRight,
  AlertTriangle,
  FolderInput,
  Network
} from 'lucide-react';

import { Button } from './components/ui/button';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { cn } from './lib/utils';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './components/ui/hover-card';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './components/ui/card';
import { Badge } from './components/ui/badge';

const INITIAL_LAYERS: LayerConfig[] = [
  { id: LayerType.ARTIFACT, label: 'Artifact Source', visible: true, color: '#fff' },
  { id: LayerType.OPEN_CODING, label: 'Open Codes', visible: true, color: '#60a5fa' },
  { id: LayerType.CATEGORIES, label: 'Categories', visible: false, color: '#fbbf24' }, 
  { id: LayerType.AXIAL_CONNECTIONS, label: 'Theory Network', visible: false, color: '#f472b6' },
  { id: LayerType.THEORY_MEMOS, label: 'Annotations', visible: false, color: '#fbbf24' },
];

const INITIAL_ARTIFACTS: Artifact[] = [
    {
        id: 'a1',
        hashID: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        name: 'Interview: Subject 004',
        type: 'interview',
        media: 'text',
        access: 'private',
        status: 'analysis',
        responsibleId: 'r1',
        curation: {
            format: 'Transcript (Markdown)',
            source: 'Field Interview',
            dateCreated: '2023-10-15',
            consentObtained: true,
            preservationNotes: 'Subject requested anonymity in final publication.',
            participantId: 'p1'
        },
        content: `Interviewer: How do you feel about the remote work policy change?

Subject: Honestly, it was a shock. At first, I felt a sense of betrayal. We had built this routine, this way of balancing life, and suddenly it was just... revoked. It wasn't just about the commute; it was about the autonomy. I felt like management didn't trust us anymore.

Interviewer: Can you elaborate on 'trust'?

Subject: Yeah. When I'm at home, I work harder because I'm grateful for the flexibility. When they force me back, I feel micromanaged. It creates this resistance. I find myself doing the bare minimum in the office just to get by, whereas at home, I was innovating. It's ironic, really. They want productivity, but they're killing the very spirit that drives it.`
    },
    {
        id: 'a2',
        hashID: '88d4266fd4e6338d13b845fcf289579d209c897823b9217da3e161936f031589',
        name: 'Observation Notes: Office Floor',
        type: 'observation',
        media: 'text',
        access: 'private',
        status: 'acquisition',
        responsibleId: 'r2',
        curation: {
            format: 'Field Notes',
            source: 'Researcher',
            dateCreated: '2023-10-20',
            consentObtained: true
        },
        content: `10:00 AM: The open plan office is remarkably quiet. People are wearing headphones. Interaction is minimal.`
    }
];

const INITIAL_CODES: Code[] = [
  { id: 'c1', name: 'Betrayal', color: '#ef4444', kind: 'code', relatedCodeIds: [] }, 
  { id: 'c2', name: 'Autonomy', color: '#3b82f6', kind: 'code', relatedCodeIds: [] }, 
  { id: 'c3', name: 'Resistance', color: '#f59e0b', kind: 'category', relatedCodeIds: [] }, 
  { id: 'c4', name: 'Trust Deficit', color: '#8b5cf6', kind: 'category', relatedCodeIds: [] }, 
  { id: 'c5', name: 'Productivity Paradox', color: '#10b981', kind: 'code', relatedCodeIds: [] }, 
];

const INITIAL_CODINGS: Coding[] = [
  { id: 'cd1', artifactId: 'a1', codeId: 'c1', start: 86, end: 94, textSnippet: 'betrayal', researcherId: 'r1' },
  { id: 'cd2', artifactId: 'a1', codeId: 'c2', start: 175, end: 183, textSnippet: 'autonomy', researcherId: 'r1' },
  { id: 'cd3', artifactId: 'a1', codeId: 'c4', start: 209, end: 236, textSnippet: "management didn't trust us", researcherId: 'r2' },
];

const INITIAL_SETTINGS: ProjectSettings = {
  projectName: "Remote Work Study",
  userName: "Researcher",
  themeMode: "dark",
  stripeWidth: 4,
  aiModel: "gemini-3-flash-preview",
  stopWords: ["the", "and", "is", "of", "to", "in", "it", "that", "was"],
  theoryType: "constructivist",
  
  fieldOfStudy: {
      subjectOfStudy: 'Remote Employees',
      objectOfStudy: 'Impact of Return-to-Office Mandates',
      location: 'Tech Sector, North America'
  },
  participants: [
      { id: 'p1', anonymizedCode: 'P-004', description: 'Software Engineer, 5yrs exp', isCoConstructor: true }
  ],
  theoreticalFramework: {
      researchQuestions: [
          { id: 'rq1', content: 'How do employees perceive trust in hybrid work environments?' }
      ],
      methods: [
          { id: 'm1', type: 'interview', protocolContent: '1. Introduction\n2. Work History\n3. Reaction to Policy...' }
      ],
      tools: [
          { id: 't1', name: 'Stratum CAQDAS', version: '1.0.0', referenceURL: 'https://stratum.app' }
      ],
      bibliographyContent: 'Charmaz, K. (2006). Constructing Grounded Theory.\nGlaser, B. G., & Strauss, A. L. (1967). The Discovery of Grounded Theory.'
  },
  structuredAbstract: {
      background: '',
      methods: '',
      results: '',
      conclusion: '',
      keywords: ''
  }
};

const INITIAL_TEAM: ResearchTeam = {
  id: 'team-1',
  researchers: [
    { id: 'r1', name: 'Dr. Alistair', role: 'Senior', color: '#3b82f6', initials: 'DA' },
    { id: 'r2', name: 'Sarah J.', role: 'Junior', color: '#ec4899', initials: 'SJ' }
  ],
  consensusCriteria: [
    { 
        id: 'cc1', 
        name: 'Inter-coder Reliability', 
        description: 'At least 2 researchers must code the same segment for core categories.', 
        votingType: 'majority',
        active: true 
    },
    { 
        id: 'cc2', 
        name: 'Senior Sign-off', 
        description: 'Senior researcher must approve all axial coding relationships.', 
        votingType: 'unanimous',
        active: true 
    }
  ]
};

export default function App() {
  const [layers, setLayers] = useState<LayerConfig[]>(INITIAL_LAYERS);
  const [artifacts, setArtifacts] = useState<Artifact[]>(INITIAL_ARTIFACTS);
  const [activeArtifactId, setActiveArtifactId] = useState<string>('a1');
  const [codes, setCodes] = useState<Code[]>(INITIAL_CODES);
  const [codings, setCodings] = useState<Coding[]>(INITIAL_CODINGS);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [activeTab, setActiveTab] = useState('curate'); 
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('codes'); 
  
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>(INITIAL_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isElaborating, setIsElaborating] = useState(false);

  const [researchTeam, setResearchTeam] = useState<ResearchTeam>(INITIAL_TEAM);
  const [activeResearcherId, setActiveResearcherId] = useState<string>(INITIAL_TEAM.researchers[0].id);
  const [votes, setVotes] = useState<Vote[]>([]); 

  const [codeFilter, setCodeFilter] = useState<string | null>(null);
  
  // Drag Action State (Replacing pure Merge state)
  const [dragAction, setDragAction] = useState<{source: Code, target: Code} | null>(null);

  const activeResearcher = researchTeam.researchers.find(r => r.id === activeResearcherId) || researchTeam.researchers[0];
  
  const [theoryArtefact, setTheoryArtefact] = useState<Theory>({
      id: 'theory-1',
      type: projectSettings.theoryType,
      content: '',
      categoryIds: []
  });

  const activeArtifact = artifacts.find(a => a.id === activeArtifactId) || artifacts[0];
  const layersVisible = layers.reduce((acc, layer) => {
    acc[layer.id] = layer.visible;
    return acc;
  }, {} as Record<LayerType, boolean>);
  
  const addJournalEntry = (content: string, type: 'auto' | 'manual' = 'manual') => {
    const entry: JournalEntry = {
        id: `entry-${Date.now()}`,
        timestamp: new Date().toISOString(),
        content,
        type,
        authorId: activeResearcherId
    };
    setJournalEntries(prev => [...prev, entry]);
  };

  const toggleLayer = (id: LayerType) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const handleVote = (criterionId: string, status: VoteStatus, comment?: string) => {
      setVotes(prev => {
          const filtered = prev.filter(v => 
              !(v.artifactId === activeArtifactId && v.criterionId === criterionId && v.researcherId === activeResearcherId)
          );
          
          const newVote: Vote = {
              id: `v-${Date.now()}`,
              artifactId: activeArtifactId,
              criterionId,
              researcherId: activeResearcherId,
              status,
              comment,
              timestamp: new Date().toISOString()
          };
          
          return [...filtered, newVote];
      });
      addJournalEntry(`Voted '${status}' on criterion for artifact ${activeArtifactId}`, 'auto');
  };

  const handleUpdateArtifact = (id: string, updates: Partial<Artifact>) => {
      setArtifacts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
      if (updates.status === 'analysis') {
          addJournalEntry(`Artifact marked for Analysis: ${id}`, 'auto');
      } else if (updates.content) {
          addJournalEntry(`Updated content for artifact: ${id}`, 'auto');
      }
  };

  const handleDeleteArtifact = (id: string) => {
      if(confirm('Are you sure you want to permanently dispose of this artifact?')) {
          setArtifacts(prev => prev.filter(a => a.id !== id));
          addJournalEntry(`Permanently disposed artifact: ${id}`, 'auto');
      }
  };

  const handleCreateArtifact = (partial?: Partial<Artifact>) => {
      // Check if this is a React event object (onClick)
      const isEvent = partial && (partial as any).nativeEvent;
      const actualPartial = isEvent ? undefined : partial;

      const defaultName = `New Import ${Date.now().toString().slice(-4)}`;
      let name = actualPartial?.name;
      
      // If no partial data provided (legacy/direct click fallback), prompt
      if (!actualPartial) {
          const input = prompt("Enter artifact name:", defaultName);
          if (input === null) return;
          name = input.trim() || defaultName;
      }

      const newArt: Artifact = {
          id: `a-${Date.now()}`,
          hashID: Math.random().toString(36).substring(2),
          name: name || defaultName,
          type: actualPartial?.type || 'document',
          media: actualPartial?.media || 'text',
          access: actualPartial?.access || 'private',
          status: actualPartial?.status || 'acquisition',
          responsibleId: activeResearcherId,
          content: actualPartial?.content || 'Raw content pending appraisal...',
          curation: {
              format: 'Text',
              source: 'Unknown',
              dateCreated: new Date().toISOString(),
              consentObtained: false,
              ...(actualPartial?.curation || {})
          }
      };
      setArtifacts(prev => [...prev, newArt]);
      addJournalEntry(`Received new artifact into ${newArt.status}: ${newArt.name}`, 'auto');
  };

  const handleConvertToArtifact = (title: string, content: string, typeSource: string, sourceId?: string) => {
      const newArt: Artifact = {
          id: `a-gen-${Date.now()}`,
          hashID: Math.random().toString(36).substring(2),
          name: `Extracted: ${title}`,
          type: 'document',
          media: 'text',
          access: 'private',
          status: 'analysis',
          responsibleId: activeResearcherId,
          content: `# ${title}\n\n**Source Type:** ${typeSource}\n**Source ID:** ${sourceId || 'N/A'}\n\n---\n\n${content}`,
          curation: {
              format: 'Markdown',
              source: `System Generated (${typeSource})`,
              dateCreated: new Date().toISOString(),
              consentObtained: true, // Internal derived data
              preservationNotes: 'Derived from internal app element.'
          }
      };
      setArtifacts(prev => [...prev, newArt]);
      addJournalEntry(`Converted ${typeSource} [${title}] into new Artifact`, 'auto');
  };

  const handleAddCoding = (coding: Omit<Coding, 'id'>) => {
    const newCoding: Coding = {
      ...coding,
      id: `coding-${Date.now()}`,
      researcherId: activeResearcherId // Track who coded it
    };
    setCodings([...codings, newCoding]);
    const codeName = codes.find(c => c.id === coding.codeId)?.name;
    addJournalEntry(`Coded segment "${coding.textSnippet.substring(0, 20)}..." as [${codeName}]`, 'auto');
  };

  const handleCreateCode = async (name: string, kind: 'code' | 'category' = 'code', parentId?: string, description?: string, color?: string): Promise<Code> => {
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];
    const randomColor = color || colors[Math.floor(Math.random() * colors.length)];
    
    const newCode: Code = {
      id: `code-${Date.now()}`,
      name,
      color: randomColor,
      kind,
      parentId,
      description,
      relatedCodeIds: []
    };
    setCodes(prev => [...prev, newCode]);
    addJournalEntry(`Created new ${kind}: [${name}]`, 'auto');
    return newCode;
  };

  const handleUpdateCode = (id: string, updates: Partial<Code>) => {
      setCodes(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleCodeDrop = (sourceId: string, targetId: string) => {
      const source = codes.find(c => c.id === sourceId);
      const target = codes.find(c => c.id === targetId);
      if (source && target) {
          setDragAction({ source, target });
      }
  };

  const executeMerge = () => {
      if (!dragAction) return;
      const { source, target } = dragAction;
      const sourceId = source.id;
      const targetId = target.id;

      // 1. Remap codings
      setCodings(prev => prev.map(c => c.codeId === sourceId ? { ...c, codeId: targetId } : c));
      
      // 2. Remap children (if source was a category) to the new target
      setCodes(prev => prev.map(c => {
          if (c.id === sourceId) return null; // Remove source
          if (c.parentId === sourceId) return { ...c, parentId: targetId === c.id ? undefined : targetId }; // Move children
          return c;
      }).filter(Boolean) as Code[]);
      
      addJournalEntry(`Merged code [${source.name}] into [${target.name}]`, 'auto');
      setDragAction(null);
  };

  const executeNest = () => {
      if (!dragAction) return;
      const { source, target } = dragAction;
      
      // Check for cycles
      const isDescendant = (tId: string, sId: string): boolean => {
          if (tId === sId) return true;
          const t = codes.find(c => c.id === tId);
          if (t && t.parentId) return isDescendant(t.parentId, sId);
          return false;
      };

      if (isDescendant(target.id, source.id)) {
          alert("Cannot nest a category into its own descendant.");
          return;
      }

      handleUpdateCode(source.id, { parentId: target.id });
      // Ensure target is a category
      if (target.kind === 'code') {
          handleUpdateCode(target.id, { kind: 'category' });
      }
      
      addJournalEntry(`Nested [${source.name}] under [${target.name}]`, 'auto');
      setDragAction(null);
  };

  const handleDeleteCode = (id: string) => {
      if(confirm('Delete this code/category? This will also remove associated codings.')) {
          setCodes(prev => prev.filter(c => c.id !== id && c.parentId !== id)); 
          setCodings(prev => prev.filter(c => c.codeId !== id));
      }
  };

  const handleDeleteMemo = (id: string) => {
      if(confirm("Permanently delete this annotation?")) {
          setMemos(prev => prev.filter(m => m.id !== id));
          addJournalEntry(`Deleted memo: ${id}`, 'auto');
      }
  };

  const handleElaborateOntology = async () => {
      setIsElaborating(true);
      const suggestions = await suggestOntology(codes);
      
      let newCodes = [...codes];
      let updates = 0;

      suggestions.forEach(group => {
          let parentCode = newCodes.find(c => c.name.toLowerCase() === group.parent.toLowerCase());
          if (!parentCode) {
              parentCode = {
                  id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  name: group.parent,
                  color: '#ffffff', 
                  description: 'AI Generated Category',
                  kind: 'category',
                  relatedCodeIds: []
              };
              newCodes.push(parentCode);
          } else {
              parentCode.kind = 'category';
          }

          group.children.forEach(childName => {
              const childCodeIndex = newCodes.findIndex(c => c.name.toLowerCase() === childName.toLowerCase());
              if (childCodeIndex !== -1) {
                  // Link
                  newCodes[childCodeIndex] = { ...newCodes[childCodeIndex], parentId: parentCode.id };
                  updates++;
              }
          });
      });

      if (updates > 0) {
          setCodes(newCodes);
          addJournalEntry(`AI Elaborated Ontology: Linked ${updates} codes to categories.`, 'auto');
      }
      setIsElaborating(false);
  };

  const handleImportProject = (data: any) => {
      if (data.settings) setProjectSettings(data.settings);
      if (data.codes) setCodes(data.codes);
      if (data.codings) setCodings(data.codings);
      if (data.artifacts) setArtifacts(data.artifacts);
      if (data.memos) setMemos(data.memos);
      // Team might be partially imported or kept separate depending on auth
      addJournalEntry(`Full Project Import Completed: ${data.settings?.projectName || 'Unknown Project'}`, 'auto');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans selection:bg-blue-500/30">
        
        {/* DRAG ACTION DIALOG */}
        {dragAction && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                <Card className="w-[500px] border-zinc-800 bg-zinc-950 shadow-2xl animate-in zoom-in-95 overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-amber-600" />
                    
                    <CardHeader className="pb-4 pt-6 border-b border-zinc-900 bg-zinc-900/30">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Network className="text-zinc-400" /> Resolve Code Interaction
                        </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="space-y-8 pt-8 px-8">
                        {/* Visualization */}
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col items-center gap-2 w-1/3 p-3 rounded-lg bg-zinc-900 border border-zinc-800 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"/>
                                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: dragAction.source.color }} />
                                <span className="text-sm font-bold text-zinc-200 truncate w-full text-center">{dragAction.source.name}</span>
                                <Badge variant="outline" className="text-[9px] uppercase tracking-wider text-zinc-500 border-zinc-800">Source</Badge>
                            </div>
                            
                            <ArrowRight size={24} className="text-zinc-600 animate-pulse" />

                            <div className="flex flex-col items-center gap-2 w-1/3 p-3 rounded-lg bg-zinc-900 border border-zinc-800 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity"/>
                                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: dragAction.target.color }} />
                                <span className="text-sm font-bold text-zinc-200 truncate w-full text-center">{dragAction.target.name}</span>
                                <Badge variant="outline" className="text-[9px] uppercase tracking-wider text-zinc-500 border-zinc-800">Target</Badge>
                            </div>
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={executeMerge}
                                className="flex flex-col items-start p-4 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-amber-900/20 hover:border-amber-700/50 transition-all group"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <GitMerge className="text-zinc-500 group-hover:text-amber-500 transition-colors" size={20} />
                                    <span className="font-bold text-zinc-300 group-hover:text-amber-400">Merge Into</span>
                                </div>
                                <p className="text-xs text-zinc-500 text-left leading-relaxed">
                                    Combine usages. 
                                    <span className="text-zinc-400 font-bold mx-1">{dragAction.source.name}</span> 
                                    will be deleted and its codings moved to Target.
                                </p>
                            </button>

                            <button 
                                onClick={executeNest}
                                className="flex flex-col items-start p-4 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-blue-900/20 hover:border-blue-700/50 transition-all group"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <FolderInput className="text-zinc-500 group-hover:text-blue-500 transition-colors" size={20} />
                                    <span className="font-bold text-zinc-300 group-hover:text-blue-400">Group / Nest</span>
                                </div>
                                <p className="text-xs text-zinc-500 text-left leading-relaxed">
                                    Keep both. 
                                    <span className="text-zinc-400 font-bold mx-1">{dragAction.source.name}</span> 
                                    becomes a child of Target. Target becomes a Category.
                                </p>
                            </button>
                        </div>
                    </CardContent>
                    
                    <CardFooter className="flex justify-end p-4 bg-zinc-900/30 border-t border-zinc-900">
                        <Button variant="ghost" onClick={() => setDragAction(null)}>Cancel</Button>
                    </CardFooter>
                </Card>
            </div>
        )}

        {/* Main Layout */}
        <div className="flex-1 flex overflow-hidden">
            
            {/* Sidebar */}
            <div className="w-16 bg-zinc-950 border-r border-zinc-800 flex flex-col items-center py-4 gap-4 z-20">
                {/* Branding */}
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20 mb-2">
                    <BrainCircuit className="text-white" size={24} />
                </div>

                <div className="flex-1 flex flex-col gap-2 w-full px-2">
                   <SidebarTab active={activeTab === 'curate'} onClick={() => setActiveTab('curate')} icon={Database} label="Data" />
                   <SidebarTab active={activeTab === 'analyze'} onClick={() => setActiveTab('analyze')} icon={Search} label="Analyze" />
                   <SidebarTab active={activeTab === 'theory'} onClick={() => setActiveTab('theory')} icon={Lightbulb} label="Theory" />
                   <SidebarTab active={activeTab === 'visualize'} onClick={() => setActiveTab('visualize')} icon={Layout} label="Viz" />
                   <SidebarTab active={activeTab === 'report'} onClick={() => setActiveTab('report')} icon={FileText} label="Report" />
                </div>

                <div className="flex flex-col gap-3 w-full px-2">
                    <button onClick={() => setIsJournalOpen(true)} className="p-2 text-zinc-500 hover:text-amber-500 hover:bg-zinc-900 rounded-md transition-colors relative group">
                        <BookMarked size={20} />
                        <span className="absolute left-14 bg-zinc-800 text-zinc-200 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">Journal</span>
                    </button>
                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 rounded-md transition-colors relative group">
                        <Settings size={20} />
                        <span className="absolute left-14 bg-zinc-800 text-zinc-200 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">Settings</span>
                    </button>
                    
                    {/* User Profile */}
                    <div className="mt-2 pt-2 border-t border-zinc-800 w-full flex justify-center">
                        <HoverCard>
                            <HoverCardTrigger>
                                <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-transparent hover:ring-zinc-700 transition-all">
                                    <AvatarFallback className="bg-blue-900 text-blue-200 text-xs">{activeResearcher.initials}</AvatarFallback>
                                </Avatar>
                            </HoverCardTrigger>
                            <HoverCardContent side="right" className="w-64 bg-zinc-950 border-zinc-800 p-0 ml-2">
                                <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback className="bg-blue-600 text-white">{activeResearcher.initials}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-bold text-sm">{activeResearcher.name}</div>
                                        <div className="text-xs text-zinc-500">{activeResearcher.role} Researcher</div>
                                    </div>
                                </div>
                                <div className="p-2">
                                    <div className="text-[10px] uppercase font-bold text-zinc-500 px-2 py-1">Switch Account</div>
                                    {researchTeam.researchers.map(r => (
                                        <button 
                                            key={r.id}
                                            onClick={() => setActiveResearcherId(r.id)}
                                            className={cn(
                                                "w-full text-left px-2 py-1.5 text-xs rounded flex items-center gap-2",
                                                activeResearcherId === r.id ? "bg-blue-900/20 text-blue-400" : "text-zinc-400 hover:bg-zinc-900"
                                            )}
                                        >
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                                            {r.name}
                                            {activeResearcherId === r.id && <CheckCircle2 size={10} className="ml-auto" />}
                                        </button>
                                    ))}
                                </div>
                            </HoverCardContent>
                        </HoverCard>
                    </div>
                </div>
            </div>

            {/* Stage Content */}
            <main className="flex-1 relative overflow-hidden bg-zinc-950">
                
                {/* DATA CURATION STAGE */}
                {activeTab === 'curate' && (
                    <CurationWorkflow 
                        artifacts={artifacts}
                        onUpdateArtifact={handleUpdateArtifact}
                        onDeleteArtifact={handleDeleteArtifact}
                        onCreateArtifact={handleCreateArtifact}
                        participants={projectSettings.participants}
                        researchers={researchTeam.researchers}
                    />
                )}

                {/* ANALYSIS STAGE */}
                {activeTab === 'analyze' && (
                    <div className="flex h-full">
                        {/* LEFT SIDEBAR: Layers */}
                        <div className="h-full z-20">
                             <LayerControl layers={layers} toggleLayer={toggleLayer} />
                        </div>

                        {/* MIDDLE: Artifact View */}
                        <div className="flex-1 relative flex flex-col h-full min-w-0">
                            {activeArtifact ? (
                                <>
                                    <ArtifactView 
                                        artifact={activeArtifact}
                                        codings={codings}
                                        codes={codes}
                                        memos={memos}
                                        researchTeam={researchTeam}
                                        activeResearcherId={activeResearcherId}
                                        votes={votes}
                                        onVote={handleVote}
                                        layersVisible={layersVisible}
                                        onAddCoding={handleAddCoding}
                                        onCreateCode={(name) => handleCreateCode(name, 'code')}
                                        onAddMemo={(snippet, content, range, type) => {
                                            const newMemo: Memo = {
                                                id: `memo-${Date.now()}`,
                                                title: snippet.substring(0, 20) + '...',
                                                content,
                                                relatedIds: [activeArtifact.id],
                                                createdAt: new Date().toISOString(),
                                                type: type || 'descriptive' as any, // Default to descriptive if not provided
                                                number: memos.length + 1,
                                                authorId: activeResearcherId,
                                                segment: { start: range!.start, end: range!.end, text: snippet }
                                            };
                                            setMemos([...memos, newMemo]);
                                            addJournalEntry(`Created ${type || 'descriptive'} annotation on ${activeArtifact.name}: "${content.substring(0, 20)}..."`, 'auto');
                                        }}
                                        onEditMemo={(memo) => {
                                            // Handle edit memo (simple prompt for now or open dialog)
                                            const newContent = prompt("Update annotation:", memo.content);
                                            if (newContent) {
                                                 setMemos(prev => prev.map(m => m.id === memo.id ? { ...m, content: newContent } : m));
                                            }
                                        }}
                                        onUpdateMemo={(id, content) => {
                                            setMemos(prev => prev.map(m => m.id === id ? { ...m, content } : m));
                                        }}
                                        onDeleteMemo={handleDeleteMemo}
                                        selectedCodeId={codeFilter}
                                        onClearSelection={() => setCodeFilter(null)}
                                        onUpdateArtifact={handleUpdateArtifact}
                                        participants={projectSettings.participants}
                                    />
                                    {/* Removed Floating Layer Control Overlay */}
                                    <TheoryGraph 
                                        codes={codes} 
                                        codings={codings} 
                                        layersVisible={layersVisible} 
                                        onNodeClick={(id) => setCodeFilter(id)}
                                        selectedCodeId={codeFilter}
                                    />
                                </>
                            ) : (
                                <div className="h-full flex items-center justify-center text-zinc-500">
                                    Select a document to begin analysis.
                                </div>
                            )}
                        </div>

                        {/* RIGHT SIDEBAR: Artifacts & Codes & Memos */}
                        <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col shrink-0">
                             <div className="flex border-b border-zinc-800 bg-zinc-950">
                                 <button 
                                     onClick={() => setSidebarTab('artifacts')}
                                     className={cn("flex-1 py-3 text-xs font-medium border-b-2 transition-colors", sidebarTab === 'artifacts' ? "border-blue-500 text-zinc-200" : "border-transparent text-zinc-500 hover:text-zinc-300")}
                                 >
                                     Documents
                                 </button>
                                 <button 
                                     onClick={() => setSidebarTab('codes')}
                                     className={cn("flex-1 py-3 text-xs font-medium border-b-2 transition-colors", sidebarTab === 'codes' ? "border-blue-500 text-zinc-200" : "border-transparent text-zinc-500 hover:text-zinc-300")}
                                 >
                                     Codes
                                 </button>
                                 <button 
                                     onClick={() => setSidebarTab('memos')}
                                     className={cn("flex-1 py-3 text-xs font-medium border-b-2 transition-colors", sidebarTab === 'memos' ? "border-blue-500 text-zinc-200" : "border-transparent text-zinc-500 hover:text-zinc-300")}
                                 >
                                     Memos
                                 </button>
                             </div>

                             <div className="flex-1 overflow-hidden">
                                 {sidebarTab === 'artifacts' && (
                                     <div className="h-full overflow-y-auto p-2 space-y-1">
                                         {artifacts.map(art => (
                                             <div 
                                                 key={art.id}
                                                 onClick={() => setActiveArtifactId(art.id)}
                                                 className={cn(
                                                     "p-2 rounded cursor-pointer text-sm flex items-center gap-2",
                                                     activeArtifactId === art.id ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-800/50"
                                                 )}
                                             >
                                                 {art.media === 'text' ? <FileText size={14} /> : <Tag size={14}/>}
                                                 <span className="truncate">{art.name}</span>
                                             </div>
                                         ))}
                                         <Button variant="ghost" size="sm" className="w-full mt-2 text-xs text-zinc-500 border border-dashed border-zinc-800" onClick={() => handleCreateArtifact()}>
                                             <Plus size={12} className="mr-2"/> Import
                                         </Button>
                                     </div>
                                 )} 
                                 
                                 {sidebarTab === 'codes' && (
                                     <OntologyManager 
                                        codes={codes}
                                        codings={codings}
                                        onNodeClick={(id) => setCodeFilter(id === codeFilter ? null : id)}
                                        selectedCodeId={codeFilter}
                                        onCreateCode={handleCreateCode}
                                        onUpdateCode={handleUpdateCode}
                                        onCodeDrop={handleCodeDrop}
                                        onDeleteCode={handleDeleteCode}
                                        onElaborate={handleElaborateOntology}
                                        isElaborating={isElaborating}
                                     />
                                 )}

                                 {sidebarTab === 'memos' && (
                                     <MemoDirectory 
                                        memos={memos} 
                                        artifacts={artifacts} 
                                        onSelectMemo={(m) => {
                                            if(m.relatedIds.length > 0) {
                                                const artId = m.relatedIds[0];
                                                setActiveArtifactId(artId);
                                            }
                                        }}
                                        onDeleteMemo={handleDeleteMemo}
                                        onConvertToArtifact={handleConvertToArtifact}
                                    />
                                 )}
                             </div>
                        </div>
                    </div>
                )}

                {/* THEORY BUILDING STAGE */}
                {activeTab === 'theory' && (
                    <TheoryBuilder 
                        codes={codes}
                        codings={codings}
                        artifacts={artifacts}
                        memos={memos}
                        researchQuestions={projectSettings.theoreticalFramework.researchQuestions}
                        onSetCoreCategory={(id) => {
                            setCodes(prev => prev.map(c => ({ ...c, isCore: c.id === id })));
                            addJournalEntry(`Designated [${codes.find(c => c.id === id)?.name}] as Core Category`, 'auto');
                        }}
                        onAddMemo={(title, content) => {
                            const newMemo: Memo = {
                                id: `theory-${Date.now()}`,
                                title,
                                content,
                                relatedIds: [],
                                createdAt: new Date().toISOString(),
                                type: 'theoretical',
                                number: memos.length + 1,
                                authorId: activeResearcherId
                            };
                            setMemos(prev => [...prev, newMemo]);
                            addJournalEntry(`Added Theoretical Memo: ${title}`, 'auto');
                        }}
                        onAddFinding={(title, content, relatedIds) => {
                            const newMemo: Memo = {
                                id: `finding-${Date.now()}`,
                                title,
                                content,
                                relatedIds: relatedIds || [],
                                createdAt: new Date().toISOString(),
                                type: 'finding',
                                number: memos.length + 1,
                                authorId: activeResearcherId
                            };
                            setMemos(prev => [...prev, newMemo]);
                            addJournalEntry(`Logged Finding: ${title}`, 'auto');
                        }}
                        onUpdateMemo={(id, updates) => {
                            setMemos(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
                        }}
                        onDeleteMemo={handleDeleteMemo}
                        onCreateCode={(name, kind) => handleCreateCode(name, kind)}
                        onUpdateCode={handleUpdateCode}
                        theoryArtefact={theoryArtefact}
                        settings={projectSettings}
                        onOpenSettings={() => setIsSettingsOpen(true)}
                        onConvertToArtifact={handleConvertToArtifact}
                    />
                )}

                {/* VISUALIZATION STAGE */}
                {activeTab === 'visualize' && (
                    <Visualizations 
                        codes={codes}
                        codings={codings}
                        artifacts={artifacts}
                        settings={projectSettings}
                        memos={memos}
                    />
                )}

                {/* REPORTING STAGE */}
                {activeTab === 'report' && (
                    <ReportView 
                        settings={projectSettings}
                        memos={memos}
                        codes={codes}
                        artifacts={artifacts}
                        onUpdateSettings={(s) => setProjectSettings(s)}
                    />
                )}
                
            </main>
        </div>

        {/* Global Overlays */}
        <ReflexivityJournal 
            entries={journalEntries}
            onAddEntry={(c) => addJournalEntry(c)}
            isOpen={isJournalOpen}
            onClose={() => setIsJournalOpen(false)}
        />

        <SettingsDialog 
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={projectSettings}
            team={researchTeam}
            memos={memos} 
            codes={codes}
            codings={codings}
            artifacts={artifacts}
            activeResearcherId={activeResearcherId}
            onSave={(newSettings, newTeam, newMemos) => {
                setProjectSettings(newSettings);
                if(newTeam) setResearchTeam(newTeam);
                if(newMemos) setMemos(newMemos);
                
                // Update Theory Artefact type if changed
                if(newSettings.theoryType !== theoryArtefact.type) {
                    setTheoryArtefact(prev => ({ ...prev, type: newSettings.theoryType }));
                }
            }}
            onImportProject={handleImportProject}
            onConvertToArtifact={handleConvertToArtifact}
        />
    </div>
  );
};

// Simple sidebar button component
const SidebarTab = ({ active, onClick, icon: Icon, label }: any) => (
    <button 
        onClick={onClick}
        className={cn(
            "flex flex-col items-center justify-center p-2 rounded-lg transition-all w-full gap-1",
            active 
                ? "bg-zinc-800 text-blue-400" 
                : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900"
        )}
        title={label}
    >
        <Icon size={20} />
        <span className="text-[10px] font-medium">{label}</span>
    </button>
);