import { ref, set } from "firebase/database";
import { database } from "../firebase";
import useFirebaseValue from "../hooks/useFirebaseValue";
import { Droplet, Power } from "lucide-react";

function ControlCard() {
    const pumpStatus = useFirebaseValue("actuators/waterPump");
    const system = useFirebaseValue("system");

    // Sistem kapalıysa buton pasif olsun
    const isDisabled = system?.enabled === false;

    const togglePump = () => {
        if (isDisabled) return;
        set(ref(database, "actuators/waterPump"), !pumpStatus);
    };

    return (
        <div className={`relative overflow-hidden rounded-3xl p-6 shadow-lg border transition-all duration-300 ${
            pumpStatus
                ? "bg-blue-600 border-blue-500 shadow-blue-200"
                : "bg-white border-slate-100 shadow-sm"
        }`}>
            {/* Arka plan efekti (Sadece aktifken görünür) */}
            {pumpStatus && (
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-400 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
            )}

            <div className="flex justify-between items-start mb-8">
                <div>
                    <h3 className={`text-lg font-bold ${pumpStatus ? "text-white" : "text-slate-800"}`}>
                        Water Pump
                    </h3>
                    <p className={`text-xs font-medium mt-1 ${pumpStatus ? "text-blue-100" : "text-slate-400"}`}>
                        {pumpStatus ? "IRRIGATION ACTIVE" : "SYSTEM STANDBY"}
                    </p>
                </div>
                <div className={`p-3 rounded-full ${pumpStatus ? "bg-white/20 text-white" : "bg-blue-50 text-blue-500"}`}>
                    <Droplet size={24} className={pumpStatus ? "animate-bounce" : ""} />
                </div>
            </div>

            <button
                onClick={togglePump}
                disabled={isDisabled}
                className={`w-full py-4 rounded-xl font-bold text-sm tracking-wider flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
                    isDisabled
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : pumpStatus
                            ? "bg-white text-blue-600 hover:bg-blue-50"
                            : "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200"
                }`}
            >
                <Power size={18} />
                {isDisabled
                    ? "DISABLED"
                    : pumpStatus ? "STOP PUMP" : "START PUMP"
                }
            </button>
        </div>
    );
}

export default ControlCard;