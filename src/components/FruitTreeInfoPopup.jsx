import { useLocationDetails } from "../hooks/useLocationDetails";
import WeatherInfo from "./WeatherInfo";
import AirQualityInfo from "./AirQualityInfo";

function FruitTreeInfoPopup({ tree }) {
  const { details, loading, error } = useLocationDetails(tree.sourceId);

  return (
    <div className="tree-popup">
      <h3>
        {tree.emoji} {tree.typeName}
      </h3>
      {tree.scientificName && <p className="latin">{tree.scientificName}</p>}

      {loading && <p>Loading details...</p>}
      {error && <p>Couldn't load details.</p>}

      {details && (
        <>
          {details.season && <p><b>Season:</b> {details.season}</p>}
          {details.access && <p><b>Access:</b> {details.access}</p>}
          {details.description && <p>{details.description}</p>}
          {details.address && <p><b>Address:</b> {details.address}</p>}
          {details.unverified && <p>⚠️ Not verified by other users</p>}
          {details.updated && <small>Updated {details.updated}</small>}
          <br />
          <a href={details.link} target="_blank" rel="noreferrer">
            View on Falling Fruit
          </a>
        </>
      )}

      <hr />
      <WeatherInfo position={tree.position} />
      <hr />
      <AirQualityInfo position={tree.position} />
      <br />
      <small>Tree data: Falling Fruit</small>
    </div>
  );
}

export default FruitTreeInfoPopup;