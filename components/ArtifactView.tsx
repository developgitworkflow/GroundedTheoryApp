import React, { useMemo, useState, useCallback } from 'react';
import { Artifact, Coding, Code, LayerType } from '../types';
import { suggestCodes } from '../services/geminiService';
import { Wand2, Loader2, Plus } from 'lucide-react';

interface ArtifactViewProps {
  artifact: Artifact;
  codings: Coding[];
  codes: Code[];
  layersVisible: Record<LayerType, boolean>;
  onAddCoding: (coding: Omit<Coding, 'id'>) => void;
  onCreateCode: (name: string) => Promise<Code>;
}

export const ArtifactView: React.FC<ArtifactViewProps> = ({ 
  artifact, 
  codings, 
  codes, 
  layersVisible,
  onAddCoding,
  onCreateCode
}) => {
  const [selection, setSelection] = useState<{start: number, end: number, text: string} | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedCodesList, setSuggestedCodesList] = useState<string[]>([]);

  // Filter codings for this artifact
  const activeCodings = useMemo(() => {
    if (!layersVisible[LayerType.OPEN_CODING]) return [];
    return codings.filter(c => c.artifactId === artifact.id);
  }, [codings, artifact.id, layersVisible]);

  // Construct text with highlights
  const renderContent = useMemo(() => {
    const text = artifact.content;
    if (activeCodings.length === 0) return <span className="text-gray-300 whitespace-pre-wrap leading-relaxed">{text}</span>;

    const sortedCodings = [...activeCodings].sort((a, b) => a.start - b.start);
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
          <span className="absolute -top-6 left-0 bg-gray-900 text-xs px-2 py-1 rounded border border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
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

    return <div className="leading-relaxed font-serif text-lg">{elements}</div>;
  }, [artifact.content, activeCodings, codes]);

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const text = sel.toString();

    if (text.length > 0) {
      // Simple offset calculation - strictly assumes container is the relative parent for this demo
      // In a real app, this needs robust DOM traversal to find exact offsets relative to artifact content
      // Here we will use a simplified approach: just allow user to confirm selection via a popover
      // For the demo to work without complex DOM math, we'll assume the user selects text and we capture the string.
      // To get real offsets, we would need to map the DOM selection back to the raw string.
      // For this prototype, let's use a workaround: string matching or just enabling the sidebar tools.
      
      // Attempt to find offset in raw text (This is naive and fails with duplicates, but sufficient for a demo)
      const start = artifact.content.indexOf(text); 
      if (start !== -1) {
        setSelection({ start, end: start + text.length, text });
      }
    } else {
      setSelection(null);
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

  return (
    <div className="relative h-full flex flex-col">
       {/* Toolbar for Selection */}
       {selection && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl p-3 z-50 flex gap-4 items-start animate-fade-in-up">
          <div className="flex flex-col gap-2">
             <div className="text-xs text-gray-400 font-mono">Selected: "{selection.text.substring(0, 20)}..."</div>
             <div className="flex gap-2">
                <button 
                  onClick={handleGetSuggestions}
                  disabled={isSuggesting}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-colors"
                >
                  {isSuggesting ? <Loader2 className="animate-spin" size={14}/> : <Wand2 size={14} />}
                  AI Suggest
                </button>
             </div>
          </div>

          <div className="w-px bg-gray-600 h-full mx-2 self-stretch"></div>

          <div className="flex flex-col gap-2 max-w-[200px]">
            {suggestedCodesList.length > 0 ? (
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
            ) : (
              <div className="text-xs text-gray-500 italic">No suggestions yet.</div>
            )}
             <div className="flex gap-1 mt-1">
                <input 
                  type="text" 
                  placeholder="New code..." 
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
          
          <button onClick={() => setSelection(null)} className="text-gray-500 hover:text-white ml-2">✕</button>
        </div>
      )}

      {/* Main Text Content */}
      <div 
        className="flex-1 overflow-y-auto p-12 bg-[#1a1a1a]" 
        onMouseUp={handleMouseUp}
      >
        <div className="max-w-3xl mx-auto bg-[#252525] p-12 shadow-2xl min-h-screen border border-gray-800 rounded-sm selection:bg-blue-500 selection:text-white">
          <h1 className="text-2xl font-bold text-gray-100 mb-8 border-b border-gray-700 pb-4">{artifact.name}</h1>
          {renderContent}
        </div>
      </div>
    </div>
  );
};
