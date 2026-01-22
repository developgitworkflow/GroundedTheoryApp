
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
  CornerDownRight
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

interface OntologyManagerProps {
  codes: Code[];
  codings: Coding[];
  onNodeClick: (id: string) => void;
  selectedCodeId?: string | null;
  onCreateCode: (name: string, kind?: 'code' | 'category', parentId?: string) => Promise<Code>;
  onUpdateCode: (id: string, updates: Partial<Code>) => void;
  onDeleteCode: (id: string) => void;
  onElaborate: () => void;
  isElaborating: boolean;
}

// Cycle detection helper: Checks if targetId is a descendant of draggedId
const isDescendant = (targetId: string, draggedId: string, allCodes: Code[]): boolean => {
    if (targetId === draggedId) return true;
    const target = allCodes.find(c => c.id === targetId);
    if (!target || !target.parentId) return false;
    return isDescendant(target.parentId, draggedId, allCodes);
};

export const OntologyManager: React.FC<OntologyManagerProps> = ({
  codes,
  codings,
  onNodeClick,
  selectedCodeId,
  onCreateCode,
  onUpdateCode,
  onDeleteCode,
  onElaborate,
  isElaborating
}) => {
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRootDragOver, setIsRootDragOver] = useState(false);
  
  // -- Tree Logic --
  const rootCodes = useMemo(() => codes.filter(c => !c.parentId), [codes]);
  
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
    <div className="flex flex-col h-full bg-zinc-900">
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
            {viewMode === 'tree' ? (
                <div className="space-y-1 min-h-[300px] relative">
                    {rootCodes.length === 0 && <div className="text-zinc-600 text-xs text-center py-4">No codes defined. Drop here to create root items.</div>}
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
                            onDeleteCode={onDeleteCode}
                            onCreateCode={onCreateCode}
                        />
                    ))}
                    <div className="pt-2 mt-2 border-t border-zinc-800/50">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full justify-start text-xs text-zinc-500 hover:text-zinc-300"
                            onClick={() => {
                                const name = prompt("New Category Name:");
                                if(name) onCreateCode(name, 'category');
                            }}
                        >
                            <Plus size={12} className="mr-2"/> New Root Category
                        </Button>
                    </div>
                </div>
            ) : (
                <OntologyTable 
                    codes={codes}
                    codings={codings}
                    searchTerm={searchTerm}
                    onUpdateCode={onUpdateCode}
                    onDeleteCode={onDeleteCode}
                    onCreateCode={onCreateCode}
                />
            )}
        </div>
    </div>
  );
};

interface TreeItemProps {
    code: Code;
    allCodes: Code[];
    codings: Coding[];
    depth: number;
    searchTerm: string;
    selectedCodeId?: string | null;
    onNodeClick: (id: string) => void;
    onUpdateCode: (id: string, updates: Partial<Code>) => void;
    onDeleteCode: (id: string) => void;
    onCreateCode: (name: string, kind?: 'code' | 'category', parentId?: string) => Promise<Code>;
}

const TreeItem: React.FC<TreeItemProps> = ({ 
    code, allCodes, codings, depth, searchTerm, selectedCodeId, 
    onNodeClick, onUpdateCode, onDeleteCode, onCreateCode 
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
        if (!isCategory) return;
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
        if (!isCategory) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const draggedId = e.dataTransfer.getData('text/plain');
        if (draggedId === code.id) return;

        // Check for cycles
        if (isDescendant(code.id, draggedId, allCodes)) {
            alert("Cannot move a category into its own descendant.");
            return;
        }

        onUpdateCode(draggedId, { parentId: code.id });
        if(!isOpen) setIsOpen(true); // Auto expand on drop
    };

    if (searchTerm && !matches && !hasMatchingChildren) return null;

    return (
        <div className="select-none text-sm">
             <div 
                className={cn(
                    "group flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer transition-all border border-transparent",
                    selectedCodeId === code.id ? "bg-blue-900/20 border-blue-900/50" : "hover:bg-zinc-800/80",
                    isDragOver ? "bg-zinc-800 ring-2 ring-blue-500/50 z-10 relative" : ""
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

                <span className="text-[10px] text-zinc-600 font-mono w-6 text-right">
                    {usageCount}
                </span>
                
                {/* Drag Handle Indicator (Visual cue) */}
                <Move size={10} className="text-zinc-700 opacity-0 group-hover:opacity-100 cursor-grab" />

                {/* Context Menu Trigger (Visible on Hover) */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity">
                             <MoreHorizontal size={12} className="text-zinc-400" />
                         </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-300 w-48 z-50">
                        <DropdownMenuLabel className="text-xs uppercase text-zinc-500">{code.name}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => {
                            const newName = prompt("Rename code:", code.name);
                            if(newName) onUpdateCode(code.id, { name: newName });
                        }}>
                            <Edit2 size={12} className="mr-2"/> Rename
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => {
                            const newColor = prompt("New Color Hex:", code.color);
                            if(newColor) onUpdateCode(code.id, { color: newColor });
                        }}>
                             <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: code.color }} /> Change Color
                        </DropdownMenuItem>

                        {isCategory && (
                             <DropdownMenuItem onClick={() => {
                                 const name = prompt("New Sub-code Name:");
                                 if(name) onCreateCode(name, 'code', code.id);
                             }}>
                                 <Plus size={12} className="mr-2"/> Add Child Code
                             </DropdownMenuItem>
                        )}
                        
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
                    onDeleteCode={onDeleteCode}
                    onCreateCode={onCreateCode}
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
    onCreateCode: (name: string) => void;
}

const OntologyTable: React.FC<TableProps> = ({ codes, codings, searchTerm, onUpdateCode, onDeleteCode, onCreateCode }) => {
    
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
                            <Input 
                                className="h-6 bg-transparent border-none p-0 text-xs text-zinc-300 focus-visible:ring-0" 
                                value={code.name}
                                onChange={(e) => onUpdateCode(code.id, { name: e.target.value })}
                            />
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
                    onClick={() => {
                         const name = prompt("New Code Name:");
                         if(name) onCreateCode(name);
                    }}
                >
                     <Plus size={12} className="mr-2" /> Add New Row
                 </Button>
             </div>
        </div>
    );
};
