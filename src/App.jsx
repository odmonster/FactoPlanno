import { useState, useRef, useEffect } from 'react';
import pkg from '../package.json';
import {
  Factory, Cog, Pickaxe, Droplets, Fuel, Zap, Flame,
  Package, Boxes, Box, Split, GitMerge, Atom,
  Home, Trash2, Plus, Minus, MousePointer2,
  ChevronDown,
} from 'lucide-react';

// ===========================================================================
//  CORE
//  Everything is stored in PIXEL coordinates (world space). The camera scales
//  those to screen via `translate(x, y) scale(zoom)`. Snap math is then just
//  "round to the nearest multiple of the snap step" with no double-scale tom-foolery.
//
//  1 grid unit = 1 meter; rendered as GRID pixels at zoom=1.
//  1 block (major gridline square) = 8 units = 1 in-game foundation.
// ===========================================================================
const GRID = 26;              // pixels per unit at zoom=1
const BLOCK_UNITS = 8;        // units per block (major gridline)
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

// Snap resolutions, in units.
// Block = 1 foundation; half = LShift fine-snap
const SNAP = { block: BLOCK_UNITS, unit: 1, half: 0.5 };

//Round a world-px value to the nearest multiple of resolution units
const snap = (v, resolution) => {
  const step = resolution * GRID;
  return Math.round(v / step) * step;
};
// world px -> world units, rounded to nearest half-unit. display only, not for snap math.
const toUnits = (px) => Math.round(px / GRID * 2) / 2;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// Categories control palette grouping and the accent color of a building.
const CAT = {
  production: { name: 'Production', color: '#f5a623' },
  extraction: { name: 'Extraction', color: '#3ec77a' },
  power:      { name: 'Power',      color: '#e8506b' },
  logistics:  { name: 'Logistics',  color: '#2bb8d4' },
};

// Building definitions. w/h are in UNITS (1u = 1m), taken from the Satisfactory wiki, rounded to the nearest 0.5u.
// w = left-right, h = top-bottom (until rotation exists)
const BUILDINGS = {
  smelter:      { label: 'Smelter',         cat: 'production', w: 5,  h: 10,   icon: Flame },
  foundry:      { label: 'Foundry',         cat: 'production', w: 10, h: 10,   icon: Flame },
  constructor:  { label: 'Constructor',     cat: 'production', w: 8,  h: 10,   icon: Cog },
  assembler:    { label: 'Assembler',       cat: 'production', w: 9,  h: 16,   icon: Cog },
  manufacturer: { label: 'Manufacturer',    cat: 'production', w: 18, h: 20,   icon: Factory },
  refinery:     { label: 'Refinery',        cat: 'production', w: 10, h: 22,   icon: Droplets },
  packager:     { label: 'Packager',        cat: 'production', w: 8,  h: 8,    icon: Package },
  blender:      { label: 'Blender',         cat: 'production', w: 18, h: 16,   icon: Atom },

  miner:        { label: 'Miner',           cat: 'extraction', w: 6,  h: 14,   icon: Pickaxe },
  waterext:     { label: 'Water Extractor', cat: 'extraction', w: 20, h: 19.5, icon: Droplets },
  oilext:       { label: 'Oil Extractor',   cat: 'extraction', w: 8,  h: 14,   icon: Droplets },

  biomass:      { label: 'Biomass Burner',  cat: 'power',      w: 8,  h: 8,    icon: Flame },
  coalgen:      { label: 'Coal Generator',  cat: 'power',      w: 10, h: 26,   icon: Zap },
  fuelgen:      { label: 'Fuel Generator',  cat: 'power',      w: 20, h: 20,   icon: Fuel },
  nuclear:      { label: 'Nuclear Plant',   cat: 'power',      w: 36, h: 43,   icon: Atom },

  splitter:     { label: 'Splitter',        cat: 'logistics',  w: 4,  h: 4,    icon: Split },
  merger:       { label: 'Merger',          cat: 'logistics',  w: 4,  h: 4,    icon: GitMerge },
  storage:      { label: 'Storage',         cat: 'logistics',  w: 5,  h: 11,   icon: Box },
  indstorage:   { label: 'Ind. Storage',    cat: 'logistics',  w: 5,  h: 11,   icon: Boxes },
};

