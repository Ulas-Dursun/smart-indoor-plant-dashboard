import React, { useState, useEffect, useRef, useCallback } from "react";
import { ref, onValue, set, update, push, remove } from "firebase/database";
import { z } from "zod";
import { database } from "../firebase";
import { PLANT_PRESETS, DEFAULT_THRESHOLDS } from "../constants/plantPresets";
import {
    SensorDataSchema,
    ActuatorsSchema,
    ThresholdSettingsSchema,
    LogEventSchema
} from "../types/schemas";
import { PlantContext } from "./context";

const STORAGE_KEYS = {
    DEMO_MODE: "sip_demo_mode",
    THRESHOLDS: "sip_thresholds",
    LOGS: "sip_logs",
    HISTORY: "sip_history"
};

function parseTimestampToMs(rawTimestamp) {
    if (typeof rawTimestamp === "number") {
        // Handle both seconds and milliseconds epoch
        return rawTimestamp < 1e12 ? rawTimestamp * 1000 : rawTimestamp;
    }
    if (typeof rawTimestamp === "string") {
        const directParse = Date.parse(rawTimestamp);
        if (!Number.isNaN(directParse)) return directParse;

        // Handle "HH:MM:SS" or "HH:MM" time strings from ESP32 / toLocaleTimeString
        const match = rawTimestamp.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
        if (match) {
            const now = new Date();
            const candidate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                Number(match[1]),
                Number(match[2]),
                Number(match[3] || 0)
            );
            return candidate.getTime();
        }
    }
    return null;
}

