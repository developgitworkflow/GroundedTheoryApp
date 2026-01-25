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
  Tag,
  Move,
  CornerDownRight,
  BookType,
  LayoutGrid,
  Box,
  Layers
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
                        <Box size={14} className="text-amber-500" /> Categories ({categories.length})
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
                "bg-zinc-900 border-zinc-800 shadow-sm transition-all",
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
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div 
                    draggable
                    onDragStart={handleDragStart}
                    className={cn(
                        "group flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded border cursor-pointer select-none transition-all active:cursor-grabbing max-w-full",
                        selectedCodeId === code.id 
                            ? "bg-blue-900/30 border-blue-500 text-blue-200" 
                            : isChild 
                                ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600" 
                                : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    )}
                    onClick={(e) => {
                        // Prevent menu trigger on simple click if we want selection logic
                        // But context menu is better for actions.
                        // We'll use right click for menu in a real app, but here left click selects, long press or specific button for menu?
                        // Using Trigger asChild wraps this div. 
                        onNodeClick(code.id);
                    }}
                >
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: code.color }} />
                    <span className="text-xs truncate max-w-[120px]">{code.name}</span>
                    <span className="text-[9px] text-zinc-500 font-mono ml-1">{usageCount}</span>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-zinc-950 border-zinc-800 z-50">
                <DropdownMenuLabel className="text-xs text-zinc-500">{code.name}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEditCode(code)}>Edit</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800"/>
                <DropdownMenuItem onClick={() => onDeleteCode(code.id)} className="text-red-500">Delete</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

// ... TreeItem and OntologyTable components remain same as previous version ...
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

const TreeItem: React.FC<TreeItemProps> = ({ 
    code, allCodes, codings, depth, searchTerm, selectedCodeId, 
    onNodeClick, onUpdateCode, onCodeDrop, onDeleteCode, onEditCode, onCreateChild
}) => {
    const children = allCodes.filter(c => c.parentId === code.id);
    const [isOpen, setIsOpen] = useState(true);
    const [isDragOver, setIsDragOver] = useState(false);
    
    const usageCount = codings.filter(c => c.codeId === code.id).length;
    const isCategory = code.kind === 'category';

    const matches = code.name.toLowerCase().includes(searchTerm.toLowerCase());
    const hasMatchingChildren = children.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // --- DnD Handlers ---
    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', code.id);
        e.dataTransfer.effectAllowed = 'move';
        e.stopPropagation();
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragOver) setIsDragOver(true);
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

        const draggedId = e.dataTransfer.getData('text/plain');
        if (draggedId === code.id) return;

        // Delegate to global handler for disambiguation
        onCodeDrop(draggedId, code.id);
        
        if(!isOpen) setIsOpen(true); 
    };

    if (searchTerm && !matches && !hasMatchingChildren) return null;

    return (
        <div className="select-none text-sm">
             <div 
                className={cn(
                    "group flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer transition-all border border-transparent relative",
                    selectedCodeId === code.id ? "bg-blue-900/20 border-blue-900/50" : "hover:bg-zinc-800/80",
                    isDragOver ? "bg-zinc-800 ring-1 ring-blue-500/50 z-10 shadow-lg" : ""
                )}
                style={{ marginLeft: `${depth * 12}px` }}
                onClick={() => onNodeClick(code.id)}
                draggable
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Visual Connector for indented items */}
                {depth > 0 && (
                    <span className="absolute -left-3 text-zinc-700">
                        <CornerDownRight size={10} strokeWidth={1} />
                    </span>
                )}

                <div 
                    onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                    className={cn(
                        "p-0.5 rounded hover:bg-zinc-700 text-zinc-500 transition-transform", 
                        children.length === 0 && "opacity-0 pointer-events-none"
                    )}
                >
                    {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </div>

                {isCategory ? <FolderOpen size={14} className="text-amber-500/80" /> : <Tag size={14} style={{ color: code.color }} />}
                
                <span className={cn("text-xs font-medium truncate flex-1", selectedCodeId === code.id ? "text-blue-200" : "text-zinc-300")}>
                    {code.name}
                </span>

                {code.description && (
                    <span title={code.description} className="text-zinc-600 mr-1">
                        <BookType size={10} />
                    </span>
                )}

                <span className={cn("text-[10px] text-zinc-600 font-mono w-6 text-right", isDragOver && "opacity-0")}>
                    {usageCount}
                </span>
                
                {/* Drag Handle Indicator (Visual cue) */}
                <Move size={10} className="text-zinc-700 opacity-0 group-hover:opacity-100 cursor-grab" />

                {/* Context Menu Trigger (Visible on Hover) */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" className={cn("h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity", isDragOver && "opacity-0 pointer-events-none")}>
                             <MoreHorizontal size={12} className="text-zinc-400" />
                         </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 text-zinc-300 w-48 z-50">
                        <DropdownMenuLabel className="text-xs uppercase text-zinc-500">{code.name}</DropdownMenuLabel>
                        
                        <DropdownMenuItem onClick={() => onEditCode(code)}>
                            <Edit2 size={12} className="mr-2"/> Edit Code
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => onCreateChild(code.id)}>
                             <Plus size={12} className="mr-2"/> Add Child Code
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        
                        <DropdownMenuItem onClick={() => onDeleteCode(code.id)} className="text-red-400 focus:text-red-400">
                             <Trash2 size={12} className="mr-2"/> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {isOpen && children.map(child => (
                <TreeItem 
                    key={child.id}
                    code={child}
                    allCodes={allCodes}
                    codings={codings}
                    depth={depth + 1}
                    searchTerm={searchTerm}
                    selectedCodeId={selectedCodeId}
                    onNodeClick={onNodeClick}
                    onUpdateCode={onUpdateCode}
                    onCodeDrop={onCodeDrop}
                    onDeleteCode={onDeleteCode}
                    onEditCode={onEditCode}
                    onCreateChild={onCreateChild}
                />
            ))}
        </div>
    );
};

