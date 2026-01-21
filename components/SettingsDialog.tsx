import React, { useState } from 'react';
import { ProjectSettings } from '../types';
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
  LayoutTemplate
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
  onSave: (settings: ProjectSettings) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onSave 
}) => {
  const [localSettings, setLocalSettings] = useState<ProjectSettings>(settings);
  const [activeTab, setActiveTab] = useState('general');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
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
                    active={activeTab === 'project'} 
                    onClick={() => setActiveTab('project')} 
                    icon={Database} 
                    label="Project Data" 
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

                        <div className="bg-amber-950/20 border border-amber-900/50 rounded-md p-4 flex items-start gap-3">
                             <Database className="text-amber-500 shrink-0 mt-0.5" size={16} />
                             <div className="space-y-1">
                                 <h4 className="text-sm font-medium text-amber-500">Database Statistics</h4>
                                 <p className="text-xs text-amber-400/70">
                                     Local storage usage: ~2.4 MB<br/>
                                     Last backup: Never
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
                <Save size={16} /> Save Settings
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
