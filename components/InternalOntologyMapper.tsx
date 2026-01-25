
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  select, 
  forceSimulation, 
  forceLink, 
  forceManyBody, 
  forceCollide, 
  forceCenter, 
  drag as d3Drag, 
  SimulationNodeDatum, 
  SimulationLinkDatum 
} from 'd3';
import { ProjectSettings, Artifact, Code, Memo, ResearchTeam, Coding } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Database, X, Info } from 'lucide-react';
import { cn } from '../lib/utils';

interface InternalOntologyMapperProps {
  settings: ProjectSettings;
  artifacts: Artifact[];
  codes: Code[];
  codings: Coding[];
  memos: Memo[];
  team: ResearchTeam;
}

type DomainType = 'formulation' | 'collection' | 'analysis' | 'finding';

interface OntologyNode extends SimulationNodeDatum {
  id: string;
  label: string;
  domain: DomainType;
  description: string;
  count: number;
  instances: any[];
}

interface OntologyLink extends SimulationLinkDatum<OntologyNode> {
  source: string | OntologyNode;
  target: string | OntologyNode;
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
  const [selectedNode, setSelectedNode] = useState<OntologyNode | null>(null);

  // --- Data Mapping ---
  const graphData = useMemo(() => {
    const researchers = team.researchers;
    const questions = settings.theoreticalFramework.researchQuestions;
    const methods = settings.theoreticalFramework.methods;
    const participants = settings.participants;
    
    // Split Codes
    const openCodes = codes.filter(c => c.kind === 'code');
    const descCategories = codes.filter(c => c.kind === 'category' && !c.isCore);
    const analyticCategories = codes.filter(c => c.kind === 'category' && c.isCore);
    
    const interpretations = memos.filter(m => m.type === 'observational' || m.type === 'analytical');
    const findings = memos.filter(m => m.type === 'finding');
    const report = settings.structuredAbstract.background ? [{ id: 'rep', name: 'Final Report' }] : [];

    const nodes: OntologyNode[] = [
      // 1. Project Formulation (Blue)
      { id: 'Project', label: 'Research Project', domain: 'formulation', description: 'The study context.', count: 1, instances: [{ name: settings.projectName }] },
      { id: 'Objective', label: 'Research Objective', domain: 'formulation', description: 'Goals of the study.', count: 1, instances: [{ name: 'Primary Objective' }] },
      { id: 'Researcher', label: 'Researcher', domain: 'formulation', description: 'Agents conducting inquiry.', count: researchers.length, instances: researchers },
      { id: 'Framework', label: 'Theoretical Framework', domain: 'formulation', description: 'Guiding theory type.', count: 1, instances: [{ name: settings.theoryType }] },
      { id: 'Method', label: 'Method', domain: 'formulation', description: 'Protocols applied.', count: methods.length, instances: methods.map(m => ({ name: m.type })) },
      { id: 'Field', label: 'Field of Study', domain: 'formulation', description: 'Subject and location.', count: 1, instances: [{ name: settings.fieldOfStudy.location }] },
      { id: 'Question', label: 'Research Question', domain: 'formulation', description: 'Specific queries.', count: questions.length, instances: questions.map(q => ({ name: q.content })) },

      // 2. Data Collection (Purple)
      { id: 'Bibliography', label: 'Bibliography', domain: 'collection', description: 'Literature sources.', count: settings.theoreticalFramework.bibliographyContent ? 1 : 0, instances: [] },
      { id: 'Subject', label: 'Subject / Object', domain: 'collection', description: 'Participants (Actors).', count: participants.length, instances: participants.map(p => ({ name: p.anonymizedCode })) },
      { id: 'Record', label: 'Record (Artifact)', domain: 'collection', description: 'Raw data (transcripts).', count: artifacts.length, instances: artifacts },

      // 3. Consensus (Yellow/Amber)
      { id: 'Reflexivity', label: 'Reflexivity', domain: 'analysis', description: 'Self-correction & reformulation.', count: memos.filter(m => m.type === 'reflective').length, instances: [] },
      { id: 'MethodApp', label: 'Method Application', domain: 'analysis', description: 'Method applied to Subject.', count: methods.length, instances: [] },
      { id: 'Interpretation', label: 'Interpretation', domain: 'analysis', description: 'Codings and Memos.', count: codings.length + interpretations.length, instances: interpretations.map(m => ({ name: m.title })) },

      // 4. Finding (Green)
      { id: 'Code', label: 'Code', domain: 'finding', description: 'Open codes.', count: openCodes.length, instances: openCodes },
      { id: 'DescCat', label: 'Descriptive Category', domain: 'finding', description: 'Initial groupings.', count: descCategories.length, instances: descCategories },
      { id: 'AnalyticCat', label: 'Analytic Category', domain: 'finding', description: 'Theoretical constructs.', count: analyticCategories.length, instances: analyticCategories },
      { id: 'Theory', label: 'Grounded Theory', domain: 'finding', description: 'Core phenomenon.', count: 1, instances: [{ name: `${settings.theoryType} Theory` }] },
      { id: 'Report', label: 'Report', domain: 'finding', description: 'Final output.', count: report.length, instances: report },
    ];

    const links: OntologyLink[] = [
      // Blue Zone
      { source: 'Project', target: 'Objective', label: 'hasObjective' },
      { source: 'Project', target: 'Framework', label: 'hasFramework' },
      { source: 'Project', target: 'Researcher', label: 'hasResearcher' },
      { source: 'Researcher', target: 'Field', label: 'selects' },
      { source: 'Researcher', target: 'Method', label: 'applies' },
      { source: 'Objective', target: 'Question', label: 'poses' },
      
      // Connections to Purple
      { source: 'Method', target: 'MethodApp', label: 'defines' },
      { source: 'Field', target: 'Subject', label: 'contains' },
      { source: 'MethodApp', target: 'Subject', label: 'appliedTo' },
      { source: 'Subject', target: 'Record', label: 'generates' },
      { source: 'Bibliography', target: 'Project', label: 'informs' },

      // Connections to Yellow
      { source: 'Record', target: 'Interpretation', label: 'isInterpreted' },
      { source: 'Interpretation', target: 'MethodApp', label: 'basedOn' },
      { source: 'Reflexivity', target: 'Project', label: 'reformulates' },

      // Connections to Green
      { source: 'Interpretation', target: 'Code', label: 'hasCodes' },
      { source: 'Code', target: 'DescCat', label: 'elaborates' },
      { source: 'DescCat', target: 'AnalyticCat', label: 'abstracts' },
      { source: 'AnalyticCat', target: 'Theory', label: 'synthesizes' },
      { source: 'Theory', target: 'Report', label: 'isReported' },
      { source: 'Report', target: 'Reflexivity', label: 'triggers' }, // Feedback loop
    ];

    return { nodes, links };
  }, [settings, artifacts, codes, memos, team, codings]);

