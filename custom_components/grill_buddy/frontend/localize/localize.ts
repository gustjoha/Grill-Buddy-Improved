import * as en from "./languages/en.json";
import * as nl from "./languages/nl.json";
import * as de from "./languages/de.json";

import IntlMessageFormat from "intl-messageformat";

const languages: any = {
  en: en,
  nl: nl,
  de: de,
};

// Performance: Cache for IntlMessageFormat instances to avoid recreating them
const formatCache = new Map<string, IntlMessageFormat>();

// Performance: Cache for translated strings to avoid repeated lookups
const translationCache = new Map<string, string>();

export function localize(
  string: string,
  language: string,
  ...args: any[]
): string {
  const lang = language.replace(/['"]+/g, "");
  
  // Performance: Create cache key for this specific translation request
  const cacheKey = `${lang}:${string}:${args.length > 0 ? JSON.stringify(args) : ''}`;
  
  // Performance: Return cached result if available
  const cached = translationCache.get(cacheKey);
  if (cached) return cached;

  let translated: string;

  try {
    translated = string.split(".").reduce((o, i) => o[i], languages[lang]);
  } catch (e) {
    translated = string.split(".").reduce((o, i) => o[i], languages["en"]);
  }

  if (translated === undefined)
    translated = string.split(".").reduce((o, i) => o[i], languages["en"]);

  // Performance: For simple strings without args, cache and return immediately
  if (!args.length) {
    translationCache.set(cacheKey, translated);
    return translated;
  }

  const argObject = {};
  for (let i = 0; i < args.length; i += 2) {
    let key = args[i];
    key = key.replace(/^{([^}]+)?}$/, "$1");
    argObject[key] = args[i + 1];
  }

  try {
    // Performance: Cache IntlMessageFormat instances
    const formatKey = `${lang}:${translated}`;
    let message = formatCache.get(formatKey);
    if (!message) {
      message = new IntlMessageFormat(translated, language);
      formatCache.set(formatKey, message);
    }
    
    const result = message.format(argObject) as string;
    
    // Performance: Cache the final result
    translationCache.set(cacheKey, result);
    return result;
  } catch (err) {
    const errorResult = "Translation " + err;
    translationCache.set(cacheKey, errorResult);
    return errorResult;
  }
}