interface TableProps {
    codes: Code[];
    codings: Coding[];
    searchTerm: string;
    onUpdateCode: (id: string, updates: Partial<Code>) => void;
    onDeleteCode: (id: string) => void;
    onEditCode: (code: Code) => void;
    onCreateCode: () => void;
}

const OntologyTable: React.FC<TableProps> = ({ codes, codings, searchTerm, onUpdateCode, onDeleteCode, onEditCode, onCreateCode }) => {
    
    // Sort logic
    const filteredCodes = codes.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const categories = codes.filter(c => c.kind === 'category');

    return (
        <div className="w-full">
            <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-zinc-500 mb-2 px-2">
                <div className="col-span-4">Name</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-4">Parent Category</div>
                <div className="col-span-2 text-right">Usage</div>
            </div>

            <div className="space-y-1">
                {filteredCodes.map(code => (
                    <div key={code.id} className="grid grid-cols-12 gap-2 items-center p-2 bg-zinc-950/30 border border-zinc-800/50 rounded-md hover:bg-zinc-900 text-xs">
                        {/* Name & Color */}
                        <div className="col-span-4 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: code.color }} />
                            <span 
                                className="text-zinc-300 font-medium cursor-pointer hover:underline truncate flex-1"
                                onClick={() => onEditCode(code)}
                            >
                                {code.name}
                            </span>
                            {code.description && <BookType size={10} className="text-zinc-600 shrink-0" />}
                        </div>

                        {/* Kind Toggle */}
                        <div className="col-span-2">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                     <Badge variant="outline" className={cn(
                                         "cursor-pointer hover:bg-zinc-800 border-zinc-700",
                                         code.kind === 'category' ? "text-amber-500" : "text-blue-500"
                                     )}>
                                         {code.kind}
                                     </Badge>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                                    <DropdownMenuItem onClick={() => onUpdateCode(code.id, { kind: 'code' })}>Code</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onUpdateCode(code.id, { kind: 'category' })}>Category</DropdownMenuItem>
                                </DropdownMenuContent>
                             </DropdownMenu>
                        </div>

                        {/* Parent Dropdown */}
                        <div className="col-span-4">
                            <select 
                                className="w-full bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-zinc-400 text-[10px] focus:outline-none"
                                value={code.parentId || ''}
                                onChange={(e) => onUpdateCode(code.id, { parentId: e.target.value || undefined })}
                            >
                                <option value="">(Root)</option>
                                {categories.filter(c => c.id !== code.id).map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Usage & Delete */}
                        <div className="col-span-2 flex items-center justify-end gap-2">
                            <span className="font-mono text-zinc-500">{codings.filter(c => c.codeId === code.id).length}</span>
                            <Button size="icon" variant="ghost" className="h-5 w-5 text-zinc-600 hover:text-white" onClick={() => onEditCode(code)}>
                                <Edit2 size={12} />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-5 w-5 text-zinc-600 hover:text-red-500" onClick={() => onDeleteCode(code.id)}>
                                <Trash2 size={12} />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
             <div className="pt-4 border-t border-zinc-800 mt-4">
                 <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => onCreateCode(undefined)}
                >
                     <Plus size={12} className="mr-2" /> Add New Row
                 </Button>
             </div>
        </div>
    );
};