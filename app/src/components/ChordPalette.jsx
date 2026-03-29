import { useState, useMemo } from 'react';
import { getBorrowedGroups } from '../lib/modalBorrowing';
import { getSuggestions } from '../lib/chordSuggestions';
import { playChord } from '../lib/audioEngine';

const QUALITY7_LABEL = {
  maj7: 'maj7', dominant7: 'Dom7', minor7: 'm7',
  minMaj7: 'mMaj7', halfDim7: 'ø7', dim7: '°7',
  augMaj7: '+Maj7', aug7: '+7',
};
const QUALITY_LABEL = {
  major: 'Maior', minor: 'Menor', diminished: 'Dim', augmented: 'Aum', dominant7: 'Dom7',
};

export default function ChordPalette({ field, activeChord, useTetrads, hasActiveSection, onAddChord }) {
  const [tab, setTab] = useState('diatonic');
  const [borrowMode, setBorrowMode] = useState(null);

  const borrowedGroups = useMemo(() => {
    if (!field) return [];
    return getBorrowedGroups(field.rootNote, field.scaleName);
  }, [field]);

  const activeBorrowGroup = borrowedGroups.find(g => g.scale === borrowMode) ?? borrowedGroups[0];

  const suggestions = useMemo(() => {
    if (!activeChord || !field) return null;
    return getSuggestions(activeChord, field, []);
  }, [activeChord, field]);

  if (!field) return null;
  const { nodes } = field;

  function chordName(node) { return useTetrads ? node.name7 : node.id; }
  function chordRoman(node) { return useTetrads ? node.roman7 : node.roman; }
  function qualityLabel(node) {
    if (useTetrads) return QUALITY7_LABEL[node.quality7] || QUALITY_LABEL[node.quality];
    return QUALITY_LABEL[node.quality];
  }

  function handleClick(node) {
    const notes = useTetrads ? (node.notes7 || node.notes) : node.notes;
    playChord(notes, 1.5);
    onAddChord(node);
  }

  const label = hasActiveSection ? 'Clique para adicionar' : 'Nenhuma seção ativa';

  return (
    <div className="chord-palette">
      {/* Palette header with tabs */}
      <div className="cp-header">
        <span className="cp-hint">{label}</span>
        <div className="cp-tabs">
          <button
            className={`cp-tab ${tab === 'diatonic' ? 'cp-tab-active' : ''}`}
            onClick={() => setTab('diatonic')}
          >
            Diatônico
          </button>
          <button
            className={`cp-tab ${tab === 'modal' ? 'cp-tab-active' : ''}`}
            onClick={() => setTab('modal')}
          >
            Empréstimos
          </button>
          <button
            className={`cp-tab ${tab === 'secondary' ? 'cp-tab-active' : ''} ${!activeChord ? 'cp-tab-dim' : ''}`}
            onClick={() => setTab('secondary')}
            title={!activeChord ? 'Selecione um acorde na seção primeiro' : ''}
          >
            Dom. Sec.
          </button>
          {activeChord && suggestions?.functional.length > 0 && (
            <button
              className={`cp-tab ${tab === 'functional' ? 'cp-tab-active' : ''}`}
              onClick={() => setTab('functional')}
            >
              Sugeridos
            </button>
          )}
        </div>
      </div>

      {/* Modal sub-tabs */}
      {tab === 'modal' && (
        <div className="cp-modal-tabs">
          {borrowedGroups.map(g => (
            <button
              key={g.scale}
              className={`cp-modal-tab ${activeBorrowGroup?.scale === g.scale ? 'cp-modal-tab-active' : ''}`}
              onClick={() => setBorrowMode(g.scale)}
            >
              {g.shortLabel}
              {g.exclusiveCount > 0 && <span className="cp-modal-count">{g.exclusiveCount}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Chord grid */}
      <div className="cp-grid">
        {tab === 'diatonic' && nodes.map(node => (
          <button
            key={node.id}
            className={`cp-chord pb-chord-${node.quality} ${activeChord?.id === node.id && !activeChord?.isBorrowed ? 'cp-chord-active' : ''}`}
            onClick={() => handleClick(node)}
            disabled={!hasActiveSection}
          >
            <span className="cp-roman">{chordRoman(node)}</span>
            <span className="cp-name">{chordName(node)}</span>
          </button>
        ))}

        {tab === 'modal' && activeBorrowGroup?.nodes.map(node => (
          <button
            key={node.id + '-' + node.degree}
            className={`cp-chord pb-chord-${node.quality} ${node.isExclusive ? 'cp-chord-excl' : 'cp-chord-shared'}`}
            onClick={() => handleClick(node)}
            disabled={!hasActiveSection}
            title={`${node.isExclusive ? 'Exclusivo de' : 'Compartilhado com'} ${activeBorrowGroup.label}`}
          >
            <span className="cp-roman">{chordRoman(node)}</span>
            <span className="cp-name">{chordName(node)}</span>
            {node.isExclusive && <span className="cp-excl-dot">●</span>}
          </button>
        ))}

        {tab === 'secondary' && !activeChord && (
          <span className="cp-empty">Selecione um acorde na progressão para ver os dominantes secundários</span>
        )}
        {tab === 'secondary' && activeChord && suggestions?.secondary.map(s => (
          <button
            key={s.id + '->' + s.resolvesToId}
            className="cp-chord pb-chord-dominant7"
            onClick={() => handleClick(s)}
            disabled={!hasActiveSection}
            title={s.label}
          >
            <span className="cp-roman">{s.roman}</span>
            <span className="cp-name">{s.id}</span>
            <span className="cp-resolve">→ {useTetrads ? (s.resolvesToNode?.name7 || s.resolvesToId) : s.resolvesToId}</span>
          </button>
        ))}

        {tab === 'functional' && activeChord && suggestions?.functional.map((s, i) => (
          <button
            key={i}
            className={`cp-chord pb-chord-${s.node.quality} cp-func-${s.style}`}
            onClick={() => handleClick(s.node)}
            disabled={!hasActiveSection}
            title={s.label}
          >
            <span className="cp-roman">{chordRoman(s.node)}</span>
            <span className="cp-name">{chordName(s.node)}</span>
            <span className="cp-func-label">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
