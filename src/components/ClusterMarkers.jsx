import { Marker, useMap } from "react-leaflet";
import { clusterIcon } from "../utils/clusterIcon";

function ClusterMarkers({ clusters }) {
  const map = useMap();

  return (
    <>
      {clusters.map((cluster) => (
        <Marker
          key={cluster.id}
          position={cluster.position}
          icon={clusterIcon(cluster.count)}
          eventHandlers={{
            click: () => map.flyTo(cluster.position, map.getZoom() + 2),
          }}
        />
      ))}
    </>
  );
}

export default ClusterMarkers;