import React, { useState } from 'react';
import { ProjectSettings, ResearchTeam, Researcher, ConsensusCriteria } from '../types';
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
  Check
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
  onSave: (settings: ProjectSettings, team?: ResearchTeam) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  team,
  onSave 
}) => {
  const [localSettings, setLocalSettings] = useState<ProjectSettings>(settings);
  const [localTeam, setLocalTeam] = useState<ResearchTeam>(team || { id: 'default', researchers: [], consensusCriteria: [] });
  const [activeTab, setActiveTab] = useState('general');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings, localTeam);
    onClose();
  };

  // Team Management Handlers
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[800px] h-[600px] bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
               <Settings size={20} className="text-zinc-400" />
            </div>
            <div>
               <h2 className="text-lg font-semibold text-zinc-100">Project Preferences</h2>
               <p className="text-xs text-zinc-500">Global configuration for Stratum CAQDAS</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-56 bg-zinc-900/50 border-r border-zinc-800 p-4 flex flex-col gap-1">
                <NavButton 
                    active={activeTab === 'general'} 
                    onClick={() => setActiveTab('general')} 
                    icon={LayoutTemplate} 
                    label="General" 
                />
                 <NavButton 
                    active={activeTab === 'team'} 
                    onClick={() => setActiveTab('team')} 
                    icon={Users} 
                    label="Team & Roles" 
                />
                <NavButton 
                    active={activeTab === 'project'} 
                    onClick={() => setActiveTab('project')} 
                    icon={Database} 
                    label="Project Data" 
                />
                 <NavButton 
                    active={activeTab === 'theory'} 
                    onClick={() => setActiveTab('theory')} 
                    icon={ScrollText} 
                    label="Theory Methodology" 
                />
                <div className="h-px bg-zinc-800 my-2 mx-2" />
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
                        <SectionHeader title="User Identity" description="Used for tracking contributions in team projects." />
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-zinc-300">Display Name</label>
                                <Input 
                                    value={localSettings.userName}
                                    onChange={(e) => setLocalSettings({...localSettings, userName: e.target.value})}
                                    className="max-w-md"
                                />
                            </div>
                        </div>

                        <div className="h-px bg-zinc-800 my-4" />

                        <SectionHeader title="Interface" description="Customize the application appearance." />
                        <div className="flex items-center gap-4">
                            <div className="p-4 border border-blue-600 bg-blue-900/10 rounded-lg w-32 text-center cursor-pointer">
                                <div className="w-full h-16 bg-zinc-900 rounded mb-2 border border-zinc-800"></div>
                                <span className="text-xs font-medium text-blue-400">Dark (Default)</span>
                            </div>
                            <div className="p-4 border border-zinc-800 bg-zinc-900/20 rounded-lg w-32 text-center opacity-50 cursor-not-allowed" title="Coming soon">
                                <div className="w-full h-16 bg-zinc-100 rounded mb-2 border border-zinc-300"></div>
                                <span className="text-xs font-medium text-zinc-500">Light</span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'team' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-start">
                             <SectionHeader title="Research Team" description="Manage researchers and assign role-based permissions." />
                             <Button size="xs" variant="brand" onClick={addResearcher} className="gap-2"><Plus size={14}/> Add Researcher</Button>
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
                                            className="h-8 flex-1 bg-transparent border-none focus:ring-0 font-medium px-0"
                                            placeholder="Rule Name..."
                                         />
                                         <div className="flex items-center gap-2">
                                             <label className="text-[10px] text-zinc-500 uppercase font-bold">Active</label>
                                             <input 
                                                type="checkbox" 
                                                checked={c.active} 
                                                onChange={(e) => updateCriteria(c.id, { active: e.target.checked })}
                                                className="accent-emerald-500"
                                             />
                                             <Button size="icon" variant="ghost" onClick={() => removeCriteria(c.id)} className="h-6 w-6 text-zinc-600 hover:text-red-500 ml-2">
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

                {activeTab === 'project' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <SectionHeader title="Project Metadata" description="Core information about this research project." />
                        
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-zinc-300">Project Title</label>
                            <Input 
                                value={localSettings.projectName}
                                onChange={(e) => setLocalSettings({...localSettings, projectName: e.target.value})}
                            />
                        </div>

                        <div className="grid gap-2">
                             <label className="text-sm font-medium text-zinc-300">Description / Abstract</label>
                             <Textarea 
                                className="h-32" 
                                placeholder="Describe the research goals, methodology, and scope..." 
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'theory' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <SectionHeader title="Grounded Theory Approach" description="Define the methodological framework guiding your analysis." />
                        
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