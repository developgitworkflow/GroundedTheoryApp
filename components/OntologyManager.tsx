
import React, { useState, useMemo } from 'react';
import { Code, Coding } from '../types';
import { 
  Search, 
  FolderTree, 
  Table as TableIcon, 
  Plus, 
  GitMerge, 
  Loader2, 
  ChevronRight, 
  ChevronDown, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  FolderOpen,
  Folder,
  Tag,
  Move,
  CornerDownRight,
  BookType,
  LayoutGrid,
  Box,
  Layers,
  MoreVertical,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '../lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuLabel 
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { CodeEditDialog } from './CodeEditDialog';

interface OntologyManagerProps {
  codes: Code[];
  codings: Coding[];
  onNodeClick: (id: string) => void;
  selectedCodeId?: string | null;
  onCreateCode: (name: string, kind?: 'code' | 'category', parentId?: string, description?: string, color?: string) => Promise<Code>;
  onUpdateCode: (id: string, updates: Partial<Code>) => void;
  onCodeDrop: (sourceId: string, targetId: string) => void;
  onDeleteCode: (id: string) => void;
  onElaborate: () => void;
  isElaborating: boolean;
}

export const OntologyManager: React.FC<OntologyManagerProps> = ({
  codes,
  codings,
  onNodeClick,
  selectedCodeId,
  onCreateCode,
  onUpdateCode,
  onCodeDrop,
  onDeleteCode,
  onElaborate,
  isElaborating
}) => {
  const [viewMode, setViewMode] = useState<'tree' | 'table' | 'deck'>('deck');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRootDragOver, setIsRootDragOver] = useState(false);
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingCode, setEditingCode] = useState<Partial<Code> | undefined>(undefined);
  const [targetParentId, setTargetParentId] = useState<string | undefined>(undefined);

  // -- Tree Logic --
  const rootCodes = useMemo(() => codes.filter(c => !c.parentId), [codes]);
  
  // Handlers
  const handleOpenCreate = (parentId?: string, kind: 'code' | 'category' = 'code') => {
      setDialogMode('create');
      setEditingCode({ kind });
      setTargetParentId(parentId);
      setIsDialogOpen(true);
  };

  const handleOpenEdit = (code: Code) => {
      setDialogMode('edit');
      setEditingCode(code);
      setIsDialogOpen(true);
  };

  const handleDialogSave = (data: { name: string; kind: 'code' | 'category'; color: string; description: string }) => {
      if (dialogMode === 'create') {
          onCreateCode(data.name, data.kind, targetParentId, data.description, data.color);
      } else if (dialogMode === 'edit' && editingCode?.id) {
          onUpdateCode(editingCode.id, {
              name: data.name,
              kind: data.kind,
              color: data.color,
              description: data.description
          });
      }
  };

  // Root Drop Handlers
  const handleRootDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      if (!isRootDragOver) setIsRootDragOver(true);
  };

  const handleRootDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsRootDragOver(false);
  };

  const handleRootDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsRootDragOver(false);
      const draggedId = e.dataTransfer.getData('text/plain');
      if (!draggedId) return;

      const code = codes.find(c => c.id === draggedId);
      // Only update if it currently has a parent (moving to root)
      if (code && code.parentId) {
          onUpdateCode(draggedId, { parentId: undefined });
      }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 relative">
        <CodeEditDialog 
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onSave={handleDialogSave}
            initialData={editingCode}
            mode={dialogMode}
            parentId={targetParentId}
        />

        {/* Top Toolbar */}
        <div className="p-3 border-b border-zinc-800 space-y-3 bg-zinc-950">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 text-zinc-500" size={14} />
                <Input 
                    className="pl-8 pr-2 h-9 bg-zinc-900 border-zinc-800 text-xs" 
                    placeholder="Search ontology..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Actions Row */}
            <div className="flex items-center justify-between">
                <div className="flex gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800">
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className={cn("h-6 w-6 rounded-sm", viewMode === 'deck' ? "bg-zinc-800 text-white" : "text-zinc-500")}
                        onClick={() => setViewMode('deck')}
                        title="Deck View"
                    >
                        <LayoutGrid size={14} />
                    </Button>
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className={cn("h-6 w-6 rounded-sm", viewMode === 'tree' ? "bg-zinc-800 text-white" : "text-zinc-500")}
                        onClick={() => setViewMode('tree')}
                        title="Tree View"
                    >
                        <FolderTree size={14} />
                    </Button>
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className={cn("h-6 w-6 rounded-sm", viewMode === 'table' ? "bg-zinc-800 text-white" : "text-zinc-500")}
                        onClick={() => setViewMode('table')}
                        title="Table View"
                    >
                        <TableIcon size={14} />
                    </Button>
                </div>
                
                <div className="flex items-center gap-1">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-xs border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white"
                        onClick={() => handleOpenCreate(undefined)}
                    >
                        <Plus size={12} className="mr-1" /> New
                    </Button>
                    <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-7 w-7 text-zinc-400 hover:text-white"
                         onClick={onElaborate}
                         disabled={isElaborating}
                         title="AI Structure"
                    >
                        {isElaborating ? <Loader2 size={14} className="animate-spin" /> : <GitMerge size={14} />}
                    </Button>
                </div>
            </div>
        </div>

        {/* Content Area */}
        <div 
            className={cn(
                "flex-1 overflow-y-auto custom-scrollbar p-2 transition-colors", 
                isRootDragOver && viewMode === 'tree' ? "bg-zinc-800/50 ring-2 ring-inset ring-blue-500/50" : ""
            )}
            onDragOver={viewMode === 'tree' ? handleRootDragOver : undefined}
            onDragLeave={viewMode === 'tree' ? handleRootDragLeave : undefined}
            onDrop={viewMode === 'tree' ? handleRootDrop : undefined}
        >
            {viewMode === 'deck' && (
                <OntologyDeck 
                    codes={codes}
                    codings={codings}
                    searchTerm={searchTerm}
                    selectedCodeId={selectedCodeId}
                    onNodeClick={onNodeClick}
                    onUpdateCode={onUpdateCode}
                    onDeleteCode={onDeleteCode}
                    onEditCode={handleOpenEdit}
                    onCreateCode={handleOpenCreate}
                    onCodeDrop={onCodeDrop}
                />
            )}

            {viewMode === 'tree' && (
                <div className="space-y-1 min-h-[300px] relative">
                    {rootCodes.length === 0 && <div className="text-zinc-600 text-xs text-center py-4">No codes defined. Create one to begin.</div>}
                    {rootCodes.map(code => (
                        <TreeItem 
                            key={code.id}
                            code={code}
                            allCodes={codes}
                            codings={codings}
                            depth={0}
                            searchTerm={searchTerm}
                            selectedCodeId={selectedCodeId}
                            onNodeClick={onNodeClick}
                            onUpdateCode={onUpdateCode}
                            onCodeDrop={onCodeDrop}
                            onDeleteCode={onDeleteCode}
                            onEditCode={handleOpenEdit}
                            onCreateChild={(parentId) => handleOpenCreate(parentId)}
                        />
                    ))}
                    <div className="pt-2 mt-2 border-t border-zinc-800/50">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full justify-start text-xs text-zinc-500 hover:text-zinc-300"
                            onClick={() => handleOpenCreate(undefined)}
                        >
                            <Plus size={12} className="mr-2"/> New Root Item
                        </Button>
                    </div>
                </div>
            )}
            
            {viewMode === 'table' && (
                <OntologyTable 
                    codes={codes}
                    codings={codings}
                    searchTerm={searchTerm}
                    onUpdateCode={onUpdateCode}
                    onDeleteCode={onDeleteCode}
                    onEditCode={handleOpenEdit}
                    onCreateCode={() => handleOpenCreate(undefined)}
                />
            )}
        </div>
    </div>
  );
};

