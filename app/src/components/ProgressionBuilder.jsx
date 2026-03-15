import { useState, useMemo } from 'react';
import { getSuggestions } from '../lib/chordSuggestions';
import { AVAILABLE_SCALES } from '../lib/harmonicField';
import { getBorrowedGroups } from '../lib/modalBorrowing';

const QUALITY7_LABEL = {
  maj7: 'maj7', dominant7: 'Dom7', minor7: 'm7',
  minMaj7: 'mMaj7', halfDim7: 'ø7', dim7: '°7',
  augMaj7: '+Maj7', aug7: '+7',
};

const QUALITY_LABEL = {
  major: 'Maior', minor: 'Menor', diminished: 'Dim',
  augmented: 'Aum', dominant7: 'Dom7',
};

export default function ProgressionBuilder({ field, rootNote, scaleName, useTetrads }) {
  const [progression, setProgression] = useState([]);
  const [activeChord, setActiveChord] = useState(null);
  const [pickerTab, setPickerTab] = useState('diatonic');
  const [activeBorrowMode, setActiveBorrowMode] = useState(null);

  const scaleLabel = AVAILABLE_SCALES.find(s => s.value === scaleName)?.label || scaleName;

  const suggestions = useMemo(() => {
    if (!activeChord || !field) return null;
    return getSuggestions(activeChord, field, progression.slice(0, -1));
  }, [activeChord, field, progression]);

  const borrowedGroups = useMemo(
    () => getBorrowedGroups(rootNote, scaleName),
    [rootNote, scaleName]
  );

  const activeBorrowGroup =
    borrowedGroups.find(g => g.scale === activeBorrowMode) ?? borrowedGroups[0];

  if (!field) return null;
  const { nodes } = field;

  function chordName(node) { return useTetrads ? node.name7 : node.id; }
  function chordRoman(node) { return useTetrads ? node.roman7 : node.roman; }
  function chordQuality(node) {
    if (useTetrads) return QUALITY7_LABEL[node.quality7] || QUALITY_LABEL[node.quality];
    return QUALITY_LABEL[node.quality];
  }

  function addChord(node) {
    setProgression(p => [...p, node]);
    setActiveChord(node);
  }

  function selectAtIndex(i) {
    setProgression(p => p.slice(0, i + 1));
    setActiveChord(progression[i]);
  }

  function clear() {
    setProgression([]);
    setActiveChord(null);
  }

  const isStarted = progression.length > 0;

  return (
    <div className="pb2">

      {/* ===== PROGRESSÃO (topo, proeminente) ===== */}
      <section className="pb2-prog">
        <div className="pb2-prog-header">
          <span className="pb2-label">PROGRESSÃO</span>
          {isStarted && (
            <button className="pb2-clear-btn" onClick={clear}>Limpar</button>
          )}
        </div>

        {!isStarted ? (
          <div className="pb2-prog-empty">
            Escolha um acorde abaixo para começar
          </div>
        ) : (
          <>
            <div className="pb2-prog-row">
              {progression.map((chord, i) => (
                <span key={i} className="pb2-prog-item">
                  <button
                    className={`pb2-prog-chord pb-chord-${chord.quality} ${i === progression.length - 1 ? 'pb2-prog-active' : ''} ${chord.isBorrowed ? 'pb2-prog-borrowed' : ''}`}
                    onClick={() => selectAtIndex(i)}
                    title={i === progression.length - 1 ? 'Acorde atual' : 'Voltar a este ponto'}
                  >
                    <span className="pb2-pc-roman">{chordRoman(chord)}</span>
                    <span className="pb2-pc-name">{chordName(chord)}</span>
                    {chord.isBorrowed && (
                      <span className="pb2-pc-borrow">{chord.borrowedFromShort}</span>
                    )}
                  </button>
                  {i < progression.length - 1 && <span className="pb2-arrow">→</span>}
                </span>
              ))}
              {activeChord && (
                <span className="pb2-prog-item">
                  <span className="pb2-arrow">→</span>
                  <span className="pb2-cursor">?</span>
                </span>
              )}
            </div>
            {progression.length > 1 && (
              <div className="pb2-prog-text">
                {progression.map(c => {
                  const n = chordName(c);
                  return c.isBorrowed ? `${n}[${c.borrowedFromShort}]` : n;
                }).join(' → ')}
              </div>
            )}
          </>
        )}
      </section>

      {/* ===== SUGESTÕES FUNCIONAIS (quando há acorde ativo) ===== */}
      {suggestions && activeChord && (
        <section className="pb2-next">
          <div className="pb2-next-header">
            <span className="pb2-label">
              PRÓXIMO após{' '}
              <span className={`pb2-active-name pb-chord-${activeChord.quality}`}>
                {chordName(activeChord)}
              </span>
              {activeChord.isBorrowed && (
                <span className="pb2-borrow-tag">empr. {activeChord.borrowedFromShort}</span>
              )}
            </span>
          </div>

          {/* Movimentos funcionais como linha compacta */}
          {suggestions.functional.length > 0 && (
            <div className="pb2-func-row">
              {suggestions.functional.map((s, i) => (
                <button
                  key={i}
                  className={`pb2-func-btn pb-chord-${s.node.quality} pb2-func-${s.style}`}
                  onClick={() => addChord(s.node)}
                  title={s.label}
                >
                  <span className="pb2-fb-roman">{chordRoman(s.node)}</span>
                  <span className="pb2-fb-name">{chordName(s.node)}</span>
                  <span className="pb2-fb-label">{s.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Padrões reconhecidos como badges compactas */}
          {suggestions.progressionHints.length > 0 && (
            <div className="pb2-patterns">
              {suggestions.progressionHints.slice(0, 4).map((h, i) => (
                <span key={i} className="pb2-pattern-badge">
                  <span className="pb2-pattern-name">{h.name}</span>
                  {h.suggestedDegree !== undefined && (
                    <button
                      className="pb2-pattern-suggest"
                      onClick={() => addChord(nodes[h.suggestedDegree])}
                    >
                      → {chordName(nodes[h.suggestedDegree])}
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ===== PICKER DE ACORDES (abas) ===== */}
      <section className="pb2-picker">
        <div className="pb2-picker-header">
          <span className="pb2-label">
            {rootNote} {scaleLabel}
          </span>
          <div className="pb2-tabs">
            <button
              className={`pb2-tab ${pickerTab === 'diatonic' ? 'pb2-tab-active' : ''}`}
              onClick={() => setPickerTab('diatonic')}
            >
              Diatônico
            </button>
            <button
              className={`pb2-tab ${pickerTab === 'modal' ? 'pb2-tab-active' : ''}`}
              onClick={() => setPickerTab('modal')}
            >
              Empréstimos
            </button>
            <button
              className={`pb2-tab ${pickerTab === 'secondary' ? 'pb2-tab-active' : ''} ${!activeChord ? 'pb2-tab-dim' : ''}`}
              onClick={() => setPickerTab('secondary')}
              title={!activeChord ? 'Selecione um acorde para ver dominantes secundários' : ''}
            >
              Dom. Sec.
            </button>
          </div>
        </div>

        {/* Sub-abas de modo para empréstimos */}
        {pickerTab === 'modal' && (
          <div className="pb2-modal-tabs">
            {borrowedGroups.map(g => (
              <button
                key={g.scale}
                className={`pb2-modal-tab ${activeBorrowGroup?.scale === g.scale ? 'pb2-modal-tab-active' : ''}`}
                onClick={() => setActiveBorrowMode(g.scale)}
              >
                {g.shortLabel}
                {g.exclusiveCount > 0 && (
                  <span className="pb2-modal-count">{g.exclusiveCount}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Grade de acordes */}
        <div className="pb2-palette">
          {pickerTab === 'diatonic' && nodes.map(node => (
            <button
              key={node.id}
              className={`pb2-chord pb-chord-${node.quality} ${activeChord?.id === node.id && activeChord?.degree === node.degree ? 'pb2-chord-active' : ''}`}
              onClick={() => addChord(node)}
            >
              <span className="pb2-c-roman">{chordRoman(node)}</span>
              <span className="pb2-c-name">{chordName(node)}</span>
            </button>
          ))}

          {pickerTab === 'modal' && activeBorrowGroup?.nodes.map(node => (
            <button
              key={node.id + '-' + node.degree}
              className={`pb2-chord pb-chord-${node.quality} ${node.isExclusive ? 'pb2-chord-excl' : 'pb2-chord-shared'}`}
              onClick={() => addChord(node)}
              title={`${node.isExclusive ? 'Exclusivo de' : 'Compartilhado com'} ${activeBorrowGroup.label}`}
            >
              <span className="pb2-c-roman">{chordRoman(node)}</span>
              <span className="pb2-c-name">{chordName(node)}</span>
              {node.isExclusive && <span className="pb2-c-tag">●</span>}
            </button>
          ))}

          {pickerTab === 'secondary' && !activeChord && (
            <div className="pb2-palette-empty">
              Adicione um acorde à progressão para ver os dominantes secundários disponíveis
            </div>
          )}

          {pickerTab === 'secondary' && activeChord && suggestions?.secondary.map(s => (
            <button
              key={s.id + '->' + s.resolvesToId}
              className="pb2-chord pb-chord-dominant7"
              onClick={() => addChord(s)}
              title={s.label}
            >
              <span className="pb2-c-roman">{s.roman}</span>
              <span className="pb2-c-name">{s.id}</span>
              <span className="pb2-c-resolve">→ {useTetrads ? (s.resolvesToNode?.name7 || s.resolvesToId) : s.resolvesToId}</span>
            </button>
          ))}
        </div>
      </section>

    </div>
  );
}
