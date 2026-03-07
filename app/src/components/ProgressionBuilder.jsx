import { useState, useMemo } from 'react';
import { getSuggestions } from '../lib/chordSuggestions';
import { AVAILABLE_SCALES } from '../lib/harmonicField';

const QUALITY_LABEL = {
  major: 'Maior',
  minor: 'Menor',
  diminished: 'Diminuto',
  augmented: 'Aumentado',
  dominant7: 'Dom7',
};

export default function ProgressionBuilder({ field, rootNote, scaleName }) {
  const [progression, setProgression] = useState([]);
  const [activeChord, setActiveChord] = useState(null);

  const scaleLabel = AVAILABLE_SCALES.find(s => s.value === scaleName)?.label || scaleName;

  const suggestions = useMemo(() => {
    if (!activeChord || !field) return null;
    return getSuggestions(activeChord, field, progression.slice(0, -1));
  }, [activeChord, field, progression]);

  if (!field) return null;
  const { nodes } = field;

  function startWithChord(node) {
    setProgression([node]);
    setActiveChord(node);
  }

  function addChord(node) {
    setProgression(p => [...p, node]);
    setActiveChord(node);
  }

  function selectInProgression(index) {
    const chord = progression[index];
    setProgression(p => p.slice(0, index + 1));
    setActiveChord(chord);
  }

  function clearProgression() {
    setProgression([]);
    setActiveChord(null);
  }

  const isStarted = progression.length > 0;

  return (
    <div className="progression-builder">

      {/* Harmonic Field */}
      <section className="pb-field">
        <div className="pb-field-header">
          <h3 className="pb-section-title">
            Campo Harmônico — <strong>{rootNote} {scaleLabel}</strong>
          </h3>
          {isStarted && (
            <span className="pb-field-hint">
              {isStarted ? 'Clique para adicionar diretamente à progressão' : ''}
            </span>
          )}
        </div>
        <div className="pb-field-chords">
          {nodes.map(node => (
            <button
              key={node.id}
              className={`pb-chord-card pb-chord-${node.quality} ${activeChord?.id === node.id && activeChord?.degree === node.degree ? 'pb-chord-active' : ''}`}
              onClick={() => isStarted ? addChord(node) : startWithChord(node)}
              title={isStarted ? `Adicionar ${node.id} à progressão` : `Começar com ${node.id}`}
            >
              <span className="pb-chord-roman">{node.roman}</span>
              <span className="pb-chord-name">{node.id}</span>
              <span className="pb-chord-quality">{QUALITY_LABEL[node.quality]}</span>
            </button>
          ))}
        </div>
        {!isStarted && (
          <p className="pb-hint">↑ Clique em um acorde para começar sua progressão</p>
        )}
      </section>

      {/* Suggestions Panel */}
      {suggestions && activeChord && (
        <section className="pb-suggestions">
          <h3 className="pb-section-title">
            Próximos acordes a partir de{' '}
            <span className={`pb-active-badge pb-chord-${activeChord.quality || 'major'}`}>
              {activeChord.roman} — {activeChord.id}
            </span>
          </h3>

          {/* Progression hints */}
          {suggestions.progressionHints.length > 0 && (
            <div className="pb-hints-bar">
              {suggestions.progressionHints.map((h, i) => (
                <span key={i} className="pb-prog-hint">
                  🎵 Você está dentro de uma progressão <strong>{h.name}</strong>
                  {h.suggestedDegree !== undefined && (
                    <> — próximo sugerido: <strong>{nodes[h.suggestedDegree]?.id}</strong></>
                  )}
                </span>
              ))}
            </div>
          )}

          <div className="pb-suggestion-groups">
            {/* Functional movements */}
            <div className="pb-suggestion-group">
              <h4 className="pb-group-title">Movimentos Funcionais e Cadências</h4>
              <div className="pb-suggestion-list">
                {suggestions.functional.map((s, i) => (
                  <button
                    key={i}
                    className={`pb-suggestion pb-suggestion-${s.style} pb-chord-${s.node.quality}`}
                    onClick={() => addChord(s.node)}
                    title={s.label}
                  >
                    <span className="pb-sug-roman">{s.node.roman}</span>
                    <span className="pb-sug-name">{s.node.id}</span>
                    <span className="pb-sug-label">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* All diatonic chords */}
            <div className="pb-suggestion-group">
              <h4 className="pb-group-title">Campo Harmônico (todos os acordes)</h4>
              <div className="pb-suggestion-list">
                {suggestions.diatonic.map(node => (
                  <button
                    key={node.id}
                    className={`pb-suggestion pb-chord-${node.quality}`}
                    onClick={() => addChord(node)}
                  >
                    <span className="pb-sug-roman">{node.roman}</span>
                    <span className="pb-sug-name">{node.id}</span>
                    <span className="pb-sug-label">{QUALITY_LABEL[node.quality]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Secondary dominants */}
            <div className="pb-suggestion-group">
              <h4 className="pb-group-title">Dominantes Secundários (cromatismo)</h4>
              <div className="pb-suggestion-list">
                {suggestions.secondary.map(s => (
                  <button
                    key={s.id + '->' + s.resolvesToId}
                    className="pb-suggestion pb-chord-dominant7"
                    onClick={() => addChord(s)}
                    title={s.label}
                  >
                    <span className="pb-sug-roman">{s.roman}</span>
                    <span className="pb-sug-name">{s.id}</span>
                    <span className="pb-sug-label">→ {s.resolvesToId}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Progression Timeline */}
      {progression.length > 0 && (
        <section className="pb-timeline">
          <div className="pb-timeline-header">
            <h3 className="pb-section-title">Progressão</h3>
            <button className="pb-clear-btn" onClick={clearProgression}>Limpar</button>
          </div>
          <div className="pb-timeline-scroll">
            <div className="pb-timeline-chords">
              {progression.map((chord, i) => (
                <span key={i} className="pb-timeline-item">
                  <button
                    className={`pb-timeline-chord pb-chord-${chord.quality || 'major'} ${i === progression.length - 1 ? 'pb-timeline-active' : ''}`}
                    onClick={() => selectInProgression(i)}
                    title={`${chord.roman} — ${chord.id}${i === progression.length - 1 ? ' (acorde atual)' : '\nClique para voltar a este ponto'}`}
                  >
                    <span className="pb-tl-roman">{chord.roman || chord.id}</span>
                    <span className="pb-tl-name">{chord.id}</span>
                  </button>
                  {i < progression.length - 1 && (
                    <span className="pb-arrow">→</span>
                  )}
                </span>
              ))}
              {activeChord && (
                <span className="pb-timeline-cursor">
                  <span className="pb-arrow">→</span>
                  <span className="pb-cursor-label">?</span>
                </span>
              )}
            </div>
          </div>
          {progression.length > 1 && (
            <div className="pb-timeline-text">
              {progression.map(c => c.id).join(' → ')}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
