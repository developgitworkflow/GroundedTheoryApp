import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Code, Coding, LayerType } from '../types';
import { buildTheoryGraph, GraphNode, GraphLink } from '../lib/graphUtils';

interface TheoryGraphProps {
  codes: Code[];
  codings: Coding[];
  layersVisible: Record<LayerType, boolean>;
  onNodeClick: (codeId: string) => void;
  selectedCodeId?: string | null;
}

// Extend D3 types using our domain types
interface D3Node extends GraphNode, d3.SimulationNodeDatum {}
interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  source: string | D3Node;
  target: string | D3Node;
  value: number;
}

export const TheoryGraph: React.FC<TheoryGraphProps> = ({ codes, codings, layersVisible, onNodeClick, selectedCodeId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

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

  useEffect(() => {
    if (!svgRef.current || !layersVisible[LayerType.AXIAL_CONNECTIONS]) {
      if(svgRef.current && !layersVisible[LayerType.AXIAL_CONNECTIONS]) {
         d3.select(svgRef.current).selectAll("*").remove();
      }
      return;
    }

    // 1. Build Domain Graph
    // We clone the result to ensure D3 mutation doesn't affect source data if passing props down significantly changed
    const graphData = buildTheoryGraph(codes, codings);
    
    // Cast to D3 types for simulation
    const nodes: D3Node[] = graphData.nodes.map(n => ({ ...n })); 
    const links: D3Link[] = graphData.links.map(l => ({ ...l }));

    // 2. Clear previous
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;

    // 3. Simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance((d) => {
         return 120; 
      }))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: any) => (d.val * 6) + 15));

    // 4. Draw
    const link = svg.append("g")
      .attr("stroke", "#4b5563")
      .attr("stroke-opacity", 0.4)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", (d) => Math.sqrt(d.value));

    const nodeGroup = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<any, any>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

    // Node Circles
    nodeGroup.append("circle")
      .attr("r", (d) => d.isCore ? 30 : 5 + Math.sqrt(d.val) * 4)
      .attr("fill", (d) => d.color)
      .attr("stroke", (d) => {
          if (selectedCodeId === d.id) return "#60a5fa"; // Selected Highlight
          return d.isCore ? "#fff" : "#fff";
      })
      .attr("stroke-width", (d) => {
          if (selectedCodeId === d.id) return 4;
          return d.isCore ? 3 : 1.5;
      })
      .attr("stroke-dasharray", (d) => d.isCore ? "3 2" : "0")
      .attr("cursor", "pointer")
      .attr("filter", (d) => d.isCore ? "drop-shadow(0 0 8px rgba(253, 224, 71, 0.5))" : "")
      .on("click", (event, d) => onNodeClick(d.id));

    // Core Label Halo (if core)
    nodeGroup.filter(d => d.isCore)
        .append("text")
        .text("CORE")
        .attr("dy", -35)
        .attr("text-anchor", "middle")
        .attr("fill", "#fbbf24")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .attr("letter-spacing", "2px");

    // Labels
    nodeGroup.append("text")
      .text((d) => d.name)
      .attr("x", (d) => d.isCore ? 0 : 12)
      .attr("y", (d) => d.isCore ? 5 : 4)
      .attr("text-anchor", (d) => d.isCore ? "middle" : "start")
      .attr("fill", (d) => {
          if (selectedCodeId === d.id) return "#60a5fa";
          return d.isCore ? "#000" : "#e5e7eb";
      })
      .attr("font-size", (d) => d.isCore ? "10px" : "12px")
      .attr("font-weight", (d) => d.isCore ? "bold" : "normal")
      .attr("font-family", "sans-serif")
      .style("pointer-events", "none")
      .style("text-shadow", (d) => d.isCore ? "none" : "1px 1px 2px #000");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      nodeGroup.attr("transform", (d) => `translate(${d.x},${d.y})`);
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
  }, [codes, codings, layersVisible, dimensions, selectedCodeId]);

  if (!layersVisible[LayerType.AXIAL_CONNECTIONS]) return null;

  return (
    <div 
      ref={wrapperRef} 
      className="absolute inset-0 pointer-events-none z-10 overflow-hidden" 
      style={{ pointerEvents: 'none' }} 
    >
      <svg 
        ref={svgRef} 
        width={dimensions.width} 
        height={dimensions.height} 
        className="pointer-events-auto"
        style={{ background: 'transparent' }}
      />
      <div className="absolute bottom-4 right-4 bg-black/60 p-2 rounded text-xs text-gray-400 backdrop-blur-sm pointer-events-none border border-zinc-800">
        <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div> 
            <span>Core Category</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div> 
            <span>Open Codes</span>
        </div>
      </div>
    </div>
  );
};