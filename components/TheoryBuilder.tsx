import React, { useState } from 'react';
import { Code, Memo, Theory } from '../types';
import { Crown, Sparkles, AlertCircle, ArrowRight, BookOpen, Layers, Tag } from 'lucide-react';
import { generateTheoreticalMemo } from '../services/geminiService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface TheoryBuilderProps {
  codes: Code[];
  memos: Memo[];
  onSetCoreCategory: (codeId: string) => void;
  onAddMemo: (title: string, content: string) => void;
  theoryArtefact: Theory; // Pass the Theory object
}

export const TheoryBuilder: React.FC<TheoryBuilderProps> = ({ codes, memos, onSetCoreCategory, onAddMemo, theoryArtefact }) => {
  const [selectedCoreId, setSelectedCoreId] = useState<string>(codes.find(c => c.isCore)?.id || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const coreCode = codes.find(c => c.id === selectedCoreId);
  const categories = codes.filter(c => c.kind === 'category');

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

  return (
    <div className="flex flex-col h-full bg-zinc-900/30 overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header: Theory Artefact Definition */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-6">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">The Emerging Theory</h1>
                    <Badge variant="outline" className={cn(
                        "uppercase tracking-widest text-[10px] py-1 px-2 border-zinc-700",
                        theoryArtefact.type === 'constructivist' && "text-purple-400 bg-purple-900/10",
                        theoryArtefact.type === 'straussian' && "text-blue-400 bg-blue-900/10",
                        theoryArtefact.type === 'classic' && "text-amber-400 bg-amber-900/10",
                    )}>
                        {theoryArtefact.type} Approach
                    </Badge>
                </div>
                <p className="text-zinc-400 text-lg max-w-2xl">
                    Structuring the relationships between conceptual categories.
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Theory Structure (List of Categories) */}
            <div className="space-y-6">
                <Card className="border-zinc-800 bg-zinc-950/50 h-full">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold uppercase text-zinc-400 flex items-center gap-2">
                            <Layers size={14} /> Structural Categories
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {categories.length === 0 && (
                            <p className="text-xs text-zinc-600 italic">No categories defined yet. Promote codes to categories in the Ontology view.</p>
                        )}
                        {categories.map(cat => (
                            <div key={cat.id} className="flex items-center justify-between p-2 rounded bg-zinc-900 border border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                    <span className={cn("text-sm font-medium", cat.isCore ? "text-yellow-500" : "text-zinc-300")}>
                                        {cat.name}
                                    </span>
                                </div>
                                {cat.isCore && <Crown size={12} className="text-yellow-500" />}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Middle/Right: Content & Core Category */}
            <div className="lg:col-span-2 space-y-6">
                 {/* Core Category Selector */}
                <Card className="border-zinc-800 bg-zinc-950/50">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase text-zinc-400 flex items-center gap-2">
                             <Crown size={14} className="text-yellow-500"/> Core Category
                        </CardTitle>
                        <CardDescription>Select the central phenomenon that integrates the categories below.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <div className="relative w-full">
                                <select 
                                    value={selectedCoreId}
                                    onChange={handleCoreChange}
                                    className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-md px-4 py-3 text-base focus:ring-2 focus:ring-blue-600 focus:outline-none appearance-none transition-all hover:border-zinc-600"
                                >
                                    <option value="">-- Choose the central phenomenon --</option>
                                    {codes.map(code => (
                                        <option key={code.id} value={code.id}>
                                            {code.name} {code.kind === 'category' ? '(Category)' : '(Code)'}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
                                    <ArrowRight size={14} className="rotate-90" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    {coreCode && (
                        <CardFooter className="bg-zinc-900/30 border-t border-zinc-800/50 flex flex-col items-start gap-4 py-6">
                            <Button 
                                onClick={handleGenerateStory}
                                disabled={isGenerating}
                                variant="brand"
                                className="w-full sm:w-auto"
                            >
                                {isGenerating ? <Sparkles className="animate-spin mr-2" size={16} /> : <Sparkles className="mr-2" size={16} />}
                                {isGenerating ? 'Synthesizing...' : 'Generate Story Line'}
                            </Button>
                        </CardFooter>
                    )}
                </Card>

                {/* Theory Content (TypeOfDocument) */}
                <Card className="border-zinc-800 overflow-hidden min-h-[300px]">
                    <CardHeader className="bg-gradient-to-r from-zinc-950 to-zinc-900 border-b border-zinc-800/50">
                        <CardTitle className="text-base flex items-center gap-2 text-purple-400">
                             <BookOpen size={16} /> Theory Content
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {theoryArtefact.content ? (
                            <div className="prose prose-invert prose-sm leading-relaxed text-zinc-300">
                                <p>{theoryArtefact.content}</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-zinc-600 gap-2">
                                <Sparkles size={24} className="opacity-20" />
                                <p className="italic text-sm">Select a core category and generate a story line to populate the theory content.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>

        {/* Memos List */}
        <div className="pt-8 border-t border-zinc-800">
            <h3 className="text-sm font-bold uppercase text-zinc-500 mb-4 flex items-center gap-2">
                <AlertCircle size={14} /> Theoretical Memos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {memos.length === 0 && <p className="text-zinc-600 text-sm italic">No theoretical memos recorded yet.</p>}
                {memos.map(memo => (
                    <div key={memo.id} className="group bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all cursor-pointer">
                        <h4 className="font-semibold text-zinc-200 text-sm mb-2">{memo.title}</h4>
                        <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">{memo.content}</p>
                        <div className="mt-3 flex items-center justify-between">
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal text-zinc-500 uppercase">{memo.type}</Badge>
                                <span className="text-[10px] text-zinc-600">{new Date(memo.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};