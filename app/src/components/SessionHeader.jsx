import { useState, useEffect } from 'react';
import { MOODS } from '../lib/moodPresets';
import { AVAILABLE_SCALES, AVAILABLE_NOTES } from '../lib/harmonicField';
import { startLoop, stopLoop, isLooping } from '../lib/audioEngine';
import { CURRENT_VERSION } from '../lib/changelog';

export default function SessionHeader({
  rootNote, scaleName, bpm, useTetrads, looping,
  sections, activeSectionId, field,
  onMoodSelect, onFieldChange, onBpmChange,
  onToggleTetrads, onLoopChange,
}) {
  const [showMoods, setShowMoods] = useState(false);
  const [bpmInput, setBpmInput]  = useState(String(bpm));

  useEffect(() => { setBpmInput(String(bpm)); }, [bpm]);

  const scaleLabel = AVAILABLE_SCALES.find(s => s.value === scaleName)?.label || scaleName;

  function handleMood(mood) {
    onMoodSelect(mood);
    setShowMoods(false);
  }

  function handleBpmBlur() {
    const val = parseInt(bpmInput, 10);
    if (!isNaN(val) && val >= 40 && val <= 300) {
      onBpmChange(val);
    } else {
      setBpmInput(String(bpm));
    }
  }

  function handleBpmKey(e) {
    if (e.key === 'Enter') e.target.blur();
  }

  function toggleLoop() {
    if (looping) {
      stopLoop();
      onLoopChange(false);
    } else {
      // Find first non-empty section to loop
      const activeSection = sections.find(s => s.id === activeSectionId);
      const target = (activeSection?.chords.length > 0 ? activeSection : sections.find(s => s.chords.length > 0));
      if (!target || target.chords.length === 0) return;

      startLoop(
        target.chords,
        bpm,
        target.beatsPerChord,
        useTetrads,
      );
      onLoopChange(true);
    }
  }

  const currentMood = MOODS.find(m =>
    m.root === rootNote && m.scale === scaleName
  );

  const canLoop = sections.some(s => s.chords.length > 0);

  return (
    <header className="session-header">
      {/* Left: app title */}
      <div className="sh-title">
        <span className="sh-title-main">Teoria</span>
        <span className="sh-version">v{CURRENT_VERSION}</span>
      </div>

      {/* Center: mood + key + bpm */}
      <div className="sh-controls">
        {/* Mood picker */}
        <div className="sh-mood-wrapper">
          <button
            className="sh-mood-btn"
            onClick={() => setShowMoods(v => !v)}
            title="Escolher mood / sentimento"
          >
            <span className="sh-mood-emoji">{currentMood?.emoji ?? '🎵'}</span>
            <span className="sh-mood-label">{currentMood?.label ?? 'Custom'}</span>
            <span className="sh-mood-arrow">▾</span>
          </button>
          {showMoods && (
            <div className="sh-mood-dropdown">
              {MOODS.map(m => (
                <button
                  key={m.label}
                  className={`sh-mood-option ${m.root === rootNote && m.scale === scaleName ? 'sh-mood-active' : ''}`}
                  onClick={() => handleMood(m)}
                >
                  <span>{m.emoji}</span>
                  <span className="sh-mood-opt-label">{m.label}</span>
                  <span className="sh-mood-opt-key">{m.root} {AVAILABLE_SCALES.find(s => s.value === m.scale)?.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="sh-sep">|</span>

        {/* Root note */}
        <select
          className="sh-select"
          value={rootNote}
          onChange={e => onFieldChange(e.target.value, scaleName)}
        >
          {AVAILABLE_NOTES.map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        {/* Scale */}
        <select
          className="sh-select sh-scale-select"
          value={scaleName}
          onChange={e => onFieldChange(rootNote, e.target.value)}
        >
          {AVAILABLE_SCALES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <span className="sh-sep">|</span>

        {/* BPM */}
        <div className="sh-bpm">
          <span className="sh-bpm-label">♩</span>
          <input
            className="sh-bpm-input"
            type="number"
            min={40} max={300}
            value={bpmInput}
            onChange={e => setBpmInput(e.target.value)}
            onBlur={handleBpmBlur}
            onKeyDown={handleBpmKey}
          />
        </div>

        <span className="sh-sep">|</span>

        {/* Tetrads toggle */}
        <button
          className={`sh-toggle ${useTetrads ? 'sh-toggle-on' : ''}`}
          onClick={onToggleTetrads}
          title={useTetrads ? 'Mostrar tétrades (7ª)' : 'Mostrar tríades'}
        >
          7ª
        </button>
      </div>

      {/* Right: loop button */}
      <button
        className={`sh-loop-btn ${looping ? 'sh-loop-active' : ''} ${!canLoop ? 'sh-loop-disabled' : ''}`}
        onClick={toggleLoop}
        title={looping ? 'Parar loop' : canLoop ? 'Tocar em loop' : 'Adicione acordes para tocar'}
      >
        {looping ? '⏹ Stop' : '▶ Loop'}
      </button>

      {/* Close mood dropdown on outside click */}
      {showMoods && (
        <div className="sh-mood-overlay" onClick={() => setShowMoods(false)} />
      )}
    </header>
  );
}
