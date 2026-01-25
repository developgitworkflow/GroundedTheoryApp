import React, { useState, useEffect, useRef, useMemo } from 'react';
import { JournalEntry } from '../types';
import { BookMarked, PenTool, Clock, X, Archive, Milestone, Calendar, GitCommit } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface ReflexivityJournalProps {
  entries: JournalEntry[];
  onAddEntry: (content: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onConvertToArtifact?: (title: string, content: string, typeSource: string, sourceId?: string) => void;
}

export const ReflexivityJournal: React.FC<ReflexivityJournalProps> = ({ 
    entries, 
    onAddEntry, 
    isOpen, 
    onClose,
    onConvertToArtifact
}) => {
  const [newEntry, setNewEntry] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Group entries by Date for Timeline view
  const timelineGroups = useMemo(() => {
      const groups: Record<string, JournalEntry[]> = {};
      // Sort newest first
      const sorted = [...entries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      sorted.forEach(entry => {
          const dateLabel = new Date(entry.timestamp).toLocaleDateString(undefined, { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
          });
          if (!groups[dateLabel]) groups[dateLabel] = [];
          groups[dateLabel].push(entry);
      });
      return groups;
  }, [entries]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.trim()) return;
    onAddEntry(newEntry);
    setNewEntry('');
    // Scroll to top to see new entry (since we order new first)
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const handleSaveAsArtifact = () => {
      if (!onConvertToArtifact) return;
      
      const content = `# Reflexivity Journal & Audit Trail\n\nGenerated: ${new Date().toLocaleString()}\n\n` + 
          entries
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) // Chronological for reading
            .map(e => `### ${new Date(e.timestamp).toLocaleString()} [${e.type === 'manual' ? 'REFLECTION' : 'SYSTEM'}]\n${e.content}\n`)
            .join('\n---\n\n');

      onConvertToArtifact('Reflexivity Journal', content, 'Journal');
  };

  if (!isOpen) return null;

  return (
    <>
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 animate-in fade-in duration-300" onClick={onClose} />
        
        {/* Sheet Content */}
        <div className="absolute right-0 top-0 bottom-0 w-[450px] bg-zinc-950 border-l border-zinc-800 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 shrink-0">
                <div className="flex flex-col gap-1">
                    <h2 className="font-semibold text-lg tracking-tight text-zinc-100 flex items-center gap-2">
                        <BookMarked size={18} className="text-amber-500" />
                        Reflexivity Journal
                    </h2>
                    <p className="text-xs text-zinc-500">Document biases, decisions & milestones.</p>
                </div>
                <div className="flex items-center gap-1">
                    {onConvertToArtifact && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={handleSaveAsArtifact} 
                            className="text-zinc-400 hover:text-white"
                            title="Save as Project Artifact"
                        >
                            <Archive size={18} />
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white">
                        <X size={18} />
                    </Button>
                </div>
            </div>

            {/* Input Area (Top for quick access) */}
            <div className="p-4 bg-zinc-900/30 border-b border-zinc-800 shrink-0">
                <form onSubmit={handleSubmit} className="flex flex-col gap-3 relative">
                    <Textarea
                        value={newEntry}
                        onChange={(e) => setNewEntry(e.target.value)}
                        placeholder="What are you thinking? Note a hunch, bias, or decision..."
                        className="min-h-[80px] resize-none bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500/50 text-sm pr-12"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                    <Button 
                        type="submit" 
                        size="icon"
                        disabled={!newEntry.trim()}
                        className="absolute bottom-2 right-2 h-8 w-8 bg-amber-600 hover:bg-amber-700 text-white rounded-md"
                    >
                        <PenTool size={14} />
                    </Button>
                </form>
            </div>

            {/* Timeline Feed */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 bg-zinc-950 relative">
                {/* Timeline Vertical Line */}
                <div className="absolute left-[39px] top-6 bottom-0 w-px bg-zinc-800 z-0" />

                {entries.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 text-zinc-600">
                        <Milestone className="mb-3 opacity-20" size={40} />
                        <p className="text-sm">Timeline empty.</p>
                        <p className="text-xs opacity-60">Actions and notes will appear here.</p>
                    </div>
                )}

                {Object.entries(timelineGroups).map(([date, groupEntries]: [string, JournalEntry[]]) => (
                    <div key={date} className="relative z-10 mb-8">
                        {/* Date Header */}
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-zinc-900 border border-zinc-800 p-1.5 rounded-md shadow-sm z-10 text-zinc-400">
                                <Calendar size={14} />
                            </div>
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider bg-zinc-950 px-2">
                                {date}
                            </span>
                        </div>

                        {/* Entries */}
                        <div className="space-y-6">
                            {groupEntries.map((entry) => (
                                <div key={entry.id} className="flex gap-4 group">
                                    {/* Icon Column */}
                                    <div className="flex flex-col items-center">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full border flex items-center justify-center shrink-0 shadow-sm z-10",
                                            entry.type === 'manual' 
                                                ? "bg-amber-950/30 border-amber-500/50 text-amber-500" 
                                                : "bg-zinc-900 border-zinc-700 text-blue-500"
                                        )}>
                                            {entry.type === 'manual' ? <PenTool size={14} /> : <GitCommit size={14} />}
                                        </div>
                                    </div>

                                    {/* Content Column */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] text-zinc-500 font-mono">
                                                {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {entry.type === 'auto' && (
                                                <Badge variant="outline" className="text-[9px] h-4 px-1 py-0 border-blue-900 text-blue-400 bg-blue-950/30">
                                                    System Event
                                                </Badge>
                                            )}
                                        </div>
                                        
                                        <div className={cn(
                                            "text-sm leading-relaxed rounded-lg border transition-all", 
                                            entry.type === 'manual' 
                                                ? "bg-zinc-900/80 border-zinc-800 text-zinc-200 p-3 shadow-md hover:border-amber-900/50" 
                                                : "bg-transparent border-transparent text-zinc-500 py-0 px-0 italic text-xs"
                                        )}>
                                            {entry.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </>
  );
};