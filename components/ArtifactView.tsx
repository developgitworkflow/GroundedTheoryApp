import React, { useMemo, useState } from 'react';
import { Artifact, Coding, Code, LayerType, Memo } from '../types';
import { suggestCodes } from '../services/geminiService';
import { Wand2, Loader2, Plus, StickyNote } from 'lucide-react';

interface ArtifactViewProps {
  artifact: Artifact;
  codings: Coding[];
  codes: Code[];
  memos?: Memo[]; // Optional for now
  layersVisible: Record<LayerType, boolean>;
  onAddCoding: (coding: Omit<Coding, 'id'>) => void;
  onCreateCode: (name: string) => Promise<Code>;
  onAddMemo?: (snippet: string, content: string) => void;
}

export const ArtifactView: React.FC<ArtifactViewProps> = ({ 
  artifact, 
  codings, 
  codes, 
  memos = [],
  layersVisible,
  onAddCoding,
  onCreateCode,
  onAddMemo
}) => {
  const [selection, setSelection] = useState<{start: number, end: number, text: string} | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedCodesList, setSuggestedCodesList] = useState<string[]>([]);
  const [memoInput, setMemoInput] = useState('');
  const [showMemoInput, setShowMemoInput] = useState(false);

  // Filter codings for this artifact
  const activeCodings = useMemo(() => {
    if (!layersVisible[LayerType.OPEN_CODING]) return [];
    return codings.filter(c => c.artifactId === artifact.id);
  }, [codings, artifact.id, layersVisible]);

  // Render Content with Highlights and Memos
  const renderContent = useMemo(() => {
    const text = artifact.content;
    // Combine codings and memos (if visible) into segments
    // For simplicity, we just render codes, and maybe markers for memos
    
    // Sort codings
    const sortedCodings = [...activeCodings].sort((a, b) => a.start - b.start);
    
    // Create elements
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedCodings.forEach((coding, i) => {
      // Text before code
      if (coding.start > lastIndex) {
        elements.push(
          <span key={`text-${i}`} className="text-gray-300 whitespace-pre-wrap leading-relaxed">
            {text.substring(lastIndex, coding.start)}
          </span>
        );
      }

      // The coded segment
      const code = codes.find(c => c.id === coding.codeId);
      elements.push(
        <span 
          key={`code-${coding.id}`} 
          className="relative group cursor-pointer border-b-2 bg-opacity-20 hover:bg-opacity-40 transition-all rounded px-0.5"
          style={{ 
            borderColor: code?.color || '#ccc', 
            backgroundColor: code?.color ? `${code.color}33` : 'rgba(255,255,255,0.1)' 
          }}
          title={code?.name}
        >
          {text.substring(coding.start, coding.end)}
          <span className="absolute -top-6 left-0 bg-gray-900 text-xs px-2 py-1 rounded border border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg flex items-center gap-1">
             <div className="w-2 h-2 rounded-full" style={{background: code?.color}}></div>
             {code?.name}
          </span>
        </span>
      );

      lastIndex = coding.end;
    });

    if (lastIndex < text.length) {
      elements.push(
        <span key="text-end" className="text-gray-300 whitespace-pre-wrap leading-relaxed">
          {text.substring(lastIndex)}
        </span>
      );
    }

    return <div className="leading-relaxed font-serif text-lg relative">{elements}</div>;
  }, [artifact.content, activeCodings, codes]);

  // Handle Text Selection
  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const text = sel.toString();

    if (text.length > 0) {
      // Naive text matching for demo
      const start = artifact.content.indexOf(text); 
      if (start !== -1) {
        setSelection({ start, end: start + text.length, text });
        setShowMemoInput(false);
      }
    } else {
      // Don't clear if clicking inside the popover (handled by events typically, but simple check here)
      // For now, click outside logic is implicit or explicit X button
    }
  };

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
    
    setSelection(null);
    setSuggestedCodesList([]);
  };

  const saveMemo = () => {
    if (!selection || !onAddMemo) return;
    onAddMemo(selection.text, memoInput);
    setSelection(null);
    setMemoInput('');
    setShowMemoInput(false);
  };

  return (
    <div className="relative h-full flex flex-col">
       {/* Toolbar for Selection */}
       {selection && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl p-3 z-50 flex flex-col gap-3 animate-fade-in-up min-w-[300px]">
          <div className="flex justify-between items-start">
             <div className="text-xs text-gray-400 font-mono italic truncate max-w-[200px]">"{selection.text}"</div>
             <button onClick={() => setSelection(null)} className="text-gray-500 hover:text-white">✕</button>
          </div>
          
          <div className="flex gap-2 border-b border-gray-700 pb-2">
                <button 
                  onClick={handleGetSuggestions}
                  disabled={isSuggesting || showMemoInput}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isSuggesting ? <Loader2 className="animate-spin" size={14}/> : <Wand2 size={14} />}
                  Suggest
                </button>
                <button 
                    onClick={() => setShowMemoInput(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold transition-colors"
                >
                    <StickyNote size={14} /> Memo
                </button>
          </div>

          {!showMemoInput && (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                    {suggestedCodesList.map(code => (
                    <button 
                        key={code}
                        onClick={() => applyCode(code)}
                        className="px-2 py-1 bg-gray-700 hover:bg-green-600 text-gray-200 text-xs rounded border border-gray-600 transition-colors"
                    >
                        {code}
                    </button>
                    ))}
                </div>
                <div className="flex gap-1">
                    <input 
                        type="text" 
                        placeholder="Add new code..." 
                        className="bg-gray-900 border border-gray-700 text-gray-200 text-xs px-2 py-1 rounded w-full focus:outline-none focus:border-blue-500"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                            applyCode(e.currentTarget.value);
                            e.currentTarget.value = '';
                            }
                        }}
                    />
                </div>
              </div>
          )}

          {showMemoInput && (
             <div className="flex flex-col gap-2 animate-in fade-in">
                <textarea 
                    value={memoInput}
                    onChange={(e) => setMemoInput(e.target.value)}
                    placeholder="Reflect on this segment..."
                    className="w-full h-20 bg-gray-900 border border-gray-700 text-gray-200 text-xs p-2 rounded resize-none focus:outline-none focus:border-amber-500"
                />
                <button 
                    onClick={saveMemo}
                    className="w-full py-1 bg-amber-600 text-white text-xs font-bold rounded"
                >
                    Save Memo
                </button>
             </div>
          )}
        </div>
      )}

      {/* Main Text Content */}
      <div 
        className="flex-1 overflow-y-auto p-12 bg-[#1a1a1a]" 
        onMouseUp={handleMouseUp}
      >
        <div className="max-w-3xl mx-auto relative">
             <div className="bg-[#252525] p-12 shadow-2xl min-h-screen border border-gray-800 rounded-sm selection:bg-blue-500 selection:text-white">
                <h1 className="text-2xl font-bold text-gray-100 mb-8 border-b border-gray-700 pb-4">{artifact.name}</h1>
                {renderContent}
             </div>

            {/* Render Memos in Margin if enabled */}
            {layersVisible[LayerType.THEORY_MEMOS] && memos.length > 0 && (
                <div className="absolute top-0 -right-48 w-44 h-full pointer-events-none">
                    {memos.filter(m => m.type === 'observational').map((memo, i) => (
                        <div key={memo.id} className="pointer-events-auto mb-4 bg-yellow-100 text-gray-900 p-2 text-xs rounded shadow-lg border-l-4 border-yellow-500 relative opacity-90 hover:opacity-100 transition-opacity">
                            <div className="font-bold mb-1 border-b border-yellow-200 pb-1 truncate">{memo.title}</div>
                            <div className="line-clamp-4">{memo.content}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
