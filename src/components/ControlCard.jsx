import { ref, set } from "firebase/database";
import { database } from "../firebase";
import useFirebaseValue from "../hooks/useFirebaseValue";
import { Droplet, Power, Wind, Lightbulb } from "lucide-react";

function ControlCard() {
    const pumpStatus = useFirebaseValue("actuators/waterPump");
    const system = useFirebaseValue("system");
    const fanStatus = useFirebaseValue("status/fan");
    const ledStatus = useFirebaseValue("status/led");

    const isDisabled = system?.enabled === false;

    const togglePump = () => {
        if (isDisabled) return;
        set(ref(database, "actuators/waterPump"), !pumpStatus);
    };

    return (
        <div className="flex flex-col gap-5 h-full">
            {/* Main pump control */}
            <div className={`relative overflow-hidden rounded-[2.5rem] p-8 transition-all duration-500 flex-1 flex flex-col justify-between border ${
                pumpStatus
                    ? "bg-gradient-to-br from-blue-600 to-blue-700 border-blue-400 shadow-[0_20px_50px_rgba(37,99,235,0.3)]"
                    : "bg-white/80 backdrop-blur-md border-white/50 shadow-xl shadow-slate-200/50"
            }`}>

                {pumpStatus && (
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/20 rounded-full blur-2xl animate-pulse"></div>
                )}

                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <h3 className={`text-xl font-extrabold tracking-tight ${pumpStatus ? "text-white" : "text-slate-800"}`}>
                            Water Pump
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`w-2 h-2 rounded-full ${pumpStatus ? "bg-blue-200 animate-ping" : "bg-slate-300"}`}></span>
                            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${pumpStatus ? "text-blue-100" : "text-slate-400"}`}>
                                {pumpStatus ? "Irrigation Active" : "Standby Mode"}
                            </p>
                        </div>
                    </div>
                    <div className={`p-4 rounded-2xl transition-transform duration-500 ${pumpStatus ? "bg-white/20 text-white scale-110 shadow-lg" : "bg-blue-50 text-blue-500"}`}>
                        <Droplet size={28} className={pumpStatus ? "animate-bounce" : ""} />
                    </div>
                </div>

                <button
                    onClick={togglePump}
                    disabled={isDisabled}
                    className={`mt-8 w-full py-4 rounded-2xl font-black text-xs tracking-[0.15em] flex items-center justify-center gap-3 transition-all transform active:scale-95 ${
                        isDisabled
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : pumpStatus
                                ? "bg-white text-blue-600 hover:shadow-2xl shadow-blue-900/20"
                                : "bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-900/20"
                    }`}
                >
                    <Power size={18} strokeWidth={3} />
                    {isDisabled ? "SYSTEM LOCKED" : pumpStatus ? "STOP IRRIGATION" : "START IRRIGATION"}
                </button>
            </div>


            <div className="grid grid-cols-2 gap-4">
                <div className={`p-5 rounded-[2rem] border transition-all duration-300 ${
                    fanStatus ? "bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-200" : "bg-white/80 backdrop-blur-sm border-white/50 shadow-md"
                }`}>
                    <Wind size={20} className={`${fanStatus ? "animate-spin" : "text-slate-400"} mb-3`} />
                    <p className={`text-[9px] font-black uppercase tracking-widest ${fanStatus ? "text-emerald-100" : "text-slate-400"}`}>Cooling</p>
                    <p className="text-sm font-bold">{fanStatus ? "RUNNING" : "OFF"}</p>
                </div>

                <div className={`p-5 rounded-[2rem] border transition-all duration-300 ${
                    ledStatus ? "bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-200" : "bg-white/80 backdrop-blur-sm border-white/50 shadow-md"
                }`}>
                    <Lightbulb size={20} className={`${ledStatus ? "animate-pulse" : "text-slate-400"} mb-3`} />
                    <p className={`text-[9px] font-black uppercase tracking-widest ${ledStatus ? "text-purple-100" : "text-slate-400"}`}>Grow Light</p>
                    <p className="text-sm font-bold">{ledStatus ? "ACTIVE" : "OFF"}</p>
                </div>
            </div>
        </div>
    );
}

export default ControlCard;