import React, { useState } from "react";
import { Trash2, CheckCircle2, AlertTriangle, AlertOctagon, Info, Terminal } from "lucide-react";

export default function EventLog({ logs, onClear }) {
    const [filter, setFilter] = useState("ALL");

    const getIcon = (type) => {
        switch (type) {
            case "success":
                return <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />;
            case "warning":
                return <AlertTriangle size={14} className="text-amber-400 shrink-0" />;
            case "danger":
                return <AlertOctagon size={14} className="text-rose-400 shrink-0" />;
            default:
                return <Info size={14} className="text-sky-400 shrink-0" />;
        }
    };

    const getBadgeStyle = (category) => {
        switch (category) {
            case "PUMP":
                return "bg-blue-500/15 text-blue-300 border-blue-500/30";
            case "AUTO":
                return "bg-purple-500/15 text-purple-300 border-purple-500/30";
            case "SAFETY":
                return "bg-rose-500/15 text-rose-300 border-rose-500/30";
            case "ENVIRONMENT":
                return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
            default:
                return "bg-slate-800 text-slate-400 border-slate-700";
        }
    };

    const filteredLogs = logs.filter((log) => {
        if (filter === "ALL") return true;
        if (filter === "SAFETY") return log.category === "SAFETY" || log.category === "PUMP";
        if (filter === "AUTO") return log.category === "AUTO";
        return true;
    });

    return (
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-slate-800/80 flex flex-col h-full font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-3 border-b border-slate-800/80 gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
                        <Terminal size={16} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white tracking-tight uppercase">
                            System Audit & Telemetry Stream
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium">
                            Real-time controller transitions and safety enforcement
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Filter buttons */}
                    <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px] font-bold">
                        <button
                            type="button"
                            onClick={() => setFilter("ALL")}
                            className={`px-2.5 py-1 rounded-lg transition-all ${
                                filter === "ALL"
                                    ? "bg-slate-800 text-white shadow-sm"
                                    : "text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            ALL ({logs.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter("AUTO")}
                            className={`px-2.5 py-1 rounded-lg transition-all ${
                                filter === "AUTO"
                                    ? "bg-purple-900/60 text-purple-300 border border-purple-500/30 shadow-sm"
                                    : "text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            AUTO
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter("SAFETY")}
                            className={`px-2.5 py-1 rounded-lg transition-all ${
                                filter === "SAFETY"
                                    ? "bg-rose-900/60 text-rose-300 border border-rose-500/30 shadow-sm"
                                    : "text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            SAFETY
                        </button>
                    </div>

                    {logs.length > 0 && (
                        <button
                            type="button"
                            onClick={onClear}
                            title="Clear audit log"
                            className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        >
                            <Trash2 size={15} />
                        </button>
                    )}
                </div>
            </div>

            {/* Log Stream */}
            <div className="overflow-y-auto space-y-2 pr-1 max-h-[300px] font-sans">
                {filteredLogs.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500 font-medium">
                        No events recorded in this filter view.
                    </div>
                ) : (
                    filteredLogs.map((log) => (
                        <div
                            key={log.id}
                            className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/60 hover:border-slate-700/80 transition-colors text-xs"
                        >
                            <div className="mt-0.5">{getIcon(log.type)}</div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-mono text-[10px] text-slate-500 font-semibold">{log.timestamp}</span>
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${getBadgeStyle(log.category)}`}>
                                        {log.category}
                                    </span>
                                </div>
                                <p className="text-slate-300 font-medium leading-relaxed break-words text-[11px]">{log.message}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
