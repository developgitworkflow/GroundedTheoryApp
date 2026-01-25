import React, { useState } from 'react';
import { Visualizations } from './components/Visualizations';
import { DEMO_DATA } from './lib/demoData';
import { ProjectSettings, ResearchTeam, Code, Coding, Artifact, Memo } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState('visualize');
  
  // State initialization using DEMO_DATA
  const [codes, setCodes] = useState<Code[]>(DEMO_DATA.codes);
  const [codings, setCodings] = useState<Coding[]>(DEMO_DATA.codings);
  const [artifacts, setArtifacts] = useState<Artifact[]>(DEMO_DATA.artifacts);
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>(DEMO_DATA.settings);
  const [memos, setMemos] = useState<Memo[]>(DEMO_DATA.memos);
  const [researchTeam, setResearchTeam] = useState<ResearchTeam>(DEMO_DATA.team);

  return (
    <div className="h-screen w-screen bg-zinc-950 text-white flex flex-col overflow-hidden">
        <header className="h-12 border-b border-zinc-800 flex items-center px-4 bg-zinc-900 shrink-0">
            <div className="font-bold mr-8 text-lg tracking-tight">Stratum</div>
            <nav className="flex gap-4 text-sm font-medium">
                <button 
                    onClick={() => setActiveTab('visualize')} 
                    className={`px-3 py-1 rounded-md transition-colors ${activeTab === 'visualize' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                    Visualization
                </button>
            </nav>
        </header>
        <main className="flex-1 overflow-hidden relative">
            {/* VISUALIZATION STAGE */}
            {activeTab === 'visualize' && (
                <Visualizations 
                    codes={codes}
                    codings={codings}
                    artifacts={artifacts}
                    settings={projectSettings}
                    memos={memos}
                    team={researchTeam}
                />
            )}
        </main>
    </div>
  );
}