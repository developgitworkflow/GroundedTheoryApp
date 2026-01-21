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
import { OntologyManager } from './components/OntologyManager'; // New Import
import { suggestOntology } from './services/geminiService'; 
import { exportOntologyToOwl, parseOwlToCodes } from './lib/owlUtils'; 
import { Artifact, Code, Coding, LayerConfig, LayerType, Memo, JournalEntry, ProjectSettings, Theory, ResearchTeam, Researcher, Vote, VoteStatus } from './types';
import { 
  FilePlus, 
  Settings, 
  BrainCircuit,
  BookMarked,
  StickyNote,
  Tag,
  ChevronDown,
  Users,
  GraduationCap,
  X
} from 'lucide-react';

// Design System Components
import { Button } from './components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import { Badge } from './components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { cn } from './lib/utils';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './components/ui/hover-card';

const INITIAL_LAYERS: LayerConfig[] = [
  { id: LayerType.ARTIFACT, label: 'Artifact Source', visible: true, color: '#fff' },
  { id: LayerType.OPEN_CODING, label: 'Open Codes', visible: true, color: '#60a5fa' },
  { id: LayerType.CATEGORIES, label: 'Categories', visible: false, color: '#fbbf24' }, // New Default
  { id: LayerType.AXIAL_CONNECTIONS, label: 'Theory Network', visible: true, color: '#f472b6' },
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
  
  // File Import Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings State
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>(INITIAL_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isElaborating, setIsElaborating] = useState(false);

  // Team & Voting State
  const [researchTeam, setResearchTeam] = useState<ResearchTeam>(INITIAL_TEAM);
  const [activeResearcherId, setActiveResearcherId] = useState<string>(INITIAL_TEAM.researchers[0].id);
  const [votes, setVotes] = useState<Vote[]>([]); 

  // Filter State
  const [codeFilter, setCodeFilter] = useState<string | null>(null);

  const activeResearcher = researchTeam.researchers.find(r => r.id === activeResearcherId) || researchTeam.researchers[0];
  
  const [theoryArtefact, setTheoryArtefact] = useState<Theory>({
      id: 'theory-1',
      type: projectSettings.theoryType,
      content: '',
      categoryIds: []
  });

  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  const [editMemoContent, setEditMemoContent] = useState('');

  const activeArtifact = artifacts.find(a => a.id === activeArtifactId) || artifacts[0];
  const layersVisible = layers.reduce((acc, layer) => {
    acc[layer.id] = layer.visible;
    return acc;
  }, {} as Record<LayerType, boolean>);
  
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
        if (text.includes('rdf:RDF')) {
            const importedCodes = parseOwlToCodes(text);
            if (importedCodes.length > 0) {
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
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };


  // Voting Handler
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

  // Curation Actions
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

  const handleCreateArtifact = () => {
      const newArt: Artifact = {
          id: `a-${Date.now()}`,
          hashID: Math.random().toString(36).substring(2),
          name: `New Import ${Date.now().toString().slice(-4)}`,
          type: 'document',
          media: 'text',
          access: 'private',
          status: 'acquisition',
          responsibleId: activeResearcherId,
          content: 'Raw content pending appraisal...',
          curation: {
              format: 'Text',
              source: 'Unknown',
              dateCreated: new Date().toISOString(),
              consentObtained: false
          }
      };
      setArtifacts(prev => [...prev, newArt]);
      addJournalEntry(`Received new artifact into Data Acquisition`, 'auto');
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

  const handleCreateCode = async (name: string, kind: 'code' | 'category' = 'code', parentId?: string): Promise<Code> => {
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newCode: Code = {
      id: `code-${Date.now()}`,
      name,
      color: randomColor,
      kind,
      parentId,
      relatedCodeIds: []
    };
    setCodes(prev => [...prev, newCode]);
    addJournalEntry(`Created new ${kind}: [${name}]`, 'auto');
    return newCode;
  };

  const handleUpdateCode = (id: string, updates: Partial<Code>) => {
      setCodes(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleDeleteCode = (id: string) => {
      if(confirm('Delete this code/category? This will also remove associated codings.')) {
          setCodes(prev => prev.filter(c => c.id !== id && c.parentId !== id)); // Remove code and children (simple strategy)
          setCodings(prev => prev.filter(c => c.codeId !== id));
      }
  };

  // Ontology Builder
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
      setTheoryArtefact(prev => ({ ...prev, content: content }));
      addJournalEntry(`Updated Theory Artefact Content: ${title}`, 'auto');
  };

  const handleSetCoreCategory = (codeId: string) => {
      setCodes(prev => prev.map(c => ({
          ...c,
          isCore: c.id === codeId,
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

  const handleSaveSettings = (newSettings: ProjectSettings, updatedTeam?: ResearchTeam) => {
    setProjectSettings(newSettings);
    if (updatedTeam) {
        setResearchTeam(updatedTeam);
    }
    setTheoryArtefact(prev => ({ ...prev, type: newSettings.theoryType }));
    addJournalEntry(`Updated project settings and team configuration`, 'auto');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
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
             
             <div className="text-xs text-zinc-500 font-mono flex items-center gap-2">
                {activeTab === 'analyze' && (
                    <>
                        <span>Active Artifact:</span>
                        <select 
                            value={activeArtifactId}
                            onChange={(e) => setActiveArtifactId(e.target.value)}
                            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-zinc-200 focus:outline-none"
                        >
                            {artifacts.filter(a => a.status === 'analysis' || a.status === 'report').map(a => (
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
                        researchers={researchTeam.researchers}
                    />
                </TabsContent>

                {/* 2. TEXT ANALYSIS */}
                <TabsContent value="analyze" className="flex-1 h-full mt-0 relative data-[state=inactive]:hidden">
                    {/* Content Layers */}
                    {activeArtifact && (activeArtifact.status === 'analysis' || activeArtifact.status === 'report') ? (
                        <>
                            {layersVisible[LayerType.ARTIFACT] && (
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
                            <p>Select an active artifact (in Analysis Phase) from the top bar or Ingest more data in the Curation tab.</p>
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

                        {/* TAB 1: CODEBOOK (ONTOLOGY) - Replaced with OntologyManager */}
                        <TabsContent value="codes" className="flex-1 flex flex-col mt-0 data-[state=inactive]:hidden overflow-hidden">
                             <OntologyManager 
                                codes={codes}
                                codings={codings}
                                onNodeClick={handleNodeClick}
                                selectedCodeId={codeFilter}
                                onCreateCode={handleCreateCode}
                                onUpdateCode={handleUpdateCode}
                                onDeleteCode={handleDeleteCode}
                                onImport={handleImportClick}
                                onExport={handleExportOwl}
                                onElaborate={handleElaborateOntology}
                                isElaborating={isElaborating}
                             />
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