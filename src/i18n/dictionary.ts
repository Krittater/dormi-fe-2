import messages from "@/messages/messages.json";

import type { Locale, Message } from "./types";

type Dictionary = Record<string, Record<Locale, string>>;

function buildDictionary(): Dictionary {
  const dict: Dictionary = {};
  for (const entry of messages as Message[]) {
    if (process.env.NODE_ENV !== "production" && dict[entry.code]) {
      console.warn(`[i18n] Duplicate translation code: "${entry.code}"`);
    }
    dict[entry.code] = { th: entry.th, en: entry.en, cn: entry.cn };
  }
  return dict;
}

export const dictionary = buildDictionary();
