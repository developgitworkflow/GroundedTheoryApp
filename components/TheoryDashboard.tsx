import React, { useState, useMemo } from 'react';
import { ResearchQuestion, Memo, Code } from '../types';
import { 
  LayoutDashboard, 
  Table2, 
  Kanban, 
  Target, 
  FileText, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  Link as LinkIcon,
  Tag,
  ArrowRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface TheoryDashboardProps {
  researchQuestions: ResearchQuestion[];
  memos: Memo[]; // Specifically Findings/Theoretical memos
  codes: Code[]; // Categories & Codes
  onUpdateMemo: (id: string, updates: Partial<Memo>) => void;
}

type ViewMode = 'dashboard' | 'matrix' | 'board';

export const TheoryDashboard: React.FC<TheoryDashboardProps> = ({ 
  researchQuestions, 
  memos, 
  codes,
  onUpdateMemo
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = useMemo(() => codes.filter(c => c.kind === 'category'), [codes]);

  // --- Helpers ---

  const getFindingsForRQ = (rqId: string) => {
    return memos.filter(m => m.relatedIds && m.relatedIds.includes(rqId));
  };

  const getRelatedCodesForMemo = (memo: Memo) => {
      return codes.filter(c => memo.relatedIds.includes(c.id) || memo.content.toLowerCase().includes(c.name.toLowerCase()));
  };

  // Metrics
  const coverageStats = useMemo(() => {
      const totalRQs = researchQuestions.length;
      const coveredRQs = researchQuestions.filter(rq => getFindingsForRQ(rq.id).length > 0).length;
      const totalFindings = memos.length;
      
      // Calculate Category Density
      const categoryCounts = categories.map(cat => ({
          ...cat,
          count: memos.filter(m => m.relatedIds.includes(cat.id) || m.content.toLowerCase().includes(cat.name.toLowerCase())).length
      })).sort((a,b) => b.count - a.count);

      return { totalRQs, coveredRQs, totalFindings, categoryCounts };
  }, [researchQuestions, memos, categories]);

  // --- Drag and Drop Logic ---
  const handleDragStart = (e: React.DragEvent, memoId: string) => {
      e.dataTransfer.setData('memoId', memoId);
  };

  const handleDrop = (e: React.DragEvent, rqId: string) => {
      e.preventDefault();
      const memoId = e.dataTransfer.getData('memoId');
      const memo = memos.find(m => m.id === memoId);
      
      if (memo) {
          const currentRelated = memo.relatedIds || [];
          if (!currentRelated.includes(rqId)) {
              onUpdateMemo(memoId, { relatedIds: [...currentRelated, rqId] });
          }
      }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between bg-zinc-900/50 p-2 rounded-lg border border-zinc-800 shrink-0">
            <div className="flex gap-1">
                <Button 
                    variant={viewMode === 'dashboard' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => setViewMode('dashboard')}
                    className="gap-2"
                >
                    <LayoutDashboard size={14} /> Overview
                </Button>
                <Button 
                    variant={viewMode === 'board' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => setViewMode('board')}
                    className="gap-2"
                >
                    <Kanban size={14} /> Evidence Board
                </Button>
                <Button 
                    variant={viewMode === 'matrix' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => setViewMode('matrix')}
                    className="gap-2"
                >
                    <Table2 size={14} /> Heatmap Matrix
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <Filter size={14} className="text-zinc-500" />
                <select 
                    className="bg-zinc-950 border border-zinc-800 text-xs rounded px-2 py-1 text-zinc-300 focus:outline-none"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                >
                    <option value="all">All Categories</option>
                    {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>
        </div>

        {/* Stats Banner */}
        <div className="grid grid-cols-3 gap-4 shrink-0">
            <Card className="bg-zinc-900/30 border-zinc-800">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-2 bg-blue-900/20 rounded text-blue-400"><Target size={20} /></div>
                    <div>
                        <div className="text-2xl font-bold text-zinc-100">{coverageStats.coveredRQs}/{coverageStats.totalRQs}</div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wide">RQs Addressed</div>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-zinc-900/30 border-zinc-800">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-2 bg-purple-900/20 rounded text-purple-400"><FileText size={20} /></div>
                    <div>
                        <div className="text-2xl font-bold text-zinc-100">{coverageStats.totalFindings}</div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wide">Total Findings</div>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-zinc-900/30 border-zinc-800">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-2 bg-emerald-900/20 rounded text-emerald-400"><CheckCircle2 size={20} /></div>
                    <div>
                        <div className="text-2xl font-bold text-zinc-100">
                            {Math.round((coverageStats.coveredRQs / (coverageStats.totalRQs || 1)) * 100)}%
                        </div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wide">Theory Saturation</div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* --- VIEW: DASHBOARD (OVERVIEW) --- */}
        {viewMode === 'dashboard' && (
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Inquiry Progress */}
                    <Card className="border-zinc-800 bg-zinc-900/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold uppercase text-zinc-400">Inquiry Progress</CardTitle>
                            <CardDescription>Evidence density per Research Question</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {researchQuestions.map((rq, idx) => {
                                const count = getFindingsForRQ(rq.id).length;
                                const max = Math.max(...researchQuestions.map(r => getFindingsForRQ(r.id).length), 1);
                                const percentage = (count / max) * 100;
                                return (
                                    <div key={rq.id} className="space-y-1">
                                        <div className="flex justify-between text-xs text-zinc-300">
                                            <span className="truncate max-w-[80%]">RQ-{idx+1}: {rq.content}</span>
                                            <span className="font-mono text-zinc-500">{count}</span>
                                        </div>
                                        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-blue-600 rounded-full" 
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>

                    {/* Category Weight */}
                    <Card className="border-zinc-800 bg-zinc-900/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold uppercase text-zinc-400">Theoretical Density</CardTitle>
                            <CardDescription>Findings per Conceptual Category</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {coverageStats.categoryCounts.slice(0, 5).map(cat => (
                                <div key={cat.id} className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-medium text-zinc-300">{cat.name}</span>
                                            <span className="text-[10px] text-zinc-500">{cat.count} findings</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full rounded-full opacity-80" 
                                                style={{ 
                                                    width: `${(cat.count / coverageStats.totalFindings) * 100}%`,
                                                    backgroundColor: cat.color 
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Evidence Map Table */}
                <Card className="border-zinc-800 bg-zinc-900/20">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold uppercase text-zinc-400">Evidence Log</CardTitle>
                        <CardDescription>Detailed mapping of Findings to Questions and Codes</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-zinc-900/50 text-zinc-500 font-medium border-b border-zinc-800">
                                    <tr>
                                        <th className="p-3 pl-6 w-1/4">Finding (Memo)</th>
                                        <th className="p-3 w-1/4">Research Question (Answers)</th>
                                        <th className="p-3 w-1/4">Grounded In (Categories/Codes)</th>
                                        <th className="p-3 w-1/4">Excerpt</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {memos.map(memo => {
                                        const relatedRQs = researchQuestions.filter(rq => memo.relatedIds.includes(rq.id));
                                        const relatedCodes = getRelatedCodesForMemo(memo);
                                        return (
                                            <tr key={memo.id} className="hover:bg-zinc-900/30 transition-colors">
                                                <td className="p-3 pl-6 align-top">
                                                    <div className="font-bold text-zinc-300 mb-1">{memo.title}</div>
                                                    <Badge variant="secondary" className="text-[9px] h-4 px-1">{memo.type}</Badge>
                                                </td>
                                                <td className="p-3 align-top">
                                                    {relatedRQs.length > 0 ? (
                                                        <div className="flex flex-col gap-1">
                                                            {relatedRQs.map(rq => (
                                                                <div key={rq.id} className="flex items-center gap-1 text-zinc-400">
                                                                    <CheckCircle2 size={10} className="text-emerald-500 shrink-0"/>
                                                                    <span className="line-clamp-1" title={rq.content}>{rq.content}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : <span className="text-zinc-600 italic">Unmapped</span>}
                                                </td>
                                                <td className="p-3 align-top">
                                                    <div className="flex flex-wrap gap-1">
                                                        {relatedCodes.map(c => (
                                                            <React.Fragment key={c.id}>
                                                                <Badge variant="outline" className="text-[9px] h-4 px-1 border-zinc-700 text-zinc-400 gap-1">
                                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }}/>
                                                                    {c.name}
                                                                </Badge>
                                                            </React.Fragment>
                                                        ))}
                                                        {relatedCodes.length === 0 && <span className="text-zinc-600 italic">No explicit codes</span>}
                                                    </div>
                                                </td>
                                                <td className="p-3 align-top text-zinc-500 italic line-clamp-2 pr-6">
                                                    "{memo.content.substring(0, 80)}..."
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}

        {/* --- VIEW: BOARD (KANBAN) --- */}
        {viewMode === 'board' && (
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                <div className="flex gap-4 h-full min-w-max">
                    {/* Unmapped Column */}
                    <div className="w-72 flex flex-col bg-zinc-900/20 rounded-lg border border-zinc-800/50">
                        <div className="p-3 border-b border-zinc-800 bg-zinc-900/50 rounded-t-lg">
                            <h3 className="font-semibold text-zinc-400 text-sm flex items-center gap-2">
                                <AlertCircle size={14} /> Unmapped Findings
                            </h3>
                        </div>
                        <div className="p-3 space-y-2 overflow-y-auto flex-1">
                            {memos.filter(m => (!m.relatedIds || m.relatedIds.length === 0 || !researchQuestions.some(rq => m.relatedIds.includes(rq.id)))).map(memo => (
                                <MemoCard key={memo.id} memo={memo} codes={codes} onDragStart={handleDragStart} />
                            ))}
                        </div>
                    </div>

                    {/* RQ Columns */}
                    {researchQuestions.map((rq, idx) => (
                        <div 
                            key={rq.id} 
                            className="w-80 flex flex-col bg-zinc-900 rounded-lg border border-zinc-800"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, rq.id)}
                        >
                            <div className="p-3 border-b border-zinc-800 bg-zinc-950 rounded-t-lg">
                                <div className="text-[10px] text-zinc-500 font-mono mb-1">RQ-{idx + 1}</div>
                                <h3 className="font-medium text-zinc-200 text-sm line-clamp-2" title={rq.content}>
                                    {rq.content}
                                </h3>
                            </div>
                            <div className="p-3 space-y-2 overflow-y-auto flex-1 bg-zinc-900/50">
                                {getFindingsForRQ(rq.id).map(memo => (
                                    <MemoCard key={memo.id} memo={memo} codes={codes} onDragStart={handleDragStart} isLinked />
                                ))}
                                {getFindingsForRQ(rq.id).length === 0 && (
                                    <div className="h-24 border-2 border-dashed border-zinc-800 rounded flex items-center justify-center text-zinc-600 text-xs text-center p-4">
                                        Drag findings here to link evidence
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- VIEW: MATRIX (HEATMAP) --- */}
        {viewMode === 'matrix' && (
            <div className="flex-1 overflow-auto bg-zinc-900/30 rounded-lg border border-zinc-800 p-6">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr>
                            <th className="bg-zinc-950 p-3 border-b border-zinc-800 text-zinc-500 font-medium">Research Questions \ Categories</th>
                            {categories.map(cat => (
                                <th key={cat.id} className="bg-zinc-950 p-3 border-b border-zinc-800 text-zinc-300 font-bold min-w-[120px]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                        {cat.name}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {researchQuestions.map(rq => {
                            const findings = getFindingsForRQ(rq.id);
                            return (
                                <tr key={rq.id} className="border-b border-zinc-800 hover:bg-zinc-900/50">
                                    <td className="p-4 bg-zinc-950/50 max-w-xs">
                                        <div className="font-medium text-zinc-300">{rq.content}</div>
                                        <div className="text-xs text-zinc-500 mt-1">{findings.length} linked findings</div>
                                    </td>
                                    {categories.map(cat => {
                                        // Intersection: Findings linked to RQ AND containing/related to Category
                                        const count = findings.filter(f => 
                                            f.content.toLowerCase().includes(cat.name.toLowerCase()) || 
                                            f.title.toLowerCase().includes(cat.name.toLowerCase()) ||
                                            f.relatedIds.includes(cat.id)
                                        ).length;
                                        
                                        return (
                                            <td key={cat.id} className="p-2 text-center">
                                                <div 
                                                    className={cn(
                                                        "h-12 rounded flex items-center justify-center transition-all border border-transparent",
                                                        count === 0 ? "bg-zinc-900/30 text-zinc-700" : 
                                                        count < 3 ? "bg-blue-900/20 text-blue-400 border-blue-900/30" : 
                                                        "bg-blue-600/20 text-blue-300 border-blue-500/50 font-bold"
                                                    )}
                                                >
                                                    {count > 0 ? count : '-'}
                                                </div>
                                            </td>
                                        )
                                    })}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        )}
    </div>
  );
};

interface MemoCardProps {
    memo: Memo;
    codes: Code[];
    onDragStart: (e: React.DragEvent, id: string) => void;
    isLinked?: boolean;
}

const MemoCard: React.FC<MemoCardProps> = ({ memo, codes, onDragStart, isLinked }) => {
    // Find related codes to display on the card
    const relatedCodes = codes.filter(c => memo.relatedIds.includes(c.id) || memo.content.toLowerCase().includes(c.name.toLowerCase()));

    return (
        <div 
            draggable
            onDragStart={(e) => onDragStart(e, memo.id)}
            className={cn(
                "p-3 rounded border cursor-grab active:cursor-grabbing hover:shadow-md transition-all group relative flex flex-col gap-2",
                isLinked ? "bg-zinc-800 border-zinc-700" : "bg-zinc-950 border-zinc-800"
            )}
        >
            <div className="flex justify-between items-start">
                <h4 className="text-xs font-bold text-zinc-300 line-clamp-1">{memo.title}</h4>
                {isLinked && <LinkIcon size={10} className="text-blue-500" />}
            </div>
            
            <p className="text-[10px] text-zinc-500 line-clamp-3 leading-relaxed">
                {memo.content}
            </p>

            {/* Tags area */}
            <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant="secondary" className="text-[8px] h-4 px-1">{memo.type}</Badge>
                {relatedCodes.slice(0, 3).map(c => (
                    <React.Fragment key={c.id}>
                    <Badge variant="outline" className="text-[8px] h-4 px-1 border-zinc-700 text-zinc-400 gap-1">
                        <div className="w-1 h-1 rounded-full" style={{ backgroundColor: c.color }}/>
                        {c.name}
                    </Badge>
                    </React.Fragment>
                ))}
                {relatedCodes.length > 3 && <span className="text-[8px] text-zinc-600">+{relatedCodes.length - 3}</span>}
            </div>
        </div>
    );
};
