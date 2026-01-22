import React, { useState } from 'react';
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
  ScrollText
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
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
}

export const ReportView: React.FC<ReportViewProps> = ({ 
  settings, 
  memos, 
  codes,
  artifacts,
  onUpdateSettings 
}) => {
  const [activeSection, setActiveSection] = useState<string>('all');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const abstract = settings.structuredAbstract;

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

  return (
    <div className="flex h-full bg-zinc-950 overflow-hidden">
        {/* Left: Section Navigation */}
        <div className="w-64 border-r border-zinc-800 bg-zinc-900/30 p-4 flex flex-col gap-2">
            <div className="mb-4">
                <h2 className="font-bold text-zinc-100 flex items-center gap-2 text-lg">
                    <FileText className="text-emerald-500" size={20} />
                    Report Gen
                </h2>
                <p className="text-xs text-zinc-500 mt-1">Structured Abstract Builder</p>
            </div>

            <Button 
                variant={!isPreviewMode ? "secondary" : "ghost"} 
                className="justify-start gap-2" 
                onClick={() => setIsPreviewMode(false)}
            >
                <ScrollText size={16} /> Edit Sections
            </Button>
            <Button 
                variant={isPreviewMode ? "secondary" : "ghost"} 
                className="justify-start gap-2" 
                onClick={() => setIsPreviewMode(true)}
            >
                <BookOpen size={16} /> Preview & Export
            </Button>

            <div className="h-px bg-zinc-800 my-2" />

            <div className="p-3 bg-zinc-900/50 rounded border border-zinc-800 space-y-3">
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Data Source</div>
                <div className="flex justify-between text-xs text-zinc-400">
                    <span>Artifacts</span>
                    <span className="text-zinc-200 font-mono">{artifacts.length}</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-400">
                    <span>Codes</span>
                    <span className="text-zinc-200 font-mono">{codes.length}</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-400">
                    <span>Findings</span>
                    <span className="text-zinc-200 font-mono">{memos.filter(m => m.type === 'finding').length}</span>
                </div>
            </div>

            <Button 
                className="mt-auto bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-900/20"
                onClick={handleAutoGenerate}
            >
                <Sparkles size={16} /> Auto-Generate
            </Button>
        </div>

        {/* Center: Editor / Preview */}
        <div className="flex-1 overflow-y-auto p-8 bg-zinc-950 relative">
            <div className="max-w-4xl mx-auto space-y-8">
                
                <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
                    <div>
                        <h1 className="text-3xl font-serif text-zinc-100">{settings.projectName}</h1>
                        <p className="text-zinc-500 text-sm mt-1">Structured Research Abstract</p>
                    </div>
                    {isPreviewMode && (
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

                {isPreviewMode ? (
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
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                        {/* Background */}
                        <Card className="bg-zinc-900/20 border-zinc-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold text-zinc-300 uppercase flex items-center gap-2">
                                    <Target size={16} className="text-blue-500"/> Background / Objective
                                </CardTitle>
                                <p className="text-xs text-zinc-500">What is the problem being addressed, and what was the specific goal or hypothesis?</p>
                            </CardHeader>
                            <CardContent>
                                <Textarea 
                                    className="min-h-[120px] bg-zinc-950/50 border-zinc-800 text-zinc-300 leading-relaxed focus:border-blue-500/50"
                                    value={abstract.background}
                                    onChange={(e) => handleUpdate('background', e.target.value)}
                                    placeholder="Click 'Auto-Generate' or type here..."
                                />
                            </CardContent>
                        </Card>

                        {/* Methods */}
                        <Card className="bg-zinc-900/20 border-zinc-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold text-zinc-300 uppercase flex items-center gap-2">
                                    <Microscope size={16} className="text-purple-500"/> Methods
                                </CardTitle>
                                <p className="text-xs text-zinc-500">How was the research conducted? (Participants, Protocol, Analysis type)</p>
                            </CardHeader>
                            <CardContent>
                                <Textarea 
                                    className="min-h-[120px] bg-zinc-950/50 border-zinc-800 text-zinc-300 leading-relaxed focus:border-purple-500/50"
                                    value={abstract.methods}
                                    onChange={(e) => handleUpdate('methods', e.target.value)}
                                    placeholder="Describe methodology..."
                                />
                            </CardContent>
                        </Card>

                        {/* Results */}
                        <Card className="bg-zinc-900/20 border-zinc-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold text-zinc-300 uppercase flex items-center gap-2">
                                    <Lightbulb size={16} className="text-amber-500"/> Results
                                </CardTitle>
                                <p className="text-xs text-zinc-500">What were the main findings? (Core category, key themes)</p>
                            </CardHeader>
                            <CardContent>
                                <Textarea 
                                    className="min-h-[120px] bg-zinc-950/50 border-zinc-800 text-zinc-300 leading-relaxed focus:border-amber-500/50"
                                    value={abstract.results}
                                    onChange={(e) => handleUpdate('results', e.target.value)}
                                    placeholder="Summarize findings..."
                                />
                            </CardContent>
                        </Card>

                        {/* Conclusion */}
                        <Card className="bg-zinc-900/20 border-zinc-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold text-zinc-300 uppercase flex items-center gap-2">
                                    <Quote size={16} className="text-emerald-500"/> Conclusion
                                </CardTitle>
                                <p className="text-xs text-zinc-500">What do the results mean? Practical or theoretical implications.</p>
                            </CardHeader>
                            <CardContent>
                                <Textarea 
                                    className="min-h-[120px] bg-zinc-950/50 border-zinc-800 text-zinc-300 leading-relaxed focus:border-emerald-500/50"
                                    value={abstract.conclusion}
                                    onChange={(e) => handleUpdate('conclusion', e.target.value)}
                                    placeholder="Implications..."
                                />
                            </CardContent>
                        </Card>

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
            </div>
        </div>
    </div>
  );
};
