import React, { useState, useEffect } from 'react';
import { LayerControl } from './components/LayerControl';
import { ArtifactView } from './components/ArtifactView';
import { TheoryGraph } from './components/TheoryGraph';
import { Artifact, Code, Coding, LayerConfig, LayerType } from './types';
import { 
  FilePlus, 
  Settings, 
  Download, 
  MessageSquarePlus, 
  BrainCircuit,
  Search,
  Plus
} from 'lucide-react';

const INITIAL_LAYERS: LayerConfig[] = [
  { id: LayerType.ARTIFACT, label: 'Artifact Source', visible: true, color: '#fff' },
  { id: LayerType.OPEN_CODING, label: 'Open Codes', visible: true, color: '#60a5fa' },
  { id: LayerType.AXIAL_CONNECTIONS, label: 'Theory Network', visible: false, color: '#f472b6' },
  { id: LayerType.THEORY_MEMOS, label: 'Memos', visible: false, color: '#fbbf24' },
];

const INITIAL_ARTIFACT: Artifact = {
  id: 'a1',
  name: 'Interview: Subject 004',
  type: 'interview',
  content: `Interviewer: How do you feel about the remote work policy change?

Subject: Honestly, it was a shock. At first, I felt a sense of betrayal. We had built this routine, this way of balancing life, and suddenly it was just... revoked. It wasn't just about the commute; it was about the autonomy. I felt like management didn't trust us anymore.

Interviewer: Can you elaborate on 'trust'?

Subject: Yeah. When I'm at home, I work harder because I'm grateful for the flexibility. When they force me back, I feel micromanaged. It creates this resistance. I find myself doing the bare minimum in the office just to get by, whereas at home, I was innovating. It's ironic, really. They want productivity, but they're killing the very spirit that drives it.`
};

const INITIAL_CODES: Code[] = [
  { id: 'c1', name: 'Betrayal', color: '#ef4444' }, // Red
  { id: 'c2', name: 'Autonomy', color: '#3b82f6' }, // Blue
  { id: 'c3', name: 'Resistance', color: '#f59e0b' }, // Amber
  { id: 'c4', name: 'Trust Deficit', color: '#8b5cf6' }, // Violet
  { id: 'c5', name: 'Productivity Paradox', color: '#10b981' }, // Emerald
];

const INITIAL_CODINGS: Coding[] = [
  { id: 'cd1', artifactId: 'a1', codeId: 'c1', start: 86, end: 94, textSnippet: 'betrayal' },
  { id: 'cd2', artifactId: 'a1', codeId: 'c2', start: 175, end: 183, textSnippet: 'autonomy' },
  { id: 'cd3', artifactId: 'a1', codeId: 'c4', start: 209, end: 236, textSnippet: "management didn't trust us" },
];

