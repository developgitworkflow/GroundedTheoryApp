import React from 'react';
import { MEMO_TYPES, MemoCategory } from '../types';
import { 
  BrainCircuit, 
  Wrench, 
  GitMerge, 
  Tag, 
  ClipboardList, 
  BookOpen, 
  Eye, 
  Microscope, 
  UserSearch, 
  ArrowRightCircle, 
  HelpCircle, 
  Quote,
  StickyNote
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Badge } from './ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';

export const getMemoIcon = (type: string) => {
  switch (type) {
    case 'theoretical': return BrainCircuit;
    case 'methodological': return Wrench;
    case 'integrative': return GitMerge;
    case 'concept': return Tag;
    case 'operational': return ClipboardList;
    case 'literature': return BookOpen;
    case 'descriptive': return Eye;
    case 'analytical': return Microscope;
    case 'reflective': return UserSearch;
    case 'propositional': return ArrowRightCircle;
    case 'question': return HelpCircle;
    case 'example': return Quote;
    default: return StickyNote;
  }
};

interface MemoTypeBadgeProps {
  type: string;
  className?: string;
  showLabel?: boolean;
  collapsed?: boolean; // Just the icon, no background container logic sometimes
  variant?: 'default' | 'outline' | 'subtle';
}

export const MemoTypeBadge: React.FC<MemoTypeBadgeProps> = ({ 
  type, 
  className, 
  showLabel = true, 
  collapsed = false,
  variant = 'subtle'
}) => {
  const typeInfo = MEMO_TYPES.find(t => t.id === type);
  const Icon = getMemoIcon(type);
  const color = typeInfo?.color || '#a1a1aa';

  if (collapsed) {
      return (
          <div 
            className={cn("flex items-center justify-center", className)} 
            title={typeInfo?.label || type}
            style={{ color }}
          >
              <Icon size={14} className="stroke-[2.5px]" />
          </div>
      )
  }

  const style = variant === 'subtle' 
    ? { backgroundColor: `${color}15`, color: color, borderColor: `${color}30` } // Lower opacity background for better contrast
    : variant === 'outline'
    ? { color: color, borderColor: color }
    : { backgroundColor: color, color: 'white', borderColor: color };

  return (
    <Badge 
        variant="outline" 
        className={cn(
            "gap-1.5 transition-all whitespace-nowrap h-5 px-2", // Fixed height for alignment
            variant === 'subtle' && "border",
            className
        )}
        style={style}
    >
        <Icon size={11} className="stroke-[2.5px]" />
        {showLabel && <span className="pt-[1px]">{typeInfo?.label || type}</span>}
    </Badge>
  );
};

interface MemoTypeSelectorProps {
    selected: string;
    onSelect: (type: MemoCategory) => void;
}

export const MemoTypeSelector: React.FC<MemoTypeSelectorProps> = ({ selected, onSelect }) => {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
                {MEMO_TYPES.map(t => {
                    const Icon = getMemoIcon(t.id);
                    const isSelected = selected === t.id;
                    return (
                        <HoverCard key={t.id} openDelay={200} closeDelay={100}>
                            <HoverCardTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => onSelect(t.id)}
                                    className={cn(
                                        "flex flex-col items-center justify-center h-14 w-full rounded-md border transition-all relative overflow-hidden group",
                                        isSelected 
                                            ? "bg-zinc-800 border-zinc-600 shadow-inner" 
                                            : "bg-zinc-950 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700"
                                    )}
                                >
                                    <div 
                                        className={cn("absolute inset-0 opacity-10 transition-opacity", isSelected ? "opacity-20" : "group-hover:opacity-10")} 
                                        style={{ backgroundColor: t.color }} 
                                    />
                                    <Icon 
                                        size={20} // Balanced size for all icons in grid
                                        strokeWidth={2}
                                        className={cn("mb-1.5 transition-transform duration-300", isSelected ? "scale-110" : "group-hover:scale-110")} 
                                        style={{ color: t.color }} 
                                    />
                                    <span className={cn("text-[9px] font-medium leading-none text-center w-full truncate px-1", isSelected ? "text-zinc-200" : "text-zinc-500 group-hover:text-zinc-400")}>
                                        {t.label}
                                    </span>
                                </button>
                            </HoverCardTrigger>
                            <HoverCardContent side="top" className="w-56 bg-zinc-950 border-zinc-800 p-3 shadow-xl z-[100]">
                                <div className="flex items-center gap-2 mb-1.5 pb-1.5 border-b border-zinc-800">
                                    <Icon size={14} style={{ color: t.color }} />
                                    <span className="text-xs font-bold text-zinc-200">{t.label}</span>
                                </div>
                                <p className="text-[10px] text-zinc-400 leading-relaxed">
                                    {t.purpose}
                                </p>
                            </HoverCardContent>
                        </HoverCard>
                    )
                })}
            </div>
            
            {/* Citation Annotation */}
            <div className="pt-2 border-t border-zinc-800/50">
                <p className="text-[8px] text-zinc-600 italic text-center leading-relaxed px-2">
                    Methodology: Corbin, J. M., & Strauss, A. L. (2015). <span className="underline decoration-zinc-700/50">Basics of qualitative research: Techniques and procedures for developing grounded theory</span> (4. Aufl.). SAGE.
                </p>
            </div>
        </div>
    );
};