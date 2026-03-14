import { useEffect } from 'react';
import { CHANGELOG, CURRENT_VERSION } from '../lib/changelog';

const TYPE_LABEL = {
  feature: 'novo',
  fix: 'fix',
  improvement: 'melhoria',
};

const TYPE_CLASS = {
  feature: 'cl-tag-feature',
  fix: 'cl-tag-fix',
  improvement: 'cl-tag-improvement',
};

const RELEASE_TYPE_LABEL = {
  feature: 'feature',
  fix: 'bugfix',
  improvement: 'melhoria',
};

const RELEASE_TYPE_CLASS = {
  feature: 'cl-release-feature',
  fix: 'cl-release-fix',
  improvement: 'cl-release-improvement',
};

export default function ChangelogModal({ onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="cl-overlay" onClick={onClose}>
      <div className="cl-modal" onClick={e => e.stopPropagation()}>
        <div className="cl-header">
          <div className="cl-header-left">
            <span className="cl-title">Histórico de Versões</span>
            <span className="cl-current-badge">v{CURRENT_VERSION}</span>
          </div>
          <button className="cl-close-btn" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div className="cl-body">
          {CHANGELOG.map((release, i) => (
            <div key={release.version} className={`cl-release ${i === 0 ? 'cl-release-latest' : ''}`}>
              <div className="cl-release-header">
                <span className="cl-version">v{release.version}</span>
                <span className={`cl-release-type ${RELEASE_TYPE_CLASS[release.type]}`}>
                  {RELEASE_TYPE_LABEL[release.type]}
                </span>
                <span className="cl-date">{release.date}</span>
                {i === 0 && <span className="cl-latest-tag">atual</span>}
              </div>
              <p className="cl-summary">{release.summary}</p>
              <ul className="cl-changes">
                {release.changes.map((change, j) => (
                  <li key={j} className="cl-change-item">
                    <span className={`cl-tag ${TYPE_CLASS[change.type]}`}>
                      {TYPE_LABEL[change.type]}
                    </span>
                    <span className="cl-change-text">{change.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
