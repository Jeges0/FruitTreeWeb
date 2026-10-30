import { useState } from "react";
import TreeMap from "./components/TreeMap";
import TreeControls from "./components/TreeControls";
import "./App.css";

const CENTER = [47.4979, 19.0402]; // Budapest, change to your area

function App() {
  const [trees, setTrees] = useState([
    { id: 1, fruit: "Pear", position: CENTER },
  ]);
  const [fruit, setFruit] = useState("Apple");
  const [adding, setAdding] = useState(false);

  function handleMapClick(position) {
    if (!adding) return;
    setTrees((prev) => [...prev, { id: Date.now(), fruit, position }]);
    setAdding(false);
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🍎 Fruttree</h1>
        <TreeControls
          fruit={fruit}
          onFruitChange={setFruit}
          adding={adding}
          onToggleAdding={() => setAdding(!adding)}
        />
      </header>

      {adding && (
        <div className="hint">Click on the map to place your {fruit} tree.</div>
      )}

      <TreeMap center={CENTER} trees={trees} onMapClick={handleMapClick} />
    </div>
  );
}

export default App;