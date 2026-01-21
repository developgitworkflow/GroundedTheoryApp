import React, { useState, useMemo } from 'react';
import { Artifact, CurationMetadata, LifecycleStatus, Participant } from '../types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { 
  Inbox, 
  SearchCheck, 
  Archive, 
  Trash2, 
  Database, 
  FileText, 
  ShieldCheck, 
  GripVertical,
  Plus,
  AlertTriangle,
  X,
  MoreHorizontal,
  Calendar,
  User,
  FileType,
  Users
} from 'lucide-react';
import { cn } from '../lib/utils';

interface CurationWorkflowProps {
  artifacts: Artifact[];
  onUpdateArtifact: (id: string, updates: Partial<Artifact>) => void;
  onDeleteArtifact: (id: string) => void;
  onCreateArtifact: () => void;
  participants: Participant[]; // Added participants prop
}

const COLUMNS: { id: LifecycleStatus; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'inbox', label: 'Inbox', icon: Inbox, color: 'text-zinc-400' },
  { id: 'appraisal', label: 'Appraisal', icon: SearchCheck, color: 'text-blue-400' },
  { id: 'active', label: 'Active', icon: Database, color: 'text-emerald-400' },
  { id: 'archived', label: 'Archive', icon: Archive, color: 'text-amber-400' },
];

