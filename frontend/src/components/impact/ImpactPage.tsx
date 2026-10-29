import { AlertTriangle, ArrowRight, BarChart3, ClipboardCheck, FileText, Leaf, Sparkles, TreePine, Wallet } from 'lucide-react';
import type { EcoSummary, ImpactSummary } from '../../types';
import { formatKg, formatPln } from '../../lib/format';

/** One before/after range drawn as a CSS band, scaled against the largest value shown. */
function RangeBar({ variant, label, min, max, scaleMax }: { variant: 'before' | 'after'; label: string; min: number; max: number; scaleMax: number }) {
  const safeScale = scaleMax > 0 ? scaleMax : 1;
  const offset = Math.max(0, Math.min(100, (min / safeScale) * 100));
  const width = Math.max(2, Math.min(100 - offset, ((max - min) / safeScale) * 100));
  return (
    <div className="range-row">
      <div className="range-label">
        <strong>{label}</strong>
        <small>{formatKg(min)} – {formatKg(max)}</small>
      </div>
      <div className="range-track">
        <div className={`range-band ${variant}`} style={{ marginLeft: `${offset}%`, width: `${width}%` }} />
      </div>
    </div>
  );
}

export function ImpactPage({ eguide, impact, ecoSummary }: { eguide?: any; impact: ImpactSummary | null; ecoSummary: EcoSummary | null }) {
  const hasGuide = Boolean(eguide);
  const disclaimer = 'Liczby poniżej są demonstracyjne. Powstają z wybranych poziomów i stałej bazy wiedzy, nie z pomiaru tego wydarzenia.';

  if (!impact) {
    return (
      <main className="page impact-page">
        <div className="page-heading">
          <div>
            <div className="eyebrow">Pomiar</div>
            <h1>Wpływ przed i po</h1>
            <p>Porównanie powstaje po wygenerowaniu poradnika na podstawie poziomów wybranych w kreatorze.</p>
          </div>
        </div>
        <section className="panel impact-empty">
          <div className="section-title">
            <Sparkles size={21} />
            <div>
              <h2>{hasGuide ? 'Szacunek nie został jeszcze pobrany' : 'Nie ma jeszcze poradnika dla tego wydarzenia'}</h2>
              <p>Przejdź do kreatora, wybierz poziom w potrzebnych obszarach i wygeneruj poradnik. Wtedy pokażemy tu zakres przed i po optymalizacji.</p>
            </div>
          </div>
          {ecoSummary && (
            <div className="impact-reference">
              <div className="eyebrow">Przykładowa skala odniesienia dla 100 uczestników</div>
              <p>
                Przed optymalizacją {formatKg(ecoSummary.kgCo2eMin)} – {formatKg(ecoSummary.kgCo2eMax)}, po pełnej optymalizacji{' '}
                {formatKg(ecoSummary.optimizedKgCo2eMin)} – {formatKg(ecoSummary.optimizedKgCo2eMax)}.
              </p>
            </div>
          )}
          <div className="notice">
            <AlertTriangle size={19} />
            <p>{disclaimer}</p>
          </div>
        </section>
      </main>
    );
  }

  const motivator = impact.ecoMotivator;
  const scaleMax = Math.max(impact.kgCo2eMax, impact.optimizedKgCo2eMax, 1);
  const savedMin = Math.max(0, impact.kgCo2eMin - impact.optimizedKgCo2eMin);
  const savedMax = Math.max(0, impact.kgCo2eMax - impact.optimizedKgCo2eMax);

  return (
    <main className="page impact-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">Pomiar</div>
          <h1>Wpływ przed i po</h1>
          <p>Szacunek wyliczony z poziomów wybranych w kreatorze. Pokazujemy kierunek zmiany, a nie pozorną precyzję.</p>
        </div>
        <div className="no-ranking">
          <AlertTriangle size={18} />
          <span>Dane demonstracyjne</span>
        </div>
      </div>

      <section className="panel impact-compare">
        <div className="section-title">
          <BarChart3 size={21} />
          <div>
            <h2>Szacowany ślad węglowy wydarzenia</h2>
            <p>Zakres przed optymalizacją w porównaniu z zakresem po wybranych poziomach.</p>
          </div>
        </div>
        <div className="range-chart">
          <RangeBar variant="before" label="Przed optymalizacją" min={impact.kgCo2eMin} max={impact.kgCo2eMax} scaleMax={scaleMax} />
          <RangeBar variant="after" label="Po optymalizacji" min={impact.optimizedKgCo2eMin} max={impact.optimizedKgCo2eMax} scaleMax={scaleMax} />
        </div>
        <div className="legend">
          <span><i className="dot before-dot" />Przed</span>
          <ArrowRight size={16} />
          <span><i className="dot after-dot" />Po</span>
        </div>
        <div className="impact-stats">
          <div className="impact-stat">
            <div className="eyebrow">Różnica w zakresie</div>
            <strong>{formatKg(savedMin)} – {formatKg(savedMax)}</strong>
            <small>mniej niż w wariancie przed optymalizacją</small>
          </div>
          <div className="impact-stat">
            <div className="eyebrow">Szacowana oszczędność</div>
            <strong><Wallet size={20} /> {formatPln(impact.savedPln)}</strong>
            <small>z wyborów oznaczonych jako obniżające koszt</small>
          </div>
        </div>
      </section>

      <section className="panel impact-motivator">
        <div className="section-title">
          <Leaf size={21} />
          <div>
            <h2>Co to znaczy w praktyce</h2>
            <p>Trzy liczby opisują tę samą oszczędność w różnych jednostkach porównawczych.</p>
          </div>
        </div>
        <div className="motivator-grid">
          <article>
            <Leaf size={22} />
            <strong>{motivator.squirrelsSaved}</strong>
            <span>{motivator.metricName || 'wiewiórki uratowane'}</span>
          </article>
          <article>
            <TreePine size={22} />
            <strong>{motivator.treesSaved}</strong>
            <span>drzewa</span>
          </article>
          <article>
            <BarChart3 size={22} />
            <strong>{motivator.co2eSavedKg.toLocaleString('pl-PL', { maximumFractionDigits: 1 })}</strong>
            <span>kg CO2e mniej</span>
          </article>
        </div>
        <p className="motivator-message">{motivator.message}</p>
      </section>

      <section className="panel impact-sources">
        <div className="section-title">
          <FileText size={21} />
          <div>
            <h2>Skąd biorą się te liczby</h2>
            <p>Wskaźniki emisji i źródła danych, które domykają cykl po wydarzeniu.</p>
          </div>
        </div>
        <div className="source-columns">
          <div>
            <div className="eyebrow">Wskaźniki emisji</div>
            <ul className="source-list">
              {impact.emissionFactorSources.map((source) => <li key={source}>{source}</li>)}
            </ul>
          </div>
          <div>
            <div className="eyebrow">Źródła danych po wydarzeniu</div>
            <ul className="source-list">
              {impact.provenance.map((source) => <li key={source}>{source}</li>)}
            </ul>
          </div>
        </div>
        <div className="notice">
          <AlertTriangle size={19} />
          <p>{disclaimer} Aby raportować rzeczywisty wpływ, zbierz ankietę dojazdu, zważ odpady według frakcji i uzupełnij dane z faktur dostawców.</p>
        </div>
      </section>

      <section className="impact-next">
        <ClipboardCheck size={22} />
        <div>
          <h2>Co zapisujemy na kolejną edycję?</h2>
          <p>Które decyzje obniżyły koszty, gdzie uczestnicy potrzebowali więcej informacji i jaki obszar wymaga następnej poprawy.</p>
        </div>
        <BarChart3 size={40} />
      </section>
    </main>
  );
}
