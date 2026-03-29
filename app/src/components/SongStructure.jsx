import { useState } from 'react';
import Section from './Section';

const SECTION_PRESETS = ['Verso', 'Pré-Refrão', 'Refrão', 'Bridge', 'Intro', 'Outro'];

export default function SongStructure({
  sections, activeSectionId, activeChord, bpm, useTetrads,
  onSelectSection, onUpdateSection, onRemoveSection, onAddSection,
  onSelectChord, onLoopChange,
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [customName, setCustomName] = useState('');

  function addPreset(name) {
    onAddSection(name);
    setShowAdd(false);
  }

  function addCustom() {
    const name = customName.trim() || 'Seção';
    onAddSection(name);
    setCustomName('');
    setShowAdd(false);
  }

  return (
    <div className="song-structure">
      {/* Sections */}
      {sections.map(section => (
        <Section
          key={section.id}
          section={section}
          isActive={section.id === activeSectionId}
          activeChord={activeChord}
          bpm={bpm}
          useTetrads={useTetrads}
          onSelect={() => onSelectSection(section.id)}
          onUpdate={updated => onUpdateSection(section.id, updated)}
          onRemove={onRemoveSection}
          onSelectChord={onSelectChord}
          onLoopChange={onLoopChange}
        />
      ))}

      {/* Add section */}
      <div className="ss-add-row">
        {!showAdd ? (
          <button className="ss-add-btn" onClick={() => setShowAdd(true)}>
            + Nova seção
          </button>
        ) : (
          <div className="ss-add-panel">
            <div className="ss-presets">
              {SECTION_PRESETS.map(name => (
                <button key={name} className="ss-preset-btn" onClick={() => addPreset(name)}>
                  {name}
                </button>
              ))}
            </div>
            <div className="ss-custom-row">
              <input
                className="ss-custom-input"
                placeholder="Nome personalizado..."
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addCustom(); if (e.key === 'Escape') setShowAdd(false); }}
                autoFocus
              />
              <button className="ss-custom-ok" onClick={addCustom}>Adicionar</button>
              <button className="ss-custom-cancel" onClick={() => setShowAdd(false)}>×</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
