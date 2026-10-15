import { useState } from "react";
import { PlantProvider } from "./context/PlantContext";
import { usePlant } from "./context/usePlant";
import StatCard from "./components/StatCard";
import SensorChart from "./components/SensorChart";
import ControlCard from "./components/ControlCard";
import SystemModeBadge from "./components/SystemModeBadge";
import PlantConfigModal from "./components/PlantConfigModal";
import EventLog from "./components/EventLog";
import { PLANT_PRESETS } from "./constants/plantPresets";
import {
    Power,
    Cpu,
    ArrowRight,
    Zap,
    Sliders,
    Sparkles,
    Radio,
    ShieldCheck,
    Github,
    Linkedin,
    Sprout
} from "lucide-react";

function DashboardContent() {
    const {
        isDemoMode,
        toggleDemoMode,
        system,
        toggleSystemPower,
        setOperationMode,
        sensors,
        actuators,
        thresholds,
        updateThresholds,
        eventLogs,
        clearLogs,
        historyData,
        deviceHealth,
        safetyState
    } = usePlant();

    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

    const currentPlantPreset = PLANT_PRESETS.find(p => p.id === thresholds.plantProfileId) || PLANT_PRESETS[0];

    const getMoistureTag = () => {
        const val = sensors.moisture;
        if (val < thresholds.minMoisture) {
            return { text: "Critical: Low Moisture", color: "text-rose-400 bg-rose-500/10 border-rose-500/30" };
        }
        if (val >= thresholds.maxMoisture) {
            return { text: "Saturated / Optimal", color: "text-sky-400 bg-sky-500/10 border-sky-500/30" };
        }
        return { text: "Optimal Substrate", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
    };

    const getTempTag = () => {
        const val = sensors.temperature;
        if (val < 18) return { text: "Cool Ambient", color: "text-blue-400 bg-blue-500/10 border-blue-500/30" };
        if (val > 28) return { text: "Warm Environment", color: "text-orange-400 bg-orange-500/10 border-orange-500/30" };
        return { text: "Optimal Climate", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
    };

    const getHumidityTag = () => {
        const val = sensors.humidity;
        if (val < 40) return { text: "Arid Air", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" };
        if (val > 70) return { text: "High Vapor", color: "text-teal-400 bg-teal-500/10 border-teal-500/30" };
        return { text: "Transpiration Ideal", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
    };

    const getLightStatus = () => {
        if (actuators.growLight) return "Grow Light Active";
        return sensors.light === 1 || sensors.light === "1" ? "Bright Daylight" : "Low Ambient";
    };

    const toggleMode = () => {
        if (!system.enabled) return;
        const next = system.mode === "AUTO" ? "MANUAL" : "AUTO";
        setOperationMode(next);
    };

    const moistureStatus = getMoistureTag();
    const tempStatus = getTempTag();
    const humidityStatus = getHumidityTag();

    // Emergency Shutdown Lock Screen
    if (!system.enabled) {
        return (
            <div className="min-h-screen bg-[#070b12] flex flex-col items-center justify-center text-white p-6 font-sans">
                <div className="p-8 rounded-full bg-slate-900 border border-rose-500/30 mb-6 relative shadow-2xl shadow-rose-500/10">
                    <Power size={56} className="text-rose-500 animate-pulse" />
                </div>
                <h1 className="text-3xl font-black mb-2 tracking-tight">SYSTEM DISABLED</h1>
                <p className="text-slate-400 mb-8 uppercase text-xs tracking-widest font-bold">
                    Master Emergency Isolation Switch Engaged
                </p>
                <div className="max-w-md text-center text-xs text-slate-500 mb-8 leading-relaxed">
                    All pump relays, actuator circuits, and closed-loop triggers have been forcefully disengaged.
                </div>
                <button
                    type="button"
                    onClick={toggleSystemPower}
                    className="bg-emerald-600 hover:bg-emerald-500 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-xl shadow-emerald-600/30 flex items-center gap-2.5 active:scale-95 border border-emerald-400"
                >
                    <Power size={18} /> Restore System Power
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#070b12] text-slate-100 font-sans pb-16 selection:bg-emerald-500 selection:text-white">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 bg-[#070b12]/80 backdrop-blur-xl border-b border-slate-800/80 mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    {/* Left: Branding & Status */}
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={toggleSystemPower}
                                title="Master Emergency Isolation Switch"
                                className="bg-slate-900 p-2.5 rounded-2xl border border-slate-800 hover:border-rose-500/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors group"
                            >
                                <Power size={20} className="group-hover:text-rose-400" />
                            </button>
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                        <Sprout size={16} />
                                    </div>
                                    <h1 className="text-lg font-black text-white tracking-tight">
                                        Smart Plant Monitor
                                    </h1>
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                                        IoT v2.2
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span
                                        className={`w-2 h-2 rounded-full ${
                                            isDemoMode
                                                ? "bg-purple-400 animate-pulse"
                                                : deviceHealth.status === "ONLINE"
                                                ? "bg-emerald-400 animate-pulse"
                                                : deviceHealth.status === "STALE"
                                                ? "bg-amber-400"
                                                : "bg-rose-400"
                                        }`}
                                    ></span>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                                        {isDemoMode
                                            ? "Virtual ESP32 Simulator Active"
                                            : deviceHealth.status === "ONLINE"
                                            ? `ESP32 Live Stream (Ping: ${deviceHealth.pingMs}ms)`
                                            : deviceHealth.status === "STALE"
                                            ? `Telemetry Stale (${deviceHealth.lastPingAgoSec}s ago)`
                                            : "ESP32 Offline (Check Power)"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Settings Trigger */}
                        <button
                            type="button"
                            onClick={() => setIsConfigModalOpen(true)}
                            className="md:hidden p-2.5 rounded-2xl bg-slate-900 text-slate-300 border border-slate-800"
                        >
                            <Sliders size={18} />
                        </button>
                    </div>

                    {/* Right: Controls & Badges */}
                    <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto justify-end">
                        {/* Demo Mode Toggle */}
                        <button
                            type="button"
                            onClick={toggleDemoMode}
                            title="Toggle between Virtual ESP32 Simulator and Physical Hardware"
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border text-xs font-bold transition-all shadow-sm active:scale-95 ${
                                isDemoMode
                                    ? "bg-purple-950/70 text-purple-300 border-purple-500/40 shadow-purple-500/10 ring-2 ring-purple-500/20"
                                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
                            }`}
                        >
                            <Sparkles size={14} className={isDemoMode ? "text-purple-400" : "text-slate-500"} />
                            <span>{isDemoMode ? "Demo Sandbox: ON" : "Live Hardware: ON"}</span>
                        </button>

                        {/* Plant Presets Button */}
                        <button
                            type="button"
                            onClick={() => setIsConfigModalOpen(true)}
                            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-850 text-slate-200 px-3.5 py-1.5 rounded-2xl border border-slate-800 hover:border-slate-700 text-xs font-bold transition-all shadow-sm active:scale-95"
                        >
                            <Sliders size={14} className="text-emerald-400" />
                            <span className="hidden sm:inline text-slate-400">Specimen:</span>
                            <span className="text-emerald-300 font-extrabold">{currentPlantPreset.name}</span>
                        </button>

                        {/* Mode Toggle Button */}
                        <button
                            type="button"
                            onClick={toggleMode}
                            title="Switch between Closed-Loop Automation and Manual Actuator Override"
                            className="transform active:scale-95 transition-transform"
                        >
                            <SystemModeBadge mode={system.mode} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* Demo Mode Banner */}
                {isDemoMode && (
                    <div className="mb-6 p-4 rounded-3xl bg-purple-950/40 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-purple-200 shadow-xl shadow-purple-950/20">
                        <div className="flex items-center gap-2.5">
                            <Radio size={18} className="text-purple-400 shrink-0 animate-pulse" />
                            <div>
                                <span className="font-extrabold text-white">Portfolio Sandbox Active: </span>
                                Virtual ESP32 simulator is generating telemetry. All closed-loop hysteresis triggers, actuator timeouts, and manual controls operate without physical hardware.
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsConfigModalOpen(true)}
                            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] shrink-0 transition-colors self-start sm:self-auto border border-purple-400 shadow-md shadow-purple-600/30"
                        >
                            Calibrate Thresholds
                        </button>
                    </div>
                )}

                {/* Top Stat Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        title="Soil Moisture"
                        value={sensors.moisture ?? "--"}
                        unit="%"
                        type="moisture"
                        statusTag={moistureStatus.text}
                        statusColor={moistureStatus.color}
                        minLimit={thresholds.minMoisture}
                        maxLimit={thresholds.maxMoisture}
                    />
                    <StatCard
                        title="Ambient Temperature"
                        value={sensors.temperature ?? "--"}
                        unit="°C"
                        type="temperature"
                        statusTag={tempStatus.text}
                        statusColor={tempStatus.color}
                    />
                    <StatCard
                        title="Air Humidity"
                        value={sensors.humidity ?? "--"}
                        unit="%"
                        type="humidity"
                        statusTag={humidityStatus.text}
                        statusColor={humidityStatus.color}
                    />
                    <StatCard
                        title="Photoperiod Status"
                        value={getLightStatus()}
                        unit=""
                        type="light"
                        statusTag={actuators.growLight ? "Auxiliary Spectrum Active" : "Natural Ambient"}
                        statusColor={actuators.growLight ? "text-purple-300 bg-purple-500/10 border-purple-500/30" : "text-amber-300 bg-amber-500/10 border-amber-500/30"}
                    />
                </div>

                {/* Primary Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (2 cols): Recharts Area Chart & Event Log */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <div className="min-h-[420px]">
                            <SensorChart data={historyData} thresholds={thresholds} />
                        </div>

                        <div className="min-h-[350px]">
                            <EventLog logs={eventLogs} onClear={clearLogs} />
                        </div>
                    </div>

                    {/* Right Column (1 col): Actuators & Closed-Loop Pipeline */}
                    <div className="flex flex-col gap-6">
                        {/* Actuator Control Card */}
                        <ControlCard />

                        {/* Closed-Loop Pipeline Visual Flow */}
                        <div className="bg-slate-900/80 backdrop-blur-xl text-slate-300 p-6 rounded-3xl shadow-xl relative overflow-hidden border border-slate-800/80 group font-sans">
                            <div className="absolute top-0 right-0 w-44 h-44 bg-purple-500/10 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-purple-500/20 transition-all pointer-events-none"></div>

                            <div className="flex items-center justify-between mb-5 relative z-10">
                                <h3 className="text-white font-black flex items-center gap-2 text-xs uppercase tracking-widest">
                                    <Cpu size={16} className="text-purple-400" />
                                    Closed-Loop Logic Pipeline
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setIsConfigModalOpen(true)}
                                    className="text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                                >
                                    <Sliders size={12} /> Configure
                                </button>
                            </div>

                            <div className="flex flex-col gap-3 relative z-10 text-xs">
                                {/* Trigger Threshold Box */}
                                <div className="flex items-center justify-between bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            Trigger Limit
                                        </span>
                                        <span className="text-slate-400 text-[11px] font-medium">Auto-irrigate below</span>
                                    </div>
                                    <span className="font-mono text-orange-400 font-extrabold text-sm">
                                        &lt; {thresholds.minMoisture}%
                                    </span>
                                </div>

                                <div className="flex justify-center -my-2 text-slate-700">
                                    <ArrowRight size={14} className="rotate-90" />
                                </div>

                                {/* Valve Status & Safety Guard Box */}
                                <div
                                    className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${
                                        actuators.waterPump
                                            ? "bg-blue-950/60 border-blue-500/50"
                                            : "bg-slate-950/70 border-slate-800"
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Zap
                                            size={16}
                                            className={actuators.waterPump ? "text-blue-400 fill-blue-400 animate-pulse" : "text-slate-500"}
                                        />
                                        <div>
                                            <span
                                                className={`text-[10px] font-bold uppercase tracking-wider ${
                                                    actuators.waterPump ? "text-blue-200" : "text-slate-400"
                                                }`}
                                            >
                                                Pump Relay
                                            </span>
                                            <p className="text-[10px] text-slate-500 font-mono">
                                                {actuators.waterPump
                                                    ? `Running (${safetyState.remainingSafetySec || thresholds.maxPumpDurationSec}s left)`
                                                    : `Safety Timeout: ${thresholds.maxPumpDurationSec}s`}
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${
                                            actuators.waterPump
                                                ? "bg-blue-500 text-white border-blue-400"
                                                : "bg-slate-800 text-slate-400 border-slate-700"
                                        }`}
                                    >
                                        {actuators.waterPump ? "IRRIGATING" : "IDLE"}
                                    </span>
                                </div>

                                <div className="flex justify-center -my-2 text-slate-700">
                                    <ArrowRight size={14} className="rotate-90" />
                                </div>

                                {/* Target Cut-Off Point Box */}
                                <div className="flex items-center justify-between bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            Cut-Off Target
                                        </span>
                                        <span className="text-slate-400 text-[11px] font-medium">Halt irrigation at</span>
                                    </div>
                                    <span className="text-sky-400 font-mono font-extrabold text-sm">
                                        &gt;= {thresholds.maxMoisture}%
                                    </span>
                                </div>
                            </div>

                            {/* Cooldown Safety Footer */}
                            <div className="mt-4 pt-3.5 border-t border-slate-800 flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                                <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                                <span>
                                    Hardware Cooldown: <strong className="text-slate-300 font-mono">{thresholds.cooldownMinutes}m</strong> soak window.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Plant Configuration Modal */}
            <PlantConfigModal
                key={`${thresholds.plantProfileId}-${isConfigModalOpen}`}
                isOpen={isConfigModalOpen}
                onClose={() => setIsConfigModalOpen(false)}
                thresholds={thresholds}
                onSave={updateThresholds}
            />

            {/* Mission-Control Footer */}
            <footer className="max-w-7xl mx-auto px-4 sm:px-6 mt-16 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium font-sans">
                <div>
                    <span className="font-bold text-slate-400">IoT-Based Smart Indoor Plant Control System</span> — Capstone Project
                </div>
                <div className="flex items-center gap-5">
                    <a
                        href="https://github.com/ulas-dursun"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
                    >
                        <Github size={15} />
                        <span>ulas-dursun</span>
                    </a>
                    <a
                        href="https://www.linkedin.com/in/ulas-dursun"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-slate-400 hover:text-sky-400 transition-colors"
                    >
                        <Linkedin size={15} />
                        <span>Ulaş Dursun</span>
                    </a>
                </div>
            </footer>
        </div>
    );
}

export default function App() {
    return (
        <PlantProvider>
            <DashboardContent />
        </PlantProvider>
    );
}