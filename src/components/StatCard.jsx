import React from "react";
import { Droplet, Thermometer, Sun, Wind, Activity } from "lucide-react";

const CARD_VARIANTS = {
    moisture: {
        icon: <Droplet size={22} />,
        accent: "text-blue-400",
        bgIcon: "bg-blue-500/10 border-blue-500/25",
        gradient: "from-blue-500/10 to-transparent",
        barColor: "bg-blue-500"
    },
    temperature: {
        icon: <Thermometer size={22} />,
        accent: "text-orange-400",
        bgIcon: "bg-orange-500/10 border-orange-500/25",
        gradient: "from-orange-500/10 to-transparent",
        barColor: "bg-orange-500"
    },
    humidity: {
        icon: <Wind size={22} />,
        accent: "text-teal-400",
        bgIcon: "bg-teal-500/10 border-teal-500/25",
        gradient: "from-teal-500/10 to-transparent",
        barColor: "bg-teal-500"
    },
    light: {
        icon: <Sun size={22} />,
        accent: "text-amber-400",
        bgIcon: "bg-amber-500/10 border-amber-500/25",
        gradient: "from-amber-500/10 to-transparent",
        barColor: "bg-amber-500"
    },
    default: {
        icon: <Activity size={22} />,
        accent: "text-purple-400",
        bgIcon: "bg-purple-500/10 border-purple-500/25",
        gradient: "from-purple-500/10 to-transparent",
        barColor: "bg-purple-500"
    }
};

export default function StatCard({
    title,
    value,
    unit = "",
    type = "default",
    statusTag,
    statusColor = "text-slate-400 bg-slate-800/80 border-slate-700/60",
    minLimit,
    maxLimit
}) {
    const variant = CARD_VARIANTS[type] || CARD_VARIANTS.default;
    const numValue = typeof value === "number" ? value : parseFloat(value);
    const hasProgress = !isNaN(numValue) && (type === "moisture" || type === "humidity");

    return (
        <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 p-5 shadow-xl hover:border-slate-700/90 transition-all duration-300 group flex flex-col justify-between">
            {/* Ambient Background Gradient */}
            <div
                className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-br ${variant.gradient} rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:scale-110 transition-transform`}
            ></div>

            {/* Top row: Label & Icon */}
            <div className="flex items-center justify-between relative z-10">
                <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-400">
                    {title}
                </span>
                <div className={`p-2.5 rounded-2xl border ${variant.bgIcon} ${variant.accent} shadow-inner`}>
                    {variant.icon}
                </div>
            </div>

            {/* Value Display */}
            <div className="my-3 relative z-10">
                <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-white tracking-tight font-mono group-hover:text-slate-100 transition-colors">
                        {value}
                    </span>
                    {unit && <span className="text-sm font-extrabold text-slate-400">{unit}</span>}
                </div>
            </div>

            {/* Micro Progress Bar (for moisture & humidity) */}
            {hasProgress && (
                <div className="mb-3 relative z-10">
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
                        <div
                            className={`h-full ${variant.barColor} transition-all duration-700 rounded-full`}
                            style={{ width: `${Math.min(100, Math.max(0, numValue))}%` }}
                        ></div>
                    </div>
                    {minLimit !== undefined && maxLimit !== undefined && (
                        <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1 font-semibold">
                            <span>Target: {minLimit}% - {maxLimit}%</span>
                            <span>Scale 0-100%</span>
                        </div>
                    )}
                </div>
            )}

            {/* Bottom Status Tag */}
            {statusTag && (
                <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between relative z-10">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${statusColor}`}>
                        {statusTag}
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">
                        Real-time
                    </span>
                </div>
            )}
        </div>
    );
}
