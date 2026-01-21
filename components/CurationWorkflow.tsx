import React, { useState } from 'react';
import { Artifact, CurationMetadata, LifecycleStatus } from '../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
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
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';

interface CurationWorkflowProps {
  artifacts: Artifact[];
  onUpdateArtifact: (id: string, updates: Partial<Artifact>) => void;
  onDeleteArtifact: (id: string) => void;
  onCreateArtifact: () => void; // Mock function to simulate import
}

export const CurationWorkflow: React.FC<CurationWorkflowProps> = ({ 
  artifacts, 
  onUpdateArtifact, 
  onDeleteArtifact,
  onCreateArtifact 
}) => {
  const inboxItems = artifacts.filter(a => a.status === 'inbox');
  const appraisalItems = artifacts.filter(a => a.status === 'appraisal');
  const activeItems = artifacts.filter(a => a.status === 'active');
  const archivedItems = artifacts.filter(a => a.status === 'archived');

  return (
    <div className="flex flex-col h-full bg-zinc-950/50 p-6 overflow-hidden">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <RefreshCw className="text-amber-500" />
            Digital Curation Lifecycle
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
            Manage the ingest, appraisal, and preservation of data before analysis.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden min-w-[1000px]">
        
        {/* Stage 1: Create or Receive (Inbox) */}
        <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h2 className="font-bold text-zinc-300 flex items-center gap-2">
                    <Inbox size={18} /> Create or Receive
                </h2>
                <Badge variant="secondary">{inboxItems.length}</Badge>
            </div>
            
            <div className="bg-zinc-900/30 rounded-lg p-4 flex-1 border border-zinc-800 border-dashed overflow-y-auto space-y-3">
                {inboxItems.length === 0 && (
                     <div className="text-center py-10 text-zinc-600">
                        <p className="text-sm">No new data.</p>
                     </div>
                )}
                {inboxItems.map(art => (
                    <Card key={art.id} className="bg-zinc-950 border-zinc-800">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-medium truncate">{art.name}</CardTitle>
                            <CardDescription className="text-xs">Raw Import</CardDescription>
                        </CardHeader>
                        <CardFooter className="p-4 pt-2 flex justify-between">
                            <Button 
                                size="xs" 
                                variant="destructive" 
                                onClick={() => onDeleteArtifact(art.id)}
                            >
                                <Trash2 size={12} />
                            </Button>
                            <Button 
                                size="xs" 
                                variant="default"
                                onClick={() => onUpdateArtifact(art.id, { status: 'appraisal' })}
                            >
                                Start Appraisal <ArrowRight size={12} className="ml-1"/>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
                
                <Button variant="outline" className="w-full border-dashed border-zinc-700 text-zinc-400 hover:text-zinc-200" onClick={onCreateArtifact}>
                    + Receive Data (Simulate Import)
                </Button>
            </div>
        </div>

        {/* Stage 2: Appraise & Select (Metadata Injection) */}
        <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                 <h2 className="font-bold text-blue-400 flex items-center gap-2">
                    <SearchCheck size={18} /> Appraise & Select
                </h2>
                <Badge className="bg-blue-900/20 text-blue-400 border-blue-900/50">{appraisalItems.length}</Badge>
            </div>

            <div className="bg-blue-950/10 rounded-lg p-4 flex-1 border border-blue-900/30 overflow-y-auto space-y-4">
                {appraisalItems.length === 0 && (
                     <div className="text-center py-10 text-zinc-600">
                        <p className="text-sm">Nothing to appraise.</p>
                     </div>
                )}
                {appraisalItems.map(art => (
                    <AppraisalCard 
                        key={art.id} 
                        artifact={art} 
                        onApprove={(meta) => onUpdateArtifact(art.id, { status: 'active', curation: meta })}
                        onReject={() => onUpdateArtifact(art.id, { status: 'disposed' })}
                    />
                ))}
            </div>
        </div>

        {/* Stage 3: Ingest & Store (Active Repository) */}
        <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                 <h2 className="font-bold text-emerald-400 flex items-center gap-2">
                    <Database size={18} /> Active Repository
                </h2>
                <Badge className="bg-emerald-900/20 text-emerald-400 border-emerald-900/50">{activeItems.length}</Badge>
            </div>

            <div className="bg-emerald-950/10 rounded-lg p-4 flex-1 border border-emerald-900/30 overflow-y-auto space-y-2">
                 {activeItems.map(art => (
                    <div key={art.id} className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg group hover:border-emerald-500/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-500/10 p-2 rounded text-emerald-500">
                                <FileText size={16} />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-zinc-200">{art.name}</div>
                                <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                                    <span>{art.curation.format}</span>
                                    <span>•</span>
                                    <span>{new Date(art.curation.dateCreated).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            className="text-zinc-600 hover:text-amber-500"
                            title="Migrate to Archive"
                            onClick={() => onUpdateArtifact(art.id, { status: 'archived' })}
                        >
                            <Archive size={14} />
                        </Button>
                    </div>
                ))}
                
                 {archivedItems.length > 0 && (
                    <div className="mt-8 pt-4 border-t border-zinc-800">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase mb-2 flex items-center gap-2">
                            <Archive size={12}/> Long-term Preservation ({archivedItems.length})
                        </h3>
                        {archivedItems.map(art => (
                            <div key={art.id} className="text-xs text-zinc-600 py-1 flex justify-between">
                                <span>{art.name}</span>
                                <span className="italic">Archived</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

// Sub-component for the Appraisal Form
const AppraisalCard: React.FC<{ 
    artifact: Artifact, 
    onApprove: (meta: CurationMetadata) => void, 
    onReject: () => void 
}> = ({ artifact, onApprove, onReject }) => {
    const [meta, setMeta] = useState<CurationMetadata>({
        ...artifact.curation,
        dateCreated: artifact.curation.dateCreated || new Date().toISOString().split('T')[0]
    });

    return (
        <Card className="bg-zinc-950 border-blue-900/30 shadow-lg">
            <CardHeader className="p-4 pb-2 bg-blue-950/10 border-b border-blue-900/20">
                <CardTitle className="text-sm font-bold text-blue-200">{artifact.name}</CardTitle>
                <CardDescription className="text-xs text-blue-400">Preservation Metadata Required</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-zinc-500 font-bold">Format / Type</label>
                        <Input 
                            value={meta.format} 
                            onChange={e => setMeta({...meta, format: e.target.value})}
                            className="h-7 text-xs bg-zinc-900" 
                            placeholder="e.g. PDF, Transcript"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-zinc-500 font-bold">Source / Provenance</label>
                        <Input 
                            value={meta.source} 
                            onChange={e => setMeta({...meta, source: e.target.value})}
                            className="h-7 text-xs bg-zinc-900" 
                            placeholder="e.g. Participant 004"
                        />
                    </div>
                </div>
                
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-500 font-bold">Description / Notes</label>
                    <Textarea 
                        value={meta.preservationNotes || ''} 
                        onChange={e => setMeta({...meta, preservationNotes: e.target.value})}
                        className="min-h-[60px] text-xs bg-zinc-900 resize-none" 
                        placeholder="Context for future interpretation..."
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        checked={meta.consentObtained}
                        onChange={e => setMeta({...meta, consentObtained: e.target.checked})}
                        className="rounded bg-zinc-900 border-zinc-700"
                    />
                    <label className="text-xs text-zinc-400 flex items-center gap-1">
                        <ShieldCheck size={12} className={meta.consentObtained ? "text-emerald-500" : "text-zinc-600"}/>
                        Consent verified for preservation
                    </label>
                </div>
            </CardContent>
            <CardFooter className="p-3 bg-zinc-900/50 flex justify-between gap-2">
                 <Button 
                    size="xs" 
                    variant="outline" 
                    className="text-red-400 hover:text-red-300 hover:bg-red-950/30 border-red-900/30"
                    onClick={onReject}
                >
                    Dispose
                </Button>
                <Button 
                    size="xs" 
                    variant="brand"
                    disabled={!meta.format || !meta.source || !meta.consentObtained}
                    onClick={() => onApprove(meta)}
                >
                    Ingest & Preserve
                </Button>
            </CardFooter>
        </Card>
    );
}
