
import React, { useState, useRef } from 'react';
import { ProjectSettings, ResearchTeam, Researcher, ConsensusCriteria, Participant, ResearchQuestion, Method, Tool, Memo, Code, Coding, Artifact } from '../types';
import { downloadBibFile } from '../lib/bibUtils';
import { exportProjectToOwl, parseOwlToProject } from '../lib/owlUtils';
import { generateRoCrate } from '../lib/roCrateUtils';
import { exportProjectToRefiQda, parseRefiQdaToProject } from '../lib/refiQdaUtils';
import { 
  Settings, 
  User, 
  Monitor, 
  Cpu, 
  Type, 
  Palette, 
  Save, 
  X, 
  Database,
  LayoutTemplate,
  ScrollText,
  Users,
  GraduationCap,
  ShieldCheck,
  Plus,
  Trash2,
  Check,
  FileQuestion,
  Wrench,
  Book,
  Microscope,
  PersonStanding,
  Upload,
  Download,
  Lightbulb,
  FileText,
  AlignLeft,
  Tag,
  Archive,
  Package,
  HardDrive,
  ArrowRightLeft
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ProjectSettings;
  team?: ResearchTeam;
  memos?: Memo[];
  codes: Code[];
  codings: Coding[];
  artifacts: Artifact[];
  activeResearcherId?: string;
  onSave: (settings: ProjectSettings, team?: ResearchTeam, memos?: Memo[]) => void;
  onImportProject: (data: any) => void;
  onConvertToArtifact?: (title: string, content: string, typeSource: string, sourceId?: string) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  team,
  memos = [],
  codes,
  codings,
  artifacts,
  activeResearcherId,
  onSave,
  onImportProject,
  onConvertToArtifact
}) => {
  const [localSettings, setLocalSettings] = useState<ProjectSettings>(settings);
  const [localTeam, setLocalTeam] = useState<ResearchTeam>(team || { id: 'default', researchers: [], consensusCriteria: [] });
  const [localMemos, setLocalMemos] = useState<Memo[]>(memos);
  const [activeTab, setActiveTab] = useState('general');
  const bibFileInputRef = useRef<HTMLInputElement>(null);
  const owlFileInputRef = useRef<HTMLInputElement>(null);
  const refiFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings, localTeam, localMemos);
    onClose();
  };

  const handleExportOwl = () => {
      const owlData = exportProjectToOwl({
          settings: localSettings,
          team: localTeam,
          memos: localMemos,
          codes,
          codings,
          artifacts
      });
      const blob = new Blob([owlData], { type: 'application/rdf+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${localSettings.projectName.replace(/\s+/g, '_')}_full_project.owl`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleExportRoCrate = async () => {
      try {
          const blob = await generateRoCrate(
              localSettings,
              artifacts,
              codes,
              codings,
              localMemos,
              localTeam,
              localSettings.participants
          );
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${localSettings.projectName.replace(/\s+/g, '_')}_ro_crate.zip`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
      } catch (error) {
          console.error("Failed to generate RO-Crate", error);
          alert("Error generating RO-Crate. See console.");
      }
  };

  const handleExportRefi = async () => {
      try {
          const blob = await exportProjectToRefiQda({
              settings: localSettings,
              team: localTeam,
              memos: localMemos,
              codes,
              codings,
              artifacts
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${localSettings.projectName.replace(/\s+/g, '_')}_refi.qdpx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
      } catch (error) {
          console.error("Failed to generate REFI-QDA", error);
          alert("Error generating QDPX file.");
      }
  };

  const handleImportRefi = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
          const importedProject = await parseRefiQdaToProject(file);
          if (confirm("This will overwrite current project data with the REFI-QDA import. Continue?")) {
              onImportProject(importedProject);
              onClose();
          }
      } catch (err) {
          console.error(err);
          alert("Failed to parse QDPX file.");
      }
      if (refiFileInputRef.current) refiFileInputRef.current.value = '';
  };

  const handleImportOwl = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
          const text = await file.text();
          const importedProject = parseOwlToProject(text);
          if (confirm("This will overwrite all current project data. Continue?")) {
              onImportProject(importedProject);
              onClose();
          }
      } catch (err) {
          console.error(err);
          alert("Failed to parse OWL file.");
      }
      if (owlFileInputRef.current) owlFileInputRef.current.value = '';
  };

  // --- Helpers for updating nested state ---

  const updateFieldOfStudy = (updates: Partial<typeof localSettings.fieldOfStudy>) => {
      setLocalSettings(prev => ({ ...prev, fieldOfStudy: { ...prev.fieldOfStudy, ...updates } }));
  };

  const addParticipant = () => {
      const newP: Participant = { id: `p-${Date.now()}`, anonymizedCode: 'P-XXX', description: 'New Participant', isCoConstructor: false };
      setLocalSettings(prev => ({ ...prev, participants: [...prev.participants, newP] }));
  };

  const updateParticipant = (id: string, updates: Partial<Participant>) => {
      setLocalSettings(prev => ({
          ...prev,
          participants: prev.participants.map(p => p.id === id ? { ...p, ...updates } : p)
      }));
  };

  const removeParticipant = (id: string) => {
      setLocalSettings(prev => ({ ...prev, participants: prev.participants.filter(p => p.id !== id) }));
  };

  const addRQ = () => {
      const newRQ: ResearchQuestion = { id: `rq-${Date.now()}`, content: 'New Research Question?' };
      setLocalSettings(prev => ({ 
          ...prev, 
          theoreticalFramework: { ...prev.theoreticalFramework, researchQuestions: [...prev.theoreticalFramework.researchQuestions, newRQ] }
      }));
  };

  const updateRQ = (id: string, content: string) => {
      setLocalSettings(prev => ({
          ...prev,
          theoreticalFramework: { 
              ...prev.theoreticalFramework, 
              researchQuestions: prev.theoreticalFramework.researchQuestions.map(r => r.id === id ? { ...r, content } : r)
          }
      }));
  };

  const removeRQ = (id: string) => {
      setLocalSettings(prev => ({
          ...prev,
          theoreticalFramework: { ...prev.theoreticalFramework, researchQuestions: prev.theoreticalFramework.researchQuestions.filter(r => r.id !== id) }
      }));
  };

   const addMethod = () => {
      const newMethod: Method = { 
          id: `m-${Date.now()}`, 
          type: 'interview', 
          protocolContent: 'Standard Protocol...',
          participantIds: [] 
      };
      setLocalSettings(prev => ({ 
          ...prev, 
          theoreticalFramework: { ...prev.theoreticalFramework, methods: [...prev.theoreticalFramework.methods, newMethod] }
      }));
  };

  const updateMethod = (id: string, updates: Partial<Method>) => {
      setLocalSettings(prev => ({
          ...prev,
          theoreticalFramework: { 
              ...prev.theoreticalFramework, 
              methods: prev.theoreticalFramework.methods.map(m => m.id === id ? { ...m, ...updates } : m)
          }
      }));
  };

  const toggleMethodParticipant = (methodId: string, participantId: string) => {
      setLocalSettings(prev => {
          const methods = prev.theoreticalFramework.methods.map(m => {
              if (m.id !== methodId) return m;
              const currentIds = m.participantIds || [];
              const newIds = currentIds.includes(participantId)
                  ? currentIds.filter(id => id !== participantId)
                  : [...currentIds, participantId];
              return { ...m, participantIds: newIds };
          });
          return { ...prev, theoreticalFramework: { ...prev.theoreticalFramework, methods } };
      });
  };

  const removeMethod = (id: string) => {
      setLocalSettings(prev => ({
          ...prev,
          theoreticalFramework: { ...prev.theoreticalFramework, methods: prev.theoreticalFramework.methods.filter(m => m.id !== id) }
      }));
  };

  const addTool = () => {
      const newTool: Tool = { id: `t-${Date.now()}`, name: 'New Tool', version: '1.0' };
      setLocalSettings(prev => ({ 
          ...prev, 
          theoreticalFramework: { ...prev.theoreticalFramework, tools: [...prev.theoreticalFramework.tools, newTool] }
      }));
  };

  const updateTool = (id: string, updates: Partial<Tool>) => {
      setLocalSettings(prev => ({
          ...prev,
          theoreticalFramework: { 
              ...prev.theoreticalFramework, 
              tools: prev.theoreticalFramework.tools.map(t => t.id === id ? { ...t, ...updates } : t)
          }
      }));
  };

  const removeTool = (id: string) => {
       setLocalSettings(prev => ({
          ...prev,
          theoreticalFramework: { ...prev.theoreticalFramework, tools: prev.theoreticalFramework.tools.filter(t => t.id !== id) }
      }));
  };

  const handleBibImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
          const text = await file.text();
          setLocalSettings(prev => ({
              ...prev,
              theoreticalFramework: {
                  ...prev.theoreticalFramework,
                  bibliographyContent: text 
              }
          }));
      } catch (err) {
          console.error("Failed to read .bib file", err);
          alert("Error reading file");
      }
      
      if (bibFileInputRef.current) bibFileInputRef.current.value = '';
  };

  const handleBibExport = () => {
      downloadBibFile(localSettings.theoreticalFramework.bibliographyContent, `${localSettings.projectName.replace(/\s+/g, '_')}_refs`);
  };

  // --- Team Management Handlers ---
  const addResearcher = () => {
    const newResearcher: Researcher = {
        id: `r-${Date.now()}`,
        name: 'New Researcher',
        role: 'Junior',
        color: '#94a3b8',
        initials: 'NR'
    };
    setLocalTeam(prev => ({ ...prev, researchers: [...prev.researchers, newResearcher] }));
  };

  const updateResearcher = (id: string, updates: Partial<Researcher>) => {
    setLocalTeam(prev => ({
        ...prev,
        researchers: prev.researchers.map(r => r.id === id ? { ...r, ...updates } : r)
    }));
  };

  const removeResearcher = (id: string) => {
    setLocalTeam(prev => ({
        ...prev,
        researchers: prev.researchers.filter(r => r.id !== id)
    }));
  };

  const addCriteria = () => {
      const newCrit: ConsensusCriteria = {
          id: `cc-${Date.now()}`,
          name: 'New Criteria',
          description: '',
          votingType: 'consensus',
          active: true
      };
      setLocalTeam(prev => ({ ...prev, consensusCriteria: [...prev.consensusCriteria, newCrit] }));
  };
  
  const updateCriteria = (id: string, updates: Partial<ConsensusCriteria>) => {
      setLocalTeam(prev => ({
          ...prev,
          consensusCriteria: prev.consensusCriteria.map(c => c.id === id ? { ...c, ...updates } : c)
      }));
  };

  const removeCriteria = (id: string) => {
    setLocalTeam(prev => ({
        ...prev,
        consensusCriteria: prev.consensusCriteria.filter(c => c.id !== id)
    }));
  };

  // --- Findings Handlers ---
  const addFinding = () => {
      const newFinding: Memo = {
          id: `finding-${Date.now()}`,
          title: 'New Finding',
          content: 'Description of the finding...',
          type: 'finding',
          relatedIds: [],
          createdAt: new Date().toISOString(),
          number: localMemos.length + 1,
          authorId: activeResearcherId
      };
      setLocalMemos(prev => [...prev, newFinding]);
  };

  const updateFinding = (id: string, updates: Partial<Memo>) => {
      setLocalMemos(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const removeFinding = (id: string) => {
      setLocalMemos(prev => prev.filter(m => m.id !== id));
  };

  // --- Abstract Handlers ---
  const updateAbstract = (field: keyof typeof localSettings.structuredAbstract, value: string) => {
      setLocalSettings(prev => ({
          ...prev,
          structuredAbstract: {
              ...prev.structuredAbstract,
              [field]: value
          }
      }));
  };

  const findings = localMemos.filter(m => m.type === 'finding');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <input 
        type="file" 
        ref={bibFileInputRef} 
        onChange={handleBibImport} 
        accept=".bib,.txt" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={owlFileInputRef} 
        onChange={handleImportOwl} 
        accept=".owl,.xml,.rdf" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={refiFileInputRef} 
        onChange={handleImportRefi} 
        accept=".qdpx,.zip" 
        className="hidden" 
      />
      
      <div className="w-[900px] h-[700px] bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
               <Settings size={20} className="text-zinc-400" />
            </div>
            <div>
               <h2 className="text-lg font-semibold text-zinc-100">Project Configuration</h2>
               <p className="text-xs text-zinc-500">Global settings and theoretical framework.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-56 bg-zinc-900/50 border-r border-zinc-800 p-4 flex flex-col gap-1 overflow-y-auto">
                <NavButton 
                    active={activeTab === 'general'} 
                    onClick={() => setActiveTab('general')} 
                    icon={LayoutTemplate} 
                    label="General" 
                />
                <NavButton 
                    active={activeTab === 'data'} 
                    onClick={() => setActiveTab('data')} 
                    icon={Archive} 
                    label="Data Management" 
                />
                 <NavButton 
                    active={activeTab === 'team'} 
                    onClick={() => setActiveTab('team')} 
                    icon={Users} 
                    label="Team & Roles" 
                />
                
                <div className="h-px bg-zinc-800 my-2 mx-2" />
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-zinc-600">Ontology</div>
                
                <NavButton 
                    active={activeTab === 'research_questions'} 
                    onClick={() => setActiveTab('research_questions')} 
                    icon={FileQuestion} 
                    label="Research Questions" 
                />
                <NavButton 
                    active={activeTab === 'participants'} 
                    onClick={() => setActiveTab('participants')} 
                    icon={PersonStanding} 
                    label="Participants (Actors)" 
                />
                 <NavButton 
                    active={activeTab === 'methodology'} 
                    onClick={() => setActiveTab('methodology')} 
                    icon={Microscope} 
                    label="Methodology" 
                />
                <NavButton 
                    active={activeTab === 'theory'} 
                    onClick={() => setActiveTab('theory')} 
                    icon={ScrollText} 
                    label="Theory Approach" 
                />
                <NavButton 
                    active={activeTab === 'tools'} 
                    onClick={() => setActiveTab('tools')} 
                    icon={Wrench} 
                    label="Research Tools" 
                />
                <NavButton 
                    active={activeTab === 'bibliography'} 
                    onClick={() => setActiveTab('bibliography')} 
                    icon={Book} 
                    label="Bibliography" 
                />
                <NavButton 
                    active={activeTab === 'findings'} 
                    onClick={() => setActiveTab('findings')} 
                    icon={Lightbulb} 
                    label="Emergent Findings" 
                />

                <div className="h-px bg-zinc-800 my-2 mx-2" />
                
                <NavButton 
                    active={activeTab === 'abstract'} 
                    onClick={() => setActiveTab('abstract')} 
                    icon={FileText} 
                    label="Structured Abstract" 
                />
                <NavButton 
                    active={activeTab === 'analysis'} 
                    onClick={() => setActiveTab('analysis')} 
                    icon={Cpu} 
                    label="AI & Analysis" 
                />
                <NavButton 
                    active={activeTab === 'visuals'} 
                    onClick={() => setActiveTab('visuals')} 
                    icon={Palette} 
                    label="Visualization" 
                />
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-zinc-950 p-8 overflow-y-auto">
                
                {activeTab === 'general' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-start">
                            <SectionHeader title="Project Metadata" description="Core information about this research project." />
                            {onConvertToArtifact && (
                                <Button 
                                    size="xs" 
                                    variant="outline" 
                                    onClick={() => {
                                        const content = `# Project Definition: ${localSettings.projectName}\n\n**Description**\nStudy of ${localSettings.fieldOfStudy.subjectOfStudy} focusing on ${localSettings.fieldOfStudy.objectOfStudy} in ${localSettings.fieldOfStudy.location}.`;
                                        onConvertToArtifact('Project Definition', content, 'Metadata');
                                    }}
                                    className="gap-2 text-zinc-400 hover:text-white"
                                >
                                    <FileText size={14}/> Save as Artifact
                                </Button>
                            )}
                        </div>
                        
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-zinc-300">Project Title</label>
                                <Input 
                                    value={localSettings.projectName}
                                    onChange={(e) => setLocalSettings({...localSettings, projectName: e.target.value})}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-zinc-300">Description</label>
                                <Textarea className="h-20" placeholder="Research abstract..." />
                            </div>
                        </div>

                        <div className="h-px bg-zinc-800 my-4" />

                        <SectionHeader title="Field of Study" description="Define the subject, object, and location." />
                        <div className="grid gap-4 bg-zinc-900/30 p-4 rounded border border-zinc-800">
                             <div className="grid gap-2">
                                <label className="text-xs font-bold uppercase text-zinc-500">Subject of Study (Actors)</label>
                                <Input 
                                    value={localSettings.fieldOfStudy.subjectOfStudy}
                                    onChange={(e) => updateFieldOfStudy({ subjectOfStudy: e.target.value })}
                                    className="bg-zinc-950"
                                />
                             </div>
                             <div className="grid gap-2">
                                <label className="text-xs font-bold uppercase text-zinc-500">Object of Study (Phenomenon)</label>
                                <Input 
                                    value={localSettings.fieldOfStudy.objectOfStudy}
                                    onChange={(e) => updateFieldOfStudy({ objectOfStudy: e.target.value })}
                                    className="bg-zinc-950"
                                />
                             </div>
                             <div className="grid gap-2">
                                <label className="text-xs font-bold uppercase text-zinc-500">Location</label>
                                <Input 
                                    value={localSettings.fieldOfStudy.location}
                                    onChange={(e) => updateFieldOfStudy({ location: e.target.value })}
                                    className="bg-zinc-950"
                                />
                             </div>
                        </div>
                    </div>
                )}

                {activeTab === 'data' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <SectionHeader title="Data Management" description="Backup, restore, and archive project data." />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg space-y-4">
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2 mb-1">
                                        <Package size={16} className="text-emerald-500" />
                                        Research Object Crate (RO-Crate)
                                    </h4>
                                    <p className="text-xs text-zinc-500">
                                        Generate a standards-compliant archive package containing all artifacts, metadata, and relationships.
                                        Suitable for long-term preservation and publication.
                                    </p>
                                </div>
                                <Button variant="brand" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white gap-2" onClick={handleExportRoCrate}>
                                    <Package size={14}/> Download RO-Crate Package
                                </Button>
                            </div>

                            <div className="col-span-2 p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg space-y-4">
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2 mb-1">
                                        <ArrowRightLeft size={16} className="text-indigo-500" />
                                        REFI-QDA Standard
                                    </h4>
                                    <p className="text-xs text-zinc-500">
                                        Exchange project data with other qualitative analysis software (NVivo, ATLAS.ti, MAXQDA) using the QDPX standard.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Button variant="outline" className="w-full gap-2 border-zinc-700" onClick={handleExportRefi}>
                                        <Download size={14}/> Export QDPX
                                    </Button>
                                    <Button variant="outline" className="w-full gap-2 border-zinc-700" onClick={() => refiFileInputRef.current?.click()}>
                                        <Upload size={14}/> Import QDPX
                                    </Button>
                                </div>
                            </div>

                            <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg space-y-4">
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2 mb-1">
                                        <Download size={16} className="text-blue-500" />
                                        Project Snapshot
                                    </h4>
                                    <p className="text-xs text-zinc-500">
                                        Save the full project state as an RDF/OWL ontology file. 
                                    </p>
                                </div>
                                <Button variant="outline" className="w-full gap-2 border-zinc-700" onClick={handleExportOwl}>
                                    <Download size={14}/> Export .owl
                                </Button>
                            </div>

                            <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg space-y-4">
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2 mb-1">
                                        <Upload size={16} className="text-amber-500" />
                                        Project Restore
                                    </h4>
                                    <p className="text-xs text-zinc-500">
                                        Restore a project from a previously exported OWL file.
                                        <span className="text-red-400 block mt-1">Warning: Overwrites current data.</span>
                                    </p>
                                </div>
                                <Button variant="outline" className="w-full gap-2 border-zinc-700" onClick={() => owlFileInputRef.current?.click()}>
                                    <Upload size={14}/> Import .owl
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'research_questions' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-start">
                            <SectionHeader title="Research Questions" description="The questions guiding the inquiry." />
                            <div className="flex gap-2">
                                {onConvertToArtifact && (
                                    <Button 
                                        size="xs" 
                                        variant="outline" 
                                        onClick={() => {
                                            const content = `# Research Questions\n\n${localSettings.theoreticalFramework.researchQuestions.map(rq => `1. ${rq.content}`).join('\n')}`;
                                            onConvertToArtifact('Research Questions', content, 'Methodology');
                                        }}
                                        className="gap-2 text-zinc-400 hover:text-white"
                                    >
                                        <FileText size={14}/> Save as Artifact
                                    </Button>
                                )}
                                <Button size="xs" variant="brand" onClick={addRQ} className="gap-2"><Plus size={14}/> Add RQ</Button>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            {localSettings.theoreticalFramework.researchQuestions.length === 0 && (
                                <p className="text-zinc-500 text-sm italic border border-dashed border-zinc-800 p-8 text-center rounded-lg">No research questions defined.</p>
                            )}
                            {localSettings.theoreticalFramework.researchQuestions.map(rq => (
                                <div key={rq.id} className="flex gap-3 items-start bg-zinc-900/30 p-3 rounded-lg border border-zinc-800">
                                    <div className="p-2 bg-zinc-900 rounded border border-zinc-800 text-zinc-500 mt-1" title={`ID: ${rq.id}`}>
                                        <FileQuestion size={16} />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="text-[10px] text-zinc-500 font-mono">ID: {rq.id}</div>
                                        <Input 
                                            value={rq.content}
                                            onChange={(e) => updateRQ(rq.id, e.target.value)}
                                            className="bg-zinc-950"
                                            placeholder="Enter research question content..."
                                        />
                                    </div>
                                    <Button size="icon" variant="ghost" onClick={() => removeRQ(rq.id)} className="text-zinc-600 hover:text-red-500 mt-1">
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'participants' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-start">
                             <SectionHeader title="Participants (Actors)" description="Individuals involved in the research. Assign anonymized codes." />
                             <div className="flex gap-2">
                                {onConvertToArtifact && (
                                    <Button 
                                        size="xs" 
                                        variant="outline" 
                                        onClick={() => {
                                            const content = `# Participant Registry\n\n| Code | Description | Role |\n|---|---|---|\n${localSettings.participants.map(p => `| ${p.anonymizedCode} | ${p.description} | ${p.isCoConstructor ? 'Co-Constructor' : 'Participant'} |`).join('\n')}`;
                                            onConvertToArtifact('Participant Registry', content, 'Participants');
                                        }}
                                        className="gap-2 text-zinc-400 hover:text-white"
                                    >
                                        <FileText size={14}/> Save as Artifact
                                    </Button>
                                )}
                                <Button size="xs" variant="brand" onClick={addParticipant} className="gap-2"><Plus size={14}/> Add Actor</Button>
                             </div>
                        </div>
                        
                        <div className="space-y-3">
                            {localSettings.participants.map(p => (
                                <div key={p.id} className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg flex gap-3 items-start group">
                                     <div className="w-10 h-10 rounded bg-blue-900/20 text-blue-400 flex items-center justify-center shrink-0">
                                         <User size={18} />
                                     </div>
                                     <div className="flex-1 space-y-2">
                                         <div className="flex gap-2">
                                             <Input 
                                                 value={p.anonymizedCode}
                                                 onChange={(e) => updateParticipant(p.id, { anonymizedCode: e.target.value })}
                                                 placeholder="Code (e.g. P01)"
                                                 className="w-32 h-8 bg-zinc-950"
                                             />
                                             <Input 
                                                 value={p.description}
                                                 onChange={(e) => updateParticipant(p.id, { description: e.target.value })}
                                                 placeholder="Description / Role..."
                                                 className="flex-1 h-8 bg-zinc-950"
                                             />
                                         </div>
                                         <div className="flex items-center gap-2">
                                            <label className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={p.isCoConstructor}
                                                    onChange={(e) => updateParticipant(p.id, { isCoConstructor: e.target.checked })}
                                                    className="accent-blue-500"
                                                />
                                                Co-Constructor of Meaning
                                            </label>
                                         </div>
                                     </div>
                                     <Button size="icon" variant="ghost" onClick={() => removeParticipant(p.id)} className="h-8 w-8 text-zinc-600 hover:text-red-500">
                                        <Trash2 size={14} />
                                     </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'methodology' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Methods */}
                        <div>
                             <div className="flex justify-between items-start mb-4">
                                <SectionHeader title="Methods & Protocols" description="Data collection strategies and actor mapping." />
                                <div className="flex gap-2">
                                    {onConvertToArtifact && (
                                        <Button 
                                            size="xs" 
                                            variant="outline" 
                                            onClick={() => {
                                                const content = `# Methods Protocol\n\n${localSettings.theoreticalFramework.methods.map(m => `### ${m.type}\n${m.protocolContent}\n`).join('\n')}`;
                                                onConvertToArtifact('Research Design', content, 'Methodology');
                                            }}
                                            className="gap-2 text-zinc-400 hover:text-white"
                                        >
                                            <FileText size={14}/> Save as Artifact
                                        </Button>
                                    )}
                                    <Button size="xs" variant="outline" onClick={addMethod} className="gap-2"><Plus size={14}/> Add Method</Button>
                                </div>
                             </div>
                             <div className="space-y-4">
                                {localSettings.theoreticalFramework.methods.map(m => (
                                    <div key={m.id} className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg space-y-3">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="uppercase text-[10px]">{m.type}</Badge>
                                                <select 
                                                    value={m.type}
                                                    onChange={(e) => updateMethod(m.id, { type: e.target.value as any })}
                                                    className="bg-zinc-950 border border-zinc-700 text-xs rounded p-1 text-zinc-300"
                                                >
                                                    <option value="interview">Interview</option>
                                                    <option value="observation">Observation</option>
                                                    <option value="survey">Survey</option>
                                                    <option value="focusgroup">Focus Group</option>
                                                </select>
                                            </div>
                                            <Button size="icon" variant="ghost" onClick={() => removeMethod(m.id)} className="h-6 w-6 text-zinc-600 hover:text-red-500">
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                        <Textarea 
                                            value={m.protocolContent}
                                            onChange={(e) => updateMethod(m.id, { protocolContent: e.target.value })}
                                            placeholder="Enter Protocol content here..."
                                            className="bg-zinc-950 text-xs font-mono h-24"
                                        />
                                        
                                        {/* Participant Mapping */}
                                        <div className="pt-2 border-t border-zinc-800/50 mt-2">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Users size={12} className="text-zinc-500" />
                                                <span className="text-[10px] uppercase font-bold text-zinc-500">Target Participants</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {localSettings.participants.length > 0 ? localSettings.participants.map(p => {
                                                    const isSelected = m.participantIds?.includes(p.id);
                                                    return (
                                                        <Badge 
                                                            key={p.id}
                                                            variant={isSelected ? "secondary" : "outline"}
                                                            className={cn(
                                                                "cursor-pointer text-[10px] h-5 px-2 border-zinc-700 select-none transition-all",
                                                                isSelected 
                                                                    ? "bg-blue-900/30 text-blue-200 border-blue-800 hover:bg-blue-900/50" 
                                                                    : "text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 bg-zinc-950"
                                                            )}
                                                            onClick={() => toggleMethodParticipant(m.id, p.id)}
                                                        >
                                                            {isSelected && <Check size={8} className="mr-1" />}
                                                            {p.anonymizedCode}
                                                        </Badge>
                                                    );
                                                }) : (
                                                    <span className="text-[10px] text-zinc-600 italic">No participants added in Ontology tab yet.</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                )}

                {activeTab === 'tools' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-start">
                            <SectionHeader title="Research Tools" description="Software and instruments used." />
                            <div className="flex gap-2">
                                {onConvertToArtifact && (
                                    <Button 
                                        size="xs" 
                                        variant="outline" 
                                        onClick={() => {
                                            const content = `# Research Tools\n\n${localSettings.theoreticalFramework.tools.map(t => `* ${t.name} v${t.version || 'N/A'} - ${t.referenceURL || 'No URL'}`).join('\n')}`;
                                            onConvertToArtifact('Research Tools Registry', content, 'Tools');
                                        }}
                                        className="gap-2 text-zinc-400 hover:text-white"
                                    >
                                        <FileText size={14}/> Save as Artifact
                                    </Button>
                                )}
                                <Button size="xs" variant="outline" onClick={addTool} className="gap-2"><Plus size={14}/> Add Tool</Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {localSettings.theoreticalFramework.tools.map(t => (
                                <div key={t.id} className="flex gap-2 items-center p-2 bg-zinc-900/50 border border-zinc-800 rounded">
                                    <Wrench size={14} className="text-zinc-500 ml-2" />
                                    <Input 
                                        value={t.name}
                                        onChange={(e) => updateTool(t.id, { name: e.target.value })}
                                        placeholder="Tool Name"
                                        className="w-1/3 bg-zinc-950 h-8 text-xs"
                                    />
                                    <Input 
                                        value={t.version}
                                        onChange={(e) => updateTool(t.id, { version: e.target.value })}
                                        placeholder="Version"
                                        className="w-24 bg-zinc-950 h-8 text-xs"
                                    />
                                    <Input 
                                        value={t.referenceURL}
                                        onChange={(e) => updateTool(t.id, { referenceURL: e.target.value })}
                                        placeholder="URL"
                                        className="flex-1 bg-zinc-950 h-8 text-xs"
                                    />
                                    <Button size="icon" variant="ghost" onClick={() => removeTool(t.id)} className="h-8 w-8 text-zinc-600 hover:text-red-500">
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'bibliography' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-start">
                            <SectionHeader title="Bibliography" description="Literature references (BibTeX format supported)." />
                            <div className="flex gap-2">
                                {onConvertToArtifact && (
                                    <Button 
                                        size="xs" 
                                        variant="outline" 
                                        onClick={() => {
                                            const content = `# Bibliography\n\n${localSettings.theoreticalFramework.bibliographyContent}`;
                                            onConvertToArtifact('Bibliography', content, 'Resources');
                                        }}
                                        className="gap-2 text-zinc-400 hover:text-white"
                                    >
                                        <FileText size={14}/> Save as Artifact
                                    </Button>
                                )}
                                <Button size="xs" variant="outline" onClick={() => bibFileInputRef.current?.click()} className="gap-2">
                                    <Upload size={14}/> Import .bib
                                </Button>
                                <Button size="xs" variant="outline" onClick={handleBibExport} className="gap-2">
                                    <Download size={14}/> Export .bib
                                </Button>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 items-start">
                            <Book size={20} className="text-zinc-500 mt-2" />
                            <Textarea 
                                value={localSettings.theoreticalFramework.bibliographyContent}
                                onChange={(e) => setLocalSettings({
                                    ...localSettings, 
                                    theoreticalFramework: { ...localSettings.theoreticalFramework, bibliographyContent: e.target.value }
                                })}
                                className="min-h-[200px] font-mono text-sm bg-zinc-900"
                                placeholder="Paste BibTeX entries here or import a .bib file..."
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'findings' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-start">
                             <SectionHeader title="Emergent Findings" description="Key insights and theoretical propositions." />
                             <div className="flex gap-2">
                                {onConvertToArtifact && (
                                    <Button 
                                        size="xs" 
                                        variant="outline" 
                                        onClick={() => {
                                            const content = `# Emergent Findings\n\n${findings.map((f, i) => `## ${i+1}. ${f.title}\n\n${f.content}\n`).join('\n')}`;
                                            onConvertToArtifact('Emergent Findings', content, 'Findings');
                                        }}
                                        className="gap-2 text-zinc-400 hover:text-white"
                                    >
                                        <FileText size={14}/> Save as Artifact
                                    </Button>
                                )}
                                <Button size="xs" variant="brand" onClick={addFinding} className="gap-2"><Plus size={14}/> Add Finding</Button>
                             </div>
                        </div>
                        
                        <div className="space-y-4">
                            {findings.length === 0 && <p className="text-zinc-500 text-sm italic border border-dashed border-zinc-800 p-8 text-center rounded-lg">No findings recorded yet.</p>}
                            {findings.map(finding => (
                                <div key={finding.id} className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg space-y-3 relative group">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1 flex-1 mr-4">
                                            <label className="text-[10px] text-zinc-500 uppercase font-bold">Title</label>
                                            <Input 
                                                value={finding.title}
                                                onChange={(e) => updateFinding(finding.id, { title: e.target.value })}
                                                className="bg-zinc-950 font-medium"
                                                placeholder="Finding Title"
                                            />
                                        </div>
                                        <Button size="icon" variant="ghost" onClick={() => removeFinding(finding.id)} className="h-8 w-8 text-zinc-600 hover:text-red-500 mt-6">
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold">Content</label>
                                        <Textarea 
                                            value={finding.content}
                                            onChange={(e) => updateFinding(finding.id, { content: e.target.value })}
                                            className="bg-zinc-950 min-h-[80px]"
                                            placeholder="Description..."
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {activeTab === 'abstract' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                         <div className="flex justify-between items-start">
                             <SectionHeader title="Structured Abstract" description="Draft the core components of your research paper." />
                             {onConvertToArtifact && (
                                 <Button 
                                     size="xs" 
                                     variant="outline" 
                                     onClick={() => {
                                         const content = `# ${localSettings.projectName} - Abstract\n\n**Background:** ${localSettings.structuredAbstract.background}\n\n**Methods:** ${localSettings.structuredAbstract.methods}\n\n**Results:** ${localSettings.structuredAbstract.results}\n\n**Conclusion:** ${localSettings.structuredAbstract.conclusion}\n\n**Keywords:** ${localSettings.structuredAbstract.keywords}`;
                                         onConvertToArtifact('Structured Abstract', content, 'Abstract');
                                     }}
                                     className="gap-2 text-zinc-400 hover:text-white"
                                 >
                                     <FileText size={14}/> Save as Artifact
                                 </Button>
                             )}
                         </div>

                         <div className="space-y-5">
                             <div className="grid gap-2">
                                <label className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                                    <AlignLeft size={16} className="text-blue-500"/> Background & Objectives
                                </label>
                                <p className="text-xs text-zinc-500">Describe the context, research gap, and the aim of your study.</p>
                                <Textarea 
                                    value={localSettings.structuredAbstract.background}
                                    onChange={(e) => updateAbstract('background', e.target.value)}
                                    placeholder="The purpose of this study is to..."
                                    className="min-h-[100px] bg-zinc-900 border-zinc-800"
                                />
                             </div>

                             <div className="grid gap-2">
                                <label className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                                    <Microscope size={16} className="text-purple-500"/> Methods
                                </label>
                                <p className="text-xs text-zinc-500">Detail participants, data collection, and analysis procedures.</p>
                                <Textarea 
                                    value={localSettings.structuredAbstract.methods}
                                    onChange={(e) => updateAbstract('methods', e.target.value)}
                                    placeholder="We conducted semi-structured interviews with..."
                                    className="min-h-[100px] bg-zinc-900 border-zinc-800"
                                />
                             </div>

                             <div className="grid gap-2">
                                <label className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                                    <Lightbulb size={16} className="text-amber-500"/> Results
                                </label>
                                <p className="text-xs text-zinc-500">Summarize key findings and theoretical categories.</p>
                                <Textarea 
                                    value={localSettings.structuredAbstract.results}
                                    onChange={(e) => updateAbstract('results', e.target.value)}
                                    placeholder="The analysis revealed three core themes..."
                                    className="min-h-[100px] bg-zinc-900 border-zinc-800"
                                />
                             </div>

                             <div className="grid gap-2">
                                <label className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                                    <ScrollText size={16} className="text-emerald-500"/> Conclusion
                                </label>
                                <p className="text-xs text-zinc-500">State implications, limitations, and recommendations.</p>
                                <Textarea 
                                    value={localSettings.structuredAbstract.conclusion}
                                    onChange={(e) => updateAbstract('conclusion', e.target.value)}
                                    placeholder="These findings suggest that..."
                                    className="min-h-[100px] bg-zinc-900 border-zinc-800"
                                />
                             </div>

                             <div className="grid gap-2">
                                <label className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                                    <Tag size={16} className="text-zinc-500"/> Keywords
                                </label>
                                <Input 
                                    value={localSettings.structuredAbstract.keywords}
                                    onChange={(e) => updateAbstract('keywords', e.target.value)}
                                    placeholder="Grounded Theory, Qualitative Analysis, ..."
                                    className="bg-zinc-900 border-zinc-800"
                                />
                             </div>
                         </div>
                    </div>
                )}

                {activeTab === 'team' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-start">
                             <SectionHeader title="Research Team" description="Manage researchers and assign role-based permissions." />
                             <div className="flex gap-2">
                                {onConvertToArtifact && (
                                    <Button 
                                        size="xs" 
                                        variant="outline" 
                                        onClick={() => {
                                            const content = `# Team Charter\n\n## Researchers\n${localTeam.researchers.map(r => `* ${r.name} (${r.role}) - [${r.initials}]`).join('\n')}\n\n## Consensus Criteria\n${localTeam.consensusCriteria.map(c => `* ${c.name} (${c.votingType}): ${c.description} (Active: ${c.active ? 'Yes' : 'No'})`).join('\n')}`;
                                            onConvertToArtifact('Team Charter', content, 'Team');
                                        }}
                                        className="gap-2 text-zinc-400 hover:text-white"
                                    >
                                        <FileText size={14}/> Save as Artifact
                                    </Button>
                                )}
                                <Button size="xs" variant="brand" onClick={addResearcher} className="gap-2"><Plus size={14}/> Add Researcher</Button>
                             </div>
                        </div>
                        
                        <div className="space-y-3">
                            {localTeam.researchers.map(r => (
                                <div key={r.id} className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-lg group">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: r.color + '40', color: r.color }}>
                                        {r.initials}
                                    </div>
                                    <div className="flex-1 grid grid-cols-3 gap-2">
                                        <Input 
                                            value={r.name} 
                                            onChange={(e) => updateResearcher(r.id, { name: e.target.value, initials: e.target.value.substring(0,2).toUpperCase() })}
                                            className="h-8 bg-zinc-950 border-zinc-800"
                                        />
                                        <div className="flex items-center gap-2">
                                            <Button 
                                                size="xs" 
                                                variant={r.role === 'Senior' ? 'default' : 'outline'}
                                                onClick={() => updateResearcher(r.id, { role: 'Senior' })}
                                                className={cn("flex-1", r.role === 'Senior' ? "bg-indigo-600 text-white border-transparent" : "text-zinc-500")}
                                            >
                                                <GraduationCap size={12} className="mr-1"/> Senior
                                            </Button>
                                            <Button 
                                                size="xs" 
                                                variant={r.role === 'Junior' ? 'default' : 'outline'}
                                                onClick={() => updateResearcher(r.id, { role: 'Junior' })}
                                                className={cn("flex-1", r.role === 'Junior' ? "bg-zinc-700 text-white border-transparent" : "text-zinc-500")}
                                            >
                                                <Users size={12} className="mr-1"/> Junior
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="color" 
                                                value={r.color}
                                                onChange={(e) => updateResearcher(r.id, { color: e.target.value })}
                                                className="h-8 w-12 bg-transparent border-none rounded cursor-pointer"
                                            />
                                            {localTeam.researchers.length > 1 && (
                                                <Button size="icon" variant="ghost" onClick={() => removeResearcher(r.id)} className="h-8 w-8 text-red-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 size={14} />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="h-px bg-zinc-800 my-4" />

                        <div className="flex justify-between items-start">
                             <SectionHeader title="Consensus Criteria" description="Define rules for coding agreement and review processes." />
                             <Button size="xs" variant="outline" onClick={addCriteria} className="gap-2"><Plus size={14}/> Add Rule</Button>
                        </div>

                        <div className="space-y-3">
                             {localTeam.consensusCriteria.length === 0 && (
                                 <p className="text-zinc-500 text-sm italic">No consensus rules defined.</p>
                             )}
                             {localTeam.consensusCriteria.map(c => (
                                 <div key={c.id} className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-2 group">
                                     <div className="flex items-center gap-2">
                                         <ShieldCheck size={16} className={c.active ? "text-emerald-500" : "text-zinc-600"} />
                                         <Input 
                                            value={c.name}
                                            onChange={(e) => updateCriteria(c.id, { name: e.target.value })}
                                            className="h-8 flex-1 bg-transparent border-none focus:ring-0 font-medium px-0 text-sm"
                                            placeholder="Rule Name..."
                                         />
                                         <div className="flex items-center gap-2">
                                             <select
                                                value={c.votingType}
                                                onChange={(e) => updateCriteria(c.id, { votingType: e.target.value as any })}
                                                className="h-6 text-[10px] uppercase font-bold bg-zinc-950 border border-zinc-800 rounded px-1 text-zinc-400 focus:outline-none"
                                             >
                                                <option value="unanimous">Unanimous</option>
                                                <option value="majority">Majority</option>
                                                <option value="consensus">Consensus</option>
                                             </select>
                                             
                                             <div className="w-px h-4 bg-zinc-800 mx-1"></div>

                                             <label className="text-[10px] text-zinc-500 uppercase font-bold cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={c.active} 
                                                    onChange={(e) => updateCriteria(c.id, { active: e.target.checked })}
                                                    className="mr-1 accent-emerald-500"
                                                />
                                                Active
                                             </label>
                                             <Button size="icon" variant="ghost" onClick={() => removeCriteria(c.id)} className="h-6 w-6 text-zinc-600 hover:text-red-500 ml-1">
                                                 <X size={14} />
                                             </Button>
                                         </div>
                                     </div>
                                     <Input 
                                        value={c.description}
                                        onChange={(e) => updateCriteria(c.id, { description: e.target.value })}
                                        className="h-8 bg-zinc-950 border-zinc-800 text-xs text-zinc-400"
                                        placeholder="Description of the consensus requirement..."
                                     />
                                 </div>
                             ))}
                        </div>
                    </div>
                )}

                {activeTab === 'theory' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-start">
                            <SectionHeader title="Grounded Theory Approach" description="Define the methodological framework guiding your analysis." />
                            {onConvertToArtifact && (
                                <Button 
                                    size="xs" 
                                    variant="outline" 
                                    onClick={() => {
                                        const content = `# Theoretical Stance\n\n**Selected Approach**: ${localSettings.theoryType}\n\n*Note: This setting influences the analysis workflow and coding terminology used throughout the application.*`;
                                        onConvertToArtifact('Theoretical Stance', content, 'Theory');
                                    }}
                                    className="gap-2 text-zinc-400 hover:text-white"
                                >
                                    <FileText size={14}/> Save as Artifact
                                </Button>
                            )}
                        </div>
                        
                        <div className="grid gap-4">
                            {/* Constructivist */}
                            <div 
                                onClick={() => setLocalSettings({...localSettings, theoryType: 'constructivist'})}
                                className={cn(
                                    "p-4 rounded-lg border cursor-pointer transition-all",
                                    localSettings.theoryType === 'constructivist' 
                                        ? "bg-purple-900/20 border-purple-500" 
                                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                                )}
                            >
                                <div className="flex justify-between mb-1">
                                    <h4 className="font-semibold text-zinc-200">Constructivist (Charmaz)</h4>
                                    {localSettings.theoryType === 'constructivist' && <Badge className="bg-purple-600">Active</Badge>}
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Emphasizes the subjective nature of data and the researcher's co-construction of meaning. Focuses on actions, processes, and flexible coding.
                                </p>
                            </div>

                            {/* Straussian */}
                            <div 
                                onClick={() => setLocalSettings({...localSettings, theoryType: 'straussian'})}
                                className={cn(
                                    "p-4 rounded-lg border cursor-pointer transition-all",
                                    localSettings.theoryType === 'straussian' 
                                        ? "bg-blue-900/20 border-blue-500" 
                                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                                )}
                            >
                                <div className="flex justify-between mb-1">
                                    <h4 className="font-semibold text-zinc-200">Straussian (Strauss & Corbin)</h4>
                                    {localSettings.theoryType === 'straussian' && <Badge className="bg-blue-600">Active</Badge>}
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Systematic approach using the coding paradigm (conditions, context, strategies, consequences). Focuses on verification and structure.
                                </p>
                            </div>

                            {/* Classic */}
                            <div 
                                onClick={() => setLocalSettings({...localSettings, theoryType: 'classic'})}
                                className={cn(
                                    "p-4 rounded-lg border cursor-pointer transition-all",
                                    localSettings.theoryType === 'classic' 
                                        ? "bg-amber-900/20 border-amber-500" 
                                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                                )}
                            >
                                <div className="flex justify-between mb-1">
                                    <h4 className="font-semibold text-zinc-200">Classic (Glaser)</h4>
                                    {localSettings.theoryType === 'classic' && <Badge className="bg-amber-600">Active</Badge>}
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Strict inductive approach. Avoids forcing data into preconceived categories. Focuses on the emergence of the core category.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'analysis' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <SectionHeader title="AI Assistant (Gemini)" description="Configure the generative models used for coding suggestions and memos." />
                        
                        <div className="grid gap-4">
                             <div className="flex flex-col gap-3 p-4 border border-zinc-800 rounded-lg bg-zinc-900/20">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-zinc-200">Model Selection</label>
                                    <Badge variant="outline" className="border-blue-900 text-blue-400">Current: {localSettings.aiModel}</Badge>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        size="sm" 
                                        variant={localSettings.aiModel === 'gemini-3-flash-preview' ? 'brand' : 'outline'}
                                        onClick={() => setLocalSettings({...localSettings, aiModel: 'gemini-3-flash-preview'})}
                                        className="flex-1"
                                    >
                                        Flash (Faster)
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant={localSettings.aiModel === 'gemini-3-pro-preview' ? 'brand' : 'outline'}
                                        onClick={() => setLocalSettings({...localSettings, aiModel: 'gemini-3-pro-preview'})}
                                        className="flex-1"
                                    >
                                        Pro (Reasoning)
                                    </Button>
                                </div>
                                <p className="text-xs text-zinc-500">
                                    'Pro' models are better for complex theoretical memos, while 'Flash' is recommended for real-time coding suggestions.
                                </p>
                             </div>
                        </div>

                        <div className="h-px bg-zinc-800 my-4" />
                        
                        <SectionHeader title="Text Analysis" description="Stop words are ignored during word cloud generation and auto-coding." />
                        
                        <div className="grid gap-2">
                             <label className="text-sm font-medium text-zinc-300">Stop Words (Comma separated)</label>
                             <Textarea 
                                value={localSettings.stopWords.join(', ')}
                                onChange={(e) => setLocalSettings({...localSettings, stopWords: e.target.value.split(',').map(s => s.trim())})}
                                className="h-24 font-mono text-xs"
                             />
                             <p className="text-xs text-zinc-500">Default: a, an, the, and, or, but, is, are, was, were...</p>
                        </div>
                    </div>
                )}

                {activeTab === 'visuals' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                         <SectionHeader title="Document Browser" description="Customize how artifacts are displayed." />
                         
                         <div className="space-y-4">
                             <div className="space-y-2">
                                 <div className="flex justify-between">
                                     <label className="text-sm font-medium text-zinc-300">Coding Stripe Width</label>
                                     <span className="text-xs text-zinc-500">{localSettings.stripeWidth}px</span>
                                 </div>
                                 <input 
                                    type="range" 
                                    min="2" 
                                    max="12" 
                                    step="1"
                                    value={localSettings.stripeWidth}
                                    onChange={(e) => setLocalSettings({...localSettings, stripeWidth: parseInt(e.target.value)})}
                                    className="w-full accent-blue-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                                 />
                                 <div className="flex gap-1 mt-2 justify-center">
                                     <div className="h-8 bg-zinc-800 border-r border-zinc-700" style={{ width: 16 }}></div>
                                     <div className="h-8 bg-blue-500/50" style={{ width: localSettings.stripeWidth }}></div>
                                     <div className="h-8 bg-zinc-800 border-l border-zinc-700" style={{ width: 16 }}></div>
                                 </div>
                             </div>
                         </div>
                    </div>
                )}

            </div>
        </div>

        {/* Footer */}
        <div className="h-16 border-t border-zinc-800 bg-zinc-950 flex items-center justify-end px-6 gap-3">
             <Button variant="ghost" onClick={onClose}>Cancel</Button>
             <Button variant="brand" onClick={handleSave} className="gap-2">
                <Save size={16} /> Save Configuration
             </Button>
        </div>
      </div>
    </div>
  );
};

const NavButton = ({ active, onClick, icon: Icon, label }: any) => (
    <button 
        onClick={onClick}
        className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all w-full text-left",
            active ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
        )}
    >
        <Icon size={16} />
        {label}
    </button>
);

const SectionHeader = ({ title, description }: { title: string, description: string }) => (
    <div className="mb-4">
        <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
        <p className="text-sm text-zinc-500">{description}</p>
    </div>
);
