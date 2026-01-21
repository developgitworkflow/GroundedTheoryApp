import React, { useState } from 'react';
import { Code, Memo } from '../types';
import { Crown, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { generateTheoreticalMemo } from '../services/geminiService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface TheoryBuilderProps {
  codes: Code[];
  memos: Memo[];
  onSetCoreCategory: (codeId: string) => void;
  onAddMemo: (title: string, content: string) => void;
}

export const TheoryBuilder: React.FC<TheoryBuilderProps> = ({ codes, memos, onSetCoreCategory, onAddMemo }) => {
  const [selectedCoreId, setSelectedCoreId] = useState<string>(codes.find(c => c.isCore)?.id || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [storyLine, setStoryLine] = useState('');

  const coreCode = codes.find(c => c.id === selectedCoreId);

  const handleCoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedCoreId(newId);
    if (newId) onSetCoreCategory(newId);
  };

  const handleGenerateStory = async () => {
    if (!coreCode) return;
    setIsGenerating(true);
    const otherCodes = codes.filter(c => c.id !== coreCode.id).map(c => c.name);
    const context = `Core Category: ${coreCode.name}. Related Concepts: ${otherCodes.join(', ')}. The goal is to explain how the Core Category resolves the main concern of the participants.`;
    
    const generated = await generateTheoreticalMemo([coreCode.name], context);
    setStoryLine(generated);
    if (generated) {
        onAddMemo(`Story Line: ${coreCode.name}`, generated);
    }
    setIsGenerating(false);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/30 overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex items-end justify-between border-b border-zinc-800 pb-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3 text-zinc-100 tracking-tight">
                    <Crown className="text-yellow-500 fill-yellow-500/20" />
                    The Curated Model
                </h1>
                <p className="text-zinc-400 mt-2 text-lg max-w-2xl">
                    Define the Core Category and articulate the relationships between concepts. This is the culmination of the Grounded Theory process.
                </p>
            </div>
            <Badge variant="secondary" className="hidden md:flex">Selective Coding Phase</Badge>
        </div>

        {/* Core Category Selector */}
        <Card className="border-zinc-800 bg-zinc-950/50">
            <CardHeader>
                <CardTitle className="text-lg uppercase tracking-wide text-zinc-400 text-sm font-bold">Step 1: Core Category</CardTitle>
                <CardDescription>Select the central phenomenon that integrates all other categories.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative w-full max-w-md">
                        <select 
                            value={selectedCoreId}
                            onChange={handleCoreChange}
                            className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-md px-4 py-3 text-base focus:ring-2 focus:ring-blue-600 focus:outline-none appearance-none transition-all hover:border-zinc-600"
                        >
                            <option value="">-- Choose the central phenomenon --</option>
                            {codes.map(code => (
                                <option key={code.id} value={code.id}>
                                    {code.name}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
                            <ArrowRight size={14} className="rotate-90" />
                        </div>
                    </div>
                    {coreCode && (
                        <Badge variant="default" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 px-3 py-1.5 text-sm gap-2">
                            <Crown size={14} /> Current Core
                        </Badge>
                    )}
                </div>
            </CardContent>
            {coreCode && (
                <CardFooter className="bg-zinc-900/30 border-t border-zinc-800/50 flex flex-col items-start gap-4 py-6">
                    <div className="space-y-1">
                         <h4 className="text-sm font-medium text-zinc-200">AI Assistance</h4>
                         <p className="text-xs text-zinc-500">Generate a theoretical storyline connecting "{coreCode.name}" to other codes.</p>
                    </div>
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

        {/* Story Line Area */}
        {(storyLine || memos.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Generated Story Line */}
                <Card className="border-zinc-800 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-zinc-950 to-zinc-900 border-b border-zinc-800/50">
                        <CardTitle className="text-base flex items-center gap-2 text-purple-400">
                             <Sparkles size={16} /> Emergent Theory
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {storyLine ? (
                            <div className="prose prose-invert prose-sm leading-relaxed text-zinc-300">
                                <p>{storyLine}</p>
                            </div>
                        ) : (
                            <div className="text-zinc-600 italic text-sm py-8 text-center">
                                Select a core category and generate a story line to see the AI synthesis.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Theoretical Memos List */}
                <Card className="border-zinc-800">
                     <CardHeader className="bg-gradient-to-r from-zinc-950 to-zinc-900 border-b border-zinc-800/50">
                        <CardTitle className="text-base flex items-center gap-2 text-blue-400">
                            <AlertCircle size={16} /> Theoretical Memos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                        {memos.length === 0 && <p className="text-zinc-600 text-sm p-4 text-center">No memos recorded yet.</p>}
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
                    </CardContent>
                </Card>
            </div>
        )}
      </div>
    </div>
  );
};