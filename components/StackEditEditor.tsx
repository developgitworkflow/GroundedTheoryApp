import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { 
    Bold, Italic, Heading, Quote, List, ListOrdered, 
    Link, Image, Code, Eye, EyeOff, Columns, Type 
} from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { cn } from '../lib/utils';

interface StackEditEditorProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    readOnly?: boolean;
}

export const StackEditEditor: React.FC<StackEditEditorProps> = ({ 
    value, 
    onChange, 
    className,
    readOnly = false 
}) => {
    const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
    const [html, setHtml] = useState('');

    useEffect(() => {
        const parseMarkdown = async () => {
            const rawMarkup = await marked.parse(value);
            setHtml(DOMPurify.sanitize(rawMarkup));
        };
        parseMarkdown();
    }, [value]);

    const insertSyntax = (syntax: string, wrap = '') => {
        // Simple append for now, ideally would insert at cursor
        onChange(value + (wrap ? `${syntax}text${wrap}` : syntax));
    };

    return (
        <div className={cn("flex flex-col h-full border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950", className)}>
            {/* Toolbar */}
            {!readOnly && (
                <div className="flex items-center justify-between p-2 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-center gap-1">
                        <ToolbarBtn icon={Bold} onClick={() => insertSyntax('**', '**')} tooltip="Bold" />
                        <ToolbarBtn icon={Italic} onClick={() => insertSyntax('*', '*')} tooltip="Italic" />
                        <ToolbarBtn icon={Heading} onClick={() => insertSyntax('# ')} tooltip="Heading" />
                        <div className="w-px h-4 bg-zinc-800 mx-1" />
                        <ToolbarBtn icon={Quote} onClick={() => insertSyntax('> ')} tooltip="Quote" />
                        <ToolbarBtn icon={List} onClick={() => insertSyntax('- ')} tooltip="List" />
                        <ToolbarBtn icon={ListOrdered} onClick={() => insertSyntax('1. ')} tooltip="Numbered List" />
                        <div className="w-px h-4 bg-zinc-800 mx-1" />
                        <ToolbarBtn icon={Link} onClick={() => insertSyntax('[Link](url)')} tooltip="Link" />
                        <ToolbarBtn icon={Image} onClick={() => insertSyntax('![Alt](url)')} tooltip="Image" />
                        <ToolbarBtn icon={Code} onClick={() => insertSyntax('```\n', '\n```')} tooltip="Code Block" />
                    </div>
                    
                    <div className="flex items-center gap-1 bg-zinc-900 rounded p-0.5 border border-zinc-800">
                        <button 
                            onClick={() => setViewMode('edit')}
                            className={cn("p-1.5 rounded transition-colors", viewMode === 'edit' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300")}
                            title="Editor Only"
                        >
                            <Type size={14} />
                        </button>
                        <button 
                            onClick={() => setViewMode('split')}
                            className={cn("p-1.5 rounded transition-colors", viewMode === 'split' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300")}
                            title="Split View"
                        >
                            <Columns size={14} />
                        </button>
                        <button 
                            onClick={() => setViewMode('preview')}
                            className={cn("p-1.5 rounded transition-colors", viewMode === 'preview' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300")}
                            title="Preview Only"
                        >
                            <Eye size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Editor Body */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Text Area */}
                <div className={cn(
                    "h-full overflow-hidden transition-all duration-300",
                    viewMode === 'split' ? "w-1/2 border-r border-zinc-800" : viewMode === 'edit' ? "w-full" : "w-0 hidden"
                )}>
                    <textarea 
                        className="w-full h-full bg-zinc-950 p-4 font-mono text-sm text-zinc-300 resize-none focus:outline-none leading-relaxed selection:bg-blue-500/30"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        spellCheck={false}
                        placeholder="# Start writing..."
                    />
                </div>

                {/* Preview Area */}
                <div className={cn(
                    "h-full overflow-y-auto transition-all duration-300 bg-zinc-900/30",
                    viewMode === 'split' ? "w-1/2" : viewMode === 'preview' ? "w-full" : "w-0 hidden"
                )}>
                    <div 
                        className="prose prose-invert prose-zinc max-w-none p-8 prose-headings:font-serif prose-headings:font-bold prose-p:leading-7 prose-a:text-blue-400 prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800"
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                </div>
            </div>
        </div>
    );
};

const ToolbarBtn = ({ icon: Icon, onClick, tooltip }: any) => (
    <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-800"
        onClick={onClick}
        title={tooltip}
    >
        <Icon size={14} />
    </Button>
);
