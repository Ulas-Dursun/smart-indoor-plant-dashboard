import React from "react";
import { Cpu, Sliders } from "lucide-react";

export default function SystemModeBadge({ mode }) {
    const isAuto = mode === "AUTO";

    return (
        <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border transition-all text-xs font-black tracking-wider ${
                isAuto
                    ? "bg-purple-950/70 border-purple-500/40 text-purple-300 shadow-md shadow-purple-500/10"
                    : "bg-slate-800/80 border-slate-700 text-slate-300 shadow-sm"
            }`}
        >
            <span
                className={`w-2 h-2 rounded-full ${
                    isAuto ? "bg-purple-400 animate-pulse" : "bg-slate-500"
                }`}
            ></span>
            {isAuto ? <Cpu size={14} className="text-purple-400" /> : <Sliders size={14} className="text-slate-400" />}
            <span>{isAuto ? "CLOSED-LOOP AUTO" : "MANUAL OVERRIDE"}</span>
        </div>
    );
}