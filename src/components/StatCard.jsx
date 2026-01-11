import React from 'react';
import { Droplet, Thermometer, Sun, Activity } from 'lucide-react';

const icons = {
    moisture: { icon: <Droplet size={28} />, color: "text-blue-500", bg: "bg-blue-50" },
    temperature: { icon: <Thermometer size={28} />, color: "text-orange-500", bg: "bg-orange-50" },
    light: { icon: <Sun size={28} />, color: "text-yellow-500", bg: "bg-yellow-50" },
    default: { icon: <Activity size={28} />, color: "text-gray-500", bg: "bg-gray-50" }
};

export default function StatCard({ title, value, unit, type }) {
    const style = icons[type] || icons.default;

    return (
        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm border border-white/50 hover:shadow-md transition-all duration-300 group">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-500 text-sm font-semibold tracking-wide uppercase">{title}</p>
                    <div className="mt-2 flex items-baseline gap-1">
                        <h3 className="text-3xl font-bold text-slate-800 tracking-tight group-hover:scale-105 transition-transform origin-left">
                            {value}
                        </h3>
                        <span className="text-slate-400 font-medium">{unit}</span>
                    </div>
                </div>
                <div className={`p-3 rounded-2xl ${style.bg} ${style.color} shadow-inner`}>
                    {style.icon}
                </div>
            </div>
        </div>
    );
}

