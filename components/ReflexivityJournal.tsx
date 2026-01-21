import React, { useState, useEffect, useRef } from 'react';
import { JournalEntry } from '../types';
import { BookMarked, PenTool, Clock, X } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface ReflexivityJournalProps {
  entries: JournalEntry[];
  onAddEntry: (content: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ReflexivityJournal: React.FC<ReflexivityJournalProps> = ({ entries, onAddEntry, isOpen, onClose }) => {
  const [newEntry, setNewEntry] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.trim()) return;
    onAddEntry(newEntry);
    setNewEntry('');
  };

  if (!isOpen) return null;

  return (
    <>
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-30 animate-in fade-in duration-300" onClick={onClose} />
        
        {/* Sheet Content */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-zinc-950 border-l border-zinc-800 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
                <div className="flex flex-col gap-1">
                    <h2 className="font-semibold text-lg tracking-tight text-zinc-100 flex items-center gap-2">
                        <BookMarked size={18} className="text-amber-500" />
                        Reflexivity Journal
                    </h2>
                    <p className="text-xs text-zinc-500">Document biases & decisions.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white">
                    <X size={18} />
                </Button>
            </div>

            {/* Content Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-900/30">
                {entries.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 text-zinc-600">
                        <PenTool className="mb-3 opacity-20" size={40} />
                        <p className="text-sm">No entries yet.</p>
                        <p className="text-xs opacity-60">Start documenting your journey.</p>
                    </div>
                )}
                {entries.map((entry) => (
                    <div key={entry.id} className={cn("flex flex-col gap-2 group", entry.type === 'auto' ? 'opacity-70' : 'opacity-100')}>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn("text-[10px] h-5 px-1 font-mono border-zinc-800 text-zinc-500", entry.type === 'auto' ? "bg-zinc-900" : "bg-amber-950/30 border-amber-900/50 text-amber-500")}>
                                {entry.type === 'auto' ? 'SYSTEM' : 'NOTE'}
                            </Badge>
                            <span className="text-[10px] text-zinc-600 font-mono flex items-center gap-1">
                                <Clock size={10} />
                                {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <div className={cn(
                            "text-sm leading-relaxed p-3 rounded-lg border", 
                            entry.type === 'manual' 
                                ? "bg-zinc-900 border-zinc-800 text-zinc-200 shadow-sm" 
                                : "bg-transparent border-transparent text-zinc-500 italic pl-1"
                        )}>
                            {entry.content}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Form */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-800">
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <Textarea
                        value={newEntry}
                        onChange={(e) => setNewEntry(e.target.value)}
                        placeholder="Note a theoretical hunch or bias..."
                        className="min-h-[100px] resize-none bg-zinc-900 border-zinc-800 focus-visible:ring-amber-500/50"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                            }
                        }}
                    />
                    <Button 
                        type="submit" 
                        disabled={!newEntry.trim()}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium"
                    >
                        Log Entry
                    </Button>
                </form>
            </div>
        </div>
    </>
  );
};