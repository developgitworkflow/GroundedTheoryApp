import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Artifact, Coding, Code, LayerType, Memo, ResearchTeam, Researcher, Vote, VoteStatus, Participant, MEMO_TYPES, MemoCategory } from '../types';
import { suggestCodes } from '../services/geminiService';
import { Wand2, Loader2, StickyNote, MessageSquare, Save, X, Search, Plus, Tag, Activity, Command as CommandIcon, FolderTree, GitPullRequest, Info, ChevronRight, Edit2, User, Eye, Layers } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from './ui/command';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ConsensusPanel } from './ConsensusPanel';
import { ArtifactPropertiesPanel } from './ArtifactPropertiesPanel';
import { Textarea } from './ui/textarea';
import { MemoTypeBadge, MemoTypeSelector, getMemoIcon } from './MemoComponents';

interface ArtifactViewProps {
  artifact: Artifact;
  codings: Coding[];
  codes: Code[];
  memos?: Memo[];
  researchTeam?: ResearchTeam;
  activeResearcherId?: string;
  votes?: Vote[];
  onVote?: (criterionId: string, status: VoteStatus, comment?: string) => void;
  layersVisible: Record<LayerType, boolean>;
  onAddCoding: (coding: Omit<Coding, 'id'>) => void;
  onCreateCode: (name: string) => Promise<Code>;
  onAddMemo?: (snippet: string, content: string, range?: {start: number, end: number}, type?: MemoCategory) => void;
  onEditMemo?: (memo: Memo) => void;
  onUpdateMemo?: (id: string, content: string) => void;
  highlightedMemoId?: string;
  selectedCodeId?: string | null;
  onClearSelection?: () => void;
  onUpdateArtifact?: (id: string, updates: Partial<Artifact>) => void;
  participants?: Participant[];
}

interface HoverState {
    type: 'code' | 'memo';
    data: Code | Memo;
    relatedData?: any; 
    isPinned?: boolean;
    isEditing?: boolean;
}

