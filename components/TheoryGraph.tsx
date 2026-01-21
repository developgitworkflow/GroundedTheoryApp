import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Code, Coding, LayerType } from '../types';

interface TheoryGraphProps {
  codes: Code[];
  codings: Coding[];
  layersVisible: Record<LayerType, boolean>;
  onNodeClick: (codeId: string) => void;
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  color: string;
  group: number;
  val: number; // Size based on frequency
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  value: number;
}

export const TheoryGraph: React.FC<TheoryGraphProps> = ({ codes, codings, layersVisible, onNodeClick }) => {
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
      // Clear if layer invisible
      if(svgRef.current && !layersVisible[LayerType.AXIAL_CONNECTIONS]) {
         d3.select(svgRef.current).selectAll("*").remove();
      }
      return;
    }

    // 1. Prepare Data
    // Nodes are codes
    const nodes: Node[] = codes.map(c => ({
      id: c.id,
      name: c.name,
      color: c.color,
      group: 1,
      val: codings.filter(coding => coding.codeId === c.id).length + 1
    }));

    // Links: Heuristic - if codes appear in the same artifact near each other, or if explicitly linked (future feature).
    // For now: Just create a "co-occurrence" simulation or link to a central 'Core Category' if defined.
    // Better: Connect nodes that appear in the same artifact.
    const links: Link[] = [];
    
    // Simple co-occurrence logic:
    const artifactGroups: Record<string, string[]> = {};
    codings.forEach(c => {
      if (!artifactGroups[c.artifactId]) artifactGroups[c.artifactId] = [];
      if (!artifactGroups[c.artifactId].includes(c.codeId)) artifactGroups[c.artifactId].push(c.codeId);
    });

    Object.values(artifactGroups).forEach(groupCodes => {
      for (let i = 0; i < groupCodes.length; i++) {
        for (let j = i + 1; j < groupCodes.length; j++) {
           // check if link exists
           const existing = links.find(l => 
             (l.source === groupCodes[i] && l.target === groupCodes[j]) || 
             (l.source === groupCodes[j] && l.target === groupCodes[i])
           );
           if (existing) {
             existing.value++;
           } else {
             links.push({ source: groupCodes[i], target: groupCodes[j], value: 1 });
           }
        }
      }
    });

    // 2. Clear previous
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;

    // 3. Simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: any) => (d.val * 5) + 10));

    // 4. Draw
    const link = svg.append("g")
      .attr("stroke", "#4b5563")
      .attr("stroke-opacity", 0.6)
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

    // Circles
    nodeGroup.append("circle")
      .attr("r", (d) => 5 + Math.sqrt(d.val) * 4)
      .attr("fill", (d) => d.color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("cursor", "pointer")
      .on("click", (event, d) => onNodeClick(d.id));

    // Labels
    nodeGroup.append("text")
      .text((d) => d.name)
      .attr("x", 12)
      .attr("y", 4)
      .attr("fill", "#e5e7eb")
      .attr("font-size", "12px")
      .attr("font-family", "sans-serif")
      .style("pointer-events", "none")
      .style("text-shadow", "1px 1px 2px #000");

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
  }, [codes, codings, layersVisible, dimensions]);

  if (!layersVisible[LayerType.AXIAL_CONNECTIONS]) return null;

  return (
    <div 
      ref={wrapperRef} 
      className="absolute inset-0 pointer-events-none z-10 overflow-hidden" 
      style={{ pointerEvents: 'none' }} // Allow clicking through to text if needed, but we re-enable pointer events on SVG elements
    >
      {/* Re-enable pointer events for the SVG contents specifically */}
      <svg 
        ref={svgRef} 
        width={dimensions.width} 
        height={dimensions.height} 
        className="pointer-events-auto"
        style={{ background: 'transparent' }}
      />
      <div className="absolute bottom-4 right-4 bg-black/60 p-2 rounded text-xs text-gray-400 backdrop-blur-sm pointer-events-none">
        Layer: Theory Network
      </div>
    </div>
  );
};