// --- DECK VIEW COMPONENTS ---

interface OntologyDeckProps {
    codes: Code[];
    codings: Coding[];
    searchTerm: string;
    selectedCodeId?: string | null;
    onNodeClick: (id: string) => void;
    onUpdateCode: (id: string, updates: Partial<Code>) => void;
    onDeleteCode: (id: string) => void;
    onEditCode: (code: Code) => void;
    onCreateCode: (parentId?: string, kind?: 'code' | 'category') => void;
    onCodeDrop: (sourceId: string, targetId: string) => void;
}

const OntologyDeck: React.FC<OntologyDeckProps> = (props) => {
    const { codes, searchTerm, onCreateCode, onCodeDrop } = props;

    // Filter
    const filteredCodes = codes.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Grouping
    const categories = filteredCodes.filter(c => c.kind === 'category');
    const openCodes = filteredCodes.filter(c => c.kind === 'code' && !c.parentId);

    // Root Drop for Deck (Moving codes back to Open Codes)
    const handleRootDeckDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        if (!draggedId) return;
        
        // Find if dragged item exists and has parent (is inside a category)
        const code = codes.find(c => c.id === draggedId);
        if (code && code.parentId) {
            props.onUpdateCode(draggedId, { parentId: undefined });
        }
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Categories Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <Folder size={14} className="text-amber-500" /> Categories ({categories.length})
                    </h3>
                    <Button variant="ghost" size="xs" onClick={() => onCreateCode(undefined, 'category')} className="h-6 text-zinc-500 hover:text-amber-500">
                        <Plus size={12} className="mr-1" /> Add
                    </Button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    {categories.map(cat => (
                        <DeckCategoryCard key={cat.id} category={cat} {...props} />
                    ))}
                    {categories.length === 0 && (
                        <div className="border border-dashed border-zinc-800 rounded-lg p-6 text-center text-zinc-600 text-xs italic">
                            No categories defined. Create a category to organize your codes.
                        </div>
                    )}
                </div>
            </div>

            {/* Open Codes Section */}
            <div 
                className="space-y-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleRootDeckDrop}
            >
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <Tag size={14} className="text-blue-500" /> Open Codes ({openCodes.length})
                    </h3>
                    <Button variant="ghost" size="xs" onClick={() => onCreateCode(undefined, 'code')} className="h-6 text-zinc-500 hover:text-blue-500">
                        <Plus size={12} className="mr-1" /> Add
                    </Button>
                </div>
                
                {openCodes.length > 0 ? (
                    <div className="flex flex-wrap gap-2 p-3 bg-zinc-950/50 border border-zinc-800/50 rounded-lg min-h-[80px]">
                        {openCodes.map(code => (
                            <DeckCodeItem key={code.id} code={code} {...props} />
                        ))}
                    </div>
                ) : (
                    <div className="border border-dashed border-zinc-800 rounded-lg p-6 text-center text-zinc-600 text-xs italic min-h-[80px] flex items-center justify-center">
                        No loose codes. Drag codes here to unassign them from categories.
                    </div>
                )}
            </div>
        </div>
    );
};

