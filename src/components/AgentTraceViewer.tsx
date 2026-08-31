import React, { useState } from 'react';
import { Cpu, ArrowDown, ChevronRight, CheckCircle2, AlertCircle, Clock, Database, Terminal, ShieldAlert, Sparkles, Brain, FlaskConical, Activity, FileText } from 'lucide-react';
import { SessionRunResult, AgentTraceEvent } from '../agents/types';

interface AgentTraceViewerProps {
  sessionResult: SessionRunResult | null;
  onRunTrial: () => void;
}

export const AgentTraceViewer: React.FC<AgentTraceViewerProps> = ({
  sessionResult,
  onRunTrial
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [showJsonModal, setShowJsonModal] = useState<AgentTraceEvent | null>(null);

  if (!sessionResult || sessionResult.traceEvents.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mx-auto">
          <Cpu className="w-8 h-8 text-teal-400" />
        </div>
        <h3 className="text-lg font-bold text-white">No Agent Execution Trace Recorded Yet</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Run a labelled live capture or synthetic fixture to inspect the seven-stage prototype trace.
        </p>
        <button
          onClick={onRunTrial}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 hover:from-teal-400 hover:to-cyan-400 transition-all"
        >
          Open Session Input
        </button>
      </div>
    );
  }

  const getAgentIcon = (id: string) => {
    switch (id) {
      case 'agent-speech-perception': return Activity;
      case 'agent-neuro-cognitive-reasoning': return Brain;
      case 'agent-sensory-motor': return Sparkles;
      case 'agent-experiment-designer': return FlaskConical;
      case 'agent-digital-twin': return Database;
      case 'agent-safety-boundary': return ShieldAlert;
      case 'agent-progress-optimization': return FileText;
      default: return Cpu;
    }
  };

  const totalExecutionTime = sessionResult.traceEvents.reduce((acc, curr) => acc + curr.executionTimeMs, 0);

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0c1527] to-slate-900 p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-teal-400 animate-pulse" />
            <h2 className="text-xl font-bold text-white">Prototype Stage Trace Graph</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Step-by-step software trace bound to a {sessionResult.inputProvenance.source.replace('-', ' ')} input.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300">
            Terminal stages: <strong className="text-teal-400">{sessionResult.traceEvents.length} / 7</strong>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300">
            Total Pipeline Latency: <strong className="text-cyan-400">{totalExecutionTime} ms</strong>
          </div>
        </div>
      </div>

      {/* Vertical Agent Trace Chain */}
      <div className="relative space-y-4">
        {sessionResult.traceEvents.map((event, index) => {
          const Icon = getAgentIcon(event.agentId);
          const isSelected = selectedAgentId === event.agentId;
          const isLast = index === sessionResult.traceEvents.length - 1;

          return (
            <React.Fragment key={event.agentId}>
              <div
                onClick={() => setSelectedAgentId(isSelected ? null : event.agentId)}
                className={`rounded-2xl border transition-all cursor-pointer p-5 shadow-lg ${
                  isSelected
                    ? 'bg-slate-900 border-teal-500 shadow-teal-500/10 ring-1 ring-teal-500'
                    : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 text-teal-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-slate-400">0{index + 1}.</span>
                        <h3 className="text-sm font-bold text-white">{event.agentName}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${event.badgeColor}`}>
                          {event.role}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">Timestamp: {event.timestamp}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{event.executionTimeMs}ms</span>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowJsonModal(event);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 flex items-center space-x-1"
                    >
                      <Terminal className="w-3 h-3 text-teal-400" />
                      <span>JSON</span>
                    </button>
                  </div>
                </div>

                {/* Agent Thought / Observation / Decision */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                      <span>Observation</span>
                    </span>
                    <p className="text-slate-300 leading-relaxed">{event.observation}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center space-x-1">
                      <span>Prototype Rationale</span>
                    </span>
                    <p className="text-slate-300 leading-relaxed italic">{event.thought}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-teal-950/20 border border-teal-500/30 space-y-1">
                    <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-teal-400" />
                      <span>Stage Output</span>
                    </span>
                    <p className="text-teal-200 font-medium leading-relaxed">{event.decision}</p>
                  </div>
                </div>
              </div>

              {/* Connecting Pipe Animation */}
              {!isLast && (
                <div className="flex justify-center py-0.5">
                  <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
                    <ArrowDown className="w-4 h-4 text-teal-500/60 animate-bounce" />
                    <span>inter-agent context passed</span>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Raw JSON Inspector Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[85vh] rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-white text-base">{showJsonModal.agentName} Raw Output</h3>
              </div>
              <button
                onClick={() => setShowJsonModal(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-slate-800"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-auto rounded-xl bg-slate-950 p-4 border border-slate-800 font-mono text-xs text-teal-300">
              <pre>{JSON.stringify(showJsonModal.outputData, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
