import React, { useMemo, useState } from 'react';
import { Memo, Artifact, MEMO_TYPES, MemoCategory } from '../types';
import { StickyNote, Book, Lightbulb, Search, Calendar, FileText, Filter } from 'lucide-react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { MemoTypeBadge, getMemoIcon } from './MemoComponents';

interface MemoDirectoryProps {
  memos: Memo[];
  artifacts: Artifact[];
  onSelectMemo: (memo: Memo) => void;
}

export const MemoDirectory: React.FC<MemoDirectoryProps> = ({ memos, artifacts, onSelectMemo }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredMemos = useMemo(() => {
    return memos.filter(memo => {
      const matchesSearch = memo.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            memo.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || memo.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [memos, searchTerm, filterType]);

  const getArtifactName = (id: string) => {
    const art = artifacts.find(a => a.id === id);
    return art ? art.name : 'Unknown Source';
  };

  const getMemoTypeInfo = (type: string) => {
      return MEMO_TYPES.find(t => t.id === type);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-950">
            <h3 className="font-bold text-zinc-200 text-sm uppercase tracking-wider flex items-center gap-2">
                <Book size={16} className="text-amber-500"/>
                Annotations
            </h3>
        </div>

        {/* Search & Filter */}
        <div className="p-3 space-y-3 border-b border-zinc-800 bg-zinc-950/50">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 text-zinc-500" size={14} />
                <Input 
                    className="pl-8 h-9 bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500/50" 
                    placeholder="Search memos..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <select 
                className="w-full h-8 bg-zinc-950 border border-zinc-800 rounded text-xs px-2 text-zinc-300 focus:outline-none"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
            >
                <option value="all">All Types</option>
                {MEMO_TYPES.map(t => (
                    <option key={t.id} value={t.id}>[{t.symbol}] {t.label}</option>
                ))}
            </select>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredMemos.length === 0 && (
                <div className="text-center py-8 text-zinc-500 text-xs italic">
                    No annotations found.
                </div>
            )}
            
            {filteredMemos.map(memo => {
                const typeInfo = getMemoTypeInfo(memo.type);
                return (
                    <div 
                        key={memo.id}
                        onClick={() => onSelectMemo(memo)}
                        className="group bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-3 hover:bg-zinc-800 hover:border-zinc-700 cursor-pointer transition-all shadow-sm relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: typeInfo?.color || '#3f3f46' }} />
                        <div className="flex items-start justify-between gap-2 mb-2 pl-2">
                            <MemoTypeBadge type={memo.type} className="text-[9px] h-5" />
                            <span className="text-[9px] text-zinc-600 font-mono shrink-0">
                                #{memo.number}
                            </span>
                        </div>

                        <div className="pl-2 mb-2">
                             <span className="font-semibold text-xs text-zinc-200 line-clamp-1">{memo.title}</span>
                        </div>

                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-2 pl-2">
                            {memo.content}
                        </p>

                        <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-800/50 pl-2">
                            <FileText size={10} className="text-zinc-600" />
                            <span className="text-[10px] text-zinc-500 truncate max-w-[180px]">
                                {memo.relatedIds.length > 0 ? getArtifactName(memo.relatedIds[0]) : 'General Project'}
                            </span>
                            <span className="ml-auto text-[9px] text-zinc-600">
                                {new Date(memo.createdAt).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit'})}
                            </span>
                        </div>
                    </div>
                )
            })}
        </div>
    </div>
  );
};