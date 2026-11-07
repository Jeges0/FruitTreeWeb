const CROP_COEFF = 0.8; // fruit trees use about 80% of reference evapotranspiration
const CAPACITY = 30;    // mm of water the soil can hold (rough)
const TRIGGER = 15;     // water when this much has been lost
const MIN_RAIN = 2;     // ignore drizzle below this many mm

export function wateringAdvice(days, todayIndex) {
  let depletion = 0; // assume the soil was full at the start of the period
  let waterOn = null;

  days.forEach((day, i) => {
    const used = day.et0 * CROP_COEFF;
    const rain = day.rain >= MIN_RAIN ? day.rain : 0;
    depletion = Math.min(CAPACITY, Math.max(0, depletion + used - rain));

    if (i >= todayIndex && waterOn === null && depletion >= TRIGGER) {
      waterOn = day.date;
    }
  });

  return {
    waterOn, // date string, or null when no watering is needed in the forecast
    isToday: waterOn === days[todayIndex].date,
  };
}