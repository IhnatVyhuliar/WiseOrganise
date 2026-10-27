import { AlertTriangle, CheckCircle2, FileText, HelpCircle, ShieldAlert } from 'lucide-react';
import type { EventArea, GreenwashingRisk } from '../../types';
import type { View } from '../layout/Layout';

const FLAG_LABELS: Record<GreenwashingRisk['flag'], string> = { green: 'Zielone światło', yellow: 'Wymaga dopytania', red: 'Czerwona flaga' };

/**
 * Everything needed to judge a supplier in one area, next to the choice it
 * applies to. Nothing is collapsed: the organizer should not have to click to
 * find out what to ask. The criteria page keeps the universal overview.
 */
export function AreaKnowledge({ area, onNavigate }: { area: EventArea; onNavigate: (view: View) => void }) {
  const criteria = area.criteria ?? [];
  const risks = area.greenwashingRisks ?? [];

  return (
    <section className="area-knowledge">
      <div className="section-title">
        <HelpCircle size={21} />
        <div>
          <h2>Pytania do dostawcy w tym obszarze</h2>
          <p>Zadaj je każdemu dostawcy. Dowodem jest odpowiedź, nie nazwa firmy.</p>
        </div>
      </div>
      <div className="questions-card">
        <h3>{area.name}</h3>
        <ul>{area.providerQuestions.map((question) => <li key={question}>{question}</li>)}</ul>
      </div>

      {criteria.length > 0 && (
        <>
          <div className="section-title">
            <CheckCircle2 size={21} />
            <div>
              <h2>Kryteria dla obszaru {area.name.toLowerCase()}</h2>
              <p>Szczegółowe kryteria pisane pod ten obszar. Ogólne kryteria dla wszystkich dostawców znajdziesz na stronie Kryteria.</p>
            </div>
          </div>
          <div className="area-criteria-grid">
            {criteria.map((criterion, index) => (
              <article className="criterion-card" key={criterion.name}>
                <div className="criterion-number">{String(index + 1).padStart(2, '0')}</div>
                <h2>{criterion.name}</h2>
                <div className="verify">
                  <CheckCircle2 size={17} />
                  <div>
                    <strong>Jak sprawdzić</strong>
                    <p>{criterion.howToVerify}</p>
                  </div>
                </div>
                <div className="evidence">
                  <FileText size={17} />
                  <div>
                    <strong>Jaki dowód poprosić</strong>
                    <p>{criterion.evidence}</p>
                  </div>
                </div>
                <div className="warning">
                  <AlertTriangle size={17} />
                  <div>
                    <strong>Sygnał ostrzegawczy</strong>
                    <p>{criterion.warning}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {risks.length > 0 && (
        <>
          <div className="section-title">
            <ShieldAlert size={21} />
            <div>
              <h2>Uwaga na greenwashing</h2>
              <p>Oceniamy deklarację, nie firmę. Te hasła padają najczęściej właśnie w tym obszarze.</p>
            </div>
          </div>
          <div className="risk-matrix">
            {risks.map((risk) => (
              <article className={`risk-card flag-${risk.flag}`} key={risk.claim}>
                <header>
                  <span className={`flag-chip flag-${risk.flag}`}>{FLAG_LABELS[risk.flag]}</span>
                </header>
                <h3>{risk.claim}</h3>
                <p className="risk-explanation">{risk.explanation}</p>
                <div className="risk-follow-up">
                  <strong>Pytanie kontrolne</strong>
                  <p>{risk.followUp}</p>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <button className="text-button" onClick={() => onNavigate('criteria')}>Zobacz wszystkie kryteria i klauzule umowne →</button>
    </section>
  );
}
