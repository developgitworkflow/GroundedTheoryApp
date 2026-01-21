import React, { useState, useMemo } from 'react';
import { Code, Memo, Theory, ResearchQuestion, Coding, Artifact, ProjectSettings } from '../types';
import { 
    Crown, 
    Sparkles, 
    AlertCircle, 
    ArrowRight, 
    BookOpen, 
    Layout, 
    Search, 
    Folder, 
    Tag, 
    FileText, 
    Quote, 
    ChevronRight, 
    ChevronDown, 
    StickyNote,
    Lightbulb,
    Plus,
    Network,
    Table,
    Edit,
    Trash2,
    Save,
    X
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
  onAddFinding?: (title: string, content: string) => void;
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
  const [isCreatingFinding, setIsCreatingFinding] = useState(false);
  const [newFindingTitle, setNewFindingTitle] = useState('');
  const [newFindingContent, setNewFindingContent] = useState('');
  const [editingFindingId, setEditingFindingId] = useState<string | null>(null);

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

  const submitNewFinding = () => {
      if (newFindingTitle && newFindingContent && onAddFinding) {
          onAddFinding(newFindingTitle, newFindingContent);
          setNewFindingTitle('');
          setNewFindingContent('');
          setIsCreatingFinding(false);
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

            {/* VIEW: FINDINGS MANAGER (CRUD) */}
            {activeView === 'findings' && (
                <div className="h-full w-full animate-in fade-in duration-300 p-8 overflow-y-auto">
                    <div className="max-w-5xl mx-auto space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                                    <Lightbulb size={20} className="text-amber-500" />
                                    Emergent Findings
                                </h2>
                                <p className="text-sm text-zinc-500">Manage key theoretical insights derived from data.</p>
                            </div>
                            <Button 
                                onClick={() => setIsCreatingFinding(true)}
                                className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                            >
                                <Plus size={16} /> New Finding
                            </Button>
                        </div>

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
                                                onChange={(e) => finding.title = e.target.value} // Temporary mutation for this interaction
                                                className="bg-zinc-950 border-zinc-700 font-bold"
                                            />
                                            <textarea 
                                                defaultValue={finding.content}
                                                onChange={(e) => finding.content = e.target.value}
                                                className="w-full h-32 bg-zinc-950 border border-zinc-700 rounded-md p-3 text-sm text-zinc-200 resize-none"
                                            />
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => setEditingFindingId(null)}>Cancel</Button>
                                                <Button variant="brand" size="sm" onClick={() => {
                                                    onUpdateMemo(finding.id, { title: finding.title, content: finding.content });
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
                                                    <Button size="icon" variant="ghost" onClick={() => setEditingFindingId(finding.id)} className="h-8 w-8 text-zinc-500 hover:text-white">
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
                                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-800/50">
                                                <span className="text-[10px] text-zinc-600 font-mono">ID: {finding.id}</span>
                                                <div className="flex gap-1 ml-auto">
                                                    {finding.relatedIds.length > 0 ? (
                                                        <Badge variant="secondary" className="text-[10px] h-5 bg-zinc-800 text-zinc-400">
                                                            {finding.relatedIds.length} Linked Items
                                                        </Badge>
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