import React, { useState } from "react";
import { X, Sliders, ShieldAlert, Sprout, Check, Info } from "lucide-react";
import { PLANT_PRESETS } from "../constants/plantPresets";

export default function PlantConfigModal({ isOpen, onClose, thresholds, onSave }) {
    const [selectedProfile, setSelectedProfile] = useState(thresholds.plantProfileId || "monstera");
    const [minMoisture, setMinMoisture] = useState(thresholds.minMoisture || 35);
    const [maxMoisture, setMaxMoisture] = useState(thresholds.maxMoisture || 50);
    const [maxDuration, setMaxDuration] = useState(thresholds.maxPumpDurationSec || 8);
    const [cooldown, setCooldown] = useState(thresholds.cooldownMinutes || 5);

    if (!isOpen) return null;

    const handleSelectPreset = (preset) => {
        setSelectedProfile(preset.id);
        setMinMoisture(preset.minMoisture);
        setMaxMoisture(preset.maxMoisture);
        setMaxDuration(preset.maxPumpDurationSec);
        setCooldown(preset.cooldownMinutes);
    };

    const handleMinChange = (e) => {
        const val = Number(e.target.value);
        setMinMoisture(val);
        if (val >= maxMoisture) {
            setMaxMoisture(val + 5);
        }
        setSelectedProfile("custom");
    };

    const handleMaxChange = (e) => {
        const val = Number(e.target.value);
        setMaxMoisture(val);
        if (val <= minMoisture) {
            setMinMoisture(Math.max(5, val - 5));
        }
        setSelectedProfile("custom");
    };

    const handleSave = () => {
        onSave({
            plantProfileId: selectedProfile,
            minMoisture,
            maxMoisture,
            maxPumpDurationSec: maxDuration,
            cooldownMinutes: cooldown
        });
        onClose();
    };

    const currentPresetObj = PLANT_PRESETS.find(p => p.id === selectedProfile) || PLANT_PRESETS[4];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
            <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Sprout size={22} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white">Agronomic Parameters & Plant Presets</h2>
                            <p className="text-xs text-slate-400 font-medium">Fine-tune closed-loop moisture hysteresis and actuator safety guards</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Presets List */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 block">
                            Botanical Specimen Presets
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {PLANT_PRESETS.map((p) => {
                                const isSelected = selectedProfile === p.id;
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => handleSelectPreset(p)}
                                        className={`text-left p-3 rounded-2xl border transition-all relative ${
                                            isSelected
                                                ? "border-emerald-500 bg-emerald-950/40 shadow-md ring-2 ring-emerald-500/30"
                                                : "border-slate-800 hover:border-slate-700 bg-slate-950/60"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <p className="text-xs font-bold text-white line-clamp-1">{p.name}</p>
                                            {isSelected && <Check size={14} className="text-emerald-400 shrink-0" />}
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium mt-0.5 line-clamp-1">{p.category}</p>
                                        <div className="mt-2 text-[10px] font-mono text-emerald-300 font-semibold bg-emerald-950 border border-emerald-800/80 px-2 py-0.5 rounded-md inline-block">
                                            {p.minMoisture}% - {p.maxMoisture}%
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Active Profile Info Box */}
                    <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
                        <Info size={18} className="text-sky-400 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold text-white">{currentPresetObj.name}: </span>
                            {currentPresetObj.description}
                        </div>
                    </div>

                    {/* Sliders: Hysteresis Thresholds */}
                    <div className="space-y-5 bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                <Sliders size={14} className="text-sky-400" />
                                Moisture Hysteresis Band
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-400">
                                Trigger: <strong className="text-orange-400">{minMoisture}%</strong> | Cutoff: <strong className="text-sky-400">{maxMoisture}%</strong>
                            </span>
                        </div>

                        {/* Interactive Visual Gauge */}
                        <div className="relative pt-2 pb-1">
                            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                                <div style={{ width: `${minMoisture}%` }} className="bg-rose-500/80 h-full"></div>
                                <div style={{ width: `${maxMoisture - minMoisture}%` }} className="bg-emerald-500/80 h-full"></div>
                                <div style={{ width: `${100 - maxMoisture}%` }} className="bg-sky-500/80 h-full"></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1.5">
                                <span>0% (Arid)</span>
                                <span className="text-rose-400">Trigger &lt; {minMoisture}%</span>
                                <span className="text-emerald-400">Optimal Range</span>
                                <span className="text-sky-400">Cutoff &gt; {maxMoisture}%</span>
                                <span>100%</span>
                            </div>
                        </div>

                        {/* Min Moisture Slider */}
                        <div>
                            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                                <span>Trigger Threshold (Start Irrigation)</span>
                                <span className="font-mono font-bold text-orange-400">{minMoisture}%</span>
                            </div>
                            <input
                                type="range"
                                min="5"
                                max="80"
                                value={minMoisture}
                                onChange={handleMinChange}
                                className="w-full accent-orange-500 cursor-pointer bg-slate-800"
                            />
                        </div>

                        {/* Max Moisture Slider */}
                        <div>
                            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                                <span>Cut-Off Target (Stop Irrigation)</span>
                                <span className="font-mono font-bold text-sky-400">{maxMoisture}%</span>
                            </div>
                            <input
                                type="range"
                                min="15"
                                max="95"
                                value={maxMoisture}
                                onChange={handleMaxChange}
                                className="w-full accent-sky-500 cursor-pointer bg-slate-800"
                            />
                        </div>
                    </div>

                    {/* Actuator Safety Guard Controls */}
                    <div className="space-y-4 bg-amber-950/20 p-5 rounded-2xl border border-amber-500/30">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                            <ShieldAlert size={16} className="text-amber-400" />
                            Hardware Safety Protocol
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                                    <span>Max Run Timeout</span>
                                    <span className="font-mono font-bold text-amber-300">{maxDuration} sec</span>
                                </div>
                                <input
                                    type="range"
                                    min="3"
                                    max="30"
                                    value={maxDuration}
                                    onChange={(e) => setMaxDuration(Number(e.target.value))}
                                    className="w-full accent-amber-500 cursor-pointer bg-slate-800"
                                />
                                <p className="text-[10px] text-slate-500 mt-1">Stops motor if sensor fails to reflect absorption</p>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                                    <span>Safety Cooldown</span>
                                    <span className="font-mono font-bold text-amber-300">{cooldown} min</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="20"
                                    value={cooldown}
                                    onChange={(e) => setCooldown(Number(e.target.value))}
                                    className="w-full accent-amber-500 cursor-pointer bg-slate-800"
                                />
                                <p className="text-[10px] text-slate-500 mt-1">Guarantees soil absorption time between cycles</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/60">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Check size={16} />
                        Apply Parameters
                    </button>
                </div>
            </div>
        </div>
    );
}
