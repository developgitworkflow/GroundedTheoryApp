import React, { useState, useEffect } from 'react';
import { 
  ProjectSettings, Artifact, Code, Coding, Memo, ResearchTeam, 
  Researcher, LayerType, Vote, VoteStatus, JournalEntry, MemoCategory
} from './types';
import { CurationWorkflow } from './components/CurationWorkflow';
import { ArtifactView } from './components/ArtifactView';
import { OntologyManager } from './components/OntologyManager';
import { TheoryBuilder } from './components/TheoryBuilder';
import { Visualizations } from './components/Visualizations';
import { ReportView } from './components/ReportView';
import { SettingsDialog } from './components/SettingsDialog';
import { LayerControl } from './components/LayerControl';
import { MemoDirectory } from './components/MemoDirectory';
import { ReflexivityJournal } from './components/ReflexivityJournal';
import { 
  Layout, 
  Database, 
  Tags, 
  Network, 
  BarChart3, 
  FileText, 
  Settings, 
  BookMarked,
  UserCircle
} from 'lucide-react';
import { Toaster, ToastProps } from './components/ui/toast';
import { suggestOntology } from './services/geminiService';
import { cn } from './lib/utils';

// Default initial state helpers
const initialSettings: ProjectSettings = {
  projectName: "Untitled Project",
  userName: "Researcher",
  themeMode: "dark",
  stripeWidth: 4,
  aiModel: "gemini-3-flash-preview",
  stopWords: [],
  theoryType: "constructivist",
  fieldOfStudy: { subjectOfStudy: "", objectOfStudy: "", location: "" },
  theoreticalFramework: { researchQuestions: [], methods: [], tools: [], bibliographyContent: "" },
  participants: [],
  structuredAbstract: { background: "", methods: "", results: "", conclusion: "", keywords: "", artifactMapping: { background: [], methods: [], results: [], conclusion: [] } }
};

const initialTeam: ResearchTeam = {
    id: 'default-team',
    researchers: [
        { id: 'me', name: 'Me', role: 'Senior', color: '#3b82f6', initials: 'ME' }
    ],
    consensusCriteria: []
};

