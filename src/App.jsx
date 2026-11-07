import { useState } from "react";
import TreeMap from "./components/TreeMap";
import TreeControls from "./components/TreeControls";
import { useFruitTree } from "./hooks/useFruitTree";
import "./App.css";

const CENTER = [47.4979, 19.0402]; // Budapest

function App() {
  const [trees, setTrees] = useState([]);
  const [fruit, setFruit] = useState("Apple");
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState(null);

  const { trees: publicTrees, clusters, loading, error } = useFruitTree(view);

  function handleMapClick(position) {
    if (!adding) return;
    setTrees((prev) => [...prev, { id: Date.now(), fruit, position }]);
    setAdding(false);
  }

  let status = null;
  if (error) status = "Couldn't load tree data. Is the API running?";
  else if (adding) status = `Click on the map to place your ${fruit} tree.`;
  else if (loading) status = "Loading trees...";

  return (
    <div className="app">
      <header className="header">
        <h1>FruitTree</h1>
        <TreeControls
          fruit={fruit}
          onFruitChange={setFruit}
          adding={adding}
          onToggleAdding={() => setAdding(!adding)}
        />
      </header>

      <div className="map-area">
        <TreeMap
          center={CENTER}
          trees={trees}
          publicTrees={publicTrees}
          clusters={clusters}
          onMapClick={handleMapClick}
          onViewChange={setView}
        />
        {status && <div className="status">{status}</div>}
      </div>
    </div>
  );
}

export default App;