const DeckCategoryCard: React.FC<{ category: Code } & OntologyDeckProps> = (props) => {
    const { category, codes, codings, onCodeDrop, onNodeClick, selectedCodeId, onEditCode, onDeleteCode } = props;
    const [isDragOver, setIsDragOver] = useState(false);

    // Get children
    const childCodes = codes.filter(c => c.parentId === category.id);
    const usageCount = codings.filter(c => c.codeId === category.id).length;
    const childUsageCount = codings.filter(c => childCodes.map(child => child.id).includes(c.codeId)).length;

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const sourceId = e.dataTransfer.getData('text/plain');
        if (sourceId && sourceId !== category.id) {
            onCodeDrop(sourceId, category.id);
        }
    };

    return (
        <Card 
            className={cn(
                "bg-zinc-900 border-zinc-800 shadow-sm transition-all group",
                isDragOver ? "ring-2 ring-amber-500/50 bg-zinc-800" : "hover:border-zinc-700"
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
        >
            <div className="h-1 w-full rounded-t-lg" style={{ backgroundColor: category.color }} />
            <div className="p-3">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <Folder size={14} style={{ color: category.color }} className="shrink-0" />
                            <h4 
                                className={cn(
                                    "text-sm font-bold truncate cursor-pointer hover:underline",
                                    selectedCodeId === category.id ? "text-amber-400" : "text-zinc-200"
                                )}
                                onClick={() => onNodeClick(category.id)}
                            >
                                {category.name}
                            </h4>
                            {category.isCore && <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-yellow-900/20 text-yellow-500">CORE</Badge>}
                        </div>
                        {category.description && <p className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{category.description}</p>}
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onDeleteCode(category.id)}
                            title="Delete Category"
                        >
                            <Trash2 size={14} />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-zinc-300">
                                    <MoreHorizontal size={14} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800">
                                <DropdownMenuItem onClick={() => onEditCode(category)}>Edit Category</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => props.onCreateCode(category.id, 'code')}>Add Child Code</DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-zinc-800"/>
                                <DropdownMenuItem onClick={() => onDeleteCode(category.id)} className="text-red-500">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Children Container */}
                <div className="bg-zinc-950/50 rounded-md border border-zinc-800/50 p-2 min-h-[60px]">
                    {childCodes.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {childCodes.map(code => (
                                <DeckCodeItem key={code.id} code={code} {...props} isChild />
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-[10px] text-zinc-600 italic">
                            Drag codes here
                        </div>
                    )}
                </div>

                {/* Footer Stats */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/30 text-[10px] text-zinc-500">
                    <span title="Total codings in this category and children">Total Refs: {usageCount + childUsageCount}</span>
                    <span>{childCodes.length} Codes</span>
                </div>
            </div>
        </Card>
    );
};

const DeckCodeItem: React.FC<{ code: Code; isChild?: boolean } & OntologyDeckProps> = (props) => {
    const { code, codings, onNodeClick, selectedCodeId, onEditCode, onDeleteCode, isChild } = props;
    const usageCount = codings.filter(c => c.codeId === code.id).length;

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', code.id);
        e.stopPropagation();
    };

    return (
        <div 
            className={cn(
                "group flex items-center gap-1 rounded border select-none transition-all max-w-full overflow-hidden",
                selectedCodeId === code.id 
                    ? "bg-blue-900/30 border-blue-500 text-blue-200" 
                    : isChild 
                        ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600" 
                        : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            )}
        >
            {/* Clickable Area */}
            <div 
                draggable
                onDragStart={handleDragStart}
                className="flex items-center gap-1.5 pl-2 py-1 cursor-pointer active:cursor-grabbing hover:brightness-110 flex-1 min-w-0"
                onClick={() => onNodeClick(code.id)}
            >
                <Tag size={12} style={{ color: code.color }} className="shrink-0" />
                <span className="text-xs truncate">{code.name}</span>
                <span className="text-[9px] text-zinc-500 font-mono ml-0.5">{usageCount}</span>
            </div>

            {/* Hover Actions */}
            <div className="flex items-center pr-1 opacity-0 group-hover:opacity-100 transition-opacity gap-0.5">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300">
                            <MoreVertical size={10} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-zinc-950 border-zinc-800 z-50">
                        <DropdownMenuLabel className="text-xs text-zinc-500">{code.name}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEditCode(code)}>Edit</DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-800"/>
                        <DropdownMenuItem onClick={() => onDeleteCode(code.id)} className="text-red-500">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCode(code.id);
                    }}
                    className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-red-400"
                    title="Delete"
                >
                    <X size={10} />
                </button>
            </div>
        </div>
    );
};

