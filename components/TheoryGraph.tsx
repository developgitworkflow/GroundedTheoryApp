import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Code, Coding, LayerType } from '../types';
import { buildTheoryGraph, GraphNode, GraphLink } from '../lib/graphUtils';
import { ZoomIn, ZoomOut, Maximize, RefreshCw, Layers } from 'lucide-react';
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

    // 1. Data Prep
    const graphData = buildTheoryGraph(codes, codings);
    const nodes: D3Node[] = graphData.nodes.map(n => ({ ...n })); 
    const links: D3Link[] = graphData.links.map(l => ({ ...l }));

    // 2. Zoom Setup
    const container = svg.append("g");
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
            container.attr("transform", event.transform);
            setZoomLevel(event.transform.k);
        });
    
    zoomRef.current = zoom;
    svg.call(zoom).on("dblclick.zoom", null); // Disable double click zoom

    // 3. Simulation Setup
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links)
          .id((d: any) => d.id)
          .distance((d: any) => {
              if (d.type === 'hierarchy') return 80; // Tighter cluster for category->child
              if (d.type === 'theoretical') return 200; // Longer links for core connections
              return 150; // Loose for associations
          })
          .strength((d: any) => {
              if (d.type === 'hierarchy') return 0.8;
              if (d.type === 'theoretical') return 0.1;
              return 0.2;
          })
      )
      .force("charge", d3.forceManyBody().strength((d: any) => {
          if (d.isCore) return -800;
          if (d.kind === 'category') return -400;
          return -100;
      }))
      .force("collide", d3.forceCollide().radius((d: any) => {
          if (d.isCore) return 60;
          if (d.kind === 'category') return 30;
          return 10;
      }).strength(0.7))
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.05));

    // 4. Rendering Elements

    // Define Arrow markers
    svg.append("defs").selectAll("marker")
        .data(["end"])
        .enter().append("marker")
        .attr("id", String)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 25)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#555");

    // Links
    const link = container.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) => d.type === 'hierarchy' ? "#60a5fa" : "#4b5563") // Blue for structure, gray for association
      .attr("stroke-opacity", (d) => d.type === 'hierarchy' ? 0.6 : 0.3)
      .attr("stroke-width", (d) => d.type === 'hierarchy' ? 2 : Math.sqrt(d.value))
      .attr("stroke-dasharray", (d) => d.type === 'association' ? "3 3" : "0");

    // Nodes (Groups)
    const node = container.append("g")
      .selectAll(".node")
      .data(nodes)
      .join("g")
      .attr("class", "node")
      .call(d3.drag<any, any>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

    // -- Visual Layer 1: Core Halo --
    node.filter(d => d.isCore)
        .append("circle")
        .attr("r", 40)
        .attr("fill", "url(#goldGradient)") // Simple fill for now
        .attr("fill-opacity", 0.2)
        .attr("stroke", "#fbbf24")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4 2")
        .attr("class", "animate-pulse-slow");

    // -- Visual Layer 2: Categories (The "Hubs") --
    node.filter(d => d.kind === 'category')
        .append("circle")
        .attr("r", d => d.isCore ? 25 : 15) // Larger radius
        .attr("fill", "#18181b") // Dark center
        .attr("stroke", d => d.color)
        .attr("stroke-width", d => selectedCodeId === d.id ? 4 : 3);

    // -- Visual Layer 3: Codes (The "Leaves") --
    node.filter(d => d.kind === 'code')
        .append("circle")
        .attr("r", d => 4 + Math.sqrt(d.val))
        .attr("fill", d => d.color)
        .attr("stroke", "#18181b")
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.9);

    // Interaction Circle (Invisible hit target larger than visual)
    node.append("circle")
        .attr("r", d => d.kind === 'category' ? 30 : 15)
        .attr("fill", "transparent")
        .attr("cursor", "pointer")
        .on("click", (e, d) => {
            e.stopPropagation();
            onNodeClick(d.id);
        });

    // Labels (Semantic Zoom Logic handled in Tick or CSS)
    const labels = node.append("text")
      .text(d => d.name)
      .attr("x", d => d.kind === 'category' ? 0 : 10)
      .attr("y", d => d.kind === 'category' ? 30 : 4)
      .attr("text-anchor", d => d.kind === 'category' ? "middle" : "start")
      .attr("fill", d => selectedCodeId === d.id ? "#60a5fa" : (d.kind === 'category' ? "#e4e4e7" : "#a1a1aa"))
      .attr("font-size", d => d.kind === 'category' ? "12px" : "10px")
      .attr("font-weight", d => d.kind === 'category' ? "bold" : "normal")
      .style("pointer-events", "none")
      .style("text-shadow", "0 1px 4px black");

    // Simulation Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
      
      // Semantic Zoom: Hide small labels when zoomed out
      labels.style("opacity", (d) => {
          if (d.isCore || d.kind === 'category') return 1;
          // Hide code labels if zoom < 0.8
          return zoomLevel < 0.8 ? 0 : 1; 
      });
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
  }, [codes, codings, layersVisible, dimensions, selectedCodeId, zoomLevel]);

  if (!layersVisible[LayerType.AXIAL_CONNECTIONS]) return null;

  return (
    <div 
      ref={wrapperRef} 
      className="absolute inset-0 z-10 overflow-hidden bg-gradient-to-b from-transparent to-zinc-950/20" 
    >
      <svg 
        ref={svgRef} 
        width={dimensions.width} 
        height={dimensions.height} 
        className="cursor-move"
      />
      
      {/* Controls Overlay */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 bg-black/40 backdrop-blur-md p-1 rounded-lg border border-zinc-800/50 shadow-xl">
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
      <div className="absolute top-4 right-4 bg-black/60 p-3 rounded-lg text-xs text-gray-300 backdrop-blur-sm border border-zinc-800 pointer-events-none select-none">
        <div className="font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Layers size={12}/> Network Layers
        </div>
        <div className="space-y-1.5">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-[#fbbf24] bg-transparent"></div> 
                <span>Core Category</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-zinc-500 bg-zinc-900"></div> 
                <span>Category (Hub)</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div> 
                <span>Open Code</span>
            </div>
            <div className="w-full h-px bg-zinc-700 my-1"></div>
            <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-blue-400 opacity-60"></div> 
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
