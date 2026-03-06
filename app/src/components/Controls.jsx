import { AVAILABLE_NOTES, AVAILABLE_SCALES } from '../lib/harmonicField';

export default function Controls({ rootNote, scaleName, onChange }) {
  return (
    <div className="controls">
      <div className="controls-title">Campo Harmônico</div>
      <div className="controls-row">
        <div className="control-group">
          <label htmlFor="root-select">Nota raiz</label>
          <select
            id="root-select"
            value={rootNote}
            onChange={e => onChange(e.target.value, scaleName)}
          >
            {AVAILABLE_NOTES.map(note => (
              <option key={note} value={note}>{note}</option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label htmlFor="scale-select">Escala / Modo</label>
          <select
            id="scale-select"
            value={scaleName}
            onChange={e => onChange(rootNote, e.target.value)}
          >
            {AVAILABLE_SCALES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
