import React, { useState, useRef } from 'react';
import { Artifact, TypeOfStatus, TypeOfMedia, TypeOfMethod } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { X, Plus, FileText, Mic, Video, Table2, Laptop, Upload, FileCode } from 'lucide-react';
import { cn } from '../lib/utils';

interface CreateArtifactDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (artifact: Partial<Artifact>) => void;
  defaultStatus?: TypeOfStatus;
}

export const CreateArtifactDialog: React.FC<CreateArtifactDialogProps> = ({
  isOpen,
  onClose,
  onCreate,
  defaultStatus = 'acquisition'
}) => {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<TypeOfStatus>(defaultStatus);
  const [type, setType] = useState<TypeOfMethod>('document' as any);
  const [media, setMedia] = useState<TypeOfMedia>('text');
  const [content, setContent] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
        setStatus(defaultStatus);
        setName('');
        setContent('');
    }
  }, [isOpen, defaultStatus]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreate({
        name,
        status,
        type: type as any,
        media,
        content: content || 'No content initialized.',
        access: 'private', 
        curation: {
            format: media === 'text' ? 'Text' : 'Binary',
            source: 'Manual Entry',
            dateCreated: new Date().toISOString(),
            consentObtained: false
        }
    });
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const text = await file.text();
      setContent(text);
      if (!name) {
          setName(file.name.replace(/\.[^/.]+$/, "")); // Remove extension
      }
      if (file.name.endsWith('.md')) {
          setMedia('text');
          setType('document' as any); // assumption
      }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[600px] bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950 shrink-0">
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
             <Plus size={16} className="text-blue-500" />
             Create New Artifact
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
            <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Import Banner */}
                <div className="p-4 border border-dashed border-zinc-700 bg-zinc-900/30 rounded-lg flex items-center justify-between group hover:border-blue-500/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-900 rounded text-zinc-400 group-hover:text-blue-400 transition-colors">
                            <Upload size={20} />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-zinc-200">Import Document</div>
                            <div className="text-xs text-zinc-500">Supports .md, .txt files</div>
                        </div>
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept=".md,.txt,.csv" 
                        className="hidden" 
                    />
                    <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                        Choose File
                    </Button>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-zinc-500">Name / Identifier</label>
                    <Input 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Interview with P-005"
                        className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500/50"
                        autoFocus
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-zinc-500">Lifecycle Phase</label>
                        <select 
                            value={status} 
                            onChange={(e) => setStatus(e.target.value as TypeOfStatus)}
                            className="w-full h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                            <option value="problem_statement">I. Problem Statement</option>
                            <option value="acquisition">II. Data Acquisition</option>
                            <option value="management">III. Data Management</option>
                            <option value="analysis">IV. Analysis</option>
                            <option value="report">V. Report</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-zinc-500">Method Type</label>
                        <select 
                            value={type} 
                            onChange={(e) => setType(e.target.value as TypeOfMethod)}
                            className="w-full h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                            <option value="document">Document</option>
                            <option value="interview">Interview</option>
                            <option value="observation">Observation</option>
                            <option value="protocol">Protocol</option>
                            <option value="bibliography">Bibliography</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-zinc-500">Media Format</label>
                    <div className="grid grid-cols-5 gap-2">
                        {[
                            { id: 'text', icon: FileText, label: 'Text' },
                            { id: 'audio', icon: Mic, label: 'Audio' },
                            { id: 'video', icon: Video, label: 'Video' },
                            { id: 'dataset', icon: Table2, label: 'Data' },
                            { id: 'software', icon: FileCode, label: 'Code' },
                        ].map(item => (
                            <div 
                                key={item.id}
                                onClick={() => setMedia(item.id as TypeOfMedia)}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 p-2 rounded border cursor-pointer transition-all",
                                    media === item.id 
                                        ? "bg-blue-600/20 border-blue-500 text-blue-400" 
                                        : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                                )}
                            >
                                <item.icon size={16} />
                                <span className="text-[9px] font-medium">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-zinc-500">Content</label>
                    <Textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={media === 'text' ? "Paste transcript, notes, or markdown here..." : "Binary content placeholder..."}
                        className="min-h-[150px] bg-zinc-900 border-zinc-800 text-xs font-mono"
                    />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="brand" disabled={!name}>Create Artifact</Button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};