export default function App() {
  // --- Global State ---
  const [settings, setSettings] = useState<ProjectSettings>(initialSettings);
  const [team, setTeam] = useState<ResearchTeam>(initialTeam);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [codes, setCodes] = useState<Code[]>([]);
  const [codings, setCodings] = useState<Coding[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);

  // --- UI State ---
  const [activeTab, setActiveTab] = useState<'curation' | 'coding' | 'theory' | 'visualize' | 'report'>('curation');
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [activeResearcherId, setActiveResearcherId] = useState<string>('me');
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  
  // Coding View Specifics
  const [layersVisible, setLayersVisible] = useState<Record<LayerType, boolean>>({
      [LayerType.ARTIFACT]: true,
      [LayerType.OPEN_CODING]: true,
      [LayerType.CATEGORIES]: true,
      [LayerType.AXIAL_CONNECTIONS]: false,
      [LayerType.THEORY_MEMOS]: true,
  });
  const [selectedCodeId, setSelectedCodeId] = useState<string | null>(null);
  const [isElaborating, setIsElaborating] = useState(false);

  // --- Handlers ---

  const addToast = (title: string, description?: string, type: 'info'|'success'|'error' = 'info') => {
      const id = Math.random().toString(36);
      setToasts(prev => [...prev, { id, title, description, type, onDismiss: (id) => setToasts(curr => curr.filter(t => t.id !== id)) }]);
  };

  const handleImportProject = (data: any) => {
      if (data.settings) setSettings(data.settings);
      if (data.team) setTeam(data.team);
      if (data.artifacts) setArtifacts(data.artifacts);
      if (data.codes) setCodes(data.codes);
      if (data.codings) setCodings(data.codings);
      if (data.memos) setMemos(data.memos);
      addToast("Project Loaded", "Data imported successfully", "success");
  };

  // Artifacts
  const handleCreateArtifact = (artifact: Partial<Artifact>) => {
      const newArtifact: Artifact = {
          id: `art-${Date.now()}`,
          hashID: Math.random().toString(36).substring(7),
          name: "Untitled",
          content: "",
          type: "document",
          media: "text",
          access: "private",
          status: "acquisition",
          curation: { format: "Text", source: "Manual", dateCreated: new Date().toISOString(), consentObtained: false },
          ...artifact
      } as Artifact;
      setArtifacts([...artifacts, newArtifact]);
      addToast("Artifact Created", newArtifact.name, "success");
  };

  const handleUpdateArtifact = (id: string, updates: Partial<Artifact>) => {
      setArtifacts(artifacts.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handleDeleteArtifact = (id: string) => {
      if(confirm("Delete artifact?")) {
          setArtifacts(artifacts.filter(a => a.id !== id));
          setCodings(codings.filter(c => c.artifactId !== id));
      }
  };

  const handleConvertToArtifact = (title: string, content: string, typeSource: string, sourceId?: string) => {
      handleCreateArtifact({
          name: title,
          content: content,
          curation: {
              format: "Derived",
              source: `${typeSource} (${sourceId || 'System'})`,
              dateCreated: new Date().toISOString(),
              consentObtained: true
          },
          status: 'analysis'
      });
  };

  // Coding
  const handleAddCoding = (coding: Omit<Coding, 'id'>) => {
      const newCoding = { ...coding, id: `c-${Date.now()}`, researcherId: activeResearcherId };
      setCodings([...codings, newCoding]);
  };

  const handleCreateCode = async (name: string, kind: 'code'|'category' = 'code', parentId?: string, description?: string, color?: string): Promise<Code> => {
      const newCode: Code = {
          id: `code-${Date.now()}`,
          name,
          kind,
          parentId,
          color: color || (kind === 'category' ? '#f59e0b' : '#3b82f6'),
          description,
          relatedCodeIds: []
      };
      setCodes(prev => [...prev, newCode]);
      return newCode;
  };

  const handleUpdateCode = (id: string, updates: Partial<Code>) => {
      setCodes(codes.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleDeleteCode = (id: string) => {
      if(confirm("Delete code and all references?")) {
          setCodes(codes.filter(c => c.id !== id));
          setCodings(codings.filter(c => c.codeId !== id));
      }
  };

  const handleCodeDrop = (sourceId: string, targetId: string) => {
      if (sourceId === targetId) return;
      setCodes(codes.map(c => c.id === sourceId ? { ...c, parentId: targetId } : c));
  };

  const handleElaborateOntology = async () => {
      setIsElaborating(true);
      const suggestions = await suggestOntology(codes.filter(c => c.kind === 'code'));
      let newCategoriesCount = 0;
      
      suggestions.forEach(s => {
          // Check if parent category exists
          let parent = codes.find(c => c.name.toLowerCase() === s.parent.toLowerCase() && c.kind === 'category');
          if (!parent) {
              parent = {
                  id: `cat-auto-${Date.now()}-${Math.random()}`,
                  name: s.parent,
                  kind: 'category',
                  color: '#71717a',
                  relatedCodeIds: []
              };
              setCodes(prev => [...prev, parent!]);
              newCategoriesCount++;
          }
          
          // Move children
          s.children.forEach(childName => {
              const childCode = codes.find(c => c.name === childName);
              if (childCode) {
                  setCodes(prev => prev.map(code => code.id === childCode.id ? { ...code, parentId: parent!.id } : code));
              }
          });
      });
      
      setIsElaborating(false);
      addToast("Ontology Elaborated", `Created ${newCategoriesCount} new categories based on coding patterns.`, "success");
  };

  // Memos
  const handleAddMemo = (title: string, content: string, range?: {start: number, end: number}, type: MemoCategory = 'observational' as MemoCategory) => {
      const newMemo: Memo = {
          id: `m-${Date.now()}`,
          title,
          content,
          type,
          relatedIds: selectedArtifactId ? [selectedArtifactId] : [],
          createdAt: new Date().toISOString(),
          number: memos.length + 1,
          authorId: activeResearcherId,
          segment: range ? { ...range, text: title } : undefined
      };
      setMemos([...memos, newMemo]);
  };

  const handleUpdateMemo = (id: string, updates: Partial<Memo>) => {
      setMemos(memos.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const handleDeleteMemo = (id: string) => {
      setMemos(memos.filter(m => m.id !== id));
  };

  // Settings
  const handleSaveSettings = (newSettings: ProjectSettings, newTeam?: ResearchTeam, newMemos?: Memo[]) => {
      setSettings(newSettings);
      if (newTeam) setTeam(newTeam);
      if (newMemos) setMemos(newMemos);
      addToast("Settings Saved");
  };

  // Journal
  const handleAddJournalEntry = (content: string) => {
      const entry: JournalEntry = {
          id: `j-${Date.now()}`,
          timestamp: new Date().toISOString(),
          content,
          type: 'manual',
          authorId: activeResearcherId
      };
      setJournal([...journal, entry]);
  };

  // Compute active artifact for Coding View
  const activeArtifact = artifacts.find(a => a.id === selectedArtifactId);

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
        {/* Navigation Sidebar */}
        <div className="w-16 flex flex-col items-center py-4 border-r border-zinc-800 bg-zinc-950 z-20">
            <div className="mb-6 p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-900/20">
                <Network size={20} className="text-white" />
            </div>
            
            <nav className="flex-1 flex flex-col gap-4 w-full px-2">
                <NavIcon icon={Database} label="Curation" active={activeTab === 'curation'} onClick={() => setActiveTab('curation')} />
                <NavIcon icon={Tags} label="Coding" active={activeTab === 'coding'} onClick={() => setActiveTab('coding')} />
                <NavIcon icon={Layout} label="Theory" active={activeTab === 'theory'} onClick={() => setActiveTab('theory')} />
                <NavIcon icon={BarChart3} label="Visualize" active={activeTab === 'visualize'} onClick={() => setActiveTab('visualize')} />
                <NavIcon icon={FileText} label="Report" active={activeTab === 'report'} onClick={() => setActiveTab('report')} />
            </nav>

            <div className="mt-auto flex flex-col gap-4 w-full px-2">
                <NavIcon icon={BookMarked} label="Journal" active={isJournalOpen} onClick={() => setIsJournalOpen(true)} />
                <NavIcon icon={Settings} label="Settings" active={isSettingsOpen} onClick={() => setIsSettingsOpen(true)} />
                <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 cursor-pointer hover:border-zinc-500 transition-colors" title={`User: ${activeResearcherId}`}>
                    <UserCircle size={18} className="text-zinc-400" />
                </div>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            
            {/* CURATION TAB */}
            {activeTab === 'curation' && (
                <CurationWorkflow 
                    artifacts={artifacts}
                    participants={settings.participants}
                    researchers={team.researchers}
                    onCreateArtifact={handleCreateArtifact}
                    onUpdateArtifact={handleUpdateArtifact}
                    onDeleteArtifact={handleDeleteArtifact}
                />
            )}

            {/* CODING TAB */}
            {activeTab === 'coding' && (
                <div className="flex h-full">
                    {/* Left Panel: Ontology & Navigation */}
                    <div className="w-80 flex flex-col border-r border-zinc-800 bg-zinc-900/50">
                        <OntologyManager 
                            codes={codes}
                            codings={codings}
                            onNodeClick={setSelectedCodeId}
                            selectedCodeId={selectedCodeId}
                            onCreateCode={handleCreateCode}
                            onUpdateCode={handleUpdateCode}
                            onDeleteCode={handleDeleteCode}
                            onCodeDrop={handleCodeDrop}
                            onElaborate={handleElaborateOntology}
                            isElaborating={isElaborating}
                        />
                        <div className="h-1/3 border-t border-zinc-800">
                            <MemoDirectory 
                                memos={memos}
                                artifacts={artifacts}
                                onSelectMemo={(m) => {
                                    if (m.relatedIds.length > 0) {
                                        const artId = m.relatedIds.find(id => artifacts.some(a => a.id === id));
                                        if (artId) setSelectedArtifactId(artId);
                                    }
                                }}
                                onDeleteMemo={handleDeleteMemo}
                                onConvertToArtifact={handleConvertToArtifact}
                            />
                        </div>
                    </div>

                    {/* Middle: Artifact View */}
                    <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
                        {activeArtifact ? (
                            <ArtifactView 
                                artifact={activeArtifact}
                                codes={codes}
                                codings={codings}
                                memos={memos}
                                researchTeam={team}
                                activeResearcherId={activeResearcherId}
                                votes={votes}
                                layersVisible={layersVisible}
                                onAddCoding={handleAddCoding}
                                onCreateCode={(name) => handleCreateCode(name)}
                                onAddMemo={handleAddMemo}
                                onUpdateMemo={(id, content) => handleUpdateMemo(id, { content })}
                                onDeleteMemo={handleDeleteMemo}
                                selectedCodeId={selectedCodeId}
                                onClearSelection={() => setSelectedCodeId(null)}
                                onUpdateArtifact={handleUpdateArtifact}
                                onVote={(critId, status) => {
                                    const newVote: Vote = { id: `v-${Date.now()}`, artifactId: activeArtifact.id, criterionId: critId, researcherId: activeResearcherId, status, timestamp: new Date().toISOString() };
                                    setVotes(prev => [...prev.filter(v => !(v.artifactId === activeArtifact.id && v.criterionId === critId && v.researcherId === activeResearcherId)), newVote]);
                                }}
                                participants={settings.participants}
                            />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-4">
                                <FileText size={48} className="opacity-20" />
                                <p>Select an artifact to start coding</p>
                            </div>
                        )}
                    </div>

                    {/* Right: Artifact Selector & Layer Control */}
                    <div className="w-64 border-l border-zinc-800 bg-zinc-950 flex flex-col">
                        <div className="p-4 border-b border-zinc-800 font-bold text-xs uppercase text-zinc-500 tracking-wider">
                            Source Documents
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {artifacts.map(art => (
                                <div 
                                    key={art.id} 
                                    onClick={() => setSelectedArtifactId(art.id)}
                                    className={cn(
                                        "p-3 border-b border-zinc-800/50 cursor-pointer hover:bg-zinc-900 transition-colors",
                                        selectedArtifactId === art.id ? "bg-zinc-900 border-l-2 border-l-blue-500" : "border-l-2 border-l-transparent"
                                    )}
                                >
                                    <div className="text-sm font-medium text-zinc-300 truncate">{art.name}</div>
                                    <div className="text-[10px] text-zinc-500 flex justify-between mt-1">
                                        <span>{art.media}</span>
                                        <span>{codings.filter(c => c.artifactId === art.id).length} codes</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <LayerControl 
                            layers={[
                                { id: LayerType.OPEN_CODING, label: "Open Codes", visible: layersVisible[LayerType.OPEN_CODING], color: "#3b82f6" },
                                { id: LayerType.CATEGORIES, label: "Categories", visible: layersVisible[LayerType.CATEGORIES], color: "#f59e0b" },
                                { id: LayerType.THEORY_MEMOS, label: "Annotations", visible: layersVisible[LayerType.THEORY_MEMOS], color: "#10b981" },
                                { id: LayerType.AXIAL_CONNECTIONS, label: "Axial Links", visible: layersVisible[LayerType.AXIAL_CONNECTIONS], color: "#8b5cf6" },
                            ]}
                            toggleLayer={(id) => setLayersVisible(prev => ({ ...prev, [id]: !prev[id] }))}
                        />
                    </div>
                </div>
            )}

            {/* THEORY TAB */}
            {activeTab === 'theory' && (
                <TheoryBuilder 
                    codes={codes}
                    codings={codings}
                    artifacts={artifacts}
                    memos={memos}
                    researchQuestions={settings.theoreticalFramework.researchQuestions}
                    onSetCoreCategory={(id) => {
                        setCodes(codes.map(c => c.id === id ? { ...c, isCore: true } : { ...c, isCore: false }));
                    }}
                    onAddMemo={(t, c) => handleAddMemo(t, c, undefined, 'theoretical' as MemoCategory)}
                    onAddFinding={(t, c, r) => {
                        const m: Memo = { id: `f-${Date.now()}`, title: t, content: c, type: 'finding', relatedIds: r || [], createdAt: new Date().toISOString(), number: memos.length + 1, authorId: activeResearcherId };
                        setMemos([...memos, m]);
                    }}
                    onUpdateMemo={handleUpdateMemo}
                    onDeleteMemo={handleDeleteMemo}
                    onCreateCode={(n, k) => handleCreateCode(n, k)}
                    onUpdateCode={handleUpdateCode}
                    theoryArtefact={{ id: 'theory', type: settings.theoryType, content: "", categoryIds: [] }}
                    settings={settings}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onConvertToArtifact={handleConvertToArtifact}
                />
            )}

            {/* VISUALIZE TAB */}
            {activeTab === 'visualize' && (
                <Visualizations 
                    codes={codes}
                    codings={codings}
                    artifacts={artifacts}
                    settings={settings}
                    memos={memos}
                    team={team}
                />
            )}

            {/* REPORT TAB */}
            {activeTab === 'report' && (
                <ReportView 
                    settings={settings}
                    memos={memos}
                    codes={codes}
                    artifacts={artifacts}
                    onUpdateSettings={setSettings}
                    onConvertToArtifact={handleConvertToArtifact}
                />
            )}

        </div>

        {/* Dialogs & Overlays */}
        <SettingsDialog 
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            team={team}
            memos={memos}
            codes={codes}
            codings={codings}
            artifacts={artifacts}
            activeResearcherId={activeResearcherId}
            onSave={handleSaveSettings}
            onImportProject={handleImportProject}
            onConvertToArtifact={handleConvertToArtifact}
        />

        <ReflexivityJournal 
            entries={journal}
            onAddEntry={handleAddJournalEntry}
            isOpen={isJournalOpen}
            onClose={() => setIsJournalOpen(false)}
        />

        <Toaster toasts={toasts} onDismiss={(id) => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}

const NavIcon = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className={cn(
            "w-full flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 group",
            active ? "bg-zinc-800 text-blue-400" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
        )}
        title={label}
    >
        <Icon size={20} strokeWidth={active ? 2.5 : 2} className={cn("mb-1 transition-transform group-hover:scale-110", active && "scale-110")} />
        <span className="text-[9px] font-medium tracking-wide">{label}</span>
    </button>
);
