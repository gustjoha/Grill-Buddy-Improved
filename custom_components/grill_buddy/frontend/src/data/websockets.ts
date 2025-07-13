import { HomeAssistant } from "custom-card-helpers";
import { Config, Probe, Preset } from "../types";
import { DOMAIN } from "../const";

// Performance: Cache for API responses to reduce redundant calls
interface ApiCache {
  [key: string]: {
    data: any;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
  };
}

const apiCache: ApiCache = {};
const CACHE_TTL = 30000; // 30 seconds default cache

// Performance: Helper function to manage cache
function getCachedData<T>(key: string): T | null {
  const cached = apiCache[key];
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data as T;
  }
  return null;
}

function setCachedData<T>(key: string, data: T, ttl: number = CACHE_TTL): void {
  apiCache[key] = {
    data,
    timestamp: Date.now(),
    ttl,
  };
}

// Performance: Batch API calls when possible
export const fetchAllInitialData = async (
  hass: HomeAssistant,
): Promise<{
  config: Config;
  probes: Probe[];
  presets: Preset[];
  stateUpdateSettings: any[];
}> => {
  const cacheKey = "initial-data";
  const cached = getCachedData<any>(cacheKey);

  if (cached) {
    return cached;
  }

  // Fetch all data in parallel for better performance
  const [config, probes, presets, stateUpdateSettings] = await Promise.all([
    fetchConfig(hass),
    fetchProbes(hass),
    fetchPresets(hass),
    fetchStateUpdateSettings(hass),
  ]);

  const result = { config, probes, presets, stateUpdateSettings };
  setCachedData(cacheKey, result, 10000); // Cache for 10 seconds

  return result;
};

export const fetchConfig = (hass: HomeAssistant): Promise<Config> => {
  const cacheKey = "config";
  const cached = getCachedData<Config>(cacheKey);

  if (cached) {
    return Promise.resolve(cached);
  }

  return hass
    .callWS({
      type: DOMAIN + "/config",
    })
    .then((result: unknown) => {
      const config = result as Config;
      setCachedData(cacheKey, config);
      return config;
    });
};

export const saveConfig = (
  hass: HomeAssistant,
  config: Partial<Config>,
): Promise<boolean> => {
  return hass.callApi("POST", DOMAIN + "/config", config);
};

export const fetchProbes = (hass: HomeAssistant): Promise<Probe[]> => {
  const cacheKey = "probes";
  const cached = getCachedData<Probe[]>(cacheKey);

  if (cached) {
    return Promise.resolve(cached);
  }

  return hass
    .callWS({
      type: DOMAIN + "/probes",
    })
    .then((result: unknown) => {
      const probes = result as Probe[];
      setCachedData(cacheKey, probes, 5000); // Cache probes for 5 seconds
      return probes;
    });
};

export const saveProbe = (
  hass: HomeAssistant,
  config: Partial<Probe>,
): Promise<boolean> => {
  // Performance: Clear relevant cache when saving
  delete apiCache["probes"];
  delete apiCache["initial-data"];

  return hass.callApi("POST", DOMAIN + "/probes", config);
};

export const deleteProbe = (
  hass: HomeAssistant,
  probe_id: string,
): Promise<boolean> => {
  // Performance: Clear relevant cache when deleting
  delete apiCache["probes"];
  delete apiCache["initial-data"];

  return hass.callApi("POST", DOMAIN + "/probes", {
    probe_id: probe_id,
    remove: true,
  });
};

export const fetchPresets = (hass: HomeAssistant): Promise<Preset[]> => {
  const cacheKey = "presets";
  const cached = getCachedData<Preset[]>(cacheKey);

  if (cached) {
    return Promise.resolve(cached);
  }

  return hass
    .callWS({
      type: DOMAIN + "/presets",
    })
    .then((result: unknown) => {
      const presets = result as Preset[];
      setCachedData(cacheKey, presets, 60000); // Cache presets for 1 minute (they change less frequently)
      return presets;
    });
};

export const fetchStateUpdateSettings = (
  hass: HomeAssistant,
): Promise<Preset[]> => {
  const cacheKey = "stateupdatesettings";
  const cached = getCachedData<Preset[]>(cacheKey);

  if (cached) {
    return Promise.resolve(cached);
  }

  return hass
    .callWS({
      type: DOMAIN + "/stateupdatesettings",
    })
    .then((result: unknown) => {
      const settings = result as Preset[];
      setCachedData(cacheKey, settings, 60000); // Cache settings for 1 minute
      return settings;
    });
};

/*export const fetchModules = (
  hass: HomeAssistant
): Promise<SmartIrrigationModule[]> =>
  hass.callWS({
    type: DOMAIN + "/modules",
  });

export const fetchAllModules = (
  hass: HomeAssistant
): Promise<SmartIrrigationModule[]> =>
  hass.callWS({
    type: DOMAIN + "/allmodules",
  });

export const saveModule = (
  hass: HomeAssistant,
  config: Partial<SmartIrrigationModule>
): Promise<boolean> => {
  return hass.callApi("POST", DOMAIN + "/modules", config);
};

export const deleteModule = (
  hass: HomeAssistant,
  module_id: string
): Promise<boolean> => {
  return hass.callApi("POST", DOMAIN + "/modules", {
    id: module_id,
    remove: true,
  });
};

export const fetchMappings = (
  hass: HomeAssistant
): Promise<SmartIrrigationMapping[]> =>
  hass.callWS({
    type: DOMAIN + "/mappings",
  });
export const saveMapping = (
  hass: HomeAssistant,
  config: Partial<SmartIrrigationMapping>
): Promise<boolean> => {
  return hass.callApi("POST", DOMAIN + "/mappings", config);
};

export const deleteMapping = (
  hass: HomeAssistant,
  module_id: string
): Promise<boolean> => {
  return hass.callApi("POST", DOMAIN + "/mappings", {
    id: module_id,
    remove: true,
  });
};
*/
