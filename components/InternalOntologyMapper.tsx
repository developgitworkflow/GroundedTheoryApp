
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { ProjectSettings, Artifact, Code, Memo, ResearchTeam, Coding } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Network, Database, ChevronRight, X, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { cn } from '../lib/utils';

interface InternalOntologyMapperProps {
  settings: ProjectSettings;
  artifacts: Artifact[];
  codes: Code[];
  codings: Coding[];
  memos: Memo[];
  team: ResearchTeam;
}

// --- Ontology Definitions ---

type DomainType = 'formulation' | 'collection' | 'analysis' | 'finding';

interface OntologyNode {
  id: string;
  label: string;
  domain: DomainType;
  description: string;
  count: number; // The live instance count
  instances: any[]; // The actual data
}

interface OntologyLink {
  source: string;
  target: string;
  label: string;
}

export const InternalOntologyMapper: React.FC<InternalOntologyMapperProps> = ({
  settings,
  artifacts,
  codes,
  codings,
  memos,
  team
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [selectedNode, setSelectedNode] = useState<OntologyNode | null>(null);

  // --- 1. Map Real Data to Abstract Ontology ---
  const dataMap = useMemo(() => {
    // Formulation
    const researchers = team.researchers;
    const questions = settings.theoreticalFramework.researchQuestions;
    const field = settings.fieldOfStudy.subjectOfStudy ? [settings.fieldOfStudy] : [];
    
    // Collection
    const methods = settings.theoreticalFramework.methods;
    const tools = settings.theoreticalFramework.tools;
    const participants = settings.participants;
    const biblio = settings.theoreticalFramework.bibliographyContent ? [{ id: 'bib', name: 'Bibliography' }] : [];
    const records = artifacts; // The raw data

    // Analysis
    const openCodes = codes.filter(c => c.kind === 'code');
    const categories = codes.filter(c => c.kind === 'category');
    const interpretations = memos.filter(m => m.type === 'observational');
    const consensusRules = team.consensusCriteria;

    // Findings
    const findings = memos.filter(m => m.type === 'finding');
    const theory = [{ id: 'theory-core', name: `${settings.theoryType} Theory`, content: 'Core synthesis' }];
    const report = settings.structuredAbstract.background ? [{ id: 'report', name: 'Structured Abstract' }] : [];

    return {
        researchers, questions, field, methods, tools, participants, biblio, records,
        openCodes, categories, interpretations, consensusRules, findings, theory, report
    };
  }, [settings, artifacts, codes, memos, team]);

  // --- 2. Construct Graph Data ---
  const graphData = useMemo(() => {
    const nodes: OntologyNode[] = [
      // Project Formulation (Blue)
      { id: 'Project', label: 'Research Project', domain: 'formulation', description: 'The overarching inquiry context.', count: 1, instances: [{ name: settings.projectName }] },
      { id: 'Researcher', label: 'Researcher', domain: 'formulation', description: 'Agents conducting the inquiry.', count: dataMap.researchers.length, instances: dataMap.researchers },
      { id: 'Question', label: 'Research Question', domain: 'formulation', description: 'Specific queries guiding the study.', count: dataMap.questions.length, instances: dataMap.questions.map(q => ({ name: q.content })) },
      { id: 'Field', label: 'Field of Study', domain: 'formulation', description: 'The environment and subject.', count: dataMap.field.length, instances: dataMap.field.map(f => ({ name: `${f.subjectOfStudy} in ${f.location}` })) },
      
      // Data Collection (Purple)
      { id: 'Method', label: 'Method', domain: 'collection', description: 'Protocols for data gathering.', count: dataMap.methods.length, instances: dataMap.methods.map(m => ({ name: `${m.type} Protocol` })) },
      { id: 'Subject', label: 'Subject/Actor', domain: 'collection', description: 'Participants or observed entities.', count: dataMap.participants.length, instances: dataMap.participants.map(p => ({ name: p.anonymizedCode })) },
      { id: 'Artifact', label: 'Record/Artifact', domain: 'collection', description: 'Raw data files (transcripts, etc).', count: dataMap.records.length, instances: dataMap.records },
      { id: 'Biblio', label: 'Bibliography', domain: 'collection', description: 'Literature foundation.', count: dataMap.biblio.length, instances: dataMap.biblio },

      // Analysis (Amber)
      { id: 'Interpret', label: 'Interpretation', domain: 'analysis', description: 'Memos and annotations on data.', count: dataMap.interpretations.length, instances: dataMap.interpretations.map(m => ({ name: m.title })) },
      { id: 'Code', label: 'Open Code', domain: 'analysis', description: 'Discrete concepts tagged in text.', count: dataMap.openCodes.length, instances: dataMap.openCodes },
      { id: 'Category', label: 'Category', domain: 'analysis', description: 'Higher-level conceptual groupings.', count: dataMap.categories.length, instances: dataMap.categories },
      { id: 'Consensus', label: 'Consensus', domain: 'analysis', description: 'Rules for agreement and validity.', count: dataMap.consensusRules.length, instances: dataMap.consensusRules },

      // Findings (Green)
      { id: 'Finding', label: 'Finding', domain: 'finding', description: 'Emergent theoretical insights.', count: dataMap.findings.length, instances: dataMap.findings.map(f => ({ name: f.title })) },
      { id: 'Theory', label: 'Grounded Theory', domain: 'finding', description: 'The synthesized core argument.', count: 1, instances: dataMap.theory },
      { id: 'Report', label: 'Report', domain: 'finding', description: 'Final output and abstract.', count: dataMap.report.length, instances: dataMap.report },
    ];

    const links: OntologyLink[] = [
      // Formulation Flow
      { source: 'Project', target: 'Researcher', label: 'hasResearcher' },
      { source: 'Project', target: 'Question', label: 'poses' },
      { source: 'Researcher', target: 'Field', label: 'selects' },
      { source: 'Researcher', target: 'Method', label: 'applies' },
      
      // Collection Flow
      { source: 'Method', target: 'Subject', label: 'engages' },
      { source: 'Subject', target: 'Artifact', label: 'generates' },
      { source: 'Project', target: 'Biblio', label: 'references' },
      
      // Analysis Flow
      { source: 'Researcher', target: 'Interpret', label: 'authors' },
      { source: 'Artifact', target: 'Interpret', label: 'isInterpreted' },
      { source: 'Interpret', target: 'Code', label: 'abstractsTo' },
      { source: 'Code', target: 'Category', label: 'groupsInto' },
      { source: 'Consensus', target: 'Interpret', label: 'validates' },
      
      // Findings Flow
      { source: 'Category', target: 'Theory', label: 'elaborates' },
      { source: 'Theory', target: 'Finding', label: 'yields' },
      { source: 'Finding', target: 'Report', label: 'isReported' },
      { source: 'Question', target: 'Finding', label: 'answeredBy' },
    ];

    return { nodes, links };
  }, [dataMap, settings.projectName]);

  // --- 3. D3 Rendering ---
  useEffect(() => {
    if (!svgRef.current || !wrapperRef.current) return;

    const { width, height } = wrapperRef.current.getBoundingClientRect();
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Definitions (Arrows)
    const defs = svg.append("defs");
    defs.append("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 28) // Offset to not overlap node
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#52525b");

    // Container Group for Zooming
    const container = svg.append("g");

    // Zoom Behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
            container.attr("transform", event.transform);
        });
    
    svg.call(zoom).on("dblclick.zoom", null);
    zoomRef.current = zoom;

    // Simulation
    const simulation = d3.forceSimulation(graphData.nodes as any)
        .force("link", d3.forceLink(graphData.links).id((d: any) => d.id).distance(120))
        .force("charge", d3.forceManyBody().strength(-500))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide().radius(50));

    const linkGroup = container.append("g");
    const nodeGroup = container.append("g");

    // Draw Links
    const link = linkGroup.selectAll(".link")
        .data(graphData.links)
        .enter().append("g")
        .attr("class", "link");

    const path = link.append("path")
        .attr("stroke", "#3f3f46")
        .attr("stroke-width", 1.5)
        .attr("fill", "none")
        .attr("marker-end", "url(#arrowhead)");

    const linkLabel = link.append("text")
        .text(d => d.label)
        .attr("font-size", 8)
        .attr("fill", "#71717a")
        .attr("text-anchor", "middle")
        .attr("dy", -3);

    // Draw Nodes
    const node = nodeGroup.selectAll(".node")
        .data(graphData.nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("cursor", "pointer")
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
            })
        )
        .on("click", (event, d) => {
            setSelectedNode(d);
        });

    // Node Circle
    node.append("circle")
        .attr("r", 24)
        .attr("fill", d => {
            switch(d.domain) {
                case 'formulation': return "#1e3a8a"; // Blue-900
                case 'collection': return "#581c87"; // Purple-900
                case 'analysis': return "#78350f"; // Amber-900
                case 'finding': return "#064e3b"; // Emerald-900
                default: return "#27272a";
            }
        })
        .attr("stroke", d => {
            switch(d.domain) {
                case 'formulation': return "#60a5fa"; // Blue-400
                case 'collection': return "#c084fc"; // Purple-400
                case 'analysis': return "#fbbf24"; // Amber-400
                case 'finding': return "#34d399"; // Emerald-400
                default: return "#71717a";
            }
        })
        .attr("stroke-width", 2);

    // Node Label
    node.append("text")
        .text(d => d.label)
        .attr("dy", 40)
        .attr("text-anchor", "middle")
        .attr("fill", "#e4e4e7")
        .attr("font-size", 10)
        .attr("font-weight", "bold")
        .style("pointer-events", "none") // Ensure drag works on circle
        .style("text-shadow", "0 1px 4px black");

    // Node Count Badge (inside circle)
    node.append("text")
        .text(d => d.count)
        .attr("dy", 5)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", 14)
        .attr("font-weight", "bold")
        .style("pointer-events", "none");

    // Update positions
    simulation.on("tick", () => {
        path.attr("d", (d: any) => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dr = Math.sqrt(dx * dx + dy * dy);
            // Curved lines
            return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });

        linkLabel.attr("transform", (d: any) => {
            // Very basic midpoint calculation for curved line label placement
            const x = (d.source.x + d.target.x) / 2;
            const y = (d.source.y + d.target.y) / 2;
            return `translate(${x},${y})`;
        });

        node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => { simulation.stop(); };
  }, [graphData]);

  // UI Handlers
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

  // Helper colors
  const getDomainColor = (domain: DomainType) => {
      switch(domain) {
          case 'formulation': return "text-blue-400 border-blue-900/50 bg-blue-950/20";
          case 'collection': return "text-purple-400 border-purple-900/50 bg-purple-950/20";
          case 'analysis': return "text-amber-400 border-amber-900/50 bg-amber-950/20";
          case 'finding': return "text-emerald-400 border-emerald-900/50 bg-emerald-950/20";
      }
  };

  return (
    <div className="flex h-full w-full bg-zinc-950 relative">
        {/* Main Canvas */}
        <div ref={wrapperRef} className="flex-1 h-full overflow-hidden relative">
            <div className="absolute top-4 left-4 z-10 flex gap-4 pointer-events-none">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-900 border border-blue-400"></div>
                    <span className="text-xs text-zinc-400">Formulation</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-900 border border-purple-400"></div>
                    <span className="text-xs text-zinc-400">Data Collection</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-900 border border-amber-400"></div>
                    <span className="text-xs text-zinc-400">Analysis & Consensus</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-900 border border-emerald-400"></div>
                    <span className="text-xs text-zinc-400">Findings</span>
                </div>
            </div>
            
            <svg ref={svgRef} width="100%" height="100%" className="cursor-grab active:cursor-grabbing" />

            {/* Zoom Controls */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-2 bg-black/60 backdrop-blur-md p-1 rounded-lg border border-zinc-800/50 shadow-xl pointer-events-auto z-10">
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
        </div>

        {/* Inspector Panel */}
        {selectedNode && (
            <Card className={cn(
                "w-80 h-full border-l rounded-none shadow-2xl absolute right-0 top-0 bottom-0 animate-in slide-in-from-right z-20",
                "bg-zinc-950 border-zinc-800"
            )}>
                <CardHeader className={cn("border-b border-zinc-800/50", getDomainColor(selectedNode.domain))}>
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">{selectedNode.domain} Domain</div>
                            <CardTitle className="text-lg">{selectedNode.label}</CardTitle>
                        </div>
                        <button onClick={() => setSelectedNode(null)} className="hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                    <p className="text-xs opacity-70 mt-2">{selectedNode.description}</p>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
                    <div className="p-4 bg-zinc-900/50 border-b border-zinc-800 flex justify-between items-center">
                        <span className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                            <Database size={12} /> Instances
                        </span>
                        <Badge variant="secondary" className="font-mono">{selectedNode.count}</Badge>
                    </div>
                    
                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-2">
                            {selectedNode.instances.length === 0 && (
                                <div className="text-center py-8 text-zinc-600 text-xs italic">
                                    No data instantiated yet.
                                </div>
                            )}
                            {selectedNode.instances.map((inst, idx) => (
                                <div key={idx} className="p-3 bg-zinc-900 border border-zinc-800 rounded-md flex items-center gap-3">
                                    <div className={cn("w-1.5 h-1.5 rounded-full", getDomainColor(selectedNode.domain).split(' ')[0].replace('text-', 'bg-'))}></div>
                                    <span className="text-sm text-zinc-300 truncate font-medium">
                                        {inst.name || inst.title || inst.content || "Untitled"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        )}
    </div>
  );
};
