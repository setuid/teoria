import { useState, useMemo } from 'react';
import { getSuggestions } from '../lib/chordSuggestions';
import { AVAILABLE_SCALES } from '../lib/harmonicField';
import { getBorrowedGroups } from '../lib/modalBorrowing';

const QUALITY_LABEL = {
  major:      'Maior',
  minor:      'Menor',
  diminished: 'Diminuto',
  augmented:  'Aumentado',
  dominant7:  'Dom7',
};

const QUALITY7_LABEL = {
  maj7:      'maj7',
  dominant7: 'Dom7',
  minor7:    'm7',
  minMaj7:   'mMaj7',
  halfDim7:  'ø7',
  dim7:      '°7',
  augMaj7:   '+Maj7',
  aug7:      '+7',
};

export default function ProgressionBuilder({ field, rootNote, scaleName, useTetrads }) {
  const [progression, setProgression] = useState([]);
  const [activeChord, setActiveChord] = useState(null);
  const [activeBorrowMode, setActiveBorrowMode] = useState(null); // set after first render

  const scaleLabel = AVAILABLE_SCALES.find(s => s.value === scaleName)?.label || scaleName;

  const suggestions = useMemo(() => {
    if (!activeChord || !field) return null;
    return getSuggestions(activeChord, field, progression.slice(0, -1));
  }, [activeChord, field, progression]);

  const borrowedGroups = useMemo(() => {
    return getBorrowedGroups(rootNote, scaleName);
  }, [rootNote, scaleName]);

  // Default to first group when groups change
  const activeBorrowGroup = borrowedGroups.find(g => g.scale === activeBorrowMode)
    ?? borrowedGroups[0];

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

  function chordDisplayName(node) {
    return useTetrads ? node.name7 : node.id;
  }

  function chordDisplayRoman(node) {
    return useTetrads ? node.roman7 : node.roman;
  }

  function chordQualityLabel(node) {
    if (useTetrads) return QUALITY7_LABEL[node.quality7] || QUALITY_LABEL[node.quality];
    return QUALITY_LABEL[node.quality];
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
            <span className="pb-field-hint">Clique para adicionar diretamente à progressão</span>
          )}
        </div>
        <div className="pb-field-chords">
          {nodes.map(node => (
            <button
              key={node.id}
              className={`pb-chord-card pb-chord-${node.quality} ${activeChord?.id === node.id && activeChord?.degree === node.degree ? 'pb-chord-active' : ''}`}
              onClick={() => isStarted ? addChord(node) : startWithChord(node)}
              title={isStarted ? `Adicionar ${chordDisplayName(node)} à progressão` : `Começar com ${chordDisplayName(node)}`}
            >
              <span className="pb-chord-roman">{chordDisplayRoman(node)}</span>
              <span className="pb-chord-name">{chordDisplayName(node)}</span>
              <span className="pb-chord-quality">{chordQualityLabel(node)}</span>
            </button>
          ))}
        </div>
        {!isStarted && (
          <p className="pb-hint">↑ Clique em um acorde para começar sua progressão</p>
        )}
      </section>

      {/* Modal Borrowing Panel */}
      <section className="pb-borrow">
        <div className="pb-borrow-header">
          <h3 className="pb-section-title pb-borrow-title">
            Empréstimos Modais
            <span className="pb-borrow-subtitle">acordes de modos paralelos de {rootNote}</span>
          </h3>
          <div className="pb-borrow-tabs">
            {borrowedGroups.map(group => (
              <button
                key={group.scale}
                className={`pb-borrow-tab ${activeBorrowGroup?.scale === group.scale ? 'pb-borrow-tab-active' : ''}`}
                onClick={() => setActiveBorrowMode(group.scale)}
                title={group.label}
              >
                {group.shortLabel}
                {group.exclusiveCount > 0 && (
                  <span className="pb-borrow-tab-count">{group.exclusiveCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {activeBorrowGroup && (
          <div className="pb-borrow-body">
            <div className="pb-borrow-legend">
              <span className="pb-borrow-legend-exclusive">exclusivo</span>
              <span className="pb-borrow-legend-shared">compartilhado</span>
              <span className="pb-borrow-legend-text">— clique para adicionar à progressão</span>
            </div>
            <div className="pb-borrow-chords">
              {activeBorrowGroup.nodes.map(node => (
                <button
                  key={node.id + '-' + node.degree}
                  className={`pb-borrow-card pb-chord-${node.quality} ${node.isExclusive ? 'pb-borrow-exclusive' : 'pb-borrow-shared'}`}
                  onClick={() => isStarted ? addChord(node) : startWithChord(node)}
                  title={`${node.isExclusive ? 'Exclusivo de' : 'Compartilhado com'} ${activeBorrowGroup.label}`}
                >
                  <span className="pb-chord-roman">{chordDisplayRoman(node)}</span>
                  <span className="pb-chord-name">{chordDisplayName(node)}</span>
                  <span className="pb-chord-quality">{chordQualityLabel(node)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Suggestions Panel */}
      {suggestions && activeChord && (
        <section className="pb-suggestions">
          <h3 className="pb-section-title">
            Próximos acordes a partir de{' '}
            <span className={`pb-active-badge pb-chord-${activeChord.quality || 'major'}`}>
              {chordDisplayRoman(activeChord)} — {chordDisplayName(activeChord)}
            </span>
            {activeChord.isBorrowed && (
              <span className="pb-borrowed-source-badge">empr. {activeChord.borrowedFromShort}</span>
            )}
          </h3>

          {/* Progression hints */}
          {suggestions.progressionHints.length > 0 && (
            <div className="pb-hints-bar">
              {suggestions.progressionHints.map((h, i) => (
                <span key={i} className="pb-prog-hint">
                  🎵 Você está dentro de uma progressão <strong>{h.name}</strong>
                  {h.suggestedDegree !== undefined && (
                    <> — próximo sugerido: <strong>{chordDisplayName(nodes[h.suggestedDegree])}</strong></>
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
                    <span className="pb-sug-roman">{chordDisplayRoman(s.node)}</span>
                    <span className="pb-sug-name">{chordDisplayName(s.node)}</span>
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
                    <span className="pb-sug-roman">{chordDisplayRoman(node)}</span>
                    <span className="pb-sug-name">{chordDisplayName(node)}</span>
                    <span className="pb-sug-label">{chordQualityLabel(node)}</span>
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
                    <span className="pb-sug-label">→ {useTetrads ? (s.resolvesToNode?.name7 || s.resolvesToId) : s.resolvesToId}</span>
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
                    className={`pb-timeline-chord pb-chord-${chord.quality || 'major'} ${i === progression.length - 1 ? 'pb-timeline-active' : ''} ${chord.isBorrowed ? 'pb-timeline-borrowed' : ''}`}
                    onClick={() => selectInProgression(i)}
                    title={`${chordDisplayRoman(chord)} — ${chordDisplayName(chord)}${chord.isBorrowed ? ` (empr. ${chord.borrowedFromShort})` : ''}${i === progression.length - 1 ? '\n(acorde atual)' : '\nClique para voltar a este ponto'}`}
                  >
                    <span className="pb-tl-roman">{chordDisplayRoman(chord) || chordDisplayName(chord)}</span>
                    <span className="pb-tl-name">{chordDisplayName(chord)}</span>
                    {chord.isBorrowed && (
                      <span className="pb-tl-borrow-badge">{chord.borrowedFromShort}</span>
                    )}
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
              {progression.map(c => {
                const name = chordDisplayName(c);
                return c.isBorrowed ? `${name}[${c.borrowedFromShort}]` : name;
              }).join(' → ')}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
