import { useWatering } from "../hooks/useWatering";

function WateringRisk({ position }) {
  const [lat, lng] = position;
  const { result, loading, error } = useWatering(lat, lng);

  if (loading) return <p>Estimating water need...</p>;
  if (error || !result) return null; // the rest of the popup still works without it

  return (
    <div className="risk">
      <p>
        <b>Chance the soil is dry tomorrow: {result.percent}%</b> ({result.level})
      </p>
      <div className="risk-bar">
        <div className={`risk-fill ${result.level.toLowerCase()}`} style={{ width: `${result.percent}%` }} />
      </div>
    </div>
  );
}

export default WateringRisk;