import React from 'react';
import { LayerConfig, LayerType } from '../types';
import { Layers, Eye, EyeOff, FileText, Tag, Network, BookOpen } from 'lucide-react';

interface LayerControlProps {
  layers: LayerConfig[];
  toggleLayer: (id: LayerType) => void;
}

const getIcon = (type: LayerType) => {
  switch (type) {
    case LayerType.ARTIFACT: return <FileText size={16} />;
    case LayerType.OPEN_CODING: return <Tag size={16} />;
    case LayerType.AXIAL_CONNECTIONS: return <Network size={16} />;
    case LayerType.THEORY_MEMOS: return <BookOpen size={16} />;
    default: return <Layers size={16} />;
  }
};

export const LayerControl: React.FC<LayerControlProps> = ({ layers, toggleLayer }) => {
  return (
    <div className="bg-gray-900 border-r border-gray-700 w-64 flex flex-col h-full shadow-xl z-20">
      <div className="p-4 border-b border-gray-700 flex items-center gap-2 bg-gray-950">
        <Layers className="text-blue-400" />
        <h2 className="text-gray-100 font-bold uppercase tracking-wider text-sm">View Layers</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {layers.map((layer) => (
          <div 
            key={layer.id}
            onClick={() => toggleLayer(layer.id)}
            className={`
              group flex items-center justify-between p-3 rounded-md cursor-pointer transition-all duration-200
              ${layer.visible ? 'bg-gray-800 border-l-4 border-blue-500' : 'bg-transparent border-l-4 border-transparent hover:bg-gray-800 opacity-60'}
            `}
          >
            <div className="flex items-center gap-3 text-gray-200">
              <span className={`${layer.visible ? 'text-blue-400' : 'text-gray-500'}`}>
                {getIcon(layer.id)}
              </span>
              <span className="text-sm font-medium">{layer.label}</span>
            </div>
            <button className="text-gray-400 hover:text-white transition-colors">
              {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 bg-gray-950 text-xs text-gray-500 border-t border-gray-700">
        <p>Stratum v1.0.0</p>
        <p>Grounded Theory Engine</p>
      </div>
    </div>
  );
};
