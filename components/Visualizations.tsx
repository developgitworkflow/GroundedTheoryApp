
import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { Code, Coding, Artifact, ProjectSettings, Memo, ResearchTeam } from '../types';
import { 
    BarChart3, PieChart, Activity, Grid, FileText, Table as TableIcon, 
    Waves, LayoutGrid, CircleDot, Calendar,
    ZoomIn, ZoomOut, Filter, X, ArrowRight, MousePointer2, Eye, Maximize, Settings2, Sliders,
    Layers, Network, Share2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { InternalOntologyMapper } from './InternalOntologyMapper';

interface VisualizationsProps {
  codes: Code[];
  codings: Coding[];
  artifacts: Artifact[];
  settings: ProjectSettings;
  memos: Memo[];
  team: ResearchTeam;
}

type ChartType = 'bar' | 'donut' | 'treemap' | 'cloud' | 'table' | 'sankey' | 'chord' | 'heatmap' | 'stream' | 'ontology';

export const Visualizations: React.FC<VisualizationsProps> = ({ codes, codings, artifacts, settings, memos, team }) => {
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
      .slice(0, 100); 
  }, [artifacts, settings.stopWords]);

  return (
    <div className="flex h-full bg-zinc-950">
      {/* Sidebar Controls */}
      <div className="w-64 border-r border-zinc-800 bg-zinc-900/50 flex flex-col gap-1 overflow-y-auto">
        <div className="p-4 pb-2">
            <h2 className="font-bold text-zinc-100 flex items-center gap-2">
                <Activity className="text-blue-500" size={20} />
                Analytics
            </h2>
            <p className="text-xs text-zinc-500 mt-1">From Data to Viz</p>
        </div>
        
        <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Categoric (Distribution)</div>
        <ChartNavButton active={activeChart === 'bar'} onClick={() => setActiveChart('bar')} icon={BarChart3} label="Bar Chart" />
        <ChartNavButton active={activeChart === 'donut'} onClick={() => setActiveChart('donut')} icon={PieChart} label="Donut Chart" />
        <ChartNavButton active={activeChart === 'treemap'} onClick={() => setActiveChart('treemap')} icon={Grid} label="Treemap" />
        <ChartNavButton active={activeChart === 'cloud'} onClick={() => setActiveChart('cloud')} icon={FileText} label="Word Cloud" />

        <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-2">Relational (Connections)</div>
        <ChartNavButton active={activeChart === 'ontology'} onClick={() => setActiveChart('ontology')} icon={Share2} label="Ontology Graph" />
        <ChartNavButton active={activeChart === 'chord'} onClick={() => setActiveChart('chord')} icon={CircleDot} label="Chord Diagram" />
        <ChartNavButton active={activeChart === 'heatmap'} onClick={() => setActiveChart('heatmap')} icon={LayoutGrid} label="Matrix Heatmap" />
        <ChartNavButton active={activeChart === 'sankey'} onClick={() => setActiveChart('sankey')} icon={Network} label="Sankey Flow" />

        <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-2">Temporal (Evolution)</div>
        <ChartNavButton active={activeChart === 'stream'} onClick={() => setActiveChart('stream')} icon={Waves} label="Streamgraph" />
        
        <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-2">Raw Data</div>
        <ChartNavButton active={activeChart === 'table'} onClick={() => setActiveChart('table')} icon={TableIcon} label="Data Table" />
      </div>

      {/* Main Chart Area */}
      <div className="flex-1 overflow-hidden p-6 relative bg-zinc-950">
        <Card className="h-full border-zinc-800 bg-zinc-900/20 shadow-xl overflow-hidden flex flex-col">
            <CardHeader className="border-b border-zinc-800 pb-4 bg-zinc-900/50 shrink-0">
                <CardTitle className="text-zinc-200 flex items-center gap-2 text-lg">
                    {activeChart === 'bar' && 'Code Frequency Distribution'}
                    {activeChart === 'donut' && 'Coding Proportions'}
                    {activeChart === 'treemap' && 'Hierarchical Code Density'}
                    {activeChart === 'cloud' && 'Content Word Cloud'}
                    {activeChart === 'chord' && 'Code Co-Occurrence Chord'}
                    {activeChart === 'heatmap' && 'Code-Artifact Matrix'}
                    {activeChart === 'sankey' && 'Artifact-Code Flow'}
                    {activeChart === 'stream' && 'Coding Evolution Over Time'}
                    {activeChart === 'table' && 'Coding Statistics'}
                    {activeChart === 'ontology' && 'Live Ontology Instance Graph'}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative min-h-0">
                {activeChart === 'bar' && <BarChart data={codeStats} />}
                {activeChart === 'donut' && <DonutChart data={codeStats} />}
                {activeChart === 'treemap' && <TreeMap data={codeStats} />}
                {activeChart === 'cloud' && <WordCloud words={wordStats} />}
                {activeChart === 'chord' && <ChordChart codes={codes} codings={codings} />}
                {activeChart === 'heatmap' && <HeatmapChart codes={codes} codings={codings} artifacts={artifacts} />}
                {activeChart === 'sankey' && <SankeyChart codes={codes} codings={codings} artifacts={artifacts} />}
                {activeChart === 'stream' && <StreamChart codes={codes} codings={codings} artifacts={artifacts} />}
                {activeChart === 'table' && <DataTable codes={codeStats} />}
                {activeChart === 'ontology' && (
                    <InternalOntologyMapper 
                        settings={settings}
                        artifacts={artifacts}
                        codes={codes}
                        codings={codings}
                        memos={memos}
                        team={team}
                    />
                )}
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
        className={cn(
            "justify-start mx-2 h-8 text-xs",
            active ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
        )}
        onClick={onClick}
    >
        <Icon size={14} className="mr-2" /> {label}
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

        const x = d3.scaleBand().range([0, innerWidth]).domain(data.map(d => d.name)).padding(0.2);
        const y = d3.scaleLinear().domain([0, d3.max(data, d => d.count) || 10]).range([innerHeight, 0]);

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        g.selectAll("rect").data(data).enter().append("rect")
            .attr("x", d => x(d.name)!)
            .attr("y", d => y(d.count))
            .attr("width", x.bandwidth())
            .attr("height", d => innerHeight - y(d.count))
            .attr("fill", d => d.color)
            .attr("rx", 4);

        g.append("g").attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x)).selectAll("text").attr("transform", "translate(-10,0)rotate(-45)").style("text-anchor", "end").style("fill", "#9ca3af");
        g.append("g").call(d3.axisLeft(y).ticks(5)).selectAll("text").style("fill", "#9ca3af");
    }, [data]);

    return <div ref={wrapperRef} className="w-full h-full p-4"><svg ref={ref} width="100%" height="100%" /></div>;
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
        const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`);
        
        g.selectAll("path").data(pie(data.filter(d => d.count > 0))).enter().append("path")
            .attr("d", arc).attr("fill", (d: any) => d.data.color).attr("stroke", "#18181b").attr("stroke-width", "2px");
    }, [data]);

    return <div ref={wrapperRef} className="w-full h-full p-4"><svg ref={ref} width="100%" height="100%" /></div>;
};

const TreeMap = ({ data }: { data: (Code & { count: number })[] }) => {
    const ref = useRef<SVGSVGElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current || !wrapperRef.current || data.length === 0) return;
        const svg = d3.select(ref.current);
        svg.selectAll("*").remove();
        const { width, height } = wrapperRef.current.getBoundingClientRect();
        
        const root = d3.hierarchy({ children: data.filter(d=>d.count>0) }).sum((d: any) => d.count);
        d3.treemap().size([width, height]).padding(2)(root);

        const nodes = svg.selectAll("g").data(root.leaves()).enter().append("g").attr("transform", d => `translate(${d.x0},${d.y0})`);
        nodes.append("rect").attr("width", d => d.x1 - d.x0).attr("height", d => d.y1 - d.y0).attr("fill", (d: any) => d.data.color).attr("rx", 4);
        nodes.append("text").attr("x", 4).attr("y", 14).text((d: any) => d.data.name).attr("fill", "white").attr("font-size", "10px");
    }, [data]);

    return <div ref={wrapperRef} className="w-full h-full p-4"><svg ref={ref} width="100%" height="100%" /></div>;
};

const SankeyChart = ({ codes, codings, artifacts }: { codes: Code[], codings: Coding[], artifacts: Artifact[] }) => {
    const ref = useRef<SVGSVGElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current || !wrapperRef.current) return;
        const svg = d3.select(ref.current);
        svg.selectAll("*").remove();
        const { width, height } = wrapperRef.current.getBoundingClientRect();
        
        // Simple bipartite manual sankey for demo
        const margin = { top: 40, right: 100, bottom: 40, left: 150 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const artNodes = artifacts.map((a, i) => ({ ...a, x: 0, y: i * 40 }));
        const codeNodes = codes.map((c, i) => ({ ...c, x: innerWidth, y: i * 30 }));
        
        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
        
        // Draw links
        codings.forEach(c => {
            const art = artNodes.find(a => a.id === c.artifactId);
            const code = codeNodes.find(co => co.id === c.codeId);
            if(art && code) {
                g.append("path")
                    .attr("d", d3.linkHorizontal()({ source: [art.x+10, art.y+10], target: [code.x, code.y+10] }))
                    .attr("fill", "none").attr("stroke", code.color).attr("stroke-opacity", 0.2).attr("stroke-width", 2);
            }
        });

        // Draw nodes
        const arts = g.selectAll(".art").data(artNodes).enter().append("g").attr("transform", d => `translate(${d.x},${d.y})`);
        arts.append("rect").attr("width", 10).attr("height", 20).attr("fill", "#52525b");
        arts.append("text").text(d => d.name).attr("x", -10).attr("y", 15).attr("text-anchor", "end").attr("fill", "#a1a1aa").attr("font-size", "10px");

        const cds = g.selectAll(".code").data(codeNodes).enter().append("g").attr("transform", d => `translate(${d.x},${d.y})`);
        cds.append("rect").attr("width", 10).attr("height", 20).attr("fill", d => d.color);
        cds.append("text").text(d => d.name).attr("x", 20).attr("y", 15).attr("fill", d=>d.color).attr("font-size", "10px");

    }, [codes, codings, artifacts]);

    return <div ref={wrapperRef} className="w-full h-full p-4"><svg ref={ref} width="100%" height="100%" /></div>;
};

const WordCloud = ({ words }: { words: { text: string; value: number }[] }) => {
    const maxVal = Math.max(...words.map(w => w.value));
    return (
        <div className="w-full h-full p-8 overflow-y-auto flex flex-wrap content-center justify-center gap-4">
            {words.map((w, i) => {
                const size = Math.max(0.8, (w.value / maxVal) * 4);
                return (
                    <span key={i} style={{ fontSize: `${size}rem`, opacity: 0.5 + (w.value/maxVal)*0.5 }} className="text-zinc-200 font-bold hover:text-blue-400 transition-colors cursor-default">
                        {w.text}
                    </span>
                )
            })}
        </div>
    );
};

const DataTable = ({ codes }: { codes: (Code & { count: number })[] }) => (
    <div className="w-full h-full overflow-auto p-4">
        <table className="w-full text-sm text-left text-zinc-400">
            <thead className="text-xs text-zinc-100 uppercase bg-zinc-800/50">
                <tr><th className="px-6 py-3">Code</th><th className="px-6 py-3">Count</th></tr>
            </thead>
            <tbody>
                {codes.map(c => (
                    <tr key={c.id} className="bg-zinc-900/30 border-b border-zinc-800"><td className="px-6 py-4 text-zinc-100">{c.name}</td><td className="px-6 py-4">{c.count}</td></tr>
                ))}
            </tbody>
        </table>
    </div>
);

// --- NEW RELATIONAL & TEMPORAL CHARTS ---

const HeatmapChart = ({ codes, codings, artifacts }: { codes: Code[], codings: Coding[], artifacts: Artifact[] }) => {
    const ref = useRef<SVGSVGElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current || !wrapperRef.current) return;
        const svg = d3.select(ref.current);
        svg.selectAll("*").remove();

        const { width, height } = wrapperRef.current.getBoundingClientRect();
        const margin = { top: 100, right: 20, bottom: 50, left: 100 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Data Structure: matrix[codeIndex][artifactIndex] = count
        const activeCodes = codes.filter(c => codings.some(cd => cd.codeId === c.id));
        
        const x = d3.scaleBand().range([0, innerWidth]).domain(artifacts.map(a => a.name)).padding(0.05);
        const y = d3.scaleBand().range([0, innerHeight]).domain(activeCodes.map(c => c.name)).padding(0.05);

        const colorScale = d3.scaleSequential(d3.interpolateInferno).domain([0, 5]); // Cap at 5 for contrast

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        // X Labels
        g.append("g").call(d3.axisTop(x)).selectAll("text")
            .attr("transform", "translate(0,-5)rotate(-45)")
            .style("text-anchor", "start")
            .style("fill", "#a1a1aa")
            .style("font-size", "10px");

        // Y Labels
        g.append("g").call(d3.axisLeft(y)).selectAll("text")
            .style("fill", "#a1a1aa")
            .style("font-size", "10px");

        // Squares
        artifacts.forEach(art => {
            activeCodes.forEach(code => {
                const count = codings.filter(c => c.codeId === code.id && c.artifactId === art.id).length;
                if (count > 0) {
                    g.append("rect")
                        .attr("x", x(art.name)!)
                        .attr("y", y(code.name)!)
                        .attr("width", x.bandwidth())
                        .attr("height", y.bandwidth())
                        .attr("fill", colorScale(count))
                        .attr("rx", 2)
                        .append("title").text(`${code.name} in ${art.name}: ${count}`);
                } else {
                    g.append("rect")
                        .attr("x", x(art.name)!)
                        .attr("y", y(code.name)!)
                        .attr("width", x.bandwidth())
                        .attr("height", y.bandwidth())
                        .attr("fill", "#18181b") // Background for empty
                        .attr("rx", 2);
                }
            });
        });

    }, [codes, codings, artifacts]);

    return <div ref={wrapperRef} className="w-full h-full p-4"><svg ref={ref} width="100%" height="100%" /></div>;
};

const ChordChart = ({ codes, codings }: { codes: Code[], codings: Coding[] }) => {
    const ref = useRef<SVGSVGElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current || !wrapperRef.current) return;
        const svg = d3.select(ref.current);
        svg.selectAll("*").remove();

        const { width, height } = wrapperRef.current.getBoundingClientRect();
        const outerRadius = Math.min(width, height) * 0.5 - 60;
        const innerRadius = outerRadius - 20;

        // 1. Build Co-occurrence Matrix
        const activeCodes = codes.filter(c => codings.some(cd => cd.codeId === c.id));
        const indexMap = new Map(activeCodes.map((c, i) => [c.id, i]));
        const matrix = Array(activeCodes.length).fill(0).map(() => Array(activeCodes.length).fill(0));

        // Group codings by artifact to find co-occurrences
        const artifactGroups: Record<string, string[]> = {};
        codings.forEach(c => {
            if (!artifactGroups[c.artifactId]) artifactGroups[c.artifactId] = [];
            artifactGroups[c.artifactId].push(c.codeId);
        });

        Object.values(artifactGroups).forEach(groupIds => {
            const uniqueIds = Array.from(new Set(groupIds));
            for (let i = 0; i < uniqueIds.length; i++) {
                for (let j = i + 1; j < uniqueIds.length; j++) {
                    const idx1 = indexMap.get(uniqueIds[i]);
                    const idx2 = indexMap.get(uniqueIds[j]);
                    if (idx1 !== undefined && idx2 !== undefined) {
                        matrix[idx1][idx2]++;
                        matrix[idx2][idx1]++;
                    }
                }
            }
        });

        // 2. D3 Chord
        const chord = d3.chord()
            .padAngle(0.05)
            .sortSubgroups(d3.descending);

        const chords = chord(matrix);

        const g = svg.append("g")
            .attr("transform", `translate(${width / 2},${height / 2})`);

        // Arcs (Nodes)
        const group = g.append("g")
            .selectAll("g")
            .data(chords.groups)
            .join("g");

        group.append("path")
            .attr("fill", d => activeCodes[d.index].color)
            .attr("stroke", d => d3.rgb(activeCodes[d.index].color).darker() as any)
            .attr("d", d3.arc().innerRadius(innerRadius).outerRadius(outerRadius) as any);

        // Labels
        group.append("text")
            .each(function(d) { (d as any).angle = (d.startAngle + d.endAngle) / 2; })
            .attr("dy", ".35em")
            .attr("transform", (d: any) => `
                rotate(${(d.angle * 180 / Math.PI - 90)})
                translate(${innerRadius + 26})
                ${d.angle > Math.PI ? "rotate(180)" : ""}
            `)
            .attr("text-anchor", (d: any) => d.angle > Math.PI ? "end" : "start")
            .text(d => activeCodes[d.index].name)
            .style("fill", "#a1a1aa")
            .style("font-size", "10px");

        // Ribbons (Links)
        g.append("g")
            .attr("fill-opacity", 0.67)
            .selectAll("path")
            .data(chords)
            .join("path")
            .attr("d", d3.ribbon().radius(innerRadius) as any)
            .attr("fill", d => activeCodes[d.source.index].color)
            .attr("stroke", d => d3.rgb(activeCodes[d.source.index].color).darker() as any);

    }, [codes, codings]);

    return <div ref={wrapperRef} className="w-full h-full p-4"><svg ref={ref} width="100%" height="100%" /></div>;
};

const StreamChart = ({ codes, codings, artifacts }: { codes: Code[], codings: Coding[], artifacts: Artifact[] }) => {
    const ref = useRef<SVGSVGElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current || !wrapperRef.current) return;
        const svg = d3.select(ref.current);
        svg.selectAll("*").remove();

        const { width, height } = wrapperRef.current.getBoundingClientRect();
        const margin = { top: 20, right: 30, bottom: 30, left: 40 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Prepare Data: Sort artifacts by date, then count codes per artifact
        const sortedArtifacts = [...artifacts].sort((a, b) => 
            new Date(a.curation.dateCreated).getTime() - new Date(b.curation.dateCreated).getTime()
        );

        const data = sortedArtifacts.map(art => {
            const counts: any = { date: new Date(art.curation.dateCreated), name: art.name };
            codes.forEach(c => {
                counts[c.id] = codings.filter(cd => cd.artifactId === art.id && cd.codeId === c.id).length;
            });
            return counts;
        });

        // Top 10 codes by frequency to avoid clutter
        const topCodes = codes
            .map(c => ({ ...c, total: codings.filter(cd => cd.codeId === c.id).length }))
            .sort((a,b) => b.total - a.total)
            .slice(0, 10);
        
        const keys = topCodes.map(c => c.id);

        // Stack
        const series = d3.stack()
            .keys(keys)
            .offset(d3.stackOffsetSilhouette) // Streamgraph style
            (data);

        const x = d3.scaleLinear()
            .domain([0, data.length - 1])
            .range([0, innerWidth]);

        const yScaleMax = d3.max(series, s => d3.max(s, d => d[1])) || 10;
        const yScaleMin = d3.min(series, s => d3.min(s, d => d[0])) || -10;
        
        const y = d3.scaleLinear()
            .domain([yScaleMin, yScaleMax])
            .range([innerHeight, 0]);

        const area = d3.area<any>()
            .x((d, i) => x(i))
            .y0(d => y(d[0]))
            .y1(d => y(d[1]))
            .curve(d3.curveBasis); // Smooth

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        g.selectAll("path")
            .data(series)
            .join("path")
            .attr("fill", d => topCodes.find(c => c.id === d.key)?.color || "#888")
            .attr("d", area)
            .attr("fill-opacity", 0.9)
            .append("title")
            .text(d => topCodes.find(c => c.id === d.key)?.name || "");

        // Labels (Time)
        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x).ticks(data.length).tickFormat((d, i) => i + 1 + ""));

        // Legend overlay handled via tooltip mostly for streamgraphs

    }, [codes, codings, artifacts]);

    return <div ref={wrapperRef} className="w-full h-full p-4"><svg ref={ref} width="100%" height="100%" /></div>;
};
