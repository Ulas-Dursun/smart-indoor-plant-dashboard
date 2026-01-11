import React, { useEffect } from "react";
import { ref, update } from "firebase/database";
import { database } from "./firebase";
import StatCard from "./components/StatCard";
import SensorChart from "./components/SensorChart";
import ControlCard from "./components/ControlCard";
import SystemModeBadge from "./components/SystemModeBadge";
import useFirebaseValue from "./hooks/useFirebaseValue";
import { Power, Cpu, ArrowRight, Zap } from "lucide-react";

function App() {
    // 1. GERÇEK VERİLERİ DİNLE
    const sensors = useFirebaseValue("sensors");
    const actuators = useFirebaseValue("actuators");
    const system = useFirebaseValue("system");
    const historyData = useFirebaseValue("history/moisture");

    // 2. Grafik Verisi
    const chartData = historyData
        ? Object.entries(historyData).map(([, val]) => ({ time: val.time, value: val.value })).slice(-20)
        : [];

    // --- OTOMASYON MOTORU ---
    useEffect(() => {
        if (system?.enabled === false || !sensors) return;

        if (system?.mode === 'AUTO') {
            const currentMoisture = sensors.moisture;
            // Nem 35'ten küçükse pompala
            if (currentMoisture < 35 && !actuators?.waterPump) {
                update(ref(database, 'actuators'), { waterPump: true });
            }
            else if (currentMoisture >= 35 && actuators?.waterPump) {
                update(ref(database, 'actuators'), { waterPump: false });
            }
        }
    }, [sensors?.moisture, system?.mode, system?.enabled, actuators?.waterPump]);

    // Işık Verisini "Sayı"dan "Kelime"ye Çevirme Mantığı
    // Eğer sensörden 1 gelirse "Bright" (Aydınlık), 0 gelirse "Dark" (Karanlık)
    // Batuhan'ın 1 mi yoksa 0 mı gönderdiğine göre burayı tersine çevirebiliriz.
    // Şimdilik Varsayım: 1 = Işık Var, 0 = Işık Yok.
    const getLightStatus = () => {
        if (!sensors) return "--";
        // Gelen veri 1 ise veya true ise
        return sensors.light ? "Bright" : "Dark";
    };

    const toggleMode = () => {
        if (!system?.enabled) return;
        const newMode = system?.mode === 'AUTO' ? 'MANUAL' : 'AUTO';
        update(ref(database, 'system'), { mode: newMode });
    };

    const toggleSystemPower = () => {
        const newState = !system?.enabled;
        update(ref(database, 'system'), { enabled: newState });
        if (newState === false) update(ref(database, 'actuators'), { waterPump: false });
    };

    // OFFLINE EKRANI
    if (system?.enabled === false) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
                <div className="p-6 rounded-full bg-slate-800 mb-6 relative">
                    <Power size={64} className="text-red-500" />
                </div>
                <h1 className="text-3xl font-bold mb-2">SYSTEM DISABLED</h1>
                <p className="text-slate-400 mb-8">Master switch is OFF.</p>
                <button
                    onClick={toggleSystemPower}
                    className="bg-emerald-500 hover:bg-emerald-400 px-10 py-4 rounded-full font-bold transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2"
                >
                    <Power size={20} /> POWER ON SYSTEM
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 font-sans text-slate-800">
            {/* HEADER */}
            <header className="flex flex-col md:flex-row justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleSystemPower}
                        className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 hover:border-red-200 hover:text-red-500 transition-colors group"
                    >
                        <Power size={20} className="text-slate-400 group-hover:text-red-500" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Smart Plant Monitor</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`w-2 h-2 rounded-full ${sensors ? 'bg-emerald-500 animate-pulse' : 'bg-orange-400'}`}></span>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                {sensors ? "Live Connection" : "Waiting for Data..."}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6 mt-6 md:mt-0 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100">
                    <div className="text-right hidden md:block">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Operation Mode</p>
                    </div>
                    <button onClick={toggleMode} className="transform active:scale-95 transition-transform">
                        <SystemModeBadge mode={system?.mode} />
                    </button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Soil Moisture" value={sensors?.moisture ?? "--"} unit="%" type="moisture" />
                    <StatCard title="Temperature" value={sensors?.temperature ?? "--"} unit="°C" type="temperature" />
                    <StatCard title="Air Humidity" value={sensors?.humidity ?? "--"} unit="%" type="default" />

                    {/* GÜNCELLENEN KISIM: Işık Kartı */}
                    {/* Artık sayı değil, Bright/Dark yazısı ve boş unit gönderiyoruz */}
                    <StatCard
                        title="Light Status"
                        value={getLightStatus()}
                        unit=""
                        type="light"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white rounded-[2rem] p-2 shadow-sm border border-slate-100">
                        <SensorChart title="Real-time Moisture Analysis" data={chartData} dataKey="value" />
                    </div>

                    <div className="flex flex-col gap-6">
                        <ControlCard />

                        <div className="bg-slate-900 text-slate-300 p-6 rounded-3xl shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-purple-500/20 transition-all"></div>

                            <h3 className="text-white font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-widest">
                                <Cpu size={18} className="text-purple-400" />
                                System Logic
                            </h3>

                            <div className="flex flex-col gap-4 relative z-10">
                                <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                                        <span className="text-xs font-medium text-slate-400">IF MOISTURE</span>
                                    </div>
                                    <span className="font-mono text-orange-300 text-sm">&lt; 35%</span>
                                </div>
                                <div className="flex justify-center -my-2">
                                    <ArrowRight size={16} className="text-slate-600 rotate-90" />
                                </div>
                                <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${actuators?.waterPump ? "bg-emerald-500/20 border-emerald-500/50" : "bg-slate-800/50 border-slate-700"}`}>
                                    <div className="flex items-center gap-3">
                                        <Zap size={14} className={actuators?.waterPump ? "text-emerald-400 fill-emerald-400" : "text-slate-500"} />
                                        <span className={`text-xs font-medium ${actuators?.waterPump ? "text-emerald-100" : "text-slate-400"}`}>ACTIVATE PUMP</span>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${actuators?.waterPump ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-500"}`}>{actuators?.waterPump ? "ON" : "OFF"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;