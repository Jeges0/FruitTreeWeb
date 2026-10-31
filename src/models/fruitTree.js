import { fruitEmoji } from "../utils/fruitEmoji";

// One map point from the API -> a tree object the app uses
export function toTree(raw) {
  return {
    id: `ff-${raw.id}`,
    sourceId: raw.id,
    position: [raw.lat, raw.lng],
    typeName: raw.typeName,
    scientificName: raw.scientificName ?? null,
    emoji: fruitEmoji(raw.typeName),
  };
}

// One grid cell from the API -> a circle on the map
export function toCluster(raw) {
  return {
    id: `${raw.lat},${raw.lng}`,
    position: [raw.lat, raw.lng],
    count: raw.count,
  };
}

function seasonText(raw) {
  if (raw.noSeason) return "Year-round";
  if (raw.seasonStart && raw.seasonStop) return `${raw.seasonStart} to ${raw.seasonStop}`;
  if (raw.seasonStart) return `From ${raw.seasonStart}`;
  return null;
}

// The full record -> what the popup shows
export function toDetails(raw) {
  return {
    description: raw.description || null,
    season: seasonText(raw),
    access: raw.access || null,
    address: raw.address || null,
    unverified: Boolean(raw.unverified),
    updated: raw.updated ? raw.updated.slice(0, 10) : null,
    link: `https://fallingfruit.org/locations/${raw.id}`,
  };
}