import React from "react";
import { usePlant } from "../context/usePlant";
import { Droplet, Power, Wind, Lightbulb, ShieldAlert, Timer, Waves } from "lucide-react";

export default function ControlCard() {
    const {
        actuators,
        toggleActuator,
        system,
        safetyState,
        thresholds
    } = usePlant();

    const isDisabled = !system.enabled;
    const isPumpRunning = actuators.waterPump;
    const isCooldownActive = safetyState.cooldownRemainingSec > 0;

    const formatCooldown = (totalSec) => {
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
    };

    return (
        <div className="flex flex-col gap-5 h-full font-sans">
            {/* Primary Irrigation Pump Control */}
            <div
                className={`relative overflow-hidden rounded-3xl p-6 transition-all duration-500 border ${
                    isPumpRunning
                        ? "bg-gradient-to-br from-blue-900/90 via-blue-950 to-indigo-950 border-blue-500/50 shadow-2xl shadow-blue-500/20"
                        : "bg-slate-900/80 backdrop-blur-xl border-slate-800/80 shadow-xl hover:border-slate-700/80"
                }`}
            >
                {/* Visual pulse glow when irrigating */}
                {isPumpRunning && (
                    <div className="absolute -right-8 -top-8 w-44 h-44 bg-blue-500/20 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
                )}

                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                Primary Actuator
                            </span>
                            {isPumpRunning ? (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 animate-pulse">
                                    <Waves size={11} /> Flowing
                                </span>
                            ) : (
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                                    Standby
                                </span>
                            )}
                        </div>
                        <h3 className="text-xl font-black text-white tracking-tight mt-2">
                            Submersible Water Pump
                        </h3>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                            {isDisabled
                                ? "System locked via Master Power Switch"
                                : isCooldownActive
                                ? `Substrate absorption cooldown (${formatCooldown(safetyState.cooldownRemainingSec)})`
                                : isPumpRunning
                                ? "Active closed-loop irrigation pulse"
                                : "Awaiting moisture threshold trigger"}
                        </p>
                    </div>

                    <div
                        className={`p-3.5 rounded-2xl border transition-all duration-500 ${
                            isPumpRunning
                                ? "bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-500/40 scale-110"
                                : "bg-slate-800/80 text-blue-400 border-slate-700/80"
                        }`}
                    >
                        <Droplet size={26} className={isPumpRunning ? "animate-bounce" : ""} />
                    </div>
                </div>

                {/* Safety Countdown Monitor (Visible while irrigating) */}
                {isPumpRunning && safetyState.remainingSafetySec !== null && (
                    <div className="my-4 p-3 rounded-2xl bg-slate-950/70 border border-blue-500/30 backdrop-blur-md relative z-10">
                        <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                            <span className="flex items-center gap-1.5 text-blue-200">
                                <ShieldAlert size={14} className="text-amber-400" />
                                Continuous Run Safety Guard
                            </span>
                            <span className="font-mono text-amber-300 font-bold">
                                {safetyState.remainingSafetySec}s remaining
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-400 to-amber-400 transition-all duration-500 rounded-full"
                                style={{
                                    width: `${(safetyState.remainingSafetySec / thresholds.maxPumpDurationSec) * 100}%`
                                }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Cooldown Active Banner */}
                {!isPumpRunning && isCooldownActive && (
                    <div className="my-3.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-between text-xs relative z-10">
                        <span className="flex items-center gap-1.5 font-bold">
                            <Timer size={14} className="text-amber-400" />
                            Soil Absorption Pause:
                        </span>
                        <span className="font-mono font-extrabold">{formatCooldown(safetyState.cooldownRemainingSec)}</span>
                    </div>
                )}

                {/* Big Action Button */}
                <button
                    type="button"
                    onClick={() => toggleActuator("waterPump")}
                    disabled={isDisabled}
                    className={`mt-4 w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all transform active:scale-95 relative z-10 ${
                        isDisabled
                            ? "bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed"
                            : isPumpRunning
                            ? "bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/30 border border-rose-400"
                            : "bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30 border border-blue-400"
                    }`}
                >
                    <Power size={16} strokeWidth={2.5} />
                    {isDisabled
                        ? "ACTUATOR LOCKED"
                        : isPumpRunning
                        ? "HALT IRRIGATION NOW"
                        : "MANUAL OVERRIDE: IRRIGATE"}
                </button>
            </div>

            {/* Auxiliary Actuators Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Cooling Fan Card */}
                <div
                    className={`p-4 rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
                        actuators.fan
                            ? "bg-emerald-950/60 border-emerald-500/40 shadow-lg shadow-emerald-500/10"
                            : "bg-slate-900/80 backdrop-blur-xl border-slate-800/80"
                    }`}
                >
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className={`p-2 rounded-xl ${actuators.fan ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"}`}>
                                <Wind size={20} className={actuators.fan ? "animate-spin" : ""} />
                            </div>
                            <span
                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                    actuators.fan
                                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                        : "bg-slate-800 text-slate-500 border-slate-700"
                                }`}
                            >
                                {actuators.fan ? "ACTIVE" : "OFF"}
                            </span>
                        </div>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            Circulation
                        </p>
                        <p className="text-sm font-extrabold text-white mt-0.5">
                            Cooling Fan
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => toggleActuator("fan")}
                        disabled={isDisabled}
                        className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border ${
                            actuators.fan
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-600/20"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                        }`}
                    >
                        {actuators.fan ? "Turn Off" : "Turn On"}
                    </button>
                </div>

                {/* Grow Light Card */}
                <div
                    className={`p-4 rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
                        actuators.growLight
                            ? "bg-purple-950/60 border-purple-500/40 shadow-lg shadow-purple-500/10"
                            : "bg-slate-900/80 backdrop-blur-xl border-slate-800/80"
                    }`}
                >
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className={`p-2 rounded-xl ${actuators.growLight ? "bg-purple-500/20 text-purple-400" : "bg-slate-800 text-slate-400"}`}>
                                <Lightbulb size={20} className={actuators.growLight ? "animate-pulse" : ""} />
                            </div>
                            <span
                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                    actuators.growLight
                                        ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                                        : "bg-slate-800 text-slate-500 border-slate-700"
                                }`}
                            >
                                {actuators.growLight ? "ACTIVE" : "OFF"}
                            </span>
                        </div>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            Auxiliary
                        </p>
                        <p className="text-sm font-extrabold text-white mt-0.5">
                            Grow Light
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => toggleActuator("growLight")}
                        disabled={isDisabled}
                        className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border ${
                            actuators.growLight
                                ? "bg-purple-600 hover:bg-purple-500 text-white border-purple-400 shadow-md shadow-purple-600/20"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                        }`}
                    >
                        {actuators.growLight ? "Turn Off" : "Turn On"}
                    </button>
                </div>
            </div>
        </div>
    );
}