export const ArtifactView: React.FC<ArtifactViewProps> = ({ 
  artifact, 
  codings, 
  codes, 
  memos = [],
  researchTeam,
  activeResearcherId,
  votes,
  onVote,
  layersVisible,
  onAddCoding,
  onCreateCode,
  onAddMemo,
  onEditMemo,
  onUpdateMemo,
  highlightedMemoId,
  selectedCodeId,
  onClearSelection,
  onUpdateArtifact,
  participants = []
}) => {
  const [selection, setSelection] = useState<{start: number, end: number, text: string, rect: DOMRect} | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedCodesList, setSuggestedCodesList] = useState<string[]>([]);
  const [memoInput, setMemoInput] = useState('');
  const [memoType, setMemoType] = useState<MemoCategory>('descriptive');
  const [showMemoInput, setShowMemoInput] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  
  const [activeHover, setActiveHover] = useState<HoverState | null>(null);
  const [editContent, setEditContent] = useState(''); 

  const containerRef = useRef<HTMLDivElement>(null);
  const memoRefs = useRef<Record<string, HTMLElement | null>>({});
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close context menu on global click
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Scroll to memo if highlighted
  useEffect(() => {
    if (highlightedMemoId) {
       scrollToMemo(highlightedMemoId);
    }
  }, [highlightedMemoId]);

  const scrollToMemo = (id: string) => {
      const segmentEl = document.getElementById(`memo-segment-${id}`);
      if (segmentEl) {
          segmentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (memoRefs.current[id]) {
          memoRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
  };

  const activeCodings = useMemo(() => {
    if (!layersVisible[LayerType.OPEN_CODING] && !layersVisible[LayerType.CATEGORIES]) return [];
    let relevant = codings.filter(c => c.artifactId === artifact.id);
    if (selectedCodeId) {
        relevant = relevant.filter(c => c.codeId === selectedCodeId);
    }
    return relevant;
  }, [codings, artifact.id, layersVisible, selectedCodeId]);

  const paragraphs = useMemo(() => {
    let currentIndex = 0;
    return artifact.content.split('\n').map((text, index) => {
        const start = currentIndex;
        const end = start + text.length;
        currentIndex = end + 1; 
        return { 
            id: index + 1,
            text, 
            start, 
            end 
        };
    });
  }, [artifact.content]);

  // --- Hover Logic ---
  const handleCodeHover = (code: Code) => {
      if (activeHover?.isPinned) return;
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

      const childIds = codes.filter(c => c.parentId === code.id).map(c => c.id);
      const relevantCodings = codings.filter(c => c.codeId === code.id || childIds.includes(c.codeId));
      const usageCount = relevantCodings.length;
      const contributorIds = Array.from(new Set(relevantCodings.map(c => c.researcherId).filter(Boolean)));
      const contributors = researchTeam 
        ? researchTeam.researchers.filter(r => contributorIds.includes(r.id))
        : [];
      
      const parentCode = codes.find(c => c.id === code.parentId);

      setActiveHover({
          type: 'code',
          data: code,
          relatedData: { usageCount, contributors, parentCode }
      });
  };

  const handleMemoHover = (memo: Memo) => {
      if (activeHover?.isPinned && activeHover.data.id === memo.id) return;
      if (activeHover?.isPinned) return;
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

      const author = researchTeam?.researchers.find(r => r.id === memo.authorId);
      const typeInfo = MEMO_TYPES.find(t => t.id === memo.type);
      setActiveHover({
          type: 'memo',
          data: memo,
          relatedData: { author, typeInfo }
      });
  };

  const handleLeaveHover = () => {
      if (activeHover?.isPinned) return;
      hoverTimeoutRef.current = setTimeout(() => {
          setActiveHover(null);
      }, 400); 
  };

  const handleLensEnter = () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const handleLensLeave = () => {
      if (activeHover?.isPinned) return;
      hoverTimeoutRef.current = setTimeout(() => {
          setActiveHover(null);
      }, 400);
  };

  const handleMemoClick = (memo: Memo) => {
      const author = researchTeam?.researchers.find(r => r.id === memo.authorId);
      const typeInfo = MEMO_TYPES.find(t => t.id === memo.type);
      setActiveHover({
          type: 'memo',
          data: memo,
          relatedData: { author, typeInfo },
          isPinned: true
      });
      scrollToMemo(memo.id);
  };

  const handleCloseLens = () => {
      setActiveHover(null);
  };

  const startEditing = () => {
      if (activeHover?.type === 'memo') {
          setEditContent((activeHover.data as Memo).content);
          setActiveHover(prev => prev ? { ...prev, isEditing: true, isPinned: true } : null);
      }
  };

  const saveEditing = () => {
      if (activeHover?.type === 'memo' && onUpdateMemo) {
          onUpdateMemo((activeHover.data as Memo).id, editContent);
          setActiveHover(prev => prev ? { ...prev, isEditing: false, data: { ...prev.data, content: editContent } as Memo } : null);
      }
  };

  const cancelEditing = () => {
      setActiveHover(prev => prev ? { ...prev, isEditing: false } : null);
  };

  // --- Selection Logic ---
  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;

    const range = sel.getRangeAt(0);
    const text = sel.toString().trim();
    if (!text) return;
    
    // Walk up to find paragraph container to get context
    let currentNode: Node | null = range.startContainer;
    let paraIndexAttr: string | null = null;
    
    while (currentNode && currentNode !== containerRef.current) {
        if (currentNode instanceof HTMLElement && currentNode.dataset.paraIndex) {
            paraIndexAttr = currentNode.dataset.paraIndex;
            break;
        }
        currentNode = currentNode.parentNode;
    }

    if (paraIndexAttr) {
        const pIdx = parseInt(paraIndexAttr);
        const para = paragraphs[pIdx];
        
        const startInPara = para.text.indexOf(text); 
        if (startInPara !== -1) {
            const absStart = para.start + startInPara;
            const absEnd = absStart + text.length;
            const rect = range.getBoundingClientRect();
            
            setSelection({ 
                start: absStart, 
                end: absEnd, 
                text,
                rect 
            });
            setShowMemoInput(false);
            setMemoType('descriptive');
            setSuggestedCodesList([]);
        } else {
            console.warn("Could not map selection to source accurately.");
            setSelection(null);
        }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
      const sel = window.getSelection();
      // Only show custom menu if we have a valid selection in the app state
      if (sel && !sel.isCollapsed && selection) {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY });
      }
  };

  const clearSelection = () => {
      setSelection(null);
  };

  // --- Action Handlers ---
  const handleGetSuggestions = async () => {
    if (!selection) return;
    setIsSuggesting(true);
    const suggestions = await suggestCodes(selection.text);
    setSuggestedCodesList(suggestions);
    setIsSuggesting(false);
  };

  const applyCode = async (codeName: string, existingCodeId?: string) => {
    if (!selection) return;
    let codeId = existingCodeId;
    if (!codeId) {
        const existing = codes.find(c => c.name.toLowerCase() === codeName.toLowerCase());
        if (existing) {
            codeId = existing.id;
        } else {
            const newCode = await onCreateCode(codeName);
            codeId = newCode.id;
        }
    }
    if (codeId) {
        onAddCoding({
            artifactId: artifact.id,
            codeId: codeId,
            start: selection.start,
            end: selection.end,
            textSnippet: selection.text
        });
    }
    clearSelection();
  };

  const saveMemo = () => {
    if (!selection || !onAddMemo) return;
    onAddMemo(selection.text, memoInput, { start: selection.start, end: selection.end }, memoType);
    setMemoInput('');
    clearSelection();
  };

  return (
    <div className="relative h-full flex flex-col bg-[#1e1e1e]" ref={containerRef}>
        
        {/* Consensus Panel */}
        {isReviewOpen && researchTeam && activeResearcherId && votes && onVote && (
            <ConsensusPanel 
                artifact={artifact}
                team={researchTeam}
                activeResearcherId={activeResearcherId}
                votes={votes}
                onVote={onVote}
                onClose={() => setIsReviewOpen(false)}
            />
        )}

        {/* Properties Panel */}
        {isPropertiesOpen && researchTeam && onUpdateArtifact && (
            <ArtifactPropertiesPanel
                artifact={artifact}
                participants={participants}
                researchers={researchTeam.researchers}
                onUpdate={(updates) => onUpdateArtifact(artifact.id, updates)}
                onClose={() => setIsPropertiesOpen(false)}
            />
        )}

        {/* --- INSPECTOR LENS --- */}
        <div 
            className={cn(
                "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out transform",
                activeHover ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 scale-95 pointer-events-none"
            )}
            onMouseEnter={handleLensEnter}
            onMouseLeave={handleLensLeave}
        >
            {activeHover && (
                <div className={cn(
                    "bg-zinc-950/90 backdrop-blur-xl border rounded-xl shadow-2xl p-0 w-[500px] overflow-hidden flex flex-col ring-1 ring-white/10 relative",
                    activeHover.type === 'code' ? "border-zinc-800" : "border-amber-900/50"
                )}>
                    {activeHover.isPinned && (
                        <button onClick={handleCloseLens} className="absolute top-2 right-2 text-zinc-500 hover:text-white z-10 p-1 bg-black/20 rounded-full">
                            <X size={12} />
                        </button>
                    )}
                    <div className="h-1 w-full" style={{ backgroundColor: activeHover.type === 'code' ? (activeHover.data as Code).color : (activeHover.relatedData.typeInfo?.color || '#f59e0b') }} />
                    
                    {activeHover.type === 'code' && (
                        <div className="p-4 flex gap-4">
                            <div className="shrink-0 flex flex-col items-center gap-2">
                                <div className="h-12 w-12 rounded-lg flex items-center justify-center border border-zinc-800 bg-zinc-900/50 shadow-inner">
                                    {(activeHover.data as Code).kind === 'category' ? 
                                        <FolderTree size={24} style={{ color: (activeHover.data as Code).color }} /> : 
                                        <Tag size={24} style={{ color: (activeHover.data as Code).color }} />
                                    }
                                </div>
                                {(activeHover.data as Code).isCore && <Badge className="text-[9px] h-4 bg-yellow-500/20 text-yellow-500 border-yellow-500/30">CORE</Badge>}
                            </div>
                            <div className="flex-1 space-y-1">
                                {activeHover.relatedData.parentCode && (
                                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                                        <FolderTree size={10} /> 
                                        {activeHover.relatedData.parentCode.name}
                                        <ChevronRight size={10} />
                                    </div>
                                )}
                                <h3 className="font-bold text-lg text-zinc-100 leading-none">{(activeHover.data as Code).name}</h3>
                                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                                    {(activeHover.data as Code).description || "No definition provided."}
                                </p>
                            </div>
                            <div className="shrink-0 flex flex-col items-end justify-between border-l border-zinc-800 pl-4 py-1">
                                <div className="text-center">
                                    <div className="text-xl font-mono font-bold text-zinc-200">{activeHover.relatedData.usageCount}</div>
                                    <div className="text-[9px] text-zinc-500 uppercase tracking-wider">Refs</div>
                                </div>
                                <div className="flex -space-x-1.5 mt-2">
                                    {activeHover.relatedData.contributors.length > 0 ? activeHover.relatedData.contributors.map((r: Researcher) => (
                                        <Avatar key={r.id} className="h-5 w-5 border border-zinc-900 ring-1 ring-zinc-800">
                                            <AvatarFallback style={{ backgroundColor: r.color, color: 'white', fontSize: '8px' }}>{r.initials}</AvatarFallback>
                                        </Avatar>
                                    )) : <span className="text-[10px] text-zinc-600">-</span>}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeHover.type === 'memo' && (
                        <div className="p-4 flex gap-4">
                            <div className="shrink-0 flex flex-col items-center gap-2">
                                <div className="h-12 w-12 rounded-lg flex items-center justify-center border border-zinc-800 bg-zinc-900/50 shadow-inner">
                                    <MemoTypeBadge type={(activeHover.data as Memo).type} collapsed variant="subtle" className="border-none bg-transparent" />
                                </div>
                                <Badge variant="outline" className="text-[9px] h-4 border-zinc-800 text-zinc-500">
                                    #{(activeHover.data as Memo).number}
                                </Badge>
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                    <MemoTypeBadge type={(activeHover.data as Memo).type} className="text-[10px] h-5" />
                                    <span className="text-[10px] text-zinc-600">
                                        {new Date((activeHover.data as Memo).createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                
                                {activeHover.isEditing ? (
                                    <div className="space-y-2 animate-in fade-in">
                                        <Textarea 
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="min-h-[80px] bg-black/20 text-xs border-amber-500/50 focus-visible:ring-amber-500"
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button size="xs" variant="ghost" onClick={cancelEditing} className="h-6">Cancel</Button>
                                            <Button size="xs" variant="brand" onClick={saveEditing} className="h-6 bg-amber-600 hover:bg-amber-700">Save</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="font-bold text-sm text-zinc-200 leading-snug italic cursor-text hover:text-white transition-colors" onClick={startEditing}>
                                            "{(activeHover.data as Memo).content}"
                                        </h3>
                                        <div className="flex justify-end">
                                            <Button 
                                                size="xs" 
                                                variant="outline" 
                                                onClick={startEditing} 
                                                className="h-6 text-[10px] gap-1 hover:text-white border-zinc-800"
                                            >
                                                <Edit2 size={10} /> Edit
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="shrink-0 flex flex-col items-end border-l border-zinc-800 pl-4 py-1">
                                {activeHover.relatedData.author ? (
                                    <div className="flex flex-col items-center gap-1">
                                        <Avatar className="h-8 w-8 border border-zinc-900 ring-1 ring-zinc-800">
                                            <AvatarFallback style={{ backgroundColor: activeHover.relatedData.author.color, color: 'white', fontSize: '10px' }}>
                                                {activeHover.relatedData.author.initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-[9px] text-zinc-500">{activeHover.relatedData.author.name.split(' ')[0]}</span>
                                    </div>
                                ) : <User size={16} className="text-zinc-600"/>}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Custom Context Menu */}
        {contextMenu && (
            <div 
                className="fixed z-[60] bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl p-1.5 min-w-[180px] animate-in fade-in zoom-in-95 flex flex-col gap-1"
                style={{ top: contextMenu.y, left: contextMenu.x }}
                onContextMenu={(e) => e.preventDefault()}
            >
                <div className="px-2 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Selection Actions
                </div>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        handleGetSuggestions();
                        setContextMenu(null);
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white rounded-md flex items-center gap-2 transition-colors"
                >
                    <Wand2 size={14} className="text-purple-400" />
                    AI Suggest Codes
                </button>
                 <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowMemoInput(true);
                        setContextMenu(null);
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white rounded-md flex items-center gap-2 transition-colors"
                >
                    <MessageSquare size={14} className="text-blue-400" />
                    Attach Memo
                </button>
                <div className="h-px bg-zinc-800 my-0.5" />
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        setContextMenu(null);
                        setSelection(null);
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-red-400 rounded-md flex items-center gap-2 transition-colors"
                >
                    <X size={14} />
                    Dismiss Selection
                </button>
            </div>
        )}

        {/* Helper Toolbar */}
        {selection && !contextMenu && (
            <div 
                className={cn(
                    "fixed z-50 bg-zinc-950 border border-zinc-700 shadow-2xl rounded-lg animate-in fade-in zoom-in-95 flex flex-col overflow-hidden",
                    showMemoInput ? "w-[400px]" : "w-[340px]"
                )}
                style={{ 
                    top: Math.min(window.innerHeight - 450, Math.max(10, selection.rect.top - 200)), 
                    left: Math.min(window.innerWidth - 420, Math.max(10, selection.rect.left)) 
                }}
            >
                <div className="flex items-center justify-between p-2 px-3 border-b border-zinc-800 bg-zinc-950">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <CommandIcon size={12} className="text-blue-500"/> Coding Palette
                    </span>
                    <button onClick={clearSelection} className="text-zinc-500 hover:text-white"><X size={14} /></button>
                </div>

                <div className="p-1">
                     <div className="px-3 py-2 text-xs text-zinc-300 italic border-l-2 border-blue-500 ml-1 mb-2 line-clamp-2 bg-zinc-900/50 rounded-r">
                        "{selection.text}"
                     </div>

                     {!showMemoInput && (
                         <div className="flex gap-2 px-2 mb-2">
                            <Button 
                                size="xs" 
                                variant="secondary" 
                                onClick={handleGetSuggestions} 
                                disabled={isSuggesting}
                                className="flex-1 justify-center gap-2 bg-indigo-900/20 hover:bg-indigo-900/40 text-indigo-200 border border-indigo-500/30"
                            >
                                {isSuggesting ? <Loader2 className="animate-spin" size={12}/> : <Wand2 size={12}/>}
                                {isSuggesting ? 'Thinking...' : 'AI Suggest'}
                            </Button>
                            <Button 
                                size="xs" 
                                variant="outline" 
                                onClick={() => setShowMemoInput(true)}
                                className="justify-center gap-2 border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                            >
                                <MessageSquare size={12}/>
                                Memo
                            </Button>
                        </div>
                     )}

                     {!showMemoInput && (
                         <Command className="border-none bg-transparent">
                             <CommandInput placeholder="Search codebook..." autoFocus />
                             <CommandList>
                                 <CommandEmpty className="py-2 text-xs text-zinc-500">No matching codes.</CommandEmpty>
                                 
                                 {suggestedCodesList.length > 0 && (
                                     <CommandGroup heading="AI Suggestions">
                                         {suggestedCodesList.map(c => (
                                             <CommandItem key={c} value={c} onSelect={() => applyCode(c)}>
                                                 <Wand2 size={10} className="mr-2 text-indigo-400" /> {c}
                                             </CommandItem>
                                         ))}
                                     </CommandGroup>
                                 )}

                                 {/* Categories Group */}
                                 {codes.some(c => c.kind === 'category') && (
                                     <CommandGroup heading="Structural Categories">
                                         {codes.filter(c => c.kind === 'category').map(code => (
                                             <CommandItem key={code.id} value={code.name} onSelect={() => applyCode(code.name, code.id)}>
                                                 <FolderTree size={12} className="mr-2 text-amber-500/80" /> 
                                                 <span className="font-medium text-amber-100/80 flex-1">{code.name}</span>
                                                 {code.isCore && <Badge variant="outline" className="ml-auto text-[8px] h-3 px-1 border-amber-500/50 text-amber-500">CORE</Badge>}
                                             </CommandItem>
                                         ))}
                                     </CommandGroup>
                                 )}

                                 {/* Codes Group */}
                                 {codes.some(c => c.kind === 'code') && (
                                     <CommandGroup heading="Open Codes">
                                         {codes.filter(c => c.kind === 'code').map(code => (
                                             <CommandItem key={code.id} value={code.name} onSelect={() => applyCode(code.name, code.id)}>
                                                 <Tag size={12} className="mr-2" style={{ color: code.color }} />
                                                 <span>{code.name}</span>
                                             </CommandItem>
                                         ))}
                                     </CommandGroup>
                                 )}

                                 <CommandGroup heading="Actions">
                                     <CommandItem onSelect={() => {
                                         const name = prompt("Name for new code:");
                                         if(name) applyCode(name);
                                     }}>
                                         <Plus size={12} className="mr-2" /> Create new code manually...
                                     </CommandItem>
                                 </CommandGroup>
                             </CommandList>
                         </Command>
                     )}

                     {showMemoInput && (
                        <div className="space-y-3 px-2 pb-2">
                             <div className="flex items-center justify-between">
                                <span className="text-xs text-zinc-400 font-medium flex items-center gap-2">
                                    <MemoTypeBadge type={memoType} className="text-[10px] h-5" />
                                </span>
                                <button onClick={() => setShowMemoInput(false)} className="text-[10px] text-zinc-500 hover:text-zinc-300">Back</button>
                             </div>
                             
                             <textarea 
                                className="w-full h-20 bg-black/20 border border-zinc-700 rounded p-2 text-xs text-zinc-200 resize-none focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 mb-2"
                                placeholder="Note your observation here..."
                                value={memoInput}
                                onChange={(e) => setMemoInput(e.target.value)}
                                autoFocus
                            />

                             <div className="space-y-1">
                                 <label className="text-[9px] font-bold uppercase text-zinc-500">Classify Annotation</label>
                                 <MemoTypeSelector selected={memoType} onSelect={setMemoType} />
                             </div>

                            <Button size="xs" variant="brand" className="w-full" onClick={saveMemo}>Save Annotation</Button>
                        </div>
                     )}
                </div>
            </div>
        )}

        {/* --- Main Document Browser --- */}
        <div className="flex-1 flex overflow-hidden">
            
            {/* Editor Area (Sanitized View) */}
            <div 
                className="flex-1 overflow-y-auto min-w-[300px]" 
                onMouseUp={handleMouseUp}
                onContextMenu={handleContextMenu}
            >
                <div className="min-h-full pb-20">
                    
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-[#1e1e1e]/95 backdrop-blur border-b border-zinc-800 px-8 py-3 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                            <h2 className="font-semibold text-zinc-200">{artifact.name}</h2>
                            {selectedCodeId && (
                                <Badge variant="secondary" className="bg-blue-900/30 text-blue-200 border-blue-800 gap-2 hover:bg-blue-900/50 pr-1">
                                    <span className="flex items-center gap-1">
                                        <Tag size={10} />
                                        Filter: {codes.find(c => c.id === selectedCodeId)?.name}
                                    </span>
                                    <button onClick={onClearSelection} className="hover:text-white p-0.5 rounded-full hover:bg-blue-800">
                                        <X size={10} />
                                    </button>
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                            <Button
                                variant={isPropertiesOpen ? "secondary" : "outline"}
                                size="sm"
                                className="h-7 text-xs gap-2"
                                onClick={() => setIsPropertiesOpen(!isPropertiesOpen)}
                            >
                                <Info size={14} /> Properties
                            </Button>
                            <Button 
                                variant={isReviewOpen ? "brand" : "outline"} 
                                size="sm" 
                                className="h-7 text-xs gap-2"
                                onClick={() => setIsReviewOpen(!isReviewOpen)}
                            >
                                <GitPullRequest size={14} /> Review Status
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="max-w-3xl mx-auto mt-6 bg-[#252526] shadow-2xl border border-zinc-800 min-h-[800px] mb-24">
                        {paragraphs.map((para, index) => {
                            const paraCodings = activeCodings.filter(c => c.start < para.end && c.end > para.start);
                            const paraMemos = memos.filter(m => 
                                m.relatedIds.includes(artifact.id) && (
                                    (m.segment && m.segment.start < para.end && m.segment.end > para.start) ||
                                    (!m.segment && (m.type === 'observational' || m.type === 'descriptive') && para.text.includes(m.title))
                                )
                            );

                            // Calculate unique stripes for side margin
                            const stripesToRender: { code: Code, isCategoryAgg: boolean }[] = [];
                            if (layersVisible[LayerType.OPEN_CODING]) {
                                const uniqueCodesInPara = Array.from(new Set(paraCodings.map(c => c.codeId)))
                                    .map(id => codes.find(c => c.id === id))
                                    .filter(Boolean) as Code[];
                                uniqueCodesInPara.forEach(c => stripesToRender.push({ code: c, isCategoryAgg: false }));
                            }
                            if (layersVisible[LayerType.CATEGORIES]) {
                                const parents = new Set<string>();
                                paraCodings.forEach(c => {
                                    const code = codes.find(x => x.id === c.codeId);
                                    if (code && code.parentId) parents.add(code.parentId);
                                    if (code && code.kind === 'category') parents.add(code.id);
                                });
                                parents.forEach(pid => {
                                    const cat = codes.find(x => x.id === pid);
                                    if (cat) stripesToRender.push({ code: cat, isCategoryAgg: true });
                                });
                            }
                            const uniqueStripes = stripesToRender.filter((v,i,a) => a.findIndex(t => t.code.id === v.code.id) === i);

                            return (
                                <div key={para.id} className="group flex hover:bg-black/5" data-para-index={index}>
                                    {/* Gutter */}
                                    <div className="w-12 flex-shrink-0 bg-[#1e1e1e] border-r border-zinc-800 flex flex-col items-center pt-2 gap-2 select-none">
                                        <span className="text-[10px] text-zinc-600 font-mono">{para.id}</span>
                                        {paraMemos.length > 0 && layersVisible[LayerType.THEORY_MEMOS] && (
                                            <button 
                                                onClick={() => handleMemoClick(paraMemos[0])}
                                                className="hover:scale-110 transition-transform focus:outline-none flex flex-col items-center group/icon"
                                                ref={el => { memoRefs.current[paraMemos[0].id] = el }}
                                                onMouseEnter={() => handleMemoHover(paraMemos[0])}
                                                onMouseLeave={handleLeaveHover}
                                            >
                                                <MemoTypeBadge type={paraMemos[0].type} collapsed variant="subtle" className="border-none bg-transparent" />
                                                <span className="text-[8px] text-zinc-500 font-bold -mt-0.5">#{paraMemos[0].number}</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Margin Stripes */}
                                    <div className="w-6 border-r border-zinc-800 bg-[#2d2d2d] flex flex-row relative select-none">
                                        {uniqueStripes.map(({ code, isCategoryAgg }) => (
                                            <div 
                                                key={code.id}
                                                className={cn("flex-1 h-full hover:brightness-125 transition-all cursor-help relative", isCategoryAgg ? "w-3" : "w-1")}
                                                style={{ backgroundColor: code.color, opacity: isCategoryAgg ? 0.8 : 1 }}
                                                onMouseEnter={() => handleCodeHover(code)}
                                                onMouseLeave={handleLeaveHover}
                                            />
                                        ))}
                                    </div>

                                    {/* Sanitized Content */}
                                    <div className="flex-1 px-8 py-2 font-serif text-lg text-zinc-300 leading-relaxed relative selection:bg-blue-500/30">
                                        <HighlightedText 
                                            text={para.text}
                                            paraStart={para.start}
                                            codings={paraCodings}
                                            codes={codes}
                                            allCodings={codings}
                                            memos={paraMemos}
                                            researchTeam={researchTeam}
                                            layersVisible={layersVisible}
                                            onHoverCode={handleCodeHover}
                                            onHoverMemo={handleMemoHover}
                                            onEditMemo={handleMemoClick}
                                            onLeaveHover={handleLeaveHover}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

// Sanitized Text Renderer with Syntax Hiding
const HighlightedText: React.FC<{
    text: string;
    paraStart: number;
    codings: Coding[];
    codes: Code[];
    allCodings: Coding[];
    memos?: Memo[];
    researchTeam?: ResearchTeam;
    layersVisible: Record<LayerType, boolean>;
    onHoverCode: (code: Code) => void;
    onHoverMemo: (memo: Memo) => void;
    onEditMemo: (memo: Memo) => void;
    onLeaveHover: () => void;
}> = ({ text, paraStart, codings, codes, allCodings, memos = [], researchTeam, layersVisible, onHoverCode, onHoverMemo, onEditMemo, onLeaveHover }) => {
    
    // Split logic for coding highlights (standard)
    const points = new Set<number>([0, text.length]);
    codings.forEach(c => {
        const relStart = Math.max(0, c.start - paraStart);
        const relEnd = Math.min(text.length, c.end - paraStart);
        if (relStart < text.length) points.add(relStart);
        if (relEnd > 0) points.add(relEnd);
    });
    if (layersVisible[LayerType.THEORY_MEMOS]) {
        memos.forEach(m => {
            if (m.segment) {
                const relStart = Math.max(0, m.segment.start - paraStart);
                const relEnd = Math.min(text.length, m.segment.end - paraStart);
                if (relStart < text.length) points.add(relStart);
                if (relEnd > 0) points.add(relEnd);
            }
        });
    }

    const sortedPoints = Array.from(points).sort((a, b) => a - b);
    const segments: React.ReactNode[] = [];

    for (let i = 0; i < sortedPoints.length - 1; i++) {
        const segStart = sortedPoints[i];
        const segEnd = sortedPoints[i+1];
        const segText = text.substring(segStart, segEnd);
        const segMidGlobal = paraStart + segStart + (segEnd - segStart) / 2;
        
        // --- Markdown Sanitization Logic ---
        // Regex to match Markdown syntax tokens: **, *, __, _, #, >, []
        // We split the segment text further by these tokens.
        const mdParts = segText.split(/(\*\*|__|\*|_|#|\[|\]|>)/g);
        
        const renderedSegText = mdParts.map((part, idx) => {
            if (/^(\*\*|__|\*|_|#|\[|\]|>)$/.test(part)) {
                // Syntax Token: Hide it visually but keep it in DOM for offset integrity
                return <span key={idx} className="text-transparent text-[0px] select-none">{part}</span>;
            }
            return <span key={idx}>{part}</span>;
        });

        // --- Highlight Logic ---
        const activeForSegment = codings.filter(c => c.start <= segMidGlobal && c.end >= segMidGlobal);
        const activeMemosForSegment = layersVisible[LayerType.THEORY_MEMOS] ? memos.filter(m => (m.segment && m.segment.start <= segMidGlobal && m.segment.end >= segMidGlobal)) : [];
        const legacyMemos = layersVisible[LayerType.THEORY_MEMOS] && activeMemosForSegment.length === 0 ? memos.filter(m => !m.segment && m.title === segText) : [];
        const allActiveMemos = [...activeMemosForSegment, ...legacyMemos];

        let content = <>{renderedSegText}</>;
        
        // Memo highlight
        if (allActiveMemos.length > 0) {
             const primaryMemo = allActiveMemos[0];
             const typeInfo = MEMO_TYPES.find(t => t.id === primaryMemo.type);
             content = (
                <span 
                    id={`memo-segment-${primaryMemo.id}`}
                    className="rounded-sm px-0.5 cursor-pointer hover:brightness-110 transition-colors"
                    style={{ backgroundColor: (typeInfo?.color || '#f59e0b') + '30' }}
                    onMouseEnter={() => onHoverMemo(primaryMemo)}
                    onMouseLeave={onLeaveHover}
                    onClick={() => onEditMemo(primaryMemo)}
                >
                    {content}
                </span>
             );
        }

        // Code highlight
        const showOpenCodes = layersVisible[LayerType.OPEN_CODING];
        const showCategories = layersVisible[LayerType.CATEGORIES];

        if (activeForSegment.length > 0 && (showOpenCodes || showCategories)) {
            const coding = activeForSegment[0];
            let codeRef = codes.find(c => c.id === coding.codeId);
            if (!showOpenCodes && showCategories && codeRef?.parentId) {
                const parent = codes.find(c => c.id === codeRef!.parentId);
                if (parent) codeRef = parent;
            }
            if (codeRef) {
                const color = codeRef.color;
                content = (
                    <span 
                        className="transition-colors hover:brightness-110 cursor-pointer rounded-sm px-0.5 box-decoration-clone inline-block"
                        style={{ backgroundColor: `${color}40`, borderBottom: `2px solid ${color}` }}
                        onMouseEnter={() => onHoverCode(codeRef!)}
                        onMouseLeave={onLeaveHover}
                    >
                        {content}
                    </span>
                );
            }
        }

        // Memo Icon
        if (allActiveMemos.length > 0) {
            const endingMemos = allActiveMemos.filter(m => (m.segment && Math.min(text.length, m.segment.end - paraStart) === segEnd) || (!m.segment && m.title === segText));
            if (endingMemos.length > 0) {
                const primaryMemo = endingMemos[0];
                const typeInfo = MEMO_TYPES.find(t => t.id === primaryMemo.type);
                const Icon = getMemoIcon(primaryMemo.type);
                 segments.push(
                    <span key={`seg-${i}`} className={cn("inline-flex items-baseline", activeForSegment.length === 0 && "rounded")} style={activeForSegment.length === 0 ? { backgroundColor: (typeInfo?.color || '#f59e0b') + '10'} : {}}>
                        {activeForSegment.length === 0 ? 
                            <span 
                                id={`memo-segment-${primaryMemo.id}`}
                                className="cursor-help"
                                onMouseEnter={() => onHoverMemo(primaryMemo)}
                                onMouseLeave={onLeaveHover}
                                onClick={() => onEditMemo(primaryMemo)}
                            >
                                {renderedSegText}
                            </span> 
                            : content}
                        <sup className="ml-0.5 inline-flex align-top" style={{ transform: 'translateY(-2px)' }}>
                            <span 
                                className="flex items-center justify-center text-white rounded-full h-3 w-3 cursor-help hover:brightness-110 transition-colors"
                                style={{ backgroundColor: typeInfo?.color || '#f59e0b' }}
                                onMouseEnter={() => onHoverMemo(primaryMemo)}
                                onMouseLeave={onLeaveHover}
                                onClick={() => onEditMemo(primaryMemo)}
                            >
                                <Icon size={8} className="stroke-[3px]" />
                            </span>
                        </sup>
                    </span>
                )
            } else {
                 segments.push(<span key={`seg-${i}`}>{content}</span>);
            }
        } else {
            segments.push(<span key={`seg-${i}`}>{content}</span>);
        }
    }
    return <>{segments}</>;
};