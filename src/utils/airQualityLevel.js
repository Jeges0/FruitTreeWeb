// European Air Quality Index bands
export function describeAqi(aqi) {
  if (aqi < 20) return { label: "Good", level: "good" };
  if (aqi < 40) return { label: "Fair", level: "fair" };
  if (aqi < 60) return { label: "Moderate", level: "moderate" };
  if (aqi < 80) return { label: "Poor", level: "poor" };
  if (aqi <= 100) return { label: "Very poor", level: "verypoor" };
  return { label: "Extremely poor", level: "extreme" };
}