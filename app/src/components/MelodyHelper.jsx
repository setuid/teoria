import { useMemo } from 'react';
import { getMelodyGuide } from '../lib/melodyHelper';

export default function MelodyHelper({ activeChord, field, useTetrads }) {
  const guide = useMemo(
    () => getMelodyGuide(activeChord, field, useTetrads),
    [activeChord, field, useTetrads]
  );

  if (!activeChord) {
    return (
      <div className="melody-helper melody-helper-empty">
        <span className="mh-empty-icon">𝄞</span>
        <span className="mh-empty-text">Selecione um acorde para ver as notas para improvisar</span>
      </div>
    );
  }

  const chordLabel = useTetrads ? activeChord.name7 : activeChord.id;
  const romanLabel = useTetrads ? activeChord.roman7 : activeChord.roman;

  return (
    <div className="melody-helper">
      <div className="mh-header">
        <span className="mh-title">Melodia sobre</span>
        <span className={`mh-chord pb-chord-${activeChord.quality}`}>{chordLabel}</span>
        <span className="mh-roman">{romanLabel}</span>
        {activeChord.isBorrowed && (
          <span className="mh-borrow">empr. {activeChord.borrowedFromShort}</span>
        )}
      </div>

      <div className="mh-rows">
        {guide.safe.length > 0 && (
          <div className="mh-row mh-safe">
            <span className="mh-row-icon" title="Notas do acorde — sempre funcionam">✅</span>
            <div className="mh-notes">
              {guide.safe.map(n => (
                <span key={n} className="mh-note mh-note-safe">{n}</span>
              ))}
            </div>
          </div>
        )}

        {guide.color.length > 0 && (
          <div className="mh-row mh-color">
            <span className="mh-row-icon" title="Tensões disponíveis — adicionam cor">🎨</span>
            <div className="mh-notes">
              {guide.color.map(n => (
                <span key={n} className="mh-note mh-note-color">{n}</span>
              ))}
            </div>
          </div>
        )}

        {guide.avoid.length > 0 && (
          <div className="mh-row mh-avoid">
            <span className="mh-row-icon" title="Evitar — criam dissonância forte">⚠️</span>
            <div className="mh-notes">
              {guide.avoid.map(n => (
                <span key={n} className="mh-note mh-note-avoid">{n}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
