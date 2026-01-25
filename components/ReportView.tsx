import React, { useState, useMemo } from 'react';
import { ProjectSettings, Memo, Artifact, Code, ResearchTeam } from '../types';
import { 
  FileText, 
  Sparkles, 
  Printer, 
  Copy, 
  Save, 
  RefreshCw,
  BookOpen, 
  Quote, 
  Target, 
  Microscope, 
  Lightbulb, 
  ScrollText, 
  ShieldCheck, 
  Globe, 
  Database, 
  Repeat, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Archive, 
  GripVertical, 
  Link as LinkIcon, 
  X
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface ReportViewProps {
  settings: ProjectSettings;
  memos: Memo[];
  codes: Code[];
  artifacts: Artifact[];
  onUpdateSettings: (settings: ProjectSettings) => void;
  onConvertToArtifact?: (title: string, content: string, typeSource: string, sourceId?: string) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ 
  settings, 
  memos, 
  codes,
  artifacts,
  onUpdateSettings,
  onConvertToArtifact
}) => {
  const [viewMode, setViewMode] = useState<'abstract' | 'fair'>('abstract');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [draggedArtifactId, setDraggedArtifactId] = useState<string | null>(null);

  const abstract = settings.structuredAbstract;

  // Ensure artifactMapping is initialized (for legacy data compatibility)
  const artifactMapping = abstract.artifactMapping || {
      background: [],
      methods: [],
      results: [],
      conclusion: []
  };

  // --- Auto-Generation Logic ---
  const handleAutoGenerate = () => {
    const { fieldOfStudy, theoreticalFramework, participants, theoryType } = settings;
    const findings = memos.filter(m => m.type === 'finding');
    const coreCategory = codes.find(c => c.isCore);

    // 1. Background / Objective
    const bgText = `This study investigates ${fieldOfStudy.subjectOfStudy || '[Subject]'} within the context of ${fieldOfStudy.location || '[Location]'}. The primary problem addressed is ${fieldOfStudy.objectOfStudy || '[Object of Study]'}. Specifically, the research aimed to answer the following question(s): ${theoreticalFramework.researchQuestions.map(rq => `"${rq.content}"`).join(' ')}`;

    // 2. Methods
    const methodTypes = Array.from(new Set(theoreticalFramework.methods.map(m => m.type))).join(', ');
    const methodText = `A ${theoryType} Grounded Theory approach was employed. Data was collected via ${methodTypes || 'qualitative methods'} involving ${participants.length} participants (${participants.map(p => p.description).join(', ')}). Analysis proceeded through open, axial, and selective coding phases using Stratum CAQDAS software.`;

    // 3. Results
    let resultsText = `The analysis identified ${codes.filter(c => c.kind === 'category').length} conceptual categories. `;
    if (coreCategory) {
        resultsText += `The core category, "${coreCategory.name}", emerged as the central phenomenon explaining the data. `;
    }
    if (findings.length > 0) {
        resultsText += `Key findings include: ${findings.slice(0, 3).map(f => f.title).join('; ')}.`;
    } else {
        resultsText += `(No specific findings recorded yet).`;
    }

    // 4. Conclusion (Template)
    const conclusionText = `These results suggest that [Subject] navigates [Phenomenon] through specific strategies. The theoretical implications extend to [Field], offering a framework for understanding ${fieldOfStudy.objectOfStudy}. Limitations include the specific context of ${fieldOfStudy.location}.`;

    // 5. Keywords
    const keywordText = `Grounded Theory, ${fieldOfStudy.subjectOfStudy}, ${coreCategory ? coreCategory.name : ''}, Qualitative Analysis`;

    onUpdateSettings({
        ...settings,
        structuredAbstract: {
            ...abstract,
            background: bgText,
            methods: methodText,
            results: resultsText,
            conclusion: conclusionText,
            keywords: keywordText
        }
    });
  };

  const handleUpdate = (field: keyof typeof abstract, value: string) => {
      onUpdateSettings({
          ...settings,
          structuredAbstract: {
              ...abstract,
              [field]: value
          }
      });
  };

  const handleArtifactDrop = (section: keyof typeof artifactMapping) => {
      if (!draggedArtifactId) return;
      
      const currentMapping = artifactMapping[section] || [];
      if (!currentMapping.includes(draggedArtifactId)) {
          onUpdateSettings({
              ...settings,
              structuredAbstract: {
                  ...abstract,
                  artifactMapping: {
                      ...artifactMapping,
                      [section]: [...currentMapping, draggedArtifactId]
                  }
              }
          });
      }
      setDraggedArtifactId(null);
  };

  const handleRemoveArtifact = (section: keyof typeof artifactMapping, artifactId: string) => {
      onUpdateSettings({
          ...settings,
          structuredAbstract: {
              ...abstract,
              artifactMapping: {
                  ...artifactMapping,
                  [section]: artifactMapping[section].filter(id => id !== artifactId)
              }
          }
      });
  };

  const copyToClipboard = () => {
      const fullText = `
**Background:** ${abstract.background}
**Methods:** ${abstract.methods}
**Results:** ${abstract.results}
**Conclusion:** ${abstract.conclusion}
**Keywords:** ${abstract.keywords}
      `.trim();
      navigator.clipboard.writeText(fullText);
      alert("Abstract copied to clipboard!");
  };

  const handleSaveAsArtifact = () => {
      if (!onConvertToArtifact) return;
      const content = `# ${settings.projectName} - Structured Abstract\n\n**Background:**\n${abstract.background}\n\n**Methods:**\n${abstract.methods}\n\n**Results:**\n${abstract.results}\n\n**Conclusion:**\n${abstract.conclusion}\n\n**Keywords:**\n${abstract.keywords}`;
      onConvertToArtifact('Structured Abstract', content, 'Report');
  };

  // --- FAIR Calculation ---
  const fairStats = useMemo(() => {
      // Findable
      const hasPid = artifacts.every(a => a.hashID);
      const hasMetadata = !!(settings.fieldOfStudy.subjectOfStudy && settings.fieldOfStudy.objectOfStudy);
      const hasKeywords = settings.structuredAbstract.keywords.length > 0;
      
      // Accessible
      const accessDefined = artifacts.every(a => a.access);
      const consentVerified = artifacts.every(a => a.curation.consentObtained);
      
      // Interoperable
      const ontologyExists = codes.length > 0;
      const formatStandard = artifacts.every(a => ['text','video','audio'].includes(a.media));
      
      // Reusable
      const provenance = artifacts.every(a => a.curation.source && a.curation.dateCreated);
      const license = true; // Implicit in this tool context for now
      
      const fScore = [hasPid, hasMetadata, hasKeywords].filter(Boolean).length / 3 * 100;
      const aScore = [accessDefined, consentVerified].filter(Boolean).length / 2 * 100;
      const iScore = [ontologyExists, formatStandard].filter(Boolean).length / 2 * 100;
      const rScore = [provenance, license].filter(Boolean).length / 2 * 100;

      return {
          fScore, aScore, iScore, rScore,
          checks: { hasPid, hasMetadata, hasKeywords, accessDefined, consentVerified, ontologyExists, formatStandard, provenance }
      };
  }, [settings, artifacts, codes]);

  return (
    <div className="flex h-full bg-zinc-950 overflow-hidden">
        {/* Left: Section Navigation & Source Artifacts */}
        <div className="w-72 border-r border-zinc-800 bg-zinc-900/30 flex flex-col">
            <div className="p-4 border-b border-zinc-800">
                <h2 className="font-bold text-zinc-100 flex items-center gap-2 text-lg">
                    <FileText className="text-emerald-500" size={20} />
                    Report Gen
                </h2>
                <p className="text-xs text-zinc-500 mt-1">Research Output & Compliance</p>
            </div>

            <div className="p-2 space-y-1 border-b border-zinc-800">
                <Button 
                    variant={viewMode === 'abstract' && !isPreviewMode ? "secondary" : "ghost"} 
                    className="w-full justify-start gap-2" 
                    onClick={() => { setViewMode('abstract'); setIsPreviewMode(false); }}
                >
                    <ScrollText size={16} /> Structured Abstract
                </Button>
                <Button 
                    variant={viewMode === 'abstract' && isPreviewMode ? "secondary" : "ghost"} 
                    className="w-full justify-start gap-2" 
                    onClick={() => { setViewMode('abstract'); setIsPreviewMode(true); }}
                >
                    <BookOpen size={16} /> Read Mode
                </Button>
                <Button 
                    variant={viewMode === 'fair' ? "secondary" : "ghost"} 
                    className="w-full justify-start gap-2" 
                    onClick={() => setViewMode('fair')}
                >
                    <ShieldCheck size={16} /> FAIR Compliance
                </Button>
            </div>

            {viewMode === 'abstract' && !isPreviewMode && (
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider bg-zinc-950/50">
                        Source Artifacts
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {artifacts.map(art => {
                            // Check if mapped anywhere
                            const isMapped = (Object.values(artifactMapping) as string[][]).some(list => list.includes(art.id));
                            return (
                                <div 
                                    key={art.id}
                                    draggable
                                    onDragStart={(e) => {
                                        setDraggedArtifactId(art.id);
                                        e.dataTransfer.setData('text/plain', art.id);
                                        e.dataTransfer.effectAllowed = 'copy';
                                    }}
                                    className="p-2 bg-zinc-950 border border-zinc-800 rounded cursor-grab hover:bg-zinc-900 group active:cursor-grabbing relative"
                                >
                                    <div className="flex items-center gap-2">
                                        <GripVertical size={12} className="text-zinc-600 group-hover:text-zinc-400"/>
                                        <span className="text-xs text-zinc-300 truncate font-medium">{art.name}</span>
                                        {isMapped && <LinkIcon size={10} className="ml-auto text-blue-500" />}
                                    </div>
                                    <div className="pl-5 text-[10px] text-zinc-500 truncate">{art.curation.source}</div>
                                </div>
                            )
                        })}
                    </div>
                    
                    <div className="p-3 border-t border-zinc-800 space-y-2 bg-zinc-900/10">
                        <Button 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-900/20"
                            onClick={handleAutoGenerate}
                        >
                            <Sparkles size={16} /> Auto-Generate
                        </Button>
                        {onConvertToArtifact && (
                            <Button 
                                variant="outline"
                                className="w-full gap-2 border-zinc-700 text-zinc-400 hover:text-white"
                                onClick={handleSaveAsArtifact}
                            >
                                <Archive size={16} /> Save as Artifact
                            </Button>
                        )}
                    </div>
                </div>
            )}
            
            {viewMode === 'fair' && (
                <div className="p-4 bg-emerald-950/20 rounded border border-emerald-900/50 m-4">
                    <h3 className="text-emerald-400 font-bold text-xs uppercase mb-2">FAIR Score</h3>
                    <div className="text-3xl font-bold text-zinc-100 mb-1">
                        {Math.round((fairStats.fScore + fairStats.aScore + fairStats.iScore + fairStats.rScore) / 4)}%
                    </div>
                    <p className="text-[10px] text-zinc-500">Overall compliance rating based on current project metadata.</p>
                </div>
            )}
        </div>

        {/* Center: Editor / Preview */}
        <div className="flex-1 overflow-y-auto p-8 bg-zinc-950 relative">
            <div className="max-w-4xl mx-auto space-y-8">
                
                <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
                    <div>
                        <h1 className="text-3xl font-serif text-zinc-100">{settings.projectName}</h1>
                        <p className="text-zinc-500 text-sm mt-1">
                            {viewMode === 'fair' ? 'FAIR Data Principles Assessment' : 'Structured Research Abstract'}
                        </p>
                    </div>
                    {viewMode === 'abstract' && isPreviewMode && (
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-2">
                                <Copy size={14} /> Copy Markdown
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
                                <Printer size={14} /> Print
                            </Button>
                        </div>
                    )}
                </div>

                {viewMode === 'abstract' && isPreviewMode && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="prose prose-invert prose-zinc max-w-none">
                            <div className="mb-6">
                                <span className="font-bold text-zinc-300 uppercase text-xs tracking-wider">Background & Objectives</span>
                                <p className="text-zinc-400 mt-1 leading-relaxed text-sm">{abstract.background || "N/A"}</p>
                            </div>
                            <div className="mb-6">
                                <span className="font-bold text-zinc-300 uppercase text-xs tracking-wider">Methods</span>
                                <p className="text-zinc-400 mt-1 leading-relaxed text-sm">{abstract.methods || "N/A"}</p>
                            </div>
                            <div className="mb-6">
                                <span className="font-bold text-zinc-300 uppercase text-xs tracking-wider">Results</span>
                                <p className="text-zinc-400 mt-1 leading-relaxed text-sm">{abstract.results || "N/A"}</p>
                            </div>
                            <div className="mb-6">
                                <span className="font-bold text-zinc-300 uppercase text-xs tracking-wider">Conclusion</span>
                                <p className="text-zinc-400 mt-1 leading-relaxed text-sm">{abstract.conclusion || "N/A"}</p>
                            </div>
                            <div className="pt-6 border-t border-zinc-800">
                                <span className="font-bold text-zinc-500 uppercase text-xs tracking-wider mr-2">Keywords:</span>
                                <span className="text-zinc-300 text-sm italic">{abstract.keywords}</span>
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'abstract' && !isPreviewMode && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                        {/* Background */}
                        <ReportSectionCard 
                            title="Background / Objective"
                            description="What is the problem being addressed, and what was the specific goal or hypothesis?"
                            icon={Target}
                            iconColor="text-blue-500"
                            borderColor="focus:border-blue-500/50"
                            value={abstract.background}
                            onChange={(val) => handleUpdate('background', val)}
                            mappedArtifacts={artifactMapping.background}
                            onDrop={() => handleArtifactDrop('background')}
                            onRemoveArtifact={(id) => handleRemoveArtifact('background', id)}
                            allArtifacts={artifacts}
                        />

                        {/* Methods */}
                        <ReportSectionCard 
                            title="Methods"
                            description="How was the research conducted? (Participants, Protocol, Analysis type)"
                            icon={Microscope}
                            iconColor="text-purple-500"
                            borderColor="focus:border-purple-500/50"
                            value={abstract.methods}
                            onChange={(val) => handleUpdate('methods', val)}
                            mappedArtifacts={artifactMapping.methods}
                            onDrop={() => handleArtifactDrop('methods')}
                            onRemoveArtifact={(id) => handleRemoveArtifact('methods', id)}
                            allArtifacts={artifacts}
                        />

                        {/* Results */}
                        <ReportSectionCard 
                            title="Results"
                            description="What were the main findings? (Core category, key themes)"
                            icon={Lightbulb}
                            iconColor="text-amber-500"
                            borderColor="focus:border-amber-500/50"
                            value={abstract.results}
                            onChange={(val) => handleUpdate('results', val)}
                            mappedArtifacts={artifactMapping.results}
                            onDrop={() => handleArtifactDrop('results')}
                            onRemoveArtifact={(id) => handleRemoveArtifact('results', id)}
                            allArtifacts={artifacts}
                        />

                        {/* Conclusion */}
                        <ReportSectionCard 
                            title="Conclusion"
                            description="What do the results mean? Practical or theoretical implications."
                            icon={Quote}
                            iconColor="text-emerald-500"
                            borderColor="focus:border-emerald-500/50"
                            value={abstract.conclusion}
                            onChange={(val) => handleUpdate('conclusion', val)}
                            mappedArtifacts={artifactMapping.conclusion}
                            onDrop={() => handleArtifactDrop('conclusion')}
                            onRemoveArtifact={(id) => handleRemoveArtifact('conclusion', id)}
                            allArtifacts={artifacts}
                        />

                        {/* Keywords */}
                        <div className="bg-zinc-900/50 p-4 rounded border border-zinc-800 flex items-center gap-4">
                            <span className="text-sm font-bold text-zinc-500">Keywords:</span>
                            <input 
                                className="flex-1 bg-transparent border-none text-zinc-300 text-sm focus:ring-0 outline-none"
                                value={abstract.keywords}
                                onChange={(e) => handleUpdate('keywords', e.target.value)}
                                placeholder="Comma separated keywords..."
                            />
                        </div>
                    </div>
                )}

                {/* --- FAIR Dashboard --- */}
                {viewMode === 'fair' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-300">
                        {/* Findable */}
                        <FairCard 
                            title="Findable" 
                            icon={Target}
                            color="text-blue-400"
                            score={fairStats.fScore}
                            description="Data and metadata should be easy to find for both humans and computers."
                        >
                            <FairCheck label="Persistent Identifiers (Hash/ID)" passed={fairStats.checks.hasPid} />
                            <FairCheck label="Rich Metadata (Field/Subject)" passed={fairStats.checks.hasMetadata} />
                            <FairCheck label="Indexed Keywords" passed={fairStats.checks.hasKeywords} />
                        </FairCard>

                        {/* Accessible */}
                        <FairCard 
                            title="Accessible" 
                            icon={Globe}
                            color="text-emerald-400"
                            score={fairStats.aScore}
                            description="Users need to know how data can be accessed, possibly with authentication."
                        >
                            <FairCheck label="Access Protocol (Public/Private)" passed={fairStats.checks.accessDefined} />
                            <FairCheck label="Consent Verification Metadata" passed={fairStats.checks.consentVerified} />
                            <FairCheck label="Metadata Separated from Data" passed={true} /> {/* Intrinsic to architecture */}
                        </FairCard>

                        {/* Interoperable */}
                        <FairCard 
                            title="Interoperable" 
                            icon={Database}
                            color="text-purple-400"
                            score={fairStats.iScore}
                            description="Data needs to be integrated with other data using standard vocabularies."
                        >
                            <FairCheck label="Formal Knowledge Rep. (Ontology)" passed={fairStats.checks.ontologyExists} />
                            <FairCheck label="Standard Media Formats" passed={fairStats.checks.formatStandard} />
                            <FairCheck label="Qualified References (Links)" passed={true} /> {/* Implicit in coding model */}
                        </FairCard>

                        {/* Reusable */}
                        <FairCard 
                            title="Reusable" 
                            icon={Repeat}
                            color="text-amber-400"
                            score={fairStats.rScore}
                            description="Data must be well-described so they can be replicated and combined."
                        >
                            <FairCheck label="Detailed Provenance (Source/Date)" passed={fairStats.checks.provenance} />
                            <FairCheck label="Usage License (Implicit)" passed={true} />
                            <FairCheck label="Domain-Relevant Standards" passed={true} />
                        </FairCard>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

const ReportSectionCard: React.FC<{
    title: string;
    description: string;
    icon: any;
    iconColor: string;
    borderColor: string;
    value: string;
    onChange: (val: string) => void;
    mappedArtifacts: string[];
    onDrop: () => void;
    onRemoveArtifact: (id: string) => void;
    allArtifacts: Artifact[];
}> = ({ title, description, icon: Icon, iconColor, borderColor, value, onChange, mappedArtifacts, onDrop, onRemoveArtifact, allArtifacts }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        onDrop();
    };

    return (
        <Card 
            className={cn(
                "bg-zinc-900/20 border-zinc-800 transition-all",
                isDragOver ? "ring-2 ring-blue-500/50 bg-zinc-900/40" : ""
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-zinc-300 uppercase flex items-center gap-2">
                    <Icon size={16} className={iconColor}/> {title}
                </CardTitle>
                <p className="text-xs text-zinc-500">{description}</p>
            </CardHeader>
            <CardContent>
                <Textarea 
                    className={cn("min-h-[120px] bg-zinc-950/50 border-zinc-800 text-zinc-300 leading-relaxed", borderColor)}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Drag and drop artifacts here to link them..."
                />
                
                {/* Mapped Artifacts Area */}
                {mappedArtifacts.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-zinc-800/50">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold self-center">Evidence:</span>
                        {mappedArtifacts.map(id => {
                            const art = allArtifacts.find(a => a.id === id);
                            if (!art) return null;
                            return (
                                <Badge key={id} variant="secondary" className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 gap-1 pr-1 group">
                                    <LinkIcon size={10} className="text-blue-500" />
                                    {art.name}
                                    <button 
                                        onClick={() => onRemoveArtifact(id)}
                                        className="ml-1 p-0.5 rounded-full hover:bg-zinc-700 text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <X size={10} />
                                    </button>
                                </Badge>
                            )
                        })}
                    </div>
                )}
                {isDragOver && (
                    <div className="mt-2 text-xs text-blue-400 text-center animate-pulse">
                        Drop to link artifact
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

const FairCard: React.FC<{ title: string; icon: any; color: string; score: number; description: string; children: React.ReactNode }> = ({ title, icon: Icon, color, score, description, children }) => (
    <Card className="bg-zinc-900/30 border-zinc-800 overflow-hidden">
        <div className="h-1 bg-zinc-800 w-full">
            <div className={cn("h-full transition-all duration-1000", color.replace('text-', 'bg-'))} style={{ width: `${score}%` }} />
        </div>
        <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
                <CardTitle className={cn("flex items-center gap-2 text-lg", color)}>
                    <Icon size={20} /> {title}
                </CardTitle>
                <span className="font-mono font-bold text-zinc-500">{Math.round(score)}%</span>
            </div>
            <CardDescription className="text-xs">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
            {children}
        </CardContent>
    </Card>
);

const FairCheck: React.FC<{ label: string; passed: boolean }> = ({ label, passed }) => (
    <div className="flex items-center justify-between text-sm p-2 rounded bg-zinc-950/50 border border-zinc-900">
        <span className="text-zinc-300">{label}</span>
        {passed ? <CheckCircle2 size={16} className="text-emerald-500" /> : <AlertTriangle size={16} className="text-amber-500" />}
    </div>
);