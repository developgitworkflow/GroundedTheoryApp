import React, { useState, useMemo } from 'react';
import { Code, Memo, Theory, ResearchQuestion, Coding, Artifact, ProjectSettings } from '../types';
import { 
    Crown, 
    Sparkles, 
    ArrowRight, 
    BookOpen, 
    Layout, 
    Search, 
    Folder, 
    Tag, 
    FileText, 
    Quote, 
    ChevronDown, 
    StickyNote, 
    Lightbulb,
    Plus,
    Network,
    Edit,
    Trash2,
    Save,
    CheckCircle2,
    List,
    Kanban,
    AlertCircle,
    Link as LinkIcon,
    GitBranch
} from 'lucide-react';
import { generateTheoreticalMemo } from '../services/geminiService';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { cn } from '../lib/utils';
import { TheoryDashboard } from './TheoryDashboard';
import { FrameworkDiagram } from './FrameworkDiagram';

interface TheoryBuilderProps {
  codes: Code[];
  codings: Coding[];
  artifacts: Artifact[];
  memos: Memo[];
  researchQuestions: ResearchQuestion[];
  onSetCoreCategory: (codeId: string) => void;
  onAddMemo: (title: string, content: string) => void;
  onAddFinding?: (title: string, content: string, relatedIds?: string[]) => void;
  onUpdateMemo: (id: string, updates: Partial<Memo>) => void;
  onDeleteMemo?: (id: string) => void;
  onCreateCode: (name: string, kind: 'code' | 'category') => void;
  theoryArtefact: Theory; 
  settings?: ProjectSettings; // Added prop
  onOpenSettings?: () => void; // Added prop
}

