import React, { useState, useRef } from 'react';
import { LayerControl } from './components/LayerControl';
import { ArtifactView } from './components/ArtifactView';
import { TheoryGraph } from './components/TheoryGraph';
import { ReflexivityJournal } from './components/ReflexivityJournal';
import { TheoryBuilder } from './components/TheoryBuilder';
import { CurationWorkflow } from './components/CurationWorkflow'; 
import { MemoDirectory } from './components/MemoDirectory'; 
import { SettingsDialog } from './components/SettingsDialog'; // New Import
import { Visualizations } from './components/Visualizations'; // New Import
import { suggestOntology } from './services/geminiService'; // New Import
import { exportOntologyToOwl, parseOwlToCodes } from './lib/owlUtils'; // New Import
import { Artifact, Code, Coding, LayerConfig, LayerType, Memo, JournalEntry, ProjectSettings, Theory, ResearchTeam, Researcher, Vote, VoteStatus } from './types';
import { 
  FilePlus, 
  Settings, 
  Download, 
  Upload,
  BrainCircuit,
  Search,
  Plus,
  BookMarked,
  StickyNote,
  X,
  Tag,
  GitMerge,
  ChevronRight,
  ChevronDown,
  Loader2,
  Users,
  GraduationCap,
  FileJson
} from 'lucide-react';

// Design System Components
import { Button } from './components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { cn } from './lib/utils';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './components/ui/hover-card';

const INITIAL_LAYERS: LayerConfig[] = [
  { id: LayerType.ARTIFACT, label: 'Artifact Source', visible: true, color: '#fff' },
  { id: LayerType.OPEN_CODING, label: 'Open Codes', visible: true, color: '#60a5fa' },
  { id: LayerType.AXIAL_CONNECTIONS, label: 'Theory Network', visible: true, color: '#f472b6' },
  { id: LayerType.THEORY_MEMOS, label: 'Annotations', visible: false, color: '#fbbf24' },
];

const INITIAL_ARTIFACTS: Artifact[] = [
    {
        id: 'a1',
        name: 'Interview: Subject 004',
        type: 'interview',
        status: 'active',
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
        name: 'Observation Notes: Office Floor',
        type: 'observation',
        status: 'inbox', // Still needs appraisal
        curation: {
            format: 'Field Notes',
            source: 'Researcher',
            dateCreated: '2023-10-20',
            consentObtained: true
        },
        content: `10:00 AM: The open plan office is remarkably quiet. People are wearing headphones. Interaction is minimal.`
    }
];

// Initial Codes now distinguish between 'code' and 'category'
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
  
  // New Initial Data
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

// --- Recursive Tree Component ---

interface CodeTreeItemProps {
    code: Code; 
    allCodes: Code[]; 
    codings: Coding[]; 
    depth?: number; 
    onNodeClick: (id: string) => void;
    search: string;
    selectedCodeId?: string | null;
}

const CodeTreeItem: React.FC<CodeTreeItemProps> = ({ 
    code, 
    allCodes, 
    codings, 
    depth = 0, 
    onNodeClick,
    search,
    selectedCodeId
}) => {
    const children = allCodes.filter(c => c.parentId === code.id);
    const [isOpen, setIsOpen] = useState(true);
    const usageCount = codings.filter(c => c.codeId === code.id).length;
    
    // Simple filter check
    const matches = code.name.toLowerCase().includes(search.toLowerCase());
    const childMatches = children.some(c => c.name.toLowerCase().includes(search.toLowerCase()));

    if (search && !matches && !childMatches) return null;

    return (
        <div className="select-none">
            <div 
                className={cn(
                    "flex items-center gap-2 py-1.5 px-2 hover:bg-zinc-800 rounded cursor-pointer transition-colors group border-l-2 border-transparent",
                    code.isCore && "bg-yellow-950/10 hover:bg-yellow-950/20",
                    selectedCodeId === code.id ? "bg-blue-900/30 border-blue-500" : "hover:border-zinc-700"
                )}
                style={{ marginLeft: `${depth * 12}px` }}
                onClick={() => onNodeClick(code.id)}
            >
                <div 
                    onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                    className={cn("p-0.5 rounded hover:bg-zinc-700 text-zinc-500", children.length === 0 && "opacity-0 pointer-events-none")}
                >
                    {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </div>

                <div className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: code.color }} />
                
                <span className={cn("text-xs font-medium truncate flex-1", code.isCore ? "text-yellow-500" : "text-zinc-300", selectedCodeId === code.id && "text-blue-200")}>
                    {code.name}
                </span>

                {code.kind === 'category' && <span className="text-[9px] text-zinc-500 uppercase font-mono bg-zinc-800 px-1 rounded border border-zinc-700">CAT</span>}
                {code.isCore && <span className="text-[8px] text-yellow-600">★</span>}
                
                <span className="text-[9px] text-zinc-600 font-mono w-5 text-right">
                    {usageCount}
                </span>
            </div>
            
            {isOpen && children.map(child => (
                <CodeTreeItem 
                    key={child.id} 
                    code={child} 
                    allCodes={allCodes} 
                    codings={codings} 
                    depth={depth + 1}
                    onNodeClick={onNodeClick}
                    search={search}
                    selectedCodeId={selectedCodeId}
                />
            ))}
        </div>
    );
};

