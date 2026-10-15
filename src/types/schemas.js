import { z } from "zod";

export const SensorDataSchema = z.object({
    moisture: z.coerce.number().min(0).max(100).default(0),
    temperature: z.coerce.number().min(-20).max(80).default(24),
    humidity: z.coerce.number().min(0).max(100).default(50),
    light: z.union([z.number(), z.string()]).default(1),
    lastUpdated: z.union([z.string(), z.number()]).optional()
});

export const ActuatorsSchema = z.object({
    waterPump: z.boolean().default(false),
    fan: z.boolean().default(false),
    growLight: z.boolean().default(false)
});

export const ThresholdSettingsSchema = z.object({
    plantProfileId: z.string().default("monstera"),
    minMoisture: z.number().min(5).max(85).default(35),
    maxMoisture: z.number().min(15).max(95).default(50),
    maxPumpDurationSec: z.number().min(3).max(60).default(8),
    cooldownMinutes: z.number().min(1).max(60).default(5)
});

export const LogEventSchema = z.object({
    id: z.string(),
    timestamp: z.string(),
    type: z.enum(["info", "success", "warning", "danger"]),
    category: z.enum(["SYSTEM", "PUMP", "AUTO", "SAFETY", "ENVIRONMENT"]),
    message: z.string()
});