export const TheoryBuilder: React.FC<TheoryBuilderProps> = ({ 
    codes, 
    codings,
    artifacts,
    memos, 
    researchQuestions,
    onSetCoreCategory, 
    onAddMemo, 
    onAddFinding,
    onUpdateMemo,
    onDeleteMemo,
    onCreateCode,
    theoryArtefact,
    settings,
    onOpenSettings
}) => {
  const [selectedCoreId, setSelectedCoreId] = useState<string>(codes.find(c => c.isCore)?.id || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeView, setActiveView] = useState('model');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [dirSearch, setDirSearch] = useState('');
  
  // Findings State
  const [findingsView, setFindingsView] = useState<'list' | 'board'>('list');
  const [isCreatingFinding, setIsCreatingFinding] = useState(false);
  const [newFindingTitle, setNewFindingTitle] = useState('');
  const [newFindingContent, setNewFindingContent] = useState('');
  const [newFindingCategoryIds, setNewFindingCategoryIds] = useState<string[]>([]);
  
  const [editingFindingId, setEditingFindingId] = useState<string | null>(null);
  const [editingFindingCategoryIds, setEditingFindingCategoryIds] = useState<string[]>([]);

  const coreCode = codes.find(c => c.id === selectedCoreId);
  const categories = codes.filter(c => c.kind === 'category');
  const findingMemos = useMemo(() => memos.filter(m => m.type === 'finding'), [memos]);

  // Directory Filtering
  const filteredCategories = useMemo(() => {
      if (!dirSearch) return categories;
      return categories.filter(c => c.name.toLowerCase().includes(dirSearch.toLowerCase()));
  }, [categories, dirSearch]);

  // Derived Data for Selected Category
  const activeCategoryData = useMemo(() => {
      if (!selectedCategoryId) return null;
      const category = codes.find(c => c.id === selectedCategoryId);
      if (!category) return null;

      // Children codes
      const childCodes = codes.filter(c => c.parentId === category.id);
      const allRelatedCodeIds = [category.id, ...childCodes.map(c => c.id)];

      // Linked Evidence (Codings)
      const relatedCodings = codings.filter(c => allRelatedCodeIds.includes(c.codeId));
      
      // Linked Memos
      const relatedMemos = memos.filter(m => 
          m.relatedIds.some(id => allRelatedCodeIds.includes(id)) || 
          m.content.toLowerCase().includes(category.name.toLowerCase())
      );

      return { category, childCodes, relatedCodings, relatedMemos };
  }, [selectedCategoryId, codes, codings, memos]);

  const handleCoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedCoreId(newId);
    if (newId) onSetCoreCategory(newId);
  };

  const handleGenerateStory = async () => {
    if (!coreCode) return;
    setIsGenerating(true);
    const otherCodes = codes.filter(c => c.id !== coreCode.id).map(c => c.name);
    const context = `
      Grounded Theory Approach: ${theoryArtefact.type}.
      Core Category: ${coreCode.name}. 
      Related Concepts: ${otherCodes.join(', ')}. 
      The goal is to explain how the Core Category resolves the main concern of the participants.
    `;
    
    const generated = await generateTheoreticalMemo([coreCode.name], context);
    if (generated) {
        onAddMemo(`Story Line: ${coreCode.name}`, generated);
    }
    setIsGenerating(false);
  };

  const handleCreateCategory = () => {
      const name = prompt("Enter new Category name:");
      if (name) {
          onCreateCode(name, 'category');
      }
  };

  const toggleNewFindingCategory = (catId: string) => {
      setNewFindingCategoryIds(prev => 
          prev.includes(catId) 
              ? prev.filter(id => id !== catId)
              : [...prev, catId]
      );
  };

  const submitNewFinding = () => {
      if (newFindingTitle && newFindingContent && onAddFinding) {
          onAddFinding(newFindingTitle, newFindingContent, newFindingCategoryIds);
          setNewFindingTitle('');
          setNewFindingContent('');
          setNewFindingCategoryIds([]);
          setIsCreatingFinding(false);
      }
  };

  const startEditingFinding = (finding: Memo) => {
      setEditingFindingId(finding.id);
      // Initialize with existing related IDs that are categories
      const currentCatIds = finding.relatedIds.filter(id => categories.some(c => c.id === id));
      setEditingFindingCategoryIds(currentCatIds);
  };

  const toggleEditingFindingCategory = (catId: string) => {
      setEditingFindingCategoryIds(prev => 
          prev.includes(catId) 
              ? prev.filter(id => id !== catId)
              : [...prev, catId]
      );
  };

  // --- Mapper Logic (Board) ---
  const getFindingsForRQ = (rqId: string) => {
    return findingMemos.filter(m => m.relatedIds && m.relatedIds.includes(rqId));
  };

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
    <div className="flex flex-col h-full bg-zinc-950 overflow-hidden">
        {/* Sub-Navigation for Theory Area */}
        <div className="border-b border-zinc-800 bg-zinc-950 px-6 py-2 shrink-0 flex justify-between items-center h-14">
             <div className="flex items-center gap-4">
                <Tabs value={activeView} onValueChange={setActiveView}>
                    <TabsList className="bg-zinc-900 border border-zinc-800">
                        <TabsTrigger value="model" className="text-xs gap-2"><Network size={12}/> Framework Model</TabsTrigger>
                        <TabsTrigger value="findings" className="text-xs gap-2"><Lightbulb size={12}/> Findings Manager</TabsTrigger>
                        <TabsTrigger value="dashboard" className="text-xs gap-2"><Layout size={12}/> Integration Dashboard</TabsTrigger>
                        <TabsTrigger value="narrative" className="text-xs gap-2"><BookOpen size={12}/> Narrative Builder</TabsTrigger>
                    </TabsList>
                </Tabs>
             </div>
             <Badge variant="outline" className={cn(
                "uppercase tracking-widest text-[10px] py-1 px-2 border-zinc-700",
                theoryArtefact.type === 'constructivist' && "text-purple-400 bg-purple-900/10",
                theoryArtefact.type === 'straussian' && "text-blue-400 bg-blue-900/10",
                theoryArtefact.type === 'classic' && "text-amber-400 bg-amber-900/10",
            )}>
                {theoryArtefact.type} Approach
            </Badge>
        </div>

        <div className="flex-1 overflow-hidden relative">
            
            {/* VIEW 0: FRAMEWORK MODEL (New) */}
            {activeView === 'model' && settings && (
                <div className="h-full w-full animate-in fade-in duration-300">
                    <FrameworkDiagram 
                        settings={settings} 
                        memos={memos} 
                        onOpenSettings={onOpenSettings || (() => {})}
                        onSelectMemo={() => {}} // Placeholder logic
                    />
                </div>
            )}

            {/* VIEW: FINDINGS MANAGER (CRUD & MAPPER) */}
            {activeView === 'findings' && (
                <div className="h-full w-full animate-in fade-in duration-300 p-8 overflow-y-auto flex flex-col">
                    <div className="max-w-5xl mx-auto space-y-6 w-full flex-1 flex flex-col">
                        <div className="flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                                    <Lightbulb size={20} className="text-amber-500" />
                                    Emergent Findings
                                </h2>
                                <p className="text-sm text-zinc-500">Manage key theoretical insights and map them to research questions.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex bg-zinc-900 border border-zinc-800 rounded-md p-0.5">
                                    <Button 
                                        size="xs" 
                                        variant={findingsView === 'list' ? 'secondary' : 'ghost'} 
                                        onClick={() => setFindingsView('list')}
                                        className="gap-2"
                                    >
                                        <List size={14} /> List
                                    </Button>
                                    <Button 
                                        size="xs" 
                                        variant={findingsView === 'board' ? 'secondary' : 'ghost'} 
                                        onClick={() => setFindingsView('board')}
                                        className="gap-2"
                                    >
                                        <Kanban size={14} /> Mapper
                                    </Button>
                                </div>
                                <div className="w-px h-6 bg-zinc-800 mx-1" />
                                <Button 
                                    onClick={() => {
                                        setIsCreatingFinding(true);
                                        setFindingsView('list'); // Switch to list to show form
                                    }}
                                    className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                                    size="sm"
                                >
                                    <Plus size={16} /> New Finding
                                </Button>
                            </div>
                        </div>

                        {/* CONTENT AREA */}
                        {findingsView === 'list' ? (
                            <div className="space-y-6">
                                {/* Create Form */}
                                {isCreatingFinding && (
                                    <Card className="border-amber-900/50 bg-amber-950/10 animate-in slide-in-from-top-2">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-amber-500 uppercase">Draft New Finding</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <Input 
                                                placeholder="Finding Title (e.g., 'The Paradox of Autonomy')" 
                                                value={newFindingTitle}
                                                onChange={(e) => setNewFindingTitle(e.target.value)}
                                                className="bg-zinc-900 border-zinc-700"
                                            />
                                            <textarea 
                                                placeholder="Describe the finding..."
                                                value={newFindingContent}
                                                onChange={(e) => setNewFindingContent(e.target.value)}
                                                className="w-full h-32 bg-zinc-900 border border-zinc-700 rounded-md p-3 text-sm text-zinc-200 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500"
                                            />
                                            
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase text-zinc-500">Ground in Categories</label>
                                                <div className="flex flex-wrap gap-2 p-3 bg-zinc-900/50 rounded border border-zinc-800">
                                                    {categories.length === 0 && <span className="text-xs text-zinc-500 italic">No categories defined yet.</span>}
                                                    {categories.map(cat => (
                                                        <React.Fragment key={cat.id}>
                                                        <Badge 
                                                            variant={newFindingCategoryIds.includes(cat.id) ? "default" : "outline"}
                                                            className={cn(
                                                                "cursor-pointer transition-all hover:brightness-110",
                                                                newFindingCategoryIds.includes(cat.id) ? "border-transparent text-white" : "border-zinc-700 bg-transparent"
                                                            )}
                                                            onClick={() => toggleNewFindingCategory(cat.id)}
                                                            style={newFindingCategoryIds.includes(cat.id) ? { backgroundColor: cat.color } : { color: cat.color, borderColor: cat.color }}
                                                        >
                                                            {newFindingCategoryIds.includes(cat.id) && <CheckCircle2 size={10} className="mr-1 inline" />}
                                                            {cat.name}
                                                        </Badge>
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="flex justify-end gap-2 border-t border-zinc-800/50 pt-4">
                                            <Button variant="ghost" onClick={() => setIsCreatingFinding(false)}>Cancel</Button>
                                            <Button variant="brand" onClick={submitNewFinding} disabled={!newFindingTitle || !newFindingContent}>Save Finding</Button>
                                        </CardFooter>
                                    </Card>
                                )}

                                {/* Findings List */}
                                <div className="grid gap-4">
                                    {findingMemos.length === 0 && !isCreatingFinding && (
                                        <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                                            No findings recorded yet. Start by creating one.
                                        </div>
                                    )}
                                    {findingMemos.map(finding => (
                                        <Card key={finding.id} className="bg-zinc-900/30 border-zinc-800 hover:border-zinc-700 transition-colors">
                                            {editingFindingId === finding.id ? (
                                                // Edit Mode
                                                <div className="p-4 space-y-4">
                                                    <Input 
                                                        defaultValue={finding.title}
                                                        onChange={(e) => finding.title = e.target.value} // Temporary mutation
                                                        className="bg-zinc-950 border-zinc-700 font-bold"
                                                    />
                                                    <textarea 
                                                        defaultValue={finding.content}
                                                        onChange={(e) => finding.content = e.target.value}
                                                        className="w-full h-32 bg-zinc-900 border border-zinc-700 rounded-md p-3 text-sm text-zinc-200 resize-none"
                                                    />
                                                    
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold uppercase text-zinc-500">Related Categories</label>
                                                        <div className="flex flex-wrap gap-2 p-2 bg-zinc-950/50 rounded border border-zinc-800">
                                                            {categories.map(cat => (
                                                                <React.Fragment key={cat.id}>
                                                                <Badge 
                                                                    variant={editingFindingCategoryIds.includes(cat.id) ? "default" : "outline"}
                                                                    className="cursor-pointer"
                                                                    onClick={() => toggleEditingFindingCategory(cat.id)}
                                                                    style={editingFindingCategoryIds.includes(cat.id) ? { backgroundColor: cat.color } : { color: cat.color, borderColor: cat.color }}
                                                                >
                                                                    {editingFindingCategoryIds.includes(cat.id) && <CheckCircle2 size={10} className="mr-1 inline" />}
                                                                    {cat.name}
                                                                </Badge>
                                                                </React.Fragment>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="sm" onClick={() => setEditingFindingId(null)}>Cancel</Button>
                                                        <Button variant="brand" size="sm" onClick={() => {
                                                            const otherIds = finding.relatedIds.filter(id => !categories.some(c => c.id === id));
                                                            const newRelatedIds = [...otherIds, ...editingFindingCategoryIds];
                                                            
                                                            onUpdateMemo(finding.id, { 
                                                                title: finding.title, 
                                                                content: finding.content,
                                                                relatedIds: newRelatedIds
                                                            });
                                                            setEditingFindingId(null);
                                                        }}>
                                                            <Save size={14} className="mr-2"/> Save
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                // View Mode
                                                <div className="p-4 flex flex-col gap-2">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-bold text-zinc-200">{finding.title}</h3>
                                                        <div className="flex gap-1">
                                                            <Button size="icon" variant="ghost" onClick={() => startEditingFinding(finding)} className="h-8 w-8 text-zinc-500 hover:text-white">
                                                                <Edit size={14} />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" onClick={() => onDeleteMemo && onDeleteMemo(finding.id)} className="h-8 w-8 text-zinc-500 hover:text-red-500">
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
                                                        {finding.content}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-800/50 flex-wrap">
                                                        <span className="text-[10px] text-zinc-600 font-mono">ID: {finding.id}</span>
                                                        <div className="flex flex-wrap gap-1 ml-auto">
                                                            {finding.relatedIds.length > 0 ? (
                                                                finding.relatedIds.map(rid => {
                                                                    const linkedCat = categories.find(c => c.id === rid);
                                                                    if (linkedCat) {
                                                                        return (
                                                                            <React.Fragment key={rid}>
                                                                            <Badge variant="outline" className="text-[10px] h-5 border-zinc-700 bg-zinc-900/50" style={{ color: linkedCat.color, borderColor: linkedCat.color + '40' }}>
                                                                                <div className="w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: linkedCat.color }} />
                                                                                {linkedCat.name}
                                                                            </Badge>
                                                                            </React.Fragment>
                                                                        );
                                                                    }
                                                                    const linkedRQ = researchQuestions.find(rq => rq.id === rid);
                                                                    if (linkedRQ) {
                                                                        return (
                                                                            <React.Fragment key={rid}>
                                                                                <Badge variant="secondary" className="text-[10px] h-5 px-1 bg-zinc-800 text-zinc-400 gap-1">
                                                                                    <GitBranch size={8} /> RQ Answer
                                                                                </Badge>
                                                                            </React.Fragment>
                                                                        )
                                                                    }
                                                                    return null;
                                                                })
                                                            ) : (
                                                                <Badge variant="outline" className="text-[10px] h-5 border-amber-900 text-amber-600">Unmapped</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            // BOARD VIEW (MAPPER)
                            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                                <div className="flex gap-4 h-full min-w-max">
                                    {/* Unmapped Column */}
                                    <div className="w-72 flex flex-col bg-zinc-900/20 rounded-lg border border-zinc-800/50">
                                        <div className="p-3 border-b border-zinc-800 bg-zinc-900/50 rounded-t-lg">
                                            <h3 className="font-semibold text-zinc-400 text-sm flex items-center gap-2">
                                                <AlertCircle size={14} className="text-amber-500" /> Unmapped Findings
                                            </h3>
                                        </div>
                                        <div className="p-3 space-y-2 overflow-y-auto flex-1">
                                            {findingMemos.filter(m => (!m.relatedIds || m.relatedIds.length === 0 || !researchQuestions.some(rq => m.relatedIds.includes(rq.id)))).map(memo => (
                                                <MemoCard key={memo.id} memo={memo} codes={codes} onDragStart={handleDragStart} />
                                            ))}
                                        </div>
                                    </div>

                                    {/* RQ Columns */}
                                    {researchQuestions.map((rq, idx) => (
                                        <div 
                                            key={rq.id} 
                                            className="w-80 flex flex-col bg-zinc-900 rounded-lg border border-zinc-800 shadow-sm"
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => handleDrop(e, rq.id)}
                                        >
                                            <div className="p-3 border-b border-zinc-800 bg-zinc-950 rounded-t-lg">
                                                <div className="text-[10px] text-zinc-500 font-mono mb-1">RQ-{idx + 1}</div>
                                                <h3 className="font-medium text-zinc-200 text-sm line-clamp-2 leading-snug" title={rq.content}>
                                                    {rq.content}
                                                </h3>
                                            </div>
                                            <div className="p-3 space-y-2 overflow-y-auto flex-1 bg-zinc-900/50">
                                                {getFindingsForRQ(rq.id).map(memo => (
                                                    <MemoCard key={memo.id} memo={memo} codes={codes} onDragStart={handleDragStart} isLinked />
                                                ))}
                                                {getFindingsForRQ(rq.id).length === 0 && (
                                                    <div className="h-24 border-2 border-dashed border-zinc-800 rounded flex items-center justify-center text-zinc-600 text-xs text-center p-4">
                                                        Drag findings here to map to RQ
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* VIEW 1: NARRATIVE BUILDER (3-Pane Layout) */}
            {activeView === 'narrative' && (
                <div className="flex h-full w-full animate-in fade-in duration-300">
                    
                    {/* LEFT PANE: Concept Directory */}
                    <div className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col">
                        <div className="p-3 border-b border-zinc-800 bg-zinc-950 flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 text-zinc-500" size={12} />
                                <Input 
                                    className="pl-7 h-8 bg-zinc-900 border-zinc-800 text-xs" 
                                    placeholder="Filter categories..." 
                                    value={dirSearch}
                                    onChange={(e) => setDirSearch(e.target.value)}
                                />
                            </div>
                            <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                onClick={handleCreateCategory}
                                title="Create New Category"
                            >
                                <Plus size={14} />
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            <div className="mb-2 px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Structural Categories</div>
                            <div className="space-y-0.5">
                                {filteredCategories.map(cat => {
                                    const isSelected = selectedCategoryId === cat.id;
                                    return (
                                        <div 
                                            key={cat.id}
                                            onClick={() => setSelectedCategoryId(cat.id)}
                                            className={cn(
                                                "group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors text-sm",
                                                isSelected ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300"
                                            )}
                                        >
                                            <Folder size={14} className={cn(isSelected ? "fill-zinc-100" : "fill-zinc-800")} style={{ color: cat.color }} />
                                            <span className="flex-1 truncate font-medium">{cat.name}</span>
                                            {cat.isCore && <Crown size={10} className="text-yellow-500" />}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        {/* Legend / Status Footer */}
                        <div className="p-2 border-t border-zinc-800 text-[10px] text-zinc-600 flex justify-between bg-zinc-950/50">
                            <span>{categories.length} Categories</span>
                            <span>{codes.filter(c => c.kind === 'code').length} Codes</span>
                        </div>
                    </div>

                    {/* MIDDLE PANE: The Narrative */}
                    <div className="flex-1 bg-zinc-900/30 flex flex-col min-w-0">
                        {/* Toolbar / Core Selector */}
                        <div className="p-4 border-b border-zinc-800 flex flex-col gap-4 bg-zinc-950/30">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase text-zinc-500 whitespace-nowrap flex items-center gap-1">
                                    <Crown size={12} className="text-yellow-500" /> Core Category:
                                </span>
                                <div className="relative flex-1 max-w-md">
                                    <select 
                                        value={selectedCoreId}
                                        onChange={handleCoreChange}
                                        className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-600 outline-none appearance-none"
                                    >
                                        <option value="">-- Select Central Phenomenon --</option>
                                        {codes.map(code => (
                                            <option key={code.id} value={code.id}>
                                                {code.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-2.5 text-zinc-500 pointer-events-none" size={12} />
                                </div>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="gap-2 text-xs border-zinc-700 ml-auto"
                                    disabled={!coreCode || isGenerating}
                                    onClick={handleGenerateStory}
                                >
                                    {isGenerating ? <Sparkles className="animate-spin text-purple-400" size={12}/> : <Sparkles className="text-purple-400" size={12}/>}
                                    AI Assist
                                </Button>
                            </div>
                        </div>

                        {/* Editor Area */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="max-w-3xl mx-auto space-y-4">
                                <div className="text-center mb-8">
                                    <h1 className="text-2xl font-serif text-zinc-200 mb-2">
                                        {theoryArtefact.content ? "The Emerging Theory" : "Drafting the Theory"}
                                    </h1>
                                    <p className="text-zinc-500 text-sm italic">
                                        Synthesize the relationships between the core category and sub-categories.
                                    </p>
                                </div>
                                
                                {theoryArtefact.content ? (
                                    <div className="prose prose-invert prose-zinc max-w-none">
                                        {/* In a real app, this would be a TipTap or Slate editor. Using text display for now. */}
                                        <div className="whitespace-pre-wrap leading-relaxed text-zinc-300 text-base font-serif">
                                            {theoryArtefact.content}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-zinc-800 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-4 text-zinc-600">
                                        <BookOpen size={32} className="opacity-20" />
                                        <p>No narrative content yet. Select a core category and use AI Assist or write manually.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANE: Context Inspector */}
                    <div className="w-80 bg-zinc-950 border-l border-zinc-800 flex flex-col">
                        {activeCategoryData ? (
                            <>
                                <div className="p-4 border-b border-zinc-800 bg-zinc-900/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activeCategoryData.category.color }} />
                                        <h2 className="font-bold text-zinc-100">{activeCategoryData.category.name}</h2>
                                    </div>
                                    <p className="text-xs text-zinc-400 leading-snug">
                                        {activeCategoryData.category.description || "No description provided."}
                                    </p>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                    {/* Related Codes */}
                                    <div>
                                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Tag size={12}/> Child Codes
                                        </h3>
                                        <div className="flex flex-wrap gap-1.5">
                                            {activeCategoryData.childCodes.length > 0 ? activeCategoryData.childCodes.map(c => (
                                                <React.Fragment key={c.id}>
                                                    <Badge variant="outline" className="border-zinc-700 text-zinc-400 font-normal">
                                                        {c.name}
                                                    </Badge>
                                                </React.Fragment>
                                            )) : (
                                                <span className="text-zinc-600 text-xs italic">No child codes.</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Memos */}
                                    <div>
                                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <StickyNote size={12}/> Related Memos ({activeCategoryData.relatedMemos.length})
                                        </h3>
                                        <div className="space-y-2">
                                            {activeCategoryData.relatedMemos.length > 0 ? activeCategoryData.relatedMemos.slice(0, 3).map(m => (
                                                <Card key={m.id} className="bg-zinc-900 border-zinc-800 p-3">
                                                    <div className="font-semibold text-xs text-zinc-300 mb-1">{m.title}</div>
                                                    <div className="text-[10px] text-zinc-500 line-clamp-3">{m.content}</div>
                                                </Card>
                                            )) : (
                                                <span className="text-zinc-600 text-xs italic">No linked memos.</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Evidence / Quotes */}
                                    <div>
                                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Quote size={12}/> Grounded Evidence ({activeCategoryData.relatedCodings.length})
                                        </h3>
                                        <div className="space-y-3">
                                            {activeCategoryData.relatedCodings.length > 0 ? activeCategoryData.relatedCodings.slice(0, 5).map(coding => {
                                                const sourceArt = artifacts.find(a => a.id === coding.artifactId);
                                                return (
                                                    <div key={coding.id} className="border-l-2 border-zinc-800 pl-3 py-1">
                                                        <p className="text-xs text-zinc-300 italic mb-1">"{coding.textSnippet}"</p>
                                                        <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                                                            <FileText size={8} /> 
                                                            {sourceArt ? sourceArt.name : 'Unknown Source'}
                                                        </div>
                                                    </div>
                                                )
                                            }) : (
                                                <span className="text-zinc-600 text-xs italic">No direct codings found.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-600 p-8 text-center gap-2">
                                <Layout size={32} className="opacity-20" />
                                <p className="text-sm font-medium">Concept Inspector</p>
                                <p className="text-xs">Select a category from the directory to view its definition, memos, and grounding evidence.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* VIEW 2: INTEGRATION DASHBOARD */}
            {activeView === 'dashboard' && (
                <div className="h-full w-full animate-in fade-in slide-in-from-right-4 duration-300 p-8 overflow-y-auto">
                    <TheoryDashboard 
                        researchQuestions={researchQuestions}
                        memos={memos}
                        codes={codes}
                        onUpdateMemo={onUpdateMemo}
                    />
                </div>
            )}
        </div>
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