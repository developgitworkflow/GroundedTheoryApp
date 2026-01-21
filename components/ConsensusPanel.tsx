
import React from 'react';
import { Artifact, ResearchTeam, Vote, ConsensusCriteria, VoteStatus, TypeOfVote } from '../types';
import { 
  GitPullRequest, 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  MessageSquare, 
  ShieldCheck,
  Users,
  AlertCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface ConsensusPanelProps {
  artifact: Artifact;
  team: ResearchTeam;
  votes: Vote[];
  activeResearcherId: string;
  onVote: (criterionId: string, status: VoteStatus, comment?: string) => void;
  onClose: () => void;
}

export const ConsensusPanel: React.FC<ConsensusPanelProps> = ({
  artifact,
  team,
  votes,
  activeResearcherId,
  onVote,
  onClose
}) => {
  const activeCriteria = team.consensusCriteria.filter(c => c.active);
  const activeResearcher = team.researchers.find(r => r.id === activeResearcherId);

  // Helper to calculate status of a specific criterion
  const getCriterionStatus = (criteria: ConsensusCriteria) => {
    const relevantVotes = votes.filter(v => v.artifactId === artifact.id && v.criterionId === criteria.id);
    const totalResearchers = team.researchers.length;
    const approvals = relevantVotes.filter(v => v.status === 'approved').length;
    const rejections = relevantVotes.filter(v => v.status === 'rejected').length;
    
    let isPassed = false;
    let statusText = `${approvals}/${totalResearchers} votes`;

    switch (criteria.votingType) {
      case 'unanimous':
        isPassed = approvals === totalResearchers;
        break;
      case 'majority':
        isPassed = approvals > (totalResearchers / 2);
        break;
      case 'consensus':
        // Soft consensus: No hard rejections, at least one approval
        isPassed = rejections === 0 && approvals > 0;
        break;
    }

    return { isPassed, approvals, rejections, statusText, relevantVotes };
  };

  // Overall Merge Status
  const allPassed = activeCriteria.every(c => getCriterionStatus(c).isPassed);

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-800 w-[400px] shadow-2xl animate-in slide-in-from-right duration-300 z-40 absolute right-0 top-0 bottom-0">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950">
        <div className="flex items-center gap-2">
          <GitPullRequest className={cn("h-5 w-5", allPassed ? "text-emerald-500" : "text-amber-500")} />
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Review Consensus</h3>
            <p className="text-xs text-zinc-500 font-mono">#{artifact.id.slice(-6)}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><XCircle size={18} className="text-zinc-500" /></Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Overall Status Banner */}
        <Card className={cn("border", allPassed ? "border-emerald-900/50 bg-emerald-950/10" : "border-amber-900/50 bg-amber-950/10")}>
          <CardContent className="p-4 flex items-start gap-3">
            {allPassed 
              ? <CheckCircle2 size={20} className="text-emerald-500 mt-0.5" /> 
              : <AlertCircle size={20} className="text-amber-500 mt-0.5" />
            }
            <div>
              <h4 className={cn("text-sm font-bold", allPassed ? "text-emerald-400" : "text-amber-400")}>
                {allPassed ? "Validation Complete" : "Checks Pending"}
              </h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                {allPassed 
                  ? "This artifact meets all consensus criteria and is ready for theory integration."
                  : "Some criteria have not been met. Review requirements below."
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Criteria List */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase text-zinc-500 flex items-center gap-2">
            <ShieldCheck size={14} /> Validation Rules
          </h4>
          
          {activeCriteria.map(criteria => {
            const { isPassed, statusText, relevantVotes, rejections } = getCriterionStatus(criteria);
            const myVote = relevantVotes.find(v => v.researcherId === activeResearcherId);

            return (
              <div key={criteria.id} className="group bg-zinc-900/40 border border-zinc-800 rounded-lg overflow-hidden">
                {/* Header Row */}
                <div className="p-3 flex items-center justify-between border-b border-zinc-800/50">
                  <div className="flex items-center gap-2">
                    {isPassed 
                      ? <CheckCircle2 size={16} className="text-emerald-500" /> 
                      : rejections > 0 
                        ? <XCircle size={16} className="text-red-500" />
                        : <MinusCircle size={16} className="text-zinc-500" />
                    }
                    <span className="text-sm font-medium text-zinc-200">{criteria.name}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] h-5 border-zinc-700 text-zinc-500 capitalize">
                    {criteria.votingType}
                  </Badge>
                </div>

                {/* Description & Progress */}
                <div className="p-3 bg-zinc-950/30">
                  <p className="text-xs text-zinc-400 mb-3">{criteria.description}</p>
                  
                  {/* Voting Area */}
                  <div className="flex items-center justify-between bg-zinc-900 rounded p-2 border border-zinc-800">
                    <div className="flex -space-x-2">
                      {relevantVotes.map(v => {
                        const r = team.researchers.find(res => res.id === v.researcherId);
                        if(!r) return null;
                        return (
                          <div key={v.id} className="relative group/avatar">
                            <Avatar className={cn("w-6 h-6 border-2", v.status === 'approved' ? 'border-emerald-900' : v.status === 'rejected' ? 'border-red-900' : 'border-zinc-800')}>
                              <AvatarFallback style={{ backgroundColor: r.color, fontSize: '8px', color: 'white' }}>{r.initials}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1">
                               {v.status === 'approved' && <CheckCircle2 size={10} className="text-emerald-500 bg-black rounded-full" />}
                               {v.status === 'rejected' && <XCircle size={10} className="text-red-500 bg-black rounded-full" />}
                            </div>
                          </div>
                        )
                      })}
                      {relevantVotes.length === 0 && <span className="text-[10px] text-zinc-600 self-center px-2">No votes yet</span>}
                    </div>

                    {/* Action Buttons for Active Researcher */}
                    <div className="flex gap-1">
                       <Button 
                          size="icon" 
                          className={cn("h-6 w-6", myVote?.status === 'approved' ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-emerald-400")}
                          onClick={() => onVote(criteria.id, 'approved')}
                          title="Approve"
                        >
                          <CheckCircle2 size={12} />
                       </Button>
                       <Button 
                          size="icon" 
                          className={cn("h-6 w-6", myVote?.status === 'rejected' ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-red-400")}
                          onClick={() => onVote(criteria.id, 'rejected')}
                          title="Request Changes"
                        >
                          <XCircle size={12} />
                       </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-950">
         <Button 
            className={cn("w-full gap-2", allPassed ? "bg-emerald-600 hover:bg-emerald-700" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400")}
            disabled={!allPassed}
         >
            {allPassed ? <GitPullRequest size={16}/> : <Users size={16}/>}
            {allPassed ? "Merge to Theory Core" : "Consensus Pending"}
         </Button>
      </div>
    </div>
  );
};
