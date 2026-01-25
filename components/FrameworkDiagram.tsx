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
  Settings, 
  User, 
  Mic, 
  Eye, 
  ClipboardList, 
  Laptop,
  Link as LinkIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';
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

  // Sort methods by type to group them logically. Defensive check for methods array.
  const methods = theoreticalFramework?.methods || [];
  const sortedMethods = [...methods].sort((a, b) => a.type.localeCompare(b.type));

  const getMethodIcon = (type: string) => {
      switch (type) {
          case 'interview': return <Mic size={14} />;
          case 'observation': return <Eye size={14} />;
          case 'survey': return <ClipboardList size={14} />;
          case 'focusgroup': return <Users size={14} />;
          default: return <Microscope size={14} />;
      }
  };

  const getMethodColor = (type: string) => {
      switch (type) {
          case 'interview': return "bg-emerald-950/30 text-emerald-500 border-emerald-900/50";
          case 'observation': return "bg-blue-950/30 text-blue-500 border-blue-900/50";
          case 'focusgroup': return "bg-purple-950/30 text-purple-500 border-purple-900/50";
          default: return "bg-zinc-900 text-zinc-500 border-zinc-800";
      }
  };

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
                     {/* Subject (Actor) with Hover List */}
                     <div className="space-y-1 relative">
                        <HoverCard openDelay={200} closeDelay={100}>
                            <HoverCardTrigger asChild>
                                <div className="group cursor-help">
                                    <div className="text-[10px] uppercase text-zinc-500 font-bold flex items-center gap-1 group-hover:text-blue-400 transition-colors">
                                         <Users size={12} /> Subject (Actor)
                                     </div>
                                     <div className="text-sm font-medium text-zinc-200 border-b border-dashed border-transparent group-hover:border-blue-500/50 transition-all inline-block pb-0.5">
                                         {fieldOfStudy.subjectOfStudy || "Not defined"}
                                     </div>
                                </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80 bg-zinc-950 border-zinc-800 p-0 overflow-hidden shadow-2xl z-50" align="start" side="bottom">
                                <div className="p-3 bg-zinc-900/80 border-b border-zinc-800 flex justify-between items-center backdrop-blur-sm">
                                    <span className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                                        <Users size={14} className="text-blue-500"/>
                                        Study Participants
                                    </span>
                                    <Badge variant="outline" className="text-[10px] h-5 border-zinc-700 bg-zinc-950">{settings.participants.length}</Badge>
                                </div>
                                <div className="max-h-64 overflow-y-auto p-2 space-y-1 bg-zinc-950/95 custom-scrollbar">
                                     {settings.participants.length === 0 ? (
                                         <div className="text-center p-6 text-xs text-zinc-500 italic flex flex-col items-center gap-2">
                                             <User size={24} className="opacity-20" />
                                             No participants defined in configuration.
                                         </div>
                                     ) : (
                                         settings.participants.map(p => (
                                             <div key={p.id} className="flex items-start gap-3 p-2.5 rounded-md hover:bg-zinc-900 transition-colors group/item border border-transparent hover:border-zinc-800">
                                                 <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center shrink-0 font-mono text-[10px] group-hover/item:border-blue-500/30 group-hover/item:text-blue-400 transition-colors">
                                                     {p.anonymizedCode.substring(0,3)}
                                                 </div>
                                                 <div className="flex-1 min-w-0">
                                                     <div className="flex items-center justify-between gap-2 mb-0.5">
                                                         <span className="text-xs font-bold text-zinc-300 truncate">{p.anonymizedCode}</span>
                                                         {p.isCoConstructor && (
                                                            <Badge variant="secondary" className="text-[8px] h-4 px-1 py-0 bg-purple-900/20 text-purple-400 border-purple-900/30 shrink-0">
                                                                Co-Constructor
                                                            </Badge>
                                                         )}
                                                     </div>
                                                     <p className="text-[10px] text-zinc-500 leading-snug line-clamp-2 group-hover/item:text-zinc-400">
                                                         {p.description}
                                                     </p>
                                                 </div>
                                             </div>
                                         ))
                                     )}
                                </div>
                                <div className="p-2 bg-zinc-900/50 border-t border-zinc-800 text-[9px] text-zinc-600 text-center uppercase tracking-wider font-medium">
                                    Manage in Settings &gt; Ontology
                                </div>
                            </HoverCardContent>
                        </HoverCard>
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
                        <Settings size={12} /> Configure
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
            
            {/* Left Branch: Methods & Tools */}
            <div className="flex flex-col items-center gap-4 w-full">
                <div className="px-3 py-1 bg-zinc-800 rounded text-xs font-bold text-zinc-400 uppercase tracking-widest">Methodological Design</div>
                
                <div className="w-full space-y-6">
                    {/* Methods List */}
                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden shadow-sm backdrop-blur-sm">
                         <div className="px-4 py-3 bg-zinc-950/50 border-b border-zinc-800 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-2">
                                <Microscope size={12} /> Protocols
                            </span>
                            <Badge variant="outline" className="text-[9px] h-5 border-zinc-700 bg-zinc-900 text-zinc-500">{sortedMethods.length}</Badge>
                         </div>
                         <div className="divide-y divide-zinc-800/50 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {sortedMethods.length === 0 && <div className="p-6 text-center text-zinc-600 text-xs italic">No methods defined in settings.</div>}
                            {sortedMethods.map(m => (
                                <HoverCard key={m.id} openDelay={200} closeDelay={100}>
                                    <HoverCardTrigger asChild>
                                        <div className="group p-3 hover:bg-zinc-900/80 transition-all cursor-help flex items-start gap-3">
                                            <div className={cn("p-2 rounded-md border shrink-0 transition-colors", getMethodColor(m.type))}>
                                                {getMethodIcon(m.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <span className="text-sm font-bold text-zinc-300 capitalize group-hover:text-blue-400 transition-colors">{m.type}</span>
                                                    {m.participantIds && m.participantIds.length > 0 && (
                                                        <div className="flex items-center gap-1 text-[9px] text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                                                            <Users size={8} /> {m.participantIds.length}
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-zinc-500 line-clamp-2 font-mono leading-relaxed">
                                                    {m.protocolContent}
                                                </p>
                                            </div>
                                        </div>
                                    </HoverCardTrigger>
                                    <HoverCardContent side="right" align="start" className="w-80 bg-zinc-950 border-zinc-800 p-0 shadow-xl z-50">
                                        <div className="p-3 border-b border-zinc-800 bg-zinc-900/30">
                                             <div className="flex items-center justify-between">
                                                 <span className="text-xs font-bold text-zinc-200 capitalize flex items-center gap-2">
                                                     {getMethodIcon(m.type)} {m.type} Protocol
                                                 </span>
                                                 <Badge variant="outline" className="text-[9px] border-zinc-700">ID: {m.id}</Badge>
                                             </div>
                                        </div>
                                        <div className="p-3 bg-zinc-950">
                                            <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Content Snippet</div>
                                            <p className="text-xs text-zinc-400 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto p-2 bg-zinc-900/50 rounded border border-zinc-800/50">
                                                {m.protocolContent}
                                            </p>
                                            {m.participantIds && m.participantIds.length > 0 && (
                                                <div className="mt-3 pt-2 border-t border-zinc-800/50">
                                                     <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1 flex items-center gap-1">
                                                         <Users size={10} /> Linked Participants
                                                     </div>
                                                     <div className="flex flex-wrap gap-1">
                                                         {m.participantIds.map(pid => {
                                                             const p = settings.participants.find(part => part.id === pid);
                                                             return p ? (
                                                                 <Badge key={pid} variant="secondary" className="text-[9px] h-4 px-1 bg-zinc-800 text-zinc-400 border-none">
                                                                     {p.anonymizedCode}
                                                                 </Badge>
                                                             ) : null;
                                                         })}
                                                     </div>
                                                </div>
                                            )}
                                        </div>
                                    </HoverCardContent>
                                </HoverCard>
                            ))}
                         </div>
                    </div>

                    {/* Tools Grid */}
                    <div className="bg-zinc-900/20 border border-zinc-800 rounded-xl overflow-hidden">
                         <div className="px-4 py-2 bg-zinc-950/50 border-b border-zinc-800 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-2">
                                <Wrench size={12} /> Instruments & Tools
                            </span>
                         </div>
                         <div className="p-3 flex flex-wrap gap-2">
                            {theoreticalFramework.tools.length === 0 && <span className="text-zinc-600 text-xs italic w-full text-center py-2">No tools defined</span>}
                            {theoreticalFramework.tools.map(t => (
                                <HoverCard key={t.id} openDelay={200} closeDelay={100}>
                                    <HoverCardTrigger asChild>
                                        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900 rounded px-2.5 py-2 cursor-help transition-all group shadow-sm">
                                            <div className="p-1 bg-zinc-900 rounded text-zinc-500 group-hover:text-amber-500 group-hover:bg-zinc-950 transition-colors">
                                                <Laptop size={12} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-zinc-300 group-hover:text-zinc-100">{t.name}</span>
                                                {t.version && <span className="text-[9px] text-zinc-600 leading-none">v{t.version}</span>}
                                            </div>
                                        </div>
                                    </HoverCardTrigger>
                                    <HoverCardContent side="top" className="w-64 p-0 bg-zinc-950 border-zinc-800 shadow-xl overflow-hidden z-50">
                                        <div className="p-3 bg-zinc-900/50 border-b border-zinc-800 flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <Wrench size={12} className="text-amber-500"/>
                                                <span className="font-bold text-zinc-200 text-xs">{t.name}</span>
                                            </div>
                                            {t.version && <Badge variant="secondary" className="text-[9px] h-4 bg-zinc-800 text-zinc-400">v{t.version}</Badge>}
                                        </div>
                                        {t.referenceURL ? (
                                            <div className="p-3 bg-zinc-950">
                                                <a href={t.referenceURL} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 underline flex items-center gap-2 break-all p-2 rounded hover:bg-zinc-900 transition-colors">
                                                    <LinkIcon size={12} className="shrink-0" />
                                                    {t.referenceURL}
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="p-3 text-[10px] text-zinc-500 italic text-center">No reference URL provided.</div>
                                        )}
                                    </HoverCardContent>
                                </HoverCard>
                            ))}
                         </div>
                    </div>
                </div>
            </div>

            {/* Right Branch: Research Questions */}
            <div className="flex flex-col items-center gap-4">
                <div className="px-3 py-1 bg-zinc-800 rounded text-xs font-bold text-zinc-400 uppercase tracking-widest">RESEARCH QUESTIONS</div>
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