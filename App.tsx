import React, { useState } from 'react';
import { ReflexivityJournal } from './components/ReflexivityJournal';
import { SettingsDialog } from './components/SettingsDialog';
import { 
    JournalEntry, 
    ProjectSettings, 
    ResearchTeam, 
    Code, 
    Coding, 
    Artifact, 
    Memo,
    Theory
} from './types';
import { TheoryBuilder } from './components/TheoryBuilder';
import { ArtifactView } from './components/ArtifactView';
import { CurationWorkflow } from './components/CurationWorkflow';
import { LayerControl } from './components/LayerControl';
import { LayerType } from './types';
import { InternalOntologyMapper } from './components/InternalOntologyMapper';
import { OntologyManager } from './components/OntologyManager';
import { ReportView } from './components/ReportView';
import { Visualizations } from './components/Visualizations';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import { Toaster, ToastProps } from './components/ui/toast';
import { 
    Layers, 
    Database, 
    Network, 
    BarChart3, 
    FileText, 
    Settings,
    GitMerge,
    FolderTree
} from 'lucide-react';
import { Button } from './components/ui/button';

export default function App() {
    // --- State ---
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
    const [isJournalOpen, setIsJournalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    // Project Data
    const [settings, setSettings] = useState<ProjectSettings>({
        projectName: 'Untitled Project',
        userName: 'Researcher',
        themeMode: 'dark',
        stripeWidth: 4,
        aiModel: 'gemini-3-flash-preview',
        stopWords: [],
        theoryType: 'constructivist',
        fieldOfStudy: { subjectOfStudy: '', objectOfStudy: '', location: '' },
        theoreticalFramework: { researchQuestions: [], methods: [], tools: [], bibliographyContent: '' },
        participants: [],
        structuredAbstract: {
            background: '',
            methods: '',
            results: '',
            conclusion: '',
            keywords: '',
            artifactMapping: { background: [], methods: [], results: [], conclusion: [] }
        }
    });

    const [team, setTeam] = useState<ResearchTeam>({ id: 'default', researchers: [], consensusCriteria: [] });
    const [codes, setCodes] = useState<Code[]>([]);
    const [codings, setCodings] = useState<Coding[]>([]);
    const [artifacts, setArtifacts] = useState<Artifact[]>([]);
    const [memos, setMemos] = useState<Memo[]>([]);
    const [toasts, setToasts] = useState<ToastProps[]>([]);

    // Navigation
    const [activeTab, setActiveTab] = useState('curation');
    const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
    const [layersVisible, setLayersVisible] = useState<Record<LayerType, boolean>>({
        [LayerType.ARTIFACT]: true,
        [LayerType.OPEN_CODING]: true,
        [LayerType.CATEGORIES]: true,
        [LayerType.AXIAL_CONNECTIONS]: false,
        [LayerType.THEORY_MEMOS]: true
    });

    // --- Helpers ---
    const addJournalEntry = (content: string) => {
        setJournalEntries(prev => [{
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            content,
            type: 'manual'
        }, ...prev]);
    };

    const handleConvertToArtifact = (title: string, content: string, typeSource: string, sourceId?: string) => {
        const newArtifact: Artifact = {
            id: `gen-${Date.now()}`,
            hashID: `generated-${Date.now()}`,
            name: title,
            content: content,
            type: 'document',
            media: 'text',
            status: 'analysis',
            access: 'private',
            curation: {
                format: 'Generated',
                source: `Converted from ${typeSource}`,
                dateCreated: new Date().toISOString(),
                consentObtained: true
            }
        };
        setArtifacts(prev => [...prev, newArtifact]);
        addToast("Artifact Created", `Converted ${typeSource} to new artifact.`, "success");
    };

    const addToast = (title: string, description?: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, title, description, type, onDismiss: dismissToast }]);
    };

    const dismissToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    // --- Render ---
    return (
        <div className="h-screen w-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden font-sans">
            
            {/* Top Navigation */}
            <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950 shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <span className="font-bold tracking-tight text-zinc-100">Stratum</span>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                        <TabsList className="bg-transparent border-none p-0 h-full">
                            <TabsTrigger value="curation" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-4 text-xs gap-2">
                                <Database size={14} /> Data Curation
                            </TabsTrigger>
                            <TabsTrigger value="coding" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-4 text-xs gap-2">
                                <Layers size={14} /> Coding & Analysis
                            </TabsTrigger>
                            <TabsTrigger value="ontology" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-4 text-xs gap-2">
                                <FolderTree size={14} /> Ontology
                            </TabsTrigger>
                            <TabsTrigger value="theory" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-4 text-xs gap-2">
                                <Network size={14} /> Theory Building
                            </TabsTrigger>
                            <TabsTrigger value="visuals" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-4 text-xs gap-2">
                                <BarChart3 size={14} /> Visuals
                            </TabsTrigger>
                            <TabsTrigger value="report" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-4 text-xs gap-2">
                                <FileText size={14} /> Report
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsJournalOpen(true)} className="text-zinc-400 hover:text-white">
                        <GitMerge size={16} className="mr-2"/> Journal
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)} className="text-zinc-400 hover:text-white">
                        <Settings size={16} />
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'curation' && (
                    <CurationWorkflow 
                        artifacts={artifacts}
                        participants={settings.participants}
                        researchers={team.researchers}
                        onCreateArtifact={(a) => setArtifacts(prev => [...prev, { ...a, id: Date.now().toString(), hashID: Math.random().toString(), curation: a?.curation || { format: '', source: '', dateCreated: '', consentObtained: false } } as Artifact])}
                        onUpdateArtifact={(id, updates) => setArtifacts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a))}
                        onDeleteArtifact={(id) => setArtifacts(prev => prev.filter(a => a.id !== id))}
                    />
                )}

                {activeTab === 'coding' && (
                    <div className="flex h-full">
                        <LayerControl 
                            layers={[
                                { id: LayerType.ARTIFACT, label: 'Artifact Content', visible: layersVisible[LayerType.ARTIFACT], color: '#fff' },
                                { id: LayerType.OPEN_CODING, label: 'Open Coding', visible: layersVisible[LayerType.OPEN_CODING], color: '#3b82f6' },
                                { id: LayerType.CATEGORIES, label: 'Categories', visible: layersVisible[LayerType.CATEGORIES], color: '#f59e0b' },
                                { id: LayerType.THEORY_MEMOS, label: 'Memos', visible: layersVisible[LayerType.THEORY_MEMOS], color: '#8b5cf6' }
                            ]} 
                            toggleLayer={(id) => setLayersVisible(prev => ({ ...prev, [id]: !prev[id] }))} 
                        />
                        <div className="flex-1 bg-zinc-900 overflow-hidden border-l border-zinc-800">
                            {selectedArtifactId ? (
                                <ArtifactView 
                                    artifact={artifacts.find(a => a.id === selectedArtifactId)!}
                                    codes={codes}
                                    codings={codings}
                                    memos={memos}
                                    researchTeam={team}
                                    layersVisible={layersVisible}
                                    onAddCoding={(c) => setCodings(prev => [...prev, { ...c, id: Date.now().toString() }])}
                                    onCreateCode={async (name) => {
                                        const newCode = { id: Date.now().toString(), name, color: '#3b82f6', kind: 'code' as const, relatedCodeIds: [] };
                                        setCodes(prev => [...prev, newCode]);
                                        return newCode;
                                    }}
                                    onAddMemo={(text, content, range, type) => setMemos(prev => [...prev, {
                                        id: Date.now().toString(),
                                        title: text.substring(0, 20),
                                        content,
                                        type: type || 'descriptive',
                                        relatedIds: [selectedArtifactId],
                                        createdAt: new Date().toISOString(),
                                        number: prev.length + 1,
                                        segment: range ? { ...range, text } : undefined
                                    }])}
                                    onUpdateArtifact={(id, updates) => setArtifacts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a))}
                                />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                                    <Database size={48} className="mb-4 opacity-20" />
                                    <p>Select an artifact from Data Curation tab or create one to start coding.</p>
                                    <div className="mt-4 flex gap-2">
                                        {artifacts.slice(0, 3).map(a => (
                                            <Button key={a.id} variant="outline" onClick={() => setSelectedArtifactId(a.id)}>
                                                Open {a.name}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'ontology' && (
                    <OntologyManager 
                        codes={codes}
                        codings={codings}
                        onNodeClick={() => {}}
                        onCreateCode={async (name, kind, parentId, desc, color) => {
                            const newCode: Code = { 
                                id: Date.now().toString(), 
                                name, 
                                kind: kind || 'code', 
                                parentId, 
                                description: desc, 
                                color: color || '#3b82f6',
                                relatedCodeIds: [] 
                            };
                            setCodes(prev => [...prev, newCode]);
                            return newCode;
                        }}
                        onUpdateCode={(id, updates) => setCodes(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))}
                        onDeleteCode={(id) => setCodes(prev => prev.filter(c => c.id !== id))}
                        onCodeDrop={(src, target) => {
                            setCodes(prev => prev.map(c => c.id === src ? { ...c, parentId: target } : c));
                        }}
                        onElaborate={() => addToast("AI Elaboration", "Feature pending implementation", "info")}
                        isElaborating={false}
                    />
                )}

                {activeTab === 'theory' && (
                    <TheoryBuilder 
                        codes={codes}
                        codings={codings}
                        artifacts={artifacts}
                        memos={memos}
                        researchQuestions={settings.theoreticalFramework.researchQuestions}
                        onSetCoreCategory={(id) => setCodes(prev => prev.map(c => ({ ...c, isCore: c.id === id })))}
                        onAddMemo={(title, content) => setMemos(prev => [...prev, {
                            id: Date.now().toString(),
                            title, content, type: 'theoretical', relatedIds: [], createdAt: new Date().toISOString(), number: prev.length + 1
                        }])}
                        onAddFinding={(title, content, relatedIds) => setMemos(prev => [...prev, {
                            id: Date.now().toString(),
                            title, content, type: 'finding', relatedIds: relatedIds || [], createdAt: new Date().toISOString(), number: prev.length + 1
                        }])}
                        onUpdateMemo={(id, updates) => setMemos(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m))}
                        onDeleteMemo={(id) => setMemos(prev => prev.filter(m => m.id !== id))}
                        onCreateCode={(name, kind) => setCodes(prev => [...prev, { id: Date.now().toString(), name, kind, color: '#f59e0b', relatedCodeIds: [] }])}
                        onUpdateCode={(id, updates) => setCodes(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))}
                        theoryArtefact={{ id: 'theory', type: settings.theoryType, content: '', categoryIds: [] }}
                        settings={settings}
                        onOpenSettings={() => setIsSettingsOpen(true)}
                        onConvertToArtifact={handleConvertToArtifact}
                    />
                )}

                {activeTab === 'visuals' && (
                    <Visualizations 
                        codes={codes}
                        codings={codings}
                        artifacts={artifacts}
                        settings={settings}
                        memos={memos}
                    />
                )}

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

            {/* Overlays */}
            <ReflexivityJournal 
                entries={journalEntries}
                onAddEntry={addJournalEntry}
                isOpen={isJournalOpen}
                onClose={() => setIsJournalOpen(false)}
                onConvertToArtifact={handleConvertToArtifact}
            />

            <SettingsDialog 
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                team={team}
                codes={codes}
                codings={codings}
                artifacts={artifacts}
                memos={memos}
                onSave={(newSettings, newTeam, newMemos) => {
                    setSettings(newSettings);
                    if (newTeam) setTeam(newTeam);
                    if (newMemos) setMemos(newMemos);
                }}
                onImportProject={(data) => {
                    if (data.settings) setSettings(data.settings);
                    if (data.team) setTeam(data.team);
                    if (data.codes) setCodes(data.codes);
                    if (data.artifacts) setArtifacts(data.artifacts);
                    if (data.memos) setMemos(data.memos);
                    if (data.codings) setCodings(data.codings);
                    addToast("Project Imported", "Data loaded successfully", "success");
                }}
                onConvertToArtifact={handleConvertToArtifact}
            />

            <Toaster toasts={toasts} onDismiss={dismissToast} />
        </div>
    );
}