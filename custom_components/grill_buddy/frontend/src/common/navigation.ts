import { DOMAIN } from "../const";

export interface Path {
  page: string;
  subpage?: string;
  params: Record<string, string | undefined>;
  filter?: Record<string, string | undefined>;
}

// Performance: Cache for URL parsing to avoid repeated work
let cachedPath: Path | null = null;
let cachedPathname: string | null = null;

export const getPath = () => {
  const currentPathname = window.location.pathname;
  
  // Performance: Return cached result if pathname hasn't changed
  if (cachedPathname === currentPathname && cachedPath) {
    return cachedPath;
  }

  // Performance: Optimized pairsToDict function with reduced object spreading
  const pairsToDict = (pairs: string[]) => {
    const res: Record<string, string | undefined> = {};
    for (let i = 0; i < pairs.length; i += 2) {
      const key = pairs[i];
      const val = i + 1 < pairs.length ? pairs[i + 1] : undefined;
      res[key] = val;
    }
    return res;
  };

  const parts = currentPathname.split("/");

  const path: Path = {
    page: parts[2] || "probes", //was "general", but since we don't have a general config page, defaulting to "probes"
    params: {},
  };

  if (parts.length > 3) {
    let extraArgs = parts.slice(3);

    const filterIndex = extraArgs.indexOf("filter");
    if (filterIndex !== -1) {
      const filterParts = extraArgs.slice(filterIndex + 1);
      extraArgs = extraArgs.slice(0, filterIndex);
      path.filter = pairsToDict(filterParts);
    }

    if (extraArgs.length) {
      if (extraArgs.length % 2) path.subpage = extraArgs.shift();
      if (extraArgs.length) path.params = pairsToDict(extraArgs);
    }
  }
  
  // Performance: Cache the result
  cachedPath = path;
  cachedPathname = currentPathname;
  
  return path;
};

export const exportPath = (
  page: string,
  ...args: (
    | string
    | { params: Record<string, string> }
    | { filter: Record<string, string> }
  )[]
) => {
  let path: Path = {
    page: page,
    params: {},
  };
  args.forEach((e) => {
    if (typeof e == "string") path = { ...path, subpage: e };
    else if ("params" in e) path = { ...path, params: e.params };
    else if ("filter" in e) path = { ...path, filter: e.filter };
  });

  const dictToString = (dict: Record<string, string | undefined>) => {
    let keys = Object.keys(dict);
    keys = keys.filter((e) => dict[e]);
    keys.sort();
    let string = "";

    keys.forEach((key) => {
      const val = dict[key];
      string = string.length ? `${string}/${key}/${val}` : `${key}/${val}`;
    });
    return string;
  };

  let url = `/${DOMAIN}/${path.page}`;

  if (path.subpage) url = `${url}/${path.subpage}`;
  if (dictToString(path.params).length)
    url = `${url}/${dictToString(path.params)}`;
  if (path.filter) url = `${url}/filter/${dictToString(path.filter)}`;

  return url;
};
