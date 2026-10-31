import { FRUITS, FALLBACK_EMOJI } from "../data/fruits";

const ENTRIES = Object.entries(FRUITS).filter(([name]) => name !== "Other");

export function fruitEmoji(typeName = "") {
  const lower = typeName.toLowerCase();
  const match = ENTRIES.find(([name]) => lower.includes(name.toLowerCase()));
  return match ? match[1] : FALLBACK_EMOJI;
}