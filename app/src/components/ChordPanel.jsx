const QUALITY_LABEL = {
  major: 'Maior',
  minor: 'Menor',
  diminished: 'Diminuto',
  augmented: 'Aumentado',
};

const QUALITY7_LABEL = {
  maj7:      'Maior com 7ª Maior',
  dominant7: 'Dominante com 7ª',
  minor7:    'Menor com 7ª',
  minMaj7:   'Menor com 7ª Maior',
  halfDim7:  'Meio-Diminuto (ø7)',
  dim7:      'Diminuto com 7ª dim.',
  augMaj7:   'Aumentado com 7ª Maior',
  aug7:      'Aumentado com 7ª',
};

const NOTE_NAMES = {
  'c': 'Dó', 'd': 'Ré', 'e': 'Mi', 'f': 'Fá',
  'g': 'Sol', 'a': 'Lá', 'b': 'Si',
};

function noteName(n) {
  const base = n[0].toLowerCase();
  const acc = n.slice(1);
  return (NOTE_NAMES[base] || n[0].toUpperCase()) + acc;
}

export default function ChordPanel({ chord, field, onNavigate, useTetrads }) {
  if (!chord) {
    return (
      <div className="chord-panel empty">
        <p>Clique em um acorde no grafo para ver os detalhes.</p>
      </div>
    );
  }

  const degreeIndex = chord.degree;
  const displayName = useTetrads ? chord.name7 : chord.id;
  const displayRoman = useTetrads ? chord.roman7 : chord.roman;
  const displayNotes = useTetrads ? chord.notes7 : chord.notes;
  const qualityLabel = useTetrads
    ? (QUALITY7_LABEL[chord.quality7] || QUALITY_LABEL[chord.quality])
    : QUALITY_LABEL[chord.quality];

  return (
    <div className="chord-panel">
      <div className="chord-panel-header">
        <span className="chord-panel-roman">{displayRoman}</span>
        <span className="chord-panel-name">{displayName}</span>
        <span className="chord-panel-quality">{qualityLabel}</span>
      </div>

      <div className="chord-panel-section">
        <div className="section-label">Notas</div>
        <div className="chord-notes">
          {displayNotes.map(n => (
            <span key={n} className="note-chip">{noteName(n)}</span>
          ))}
        </div>
      </div>

      <div className="chord-panel-section">
        <div className="section-label">Função no campo</div>
        <div className="chord-function">
          {degreeIndex === 0 && <span className="function-tag tonic">Tônica (I)</span>}
          {degreeIndex === 3 && <span className="function-tag subdominant">Subdominante (IV)</span>}
          {degreeIndex === 4 && <span className="function-tag dominant">Dominante (V)</span>}
          {![0, 3, 4].includes(degreeIndex) && (
            <span className="function-tag secondary">Acorde de passagem</span>
          )}
        </div>
      </div>

      <div className="chord-panel-section">
        <div className="section-label">Navegar para outro campo</div>
        <div className="modulation-hint">
          Estes acordes também são tônica em outras tonalidades:
        </div>
        <div className="related-chords">
          {field.nodes.map(node => {
            const nodeDisplay = useTetrads ? node.name7 : node.id;
            const nodeRoman = useTetrads ? node.roman7 : node.roman;
            return (
              <button
                key={node.id}
                className={`related-chip ${node.id === chord.id ? 'active' : ''}`}
                onClick={() => onNavigate(node)}
                title={`Explorar a partir de ${nodeDisplay}`}
              >
                {nodeRoman} — {nodeDisplay}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
