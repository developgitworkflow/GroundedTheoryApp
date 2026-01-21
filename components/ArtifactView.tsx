import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Artifact, Coding, Code, LayerType, Memo } from '../types';
import { suggestCodes } from '../services/geminiService';
import { Wand2, Loader2, StickyNote, MessageSquare, GripVertical, AlertTriangle, Save, X, Search, Plus, Tag, Hash, CalendarDays, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { HoverCard, HoverCardTrigger, HoverCardContent } from './ui/hover-card';
import { Badge } from './ui/badge';

interface ArtifactViewProps {
  artifact: Artifact;
  codings: Coding[];
  codes: Code[];
  memos?: Memo[];
  layersVisible: Record<LayerType, boolean>;
  onAddCoding: (coding: Omit<Coding, 'id'>) => void;
  onCreateCode: (name: string) => Promise<Code>;
  onAddMemo?: (snippet: string, content: string) => void;
  onUpdateMemo?: (id: string, content: string) => void;
}

export const ArtifactView: React.FC<ArtifactViewProps> = ({ 
  artifact, 
  codings, 
  codes, 
  memos = [],
  layersVisible,
  onAddCoding,
  onCreateCode,
  onAddMemo,
  onUpdateMemo
}) => {
  const [selection, setSelection] = useState<{start: number, end: number, text: string, rect: DOMRect} | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedCodesList, setSuggestedCodesList] = useState<string[]>([]);
  const [memoInput, setMemoInput] = useState('');
  const [showMemoInput, setShowMemoInput] = useState(false);
  const [codeSearchTerm, setCodeSearchTerm] = useState('');
  
  // Memo Editing State
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  const [editMemoContent, setEditMemoContent] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Data Preparation ---

  // Filter codings for this artifact
  const activeCodings = useMemo(() => {
    if (!layersVisible[LayerType.OPEN_CODING]) return [];
    return codings.filter(c => c.artifactId === artifact.id);
  }, [codings, artifact.id, layersVisible]);

  // Split content into paragraphs for the "Document Browser" view
  const paragraphs = useMemo(() => {
    let currentIndex = 0;
    return artifact.content.split('\n').map((text, index) => {
        const start = currentIndex;
        // split removes the \n, so length is just text.length
        const end = start + text.length;
        currentIndex = end + 1; // +1 for the newline
        return { 
            id: index + 1,
            text, 
            start, 
            end 
        };
    });
  }, [artifact.content]);

  // Filter existing codes based on search
  const filteredCodes = useMemo(() => {
      if (!codeSearchTerm) return codes;
      return codes.filter(c => c.name.toLowerCase().includes(codeSearchTerm.toLowerCase()));
  }, [codes, codeSearchTerm]);

  // Focus input on selection
  useEffect(() => {
      if (selection && inputRef.current && !showMemoInput) {
          inputRef.current.focus();
      }
  }, [selection, showMemoInput]);

  // --- Selection Logic ---

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        return;
    }

    const range = sel.getRangeAt(0);
    const text = sel.toString().trim();
    if (!text) return;
    
    // Attempt to find paragraph index from parent node
    let currentNode: Node | null = range.startContainer;
    let paraIndexAttr: string | null = null;
    
    // Traverse up to find the data-para-index
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
        
        // Use the native string search within the paragraph text which is safer contextually
        const startInPara = para.text.indexOf(text); // Naive
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
            setSuggestedCodesList([]);
            setCodeSearchTerm('');
        }
    }
  };

  const clearSelection = () => {
      setSelection(null);
      setCodeSearchTerm('');
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
        // Double check if it exists by name case-insensitive
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
    onAddMemo(selection.text, memoInput);
    setMemoInput('');
    clearSelection();
  };

  const handleEditMemoClick = (memo: Memo) => {
    setEditingMemo(memo);
    setEditMemoContent(memo.content);
  };

  const saveEditedMemo = () => {
    if (editingMemo && onUpdateMemo) {
      onUpdateMemo(editingMemo.id, editMemoContent);
    }
    setEditingMemo(null);
    setEditMemoContent('');
  };

  return (
    <div className="relative h-full flex flex-col bg-[#1e1e1e]" ref={containerRef}>
        
        {/* Helper Toolbar (Floating) for New Selection */}
        {selection && (
            <div 
                className="fixed z-50 bg-zinc-900 border border-zinc-700 shadow-2xl rounded-lg w-[340px] animate-in fade-in zoom-in-95 flex flex-col overflow-hidden"
                style={{ 
                    top: Math.min(window.innerHeight - 400, Math.max(10, selection.rect.top - 180)), 
                    left: Math.min(window.innerWidth - 360, Math.max(10, selection.rect.left)) 
                }}
            >
                <div className="flex items-center justify-between p-2 px-3 border-b border-zinc-800 bg-zinc-950">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <Tag size={12} className="text-blue-500"/> Coding Assistant
                    </span>
                    <button onClick={clearSelection} className="text-zinc-500 hover:text-white"><X size={14} /></button>
                </div>

                <div className="p-3 space-y-3">
                     {/* Quote Preview */}
                     <div className="text-xs text-zinc-300 italic border-l-2 border-blue-500 pl-3 line-clamp-2 bg-zinc-900/50 py-2 rounded-r">
                        "{selection.text}"
                     </div>

                     {/* Top Actions */}
                     {!showMemoInput && (
                         <div className="flex gap-2">
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

                     {/* Coding Interface */}
                     {!showMemoInput && (
                         <div className="space-y-3">
                             {/* Search / Input */}
                             <div className="relative">
                                <Search className="absolute left-2 top-2 text-zinc-500" size={14} />
                                <input 
                                    ref={inputRef}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-8 pr-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-zinc-600"
                                    placeholder="Find or create code..."
                                    value={codeSearchTerm}
                                    onChange={(e) => setCodeSearchTerm(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            if (filteredCodes.length > 0 && codeSearchTerm === '') {
                                                // If enter pressed with empty search, maybe select first? No, requires explicit action.
                                            } else if (filteredCodes.length === 1 && filteredCodes[0].name.toLowerCase() === codeSearchTerm.toLowerCase()) {
                                                applyCode(filteredCodes[0].name, filteredCodes[0].id);
                                            } else {
                                                applyCode(codeSearchTerm);
                                            }
                                        }
                                    }}
                                />
                             </div>

                             <div className="max-h-[220px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                                 {/* AI Suggestions Section */}
                                 {suggestedCodesList.length > 0 && (
                                     <div className="space-y-1.5">
                                         <div className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider px-1">Magic Suggestions</div>
                                         <div className="flex flex-wrap gap-1.5">
                                             {suggestedCodesList.map(c => (
                                                 <button 
                                                     key={c}
                                                     onClick={() => applyCode(c)}
                                                     className="px-2 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded text-[11px] hover:bg-indigo-500/20 transition-colors flex items-center gap-1 group"
                                                 >
                                                     <Wand2 size={10} className="opacity-50 group-hover:opacity-100" /> {c}
                                                 </button>
                                             ))}
                                         </div>
                                     </div>
                                 )}

                                 {/* Create New Action */}
                                 {codeSearchTerm && !codes.some(c => c.name.toLowerCase() === codeSearchTerm.toLowerCase()) && (
                                    <button 
                                        onClick={() => applyCode(codeSearchTerm)}
                                        className="w-full text-left px-2 py-1.5 bg-blue-600/10 border border-blue-600/30 hover:bg-blue-600/20 text-blue-300 rounded text-xs flex items-center gap-2 transition-colors"
                                    >
                                        <Plus size={12} />
                                        Create new code: <span className="font-bold">"{codeSearchTerm}"</span>
                                    </button>
                                 )}

                                 {/* Existing Codebook Section */}
                                 <div className="space-y-1">
                                     <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider px-1 flex justify-between">
                                        <span>Codebook</span>
                                        <span className="text-zinc-600">{filteredCodes.length} found</span>
                                     </div>
                                     <div className="grid grid-cols-1 gap-1">
                                         {filteredCodes.map(code => (
                                             <button 
                                                 key={code.id}
                                                 onClick={() => applyCode(code.name, code.id)}
                                                 className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 transition-colors text-left group"
                                             >
                                                 <div className="w-2.5 h-2.5 rounded-full ring-1 ring-white/10" style={{ backgroundColor: code.color }}></div>
                                                 <span className="text-xs text-zinc-300 group-hover:text-white truncate flex-1">{code.name}</span>
                                                 {code.isCore && <span className="text-[9px] text-yellow-500 bg-yellow-950/30 px-1 rounded border border-yellow-900/50">CORE</span>}
                                             </button>
                                         ))}
                                         {filteredCodes.length === 0 && !codeSearchTerm && (
                                             <div className="text-xs text-zinc-600 px-2 italic">No codes in codebook yet.</div>
                                         )}
                                     </div>
                                 </div>
                             </div>
                         </div>
                     )}

                     {/* Memo Input Mode */}
                     {showMemoInput && (
                        <div className="space-y-2 animate-in slide-in-from-right duration-200">
                             <div className="flex items-center justify-between">
                                <span className="text-xs text-zinc-400 font-medium">New Annotation</span>
                                <button onClick={() => setShowMemoInput(false)} className="text-[10px] text-zinc-500 hover:text-zinc-300">Back to Coding</button>
                             </div>
                            <textarea 
                                className="w-full h-24 bg-black/20 border border-zinc-700 rounded p-2 text-xs text-zinc-200 resize-none focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                                placeholder="Write your observation..."
                                value={memoInput}
                                onChange={(e) => setMemoInput(e.target.value)}
                                autoFocus
                            />
                            <Button size="xs" variant="brand" className="w-full bg-amber-600 hover:bg-amber-700 text-white" onClick={saveMemo}>
                                Save Annotation
                            </Button>
                        </div>
                     )}
                </div>
            </div>
        )}

        {/* Memo Editor Dialog (Centered Modal or Floating) */}
        {editingMemo && (
             <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                 <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl w-[400px] animate-in fade-in zoom-in-95 overflow-hidden">
                     <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-950">
                        <div className="flex items-center gap-2">
                             <StickyNote size={16} className="text-amber-500" />
                             <span className="font-semibold text-zinc-200 text-sm">Edit Annotation</span>
                        </div>
                        <button onClick={() => setEditingMemo(null)} className="text-zinc-500 hover:text-white"><X size={16} /></button>
                     </div>
                     <div className="p-4 space-y-4">
                         <div>
                             <label className="text-[10px] uppercase text-zinc-500 font-bold">Title/Ref</label>
                             <div className="text-zinc-300 text-sm border-b border-zinc-800 pb-1">{editingMemo.title}</div>
                         </div>
                         <div>
                             <label className="text-[10px] uppercase text-zinc-500 font-bold mb-1 block">Content</label>
                             <textarea 
                                className="w-full h-32 bg-zinc-950/50 border border-zinc-700 rounded p-2 text-sm text-zinc-200 resize-none focus:outline-none focus:border-amber-500"
                                value={editMemoContent}
                                onChange={(e) => setEditMemoContent(e.target.value)}
                             />
                         </div>
                     </div>
                     <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex justify-end gap-2">
                         <Button variant="ghost" size="sm" onClick={() => setEditingMemo(null)}>Cancel</Button>
                         <Button variant="brand" size="sm" onClick={saveEditedMemo} className="bg-amber-600 hover:bg-amber-700 text-white">Save Changes</Button>
                     </div>
                 </div>
             </div>
        )}

        {/* --- Main Document Browser --- */}
        <div className="flex-1 overflow-y-auto" onMouseUp={handleMouseUp}>
            <div className="min-h-full pb-20">
                
                {/* Document Header */}
                <div className="sticky top-0 z-10 bg-[#1e1e1e]/95 backdrop-blur border-b border-zinc-800 px-8 py-3 flex items-center justify-between shadow-sm">
                    <h2 className="font-semibold text-zinc-200">{artifact.name}</h2>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> {codings.length} Codings</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> {memos.length} Memos</span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="max-w-5xl mx-auto mt-6 bg-[#252526] shadow-2xl border border-zinc-800 min-h-[800px]">
                    {paragraphs.map((para, index) => {
                        // Find codings relevant to this paragraph
                        const paraCodings = activeCodings.filter(c => 
                            c.start < para.end && c.end > para.start
                        );
                        
                        // Find memos relevant to this paragraph
                        const paraMemos = memos.filter(m => 
                           m.relatedIds.includes(artifact.id) && 
                           paraCodings.some(c => m.title.includes(codes.find(co => co.id === c.codeId)?.name || '')) ||
                           (m.type === 'observational' && para.text.includes(m.title)) // simplified matching
                        );

                        // Unique codes for the stripe margin
                        const uniqueCodesInPara = Array.from(new Set(paraCodings.map(c => c.codeId)))
                            .map(id => codes.find(c => c.id === id))
                            .filter(Boolean) as Code[];

                        return (
                            <div 
                                key={para.id} 
                                className="group flex hover:bg-black/5"
                                data-para-index={index}
                            >
                                {/* 1. Gutter: Line Number & Memos */}
                                <div className="w-12 flex-shrink-0 bg-[#1e1e1e] border-r border-zinc-800 flex flex-col items-center pt-2 gap-2 select-none">
                                    <span className="text-[10px] text-zinc-600 font-mono">{para.id}</span>
                                    {paraMemos.length > 0 && layersVisible[LayerType.THEORY_MEMOS] && (
                                        <div className="relative group/memo">
                                            <button 
                                                onClick={() => handleEditMemoClick(paraMemos[0])}
                                                className="hover:scale-110 transition-transform focus:outline-none"
                                                title="Click to edit memo"
                                            >
                                                <StickyNote size={14} className="text-amber-500 fill-amber-500/20 cursor-pointer"/>
                                            </button>
                                            
                                            {/* Hover Preview Tooltip */}
                                            <div className="absolute left-6 top-0 w-48 bg-amber-100 text-zinc-900 p-2 rounded shadow-xl text-xs z-30 opacity-0 group-hover/memo:opacity-100 pointer-events-none transition-opacity">
                                                <div className="font-bold mb-1 border-b border-amber-200 pb-1">{paraMemos[0].title}</div>
                                                <div className="line-clamp-3 opacity-75">{paraMemos[0].content}</div>
                                                <div className="mt-1 text-[9px] text-amber-800 font-bold uppercase tracking-wide">Click icon to edit</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 2. Coding Stripes Margin */}
                                <div className="w-4 border-r border-zinc-800 bg-[#2d2d2d] flex flex-row relative select-none">
                                    {uniqueCodesInPara.map((code) => (
                                        <CodeHoverCard 
                                            key={code.id}
                                            code={code}
                                            codings={codings}
                                        >
                                            <div 
                                                className="flex-1 h-full hover:brightness-125 transition-all cursor-help relative"
                                                style={{ backgroundColor: code.color }}
                                            />
                                        </CodeHoverCard>
                                    ))}
                                </div>

                                {/* 3. Text Content */}
                                <div className="flex-1 px-8 py-2 font-serif text-lg text-zinc-300 leading-relaxed relative selection:bg-blue-500/30">
                                    <HighlightedText 
                                        text={para.text}
                                        paraStart={para.start}
                                        codings={paraCodings}
                                        codes={codes}
                                        allCodings={codings} // Pass all codings for counting stats
                                    />
                                </div>
                            </div>
                        );
                    })}
                    
                    {/* End padding */}
                    <div className="h-32 bg-[#1e1e1e] border-t border-zinc-800 flex items-center justify-center text-zinc-700 text-sm">
                        End of Document
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

// --- Reusable Code Hover Card Content ---

const CodeHoverCard: React.FC<{
    code: Code;
    codings: Coding[];
    children: React.ReactNode;
    align?: "start" | "center" | "end";
    side?: "top" | "right" | "bottom" | "left";
}> = ({ code, codings, children, align = "center", side = "right" }) => {
    
    // Stats calculation
    const usageCount = codings.filter(c => c.codeId === code.id).length;
    
    return (
        <HoverCard openDelay={200} closeDelay={150}>
            <HoverCardTrigger asChild>
                {children}
            </HoverCardTrigger>
            <HoverCardContent side={side} align={align} className="w-80">
                <div className="flex justify-between space-x-4">
                    <div className="flex items-start gap-4">
                         <div className="shrink-0 mt-1">
                             <div className="h-10 w-10 rounded-full flex items-center justify-center border border-zinc-800 shadow-sm" style={{ backgroundColor: `${code.color}20` }}>
                                <Tag size={20} style={{ color: code.color }} />
                             </div>
                         </div>
                         <div className="space-y-1">
                             <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                                 {code.name}
                                 {code.isCore && <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-yellow-900/20 text-yellow-500 border-yellow-500/20">CORE</Badge>}
                             </h4>
                             <p className="text-xs text-zinc-400">
                                 {code.description || "Open coding category derived from grounded analysis."}
                             </p>
                             <div className="flex items-center pt-2 gap-4">
                                 <div className="flex items-center gap-1 text-xs text-zinc-500">
                                     <Activity size={12} />
                                     <span>{usageCount} References</span>
                                 </div>
                                 <div className="flex items-center gap-1 text-xs text-zinc-500">
                                     <Hash size={12} />
                                     <span className="font-mono">{code.id}</span>
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}

// --- Helper Component for Inline Highlights ---

const HighlightedText: React.FC<{
    text: string;
    paraStart: number;
    codings: Coding[];
    codes: Code[];
    allCodings: Coding[];
}> = ({ text, paraStart, codings, codes, allCodings }) => {
    if (codings.length === 0) return <>{text}</>;

    // We need to slice the text based on coding boundaries relative to this paragraph
    // Boundaries: 0 (start of para), text.length (end of para), and any start/end of coding relative to paraStart
    const paraEnd = paraStart + text.length;
    
    // Collect all split points
    const points = new Set<number>([0, text.length]);
    codings.forEach(c => {
        const relStart = Math.max(0, c.start - paraStart);
        const relEnd = Math.min(text.length, c.end - paraStart);
        if (relStart < text.length) points.add(relStart);
        if (relEnd > 0) points.add(relEnd);
    });

    const sortedPoints = Array.from(points).sort((a, b) => a - b);
    const segments: React.ReactNode[] = [];

    for (let i = 0; i < sortedPoints.length - 1; i++) {
        const segStart = sortedPoints[i];
        const segEnd = sortedPoints[i+1];
        const segText = text.substring(segStart, segEnd);
        
        // Find which codes cover this segment
        const segMidGlobal = paraStart + segStart + (segEnd - segStart) / 2;
        
        const activeForSegment = codings.filter(c => 
            c.start <= segMidGlobal && c.end >= segMidGlobal
        );

        if (activeForSegment.length > 0) {
            // To emulate "Highlighter" look, we use the primary code (last applied usually)
            const codeRef = codes.find(c => c.id === activeForSegment[0].codeId);
            const color = codeRef?.color || '#666';

            // Wrap in HoverCard if code exists
            if (codeRef) {
                segments.push(
                    <CodeHoverCard 
                        key={i} 
                        code={codeRef} 
                        codings={allCodings}
                        side="top" // Show tooltip above text
                    >
                         <span 
                            className="transition-colors hover:brightness-110 cursor-pointer rounded-sm px-0.5 box-decoration-clone inline-block"
                            style={{ 
                                backgroundColor: `${color}40`, // 25% opacity
                                borderBottom: `2px solid ${color}`
                            }}
                        >
                            {segText}
                        </span>
                    </CodeHoverCard>
                );
            } else {
                 segments.push(<span key={i}>{segText}</span>);
            }
        } else {
            segments.push(<span key={i}>{segText}</span>);
        }
    }

    return <>{segments}</>;
};