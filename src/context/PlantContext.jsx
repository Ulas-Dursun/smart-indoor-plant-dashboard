import React, { useState, useEffect, useRef, useCallback } from "react";
import { ref, onValue, set, update } from "firebase/database";
import { database } from "../firebase";
import { PLANT_PRESETS, DEFAULT_THRESHOLDS } from "../constants/plantPresets";
import { SensorDataSchema, ThresholdSettingsSchema } from "../types/schemas";
import { PlantContext } from "./context";

const STORAGE_KEYS = {
    DEMO_MODE: "sip_demo_mode",
    THRESHOLDS: "sip_thresholds",
    LOGS: "sip_logs",
    HISTORY: "sip_history"
};

export function PlantProvider({ children }) {
    // 1. Core State
    const [isDemoMode, setIsDemoMode] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.DEMO_MODE);
        return saved !== null ? JSON.parse(saved) : true;
    });

    const [system, setSystem] = useState({
        enabled: true,
        mode: "AUTO"
    });

    const [sensors, setSensors] = useState({
        moisture: 33.2,
        temperature: 24.1,
        humidity: 52.4,
        light: 1,
        lastUpdated: new Date().toLocaleTimeString()
    });

    const [actuators, setActuators] = useState({
        waterPump: false,
        fan: false,
        growLight: false
    });

    const [thresholds, setThresholds] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.THRESHOLDS);
        if (saved) {
            try {
                return ThresholdSettingsSchema.parse(JSON.parse(saved));
            } catch {
                return DEFAULT_THRESHOLDS;
            }
        }
        return DEFAULT_THRESHOLDS;
    });

    const [eventLogs, setEventLogs] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return [];
            }
        }
        return [
            {
                id: "init-1",
                timestamp: new Date().toLocaleTimeString(),
                type: "info",
                category: "SYSTEM",
                message: "Smart Indoor Plant System initialized in Closed-Loop Automation Mode."
            }
        ];
    });

    const [historyData, setHistoryData] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return [];
            }
        }
        const initial = [];
        const now = Date.now();
        for (let i = 20; i >= 0; i--) {
            const time = new Date(now - i * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            initial.push({
                time,
                moisture: Number((32 + Math.sin(i / 3) * 3 + (20 - i) * 0.1).toFixed(1)),
                temperature: Number((23.8 + Math.cos(i / 4) * 0.5).toFixed(1)),
                humidity: Number((50 + Math.sin(i / 5) * 4).toFixed(1))
            });
        }
        return initial;
    });

    const [deviceHealth, setDeviceHealth] = useState({
        status: isDemoMode ? "SIMULATED" : "ONLINE",
        lastPingAgoSec: 0,
        pingMs: 380
    });

    const [safetyState, setSafetyState] = useState({
        pumpActiveSince: null,
        remainingSafetySec: null,
        cooldownRemainingSec: 0
    });

    // Refs for controllers & intervals
    const pumpTimerRef = useRef(null);
    const pumpActiveTimestampRef = useRef(null);
    const cooldownIntervalRef = useRef(null);

    // Latest state refs to allow periodic control loops without stale closures
    const stateRef = useRef({
        system,
        sensors,
        actuators,
        thresholds,
        isDemoMode,
        safetyState
    });

    useEffect(() => {
        stateRef.current = {
            system,
            sensors,
            actuators,
            thresholds,
            isDemoMode,
            safetyState
        };
    }, [system, sensors, actuators, thresholds, isDemoMode, safetyState]);

    // Helper: Add log event
    const addLogEvent = useCallback((type, category, message) => {
        const newLog = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            timestamp: new Date().toLocaleTimeString(),
            type,
            category,
            message
        };
        setEventLogs(prev => {
            const updated = [newLog, ...prev.slice(0, 49)];
            localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updated));
            return updated;
        });
    }, []);

    // Thresholds Updater
    const updateThresholds = useCallback((newSettings) => {
        const validated = ThresholdSettingsSchema.parse(newSettings);
        setThresholds(validated);
        localStorage.setItem(STORAGE_KEYS.THRESHOLDS, JSON.stringify(validated));
        addLogEvent(
            "info",
            "SYSTEM",
            `Agronomic parameters updated: Min Moisture ${validated.minMoisture}%, Cutoff ${validated.maxMoisture}%, Safety Timeout ${validated.maxPumpDurationSec}s.`
        );

        if (!stateRef.current.isDemoMode) {
            update(ref(database, "system/thresholds"), validated).catch(() => {});
        }
    }, [addLogEvent]);

    const selectPlantProfile = useCallback((profileId) => {
        const preset = PLANT_PRESETS.find(p => p.id === profileId);
        if (preset) {
            updateThresholds({
                plantProfileId: preset.id,
                minMoisture: preset.minMoisture,
                maxMoisture: preset.maxMoisture,
                maxPumpDurationSec: preset.maxPumpDurationSec,
                cooldownMinutes: preset.cooldownMinutes
            });
            addLogEvent("success", "SYSTEM", `Botanical Profile applied: ${preset.name} (${preset.category}).`);
        }
    }, [updateThresholds, addLogEvent]);

    // Actuator Control
    const toggleActuator = useCallback((actuatorName, forceValue = null) => {
        const currentSystem = stateRef.current.system;
        const currentDemo = stateRef.current.isDemoMode;

        if (!currentSystem.enabled && actuatorName === "waterPump" && forceValue !== false) {
            addLogEvent("warning", "SAFETY", "Cannot activate pump: Master Power Switch is OFF.");
            return;
        }

        setActuators(prev => {
            const nextVal = forceValue !== null ? forceValue : !prev[actuatorName];
            const updated = { ...prev, [actuatorName]: nextVal };

            if (!currentDemo) {
                if (actuatorName === "waterPump") {
                    set(ref(database, "actuators/waterPump"), nextVal).catch(() => {});
                } else if (actuatorName === "fan") {
                    set(ref(database, "status/fan"), nextVal).catch(() => {});
                } else if (actuatorName === "growLight") {
                    set(ref(database, "status/led"), nextVal).catch(() => {});
                }
            }

            const labelMap = { waterPump: "Irrigation Pump", fan: "Cooling Fan", growLight: "Grow Light" };
            addLogEvent(
                nextVal ? "success" : "info",
                actuatorName === "waterPump" ? "PUMP" : "ENVIRONMENT",
                `${labelMap[actuatorName]} ${nextVal ? "ACTIVATED" : "DEACTIVATED"} manually.`
            );

            return updated;
        });
    }, [addLogEvent]);

    // Master Power toggle
    const toggleSystemPower = useCallback(() => {
        const nextState = !stateRef.current.system.enabled;
        setSystem(prev => ({ ...prev, enabled: nextState }));

        if (!nextState) {
            toggleActuator("waterPump", false);
            toggleActuator("fan", false);
            toggleActuator("growLight", false);
            addLogEvent("danger", "SAFETY", "EMERGENCY SHUTDOWN: Master switch flipped to OFF. All actuators stopped.");
        } else {
            addLogEvent("success", "SYSTEM", "Master system power restored. Telemetry and controllers active.");
        }

        if (!stateRef.current.isDemoMode) {
            update(ref(database, "system"), { enabled: nextState }).catch(() => {});
        }
    }, [toggleActuator, addLogEvent]);

    // Mode Toggle (AUTO vs MANUAL)
    const setOperationMode = useCallback((mode) => {
        setSystem(prev => ({ ...prev, mode }));
        addLogEvent("info", "AUTO", `Control Mode changed to: ${mode}.`);
        if (!stateRef.current.isDemoMode) {
            update(ref(database, "system"), { mode }).catch(() => {});
        }
    }, [addLogEvent]);

    // Demo Mode Toggle
    const toggleDemoMode = useCallback(() => {
        setIsDemoMode(prev => {
            const next = !prev;
            localStorage.setItem(STORAGE_KEYS.DEMO_MODE, JSON.stringify(next));
            setDeviceHealth({
                status: next ? "SIMULATED" : "ONLINE",
                lastPingAgoSec: 0,
                pingMs: next ? 240 : 480
            });
            addLogEvent(
                "info",
                "SYSTEM",
                next
                    ? "Demo Simulator Active: Simulating virtual ESP32 sensor fluctuations."
                    : "Live Firebase Mode Active: Synchronizing directly with physical hardware."
            );
            return next;
        });
    }, [addLogEvent]);

    // 4. Pump Safety Timeout Guard
    useEffect(() => {
        if (actuators.waterPump) {
            pumpActiveTimestampRef.current = Date.now();

            const interval = setInterval(() => {
                if (!pumpActiveTimestampRef.current) return;
                const elapsedSec = (Date.now() - pumpActiveTimestampRef.current) / 1000;
                const maxSec = stateRef.current.thresholds.maxPumpDurationSec;
                const remaining = Math.max(0, Math.ceil(maxSec - elapsedSec));

                setSafetyState(prev => ({
                    ...prev,
                    pumpActiveSince: pumpActiveTimestampRef.current,
                    remainingSafetySec: remaining
                }));

                // SAFETY TIMEOUT TRIGGER
                if (elapsedSec >= maxSec) {
                    clearInterval(interval);
                    toggleActuator("waterPump", false);
                    pumpActiveTimestampRef.current = null;

                    const cooldownSec = stateRef.current.thresholds.cooldownMinutes * 60;
                    setSafetyState(prev => ({
                        ...prev,
                        pumpActiveSince: null,
                        remainingSafetySec: null,
                        cooldownRemainingSec: cooldownSec
                    }));

                    addLogEvent(
                        "warning",
                        "SAFETY",
                        `Safety Guard Intercepted: Pump reached maximum continuous run threshold (${maxSec}s). Shutoff enforced.`
                    );
                }
            }, 500);

            pumpTimerRef.current = interval;
            return () => clearInterval(interval);
        } else {
            if (pumpTimerRef.current) clearInterval(pumpTimerRef.current);
            pumpActiveTimestampRef.current = null;
        }
    }, [actuators.waterPump, toggleActuator, addLogEvent]);

    // Cooldown ticker
    useEffect(() => {
        if (safetyState.cooldownRemainingSec > 0) {
            cooldownIntervalRef.current = setInterval(() => {
                setSafetyState(prev => {
                    const next = prev.cooldownRemainingSec - 1;
                    if (next <= 0) {
                        clearInterval(cooldownIntervalRef.current);
                        addLogEvent("info", "SAFETY", "Safety Cooldown expired. Automated irrigation ready.");
                        return { ...prev, cooldownRemainingSec: 0 };
                    }
                    return { ...prev, cooldownRemainingSec: next };
                });
            }, 1000);
            return () => clearInterval(cooldownIntervalRef.current);
        }
    }, [safetyState.cooldownRemainingSec, addLogEvent]);

    // 5. Closed-Loop Periodic Control Loop (RTOS-style periodic task)
    useEffect(() => {
        const controlLoop = setInterval(() => {
            const { system: currentSys, sensors: curSensors, actuators: curAct, thresholds: curThresh, safetyState: curSafe } = stateRef.current;

            if (!currentSys.enabled || currentSys.mode !== "AUTO") return;

            const moisture = curSensors.moisture;

            // Trigger irrigation below minimum threshold
            if (moisture < curThresh.minMoisture && !curAct.waterPump) {
                if (curSafe.cooldownRemainingSec > 0) return; // In cooldown
                toggleActuator("waterPump", true);
                addLogEvent(
                    "success",
                    "AUTO",
                    `Closed-Loop Auto Irrigation triggered: Soil moisture (${moisture}%) fell below target threshold (${curThresh.minMoisture}%).`
                );
            }
            // Cutoff irrigation at or above maximum target
            else if (moisture >= curThresh.maxMoisture && curAct.waterPump) {
                toggleActuator("waterPump", false);
                addLogEvent(
                    "info",
                    "AUTO",
                    `Target moisture reached (${moisture}% >= ${curThresh.maxMoisture}%). Irrigation terminated successfully.`
                );
            }
        }, 1500);

        return () => clearInterval(controlLoop);
    }, [toggleActuator, addLogEvent]);

    // 6. Virtual ESP32 Hardware Simulator (when isDemoMode === true)
    useEffect(() => {
        if (!isDemoMode) return;

        const simInterval = setInterval(() => {
            setSensors(prev => {
                const curAct = stateRef.current.actuators;
                let newMoisture = prev.moisture;
                if (curAct.waterPump) {
                    newMoisture = Math.min(88, Number((newMoisture + 1.8 + Math.random() * 0.4).toFixed(1)));
                } else {
                    newMoisture = Math.max(12, Number((newMoisture - (0.05 + Math.random() * 0.08)).toFixed(1)));
                }

                let newTemp = prev.temperature;
                if (curAct.fan) {
                    newTemp = Math.max(20.5, Number((newTemp - 0.1).toFixed(1)));
                } else {
                    newTemp = Math.min(27.5, Number((newTemp + (Math.random() - 0.48) * 0.1).toFixed(1)));
                }

                let newHumidity = prev.humidity;
                if (curAct.waterPump) {
                    newHumidity = Math.min(80, Number((newHumidity + 0.3).toFixed(1)));
                } else if (curAct.fan) {
                    newHumidity = Math.max(45, Number((newHumidity - 0.2).toFixed(1)));
                } else {
                    newHumidity = Math.max(35, Math.min(75, Number((newHumidity + (Math.random() - 0.5) * 0.2).toFixed(1))));
                }

                const newLight = curAct.growLight ? 1 : (Math.random() > 0.2 ? 1 : 0);
                const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                setHistoryData(hPrev => {
                    const latest = [
                        ...hPrev.slice(-29),
                        {
                            time: timeString.slice(0, 5),
                            moisture: newMoisture,
                            temperature: newTemp,
                            humidity: newHumidity
                        }
                    ];
                    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(latest));
                    return latest;
                });

                return {
                    moisture: newMoisture,
                    temperature: newTemp,
                    humidity: newHumidity,
                    light: newLight,
                    lastUpdated: timeString
                };
            });
        }, 2500);

        return () => clearInterval(simInterval);
    }, [isDemoMode]);

    // 7. Live Firebase RTDB Stream (when isDemoMode === false)
    useEffect(() => {
        if (isDemoMode) return;

        const sensorsRef = ref(database, "sensors");
        const actuatorsRef = ref(database, "actuators");
        const systemRef = ref(database, "system");
        const fanRef = ref(database, "status/fan");
        const ledRef = ref(database, "status/led");

        const unsubs = [];

        unsubs.push(onValue(sensorsRef, snapshot => {
            const val = snapshot.val();
            if (val) {
                try {
                    const parsed = SensorDataSchema.parse(val);
                    setSensors(parsed);

                    if (parsed.lastUpdated) {
                        const now = Date.now();
                        const parsedTime = typeof parsed.lastUpdated === "number" ? parsed.lastUpdated : new Date(parsed.lastUpdated).getTime();
                        const diffSec = isNaN(parsedTime) ? 0 : Math.round((now - parsedTime) / 1000);

                        setDeviceHealth({
                            status: diffSec < 90 ? "ONLINE" : diffSec < 300 ? "STALE" : "OFFLINE",
                            lastPingAgoSec: diffSec,
                            pingMs: 480
                        });
                    }
                } catch {
                    setSensors(val);
                }
            }
        }));

        unsubs.push(onValue(actuatorsRef, snapshot => {
            const val = snapshot.val();
            if (val) {
                setActuators(prev => ({ ...prev, waterPump: Boolean(val.waterPump) }));
            }
        }));

        unsubs.push(onValue(fanRef, snapshot => {
            const val = snapshot.val();
            if (val !== null) setActuators(prev => ({ ...prev, fan: Boolean(val) }));
        }));

        unsubs.push(onValue(ledRef, snapshot => {
            const val = snapshot.val();
            if (val !== null) setActuators(prev => ({ ...prev, growLight: Boolean(val) }));
        }));

        unsubs.push(onValue(systemRef, snapshot => {
            const val = snapshot.val();
            if (val) {
                setSystem(prev => ({
                    enabled: val.enabled !== undefined ? val.enabled : prev.enabled,
                    mode: val.mode || prev.mode
                }));
            }
        }));

        return () => unsubs.forEach(u => u());
    }, [isDemoMode]);

    const clearLogs = useCallback(() => {
        setEventLogs([]);
        localStorage.removeItem(STORAGE_KEYS.LOGS);
    }, []);

    const value = {
        isDemoMode,
        toggleDemoMode,
        system,
        toggleSystemPower,
        setOperationMode,
        sensors,
        actuators,
        toggleActuator,
        thresholds,
        updateThresholds,
        selectPlantProfile,
        eventLogs,
        addLogEvent,
        clearLogs,
        historyData,
        deviceHealth,
        safetyState
    };

    return <PlantContext.Provider value={value}>{children}</PlantContext.Provider>;
}
