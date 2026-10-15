export const PLANT_PRESETS = [
    {
        id: "monstera",
        name: "Monstera Deliciosa",
        scientific: "Monstera deliciosa",
        category: "Tropical Foliage",
        minMoisture: 35,
        maxMoisture: 50,
        optimalTemp: "18°C - 27°C",
        optimalHumidity: "60% - 80%",
        maxPumpDurationSec: 8,
        cooldownMinutes: 5,
        description: "Requires aerated soil with moderate moisture. Susceptible to root rot if moisture remains above 60%."
    },
    {
        id: "succulent",
        name: "Sansevieria & Cactus",
        scientific: "Sansevieria trifasciata",
        category: "Arid / Desert",
        minMoisture: 15,
        maxMoisture: 25,
        optimalTemp: "16°C - 32°C",
        optimalHumidity: "30% - 50%",
        maxPumpDurationSec: 4,
        cooldownMinutes: 10,
        description: "Drought-tolerant varieties. Cutoff must occur early; roots require extended dry periods between waterings."
    },
    {
        id: "basil",
        name: "Sweet Basil & Culinary Herbs",
        scientific: "Ocimum basilicum",
        category: "Culinary Herb",
        minMoisture: 55,
        maxMoisture: 72,
        optimalTemp: "20°C - 28°C",
        optimalHumidity: "50% - 70%",
        maxPumpDurationSec: 10,
        cooldownMinutes: 3,
        description: "High-transpiration plants requiring consistently moist soil and prolonged sunlight exposure."
    },
    {
        id: "ficus",
        name: "Fiddle Leaf Fig",
        scientific: "Ficus lyrata",
        category: "Indoor Tree",
        minMoisture: 30,
        maxMoisture: 45,
        optimalTemp: "18°C - 25°C",
        optimalHumidity: "40% - 60%",
        maxPumpDurationSec: 6,
        cooldownMinutes: 6,
        description: "Sensitive to soil moisture fluctuations. Steady, measured pulses prevent leaf browning and leaf drop."
    },
    {
        id: "custom",
        name: "Custom Agronomic Profile",
        scientific: "User Defined",
        category: "Custom Calibration",
        minMoisture: 30,
        maxMoisture: 45,
        optimalTemp: "Configurable",
        optimalHumidity: "Configurable",
        maxPumpDurationSec: 8,
        cooldownMinutes: 5,
        description: "Fine-tune arbitrary trigger limits, safety timeouts, and cooldown cycles according to specific botanical requirements."
    }
];

export const DEFAULT_THRESHOLDS = {
    plantProfileId: "monstera",
    minMoisture: 35,
    maxMoisture: 50,
    maxPumpDurationSec: 8,
    cooldownMinutes: 5
};
