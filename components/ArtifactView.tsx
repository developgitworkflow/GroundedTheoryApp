import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Artifact, Coding, Code, LayerType, Memo } from '../types';
import { suggestCodes } from '../services/geminiService';
import { Wand2, Loader2, StickyNote, MessageSquare, GripVertical, Edit2, Save, X, AlertTriangle, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import Editor, { loader } from "@monaco-editor/react";

// Configure Monaco Loader to use a specific CDN to avoid version conflicts if any
loader.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });

interface ArtifactViewProps {
  artifact: Artifact;
  codings: Coding[];
  codes: Code[];
  memos?: Memo[];
  layersVisible: Record<LayerType, boolean>;
  onAddCoding: (coding: Omit<Coding, 'id'>) => void;
  onCreateCode: (name: string) => Promise<Code>;
  onAddMemo?: (snippet: string, content: string) => void;
  onUpdateContent?: (content: string) => void;
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
  onUpdateContent
}) => {
  const [selection, setSelection] = useState<{start: number, end: number, text: string, rect: DOMRect} | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedCodesList, setSuggestedCodesList] = useState<string[]>([]);
  const [memoInput, setMemoInput] = useState('');
  const [showMemoInput, setShowMemoInput] = useState(false);
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(artifact.content);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync content:
  // 1. When switching artifacts (ID changes), force reset edit state and content
  useEffect(() => {
    setEditContent(artifact.content);
    setIsEditing(false);
  }, [artifact.id]);

  // 2. When not editing, keep editContent in sync with artifact.content (in case of external updates)
  useEffect(() => {
    if (!isEditing) {
        setEditContent(artifact.content);
    }
  }, [artifact.content, isEditing]);

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

  // --- Selection Logic ---

  const handleMouseUp = () => {
    if (isEditing) return; // Disable selection logic in edit mode

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

  const clearSelection = () => setSelection(null);

  // --- Action Handlers ---

  const handleGetSuggestions = async () => {
    if (!selection) return;
    setIsSuggesting(true);
    const suggestions = await suggestCodes(selection.text);
    setSuggestedCodesList(suggestions);
    setIsSuggesting(false);
  };

  const applyCode = async (codeName: string) => {
    if (!selection) return;

    let code = codes.find(c => c.name.toLowerCase() === codeName.toLowerCase());
    if (!code) {
      code = await onCreateCode(codeName);
    }

    onAddCoding({
      artifactId: artifact.id,
      codeId: code.id,
      start: selection.start,
      end: selection.end,
      textSnippet: selection.text
    });
    
    clearSelection();
  };

  const saveMemo = () => {
    if (!selection || !onAddMemo) return;
    onAddMemo(selection.text, memoInput);
    setMemoInput('');
    clearSelection();
  };

  const handleToggleEdit = () => {
      if (isEditing) {
          // Canceling edit: reset content to original
          setEditContent(artifact.content);
      }
      setIsEditing(!isEditing);
  };

  const handleSaveContent = () => {
      if (onUpdateContent) {
          onUpdateContent(editContent);
      }
      setIsEditing(false);
  };

  return (
    <div className="relative h-full flex flex-col bg-[#1e1e1e]" ref={containerRef}>
        
        {/* Toolbar (Floating) */}
        {selection && !isEditing && (
            <div 
                className="fixed z-50 bg-zinc-900 border border-zinc-700 shadow-xl rounded-lg w-[320px] animate-in fade-in zoom-in-95 flex flex-col overflow-hidden"
                style={{ 
                    top: Math.min(window.innerHeight - 300, Math.max(10, selection.rect.top - 180)), 
                    left: Math.min(window.innerWidth - 340, Math.max(10, selection.rect.left)) 
                }}
            >
                <div className="flex items-center justify-between p-2 border-b border-zinc-800 bg-zinc-950">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Coding Assistant</span>
                    <button onClick={clearSelection} className="text-zinc-500 hover:text-white"><StickyNote size={14} className="rotate-45" /></button>
                </div>

                <div className="p-3 space-y-3">
                     <div className="text-xs text-zinc-300 italic border-l-2 border-blue-500 pl-2 line-clamp-2 bg-zinc-900/50 py-1">
                        "{selection.text}"
                     </div>

                     <div className="grid grid-cols-2 gap-2">
                         <Button 
                            size="xs" 
                            variant="secondary" 
                            onClick={handleGetSuggestions} 
                            disabled={isSuggesting}
                            className="w-full justify-center gap-2"
                        >
                            {isSuggesting ? <Loader2 className="animate-spin" size={12}/> : <Wand2 size={12}/>}
                            AI Suggest
                         </Button>
                         <Button 
                            size="xs" 
                            variant="outline" 
                            onClick={() => setShowMemoInput(true)}
                            className="w-full justify-center gap-2 border-zinc-700"
                         >
                            <MessageSquare size={12}/>
                            Add Memo
                         </Button>
                     </div>

                     {/* Suggestions */}
                     {!showMemoInput && (
                         <div className="space-y-2">
                             {suggestedCodesList.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {suggestedCodesList.map(c => (
                                        <button 
                                            key={c}
                                            onClick={() => applyCode(c)}
                                            className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded text-[10px] hover:bg-indigo-500/20 transition-colors"
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                             )}
                             <div className="pt-2 border-t border-zinc-800">
                                <input 
                                    className="w-full bg-black/20 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                                    placeholder="Type code name & press Enter..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') applyCode(e.currentTarget.value);
                                    }}
                                    autoFocus
                                />
                             </div>
                         </div>
                     )}

                     {/* Memo Input */}
                     {showMemoInput && (
                        <div className="space-y-2">
                            <textarea 
                                className="w-full h-20 bg-black/20 border border-zinc-700 rounded p-2 text-xs text-zinc-200 resize-none focus:outline-none focus:border-amber-500"
                                placeholder="Enter memo content..."
                                value={memoInput}
                                onChange={(e) => setMemoInput(e.target.value)}
                            />
                            <Button size="xs" variant="brand" className="w-full bg-amber-600 hover:bg-amber-700 text-white" onClick={saveMemo}>
                                Save Memo
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
                         {!isEditing && (
                            <>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> {codings.length} Codings</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> {memos.length} Memos</span>
                            </>
                         )}
                         <Button 
                            variant="ghost" 
                            size="sm" 
                            className={cn("text-zinc-400 hover:text-white gap-2", isEditing && "bg-zinc-800 text-white")}
                            onClick={handleToggleEdit}
                         >
                             {isEditing ? <X size={14} /> : <Edit2 size={14} />}
                             {isEditing ? 'Cancel Edit' : 'Edit Source'}
                         </Button>
                    </div>
                </div>

                {/* Content Area */}
                {isEditing ? (
                    <div className="max-w-5xl mx-auto mt-6 bg-[#252526] min-h-[600px] border border-zinc-800 shadow-xl flex flex-col gap-0 overflow-hidden rounded-md relative z-20">
                        {codings.length > 0 && (
                            <div className="bg-amber-950/30 border-b border-amber-900/50 p-3 flex items-center gap-3 text-amber-500 text-xs shrink-0">
                                <AlertTriangle size={16} />
                                Warning: Modifying the text may misalign existing codes which are based on character index positions.
                            </div>
                        )}
                        <div className="flex-1 relative bg-[#1e1e1e] min-h-[500px]">
                            <Editor
                                height="100%"
                                defaultLanguage="markdown"
                                theme="vs-dark"
                                value={editContent}
                                onChange={(value) => setEditContent(value || '')}
                                loading={<div className="flex items-center justify-center h-full text-zinc-500 gap-2"><Loader2 className="animate-spin" /> Loading Editor...</div>}
                                options={{
                                    minimap: { enabled: false },
                                    wordWrap: 'on',
                                    fontSize: 14,
                                    lineNumbers: 'on',
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                                    padding: { top: 16, bottom: 16 },
                                    renderWhitespace: 'none',
                                    theme: 'vs-dark'
                                }}
                            />
                        </div>
                        <div className="flex justify-end p-4 border-t border-zinc-800 bg-zinc-900 shrink-0">
                             <Button onClick={handleSaveContent} variant="brand" className="gap-2">
                                <Save size={14} /> Save Changes
                             </Button>
                        </div>
                    </div>
                ) : (
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
                                                <StickyNote size={14} className="text-amber-500 fill-amber-500/20 cursor-pointer"/>
                                                {/* Simple Tooltip for Memo */}
                                                <div className="absolute left-6 top-0 w-48 bg-amber-100 text-zinc-900 p-2 rounded shadow-xl text-xs z-50 opacity-0 group-hover/memo:opacity-100 pointer-events-none transition-opacity">
                                                    <div className="font-bold mb-1 border-b border-amber-200 pb-1">{paraMemos[0].title}</div>
                                                    <div className="line-clamp-3">{paraMemos[0].content}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* 2. Coding Stripes Margin */}
                                    <div className="w-4 border-r border-zinc-800 bg-[#2d2d2d] flex flex-row relative select-none">
                                        {uniqueCodesInPara.map((code, i) => (
                                            <div 
                                                key={code.id}
                                                className="flex-1 h-full hover:brightness-125 transition-all cursor-help relative group/stripe"
                                                style={{ backgroundColor: code.color }}
                                            >
                                                {/* Tooltip for Stripe */}
                                                <div className="absolute left-4 top-0 whitespace-nowrap bg-zinc-900 text-white text-xs px-2 py-1 rounded border border-zinc-700 opacity-0 group-hover/stripe:opacity-100 z-50 pointer-events-none shadow-lg translate-x-1">
                                                    {code.name}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* 3. Text Content */}
                                    <div className="flex-1 px-8 py-2 font-serif text-lg text-zinc-300 leading-relaxed relative selection:bg-blue-500/30">
                                        <HighlightedText 
                                            text={para.text}
                                            paraStart={para.start}
                                            codings={paraCodings}
                                            codes={codes}
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
                )}
            </div>
        </div>
    </div>
  );
};

// --- Helper Component for Inline Highlights ---

const HighlightedText: React.FC<{
    text: string;
    paraStart: number;
    codings: Coding[];
    codes: Code[];
}> = ({ text, paraStart, codings, codes }) => {
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
        // A segment [s, e] is covered if coding [C_s, C_e] overlaps completely? 
        // Logic: Midpoint of segment must be inside coding.
        const segMidGlobal = paraStart + segStart + (segEnd - segStart) / 2;
        
        const activeForSegment = codings.filter(c => 
            c.start <= segMidGlobal && c.end >= segMidGlobal
        );

        if (activeForSegment.length > 0) {
            // Determine color. If multiple, maybe blend or striping? 
            // Simple approach: Use first code's color with opacity.
            // Better: Linear gradient if multiple? 
            // Let's just stack standard transparent backgrounds.
            
            // To emulate "Highlighter" look, we just take the last applied code (highest priority) or mix.
            const codeRef = codes.find(c => c.id === activeForSegment[0].codeId);
            const color = codeRef?.color || '#666';

            segments.push(
                <span 
                    key={i} 
                    className="transition-colors hover:brightness-110 cursor-pointer rounded-sm px-0.5 box-decoration-clone"
                    style={{ 
                        backgroundColor: `${color}40`, // 25% opacity
                        borderBottom: `2px solid ${color}`
                    }}
                    title={activeForSegment.map(c => codes.find(code => code.id === c.codeId)?.name).join(', ')}
                >
                    {segText}
                </span>
            );
        } else {
            segments.push(<span key={i}>{segText}</span>);
        }
    }

    return <>{segments}</>;
};