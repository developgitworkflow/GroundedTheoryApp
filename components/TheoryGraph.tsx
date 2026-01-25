
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Code, Coding, LayerType } from '../types';
import { buildTheoryGraph, GraphNode, GraphLink } from '../lib/graphUtils';
import { ZoomIn, ZoomOut, Maximize, RefreshCw, Layers, Focus } from 'lucide-react';
import { Button } from './ui/button';

interface TheoryGraphProps {
  codes: Code[];
  codings: Coding[];
  layersVisible: Record<LayerType, boolean>;
  onNodeClick: (codeId: string) => void;
  selectedCodeId?: string | null;
}

// D3 Types
interface D3Node extends GraphNode, d3.SimulationNodeDatum {}
interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  type: GraphLink['type'];
  value: number;
}

export const TheoryGraph: React.FC<TheoryGraphProps> = ({ codes, codings, layersVisible, onNodeClick, selectedCodeId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current) {
        setDimensions({
          width: wrapperRef.current.clientWidth,
          height: wrapperRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleZoomIn = () => {
      if (svgRef.current && zoomRef.current) {
          d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.2);
      }
  };

  const handleZoomOut = () => {
      if (svgRef.current && zoomRef.current) {
          d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.8);
      }
  };

  const handleResetZoom = () => {
      if (svgRef.current && zoomRef.current) {
          d3.select(svgRef.current).transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity);
      }
  };

  useEffect(() => {
    if (!svgRef.current || !layersVisible[LayerType.AXIAL_CONNECTIONS]) return;

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear canvas

    // --- Definitions (Gradients & Filters) ---
    const defs = svg.append("defs");

    // Glow Filter for Core Nodes
    const filter = defs.append("filter")
        .attr("id", "glow")
        .attr("x", "-50%")
        .attr("y", "-50%")
        .attr("width", "200%")
        .attr("height", "200%");
    filter.append("feGaussianBlur")
        .attr("stdDeviation", "4")
        .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Arrow Markers
    const marker = defs.append("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 20) // Adjust based on node radius approx
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#6b7280");

    // 1. Data Prep
    const graphData = buildTheoryGraph(codes, codings);
    const nodes: D3Node[] = graphData.nodes.map(n => ({ ...n })); 
    const links: D3Link[] = graphData.links.map(l => ({ ...l }));

    // Create unique gradients for each node color dynamically
    nodes.forEach(node => {
        const gradId = `grad-${node.id}`;
        const gradient = defs.append("radialGradient")
            .attr("id", gradId)
            .attr("cx", "30%")
            .attr("cy", "30%")
            .attr("r", "70%");
        
        // Highlight
        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", d3.rgb(node.color).brighter(1.5).toString());
        // Main color
        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", node.color);
    });

    // 2. Zoom Setup
    const container = svg.append("g");
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
            container.attr("transform", event.transform);
            setZoomLevel(event.transform.k);
        });
    
    zoomRef.current = zoom;
    svg.call(zoom).on("dblclick.zoom", null);

    // 3. Simulation Setup
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links)
          .id((d: any) => d.id)
          .distance((d: any) => {
              if (d.type === 'hierarchy') return 80;
              if (d.type === 'theoretical') return 200; 
              return 150; 
          })
          .strength((d: any) => d.type === 'hierarchy' ? 0.8 : 0.2)
      )
      .force("charge", d3.forceManyBody().strength((d: any) => {
          if (d.isCore) return -800;
          if (d.kind === 'category') return -400;
          return -100;
      }))
      .force("collide", d3.forceCollide().radius((d: any) => {
          if (d.isCore) return 60;
          if (d.kind === 'category') return 35;
          return 15;
      }).strength(0.8))
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.05));

    // 4. Rendering Elements

    // Links
    const link = container.append("g")
      .attr("class", "links")
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("stroke", (d) => d.type === 'hierarchy' ? "#60a5fa" : "#4b5563") 
      .attr("stroke-opacity", (d) => d.type === 'hierarchy' ? 0.6 : 0.3)
      .attr("stroke-width", (d) => d.type === 'hierarchy' ? 2 : Math.sqrt(d.value))
      .attr("stroke-dasharray", (d) => d.type === 'association' ? "4 4" : "0")
      .attr("fill", "none")
      .attr("marker-end", (d) => d.type === 'hierarchy' ? "url(#arrowhead)" : null);

    // Nodes (Groups)
    const node = container.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<any, any>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

    // -- Node Shape (Sphere) --
    node.append("circle")
        .attr("r", d => {
            if (d.isCore) return 30;
            if (d.kind === 'category') return 18;
            return 6 + Math.sqrt(d.val);
        })
        .attr("fill", d => `url(#grad-${d.id})`) // Use defined gradient
        .attr("stroke", d => selectedCodeId === d.id ? "#fff" : (d.kind === 'code' ? "#18181b" : "none"))
        .attr("stroke-width", d => selectedCodeId === d.id ? 3 : 1)
        .style("filter", d => d.isCore ? "url(#glow)" : "none");

    // -- Node Labels --
    const labels = node.append("text")
      .text(d => d.name)
      .attr("x", d => d.kind === 'category' ? 0 : 12)
      .attr("y", d => d.kind === 'category' ? 35 : 4)
      .attr("text-anchor", d => d.kind === 'category' ? "middle" : "start")
      .attr("fill", d => d.kind === 'category' ? "#e4e4e7" : "#a1a1aa")
      .attr("font-size", d => d.kind === 'category' ? "11px" : "9px")
      .attr("font-weight", d => d.kind === 'category' ? "bold" : "normal")
      .style("pointer-events", "none")
      .style("text-shadow", "0 1px 4px black");

    // --- Hover Interactions ---
    node.on("mouseover", (event, d) => {
        setHoveredNodeId(d.id);
        
        // Spotlight Logic: Fade others
        const connectedNodeIds = new Set<string>();
        const connectedLinkIds = new Set<string>();
        
        connectedNodeIds.add(d.id);
        
        links.forEach((l: any) => {
            if (l.source.id === d.id) {
                connectedNodeIds.add(l.target.id);
                connectedLinkIds.add(`${l.source.id}-${l.target.id}`); // implicit check by obj ref usually better
            }
            if (l.target.id === d.id) {
                connectedNodeIds.add(l.source.id);
                connectedLinkIds.add(`${l.source.id}-${l.target.id}`);
            }
        });

        node.transition().duration(200)
            .style("opacity", (n) => connectedNodeIds.has(n.id) ? 1 : 0.1);
            
        link.transition().duration(200)
            .style("opacity", (l: any) => (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.05)
            .attr("stroke", (l: any) => (l.source.id === d.id || l.target.id === d.id) ? "#fff" : (l.type === 'hierarchy' ? "#60a5fa" : "#4b5563"));
            
        labels.transition().duration(200)
            .style("opacity", (n) => connectedNodeIds.has(n.id) ? 1 : 0.1);

    }).on("mouseout", () => {
        setHoveredNodeId(null);
        
        node.transition().duration(300).style("opacity", 1);
        link.transition().duration(300)
            .style("opacity", (d) => d.type === 'hierarchy' ? 0.6 : 0.3)
            .attr("stroke", (d) => d.type === 'hierarchy' ? "#60a5fa" : "#4b5563");
        
        // Re-apply semantic zoom opacity
        labels.transition().duration(300).style("opacity", (d) => (d.isCore || d.kind === 'category' || zoomLevel >= 0.8) ? 1 : 0);
    });

    // Click Handler
    node.on("click", (event, d) => {
        event.stopPropagation();
        onNodeClick(d.id);
    });

    // Simulation Tick
    simulation.on("tick", () => {
      link.attr("d", (d: any) => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dr = d.type === 'association' ? Math.sqrt(dx * dx + dy * dy) * 1.2 : 0; // Curve for associations
          return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      });

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
      
      // Semantic Zoom logic (only apply if not hovering)
      if (!hoveredNodeId) {
          labels.style("opacity", (d) => {
              if (d.isCore || d.kind === 'category') return 1;
              return zoomLevel < 0.8 ? 0 : 1; 
          });
      }
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [codes, codings, layersVisible, dimensions, selectedCodeId, zoomLevel]); // Removed hoveredNodeId dependency to prevent full re-render on hover

  if (!layersVisible[LayerType.AXIAL_CONNECTIONS]) return null;

  return (
    <div 
      ref={wrapperRef} 
      className="absolute inset-0 z-10 overflow-hidden bg-gradient-to-b from-zinc-950/80 to-zinc-950/30 pointer-events-none"
    >
      <svg 
        ref={svgRef} 
        width={dimensions.width} 
        height={dimensions.height} 
        className="cursor-move pointer-events-auto"
      />
      
      {/* Controls Overlay */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 bg-black/60 backdrop-blur-md p-1 rounded-lg border border-zinc-800/50 shadow-xl pointer-events-auto">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800" onClick={handleZoomIn} title="Zoom In">
              <ZoomIn size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800" onClick={handleZoomOut} title="Zoom Out">
              <ZoomOut size={16} />
          </Button>
          <div className="h-px bg-zinc-700 mx-2" />
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800" onClick={handleResetZoom} title="Reset View">
              <Maximize size={16} />
          </Button>
      </div>

      {/* Legend Overlay */}
      <div className="absolute top-4 right-4 bg-black/80 p-3 rounded-lg text-xs text-gray-300 backdrop-blur-md border border-zinc-800 pointer-events-auto select-none shadow-2xl">
        <div className="font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Layers size={12}/> Ontology Network
        </div>
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/20"></div> 
                <span className="text-zinc-200">Core Phenomenon</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-zinc-400 to-zinc-600 border border-zinc-500"></div> 
                <span>Category (Hub)</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div> 
                <span>Concept Code</span>
            </div>
            <div className="w-full h-px bg-zinc-700 my-2"></div>
            <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-blue-400"></div> 
                <span className="text-blue-200">Hierarchy</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 border-t border-dashed border-gray-500"></div> 
                <span className="text-zinc-500">Association</span>
            </div>
        </div>
      </div>
    </div>
  );
};