  // --- D3 Logic ---
  useEffect(() => {
    if (!svgRef.current || !wrapperRef.current) return;

    const { width, height } = wrapperRef.current.getBoundingClientRect();
    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    const defs = svg.append("defs");
    defs.append("marker")
        .attr("id", "arrow-head")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 32)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#52525b");

    const simulation = forceSimulation(graphData.nodes)
        .force("link", forceLink(graphData.links).id((d: any) => d.id).distance(100))
        .force("charge", forceManyBody().strength(-300))
        .force("collide", forceCollide().radius(40))
        .force("center", forceCenter(width / 2, height / 2));

    const linkGroup = svg.append("g");
    const nodeGroup = svg.append("g");

    // Links
    const link = linkGroup.selectAll(".link")
        .data(graphData.links)
        .enter().append("path")
        .attr("stroke", "#3f3f46")
        .attr("stroke-width", 1)
        .attr("fill", "none")
        .attr("marker-end", "url(#arrow-head)");

    const linkLabel = linkGroup.selectAll(".link-label")
        .data(graphData.links)
        .enter().append("text")
        .text(d => d.label)
        .attr("font-size", 8)
        .attr("fill", "#71717a")
        .attr("text-anchor", "middle");

    // Nodes
    const node = nodeGroup.selectAll(".node")
        .data(graphData.nodes)
        .enter().append("g")
        .call(d3Drag<any, any>()
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
        .on("click", (e, d) => setSelectedNode(d));

    // Node Circle
    node.append("circle")
        .attr("r", 25)
        .attr("fill", d => {
            switch(d.domain) {
                case 'formulation': return "#1e3a8a"; // Blue
                case 'collection': return "#581c87"; // Purple
                case 'analysis': return "#78350f"; // Amber
                case 'finding': return "#064e3b"; // Green
                default: return "#27272a";
            }
        })
        .attr("stroke", d => {
            switch(d.domain) {
                case 'formulation': return "#60a5fa"; 
                case 'collection': return "#c084fc"; 
                case 'analysis': return "#fbbf24"; 
                case 'finding': return "#34d399"; 
                default: return "#71717a";
            }
        })
        .attr("stroke-width", 2);

    // Node Count
    node.append("text")
        .text(d => d.count)
        .attr("dy", 5)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", 12)
        .attr("font-weight", "bold")
        .style("pointer-events", "none");

    // Node Label
    node.append("text")
        .text(d => d.label)
        .attr("dy", 40)
        .attr("text-anchor", "middle")
        .attr("fill", "#e4e4e7")
        .attr("font-size", 10)
        .style("pointer-events", "none")
        .call(wrap, 80); // Helper to wrap text if needed

    simulation.on("tick", () => {
        link.attr("d", (d: any) => {
            return `M${d.source.x},${d.source.y} L${d.target.x},${d.target.y}`;
        });

        linkLabel
            .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
            .attr("y", (d: any) => (d.source.y + d.target.y) / 2);

        node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function wrap(text: any, width: number) {
        text.each(function(this: any) {
            const text = select(this);
            const words = text.text().split(/\s+/).reverse();
            let word;
            let line: any[] = [];
            let lineNumber = 0;
            const lineHeight = 1.1; 
            const y = text.attr("y");
            const dy = parseFloat(text.attr("dy"));
            let tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node()!.getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    }

  }, [graphData]);

  // Color Helper for UI
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
        <div ref={wrapperRef} className="flex-1 h-full relative overflow-hidden">
            <svg ref={svgRef} width="100%" height="100%" className="cursor-grab active:cursor-grabbing" />
            
            {/* Legend */}
            <div className="absolute top-4 left-4 p-3 bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-lg shadow-xl pointer-events-none">
                <div className="text-[10px] font-bold uppercase text-zinc-500 mb-2">Ontology Domains</div>
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-xs text-zinc-300">Project Formulation</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        <span className="text-xs text-zinc-300">Data Collection</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span className="text-xs text-zinc-300">Analysis & Consensus</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-xs text-zinc-300">Finding</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Info Sidebar */}
        {selectedNode && (
            <Card className="w-80 h-full border-l rounded-none shadow-2xl absolute right-0 top-0 bottom-0 bg-zinc-950 border-zinc-800 animate-in slide-in-from-right">
                <CardHeader className={cn("border-b", getDomainColor(selectedNode.domain))}>
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">{selectedNode.domain} Domain</div>
                            <CardTitle className="text-lg">{selectedNode.label}</CardTitle>
                        </div>
                        <button onClick={() => setSelectedNode(null)} className="hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                    <p className="text-xs opacity-80 mt-2 italic">{selectedNode.description}</p>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
                    <div className="p-3 bg-zinc-900/50 border-b border-zinc-800 flex justify-between items-center">
                        <span className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                            <Database size={12} /> Instances
                        </span>
                        <Badge variant="secondary" className="font-mono">{selectedNode.count}</Badge>
                    </div>
                    
                    <ScrollArea className="flex-1 p-3">
                        <div className="space-y-2">
                            {selectedNode.instances.length === 0 && (
                                <div className="text-center py-8 text-zinc-600 text-xs italic flex flex-col items-center gap-2">
                                    <Info size={24} className="opacity-20" />
                                    No data instantiated yet.
                                </div>
                            )}
                            {selectedNode.instances.map((inst, idx) => (
                                <div key={idx} className="p-3 bg-zinc-900 border border-zinc-800 rounded-md flex items-center gap-3">
                                    <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", getDomainColor(selectedNode.domain).split(' ')[0].replace('text-', 'bg-'))}></div>
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