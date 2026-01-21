import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Artifact, Coding, Code, LayerType, Memo } from '../types';
import { suggestCodes } from '../services/geminiService';
import { Wand2, Loader2, StickyNote, MessageSquare, GripVertical, AlertTriangle, Save, X, Search, Plus, Tag, Hash, CalendarDays, Activity, Command as CommandIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { HoverCard, HoverCardTrigger, HoverCardContent } from './ui/hover-card';
import { Badge } from './ui/badge';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut } from './ui/command';

interface ArtifactViewProps {
  artifact: Artifact;
  codings: Coding[];
  codes: Code[];
  memos?: Memo[];
  layersVisible: Record<LayerType, boolean>;
  onAddCoding: (coding: Omit<Coding, 'id'>) => void;
  onCreateCode: (name: string) => Promise<Code>;
  onAddMemo?: (snippet: string, content: string, range?: {start: number, end: number}) => void;
  onEditMemo?: (memo: Memo) => void;
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
  onEditMemo
}) => {
  const [selection, setSelection] = useState<{start: number, end: number, text: string, rect: DOMRect} | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedCodesList, setSuggestedCodesList] = useState<string[]>([]);
  const [memoInput, setMemoInput] = useState('');
  const [showMemoInput, setShowMemoInput] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Focus input on selection
  useEffect(() => {
      // Logic handled by CommandInput autoFocus
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
        }
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
    onAddMemo(selection.text, memoInput, { start: selection.start, end: selection.end });
    setMemoInput('');
    clearSelection();
  };

  const handleEditMemoClick = (memo: Memo) => {
    if (onEditMemo) onEditMemo(memo);
  };

  return (
    <div className="relative h-full flex flex-col bg-[#1e1e1e]" ref={containerRef}>
        
        {/* Helper Toolbar (Floating) for New Selection */}
        {selection && (
            <div 
                className="fixed z-50 bg-zinc-950 border border-zinc-700 shadow-2xl rounded-lg w-[340px] animate-in fade-in zoom-in-95 flex flex-col overflow-hidden"
                style={{ 
                    top: Math.min(window.innerHeight - 400, Math.max(10, selection.rect.top - 180)), 
                    left: Math.min(window.innerWidth - 360, Math.max(10, selection.rect.left)) 
                }}
            >
                <div className="flex items-center justify-between p-2 px-3 border-b border-zinc-800 bg-zinc-950">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <CommandIcon size={12} className="text-blue-500"/> Coding Palette
                    </span>
                    <button onClick={clearSelection} className="text-zinc-500 hover:text-white"><X size={14} /></button>
                </div>

                <div className="p-1">
                     {/* Quote Preview */}
                     <div className="px-3 py-2 text-xs text-zinc-300 italic border-l-2 border-blue-500 ml-1 mb-2 line-clamp-2 bg-zinc-900/50 rounded-r">
                        "{selection.text}"
                     </div>

                     {/* Top Actions */}
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

                     {/* Coding Interface via Command Component */}
                     {!showMemoInput && (
                         <Command className="border-none bg-transparent">
                             <CommandInput placeholder="Search codebook..." autoFocus />
                             <CommandList>
                                 <CommandEmpty className="py-2 text-xs text-zinc-500">
                                     No matching codes found. Use Create.
                                 </CommandEmpty>
                                 
                                 {/* AI Suggestions Group */}
                                 {suggestedCodesList.length > 0 && (
                                     <CommandGroup heading="AI Suggestions">
                                         {suggestedCodesList.map(c => (
                                             <CommandItem key={c} value={c} onSelect={() => applyCode(c)}>
                                                 <Wand2 size={10} className="mr-2 text-indigo-400" />
                                                 {c}
                                             </CommandItem>
                                         ))}
                                     </CommandGroup>
                                 )}

                                 {/* Codebook Group */}
                                 <CommandGroup heading="Existing Codes">
                                     {codes.map(code => (
                                         <CommandItem key={code.id} value={code.name} onSelect={() => applyCode(code.name, code.id)}>
                                             <div className="mr-2 w-2 h-2 rounded-full" style={{ backgroundColor: code.color }} />
                                             {code.name}
                                             {code.isCore && <Badge variant="secondary" className="ml-auto h-4 px-1 text-[9px] text-yellow-500 bg-yellow-950/20">CORE</Badge>}
                                         </CommandItem>
                                     ))}
                                 </CommandGroup>

                                 {/* Actions Group - Always visible but typically fallback */}
                                 <CommandGroup heading="Actions">
                                     <CommandItem onSelect={() => {
                                         // Fallback creation for current search (needs context, or prompt)
                                         // Since we can't easily get search text here without ref, prompt is safer or just rely on exact matches
                                         // For now, let's just use prompt to ensure accuracy
                                         const name = prompt("Name for new code:");
                                         if(name) applyCode(name);
                                     }}>
                                         <Plus size={12} className="mr-2" /> Create new code manually...
                                     </CommandItem>
                                 </CommandGroup>
                             </CommandList>
                         </Command>
                     )}

                     {/* Memo Input Mode */}
                     {showMemoInput && (
                        <div className="space-y-2 px-2 pb-2 animate-in slide-in-from-right duration-200">
                             <div className="flex items-center justify-between">
                                <span className="text-xs text-zinc-400 font-medium">New Annotation</span>
                                <button onClick={() => setShowMemoInput(false)} className="text-[10px] text-zinc-500 hover:text-zinc-300">Back</button>
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
                        
                        // Find memos relevant to this paragraph (both segmented and legacy text-match)
                        const paraMemos = memos.filter(m => 
                           m.relatedIds.includes(artifact.id) && (
                               // Check for precise segment overlap
                               (m.segment && m.segment.start < para.end && m.segment.end > para.start) ||
                               // Fallback to text matching for legacy/general memos
                               (!m.segment && m.type === 'observational' && para.text.includes(m.title))
                           )
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
                                        memos={paraMemos} // NEW: Pass memos for inline icons
                                        layersVisible={layersVisible}
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
    memos?: Memo[];
    layersVisible: Record<LayerType, boolean>;
}> = ({ text, paraStart, codings, codes, allCodings, memos = [], layersVisible }) => {
    
    // If no layers active, just return text
    if (codings.length === 0 && memos.length === 0) return <>{text}</>;

    const points = new Set<number>([0, text.length]);
    
    // Add coding boundaries
    codings.forEach(c => {
        const relStart = Math.max(0, c.start - paraStart);
        const relEnd = Math.min(text.length, c.end - paraStart);
        if (relStart < text.length) points.add(relStart);
        if (relEnd > 0) points.add(relEnd);
    });

    // Add memo boundaries (only if layer is visible)
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
        
        // Check which codings cover this segment
        const activeForSegment = codings.filter(c => 
            c.start <= segMidGlobal && c.end >= segMidGlobal
        );

        // Check which memos cover this segment (layer visible check done implicitly by points logic but robust check here)
        const activeMemosForSegment = layersVisible[LayerType.THEORY_MEMOS] ? memos.filter(m => 
            (m.segment && m.segment.start <= segMidGlobal && m.segment.end >= segMidGlobal)
        ) : [];
        
        // Also check legacy text matching if no segment found
        const legacyMemos = layersVisible[LayerType.THEORY_MEMOS] && activeMemosForSegment.length === 0 ? memos.filter(m => 
             !m.segment && m.title === segText
        ) : [];

        const allActiveMemos = [...activeMemosForSegment, ...legacyMemos];

        // 1. Base Content
        let content = <>{segText}</>;

        // 2. Apply Code Highlighting (Underline/Color)
        if (activeForSegment.length > 0) {
            const codeRef = codes.find(c => c.id === activeForSegment[0].codeId);
            const color = codeRef?.color || '#666';

            if (codeRef) {
                content = (
                    <CodeHoverCard 
                        key={`code-${i}`}
                        code={codeRef} 
                        codings={allCodings}
                        side="top"
                    >
                         <span 
                            className="transition-colors hover:brightness-110 cursor-pointer rounded-sm px-0.5 box-decoration-clone inline-block"
                            style={{ 
                                backgroundColor: `${color}40`,
                                borderBottom: `2px solid ${color}`
                            }}
                        >
                            {segText}
                        </span>
                    </CodeHoverCard>
                );
            }
        } else if (allActiveMemos.length > 0) {
             // If only memo active, still wrap span for styling
             content = <span className="bg-amber-500/20 rounded-sm px-0.5">{segText}</span>;
        } else {
            content = <span key={i}>{segText}</span>;
        }

        // 3. Apply Memo Highlighting & Icon
        // If this segment is part of a memo, wrap it or append icon at end
        if (allActiveMemos.length > 0) {
            // Check if this segment is the END of the memo to place the icon
            // For simplicity, we place the icon at the end of the matching segment if it's the last segment of the memo
            // But since we split exactly on boundaries, the last segment of a memo ends exactly at memo.end.
            
            // We'll append the icon to the last segment of the memo range within this paragraph
            // Or simplistically, append it to every segment that *matches* the memo range? No, too many icons.
            // We append the icon if `segEnd` matches any `memo.segment.end` (relative to para)
            
            const endingMemos = allActiveMemos.filter(m => 
                (m.segment && Math.min(text.length, m.segment.end - paraStart) === segEnd) ||
                (!m.segment && m.title === segText)
            );

            if (endingMemos.length > 0) {
                const primaryMemo = endingMemos[0];
                 segments.push(
                    <span key={`seg-${i}`} className={cn("inline-flex items-baseline", activeForSegment.length === 0 && "bg-amber-500/10")}>
                        {content}
                        <sup className="ml-0.5 inline-flex">
                            <HoverCard>
                                <HoverCardTrigger>
                                    <StickyNote size={10} className="text-amber-500 fill-amber-500/20 cursor-help animate-in zoom-in duration-300" />
                                </HoverCardTrigger>
                                <HoverCardContent side="top" className="w-64 bg-amber-50 border-amber-200 text-amber-900 shadow-xl">
                                    <div className="font-bold text-xs border-b border-amber-200 pb-1 mb-1 flex items-center gap-2">
                                        <StickyNote size={12}/> Annotation
                                    </div>
                                    <div className="text-xs italic mb-2 text-amber-800/70">"{primaryMemo.segment?.text || primaryMemo.title}"</div>
                                    <div className="text-sm font-medium leading-relaxed">{primaryMemo.content}</div>
                                </HoverCardContent>
                            </HoverCard>
                        </sup>
                    </span>
                )
            } else {
                // Inside a memo but not the end, just highlight
                 segments.push(
                    <span key={`seg-${i}`} className={cn(activeForSegment.length === 0 && "bg-amber-500/10")}>
                        {content}
                    </span>
                 );
            }
        } else {
            segments.push(content);
        }
    }

    return <>{segments}</>;
};