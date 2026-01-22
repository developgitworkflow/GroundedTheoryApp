import React, { useState } from 'react';
import { Artifact, TypeOfStatus, TypeOfMedia, TypeOfMethod } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { X, Plus, FileText, Mic, Video, Table2, Laptop, Hash } from 'lucide-react';
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

  // Reset state when opening with a new default status
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
        type: type as any, // Cast for flexibility if types slightly mismatch
        media,
        content: content || 'No content initialized.',
        access: 'private', // Default
        curation: {
            format: media === 'text' ? 'Text' : 'Binary',
            source: 'Manual Entry',
            dateCreated: new Date().toISOString(),
            consentObtained: false
        }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[500px] bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950">
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
             <Plus size={16} className="text-blue-500" />
             Create New Artifact
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
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
                        { id: 'software', icon: Laptop, label: 'Code' },
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
                <label className="text-[10px] uppercase font-bold text-zinc-500">Initial Content (Optional)</label>
                <Textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste transcript or notes here..."
                    className="min-h-[100px] bg-zinc-900 border-zinc-800 text-xs"
                />
            </div>

            <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit" variant="brand" disabled={!name}>Create Artifact</Button>
            </div>
        </form>
      </div>
    </div>
  );
};
