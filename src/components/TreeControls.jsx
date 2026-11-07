import { FRUITS } from "../data/fruits";

function TreeControls({ fruit, onFruitChange, adding, onToggleAdding }) {
  return (
    <div className="controls">
      <select value={fruit} onChange={(e) => onFruitChange(e.target.value)}>
        {Object.keys(FRUITS).map((name) => (
          <option key={name} value={name}>
            {FRUITS[name]} {name}
          </option>
        ))}
      </select>

      <button className={adding ? "active" : ""} onClick={onToggleAdding}>
        {adding ? "Cancel" : "Add tree"}
      </button>
    </div>
  );
}

export default TreeControls;