import React from 'react';
import { ProjectSettings, Memo, TypeOfStatus } from '../types';
import { 
  ArrowDown, 
  ArrowRight, 
  Microscope, 
  FileQuestion, 
  Lightbulb, 
  Wrench, 
  BookOpen,
  Target,
  Database,
  Users,
  MapPin,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface FrameworkDiagramProps {
  settings: ProjectSettings;
  memos: Memo[];
  onOpenSettings: () => void;
  onSelectMemo: (memo: Memo) => void;
}

export const FrameworkDiagram: React.FC<FrameworkDiagramProps> = ({ 
  settings, 
  memos, 
  onOpenSettings,
  onSelectMemo 
}) => {
  const { fieldOfStudy, theoreticalFramework } = settings;
  const findings = memos.filter(m => m.type === 'finding' || m.type === 'theoretical');

  return (
    <div className="h-full w-full overflow-auto bg-zinc-950 p-8 flex justify-center">
      <div className="max-w-5xl w-full flex flex-col items-center gap-8 relative">
        
        {/* TOP LEVEL: FIELD OF STUDY */}
        <div className="w-full flex justify-center relative z-10">
            <Card className="w-[500px] border-zinc-800 bg-zinc-900/50 shadow-xl backdrop-blur-sm relative overflow-visible">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-zinc-950 px-3 py-1 border border-zinc-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    <MapPin size={12} /> Field of Study
                </div>
                <CardContent className="p-6 grid grid-cols-2 gap-8 relative">
                     <div className="space-y-1">
                         <div className="text-[10px] uppercase text-zinc-500 font-bold flex items-center gap-1">
                             <Users size={12} /> Subject (Actor)
                         </div>
                         <div className="text-sm font-medium text-zinc-200">
                             {fieldOfStudy.subjectOfStudy || "Not defined"}
                         </div>
                     </div>
                     <div className="space-y-1 text-right">
                         <div className="text-[10px] uppercase text-zinc-500 font-bold flex items-center gap-1 justify-end">
                             <Target size={12} /> Object (Phenomenon)
                         </div>
                         <div className="text-sm font-medium text-zinc-200">
                             {fieldOfStudy.objectOfStudy || "Not defined"}
                         </div>
                     </div>
                     
                     {/* Connector Down */}
                     <div className="absolute bottom-0 left-1/2 w-px h-8 bg-zinc-700 translate-y-8"></div>
                </CardContent>
            </Card>
        </div>

        {/* MIDDLE LEVEL: THEORETICAL FRAMEWORK CORE */}
        <div className="w-full flex justify-center relative z-10 mt-4">
             <Card className="w-[600px] border-blue-900/50 bg-blue-950/10 shadow-2xl relative">
                <div className="absolute top-1/2 -left-12 -translate-y-1/2 text-[10px] text-zinc-600 font-mono -rotate-90">DEFINES</div>
                
                <CardHeader className="text-center pb-2 border-b border-zinc-800/50">
                    <CardTitle className="text-lg text-blue-400 flex items-center justify-center gap-2">
                        <Database size={18} /> Theoretical Framework
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex justify-center gap-4">
                    <Button variant="outline" size="xs" onClick={onOpenSettings} className="gap-2 border-dashed border-zinc-700 text-zinc-500 hover:text-blue-400">
                        <Settings size={12} /> Configure Ontology
                    </Button>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 border px-3 py-1 rounded bg-zinc-900 border-zinc-800">
                        <BookOpen size={12} />
                        Bibliography: <span className="text-zinc-200 font-mono">{theoreticalFramework.bibliographyContent ? "Linked" : "Empty"}</span>
                    </div>
                </CardContent>

                {/* Connectors Out */}
                <div className="absolute bottom-0 left-1/4 w-px h-12 bg-zinc-700 translate-y-full"></div>
                <div className="absolute bottom-0 right-1/4 w-px h-12 bg-zinc-700 translate-y-full"></div>
             </Card>
        </div>

        {/* BOTTOM LEVEL: METHODS & QUESTIONS */}
        <div className="w-full grid grid-cols-2 gap-16 mt-8 relative z-10">
            
            {/* Left Branch: Methods */}
            <div className="flex flex-col items-center gap-4">
                <div className="px-3 py-1 bg-zinc-800 rounded text-xs font-bold text-zinc-400">METHODS & TOOLS</div>
                <div className="w-full space-y-3">
                    {theoreticalFramework.methods.length === 0 && (
                        <div className="text-center text-zinc-600 text-xs italic py-4 border border-dashed border-zinc-800 rounded">No methods defined</div>
                    )}
                    {theoreticalFramework.methods.map(m => (
                        <div key={m.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex items-start gap-3 relative">
                            <div className="p-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-500">
                                <Microscope size={16} />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-bold text-zinc-300 capitalize">{m.type} Protocol</div>
                                <div className="text-[10px] text-zinc-500 line-clamp-2 mt-1 font-mono">{m.protocolContent}</div>
                                
                                {/* Tools */}
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {theoreticalFramework.tools.map(t => (
                                        <React.Fragment key={t.id}>
                                            <Badge variant="secondary" className="text-[9px] h-4 px-1 gap-1 bg-zinc-800 text-zinc-400">
                                                <Wrench size={8} /> {t.name}
                                            </Badge>
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Branch: Research Questions */}
            <div className="flex flex-col items-center gap-4">
                <div className="px-3 py-1 bg-zinc-800 rounded text-xs font-bold text-zinc-400">RESEARCH QUESTIONS</div>
                <div className="w-full space-y-3">
                    {theoreticalFramework.researchQuestions.length === 0 && (
                        <div className="text-center text-zinc-600 text-xs italic py-4 border border-dashed border-zinc-800 rounded">No questions posed</div>
                    )}
                    {theoreticalFramework.researchQuestions.map(rq => (
                        <div key={rq.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex items-start gap-3">
                            <div className="p-2 bg-zinc-950 border border-zinc-800 rounded text-amber-500">
                                <FileQuestion size={16} />
                            </div>
                            <div className="flex-1">
                                <div className="text-xs font-mono text-zinc-500 mb-1">RQ ID: {rq.id}</div>
                                <div className="text-sm text-zinc-300 italic">"{rq.content}"</div>
                            </div>
                            {/* Connection Point for Findings */}
                            <div className="absolute -right-4 top-1/2 w-4 h-px bg-zinc-700"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* FOOTER LEVEL: FINDINGS (Mapped) */}
        <div className="w-full mt-12 pt-8 border-t border-dashed border-zinc-800 relative">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-950 px-4 py-1 text-xs font-bold text-zinc-500 border border-zinc-800 rounded-full">
                EMERGENT FINDINGS
             </div>

             <div className="grid grid-cols-3 gap-4">
                 {findings.length === 0 && (
                     <div className="col-span-3 text-center py-12 text-zinc-600">
                         <Lightbulb size={48} className="mx-auto mb-4 opacity-20" />
                         <p>No findings recorded yet. Use the Theory Builder to create 'Finding' memos.</p>
                     </div>
                 )}
                 {findings.map(finding => {
                     const linkedRQs = theoreticalFramework.researchQuestions.filter(rq => finding.relatedIds.includes(rq.id));
                     return (
                         <div 
                            key={finding.id} 
                            onClick={() => onSelectMemo(finding)}
                            className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-lg hover:bg-zinc-900 cursor-pointer group transition-all"
                         >
                             <div className="flex justify-between items-start mb-2">
                                 <Badge variant="outline" className="border-amber-900/30 text-amber-500 bg-amber-900/10">Finding</Badge>
                                 <ArrowRight size={14} className="text-zinc-600 -rotate-45 group-hover:text-amber-500 transition-colors" />
                             </div>
                             <h4 className="font-bold text-zinc-200 text-sm mb-2">{finding.title}</h4>
                             <p className="text-xs text-zinc-500 line-clamp-3 mb-3">{finding.content}</p>
                             
                             {linkedRQs.length > 0 ? (
                                 <div className="flex flex-wrap gap-1 mt-auto">
                                     {linkedRQs.map(rq => (
                                         <React.Fragment key={rq.id}>
                                             <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-zinc-800 text-zinc-400">
                                                 Answers {rq.id}
                                             </Badge>
                                         </React.Fragment>
                                     ))}
                                 </div>
                             ) : (
                                 <div className="text-[10px] text-red-900 bg-red-900/10 px-2 py-0.5 rounded inline-block">Unmapped</div>
                             )}
                         </div>
                     )
                 })}
             </div>
        </div>

        {/* Decorative Background Lines */}
        <svg className="absolute inset-0 pointer-events-none opacity-20" width="100%" height="100%">
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" className="text-zinc-800" />
        </svg>

      </div>
    </div>
  );
};