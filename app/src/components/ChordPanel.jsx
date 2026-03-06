const QUALITY_LABEL = {
  major: 'Maior',
  minor: 'Menor',
  diminished: 'Diminuto',
  augmented: 'Aumentado',
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

export default function ChordPanel({ chord, field, onNavigate }) {
  if (!chord) {
    return (
      <div className="chord-panel empty">
        <p>Clique em um acorde no grafo para ver os detalhes.</p>
      </div>
    );
  }

  const degreeIndex = chord.degree;
  const related = field.nodes.filter((_, i) => i !== degreeIndex);

  return (
    <div className="chord-panel">
      <div className="chord-panel-header">
        <span className="chord-panel-roman">{chord.roman}</span>
        <span className="chord-panel-name">{chord.id}</span>
        <span className="chord-panel-quality">{QUALITY_LABEL[chord.quality]}</span>
      </div>

      <div className="chord-panel-section">
        <div className="section-label">Notas</div>
        <div className="chord-notes">
          {chord.notes.map(n => (
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
          {field.nodes.map(node => (
            <button
              key={node.id}
              className={`related-chip ${node.id === chord.id ? 'active' : ''}`}
              onClick={() => onNavigate(node)}
              title={`Explorar a partir de ${node.id}`}
            >
              {node.roman} — {node.id}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
