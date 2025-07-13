// Performance: Cache loaded elements to avoid redundant loading
let _elementsLoaded = false;
let _loadingPromise: Promise<void> | null = null;

export const loadHaForm = async (): Promise<void> => {
  // Performance: Return early if already loaded or currently loading
  if (_elementsLoaded) return;
  if (_loadingPromise) return _loadingPromise;

  if (
    customElements.get("ha-checkbox") &&
    customElements.get("ha-slider") &&
    customElements.get("ha-panel-config")
  ) {
    _elementsLoaded = true;
    return;
  }

  // Performance: Cache the loading promise to prevent concurrent loads
  _loadingPromise = (async () => {
    try {
      await customElements.whenDefined("partial-panel-resolver");
      const ppr = document.createElement("partial-panel-resolver") as any;
      ppr.hass = {
        panels: [
          {
            url_path: "tmp",
            component_name: "config",
          },
        ],
      };
      ppr._updateRoutes();
      await ppr.routerOptions.routes.tmp.load();

      await customElements.whenDefined("ha-panel-config");

      const cpr = document.createElement("ha-panel-config") as any;
      await cpr.routerOptions.routes.automation.load();
      
      _elementsLoaded = true;
    } catch (error) {
      console.error('Error loading HA elements:', error);
      // Reset loading state on error to allow retry
      _loadingPromise = null;
      throw error;
    }
  })();

  return _loadingPromise;
};

// Performance: Cache for YAML editor loading
let _yamlEditorLoaded = false;
let _yamlLoadingPromise: Promise<void> | null = null;

export const loadHaYamlEditor = async (): Promise<void> => {
  // Performance: Return early if already loaded or currently loading
  if (_yamlEditorLoaded) return;
  if (_yamlLoadingPromise) return _yamlLoadingPromise;

  if (customElements.get("ha-yaml-editor")) {
    _yamlEditorLoaded = true;
    return;
  }

  // Performance: Cache the loading promise to prevent concurrent loads
  _yamlLoadingPromise = (async () => {
    try {
      // Load in ha-yaml-editor from developer-tools-service
      const ppResolver = document.createElement("partial-panel-resolver");
      const routes = (ppResolver as any).getRoutes([
        {
          component_name: "developer-tools",
          url_path: "a",
        },
      ]);
      await routes?.routes?.a?.load?.();
      const devToolsRouter = document.createElement("developer-tools-router");
      await (devToolsRouter as any)?.routerOptions?.routes?.service?.load?.();
      
      _yamlEditorLoaded = true;
    } catch (error) {
      console.error('Error loading YAML editor:', error);
      // Reset loading state on error to allow retry
      _yamlLoadingPromise = null;
      throw error;
    }
  })();

  return _yamlLoadingPromise;
};
