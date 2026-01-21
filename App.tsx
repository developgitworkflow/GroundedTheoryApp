import React, { useState } from 'react';
import { LayerControl } from './components/LayerControl';
import { ArtifactView } from './components/ArtifactView';
import { TheoryGraph } from './components/TheoryGraph';
import { ReflexivityJournal } from './components/ReflexivityJournal';
import { TheoryBuilder } from './components/TheoryBuilder';
import { CurationWorkflow } from './components/CurationWorkflow'; 
import { MemoDirectory } from './components/MemoDirectory'; 
import { SettingsDialog } from './components/SettingsDialog'; // New Import
import { Artifact, Code, Coding, LayerConfig, LayerType, Memo, JournalEntry, ProjectSettings } from './types';
import { 
  FilePlus, 
  Settings, 
  Download, 
  BrainCircuit,
  Search,
  Plus,
  BookMarked,
  StickyNote,
  X,
  Tag
} from 'lucide-react';

// Design System Components
import { Button } from './components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import { cn } from './lib/utils';

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
            preservationNotes: 'Subject requested anonymity in final publication.'
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

const INITIAL_CODES: Code[] = [
  { id: 'c1', name: 'Betrayal', color: '#ef4444' }, // Red
  { id: 'c2', name: 'Autonomy', color: '#3b82f6' }, // Blue
  { id: 'c3', name: 'Resistance', color: '#f59e0b' }, // Amber
  { id: 'c4', name: 'Trust Deficit', color: '#8b5cf6' }, // Violet
  { id: 'c5', name: 'Productivity Paradox', color: '#10b981' }, // Emerald
];

const INITIAL_CODINGS: Coding[] = [
  { id: 'cd1', artifactId: 'a1', codeId: 'c1', start: 86, end: 94, textSnippet: 'betrayal' },
  { id: 'cd2', artifactId: 'a1', codeId: 'c2', start: 175, end: 183, textSnippet: 'autonomy' },
  { id: 'cd3', artifactId: 'a1', codeId: 'c4', start: 209, end: 236, textSnippet: "management didn't trust us" },
];

