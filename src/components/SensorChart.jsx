import React, { useState } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from "recharts";

export default function SensorChart({ data, thresholds }) {
    const [activeMetric, setActiveMetric] = useState("moisture");

    const metricsConfig = {
        moisture: {
            label: "Soil Moisture",
            unit: "%",
            dataKey: "moisture",
            color: "#38bdf8",
            stroke: "#0284c7",
            gradientId: "moistureGrad",
            domain: [0, 100],
            showThresholds: true
        },
        temperature: {
            label: "Ambient Temperature",
            unit: "°C",
            dataKey: "temperature",
            color: "#fb923c",
            stroke: "#ea580c",
            gradientId: "tempGrad",
            domain: [10, 40],
            showThresholds: false
        },
        humidity: {
            label: "Air Humidity",
            unit: "%",
            dataKey: "humidity",
            color: "#2dd4bf",
            stroke: "#0d9488",
            gradientId: "humidityGrad",
            domain: [20, 90],
            showThresholds: false
        }
    };

    const currentConfig = metricsConfig[activeMetric];

    const values = data.map(d => d[currentConfig.dataKey]).filter(v => typeof v === "number" && !isNaN(v));
    const currentVal = values.length > 0 ? values[values.length - 1] : "--";
    const minVal = values.length > 0 ? Math.min(...values).toFixed(1) : "--";
    const maxVal = values.length > 0 ? Math.max(...values).toFixed(1) : "--";

    return (
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-slate-800/80 flex flex-col justify-between h-full font-sans">
            {/* Header with Title and Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-3 border-b border-slate-800/80 gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Telemetry Ingest
                        </span>
                    </div>
                    <h2 className="text-lg font-black text-white tracking-tight mt-0.5">
                        {currentConfig.label} Time-Series
                    </h2>
                </div>

                {/* Metric Selector Tabs */}
                <div className="flex items-center bg-slate-950/70 p-1 rounded-2xl border border-slate-800 gap-1">
                    <button
                        type="button"
                        onClick={() => setActiveMetric("moisture")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            activeMetric === "moisture"
                                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        Soil Moisture
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveMetric("temperature")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            activeMetric === "temperature"
                                ? "bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        Temperature
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveMetric("humidity")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            activeMetric === "humidity"
                                ? "bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        Air Humidity
                    </button>
                </div>
            </div>

            {/* Ingest Stats Bar */}
            <div className="flex items-center flex-wrap gap-6 mb-4 text-xs font-medium text-slate-400">
                <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Current</span>
                    <span className="text-base font-black text-white font-mono">
                        {currentVal} {currentConfig.unit}
                    </span>
                </div>
                <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Window Min</span>
                    <span className="text-sm font-black text-slate-300 font-mono">
                        {minVal} {currentConfig.unit}
                    </span>
                </div>
                <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Window Max</span>
                    <span className="text-sm font-black text-slate-300 font-mono">
                        {maxVal} {currentConfig.unit}
                    </span>
                </div>
                {activeMetric === "moisture" && thresholds && (
                    <div className="hidden md:flex items-center gap-4 ml-auto text-[11px] font-bold">
                        <span className="flex items-center gap-1.5 text-orange-400">
                            <span className="w-2.5 h-0.5 bg-orange-400 inline-block border-b-2 border-dashed border-orange-400"></span>
                            Trigger: {thresholds.minMoisture}%
                        </span>
                        <span className="flex items-center gap-1.5 text-sky-400">
                            <span className="w-2.5 h-0.5 bg-sky-400 inline-block border-b-2 border-dashed border-sky-400"></span>
                            Cutoff: {thresholds.maxMoisture}%
                        </span>
                    </div>
                )}
            </div>

            {/* Recharts Area Container */}
            <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id={currentConfig.gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={currentConfig.color} stopOpacity={0.35} />
                                <stop offset="95%" stopColor={currentConfig.color} stopOpacity={0.0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />

                        <XAxis
                            dataKey="time"
                            tick={{ fontSize: 10, fill: "#64748b", fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                            dy={8}
                        />

                        <YAxis
                            domain={currentConfig.domain}
                            tick={{ fontSize: 10, fill: "#64748b", fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                        />

                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#0f172a",
                                border: "1px solid #334155",
                                borderRadius: "16px",
                                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.6)",
                                fontSize: "11px",
                                fontWeight: "bold",
                                color: "#f8fafc",
                                padding: "8px 12px"
                            }}
                            itemStyle={{ color: currentConfig.color }}
                            formatter={(value) => [`${value} ${currentConfig.unit}`, currentConfig.label]}
                        />

                        {activeMetric === "moisture" && thresholds && (
                            <>
                                <ReferenceLine
                                    y={thresholds.minMoisture}
                                    stroke="#fb923c"
                                    strokeDasharray="4 4"
                                    strokeWidth={1.5}
                                    label={{
                                        value: `Trigger (${thresholds.minMoisture}%)`,
                                        fill: "#fb923c",
                                        fontSize: 9,
                                        position: "insideBottomRight"
                                    }}
                                />
                                <ReferenceLine
                                    y={thresholds.maxMoisture}
                                    stroke="#38bdf8"
                                    strokeDasharray="4 4"
                                    strokeWidth={1.5}
                                    label={{
                                        value: `Cutoff (${thresholds.maxMoisture}%)`,
                                        fill: "#38bdf8",
                                        fontSize: 9,
                                        position: "insideTopRight"
                                    }}
                                />
                            </>
                        )}

                        <Area
                            type="monotone"
                            dataKey={currentConfig.dataKey}
                            stroke={currentConfig.color}
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill={`url(#${currentConfig.gradientId})`}
                            animationDuration={500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}