import { useState, useMemo } from 'react';
import Controls from './components/Controls';
import HarmonicGraph from './components/HarmonicGraph';
import ChordPanel from './components/ChordPanel';
import { buildHarmonicField, toTeoriaNote, AVAILABLE_SCALES } from './lib/harmonicField';
import './App.css';

const DEFAULT_ROOT = 'A';
const DEFAULT_SCALE = 'minor';

export default function App() {
  const [rootNote, setRootNote] = useState(DEFAULT_ROOT);
  const [scaleName, setScaleName] = useState(DEFAULT_SCALE);
  const [selectedChord, setSelectedChord] = useState(null);
  const [history, setHistory] = useState([]);

  const field = useMemo(() => {
    try {
      return buildHarmonicField(toTeoriaNote(rootNote), scaleName);
    } catch (e) {
      console.error('Error building harmonic field:', e);
      return null;
    }
  }, [rootNote, scaleName]);

  const scaleLabel = AVAILABLE_SCALES.find(s => s.value === scaleName)?.label || scaleName;

  function handleChange(newRoot, newScale) {
    setRootNote(newRoot);
    setScaleName(newScale);
    setSelectedChord(null);
  }

  function handleSelectChord(chord) {
    setSelectedChord(chord);
  }

  // Navigate: use a chord as the new tonic (modulate)
  function handleNavigate(node) {
    const newRoot = node.root[0].toUpperCase() + node.root.slice(1);
    setHistory(h => [...h, { rootNote, scaleName }]);
    setRootNote(newRoot);
    // Keep same scale type for exploration
    setSelectedChord(null);
  }

  function handleBack() {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setRootNote(prev.rootNote);
    setScaleName(prev.scaleName);
    setSelectedChord(null);
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <span className="app-title-main">Explorador Harmônico</span>
          <span className="app-title-sub">teoria.js</span>
        </div>
        <div className="header-field-info">
          Campo de <strong>{rootNote} {scaleLabel}</strong>
        </div>
        {history.length > 0 && (
          <button className="back-btn" onClick={handleBack}>
            ← Voltar
          </button>
        )}
      </header>

      <Controls rootNote={rootNote} scaleName={scaleName} onChange={handleChange} />

      <main className="app-main">
        <div className="graph-container">
          {field ? (
            <HarmonicGraph
              field={field}
              selectedId={selectedChord?.id}
              onSelect={handleSelectChord}
            />
          ) : (
            <div className="graph-error">Erro ao construir o campo harmônico.</div>
          )}
        </div>
        <aside className="panel-container">
          <ChordPanel
            chord={selectedChord}
            field={field}
            onNavigate={handleNavigate}
          />
        </aside>
      </main>
    </div>
  );
}
