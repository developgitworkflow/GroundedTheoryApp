import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { Code, Coding, Artifact, ProjectSettings, Memo } from '../types';
import { buildTheoryGraph, GraphNode } from '../lib/graphUtils';
import { 
    BarChart3, PieChart, Activity, Grid, FileText, Table as TableIcon, Network, 
    ZoomIn, ZoomOut, Filter, X, ArrowRight, Quote, FolderTree, Tag, GitCommit, 
    Lightbulb, FileQuestion, Microscope, MousePointer2, Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import { ScrollArea } from './ui/scroll-area';

interface VisualizationsProps {
  codes: Code[];
  codings: Coding[];
  artifacts: Artifact[];
  settings: ProjectSettings;
  memos: Memo[];
}

type ChartType = 'bar' | 'donut' | 'sankey' | 'treemap' | 'cloud' | 'network' | 'table';

export const Visualizations: React.FC<VisualizationsProps> = ({ codes, codings, artifacts, settings, memos }) => {
  const [activeChart, setActiveChart] = useState<ChartType>('bar');

  // --- Data Processing Helpers ---

  // 1. Code Frequency
  const codeStats = useMemo(() => {
    return codes.map(code => ({
      ...code,
      count: codings.filter(c => c.codeId === code.id).length
    })).sort((a, b) => b.count - a.count);
  }, [codes, codings]);

  // 2. Word Frequency (for Cloud)
  const wordStats = useMemo(() => {
    const allText = artifacts.map(a => a.content).join(' ').toLowerCase();
    // Remove punctuation and split
    const words = allText.replace(/[^\w\s]/g, '').split(/\s+/);
    const stopSet = new Set(settings.stopWords.map(w => w.toLowerCase()));
    
    const counts: Record<string, number> = {};
    words.forEach(w => {
      if (w.length > 3 && !stopSet.has(w)) {
        counts[w] = (counts[w] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 100); // Top 100
  }, [artifacts, settings.stopWords]);

  return (
    <div className="flex h-full bg-zinc-950">
      {/* Sidebar Controls */}
      <div className="w-64 border-r border-zinc-800 bg-zinc-900/50 p-4 flex flex-col gap-2">
        <div className="mb-4 px-2">
            <h2 className="font-bold text-zinc-100 flex items-center gap-2">
                <Activity className="text-blue-500" size={20} />
                Analytics
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Visualize data patterns.</p>
        </div>
        
        <ChartNavButton active={activeChart === 'bar'} onClick={() => setActiveChart('bar')} icon={BarChart3} label="Bar Frequency" />
        <ChartNavButton active={activeChart === 'donut'} onClick={() => setActiveChart('donut')} icon={PieChart} label="Donut Ratio" />
        <ChartNavButton active={activeChart === 'treemap'} onClick={() => setActiveChart('treemap')} icon={Grid} label="Tree Map" />
        <ChartNavButton active={activeChart === 'sankey'} onClick={() => setActiveChart('sankey')} icon={Activity} label="Sankey Flow" />
        <ChartNavButton active={activeChart === 'network'} onClick={() => setActiveChart('network')} icon={Network} label="Network Graph" />
        <ChartNavButton active={activeChart === 'cloud'} onClick={() => setActiveChart('cloud')} icon={FileText} label="Word Cloud" />
        <ChartNavButton active={activeChart === 'table'} onClick={() => setActiveChart('table')} icon={TableIcon} label="Data Table" />
      </div>

      {/* Main Chart Area */}
      <div className="flex-1 overflow-hidden p-6 relative bg-zinc-950">
        <Card className="h-full border-zinc-800 bg-zinc-900/20 shadow-xl overflow-hidden flex flex-col">
            <CardHeader className="border-b border-zinc-800 pb-4 bg-zinc-900/50 shrink-0">
                <CardTitle className="text-zinc-200 flex items-center gap-2 text-lg">
                    {activeChart === 'bar' && 'Code Frequency Distribution'}
                    {activeChart === 'donut' && 'Coding Proportions'}
                    {activeChart === 'sankey' && 'Artifact-to-Code Flow (Bipartite)'}
                    {activeChart === 'treemap' && 'Code Density Treemap'}
                    {activeChart === 'cloud' && 'Content Word Cloud'}
                    {activeChart === 'network' && 'Co-Occurrence Network'}
                    {activeChart === 'table' && 'Coding Statistics'}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative min-h-0">
                {activeChart === 'bar' && <BarChart data={codeStats} />}
                {activeChart === 'donut' && <DonutChart data={codeStats} />}
                {activeChart === 'treemap' && <TreeMap data={codeStats} />}
                {activeChart === 'sankey' && <SankeyChart codes={codes} codings={codings} artifacts={artifacts} />}
                {activeChart === 'cloud' && <WordCloud words={wordStats} />}
                {activeChart === 'network' && <ForceGraph codes={codes} codings={codings} artifacts={artifacts} settings={settings} memos={memos} />}
                {activeChart === 'table' && <DataTable codes={codeStats} />}
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

// --- Chart Components ---

const ChartNavButton = ({ active, onClick, icon: Icon, label }: any) => (
    <Button 
        variant={active ? "secondary" : "ghost"} 
        className={active ? "bg-zinc-800 text-zinc-100 justify-start" : "text-zinc-500 hover:text-zinc-300 justify-start"}
        onClick={onClick}
    >
        <Icon size={16} className="mr-2" /> {label}
    </Button>
);

const BarChart = ({ data }: { data: (Code & { count: number })[] }) => {
    const ref = useRef<SVGSVGElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current || !wrapperRef.current) return;
        const svg = d3.select(ref.current);
        svg.selectAll("*").remove();

        const { width, height } = wrapperRef.current.getBoundingClientRect();
        const margin = { top: 20, right: 30, bottom: 100, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const x = d3.scaleBand()
            .range([0, innerWidth])
            .domain(data.map(d => d.name))
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.count) || 10])
            .range([innerHeight, 0]);

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        // Bars
        g.selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", d => x(d.name)!)
            .attr("y", d => y(d.count))
            .attr("width", x.bandwidth())
            .attr("height", d => innerHeight - y(d.count))
            .attr("fill", d => d.color)
            .attr("rx", 4);

        // Labels
        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end")
            .style("fill", "#9ca3af");

        g.append("g")
            .call(d3.axisLeft(y).ticks(5))
            .selectAll("text")
            .style("fill", "#9ca3af");
            
    }, [data]);

    return (
        <div ref={wrapperRef} className="w-full h-full p-4">
            <svg ref={ref} width="100%" height="100%" />
        </div>
    );
};

const DonutChart = ({ data }: { data: (Code & { count: number })[] }) => {
    const ref = useRef<SVGSVGElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current || !wrapperRef.current) return;
        const svg = d3.select(ref.current);
        svg.selectAll("*").remove();

        const { width, height } = wrapperRef.current.getBoundingClientRect();
        const radius = Math.min(width, height) / 2 - 40;

        const pie = d3.pie<any>().value(d => d.count).sort(null);
        const arc = d3.arc<any>().innerRadius(radius * 0.6).outerRadius(radius);
        const labelArc = d3.arc<any>().innerRadius(radius + 10).outerRadius(radius + 10);

        const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`);

        const arcs = g.selectAll("arc")
            .data(pie(data.filter(d => d.count > 0)))
            .enter()
            .append("g");

        arcs.append("path")
            .attr("d", arc)
            .attr("fill", (d: any) => d.data.color)
            .attr("stroke", "#18181b")
            .attr("stroke-width", "2px");

        arcs.append("text")
            .attr("transform", (d: any) => `translate(${labelArc.centroid(d)})`)
            .attr("text-anchor", "middle")
            .text((d: any) => d.data.name)
            .style("fill", "#e4e4e7")
            .style("font-size", "12px")
            .style("opacity", (d: any) => d.data.count > 0 ? 1 : 0);
            
    }, [data]);

    return (
        <div ref={wrapperRef} className="w-full h-full p-4">
            <svg ref={ref} width="100%" height="100%" />
        </div>
    );
};

const TreeMap = ({ data }: { data: (Code & { count: number })[] }) => {
    const ref = useRef<SVGSVGElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    // D3 Rendering
    useEffect(() => {
        if (!ref.current || !wrapperRef.current || data.length === 0) return;
        const svg = d3.select(ref.current);
        svg.selectAll("*").remove();

        const { width, height } = wrapperRef.current.getBoundingClientRect();
        
        const validData = data.filter(d => d.count > 0);
        if (validData.length === 0) {
            svg.append("text")
                .attr("x", width/2)
                .attr("y", height/2)
                .attr("text-anchor", "middle")
                .attr("fill", "#71717a")
                .text("No coding data available");
            return;
        }

        const root = d3.hierarchy({ children: validData })
            .sum((d: any) => d.count)
            .sort((a, b) => (b.value || 0) - (a.value || 0));

        d3.treemap()
            .size([width, height])
            .paddingInner(2)
            .paddingOuter(0)
            .round(true)
            (root);

        const leaves = root.leaves() as d3.HierarchyRectangularNode<any>[];

        const g = svg.append("g");

        const nodes = g.selectAll("g")
            .data(leaves)
            .enter()
            .append("g")
            .attr("transform", d => `translate(${d.x0},${d.y0})`)
            .attr("class", "node-group")
            .style("cursor", "pointer")
            .on("mouseenter", (_, d) => setHoveredId(d.data.id))
            .on("mouseleave", () => setHoveredId(null));

        nodes.append("rect")
            .attr("id", d => `rect-${d.data.id}`)
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", (d: any) => d.data.color)
            .attr("rx", 4)
            .attr("stroke", "#18181b") 
            .attr("stroke-width", 2)
            .style("transition", "all 0.2s ease");

        nodes.append("clipPath")
            .attr("id", d => `clip-${d.data.id}`)
            .append("rect")
            .attr("width", d => Math.max(0, d.x1 - d.x0 - 4))
            .attr("height", d => Math.max(0, d.y1 - d.y0 - 4));

        nodes.append("text")
            .attr("clip-path", d => `url(#clip-${d.data.id})`)
            .attr("x", 6)
            .attr("y", 18)
            .text((d: any) => d.data.name)
            .attr("fill", "white")
            .attr("font-size", "11px")
            .attr("font-weight", "bold")
            .style("pointer-events", "none")
            .style("text-shadow", "0 1px 2px rgba(0,0,0,0.5)");
            
        nodes.append("text")
            .attr("clip-path", d => `url(#clip-${d.data.id})`)
            .attr("x", 6)
            .attr("y", 32)
            .text((d: any) => d.value)
            .attr("fill", "rgba(255,255,255,0.7)")
            .attr("font-size", "10px")
            .style("pointer-events", "none");

    }, [data]);

    // Hover Effect
    useEffect(() => {
        if (!ref.current) return;
        const svg = d3.select(ref.current);
        
        svg.selectAll("rect")
            .attr("fill-opacity", hoveredId ? 0.3 : 1)
            .attr("stroke", "#18181b")
            .attr("stroke-width", 2);

        if (hoveredId) {
            svg.select(`#rect-${hoveredId}`)
                .attr("fill-opacity", 1)
                .attr("stroke", "#fff")
                .attr("stroke-width", 2);
        }
    }, [hoveredId]);

    const activeCode = data.find(c => c.id === hoveredId);

    return (
        <div className="flex h-full w-full">
            <div ref={wrapperRef} className="flex-1 h-full p-4 overflow-hidden bg-zinc-900/30">
                <svg ref={ref} width="100%" height="100%" />
            </div>
            
            {/* Interactive Legend/Details */}
            <div className="w-80 border-l border-zinc-800 bg-zinc-950 flex flex-col shrink-0">
                <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 min-h-[140px] flex flex-col justify-center">
                    {activeCode ? (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-200">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-4 h-4 rounded-full shadow-lg ring-2 ring-zinc-900" style={{ backgroundColor: activeCode.color }} />
                                <h3 className="font-bold text-lg text-zinc-100 line-clamp-1">{activeCode.name}</h3>
                            </div>
                            <div className="flex gap-2 mb-3">
                                <Badge variant="outline" className="text-[10px] h-5 border-zinc-700 bg-zinc-900 text-zinc-400 uppercase">{activeCode.kind}</Badge>
                                <Badge variant="secondary" className="text-[10px] h-5 bg-zinc-800 text-zinc-300">{activeCode.count} occurrences</Badge>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 italic">
                                {activeCode.description || "No operational definition provided for this code."}
                            </p>
                        </div>
                    ) : (
                        <div className="text-center text-zinc-500 py-2">
                            <Grid className="mx-auto mb-2 opacity-20" size={32} />
                            <p className="text-sm font-medium">Code Density Index</p>
                            <p className="text-xs opacity-60 mt-1">Hover over a block or list item to view details.</p>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {data.map(code => (
                        <div 
                            key={code.id}
                            onMouseEnter={() => setHoveredId(code.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            className={cn(
                                "flex items-center justify-between p-2 rounded cursor-pointer transition-all border",
                                hoveredId === code.id 
                                    ? "bg-zinc-800 border-zinc-700 shadow-md translate-x-1" 
                                    : "bg-transparent border-transparent hover:bg-zinc-900"
                            )}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: code.color }} />
                                <span className={cn("text-sm truncate", hoveredId === code.id ? "text-zinc-100 font-medium" : "text-zinc-400")}>
                                    {code.name}
                                </span>
                            </div>
                            <span className="text-xs font-mono text-zinc-600">{code.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Manually implementing a Bipartite Graph (Sankey-like) using D3 paths 
const SankeyChart = ({ codes, codings, artifacts }: { codes: Code[], codings: Coding[], artifacts: Artifact[] }) => {
    const ref = useRef<SVGSVGElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current || !wrapperRef.current) return;
        const svg = d3.select(ref.current);
        svg.selectAll("*").remove();

        const { width, height } = wrapperRef.current.getBoundingClientRect();
        const margin = { top: 40, right: 100, bottom: 40, left: 150 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Data Prep
        const artifactNodes = artifacts.map(a => ({
            ...a,
            value: codings.filter(c => c.artifactId === a.id).length
        })).filter(a => a.value > 0);

        const codeNodes = codes.map(c => ({
            ...c,
            value: codings.filter(coding => coding.codeId === c.id).length
        })).filter(c => c.value > 0);

        // Calculate positions
        const totalValue = d3.sum(artifactNodes, d => d.value);
        const nodePadding = 20;
        
        // Left Column (Artifacts)
        let currentY = 0;
        
        const artPos = artifactNodes.map(a => {
            const h = Math.max(20, (a.value / totalValue) * innerHeight); // approximate sizing
            const y = currentY;
            currentY += h + nodePadding;
            return { ...a, x: 0, y, h };
        });

        // Right Column (Codes)
        currentY = 0;
        const codePos = codeNodes.map(c => {
             // Re-calculate relative height based on share of visualized codings
             const share = c.value / d3.sum(codeNodes, n => n.value);
             const h = Math.max(20, share * innerHeight); 
             const y = currentY;
             currentY += h + nodePadding;
             return { ...c, x: innerWidth, y, h };
        });

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        // Links
        codings.forEach(coding => {
            const source = artPos.find(a => a.id === coding.artifactId);
            const target = codePos.find(c => c.id === coding.codeId);
            
            if (source && target) {
                const link = d3.linkHorizontal()
                    .x((d: any) => d.x)
                    .y((d: any) => d.y);
                
                const linkData: any = {
                    source: { x: source.x + 10, y: source.y + source.h/2 },
                    target: { x: target.x, y: target.y + target.h/2 }
                };

                g.append("path")
                    .datum(linkData)
                    .attr("d", link as any)
                    .attr("fill", "none")
                    .attr("stroke", target.color)
                    .attr("stroke-width", 2)
                    .attr("stroke-opacity", 0.3)
                    .style("mix-blend-mode", "screen");
            }
        });

        // Nodes Left
        const leftG = g.selectAll(".artNode")
            .data(artPos)
            .enter().append("g")
            .attr("transform", d => `translate(${d.x},${d.y})`);

        leftG.append("rect")
            .attr("width", 10)
            .attr("height", d => d.h)
            .attr("fill", "#52525b")
            .attr("rx", 2);
            
        leftG.append("text")
            .text(d => d.name)
            .attr("x", -10)
            .attr("y", d => d.h/2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .attr("fill", "#a1a1aa")
            .attr("font-size", "10px");

        // Nodes Right
        const rightG = g.selectAll(".codeNode")
            .data(codePos)
            .enter().append("g")
            .attr("transform", d => `translate(${d.x},${d.y})`);

        rightG.append("rect")
            .attr("width", 10)
            .attr("height", d => d.h)
            .attr("fill", d => d.color)
            .attr("rx", 2);

        rightG.append("text")
            .text(d => d.name)
            .attr("x", 20)
            .attr("y", d => d.h/2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "start")
            .attr("fill", d => d.color)
            .attr("font-size", "10px")
            .style("font-weight", "bold");

    }, [codes, codings, artifacts]);

    return (
        <div ref={wrapperRef} className="w-full h-full p-4">
            <svg ref={ref} width="100%" height="100%" />
        </div>
    );
};

const WordCloud = ({ words }: { words: { text: string; value: number }[] }) => {
    // Simple Tag Cloud using Flexbox (Robust alternative to d3-cloud complexity)
    const maxVal = Math.max(...words.map(w => w.value));
    
    return (
        <div className="w-full h-full p-8 overflow-y-auto flex flex-wrap content-center justify-center gap-4">
            {words.map((w, i) => {
                const size = Math.max(0.8, (w.value / maxVal) * 4); // 0.8rem to 4rem
                return (
                    <span 
                        key={i} 
                        style={{ fontSize: `${size}rem`, opacity: 0.5 + (w.value/maxVal)*0.5 }}
                        className="text-zinc-200 font-bold hover:text-blue-400 transition-colors cursor-default"
                        title={`Count: ${w.value}`}
                    >
                        {w.text}
                    </span>
                )
            })}
        </div>
    );
};

const DataTable = ({ codes }: { codes: (Code & { count: number })[] }) => {
    return (
        <div className="w-full h-full overflow-auto p-4">
            <table className="w-full text-sm text-left text-zinc-400">
                <thead className="text-xs text-zinc-100 uppercase bg-zinc-800/50">
                    <tr>
                        <th className="px-6 py-3">Code Name</th>
                        <th className="px-6 py-3">ID</th>
                        <th className="px-6 py-3">Color</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3 text-right">Usage Count</th>
                    </tr>
                </thead>
                <tbody>
                    {codes.map(code => (
                        <tr key={code.id} className="bg-zinc-900/30 border-b border-zinc-800 hover:bg-zinc-800/30">
                            <td className="px-6 py-4 font-medium text-zinc-100">{code.name}</td>
                            <td className="px-6 py-4 font-mono text-xs">{code.id}</td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: code.color }}></div>
                                    <span className="text-xs">{code.color}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                {code.isCore ? <Badge className="bg-yellow-500/10 text-yellow-500">CORE</Badge> : <span className="opacity-50">Open</span>}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-zinc-100">{code.count}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Force Graph Implementation
const ForceGraph = ({ codes, codings, artifacts, settings, memos }: { codes: Code[], codings: Coding[], artifacts: Artifact[], settings: ProjectSettings, memos: Memo[] }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    
    // Controls State
    const [showAssociations, setShowAssociations] = useState(true);
    const [showHierarchy, setShowHierarchy] = useState(true);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [interactionMode, setInteractionMode] = useState<'inspect' | 'focus'>('inspect');
    
    // Content Filters
    const [showRQs, setShowRQs] = useState(false);
    const [showFindings, setShowFindings] = useState(false);
    const [showMethods, setShowMethods] = useState(false);

    const zoomBehavior = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

    // Compute node details when selected
    const selectedNodeData = useMemo(() => {
        if (!selectedNodeId) return null;
        
        // Find in all potential node sources (re-build graph logic locally or use graphNodes result if hoisted)
        // Simplification: We will rebuild specific details based on type found in 'codes' or extended items
        
        const code = codes.find(c => c.id === selectedNodeId);
        if (code) {
            const myCodings = codings.filter(c => c.codeId === code.id);
            const relatedArtifactIds = Array.from(new Set(myCodings.map(c => c.artifactId)));
            const artifactsList = artifacts.filter(a => relatedArtifactIds.includes(a.id));
            const parent = codes.find(c => c.id === code.parentId);
            const children = codes.filter(c => c.parentId === code.id);
            
            const coOccurrences: Record<string, number> = {};
            artifactsList.forEach(art => {
                const otherCodingsInArt = codings.filter(c => c.artifactId === art.id && c.codeId !== code.id);
                const distinctOtherCodes = Array.from(new Set(otherCodingsInArt.map(c => c.codeId)));
                distinctOtherCodes.forEach(ocId => {
                    coOccurrences[ocId] = (coOccurrences[ocId] || 0) + 1;
                });
            });
            const topAssociated = Object.entries(coOccurrences)
                .sort((a,b) => b[1] - a[1])
                .slice(0, 5)
                .map(([id, count]) => ({ code: codes.find(c => c.id === id), count }))
                .filter(x => x.code);

            return {
                type: 'code' as const,
                data: code,
                stats: { totalCodings: myCodings.length, degree: (parent ? 1 : 0) + children.length + topAssociated.length },
                relationships: { parent, children, topAssociated },
                evidence: myCodings.slice(0, 5).map(c => ({ id: c.id, text: c.textSnippet, source: artifacts.find(a => a.id === c.artifactId)?.name }))
            };
        }

        // Check extended types
        const rq = settings.theoreticalFramework.researchQuestions.find(r => r.id === selectedNodeId);
        if (rq) return { type: 'rq' as const, data: rq };

        const finding = memos.find(m => m.id === selectedNodeId);
        if (finding) return { type: 'finding' as const, data: finding };

        const method = settings.theoreticalFramework.methods.find(m => m.id === selectedNodeId);
        if (method) return { type: 'method' as const, data: method };

        return null;
    }, [selectedNodeId, codes, codings, artifacts, settings, memos]);

    useEffect(() => {
        if (!svgRef.current || !wrapperRef.current) return;
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();
        
        const { width, height } = wrapperRef.current.getBoundingClientRect();
        
        // --- 1. Data Preparation using Graph Utils ---
        const { nodes, links: allLinks } = buildTheoryGraph(codes, codings, memos, settings);
        
        // Filter Nodes
        const filteredNodes = nodes.filter(n => {
            if (n.kind === 'rq' && !showRQs) return false;
            if (n.kind === 'finding' && !showFindings) return false;
            if (n.kind === 'method' && !showMethods) return false;
            return true;
        });
        const activeIds = new Set(filteredNodes.map(n => n.id));

        // Filter Links
        const filteredLinks = allLinks.filter(l => {
            if (!activeIds.has(l.source) || !activeIds.has(l.target)) return false;
            if (l.type === 'hierarchy' && !showHierarchy) return false;
            if (l.type === 'association' && !showAssociations) return false;
            return true;
        });

        // Deep copy
        const simNodes = filteredNodes.map(n => ({...n}));
        const simLinks = filteredLinks.map(l => ({...l}));

        // --- 2. Setup D3 ---
        const defs = svg.append("defs");
        // Marker
        defs.append("marker").attr("id", "arrowhead").attr("viewBox", "0 -5 10 10").attr("refX", 18).attr("refY", 0).attr("markerWidth", 5).attr("markerHeight", 5).attr("orient", "auto").append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", "#52525b");
        // Filter
        const filter = defs.append("filter").attr("id", "glow");
        filter.append("feGaussianBlur").attr("stdDeviation", "2.5").attr("result", "coloredBlur");
        const feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode").attr("in", "coloredBlur");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");

        const g = svg.append("g"); 

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
                setZoomLevel(event.transform.k);
            });
        
        zoomBehavior.current = zoom;
        svg.call(zoom).on("dblclick.zoom", null);

        // --- 3. Simulation ---
        const simulation = d3.forceSimulation(simNodes as any)
            .force("link", d3.forceLink(simLinks).id((d: any) => d.id).distance(d => (d as any).type === 'hierarchy' ? 80 : 150))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide().radius((d: any) => (d.val * 2) + 20));

        // --- 4. Render Links ---
        const link = g.append("g")
            .selectAll("line")
            .data(simLinks)
            .join("line")
            .attr("stroke", d => d.type === 'hierarchy' ? "#3b82f6" : (d.type === 'theoretical' ? "#10b981" : "#52525b")) 
            .attr("stroke-opacity", d => d.type === 'hierarchy' ? 0.6 : 0.2)
            .attr("stroke-width", d => Math.sqrt(d.value) * (d.type === 'hierarchy' ? 2 : 1))
            .attr("stroke-dasharray", d => d.type === 'association' ? "3 2" : "0")
            .attr("marker-end", d => d.type === 'hierarchy' ? "url(#arrowhead)" : null);

        // --- 5. Render Nodes (with Symbols) ---
        const node = g.append("g")
            .selectAll("path")
            .data(simNodes)
            .join("path")
            .attr("d", d3.symbol()
                .type((d: any) => {
                    if (d.kind === 'rq') return d3.symbolDiamond;
                    if (d.kind === 'finding') return d3.symbolStar;
                    if (d.kind === 'method') return d3.symbolSquare;
                    return d3.symbolCircle;
                })
                .size((d: any) => (d.val * 20) + 100) // area size
            )
            .attr("fill", (d: any) => d.color)
            .attr("stroke", (d: any) => d.isCore ? "#fbbf24" : "#fff") 
            .attr("stroke-width", (d: any) => d.isCore ? 3 : 1)
            .style("cursor", "pointer")
            .style("filter", (d: any) => d.isCore || d.kind === 'finding' ? "url(#glow)" : "none")
            .call(d3.drag<any, any>()
                .on("start", (event, d) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on("drag", (event, d) => {
                    d.fx = event.x;
                    d.fy = event.y;
                })
                .on("end", (event, d) => {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                }))
            .on("click", (event, d) => {
                event.stopPropagation();
                setSelectedNodeId(d.id);
            });

        // Labels
        const label = g.append("g")
            .selectAll("text")
            .data(simNodes)
            .join("text")
            .text((d: any) => d.name)
            .attr("font-size", (d: any) => d.kind === 'category' || d.kind === 'rq' ? "12px" : "10px")
            .attr("font-weight", (d: any) => d.kind === 'category' ? "bold" : "normal")
            .attr("fill", "#e4e4e7") 
            .style("pointer-events", "none")
            .style("text-shadow", "0 1px 3px black");

        // Simulation Tick
        simulation.on("tick", () => {
            link
                .attr("x1", (d: any) => d.source.x)
                .attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x)
                .attr("y2", (d: any) => d.target.y);

            node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
            label
                .attr("x", (d: any) => d.x + 8 + Math.sqrt(d.val) * 2)
                .attr("y", (d: any) => d.y + 4);
        });

        // Interaction Mode Logic (Focus)
        if (selectedNodeId && interactionMode === 'focus') {
            const connectedIds = new Set([selectedNodeId]);
            simLinks.forEach((l: any) => {
                if (l.source.id === selectedNodeId) connectedIds.add(l.target.id);
                if (l.target.id === selectedNodeId) connectedIds.add(l.source.id);
            });

            node.transition().duration(200).style("opacity", (d: any) => connectedIds.has(d.id) ? 1 : 0.1);
            link.transition().duration(200).style("opacity", (d: any) => (d.source.id === selectedNodeId || d.target.id === selectedNodeId) ? 1 : 0.05);
            label.transition().duration(200).style("opacity", (d: any) => connectedIds.has(d.id) ? 1 : 0.1);
        } else {
            node.transition().duration(200).style("opacity", 1);
            link.transition().duration(200).style("opacity", (d: any) => d.type === 'hierarchy' ? 0.6 : 0.2);
            label.transition().duration(200).style("opacity", 1);
        }

        return () => { simulation.stop(); };

    }, [codes, codings, showAssociations, showHierarchy, showRQs, showFindings, showMethods, selectedNodeId, interactionMode, memos, settings]);

    // Zoom Handlers
    const handleZoomIn = () => {
        if (svgRef.current && zoomBehavior.current) d3.select(svgRef.current).transition().duration(300).call(zoomBehavior.current.scaleBy, 1.2);
    };
    const handleZoomOut = () => {
        if (svgRef.current && zoomBehavior.current) d3.select(svgRef.current).transition().duration(300).call(zoomBehavior.current.scaleBy, 0.8);
    };

    return (
        <div ref={wrapperRef} className="w-full h-full p-0 bg-zinc-950 relative overflow-hidden group flex">
            <div className="flex-1 relative h-full">
                <svg ref={svgRef} width="100%" height="100%" className="cursor-move" onClick={() => setSelectedNodeId(null)}/>
                
                {/* Overlay Controls */}
                <div className="absolute top-4 left-4 bg-zinc-950/80 backdrop-blur border border-zinc-800 p-2 rounded-lg shadow-lg flex flex-col gap-2 w-48">
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-1 border-b border-zinc-800 pb-1">
                        <span className="font-bold flex items-center gap-2"><Filter size={10}/> Display Layers</span>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer hover:text-white">
                        <input type="checkbox" checked={showHierarchy} onChange={e => setShowHierarchy(e.target.checked)} className="rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-0"/>
                        Code Hierarchy
                    </label>
                    <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer hover:text-white">
                        <input type="checkbox" checked={showAssociations} onChange={e => setShowAssociations(e.target.checked)} className="rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-0"/>
                        Co-occurrences
                    </label>
                    <div className="h-px bg-zinc-800 my-1"/>
                    <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer hover:text-white">
                        <input type="checkbox" checked={showRQs} onChange={e => setShowRQs(e.target.checked)} className="rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-0"/>
                        Research Questions
                    </label>
                    <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer hover:text-white">
                        <input type="checkbox" checked={showFindings} onChange={e => setShowFindings(e.target.checked)} className="rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-0"/>
                        Findings
                    </label>
                    <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer hover:text-white">
                        <input type="checkbox" checked={showMethods} onChange={e => setShowMethods(e.target.checked)} className="rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-0"/>
                        Methods
                    </label>
                </div>

                <div className="absolute top-4 right-4 flex gap-1 bg-zinc-950/80 backdrop-blur border border-zinc-800 rounded-lg p-1">
                    <Button 
                        variant={interactionMode === 'inspect' ? "secondary" : "ghost"} 
                        size="icon" className="h-8 w-8" 
                        onClick={() => setInteractionMode('inspect')} 
                        title="Inspect Mode"
                    >
                        <MousePointer2 size={16} />
                    </Button>
                    <Button 
                        variant={interactionMode === 'focus' ? "secondary" : "ghost"} 
                        size="icon" className="h-8 w-8" 
                        onClick={() => setInteractionMode('focus')} 
                        title="Focus Mode"
                    >
                        <Eye size={16} />
                    </Button>
                </div>

                <div className="absolute bottom-4 right-4 flex flex-col gap-1 bg-zinc-950/80 backdrop-blur border border-zinc-800 rounded-lg p-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={handleZoomIn}>
                        <ZoomIn size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={handleZoomOut}>
                        <ZoomOut size={16} />
                    </Button>
                </div>
            </div>
            
            {/* Inspector Slide-out */}
            {selectedNodeData ? (
                <div className="w-80 h-full bg-zinc-950 border-l border-zinc-800 flex flex-col shadow-2xl animate-in slide-in-from-right">
                    <div className="p-4 border-b border-zinc-800 flex justify-between items-start bg-zinc-900/50">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                {selectedNodeData.type === 'rq' ? <FileQuestion size={16} className="text-blue-500"/> :
                                 selectedNodeData.type === 'finding' ? <Lightbulb size={16} className="text-emerald-500"/> :
                                 selectedNodeData.type === 'method' ? <Microscope size={16} className="text-purple-500"/> :
                                 (selectedNodeData.data as Code).kind === 'category' ? <FolderTree size={16} className="text-amber-500"/> : 
                                 <Tag size={16} style={{ color: (selectedNodeData.data as Code).color }}/>}
                                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                                    {selectedNodeData.type === 'code' ? (selectedNodeData.data as Code).kind : selectedNodeData.type}
                                </span>
                            </div>
                            <h2 className="text-lg font-bold text-zinc-100 leading-tight">
                                {selectedNodeData.type === 'finding' ? (selectedNodeData.data as Memo).title :
                                 selectedNodeData.type === 'rq' ? "Research Question" : 
                                 selectedNodeData.type === 'method' ? "Method Protocol" :
                                 (selectedNodeData.data as Code).name}
                            </h2>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedNodeId(null)}>
                            <X size={14}/>
                        </Button>
                    </div>
                    
                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-6">
                            {/* Generic Content Renderer based on Type */}
                            {selectedNodeData.type === 'rq' && (
                                <p className="text-sm text-zinc-300 italic">"{(selectedNodeData.data as any).content}"</p>
                            )}
                            {selectedNodeData.type === 'finding' && (
                                <p className="text-sm text-zinc-400">{(selectedNodeData.data as Memo).content}</p>
                            )}
                            {selectedNodeData.type === 'method' && (
                                <p className="text-xs font-mono text-zinc-400 bg-zinc-900 p-2 rounded">{(selectedNodeData.data as any).protocolContent}</p>
                            )}

                            {/* Specific Code Details */}
                            {selectedNodeData.type === 'code' && selectedNodeData.relationships && (
                                <>
                                    <div className="space-y-2">
                                        <p className="text-sm text-zinc-400 italic leading-relaxed">
                                            {(selectedNodeData.data as Code).description || "No definition provided."}
                                        </p>
                                        {(selectedNodeData.data as Code).isCore && (
                                            <Badge variant="secondary" className="bg-yellow-900/20 text-yellow-500 border-yellow-900/50 w-full justify-center">Core Category</Badge>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <StatBox label="Codings" value={selectedNodeData.stats!.totalCodings} />
                                        <StatBox label="Degree" value={selectedNodeData.stats!.degree} />
                                    </div>

                                    {/* Hierarchy */}
                                    <div className="space-y-2">
                                        <h3 className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-2">
                                            <GitCommit size={12}/> Structure
                                        </h3>
                                        <div className="space-y-1">
                                            {selectedNodeData.relationships.parent ? (
                                                <div 
                                                    className="flex items-center gap-2 p-2 rounded bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-blue-500/50"
                                                    onClick={() => setSelectedNodeId(selectedNodeData.relationships!.parent!.id)}
                                                >
                                                    <FolderTree size={12} className="text-zinc-500"/>
                                                    <span className="text-xs text-zinc-300">Parent: {selectedNodeData.relationships.parent.name}</span>
                                                </div>
                                            ) : <div className="text-xs text-zinc-600 pl-2">No parent category</div>}
                                        </div>
                                    </div>

                                    {/* Evidence Snippets */}
                                    {selectedNodeData.evidence && selectedNodeData.evidence.length > 0 && (
                                        <div className="space-y-2">
                                            <h3 className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-2">
                                                <Quote size={12}/> Evidence ({selectedNodeData.stats!.totalCodings})
                                            </h3>
                                            <div className="space-y-2">
                                                {selectedNodeData.evidence.map((snip, i) => (
                                                    <div key={i} className="p-2 bg-zinc-900/30 border border-zinc-800 rounded text-xs">
                                                        <p className="text-zinc-300 italic mb-1 line-clamp-3">"{snip.text}"</p>
                                                        <div className="text-[9px] text-zinc-600 text-right">{snip.source}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            ) : (
                /* Static Legend when no node is selected */
                <div className="absolute bottom-4 left-4 bg-zinc-950/80 backdrop-blur border border-zinc-800 rounded-lg p-3 text-[10px] text-zinc-400 pointer-events-none select-none w-48">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full border border-zinc-500"></div> Code
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full border border-amber-500"></div> Core Category
                    </div>
                    {/* Dynamic Legend based on visible layers */}
                    {showRQs && <div className="flex items-center gap-2 mb-1 text-blue-400"><div className="w-2 h-2 rotate-45 border border-blue-500 bg-blue-900"></div> RQ</div>}
                    {showFindings && <div className="flex items-center gap-2 mb-1 text-emerald-400"><div className="w-2 h-2 bg-emerald-500 clip-star"></div> Finding</div>}
                    <div className="text-zinc-600 text-[9px] italic border-t border-zinc-800 pt-1 mt-1">
                        Click a node to inspect details.
                    </div>
                </div>
            )}
        </div>
    );
};

const StatBox = ({ label, value }: { label: string, value: number }) => (
    <div className="bg-zinc-900 border border-zinc-800 rounded p-2 text-center">
        <div className="text-lg font-bold text-zinc-200">{value}</div>
        <div className="text-[9px] text-zinc-500 uppercase tracking-wider">{label}</div>
    </div>
);
