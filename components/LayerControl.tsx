import React from 'react';
import { LayerConfig, LayerType } from '../types';
import { Layers, Eye, EyeOff, FileText, Tag, Network, BookOpen, FolderTree } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface LayerControlProps {
  layers: LayerConfig[];
  toggleLayer: (id: LayerType) => void;
}

const getIcon = (type: LayerType) => {
  switch (type) {
    case LayerType.ARTIFACT: return <FileText size={16} />;
    case LayerType.OPEN_CODING: return <Tag size={16} />;
    case LayerType.CATEGORIES: return <FolderTree size={16} />;
    case LayerType.AXIAL_CONNECTIONS: return <Network size={16} />;
    case LayerType.THEORY_MEMOS: return <BookOpen size={16} />;
    default: return <Layers size={16} />;
  }
};

export const LayerControl: React.FC<LayerControlProps> = ({ layers, toggleLayer }) => {
  return (
    <Card className="h-full w-72 rounded-none border-r border-y-0 border-l-0 bg-zinc-900/50 backdrop-blur-sm z-20 flex flex-col">
      <CardHeader className="pb-4 border-b border-zinc-800/50">
        <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-400">
          <Layers size={16} />
          Layers
        </CardTitle>
      </CardHeader>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {layers.map((layer) => (
          <div 
            key={layer.id}
            onClick={() => toggleLayer(layer.id)}
            className={cn(
              "group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 border",
              layer.visible 
                ? "bg-zinc-800/80 border-zinc-700 shadow-sm" 
                : "bg-transparent border-transparent hover:bg-zinc-800/40 text-zinc-500"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-md transition-colors",
                layer.visible ? "bg-zinc-950 text-blue-400" : "bg-zinc-900 text-zinc-600"
              )}>
                {getIcon(layer.id)}
              </div>
              <span className={cn("text-sm font-medium", layer.visible ? "text-zinc-200" : "text-zinc-500")}>
                {layer.label}
              </span>
            </div>
            
            <div className={cn("transition-opacity", layer.visible ? "opacity-100" : "opacity-0 group-hover:opacity-50")}>
               {layer.visible ? <Eye size={14} className="text-blue-400"/> : <EyeOff size={14} />}
            </div>
          </div>
        ))}
      </div>

      <CardFooter className="flex-col items-start gap-1 p-4 border-t border-zinc-800/50 text-[10px] text-zinc-600 uppercase tracking-wider bg-zinc-950/30">
        <div className="flex w-full justify-between items-center">
            <span>Stratum v1.0.0</span>
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-zinc-800">BETA</Badge>
        </div>
        <span>Grounded Theory Engine</span>
      </CardFooter>
    </Card>
  );
};