export default function App() {
  const [layers, setLayers] = useState<LayerConfig[]>(INITIAL_LAYERS);
  const [artifact, setArtifact] = useState<Artifact>(INITIAL_ARTIFACT);
  const [codes, setCodes] = useState<Code[]>(INITIAL_CODES);
  const [codings, setCodings] = useState<Coding[]>(INITIAL_CODINGS);
  const [activeTab, setActiveTab] = useState<'analyze' | 'memos'>('analyze');

  const layersVisible = layers.reduce((acc, layer) => {
    acc[layer.id] = layer.visible;
    return acc;
  }, {} as Record<LayerType, boolean>);

  const toggleLayer = (id: LayerType) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const handleAddCoding = (coding: Omit<Coding, 'id'>) => {
    const newCoding: Coding = {
      ...coding,
      id: `coding-${Date.now()}`
    };
    setCodings([...codings, newCoding]);
  };

  const handleCreateCode = async (name: string): Promise<Code> => {
    // Generate random distinct color (simple implementation)
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newCode: Code = {
      id: `code-${Date.now()}`,
      name,
      color: randomColor
    };
    setCodes([...codes, newCode]);
    return newCode;
  };

  const handleNodeClick = (codeId: string) => {
    // Basic filter logic or highlight interaction could go here
    console.log("Clicked code:", codeId);
    alert(`Focused on code: ${codes.find(c => c.id === codeId)?.name}`);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#121212] text-gray-200 font-sans overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-[#0a0a0a] border-b border-gray-800 flex items-center justify-between px-4 shrink-0 z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-blue-500">
             <BrainCircuit size={24} />
             <span className="font-bold text-xl tracking-tight text-white">STRATUM</span>
          </div>
          <span className="bg-gray-800 text-xs px-2 py-0.5 rounded text-gray-400">Project: Remote Work Study</span>
        </div>
        
        <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors border border-gray-700">
                <FilePlus size={16} /> Import Artifact
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors shadow-lg shadow-blue-900/20">
                <Download size={16} /> Export Data
            </button>
            <div className="w-px h-6 bg-gray-700 mx-2"></div>
            <button className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800">
                <Settings size={20} />
            </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left: Layer Controls */}
        <LayerControl layers={layers} toggleLayer={toggleLayer} />

        {/* Center: Canvas */}
        <div className="flex-1 relative bg-[#151515] flex flex-col">
          {/* Top Tabs (Canvas Modes) */}
          <div className="h-10 bg-[#1a1a1a] border-b border-gray-800 flex items-end px-2 gap-1">
             <button 
               onClick={() => setActiveTab('analyze')}
               className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === 'analyze' ? 'bg-[#252525] text-blue-400 border-t border-x border-gray-700' : 'text-gray-500 hover:text-gray-300'}`}
             >
               Text Analysis
             </button>
             <button 
               onClick={() => setActiveTab('memos')}
               className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === 'memos' ? 'bg-[#252525] text-blue-400 border-t border-x border-gray-700' : 'text-gray-500 hover:text-gray-300'}`}
             >
               Theoretical Memos
             </button>
          </div>

          {/* Canvas Content */}
          <div className="flex-1 relative overflow-hidden">
             
             {/* Layer 1 & 2: Artifact & Coding (Text View) */}
             {activeTab === 'analyze' && layersVisible[LayerType.ARTIFACT] && (
               <ArtifactView 
                 artifact={artifact} 
                 codings={codings} 
                 codes={codes} 
                 layersVisible={layersVisible}
                 onAddCoding={handleAddCoding}
                 onCreateCode={handleCreateCode}
               />
             )}

             {/* Layer 3: Theory Graph (Overlay) */}
             {activeTab === 'analyze' && (
                 <TheoryGraph 
                    codes={codes} 
                    codings={codings} 
                    layersVisible={layersVisible} 
                    onNodeClick={handleNodeClick}
                 />
             )}

             {activeTab === 'memos' && (
               <div className="p-8 text-gray-400 flex flex-col items-center justify-center h-full">
                 <MessageSquarePlus size={48} className="mb-4 opacity-50" />
                 <p className="text-lg">Theoretical Memos Module</p>
                 <p className="text-sm mt-2 max-w-md text-center">In a full version, this would use Gemini to draft memos connecting your 'Autonomy' and 'Betrayal' codes based on their co-occurrences.</p>
               </div>
             )}
          </div>
        </div>

        {/* Right: Code Manager / Properties */}
        <div className="w-72 bg-gray-900 border-l border-gray-700 flex flex-col z-20 shadow-xl">
           <div className="p-4 border-b border-gray-700 bg-gray-950">
             <h3 className="font-bold text-gray-200 text-sm uppercase tracking-wider">Codebook</h3>
           </div>
           
           <div className="p-2 border-b border-gray-800">
             <div className="relative">
                <Search className="absolute left-2 top-2 text-gray-500" size={14} />
                <input 
                  className="w-full bg-gray-800 text-sm text-gray-200 rounded pl-8 pr-2 py-1.5 border border-gray-700 focus:border-blue-500 focus:outline-none" 
                  placeholder="Filter codes..." 
                />
             </div>
           </div>

           <div className="flex-1 overflow-y-auto p-2 space-y-1">
             {codes.map(code => (
               <div key={code.id} className="group flex items-center justify-between p-2 rounded hover:bg-gray-800 cursor-pointer border border-transparent hover:border-gray-700 transition-all">
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: code.color }}></div>
                   <span className="text-sm text-gray-300 font-medium">{code.name}</span>
                 </div>
                 <span className="text-xs text-gray-600 bg-gray-900 px-1.5 py-0.5 rounded">
                    {codings.filter(c => c.codeId === code.id).length}
                 </span>
               </div>
             ))}
           </div>

           <div className="p-4 bg-gray-950 border-t border-gray-700">
              <button 
                onClick={() => {
                    const name = prompt("Enter new code name:");
                    if(name) handleCreateCode(name);
                }}
                className="w-full flex items-center justify-center gap-2 p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-600 transition-colors text-sm"
              >
                <Plus size={14} /> Create New Code
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}