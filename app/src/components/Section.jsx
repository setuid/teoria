import { useState, useRef } from 'react';
import { playChord, startLoop, stopLoop } from '../lib/audioEngine';

const QUALITY7_COLOR = {
  maj7: 'chord-maj7', dominant7: 'chord-dom7', minor7: 'chord-min7',
  minMaj7: 'chord-minmaj7', halfDim7: 'chord-halfdim', dim7: 'chord-dim7',
};

function chordColor(node) {
  return QUALITY7_COLOR[node.quality7] || `pb-chord-${node.quality}`;
}

export default function Section({
  section, isActive, activeChord, bpm, useTetrads,
  onSelect, onUpdate, onRemove, onSelectChord, onLoopChange,
}) {
  const [looping, setLooping]   = useState(false);
  const [playing, setPlaying]   = useState(-1); // index of chord currently playing
  const [editing, setEditing]   = useState(false);
  const [nameVal, setNameVal]   = useState(section.name);
  const nameRef = useRef(null);

  const { chords } = section;

  function chordDisplayName(node) {
    return useTetrads ? node.name7 : node.id;
  }
  function chordDisplayRoman(node) {
    return useTetrads ? node.roman7 : node.roman;
  }

  function handleChordClick(node, idx) {
    const notes = useTetrads ? (node.notes7 || node.notes) : node.notes;
    playChord(notes, 1.8);
    onSelectChord(node);
  }

  function removeChord(idx, e) {
    e.stopPropagation();
    const updated = { ...section, chords: chords.filter((_, i) => i !== idx) };
    onUpdate(updated);
    if (activeChord?.id === chords[idx]?.id) onSelectChord(null);
  }

  function toggleLoop() {
    if (looping) {
      stopLoop();
      setLooping(false);
      setPlaying(-1);
      onLoopChange(false);
    } else {
      if (chords.length === 0) return;
      setLooping(true);
      onLoopChange(true);
      startLoop(
        chords,
        bpm,
        section.beatsPerChord,
        useTetrads,
        (idx) => setPlaying(idx),
      );
    }
  }

  function startEditing() {
    setEditing(true);
    setTimeout(() => nameRef.current?.select(), 0);
  }

  function commitName() {
    const trimmed = nameVal.trim();
    if (trimmed) onUpdate({ ...section, name: trimmed });
    else setNameVal(section.name);
    setEditing(false);
  }

  function handleNameKey(e) {
    if (e.key === 'Enter') commitName();
    if (e.key === 'Escape') { setNameVal(section.name); setEditing(false); }
  }

  function changeBeats(delta) {
    const next = Math.max(1, Math.min(8, section.beatsPerChord + delta));
    onUpdate({ ...section, beatsPerChord: next });
  }

  return (
    <div
      className={`section-card ${isActive ? 'section-active' : ''}`}
      onClick={!isActive ? onSelect : undefined}
    >
      {/* Section header */}
      <div className="section-head">
        <div className="section-head-left">
          {isActive && <span className="section-dot" title="Seção ativa (novos acordes vão aqui)" />}
          {editing ? (
            <input
              ref={nameRef}
              className="section-name-input"
              value={nameVal}
              onChange={e => setNameVal(e.target.value)}
              onBlur={commitName}
              onKeyDown={handleNameKey}
              autoFocus
            />
          ) : (
            <span
              className="section-name"
              onDoubleClick={startEditing}
              title="Duplo clique para renomear"
            >
              {section.name}
            </span>
          )}
          <span className="section-chord-count">{chords.length} acorde{chords.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="section-head-right">
          {/* Beats per chord */}
          <div className="section-beats" title="Tempos por acorde">
            <button className="section-beats-btn" onClick={() => changeBeats(-1)}>−</button>
            <span className="section-beats-val">{section.beatsPerChord}t</span>
            <button className="section-beats-btn" onClick={() => changeBeats(1)}>+</button>
          </div>

          {/* Loop button */}
          <button
            className={`section-loop-btn ${looping ? 'section-loop-active' : ''} ${chords.length === 0 ? 'section-loop-disabled' : ''}`}
            onClick={e => { e.stopPropagation(); toggleLoop(); }}
            title={looping ? 'Parar' : 'Tocar esta seção em loop'}
          >
            {looping ? '⏹' : '▶'}
          </button>

          {/* Remove section */}
          <button
            className="section-remove-btn"
            onClick={e => { e.stopPropagation(); onRemove(section.id); }}
            title="Remover seção"
          >
            ×
          </button>
        </div>
      </div>

      {/* Chord row */}
      <div className="section-chords">
        {chords.length === 0 ? (
          <span className="section-empty">
            {isActive ? 'Clique em um acorde abaixo para adicionar' : 'Vazio — clique para ativar'}
          </span>
        ) : (
          <>
            {chords.map((chord, i) => (
              <span key={i} className="section-chord-item">
                <button
                  className={`section-chord-pill ${chordColor(chord)} ${playing === i ? 'section-chord-playing' : ''}`}
                  onClick={() => handleChordClick(chord, i)}
                  title={`${chordDisplayRoman(chord)} — ${chordDisplayName(chord)}\nClique para ouvir`}
                >
                  <span className="scp-roman">{chordDisplayRoman(chord)}</span>
                  <span className="scp-name">{chordDisplayName(chord)}</span>
                  {chord.isBorrowed && (
                    <span className="scp-borrow">{chord.borrowedFromShort}</span>
                  )}
                  <button
                    className="scp-remove"
                    onClick={e => removeChord(i, e)}
                    title="Remover acorde"
                  >×</button>
                </button>
                {i < chords.length - 1 && <span className="section-arrow">→</span>}
              </span>
            ))}
            {isActive && <span className="section-arrow section-cursor">→ ?</span>}
          </>
        )}
      </div>

      {/* Text representation */}
      {chords.length > 1 && (
        <div className="section-text">
          {chords.map(c => {
            const n = chordDisplayName(c);
            return c.isBorrowed ? `${n}[${c.borrowedFromShort}]` : n;
          }).join(' → ')}
        </div>
      )}
    </div>
  );
}
