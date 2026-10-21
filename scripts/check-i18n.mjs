// Fails the build when en.json and bn.json don't have the same keys. The app has
// no fallback language (each language loads on its own), so a missing key would
// show up as a raw key in the UI.
import fs from "node:fs";

const read = (lang) => JSON.parse(fs.readFileSync(new URL(`../src/i18n/locales/${lang}.json`, import.meta.url), "utf8"));
const keys = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([k, v]) => (v && typeof v === "object" && !Array.isArray(v) ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));

const en = new Set(keys(read("en")));
const bn = new Set(keys(read("bn")));
const missingInBn = [...en].filter((k) => !bn.has(k));
const missingInEn = [...bn].filter((k) => !en.has(k));
if (missingInBn.length || missingInEn.length) {
  if (missingInBn.length) console.error(`Missing in bn.json:\n  ${missingInBn.join("\n  ")}`);
  if (missingInEn.length) console.error(`Missing in en.json:\n  ${missingInEn.join("\n  ")}`);
  process.exit(1);
}
console.log(`i18n: en and bn both have ${en.size} keys`);