export function PlantProvider({ children }) {
    // 1. Core State
    const [isDemoMode, setIsDemoMode] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.DEMO_MODE);
        if (saved !== null) {
            try {
                return Boolean(JSON.parse(saved));
            } catch {
                return true;
            }
        }
        return true;
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
                return z.array(LogEventSchema).parse(JSON.parse(saved));
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
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            } catch {
                // Fallback to synthetic seed below
            }
        }
        const initial = [];
        const now = Date.now();
        for (let i = 20; i >= 0; i--) {
            const time = new Date(now - i * 60000).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });
            initial.push({
                time,
                moisture: Number((32 + Math.sin(i / 3) * 3 + (20 - i) * 0.1).toFixed(1)),
                temperature: Number((23.8 + Math.cos(i / 4) * 0.5).toFixed(1)),
                humidity: Number((50 + Math.sin(i / 5) * 4).toFixed(1))
            });
        }
        return initial;
    });

    const [deviceHealth, setDeviceHealth] = useState(() => ({
        status: isDemoMode ? "SIMULATED" : "ONLINE",
        lastPingAgoSec: 0,
        pingMs: isDemoMode ? 240 : 480
    }));

    const [safetyState, setSafetyState] = useState({
        pumpActiveSince: null,
        remainingSafetySec: null,
        cooldownRemainingSec: 0
    });

    // Refs for timers & tracking
    const pumpTimerRef = useRef(null);
    const pumpActiveTimestampRef = useRef(null);
    const cooldownIntervalRef = useRef(null);
    const lastLiveSampleKeyRef = useRef(null);
    const lastPacketReceivedAtRef = useRef(null);
    const liveFirebaseHistoryRef = useRef(null);

    // Latest state snapshot ref to prevent stale closures inside intervals
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

    // Helper: Add log event (Pure state update + persisted side effect)
    const addLogEvent = useCallback((type, category, message) => {
        const newLog = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: new Date().toLocaleTimeString(),
            type,
            category,
            message
        };
        setEventLogs(prev => {
            const updated = [newLog, ...prev.slice(0, 49)];
            try {
                localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updated));
            } catch {
                // Ignore storage quota errors
            }
            return updated;
        });
    }, []);

    // 2. Thresholds & Botanical Profile Updaters
    const updateThresholds = useCallback((newSettings) => {
        const validated = ThresholdSettingsSchema.parse(newSettings);
        setThresholds(validated);
        try {
            localStorage.setItem(STORAGE_KEYS.THRESHOLDS, JSON.stringify(validated));
        } catch {
            // Ignore storage errors
        }
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

    // 3. Actuator Control (StrictMode-safe: no side effects inside state updater)
    const toggleActuator = useCallback((actuatorName, forceValue = null, options = { silent: false }) => {
        const { system: currentSystem, actuators: currentActuators, thresholds: currentThresholds, isDemoMode: currentDemo } = stateRef.current;

        if (!currentSystem.enabled && actuatorName === "waterPump" && forceValue !== false) {
            if (!options.silent) {
                addLogEvent("warning", "SAFETY", "Cannot activate pump: Master Power Switch is OFF.");
            }
            return;
        }

        const nextVal = forceValue !== null ? Boolean(forceValue) : !currentActuators[actuatorName];
        if (currentActuators[actuatorName] === nextVal && forceValue !== null) {
            return;
        }

        const updatedActuators = ActuatorsSchema.parse({
            ...currentActuators,
            [actuatorName]: nextVal
        });

        setActuators(updatedActuators);

        // Synchronize Safety State immediately when waterPump transitions
        if (actuatorName === "waterPump") {
            if (nextVal) {
                const now = Date.now();
                pumpActiveTimestampRef.current = now;
                setSafetyState(prev => ({
                    ...prev,
                    pumpActiveSince: now,
                    remainingSafetySec: currentThresholds.maxPumpDurationSec
                }));
            } else {
                pumpActiveTimestampRef.current = null;
                setSafetyState(prev => ({
                    ...prev,
                    pumpActiveSince: null,
                    remainingSafetySec: null
                }));
            }
        }

        // Sync with Firebase in Live Hardware Mode
        if (!currentDemo) {
            if (actuatorName === "waterPump") {
                set(ref(database, "actuators/waterPump"), nextVal).catch(() => {});
            } else if (actuatorName === "fan") {
                set(ref(database, "status/fan"), nextVal).catch(() => {});
            } else if (actuatorName === "growLight") {
                set(ref(database, "status/led"), nextVal).catch(() => {});
            }
        }

        if (!options.silent) {
            const labelMap = {
                waterPump: "Irrigation Pump",
                fan: "Cooling Fan",
                growLight: "Grow Light"
            };
            addLogEvent(
                nextVal ? "success" : "info",
                actuatorName === "waterPump" ? "PUMP" : "ENVIRONMENT",
                `${labelMap[actuatorName]} ${nextVal ? "ACTIVATED" : "DEACTIVATED"} manually.`
            );
        }
    }, [addLogEvent]);

    // Master Power Toggle
    const toggleSystemPower = useCallback(() => {
        const nextState = !stateRef.current.system.enabled;
        setSystem(prev => ({ ...prev, enabled: nextState }));

        if (!nextState) {
            toggleActuator("waterPump", false, { silent: true });
            toggleActuator("fan", false, { silent: true });
            toggleActuator("growLight", false, { silent: true });
            addLogEvent(
                "danger",
                "SAFETY",
                "EMERGENCY SHUTDOWN: Master switch flipped to OFF. All actuators disengaged."
            );
        } else {
            addLogEvent(
                "success",
                "SYSTEM",
                "Master system power restored. Telemetry and controllers active."
            );
        }

        if (!stateRef.current.isDemoMode) {
            update(ref(database, "system"), { enabled: nextState }).catch(() => {});
        }
    }, [toggleActuator, addLogEvent]);

    // Operation Mode Toggle (AUTO vs MANUAL)
    const setOperationMode = useCallback((mode) => {
        setSystem(prev => ({ ...prev, mode }));
        addLogEvent("info", "AUTO", `Control Mode changed to: ${mode}.`);
        if (!stateRef.current.isDemoMode) {
            update(ref(database, "system"), { mode }).catch(() => {});
        }
    }, [addLogEvent]);

    // Demo Mode Toggle (StrictMode-safe)
    const toggleDemoMode = useCallback(() => {
        const next = !stateRef.current.isDemoMode;
        setIsDemoMode(next);
        try {
            localStorage.setItem(STORAGE_KEYS.DEMO_MODE, JSON.stringify(next));
        } catch {
            // Ignore storage errors
        }
        lastPacketReceivedAtRef.current = Date.now();
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
    }, [addLogEvent]);

    // 4. Pump Safety Timeout Guard
    useEffect(() => {
        if (!actuators.waterPump) {
            if (pumpTimerRef.current) {
                clearInterval(pumpTimerRef.current);
                pumpTimerRef.current = null;
            }
            pumpActiveTimestampRef.current = null;
            return;
        }

        if (!pumpActiveTimestampRef.current) {
            pumpActiveTimestampRef.current = Date.now();
        }

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
                pumpTimerRef.current = null;
                pumpActiveTimestampRef.current = null;

                toggleActuator("waterPump", false, { silent: true });

                const cooldownSec = stateRef.current.thresholds.cooldownMinutes * 60;
                setSafetyState({
                    pumpActiveSince: null,
                    remainingSafetySec: null,
                    cooldownRemainingSec: cooldownSec
                });

                addLogEvent(
                    "warning",
                    "SAFETY",
                    `Safety Guard Intercepted: Pump reached maximum continuous run threshold (${maxSec}s). Shutoff enforced.`
                );
            }
        }, 500);

        pumpTimerRef.current = interval;
        return () => {
            clearInterval(interval);
            pumpTimerRef.current = null;
        };
    }, [actuators.waterPump, toggleActuator, addLogEvent]);

    // Cooldown Ticker (StrictMode-safe)
    const isCooldownActive = safetyState.cooldownRemainingSec > 0;
    useEffect(() => {
        if (!isCooldownActive) return;

        cooldownIntervalRef.current = setInterval(() => {
            const currentCooldown = stateRef.current.safetyState.cooldownRemainingSec;
            if (currentCooldown <= 1) {
                clearInterval(cooldownIntervalRef.current);
                cooldownIntervalRef.current = null;
                setSafetyState(prev => ({ ...prev, cooldownRemainingSec: 0 }));
                addLogEvent("info", "SAFETY", "Safety Cooldown expired. Automated irrigation ready.");
            } else {
                setSafetyState(prev => ({
                    ...prev,
                    cooldownRemainingSec: Math.max(0, prev.cooldownRemainingSec - 1)
                }));
            }
        }, 1000);

        return () => {
            if (cooldownIntervalRef.current) {
                clearInterval(cooldownIntervalRef.current);
                cooldownIntervalRef.current = null;
            }
        };
    }, [isCooldownActive, addLogEvent]);

    // 5. Closed-Loop Periodic Control Loop (RTOS-style periodic task)
    useEffect(() => {
        const controlLoop = setInterval(() => {
            const {
                system: currentSys,
                sensors: curSensors,
                actuators: curAct,
                thresholds: curThresh,
                safetyState: curSafe
            } = stateRef.current;

            if (!currentSys.enabled || currentSys.mode !== "AUTO") return;

            const moisture = curSensors.moisture;

            // Trigger irrigation below minimum threshold
            if (moisture < curThresh.minMoisture && !curAct.waterPump) {
                if (curSafe.cooldownRemainingSec > 0) return;
                toggleActuator("waterPump", true, { silent: true });
                addLogEvent(
                    "success",
                    "AUTO",
                    `Closed-Loop Auto Irrigation triggered: Soil moisture (${moisture}%) fell below target threshold (${curThresh.minMoisture}%).`
                );
            }
            // Cutoff irrigation at or above maximum target
            else if (moisture >= curThresh.maxMoisture && curAct.waterPump) {
                toggleActuator("waterPump", false, { silent: true });
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
            const { sensors: prev, actuators: curAct } = stateRef.current;

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
            const timeString = new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            });

            const nextSensors = {
                moisture: newMoisture,
                temperature: newTemp,
                humidity: newHumidity,
                light: newLight,
                lastUpdated: timeString
            };

            setSensors(nextSensors);

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
                try {
                    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(latest));
                } catch {
                    // Ignore storage errors
                }
                return latest;
            });
        }, 2500);

        return () => clearInterval(simInterval);
    }, [isDemoMode]);

    // 7. Live Firebase RTDB Stream & Hardware Watchdog (when isDemoMode === false)
    useEffect(() => {
        if (isDemoMode) return;
        if (!lastPacketReceivedAtRef.current) {
            lastPacketReceivedAtRef.current = Date.now();
        }

        const sensorsRef = ref(database, "sensors");
        const actuatorsRef = ref(database, "actuators");
        const systemRef = ref(database, "system");
        const fanRef = ref(database, "status/fan");
        const ledRef = ref(database, "status/led");
        const historyMoistureRef = ref(database, "history/moisture");

        const unsubs = [];

        // Subscribe to Firebase historical moisture node if available
        unsubs.push(onValue(historyMoistureRef, snapshot => {
            const val = snapshot.val();
            if (val && typeof val === "object") {
                liveFirebaseHistoryRef.current = val;
                const curSensors = stateRef.current.sensors;
                const mapped = Object.entries(val)
                    .map(([, item]) => ({
                        time: String(item?.time || "").slice(0, 5),
                        moisture: Number(item?.moisture ?? item?.value ?? 0),
                        temperature: Number(item?.temperature ?? curSensors.temperature ?? 24),
                        humidity: Number(item?.humidity ?? curSensors.humidity ?? 50)
                    }))
                    .slice(-30);

                if (mapped.length > 0) {
                    setHistoryData(mapped);
                }
            }
        }));

        // Subscribe to live sensor telemetry
        unsubs.push(onValue(sensorsRef, snapshot => {
            const val = snapshot.val();
            if (!val) return;

            const result = SensorDataSchema.safeParse(val);
            const parsed = result.success ? result.data : val;
            setSensors(parsed);

            const sampleKey = `${parsed.lastUpdated ?? ""}-${parsed.moisture}-${parsed.temperature}-${parsed.humidity}`;
            const isNewSample = sampleKey !== lastLiveSampleKeyRef.current;

            if (isNewSample) {
                lastLiveSampleKeyRef.current = sampleKey;
                const parsedMs = parseTimestampToMs(parsed.lastUpdated);
                const now = Date.now();
                // Use parsed timestamp if valid and not in the future, otherwise packet arrival time
                const effectivePacketTime = parsedMs && parsedMs <= now + 5000 ? parsedMs : now;
                lastPacketReceivedAtRef.current = effectivePacketTime;

                const diffSec = Math.max(0, Math.round((now - effectivePacketTime) / 1000));
                setDeviceHealth({
                    status: diffSec < 90 ? "ONLINE" : diffSec < 300 ? "STALE" : "OFFLINE",
                    lastPingAgoSec: diffSec,
                    pingMs: 480
                });

                const displayTime = typeof parsed.lastUpdated === "string" && parsed.lastUpdated.length >= 5
                    ? parsed.lastUpdated.slice(0, 5)
                    : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                // Update local chart state
                setHistoryData(hPrev => [
                    ...hPrev.slice(-29),
                    {
                        time: displayTime,
                        moisture: Number(parsed.moisture ?? 0),
                        temperature: Number(parsed.temperature ?? 24),
                        humidity: Number(parsed.humidity ?? 50)
                    }
                ]);

                // Persist to Firebase history/moisture with 30-sample FIFO cap
                if (parsed.lastUpdated) {
                    push(historyMoistureRef, {
                        time: parsed.lastUpdated,
                        value: Number(parsed.moisture ?? 0),
                        moisture: Number(parsed.moisture ?? 0),
                        temperature: Number(parsed.temperature ?? 24),
                        humidity: Number(parsed.humidity ?? 50)
                    })
                        .then(() => {
                            const currentHistoryObj = liveFirebaseHistoryRef.current;
                            if (currentHistoryObj) {
                                const keys = Object.keys(currentHistoryObj);
                                if (keys.length > 30) {
                                    remove(ref(database, `history/moisture/${keys[0]}`)).catch(() => {});
                                }
                            }
                        })
                        .catch(() => {});
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
                    enabled: val.enabled !== undefined ? Boolean(val.enabled) : prev.enabled,
                    mode: val.mode === "AUTO" || val.mode === "MANUAL" ? val.mode : prev.mode
                }));
                if (val.thresholds) {
                    const parsedThresh = ThresholdSettingsSchema.safeParse(val.thresholds);
                    if (parsedThresh.success) {
                        setThresholds(parsedThresh.data);
                    }
                }
            }
        }));

        // Periodic Watchdog Timer: detects silent hardware disconnects even when onValue stops firing
        const watchdogInterval = setInterval(() => {
            const diffSec = Math.max(0, Math.round((Date.now() - lastPacketReceivedAtRef.current) / 1000));
            setDeviceHealth({
                status: diffSec < 90 ? "ONLINE" : diffSec < 300 ? "STALE" : "OFFLINE",
                lastPingAgoSec: diffSec,
                pingMs: 480
            });
        }, 5000);

        return () => {
            unsubs.forEach(u => u());
            clearInterval(watchdogInterval);
        };
    }, [isDemoMode]);

    const clearLogs = useCallback(() => {
        setEventLogs([]);
        try {
            localStorage.removeItem(STORAGE_KEYS.LOGS);
        } catch {
            // Ignore storage errors
        }
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