const INITIAL_SETTINGS: ProjectSettings = {
  projectName: "Remote Work Study",
  userName: "Researcher",
  themeMode: "dark",
  stripeWidth: 4,
  aiModel: "gemini-3-flash-preview",
  stopWords: ["the", "and", "is", "of", "to", "in", "it", "that", "was"]
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

  // Settings State
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>(INITIAL_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Global Edit State
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  const [editMemoContent, setEditMemoContent] = useState('');

  // Derived state
  const activeArtifact = artifacts.find(a => a.id === activeArtifactId) || artifacts[0];
  const layersVisible = layers.reduce((acc, layer) => {
    acc[layer.id] = layer.visible;
    return acc;
  }, {} as Record<LayerType, boolean>);
  
  const filteredCodes = codes.filter(c => 
    c.name.toLowerCase().includes(codeSearchTerm.toLowerCase())
  );

  // Helper to add log
  const addJournalEntry = (content: string, type: 'auto' | 'manual' = 'manual') => {
    const entry: JournalEntry = {
        id: `entry-${Date.now()}`,
        timestamp: new Date().toISOString(),
        content,
        type
    };
    setJournalEntries(prev => [...prev, entry]);
  };

  const toggleLayer = (id: LayerType) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
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
      id: `coding-${Date.now()}`
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
      color: randomColor
    };
    setCodes(prev => [...prev, newCode]);
    addJournalEntry(`Created new in-vivo code: [${name}]`, 'auto');
    return newCode;
  };

  const handleAddMemo = (snippet: string, content: string, range?: { start: number, end: number }) => {
      const newMemo: Memo = {
          id: `memo-${Date.now()}`,
          title: snippet.substring(0, 15) + (snippet.length > 15 ? '...' : ''),
          content,
          relatedIds: [activeArtifact.id],
          createdAt: new Date().toISOString(),
          type: 'observational',
          segment: range ? { start: range.start, end: range.end, text: snippet } : undefined
      };
      setMemos(prev => [...prev, newMemo]);
      addJournalEntry(`Added observational memo on "${newMemo.title}"`, 'auto');
      
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
          type: 'theoretical'
      };
      setMemos(prev => [...prev, newMemo]);
      addJournalEntry(`Generated theoretical story line: ${title}`, 'auto');
  };

  const handleSetCoreCategory = (codeId: string) => {
      setCodes(prev => prev.map(c => ({
          ...c,
          isCore: c.id === codeId
      })));
      const name = codes.find(c => c.id === codeId)?.name;
      addJournalEntry(`Defined [${name}] as Core Category for the curated model.`, 'manual');
  };

  const handleNodeClick = (codeId: string) => {
    console.log("Clicked code:", codeId);
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
  const handleSaveSettings = (newSettings: ProjectSettings) => {
    setProjectSettings(newSettings);
    addJournalEntry(`Updated project settings`, 'auto');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-6 shrink-0 z-30">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-blue-500">
             <BrainCircuit size={28} className="text-blue-600" />
             <span className="font-bold text-xl tracking-tight text-white">STRATUM</span>
          </div>
          <Badge variant="secondary" className="font-normal text-zinc-400 border-zinc-800">
            Project: {projectSettings.projectName}
          </Badge>
        </div>
        
        <div className="flex items-center gap-3">
            <Button 
                onClick={() => setIsJournalOpen(!isJournalOpen)}
                variant={isJournalOpen ? "secondary" : "outline"}
                size="sm"
                className={cn("gap-2", isJournalOpen && "bg-amber-950/30 text-amber-500 border-amber-900/50 hover:bg-amber-950/50")}
            >
                <BookMarked size={16} /> Journal
            </Button>
            <Button variant="brand" size="sm" className="gap-2">
                <Download size={16} /> Export
            </Button>
            <div className="w-px h-6 bg-zinc-800 mx-2"></div>
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
                                layersVisible={layersVisible}
                                onAddCoding={handleAddCoding}
                                onCreateCode={handleCreateCode}
                                onAddMemo={handleAddMemo}
                                onEditMemo={openMemoEditor} 
                            />
                            )}

                            {/* Graph Overlay */}
                            <TheoryGraph 
                                codes={codes} 
                                codings={codings} 
                                layersVisible={layersVisible} 
                                onNodeClick={handleNodeClick}
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
                        memos={memos.filter(m => m.type === 'theoretical')}
                        onSetCoreCategory={handleSetCoreCategory}
                        onAddMemo={handleAddTheoryMemo}
                    />
                </TabsContent>
            </div>

            {/* Right: Sidebar (Tabs for Codes / Memos) - Only in Analysis Mode */}
            {activeTab === 'analyze' && (
                <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col z-20 shadow-xl overflow-hidden">
                    <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="flex-1 flex flex-col">
                        <div className="flex items-center justify-center p-2 bg-zinc-950 border-b border-zinc-800">
                             <TabsList className="bg-zinc-900 grid grid-cols-2 w-full">
                                <TabsTrigger value="codes" className="text-xs gap-2"><Tag size={12}/> Codes</TabsTrigger>
                                <TabsTrigger value="memos" className="text-xs gap-2"><StickyNote size={12}/> Directory</TabsTrigger>
                             </TabsList>
                        </div>

                        {/* TAB 1: CODEBOOK */}
                        <TabsContent value="codes" className="flex-1 flex flex-col mt-0 data-[state=inactive]:hidden overflow-hidden">
                             <div className="p-3 border-b border-zinc-800">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 text-zinc-500" size={14} />
                                    <Input 
                                        className="pl-8 h-9 bg-zinc-950 border-zinc-800" 
                                        placeholder="Filter codes..." 
                                        value={codeSearchTerm}
                                        onChange={(e) => setCodeSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                <div className="flex flex-wrap gap-2 content-start">
                                    {filteredCodes.map(code => (
                                        <Badge 
                                            key={code.id}
                                            variant="outline"
                                            className={cn(
                                                "pl-2 pr-2.5 py-1 gap-1.5 cursor-pointer transition-all hover:bg-zinc-800",
                                                code.isCore ? "ring-1 ring-yellow-500/50" : "border-zinc-800"
                                            )}
                                            style={{ 
                                                borderColor: code.isCore ? undefined : `${code.color}40`,
                                                backgroundColor: `${code.color}10`,
                                                color: '#e4e4e7' // zinc-200
                                            }}
                                            onClick={() => handleNodeClick(code.id)}
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_4px_currentColor]" style={{ backgroundColor: code.color, color: code.color }} />
                                            <span className="font-medium text-xs">{code.name}</span>
                                            {code.isCore && <span className="text-[8px] text-yellow-500 ml-1">★</span>}
                                            <span className="ml-0.5 text-[9px] opacity-50 font-mono">
                                                {codings.filter(c => c.codeId === code.id).length}
                                            </span>
                                        </Badge>
                                    ))}
                                    
                                    {filteredCodes.length === 0 && (
                                        <div className="w-full text-center py-8 text-zinc-500 text-xs">
                                            No codes found matching "{codeSearchTerm}".
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
                                    <Plus size={14} /> Create New Code
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
        onSave={handleSaveSettings}
      />

      {/* Global Memo Editor Dialog */}
      {editingMemo && (
             <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                 <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl w-[400px] animate-in fade-in zoom-in-95 overflow-hidden">
                     <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-950">
                        <div className="flex items-center gap-2">
                             <StickyNote size={16} className="text-amber-500" />
                             <span className="font-semibold text-zinc-200 text-sm">Edit Annotation</span>
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
