import React, { useState, useEffect } from 'react';
import { Artifact, CurationMetadata, TypeOfMedia, TypeOfAccess, Researcher, Participant, TypeOfStatus } from '../types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { 
  X, 
  Hash, 
  FileType, 
  FileText, 
  Lock, 
  Globe, 
  User, 
  Users, 
  Calendar, 
  ShieldCheck, 
  Trash2,
  Info 
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ArtifactPropertiesPanelProps {
    artifact: Artifact;
    participants: Participant[];
    researchers: Researcher[];
    onClose: () => void;
    onUpdate: (updates: Partial<Artifact>) => void;
    onDelete?: () => void;
}

export const ArtifactPropertiesPanel: React.FC<ArtifactPropertiesPanelProps> = ({ 
    artifact, 
    participants, 
    researchers, 
    onClose, 
    onUpdate, 
    onDelete 
}) => {
    const [meta, setMeta] = useState<CurationMetadata>(artifact.curation);

    // Sync local state when artifact changes
    useEffect(() => {
        setMeta(artifact.curation);
    }, [artifact.id, artifact.curation]);

    const handleSave = () => {
        onUpdate({ curation: meta });
    };

    const getStatusColor = (status: TypeOfStatus) => {
        switch(status) {
            case 'problem_statement': return "bg-amber-500/10 text-amber-500 border-amber-500/20";
            case 'acquisition': return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            case 'management': return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
            case 'analysis': return "bg-purple-500/10 text-purple-500 border-purple-500/20";
            case 'report': return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
            default: return "bg-zinc-800 text-zinc-400 border-zinc-700";
        }
    };

    return (
        <div className="absolute top-0 right-0 bottom-0 w-[400px] bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 z-50">
            {/* Header */}
            <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950">
                <div className="flex items-center gap-2 text-sm text-zinc-100 font-semibold">
                    <Info size={16} className="text-blue-500" />
                    <span>Artifact Properties</span>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white">
                    <X size={18} />
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-zinc-100 mb-2 leading-tight">{artifact.name}</h2>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                        <Hash size={12} />
                        <span>{artifact.hashID.substring(0, 16)}...</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("capitalize", getStatusColor(artifact.status))}>
                        {artifact.status.replace('_', ' ')} Phase
                    </Badge>
                </div>

                {/* Properties Form */}
                <div className="space-y-4 border border-zinc-800 rounded-lg p-4 bg-zinc-900/20">
                    <h3 className="text-xs font-bold uppercase text-zinc-500 mb-2">Metadata Properties</h3>
                    
                    {/* Media Type */}
                    <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 flex items-center gap-1"><FileType size={10} /> Media Format</label>
                         <select 
                            value={artifact.media}
                            onChange={(e) => onUpdate({ media: e.target.value as TypeOfMedia })}
                            className="w-full bg-zinc-950 border border-zinc-800 text-sm p-1 rounded text-zinc-300 focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="text">Text</option>
                            <option value="video">Video</option>
                            <option value="audio">Audio</option>
                            <option value="dataset">Dataset</option>
                            <option value="software">Software</option>
                        </select>
                    </div>

                    {/* Method Type */}
                    <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 flex items-center gap-1"><FileText size={10} /> Method Type</label>
                         <select 
                            value={artifact.type}
                            onChange={(e) => onUpdate({ type: e.target.value as any })}
                            className="w-full bg-zinc-950 border border-zinc-800 text-sm p-1 rounded text-zinc-300 focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="document">Document</option>
                            <option value="interview">Interview</option>
                            <option value="observation">Observation</option>
                            <option value="protocol">Protocol</option>
                            <option value="bibliography">Bibliography</option>
                        </select>
                    </div>

                    {/* Access Level */}
                    <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 flex items-center gap-1">
                            {artifact.access === 'private' ? <Lock size={10}/> : <Globe size={10}/>} Access Level
                        </label>
                        <select 
                            value={artifact.access}
                            onChange={(e) => onUpdate({ access: e.target.value as TypeOfAccess })}
                            className="w-full bg-zinc-950 border border-zinc-800 text-sm p-1 rounded text-zinc-300 focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="private">Private</option>
                            <option value="public">Public</option>
                        </select>
                    </div>

                    {/* Responsible Researcher */}
                    <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 flex items-center gap-1"><User size={10} /> Responsible Researcher</label>
                        <select 
                            value={artifact.responsibleId || ''}
                            onChange={(e) => onUpdate({ responsibleId: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 text-sm p-1 rounded text-zinc-300 focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- Assign Responsibility --</option>
                            {researchers.map(r => (
                                <option key={r.id} value={r.id}>{r.name} ({r.role})</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Participant Link */}
                    <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 flex items-center gap-1"><Users size={10} /> Participant (Actor)</label>
                        <select 
                            value={meta.participantId || ''}
                            onChange={(e) => {
                                const newId = e.target.value;
                                setMeta({...meta, participantId: newId});
                                onUpdate({ curation: { ...meta, participantId: newId } });
                            }}
                            className="w-full bg-zinc-950 border border-zinc-800 text-sm p-1 rounded text-zinc-300 focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- Select Participant --</option>
                            {participants.map(p => (
                                <option key={p.id} value={p.id}>{p.anonymizedCode} - {p.description}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 flex items-center gap-1"><User size={10} /> Source / Provenance</label>
                        <Input 
                            value={meta.source}
                            onChange={(e) => setMeta({...meta, source: e.target.value})}
                            onBlur={handleSave}
                            className="h-8 text-sm bg-zinc-950 border-zinc-800" 
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 flex items-center gap-1"><Calendar size={10} /> Date Created</label>
                        <Input 
                            type="date"
                            value={meta.dateCreated}
                            onChange={(e) => setMeta({...meta, dateCreated: e.target.value})}
                            onBlur={handleSave}
                            className="h-8 text-sm bg-zinc-950 border-zinc-800" 
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase text-zinc-500">Preservation Context</h3>
                    <Textarea 
                        value={meta.preservationNotes || ''}
                        onChange={(e) => setMeta({...meta, preservationNotes: e.target.value})}
                        onBlur={handleSave}
                        className="min-h-[100px] bg-zinc-900 border-zinc-800 text-sm"
                        placeholder="Add notes about context, consent, or limitations..."
                    />
                    
                    <div className="flex items-start gap-3 p-3 border border-zinc-800 rounded-md bg-zinc-900/20">
                        <input 
                            type="checkbox"
                            checked={meta.consentObtained}
                            onChange={(e) => {
                                const checked = e.target.checked;
                                setMeta({...meta, consentObtained: checked});
                                onUpdate({ curation: { ...meta, consentObtained: checked } });
                            }}
                            className="mt-1 bg-zinc-950 border-zinc-700 rounded cursor-pointer"
                        />
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                                <ShieldCheck size={14} className={meta.consentObtained ? "text-emerald-500" : "text-zinc-600"}/>
                                Ethical Consent Verified
                            </label>
                            <p className="text-xs text-zinc-500">
                                Confirm that informed consent has been obtained.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex justify-between items-center">
                 {onDelete && (
                     <Button variant="ghost" className="text-red-500 hover:text-red-400 hover:bg-red-950/20" size="sm" onClick={onDelete}>
                        <Trash2 size={16} className="mr-2" /> Dispose
                     </Button>
                 )}
                 <Button variant="brand" onClick={handleSave} className="ml-auto">
                    Save Changes
                 </Button>
            </div>
        </div>
    );
};