// --- TREE VIEW COMPONENT ---

interface TreeItemProps {
    code: Code;
    allCodes: Code[];
    codings: Coding[];
    depth: number;
    searchTerm: string;
    selectedCodeId?: string | null;
    onNodeClick: (id: string) => void;
    onUpdateCode: (id: string, updates: Partial<Code>) => void;
    onCodeDrop: (sourceId: string, targetId: string) => void;
    onDeleteCode: (id: string) => void;
    onEditCode: (code: Code) => void;
    onCreateChild: (parentId: string) => void;
}

const TreeItem: React.FC<TreeItemProps> = (props) => {
    const { code, allCodes, codings, depth, searchTerm, selectedCodeId, onNodeClick, onCodeDrop, onDeleteCode, onEditCode, onCreateChild } = props;
    const [isExpanded, setIsExpanded] = useState(true);
    const [isDragOver, setIsDragOver] = useState(false);

    const children = allCodes.filter(c => c.parentId === code.id);
    const usageCount = codings.filter(c => c.codeId === code.id).length;
    
    // Filter logic for tree: show if name matches OR if children match
    const hasMatch = code.name.toLowerCase().includes(searchTerm.toLowerCase());
    const childHasMatch = children.some(child => child.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                        allCodes.filter(gc => gc.parentId === child.id).some(gc => gc.name.toLowerCase().includes(searchTerm.toLowerCase())));
    
    if (searchTerm && !hasMatch && !childHasMatch) return null;

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', code.id);
        e.stopPropagation();
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const sourceId = e.dataTransfer.getData('text/plain');
        if (sourceId && sourceId !== code.id) {
            onCodeDrop(sourceId, code.id);
        }
    };

    return (
        <div style={{ marginLeft: depth * 12 }}>
            <div 
                className={cn(
                    "flex items-center gap-1 p-1 rounded group transition-all select-none",
                    selectedCodeId === code.id ? "bg-blue-900/30 text-blue-200" : "hover:bg-zinc-800 text-zinc-300",
                    isDragOver && "bg-zinc-700 ring-1 ring-blue-500"
                )}
                draggable
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => onNodeClick(code.id)}
            >
                <div 
                    className={cn("p-0.5 rounded hover:bg-white/10 cursor-pointer transition-colors", children.length === 0 && "opacity-0")}
                    onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                >
                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </div>
                
                {code.kind === 'category' ? 
                    <Folder size={14} style={{ color: code.color }} className="mr-1" /> : 
                    <Tag size={14} style={{ color: code.color }} className="mr-1" />
                }

                <span className="text-sm truncate flex-1">{code.name}</span>
                
                <span className="text-[10px] text-zinc-500 font-mono px-1">{usageCount > 0 ? usageCount : ''}</span>

                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-0.5">
                    {code.kind === 'category' && (
                        <button 
                            className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
                            onClick={(e) => { e.stopPropagation(); onCreateChild(code.id); }}
                            title="Add Child"
                        >
                            <Plus size={10} />
                        </button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white">
                                <MoreVertical size={10} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-zinc-950 border-zinc-800 z-50">
                            <DropdownMenuLabel className="text-xs text-zinc-500">{code.name}</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onEditCode(code)}>Edit Details</DropdownMenuItem>
                            {code.kind === 'category' && (
                                <DropdownMenuItem onClick={() => onCreateChild(code.id)}>Add Sub-Code</DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator className="bg-zinc-800"/>
                            <DropdownMenuItem onClick={() => onDeleteCode(code.id)} className="text-red-500">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {isExpanded && children.length > 0 && (
                <div className="border-l border-zinc-800 ml-2 pl-1">
                    {children.map(child => (
                        <TreeItem 
                            key={child.id}
                            code={child}
                            allCodes={allCodes}
                            codings={codings}
                            depth={depth}
                            searchTerm={searchTerm}
                            selectedCodeId={selectedCodeId}
                            onNodeClick={onNodeClick}
                            onUpdateCode={props.onUpdateCode}
                            onCodeDrop={onCodeDrop}
                            onDeleteCode={onDeleteCode}
                            onEditCode={onEditCode}
                            onCreateChild={onCreateChild}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// --- TABLE VIEW COMPONENT ---

interface OntologyTableProps {
    codes: Code[];
    codings: Coding[];
    searchTerm: string;
    onUpdateCode: (id: string, updates: Partial<Code>) => void;
    onDeleteCode: (id: string) => void;
    onEditCode: (code: Code) => void;
    onCreateCode: () => void;
}

const OntologyTable: React.FC<OntologyTableProps> = ({ codes, codings, searchTerm, onUpdateCode, onDeleteCode, onEditCode, onCreateCode }) => {
    const filtered = codes.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="w-full h-full overflow-auto bg-zinc-900/30 rounded border border-zinc-800">
            <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950 text-zinc-500 text-xs uppercase font-medium sticky top-0 z-10">
                    <tr>
                        <th className="p-3 border-b border-zinc-800">Name</th>
                        <th className="p-3 border-b border-zinc-800">Kind</th>
                        <th className="p-3 border-b border-zinc-800">Usages</th>
                        <th className="p-3 border-b border-zinc-800">Description</th>
                        <th className="p-3 border-b border-zinc-800 w-16">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                    {filtered.map(code => {
                        const count = codings.filter(c => c.codeId === code.id).length;
                        return (
                            <tr key={code.id} className="hover:bg-zinc-800/30 transition-colors group">
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        {code.kind === 'category' ? (
                                            <Folder size={14} style={{ color: code.color }} className="shrink-0" />
                                        ) : (
                                            <Tag size={14} style={{ color: code.color }} className="shrink-0" />
                                        )}
                                        <span className="text-zinc-200 font-medium">{code.name}</span>
                                    </div>
                                </td>
                                <td className="p-3">
                                    <Badge variant="outline" className="text-[10px] h-5 border-zinc-700 text-zinc-400 capitalize bg-zinc-900/50">
                                        {code.kind}
                                    </Badge>
                                </td>
                                <td className="p-3 font-mono text-xs text-zinc-400">{count}</td>
                                <td className="p-3 text-xs text-zinc-500 max-w-[200px] truncate" title={code.description}>
                                    {code.description || '-'}
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => onEditCode(code)} className="p-1 text-zinc-500 hover:text-white"><Edit2 size={12}/></button>
                                        <button onClick={() => onDeleteCode(code.id)} className="p-1 text-zinc-500 hover:text-red-500"><Trash2 size={12}/></button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    {filtered.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-zinc-600 text-xs italic">
                                No codes found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