export const CurationWorkflow: React.FC<CurationWorkflowProps> = ({ 
  artifacts, 
  onUpdateArtifact, 
  onDeleteArtifact,
  onCreateArtifact,
  participants
}) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);

  const activeArtifact = useMemo(() => 
    artifacts.find(a => a.id === selectedArtifactId), 
  [artifacts, selectedArtifactId]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: LifecycleStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    setDraggingId(null);
    
    if (id) {
        onUpdateArtifact(id, { status });
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 overflow-hidden relative">
      {/* Board Header */}
      <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950 shrink-0">
        <div className="flex items-center gap-2">
           <h2 className="font-semibold text-zinc-100">Curation Board</h2>
           <Badge variant="outline" className="text-zinc-500 border-zinc-700 ml-2">Kanban View</Badge>
        </div>
        <Button onClick={onCreateArtifact} size="sm" variant="brand" className="gap-2">
            <Plus size={16} /> New Item
        </Button>
      </div>

      {/* Board Canvas */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex h-full gap-4 min-w-[1000px]">
          {COLUMNS.map(col => (
            <div 
                key={col.id} 
                className="flex-1 flex flex-col min-w-[280px] max-w-[360px] bg-zinc-900/30 rounded-lg border border-zinc-800/50"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className="p-3 flex items-center justify-between border-b border-zinc-800/50 bg-zinc-900/50 rounded-t-lg">
                 <div className="flex items-center gap-2">
                    <col.icon size={16} className={col.color} />
                    <span className="font-medium text-sm text-zinc-200">{col.label}</span>
                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-500 text-[10px] px-1.5 h-5 min-w-[20px] justify-center">
                        {artifacts.filter(a => a.status === col.id).length}
                    </Badge>
                 </div>
                 <MoreHorizontal size={14} className="text-zinc-600 cursor-pointer hover:text-zinc-400" />
              </div>

              {/* Drop Zone / List */}
              <div className={cn(
                  "flex-1 overflow-y-auto p-3 space-y-3 transition-colors",
                  draggingId ? "bg-zinc-900/20" : ""
              )}>
                {artifacts.filter(a => a.status === col.id).map(artifact => (
                    <WorkflowCard 
                        key={artifact.id} 
                        artifact={artifact} 
                        onClick={() => setSelectedArtifactId(artifact.id)}
                        onDragStart={(e) => handleDragStart(e, artifact.id)}
                        participant={participants.find(p => p.id === artifact.curation.participantId)}
                    />
                ))}
                {artifacts.filter(a => a.status === col.id).length === 0 && (
                    <div className="h-24 border-2 border-dashed border-zinc-800 rounded-lg flex items-center justify-center text-zinc-700 text-xs">
                        Drop items here
                    </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Side Panel (Editor) */}
      {selectedArtifactId && activeArtifact && (
          <CurationSidePanel 
             artifact={activeArtifact}
             participants={participants}
             onClose={() => setSelectedArtifactId(null)}
             onUpdate={(updates) => onUpdateArtifact(activeArtifact.id, updates)}
             onDelete={() => {
                 onDeleteArtifact(activeArtifact.id);
                 setSelectedArtifactId(null);
             }}
          />
      )}
    </div>
  );
};

// --- Sub-Components ---

const WorkflowCard: React.FC<{ 
    artifact: Artifact; 
    onClick: () => void;
    onDragStart: (e: React.DragEvent) => void;
    participant?: Participant;
}> = ({ artifact, onClick, onDragStart, participant }) => {
    
    // Check for "Active" validity
    const isMissingMeta = artifact.status === 'active' && (!artifact.curation.consentObtained || !artifact.curation.format);

    return (
        <div 
            draggable 
            onDragStart={onDragStart}
            onClick={onClick}
            className="group bg-zinc-950 border border-zinc-800 rounded-md p-3 shadow-sm hover:border-blue-500/50 hover:shadow-md cursor-pointer transition-all active:cursor-grabbing relative"
        >
            <div className="flex items-start justify-between gap-2">
                 <div className="flex items-center gap-2 text-zinc-400">
                    <GripVertical size={14} className="opacity-0 group-hover:opacity-50 cursor-grab" />
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">{artifact.type || 'DOC'}</span>
                 </div>
                 {isMissingMeta && (
                     <div title="Missing Metadata">
                        <AlertTriangle size={14} className="text-amber-500" />
                     </div>
                 )}
            </div>
            
            <h4 className="font-medium text-sm text-zinc-200 mt-1 mb-2 line-clamp-2 leading-snug">
                {artifact.name}
            </h4>

            <div className="flex items-center gap-2 mt-2 justify-between">
                <span className="text-[10px] text-zinc-600">
                    {new Date(artifact.curation.dateCreated).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
                {participant && (
                    <Badge variant="secondary" className="text-[9px] px-1 h-4 bg-blue-900/30 text-blue-400 border-none flex items-center gap-1">
                        <User size={8} /> {participant.anonymizedCode}
                    </Badge>
                )}
            </div>
        </div>
    )
}

const CurationSidePanel: React.FC<{
    artifact: Artifact;
    participants: Participant[];
    onClose: () => void;
    onUpdate: (updates: Partial<Artifact>) => void;
    onDelete: () => void;
}> = ({ artifact, participants, onClose, onUpdate, onDelete }) => {
    const [meta, setMeta] = useState<CurationMetadata>(artifact.curation);

    // Sync local state when artifact changes
    React.useEffect(() => {
        setMeta(artifact.curation);
    }, [artifact.id]);

    const handleSave = () => {
        onUpdate({ curation: meta });
    };

    return (
        <div className="absolute top-0 right-0 bottom-0 w-[400px] bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 z-50">
            {/* Header */}
            <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950">
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <FileText size={16} />
                    <span>{artifact.id}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white">
                    <X size={18} />
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-zinc-100 mb-1">{artifact.name}</h2>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={cn(
                            "capitalize",
                            artifact.status === 'active' ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-800 text-zinc-400"
                        )}>
                            {artifact.status}
                        </Badge>
                    </div>
                </div>

                {/* Properties Form */}
                <div className="space-y-4 border border-zinc-800 rounded-lg p-4 bg-zinc-900/20">
                    <h3 className="text-xs font-bold uppercase text-zinc-500 mb-2">Metadata Properties</h3>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 flex items-center gap-1"><FileType size={10} /> Type</label>
                         <select 
                            value={artifact.type}
                            onChange={(e) => onUpdate({ type: e.target.value as any })}
                            className="w-full bg-zinc-950 border border-zinc-800 text-sm p-1 rounded text-zinc-300"
                        >
                            <option value="document">Document</option>
                            <option value="interview">Interview</option>
                            <option value="observation">Observation</option>
                            <option value="protocol">Protocol</option>
                            <option value="bibliography">Bibliography</option>
                        </select>
                    </div>
                    
                    {artifact.type === 'interview' && (
                         <div className="space-y-1">
                            <label className="text-[10px] text-zinc-400 flex items-center gap-1"><Users size={10} /> Participant (Actor)</label>
                            <select 
                                value={meta.participantId || ''}
                                onChange={(e) => setMeta({...meta, participantId: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-800 text-sm p-1 rounded text-zinc-300"
                            >
                                <option value="">-- Select Participant --</option>
                                {participants.map(p => (
                                    <option key={p.id} value={p.id}>{p.anonymizedCode} - {p.description}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 flex items-center gap-1"><User size={10} /> Source / Provenance</label>
                        <Input 
                            value={meta.source}
                            onChange={(e) => setMeta({...meta, source: e.target.value})}
                            className="h-8 text-sm bg-zinc-950 border-zinc-800" 
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 flex items-center gap-1"><Calendar size={10} /> Date Created</label>
                        <Input 
                            type="date"
                            value={meta.dateCreated}
                            onChange={(e) => setMeta({...meta, dateCreated: e.target.value})}
                            className="h-8 text-sm bg-zinc-950 border-zinc-800" 
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase text-zinc-500">Preservation Context</h3>
                    <Textarea 
                        value={meta.preservationNotes || ''}
                        onChange={(e) => setMeta({...meta, preservationNotes: e.target.value})}
                        className="min-h-[100px] bg-zinc-900 border-zinc-800 text-sm"
                        placeholder="Add notes about context, consent, or limitations..."
                    />
                    
                    <div className="flex items-start gap-3 p-3 border border-zinc-800 rounded-md bg-zinc-900/20">
                        <input 
                            type="checkbox"
                            checked={meta.consentObtained}
                            onChange={(e) => setMeta({...meta, consentObtained: e.target.checked})}
                            className="mt-1 bg-zinc-950 border-zinc-700 rounded"
                        />
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                                <ShieldCheck size={14} className={meta.consentObtained ? "text-emerald-500" : "text-zinc-600"}/>
                                Ethical Consent Verified
                            </label>
                            <p className="text-xs text-zinc-500">
                                Confirm that informed consent has been obtained for the long-term preservation and analysis of this artifact.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Raw Content Preview */}
                <div className="space-y-2">
                     <h3 className="text-xs font-bold uppercase text-zinc-500">Content Preview</h3>
                     <div className="p-3 bg-zinc-950 rounded border border-zinc-800 text-xs text-zinc-400 font-mono line-clamp-6">
                        {artifact.content}
                     </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex justify-between items-center">
                 <Button variant="ghost" className="text-red-500 hover:text-red-400 hover:bg-red-950/20" size="sm" onClick={onDelete}>
                    <Trash2 size={16} className="mr-2" /> Dispose
                 </Button>
                 <Button variant="brand" onClick={handleSave}>
                    Save Changes
                 </Button>
            </div>
        </div>
    );
};