import React, { useState, useEffect } from 'react';
import { Code } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { 
  X, 
  Tag, 
  FolderTree, 
  Palette, 
  BookType, 
  Type
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Badge } from './ui/badge';

interface CodeEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; kind: 'code' | 'category'; color: string; description: string }) => void;
  initialData?: Partial<Code>;
  mode: 'create' | 'edit';
  parentId?: string; // Just for context display
}

const PRESET_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#84cc16', // Lime
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#d946ef', // Fuchsia
  '#f43f5e', // Rose
  '#71717a', // Zinc
];

export const CodeEditDialog: React.FC<CodeEditDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode,
  parentId
}) => {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'code' | 'category'>('code');
  const [color, setColor] = useState(PRESET_COLORS[6]);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setKind(initialData.kind || 'code');
        setColor(initialData.color || PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
        setDescription(initialData.description || '');
      } else {
        // Reset for clean create
        setName('');
        setKind('code');
        setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
        setDescription('');
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name, kind, color, description });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[450px] bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        
        {/* Header */}
        <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950 shrink-0">
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
             {mode === 'create' ? <Tag size={16} className="text-blue-500" /> : <Tag size={16} className="text-amber-500" />}
             {mode === 'create' ? 'Create New Code' : 'Edit Code Details'}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Name & Type */}
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <div className="flex-1 space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                                <Type size={10} /> Name
                            </label>
                            <Input 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Resilience"
                                className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500/50 font-bold text-zinc-200"
                                autoFocus
                            />
                        </div>
                        <div className="w-1/3 space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                                <FolderTree size={10} /> Type
                            </label>
                            <div className="flex bg-zinc-900 p-1 rounded-md border border-zinc-800">
                                <button
                                    type="button"
                                    onClick={() => setKind('code')}
                                    className={cn(
                                        "flex-1 text-[10px] py-1.5 rounded transition-all font-medium",
                                        kind === 'code' ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    Code
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setKind('category')}
                                    className={cn(
                                        "flex-1 text-[10px] py-1.5 rounded transition-all font-medium",
                                        kind === 'category' ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    Cat
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Color Picker */}
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                        <Palette size={10} /> Color Marker
                    </label>
                    <div className="flex flex-wrap gap-2 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                        {PRESET_COLORS.map(c => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setColor(c)}
                                className={cn(
                                    "w-5 h-5 rounded-full transition-all hover:scale-110",
                                    color === c ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110" : "opacity-70 hover:opacity-100"
                                )}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                        <input 
                            type="color" 
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-5 h-5 bg-transparent border-none p-0 rounded-full cursor-pointer ml-1"
                            title="Custom Color"
                        />
                    </div>
                </div>

                {/* Definition */}
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                            <BookType size={10} /> Operational Definition
                        </label>
                        <span className="text-[9px] text-zinc-600 italic">Optional</span>
                    </div>
                    <Textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Define what this code represents to ensure consistency..."
                        className="min-h-[100px] bg-zinc-900 border-zinc-800 text-xs text-zinc-300 resize-none focus-visible:ring-blue-500/50"
                    />
                </div>

                {/* Footer */}
                <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800/50">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="brand" disabled={!name}>
                        {mode === 'create' ? 'Create Code' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};