export default function App() {
  const [layers, setLayers] = useState<LayerConfig[]>(INITIAL_LAYERS);
  const [artifacts, setArtifacts] = useState<Artifact[]>(INITIAL_ARTIFACTS);
  const [activeArtifactId, setActiveArtifactId] = useState<string>('a1');
  const [codes, setCodes] = useState<Code[]>(INITIAL_CODES);
  const [codings, setCodings] = useState<Coding[]>(INITIAL_CODINGS);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [activeTab, setActiveTab] = useState('curate'); // Start at curation
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('codes'); // Right sidebar state
  const [codeSearchTerm, setCodeSearchTerm] = useState('');
  
  // File Import Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings State
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>(INITIAL_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isElaborating, setIsElaborating] = useState(false);

  // Team & Voting State
  const [researchTeam, setResearchTeam] = useState<ResearchTeam>(INITIAL_TEAM);
  const [activeResearcherId, setActiveResearcherId] = useState<string>(INITIAL_TEAM.researchers[0].id);
  const [votes, setVotes] = useState<Vote[]>([]); // Initialize empty votes

  // Filter State
  const [codeFilter, setCodeFilter] = useState<string | null>(null);

  const activeResearcher = researchTeam.researchers.find(r => r.id === activeResearcherId) || researchTeam.researchers[0];
  
  // The central Theory Artefact
  const [theoryArtefact, setTheoryArtefact] = useState<Theory>({
      id: 'theory-1',
      type: projectSettings.theoryType,
      content: '',
      categoryIds: []
  });

  // Global Edit State
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  const [editMemoContent, setEditMemoContent] = useState('');

  // Derived state
  const activeArtifact = artifacts.find(a => a.id === activeArtifactId) || artifacts[0];
  const layersVisible = layers.reduce((acc, layer) => {
    acc[layer.id] = layer.visible;
    return acc;
  }, {} as Record<LayerType, boolean>);
  
  // Filter for top-level codes (or all if flattening for search)
  const rootCodes = codes.filter(c => !c.parentId);

  // Helper to add log
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

  // Import / Export Logic
  const handleExportOwl = () => {
    const owlString = exportOntologyToOwl(codes, projectSettings.projectName);
    const blob = new Blob([owlString], { type: 'application/rdf+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectSettings.projectName.replace(/\s+/g, '_')}_ontology.owl`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addJournalEntry("Exported ontology to OWL file", 'auto');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
        const text = await file.text();
        // Naive check for format
        if (text.includes('rdf:RDF')) {
            const importedCodes = parseOwlToCodes(text);
            if (importedCodes.length > 0) {
                // Merge strategy: Append with ID conflict check
                const newCodes = [...codes];
                let addedCount = 0;
                importedCodes.forEach(ic => {
                    const exists = newCodes.find(c => c.id === ic.id);
                    if (!exists) {
                        newCodes.push(ic);
                        addedCount++;
                    }
                });
                setCodes(newCodes);
                addJournalEntry(`Imported OWL ontology. Added ${addedCount} new codes.`, 'auto');
            } else {
                alert("No valid codes found in OWL file.");
            }
        } else {
            alert("File does not appear to be a valid RDF/XML OWL ontology.");
        }
    } catch (err) {
        console.error(err);
        alert("Failed to parse file.");
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };


  // Voting Handler
  const handleVote = (criterionId: string, status: VoteStatus, comment?: string) => {
      setVotes(prev => {
          // Remove existing vote for this researcher on this criterion/artifact if exists
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

  // Curation Actions
  const handleUpdateArtifact = (id: string, updates: Partial<Artifact>) => {
      setArtifacts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
      if (updates.status === 'active') {
          addJournalEntry(`Ingested and preserved artifact: ${id}`, 'auto');
      } else if (updates.status === 'disposed') {
          addJournalEntry(`Disposed artifact: ${id}`, 'auto');
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

  const handleCreateArtifact = () => {
      const newArt: Artifact = {
          id: `a-${Date.now()}`,
          name: `New Import ${Date.now().toString().slice(-4)}`,
          type: 'document',
          status: 'inbox',
          content: 'Raw content pending appraisal...',
          curation: {
              format: 'Text',
              source: 'Unknown',
              dateCreated: new Date().toISOString(),
              consentObtained: false
          }
      };
      setArtifacts(prev => [...prev, newArt]);
      addJournalEntry(`Received new artifact into Inbox`, 'auto');
  };

  // Analysis Actions
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

  const handleCreateCode = async (name: string): Promise<Code> => {
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newCode: Code = {
      id: `code-${Date.now()}`,
      name,
      color: randomColor,
      kind: 'code',
      relatedCodeIds: []
    };
    setCodes(prev => [...prev, newCode]);
    addJournalEntry(`Created new in-vivo code: [${name}]`, 'auto');
    return newCode;
  };

  // Ontology Builder
  const handleElaborateOntology = async () => {
      setIsElaborating(true);
      const suggestions = await suggestOntology(codes);
      
      let newCodes = [...codes];
      let updates = 0;

      suggestions.forEach(group => {
          // Find or create parent
          let parentCode = newCodes.find(c => c.name.toLowerCase() === group.parent.toLowerCase());
          if (!parentCode) {
              parentCode = {
                  id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  name: group.parent,
                  color: '#ffffff', // Category placeholder color
                  description: 'AI Generated Category',
                  kind: 'category',
                  relatedCodeIds: []
              };
              newCodes.push(parentCode);
          } else {
              // Promote to category
              parentCode.kind = 'category';
          }

          // Link children
          group.children.forEach(childName => {
              const childCodeIndex = newCodes.findIndex(c => c.name.toLowerCase() === childName.toLowerCase());
              if (childCodeIndex !== -1) {
                  newCodes[childCodeIndex] = { ...newCodes[childCodeIndex], parentId: parentCode!.id };
                  updates++;
              }
          });
      });

      setCodes(newCodes);
      addJournalEntry(`AI Elaborated Ontology: Organized ${updates} codes into ${suggestions.length} categories.`, 'auto');
      setIsElaborating(false);
  };

  const handleAddMemo = (snippet: string, content: string, range?: { start: number, end: number }) => {
      const newMemo: Memo = {
          id: `memo-${Date.now()}`,
          title: snippet.substring(0, 15) + (snippet.length > 15 ? '...' : ''),
          content,
          relatedIds: [activeArtifact.id],
          createdAt: new Date().toISOString(),
          type: 'observational',
          segment: range ? { start: range.start, end: range.end, text: snippet } : undefined,
          number: memos.length + 1,
          authorId: activeResearcherId
      };
      setMemos(prev => [...prev, newMemo]);
      addJournalEntry(`Added observational memo #${newMemo.number}`, 'auto');
      
      // Auto-enable Memos layer if not visible
      if (!layersVisible[LayerType.THEORY_MEMOS]) {
          toggleLayer(LayerType.THEORY_MEMOS);
      }
  };

  const handleUpdateMemo = (id: string, content: string) => {
    setMemos(prev => prev.map(m => m.id === id ? { ...m, content } : m));
    addJournalEntry(`Updated annotation ${id}`, 'manual');
  };

  const handleAddTheoryMemo = (title: string, content: string) => {
      const newMemo: Memo = {
          id: `tmemo-${Date.now()}`,
          title,
          content,
          relatedIds: [],
          createdAt: new Date().toISOString(),
          type: 'theoretical',
          number: memos.length + 1,
          authorId: activeResearcherId
      };
      setMemos(prev => [...prev, newMemo]);
      // Update the main theory content
      setTheoryArtefact(prev => ({ ...prev, content: content }));
      addJournalEntry(`Updated Theory Artefact Content: ${title}`, 'auto');
  };

  const handleSetCoreCategory = (codeId: string) => {
      setCodes(prev => prev.map(c => ({
          ...c,
          isCore: c.id === codeId,
          // Implicitly promote to category if selected as core
          kind: c.id === codeId ? 'category' : c.kind
      })));
      const name = codes.find(c => c.id === codeId)?.name;
      addJournalEntry(`Defined [${name}] as Core Category for the curated model.`, 'manual');
  };

  const handleNodeClick = (codeId: string) => {
    setCodeFilter(prev => prev === codeId ? null : codeId);
    if (activeTab !== 'analyze') {
        setActiveTab('analyze');
    }
  };

  // Edit Handlers
  const openMemoEditor = (memo: Memo) => {
      setEditingMemo(memo);
      setEditMemoContent(memo.content);
  };

  const saveEditedMemo = () => {
    if (editingMemo) {
      handleUpdateMemo(editingMemo.id, editMemoContent);
    }
    setEditingMemo(null);
    setEditMemoContent('');
  };

  // Handle Settings Save
  const handleSaveSettings = (newSettings: ProjectSettings, updatedTeam?: ResearchTeam) => {
    setProjectSettings(newSettings);
    if (updatedTeam) {
        setResearchTeam(updatedTeam);
    }
    // Update Theory Artefact type if changed
    setTheoryArtefact(prev => ({ ...prev, type: newSettings.theoryType }));
    addJournalEntry(`Updated project settings and team configuration`, 'auto');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* Hidden File Input for Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileImport} 
        className="hidden" 
        accept=".owl,.xml" 
      />

      {/* Header */}
      <header className="h-16 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-6 shrink-0 z-30">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-blue-500">
             <BrainCircuit size={28} className="text-blue-600" />
             <span className="font-bold text-xl tracking-tight text-white">STRATUM</span>
          </div>
          <Badge variant="secondary" className="font-normal text-zinc-400 border-zinc-800 hidden md:inline-flex">
            Project: {projectSettings.projectName}
          </Badge>
        </div>
        
        <div className="flex items-center gap-3">
            {/* Researcher Switcher */}
            <div className="mr-4">
                <HoverCard openDelay={0} closeDelay={200}>
                    <HoverCardTrigger asChild>
                         <Button variant="outline" size="sm" className="gap-2 border-zinc-700 bg-zinc-900/50 pl-1">
                             <Avatar className="h-6 w-6 border border-zinc-600">
                                <AvatarFallback style={{ backgroundColor: activeResearcher.color, color: 'white' }}>{activeResearcher.initials}</AvatarFallback>
                             </Avatar>
                             <span className="text-zinc-200">{activeResearcher.name}</span>
                             <ChevronDown size={12} className="text-zinc-500" />
                         </Button>
                    </HoverCardTrigger>
                    <HoverCardContent align="end" className="w-60 p-2 bg-zinc-950 border-zinc-800">
                        <div className="text-xs font-semibold text-zinc-500 mb-2 px-2 uppercase flex items-center gap-2">
                           <Users size={12}/> Switch Researcher
                        </div>
                        {researchTeam.researchers.map(r => (
                            <div 
                                key={r.id}
                                onClick={() => setActiveResearcherId(r.id)}
                                className={cn(
                                    "flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-zinc-800 transition-colors",
                                    r.id === activeResearcherId ? "bg-zinc-900 ring-1 ring-zinc-800" : ""
                                )}
                            >
                                 <Avatar className="h-8 w-8">
                                     <AvatarFallback style={{ backgroundColor: r.color, color: 'white' }}>{r.initials}</AvatarFallback>
                                 </Avatar>
                                 <div className="flex flex-col">
                                     <span className="text-sm font-medium text-zinc-200">{r.name}</span>
                                     <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                                        {r.role === 'Senior' ? <GraduationCap size={10} /> : <Users size={10} />}
                                        {r.role}
                                     </span>
                                 </div>
                                 {r.id === activeResearcherId && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                            </div>
                        ))}
                    </HoverCardContent>
                </HoverCard>
            </div>

            <Button 
                onClick={() => setIsJournalOpen(!isJournalOpen)}
                variant={isJournalOpen ? "secondary" : "outline"}
                size="sm"
                className={cn("gap-2", isJournalOpen && "bg-amber-950/30 text-amber-500 border-amber-900/50 hover:bg-amber-950/50")}
            >
                <BookMarked size={16} /> Journal
            </Button>
            <div className="w-px h-6 bg-zinc-800 mx-1"></div>
            <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full text-zinc-400"
                onClick={() => setIsSettingsOpen(true)}
            >
                <Settings size={20} />
            </Button>
        </div>
      </header>

      {/* Main Workspace */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="h-12 bg-zinc-950 border-b border-zinc-800 flex items-center px-6 justify-between shrink-0">
             <TabsList className="bg-zinc-900 border border-zinc-800">
                 <TabsTrigger value="curate" className="px-6">1. Ingest & Curation</TabsTrigger>
                 <TabsTrigger value="analyze" className="px-6">2. Text Analysis</TabsTrigger>
                 <TabsTrigger value="memos" className="px-6">3. Theory Builder</TabsTrigger>
                 <TabsTrigger value="visualize" className="px-6">4. Visual Analytics</TabsTrigger>
             </TabsList>
             
             {/* Dynamic Breadcrumb / Context Info */}
             <div className="text-xs text-zinc-500 font-mono flex items-center gap-2">
                {activeTab === 'analyze' && (
                    <>
                        <span>Active Artifact:</span>
                        <select 
                            value={activeArtifactId}
                            onChange={(e) => setActiveArtifactId(e.target.value)}
                            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-zinc-200 focus:outline-none"
                        >
                            {artifacts.filter(a => a.status === 'active').map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </>
                )}
             </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
            {/* Left: Layer Controls (Only visible in Analysis Mode) */}
            {activeTab === 'analyze' && <LayerControl layers={layers} toggleLayer={toggleLayer} />}

            {/* Center: Canvas */}
            <div className="flex-1 relative bg-zinc-950/50 flex flex-col overflow-hidden">
                
                {/* 1. CURATION WORKFLOW */}
                <TabsContent value="curate" className="flex-1 h-full mt-0 data-[state=inactive]:hidden">
                    <CurationWorkflow 
                        artifacts={artifacts}
                        onUpdateArtifact={handleUpdateArtifact}
                        onDeleteArtifact={handleDeleteArtifact}
                        onCreateArtifact={handleCreateArtifact}
                        participants={projectSettings.participants}
                    />
                </TabsContent>

                {/* 2. TEXT ANALYSIS */}
                <TabsContent value="analyze" className="flex-1 h-full mt-0 relative data-[state=inactive]:hidden">
                    {/* Content Layers */}
                    {activeArtifact && activeArtifact.status === 'active' ? (
                        <>
                            {layersVisible[LayerType.ARTIFACT] && (
                            <ArtifactView 
                                artifact={activeArtifact} 
                                codings={codings} 
                                codes={codes} 
                                memos={memos}
                                researchTeam={researchTeam} // Pass team info
                                activeResearcherId={activeResearcherId} // Current user
                                votes={votes} // Pass votes
                                onVote={handleVote} // Voting handler
                                layersVisible={layersVisible}
                                onAddCoding={handleAddCoding}
                                onCreateCode={handleCreateCode}
                                onAddMemo={handleAddMemo}
                                onEditMemo={openMemoEditor} 
                                selectedCodeId={codeFilter}
                                onClearSelection={() => setCodeFilter(null)}
                            />
                            )}

                            {/* Graph Overlay */}
                            <TheoryGraph 
                                codes={codes} 
                                codings={codings} 
                                layersVisible={layersVisible} 
                                onNodeClick={handleNodeClick}
                                selectedCodeId={codeFilter}
                            />
                        </>
                    ) : (
                         <div className="flex items-center justify-center h-full text-zinc-500 flex-col gap-2">
                            <FilePlus size={48} className="opacity-20" />
                            <p>Select an active artifact from the top bar or Ingest more data in the Curation tab.</p>
                         </div>
                    )}
                </TabsContent>

                {/* 3. THEORY BUILDER */}
                <TabsContent value="memos" className="flex-1 h-full mt-0 data-[state=inactive]:hidden">
                    <TheoryBuilder 
                        codes={codes}
                        memos={memos.filter(m => m.type === 'theoretical' || m.type === 'finding')}
                        onSetCoreCategory={handleSetCoreCategory}
                        onAddMemo={handleAddTheoryMemo}
                        theoryArtefact={theoryArtefact}
                    />
                </TabsContent>

                 {/* 4. VISUAL ANALYTICS */}
                <TabsContent value="visualize" className="flex-1 h-full mt-0 data-[state=inactive]:hidden">
                    <Visualizations 
                        codes={codes} 
                        codings={codings} 
                        artifacts={artifacts} 
                        settings={projectSettings} 
                    />
                </TabsContent>

            </div>

            {/* Right: Sidebar (Tabs for Codes / Memos) - Only in Analysis Mode */}
            {activeTab === 'analyze' && (
                <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col z-20 shadow-xl overflow-hidden">
                    <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="flex-1 flex flex-col">
                        <div className="flex items-center justify-center p-2 bg-zinc-950 border-b border-zinc-800">
                             <TabsList className="bg-zinc-900 grid grid-cols-2 w-full">
                                <TabsTrigger value="codes" className="text-xs gap-2"><Tag size={12}/> Ontology</TabsTrigger>
                                <TabsTrigger value="memos" className="text-xs gap-2"><StickyNote size={12}/> Directory</TabsTrigger>
                             </TabsList>
                        </div>

                        {/* TAB 1: CODEBOOK (ONTOLOGY) */}
                        <TabsContent value="codes" className="flex-1 flex flex-col mt-0 data-[state=inactive]:hidden overflow-hidden">
                             <div className="p-3 border-b border-zinc-800 space-y-3">
                                {/* Search Bar */}
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 text-zinc-500" size={14} />
                                    <Input 
                                        className="pl-8 pr-8 h-9 bg-zinc-950 border-zinc-800" 
                                        placeholder="Filter codes..." 
                                        value={codeSearchTerm}
                                        onChange={(e) => setCodeSearchTerm(e.target.value)}
                                    />
                                    {codeSearchTerm && (
                                        <button 
                                            onClick={() => setCodeSearchTerm('')}
                                            className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                                            aria-label="Clear search"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Active Filter Banner */}
                                {codeFilter && (
                                    <div className="flex items-center justify-between px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-md text-xs text-blue-200 animate-in fade-in slide-in-from-top-1">
                                        <div className="flex items-center gap-2 truncate">
                                            <Tag size={12} className="text-blue-400 shrink-0" />
                                            <span className="truncate">
                                                Filtering by: <span className="font-semibold text-blue-100">{codes.find(c => c.id === codeFilter)?.name}</span>
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => setCodeFilter(null)}
                                            className="text-blue-400 hover:text-white hover:bg-blue-500/20 rounded p-0.5 transition-colors"
                                            title="Clear filter"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                )}
                                
                                {/* Toolbar */}
                                <div className="flex items-center gap-1.5">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="flex-1 text-[10px] h-7 gap-2 bg-zinc-900/50 hover:bg-indigo-900/20 hover:text-indigo-400 border-zinc-700"
                                        onClick={handleElaborateOntology}
                                        disabled={isElaborating}
                                        title="Use AI to structure flat codes into hierarchy"
                                    >
                                        {isElaborating ? <Loader2 size={10} className="animate-spin" /> : <GitMerge size={10} />}
                                        {isElaborating ? 'Thinking...' : 'Structure AI'}
                                    </Button>

                                    {/* Data Management Group */}
                                    <div className="flex items-center gap-1 border-l border-zinc-800 pl-1.5">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7 text-zinc-400 hover:text-white" 
                                            onClick={handleImportClick}
                                            title="Import OWL Ontology"
                                        >
                                            <Upload size={14} />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7 text-zinc-400 hover:text-white" 
                                            onClick={handleExportOwl}
                                            title="Export to OWL"
                                        >
                                            <Download size={14} />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                                <div className="flex flex-col">
                                    {rootCodes.length > 0 ? (
                                        rootCodes.map(code => (
                                            <CodeTreeItem 
                                                key={code.id}
                                                code={code}
                                                allCodes={codes}
                                                codings={codings}
                                                onNodeClick={handleNodeClick}
                                                search={codeSearchTerm}
                                                selectedCodeId={codeFilter}
                                            />
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-zinc-500 text-xs flex flex-col items-center gap-2 mt-8">
                                            <FileJson size={32} className="opacity-20" />
                                            <p>No codes defined.</p>
                                            <p className="opacity-50">Create manually or import an ontology.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                             <div className="p-4 bg-zinc-950 border-t border-zinc-800 mt-auto">
                                <Button 
                                    variant="secondary"
                                    className="w-full gap-2 text-zinc-400 hover:text-white"
                                    onClick={() => {
                                        const name = prompt("Enter new code name:");
                                        if(name) handleCreateCode(name);
                                    }}
                                >
                                    <Plus size={14} /> Quick Create
                                </Button>
                            </div>
                        </TabsContent>

                        {/* TAB 2: MEMO DIRECTORY */}
                        <TabsContent value="memos" className="flex-1 flex flex-col mt-0 data-[state=inactive]:hidden overflow-hidden">
                            <MemoDirectory 
                                memos={memos}
                                artifacts={artifacts}
                                onSelectMemo={openMemoEditor}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>

      {/* Reflexivity Journal Drawer */}
      <ReflexivityJournal 
            entries={journalEntries}
            onAddEntry={(content) => addJournalEntry(content, 'manual')}
            isOpen={isJournalOpen}
            onClose={() => setIsJournalOpen(false)}
        />
    
      {/* Settings Dialog */}
      <SettingsDialog 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={projectSettings}
        team={researchTeam}
        onSave={handleSaveSettings}
      />

      {/* Global Memo Editor Dialog */}
      {editingMemo && (
             <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                 <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl w-[400px] animate-in fade-in zoom-in-95 overflow-hidden">
                     <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-950">
                        <div className="flex items-center gap-2">
                             <StickyNote size={16} className="text-amber-500" />
                             <span className="font-semibold text-zinc-200 text-sm">Edit Annotation #{editingMemo.number}</span>
                        </div>
                        <button onClick={() => setEditingMemo(null)} className="text-zinc-500 hover:text-white"><X size={16} /></button>
                     </div>
                     <div className="p-4 space-y-4">
                         <div>
                             <label className="text-[10px] uppercase text-zinc-500 font-bold">Title/Ref</label>
                             <div className="text-zinc-300 text-sm border-b border-zinc-800 pb-1">{editingMemo.title}</div>
                         </div>
                         <div>
                             <label className="text-[10px] uppercase text-zinc-500 font-bold mb-1 block">Content</label>
                             <textarea 
                                className="w-full h-32 bg-zinc-950/50 border border-zinc-700 rounded p-2 text-sm text-zinc-200 resize-none focus:outline-none focus:border-amber-500"
                                value={editMemoContent}
                                onChange={(e) => setEditMemoContent(e.target.value)}
                             />
                         </div>
                     </div>
                     <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex justify-end gap-2">
                         <Button variant="ghost" size="sm" onClick={() => setEditingMemo(null)}>Cancel</Button>
                         <Button variant="brand" size="sm" onClick={saveEditedMemo} className="bg-amber-600 hover:bg-amber-700 text-white">Save Changes</Button>
                     </div>
                 </div>
             </div>
        )}
    </div>
  );
}