let _idc = 1;
const uid = () => _idc++;

// Defines an object's shape.
// Every new object is built here so the store never ends up with objects missing a field.
const makeObject = (type, x, y) => ({
  id: uid(), type, x, y,
  layer: 'machines', //layers by type later
  locked: false,
  parentGroupId: null,
})

// ===========================================================================
//  STARTING OBJECTS
//  The universal store: one array, every type lives in it. An object's x/y is
//  the CENTER of its footprint, in snapped pixel coords (e.g. x: 5*GRID = 5 units
//  from the world origin). Odd-sized footprints end up with edges on half-units.
// ===========================================================================
const INITIAL_OBJECTS = [
  makeObject('smelter',      3*GRID, 5*GRID),
  makeObject('constructor', 12*GRID, 5*GRID),
  makeObject('assembler',   23*GRID, 8*GRID),
];

// ===========================================================================
//  COMPONENT
// ===========================================================================
export default function App() {
  const viewportRef = useRef(null);

  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  // Always-current camera, for code that runs outside a fresh render (e.g. key handlers).
  const cameraRef = useRef(camera);
  cameraRef.current = camera;
  const [objects, setObjects] = useState(INITIAL_OBJECTS);
  const [selectedId, setSelectedId] = useState(null);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState({});
  const [cursor, setCursor] = useState({ x:0, y:0 }); //world px under mouse
  const [ tool, setTool ] = useState('select'); // select | a BUILDINGS key
  const [hovering, setHovering] = useState(false); // is the mouse over the canvas?

  const drag = useRef(null); // { mode: 'pan' | 'move' }

  // ---- helpers ----
  const getLocal = (e) => {
    const r = viewportRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const screenToWorld = (sx, sy) => ({
    x: (sx - camera.x) / camera.zoom,
    y: (sy - camera.y) / camera.zoom,
  });

  const hitTest = (wx, wy) => {
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      const def = BUILDINGS[obj.type];
      if (!def) continue;
      const hw = (def.w*GRID) / 2;
      const hh = (def.h*GRID) / 2;
      if (Math.abs(wx - obj.x) <= hw && Math.abs(wy - obj.y) <= hh) {
        return obj;
      }
    }
    return null;
  };

  // ---- pointer ----
  const onPointerDown = (e) => {
    if (e.target.closest('.corner, .inspector')) return; // ignore clicks on UI
    viewportRef.current.setPointerCapture(e.pointerId);
    const local = getLocal(e);

    // Pan: right-mouse, middle-mouse, or Space+left
    const isPan =
      e.button === 2 ||
      e.button === 1 ||
      (e.button === 0 && spaceHeld);

    if (isPan) {
      drag.current = { mode: 'pan', lastX: local.x, lastY: local.y };
      setIsDragging(true);
      return;
    }

    // Plain left-click: place a building if one is armed, otherwise select/move
    if (e.button === 0) {
      const w = screenToWorld(local.x, local.y);
      if (BUILDINGS[tool]) {
        setObjects((arr) => [...arr, makeObject(tool, snap(w.x, SNAP.unit), snap(w.y, SNAP.unit))]);
        return;
      }
      const hit = hitTest(w.x, w.y);

      if (hit) {
        setSelectedId(hit.id);
        drag.current = {
          mode: 'move',
          id: hit.id,
          // Offset between cursor and object's origin, in world px.
          // No need to snap this since we snap the final position on the way out.
          offsetX: w.x - hit.x,
          offsetY: w.y - hit.y,
        };
        setIsDragging(true);
      } else {
        setSelectedId(null);
      }
    }
  };

  const onPointerMove = (e) => {
    const local = getLocal(e);
    setCursor(screenToWorld(local.x, local.y));
    setHovering(true);

    if (!drag.current) return;

    if (drag.current.mode === 'pan') {
      const dx = local.x - drag.current.lastX;
      const dy = local.y - drag.current.lastY;
      drag.current.lastX = local.x;
      drag.current.lastY = local.y;
      setCamera((c) => ({ ...c, x: c.x + dx, y: c.y + dy }));
      return;
    }

    if (drag.current.mode === 'move') {
      const w = screenToWorld(local.x, local.y);
      const nx = snap(w.x - drag.current.offsetX, SNAP.unit);
      const ny = snap(w.y - drag.current.offsetY, SNAP.unit);
      const id = drag.current.id;
      setObjects((arr) =>
        arr.map((o) => (o.id === id ? { ...o, x: nx, y: ny } : o))
      );
    }
  };

  const onPointerUp = () => {
    drag.current = null;
    setIsDragging(false);
  };

  const onContextMenu = (e) => e.preventDefault(); // no right-click menu

  // ---- wheel zoom-to-cursor ----
  useEffect(() => {
    const el = viewportRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const sx = e.clientX - r.left;
      const sy = e.clientY - r.top;
      setCamera((c) => {
        const factor = Math.exp(-e.deltaY * 0.0015);
        const nz = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, c.zoom * factor));
        // Keep the world point under the cursor fixed during zoom.
        const wx = (sx - c.x) / c.zoom;
        const wy = (sy - c.y) / c.zoom;
        return { zoom: nz, x: sx - wx * nz, y: sy - wy * nz };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // ---- spacebar (for Space+left-drag pan) ----
  useEffect(() => {
    const down = (e) => { 
      if (e.code !== 'Space') return;
      if (document.activeElement?.tagName === 'BUTTON') document.activeElement.blur();
      setSpaceHeld(true)
    };
    const up   = (e) => { if (e.code === 'Space') setSpaceHeld(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // ---- keyboard ----
  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId != null) {
        e.preventDefault();
        setObjects((arr) => arr.filter((o) => o.id !== selectedId));
        setSelectedId(null);
      }
      if (e.key === 'Escape') {
        setTool('select');
        setSelectedId(null);
      }
      if (e.key === 'h' || e.key === 'H') {
        goHome();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

  // ---- home: animate camera to center world origin in the viewport ----
  const goHome = () => {
    const el = viewportRef.current;
    const r = el.getBoundingClientRect();
    const target = { x: r.width / 2, y: r.height / 2, zoom: 1 };
    const start = { ...cameraRef.current };
    const t0 = performance.now();
    const dur = 320;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = easeOutCubic(k);
      setCamera({
        x: start.x + (target.x - start.x) * e,
        y: start.y + (target.y - start.y) * e,
        zoom: start.zoom + (target.zoom - start.zoom) * e,
      });
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // Center on first mount.
  useEffect(() => { goHome(); }, []); // eslint-disable-line

  const zoomBy = (mult) => {
    const el = viewportRef.current;
    const r = el.getBoundingClientRect();
    const sx = r.width / 2, sy = r.height / 2;
    setCamera((c) => {
      const nz = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, c.zoom * mult));
      const wx = (sx - c.x) / c.zoom, wy = (sy - c.y) / c.zoom;
      return { zoom: nz, x: sx - wx * nz, y: sy - wy * nz };
    });
  };

  // ---- grid background (CSS-tiled gradients) ----
  const cell  = GRID * camera.zoom;
  const block = cell * BLOCK_UNITS;
  const minorLine = 'rgba(120,180,255,0.10)';
  const majorLine = 'rgba(120,180,255,0.22)';

  const gridStyle = {
    backgroundColor: '#0a1c33',
    backgroundImage: `
      linear-gradient(${majorLine} 1px, transparent 1px),
      linear-gradient(90deg, ${majorLine} 1px, transparent 1px),
      linear-gradient(${minorLine} 1px, transparent 1px),
      linear-gradient(90deg, ${minorLine} 1px, transparent 1px)`,
    backgroundSize: `${block}px ${block}px, ${block}px ${block}px, ${cell}px ${cell}px, ${cell}px ${cell}px`,
    backgroundPosition: `${camera.x}px ${camera.y}px`,
    cursor: isDragging ? 'grabbing' : (spaceHeld ? 'grab' : tool !== 'select' ? 'crosshair' : 'default'),
  };

  const worldTransform = `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`;
  const selectedObj = objects.find((o) => o.id === selectedId) || null;
  // Placement ghost: where the armed building would land if you clicked right now
  // Hidden while panning or when the mouse is outside the canvas
  const ghost = BUILDINGS[tool] && hovering && !spaceHeld && !isDragging
    ? { id: 'ghost', type: tool, x: snap(cursor.x, SNAP.unit), y: snap(cursor.y, SNAP.unit) }
    : null;

  // Group buildings by category for the palette UI.
  const grouped = Object.entries(CAT).map(([key, c]) => ({
    key, ...c,
    items: Object.entries(BUILDINGS).filter(([, d]) => d.cat === key),
  }));

  return (
    <div className="app-root">
      <style>{CSS}</style>

      {/* ===== LEFT PALETTE (click a building to arm it as the active tool) ===== */}
      <aside className="palette">
        <div className="brand">
          <div className="brand-mark">▦</div>
          <div>
            <div className="brand-title">FACTOPLANNO</div>
            <div className="brand-sub">v{pkg.version}</div>
          </div>
        </div>

        <button 
          className={`tool-row ${tool === 'select' ? 'on' : ''}`}
          onClick={() => setTool('select')}
        >
          <MousePointer2 size={15} /> Select / Move
        </button>

        <div className="palette-scroll">
          {grouped.map((g) => (
            <div className="cat" key={g.key}>
              <button
                className="cat-head"
                onClick={() => setCollapsedCats((c) => ({ ...c, [g.key]: !c[g.key] }))}
              >
                <ChevronDown size={13} className={collapsedCats[g.key] ? 'rot' : ''} />
                <span className="dot" style={{ background: g.color }} />
                {g.name}
              </button>
              {!collapsedCats[g.key] && (
                <div className="cat-items">
                  {g.items.map(([key, def]) => {
                    const Ic = def.icon;
                    return (
                      <button
                        key={key}
                        className={`bldg ${tool === key ? 'on' : ''}`}
                        style={{ '--accent': g.color }}
                        onClick={() => { setTool(key); setSelectedId(null) }}
                        title={`${def.label} · ${def.w}×${def.h}`}
                      >
                        <Ic size={15} />
                        <span className="bldg-label">{def.label}</span>
                        <span className="bldg-size">{def.w}×{def.h}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* ===== CANVAS ===== */}
      <main className="stage">
        <div
          ref={viewportRef}
          className="viewport"
          style={gridStyle}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={() => setHovering(false)}
          onContextMenu={onContextMenu}
        >
          <div
            className="world"
            style={{ transform: worldTransform }}
          >
            {/* origin crosshair at (0, 0) */}
            <div className="origin" />
            {objects.map((obj) => renderObject(obj, obj.id === selectedId))}
            {ghost && renderObject(ghost, false, true)}
          </div>

          {/* corner controls */}
          <div className="corner">
            <button className="round" title="Home (H)" onClick={goHome}>
              <Home size={16} />
            </button>
            <div className="zoomers">
              <button className="round" onClick={() => zoomBy(1.2)}><Plus size={16} /></button>
              <button className="round" onClick={() => zoomBy(1 / 1.2)}><Minus size={16} /></button>
            </div>
          </div>

          {selectedObj && (
            <Inspector
              obj={selectedObj}
              onDelete={() => {
                setObjects((arr) => arr.filter((o) => o.id !== selectedObj.id));
                setSelectedId(null);
              }}
            />
          )}
        </div>

        {/* status bar */}
        <div className="statusbar">
          <span>cursor <b>{Math.floor(cursor.x/GRID)}</b>, <b>{Math.floor(cursor.y/GRID)}</b></span>
          <span className="sep" />
          <span>zoom <b>{Math.round(camera.zoom * 100)}%</b></span>
          <span className="sep" />
          <span>{objects.length} objects</span>
          <span className="grow" />
          <span className="hint">
            {BUILDINGS[tool]
            ? 'click to place · Esc to stop'
            : 'right-drag / middle-drag / Space+drag to pan · scroll to zoom · H for home'}
          </span>
        </div>
      </main>
    </div>
  );
}

// ===========================================================================
//  RENDER DISPATCH
// ===========================================================================
function renderObject(obj, isSelected, isGhost = false) {
  const def = BUILDINGS[obj.type];
  if (!def) return null;
  const cat = CAT[def.cat];
  const Ic = def.icon;

  return (
    <div
      key={obj.id}
      className={`node ${isSelected ? 'sel' : ''} ${isGhost ? 'ghost' : ''}`}
      style={{
        left: obj.x - (def.w * GRID) / 2,
        top: obj.y - (def.h * GRID) / 2,
        width: def.w * GRID,
        height: def.h * GRID,
        '--accent': cat.color,
      }}
    >
      <Ic size={Math.min(Math.min(def.w, def.h) * GRID * 0.4, 48)} className="node-icon" />
      <span className="node-label">{def.label}</span>
    </div>
  );
}

// ===========================================================================
//  CONTEXT WIDGET
// ===========================================================================
function Inspector({ obj, onDelete }) {
  const def = BUILDINGS[obj.type];
  const cat = CAT[def.cat];
  return (
    <div className="inspector">
      <div className="insp-title" style={{ color: cat.color }}>{def.label}</div>
      <div className="insp-row">
        center {toUnits(obj.x)}, {toUnits(obj.y)} · {def.w}×{def.h}
      </div>
      <button className="del" onClick={onDelete}>
        <Trash2 size={13} /> Delete
      </button>
    </div>
  );
}

// ===========================================================================
//  STYLES
// ===========================================================================
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

* { box-sizing: border-box; }
.app-root {
  position: fixed; inset: 0; display: flex;
  font-family: 'JetBrains Mono', monospace;
  background: #061320; color: #cdd9e8; overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

/* ---- palette ---- */
.palette {
  width: 244px; flex-shrink: 0; display: flex; flex-direction: column;
  background: #08182a; border-right: 1px solid rgba(120,180,255,0.12);
}
.brand { display: flex; gap: 10px; align-items: center; padding: 16px 16px 14px; border-bottom: 1px solid rgba(120,180,255,0.1); }
.brand-mark { font-size: 22px; color: #f5a623; line-height: 1; }
.brand-title { font-family: 'Rajdhani'; font-weight: 700; letter-spacing: 2px; font-size: 15px; color: #eaf2ff; }
.brand-sub { font-size: 9.5px; color: #5b7186; letter-spacing: 1px; text-transform: uppercase; }

.tool-row {
  display: flex; align-items: center; gap: 8px; width: calc(100% - 20px); margin: 10px;
  padding: 9px 11px; border-radius: 7px; font-size: 12px; cursor: pointer;
  background: rgba(255,255,255,0.03); color: #c4d2e4; border: 1px solid rgba(120,180,255,0.1);
  font-family: 'JetBrains Mono', monospace;
}
.tool-row:hover { background: rgba(255,255,255,0.06); }
.tool-row.on { background: rgba(43,184,212,0.16); border-color: #2bb8d4; color: #eaf6fb; }

.palette-scroll { flex: 1; overflow-y: auto; padding: 0 8px 8px; }
.palette-scroll::-webkit-scrollbar { width: 8px; }
.palette-scroll::-webkit-scrollbar-thumb { background: rgba(120,180,255,0.18); border-radius: 4px; }

.cat { margin-top: 6px; }
.cat-head {
  display: flex; align-items: center; gap: 7px; width: 100%; padding: 7px 6px;
  background: none; border: 0; cursor: pointer; color: #9fb1c8;
  font-family: 'Rajdhani'; font-weight: 700; font-size: 12.5px; letter-spacing: 1.5px; text-transform: uppercase;
}
.cat-head .rot { transform: rotate(-90deg); }
.cat-head svg:first-child { transition: transform .15s; }
.dot { width: 8px; height: 8px; border-radius: 2px; }

.cat-items { display: flex; flex-direction: column; gap: 3px; padding: 2px 2px 6px; }
.bldg {
  display: flex; align-items: center; gap: 8px; padding: 7px 9px; border-radius: 6px;
  background: rgba(255,255,255,0.02); border: 1px solid transparent; cursor: pointer;
  color: #b9c7da; font-size: 11.5px; font-family: 'JetBrains Mono', monospace; text-align: left;
}
.bldg svg { color: var(--accent); flex-shrink: 0; }
.bldg:hover { background: rgba(255,255,255,0.06); }
.bldg.on { background: color-mix(in srgb, var(--accent) 18%, transparent); border-color: var(--accent); color: #fff; }
.bldg-label { flex: 1; }
.bldg-size { font-size: 9.5px; color: #5b7186; }

/* ---- stage ---- */
.stage { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.viewport { position: relative; flex: 1; overflow: hidden; touch-action: none; }
.world { position: absolute; left: 0; top: 0; width: 0; height: 0; transform-origin: 0 0; }

.origin {
  position: absolute; left: -7px; top: -7px; width: 14px; height: 14px;
  border: 1.5px solid rgba(245,166,35,0.7); border-radius: 50%; pointer-events: none;
}
.origin::before, .origin::after {
  content: ''; position: absolute; background: rgba(245,166,35,0.5);
}
.origin::before { left: 50%; top: -9px; width: 1px; height: 30px; transform: translateX(-25%); }
.origin::after  { top: 50%; left: -9px; height: 1px; width: 30px; transform: translateY(-25%); }

.node {
  position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 2px; border-radius: 3px; pointer-events: none; overflow: hidden;
  background: color-mix(in srgb, var(--accent) 22%, #0a1c33);
  border: 1.5px solid var(--accent);
  box-shadow: inset 0 0 12px color-mix(in srgb, var(--accent) 25%, transparent), 0 2px 8px rgba(0,0,0,0.4);
}
.node-icon { color: #fff; opacity: 0.92; }
.node-label {
  font-family: 'Rajdhani'; font-weight: 600; font-size: 10px; letter-spacing: 0.5px;
  color: #fff; opacity: 0.92; max-width: 95%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0,0,0,0.6);
}
.node.sel { box-shadow: 0 0 0 2px #fff, inset 0 0 14px color-mix(in srgb, var(--accent) 30%, transparent); }
.node.ghost { opacity: 0.45; border-style: dashed; }

/* ---- floating controls ---- */
.corner { position: absolute; left: 14px; bottom: 14px; display: flex; flex-direction: column; gap: 8px; }
.zoomers { display: flex; flex-direction: column; gap: 2px; }
.round {
  width: 36px; height: 36px; display: grid; place-items: center; cursor: pointer;
  background: rgba(10,28,51,0.85); border: 1px solid rgba(120,180,255,0.22);
  color: #cdd9e8; border-radius: 9px; backdrop-filter: blur(6px);
}
.round:hover { background: rgba(43,184,212,0.2); border-color: #2bb8d4; color: #fff; }
.zoomers .round { border-radius: 0; }
.zoomers .round:first-child { border-radius: 9px 9px 0 0; }
.zoomers .round:last-child  { border-radius: 0 0 9px 9px; border-top: 0; }

/* ---- inspector ---- */
.inspector {
  position: absolute; right: 14px; top: 14px; width: 200px; padding: 12px 13px;
  background: rgba(8,24,42,0.92); border: 1px solid rgba(120,180,255,0.2); border-radius: 10px;
  backdrop-filter: blur(8px);
}
.insp-title { font-family: 'Rajdhani'; font-weight: 700; font-size: 15px; letter-spacing: 1px; }
.insp-row { font-size: 10.5px; color: #8295ac; margin-top: 3px; }
.del {
  display: flex; align-items: center; gap: 6px; width: 100%; margin-top: 11px; padding: 7px;
  background: rgba(232,80,107,0.14); border: 1px solid rgba(232,80,107,0.4); border-radius: 6px;
  color: #f08a9c; font-size: 11px; cursor: pointer; font-family: 'JetBrains Mono', monospace;
}
.del:hover { background: rgba(232,80,107,0.25); }

/* ---- status bar ---- */
.statusbar {
  height: 30px; flex-shrink: 0; display: flex; align-items: center; gap: 12px; padding: 0 14px;
  background: #08182a; border-top: 1px solid rgba(120,180,255,0.12);
  font-size: 11px; color: #8295ac;
}
.statusbar b { color: #cfe0f3; font-weight: 500; }
.statusbar .sep { width: 1px; height: 12px; background: rgba(120,180,255,0.18); }
.statusbar .grow { flex: 1; }
.statusbar .hint { color: #61788f; font-size: 10.5px; }
`;