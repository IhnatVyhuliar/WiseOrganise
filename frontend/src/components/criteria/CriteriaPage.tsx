import { AlertTriangle, CheckCircle2, FileSignature, HelpCircle, ShieldAlert } from 'lucide-react';
import type { AreaQuestions, ContractClause, GreenwashingRisk } from '../../types';

const FLAG_LABELS: Record<GreenwashingRisk['flag'], string> = { green: 'Zielone światło', yellow: 'Wymaga dopytania', red: 'Czerwona flaga' };

export function CriteriaPage({ criteria, areaQuestions, contractClauses, greenwashingRisks }: { criteria: { name: string; howToVerify: string; warning: string }[]; areaQuestions: AreaQuestions[]; contractClauses: ContractClause[]; greenwashingRisks: GreenwashingRisk[] }) {
  const clauseKinds = Array.from(new Set(contractClauses.map((clause) => clause.kind)));

  return (
    <main className="page criteria-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">Weryfikacja dostawców</div>
          <h1>Kryteria zamiast rankingu</h1>
          <p>Nie wybieramy firmy za organizatora. Dajemy pytania, dowody i sygnały ostrzegawcze.</p>
        </div>
        <div className="no-ranking">
          <CheckCircle2 size={18} />
          <span>Bez promowania firm</span>
        </div>
      </div>

      <div className="criteria-grid">
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

      {areaQuestions.length > 0 && (
        <section className="knowledge-section">
          <div className="section-title">
            <HelpCircle size={21} />
            <div>
              <h2>Pytania do dostawcy w każdym obszarze</h2>
              <p>Te same pytania zadaj każdemu dostawcy w danym obszarze. Odpowiedź, a nie nazwa firmy, jest dowodem.</p>
            </div>
          </div>
          <div className="area-questions-grid">
            {areaQuestions.map((area) => (
              <article className="questions-card" key={area.areaId}>
                <h3>{area.areaName}</h3>
                <ul>
                  {area.providerQuestions.map((question) => <li key={question}>{question}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </section>
      )}

      {greenwashingRisks.length > 0 && (
        <section className="knowledge-section">
          <div className="section-title">
            <ShieldAlert size={21} />
            <div>
              <h2>Macierz ryzyka greenwashingu</h2>
              <p>Oceniamy deklarację, nie firmę. Każdy wiersz dotyczy neutralnej kategorii dostawcy.</p>
            </div>
          </div>
          <div className="risk-matrix">
            {greenwashingRisks.map((risk) => (
              <article className={`risk-card flag-${risk.flag}`} key={risk.claim}>
                <header>
                  <span className={`flag-chip flag-${risk.flag}`}>{FLAG_LABELS[risk.flag]}</span>
                  <span className="tag">{risk.vendorName}</span>
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
        </section>
      )}

      {contractClauses.length > 0 && (
        <section className="knowledge-section">
          <div className="section-title">
            <FileSignature size={21} />
            <div>
              <h2>Klauzule umowne i pytania do zapytania ofertowego</h2>
              <p>Zapis w umowie zamienia deklarację dostawcy w zobowiązanie możliwe do sprawdzenia.</p>
            </div>
          </div>
          <div className="clause-columns">
            {clauseKinds.map((kind) => (
              <div className="clause-group" key={kind}>
                <div className="eyebrow">{kind}</div>
                <ul className="clause-list">
                  {contractClauses.filter((clause) => clause.kind === kind).map((clause) => <li key={clause.text}>{clause.text}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
