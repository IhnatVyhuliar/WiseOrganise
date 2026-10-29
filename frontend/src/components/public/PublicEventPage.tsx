import { BarChart3, CalendarDays, CheckSquare, Leaf, ListChecks, MapPin, TreePine, Users, Wallet } from 'lucide-react';
import type { PublicEventView } from '../../types';
import { groupByMilestone } from '../checklists/milestones';
import { formatKg, formatPln } from '../../lib/format';
import '../../styles/impact.css';

const formatDate = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
};

/**
 * Read-only page behind a share link. The public endpoint has no mutations, so every
 * checkbox here renders disabled: it reports the organizer's progress, it does not change it.
 */
export function PublicEventPage({ view }: { view: PublicEventView }) {
  const groups = groupByMilestone(view.organizerChecklist);
  const impact = view.impactSummary;
  const savedMin = Math.max(0, impact.kgCo2eMin - impact.optimizedKgCo2eMin);
  const savedMax = Math.max(0, impact.kgCo2eMax - impact.optimizedKgCo2eMax);
  const done = view.organizerChecklist.filter((item) => item.isDone).length;

  return (
    <main className="page public-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">Plan zrównoważonego wydarzenia</div>
          <h1>{view.title}</h1>
          <p>Ten widok jest tylko do czytania. Pokazuje ustalenia organizatora, zadania zespołu i szacowany wpływ wydarzenia.</p>
        </div>
      </div>

      <section className="public-meta">
        <span><ListChecks size={17} /> {view.eventType}</span>
        <span><CalendarDays size={17} /> {formatDate(view.eventDate)}</span>
        <span><MapPin size={17} /> {view.location}</span>
        <span><Users size={17} /> {view.attendees} uczestników</span>
      </section>

      {view.ustalenia.length > 0 && (
        <section className="checklist-section">
          <div className="section-title">
            <Leaf size={21} />
            <div>
              <h2>Ustalenia dla obszarów wydarzenia</h2>
              <p>Poziom wybrany w każdym obszarze wraz z uzasadnieniem i wpływem na koszt.</p>
            </div>
          </div>
          <div className="ustalenia-grid">
            {view.ustalenia.map((ustalenie) => (
              <article className="ustalenie-card" key={ustalenie.areaId}>
                <div className="eyebrow">{ustalenie.areaName}</div>
                <h3>{ustalenie.levelLabel}</h3>
                <p>{ustalenie.justification}</p>
                <small><Wallet size={15} /> {ustalenie.costEffect}</small>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="guide-progress">
        <CheckSquare size={20} />
        <span><strong>{done} z {view.organizerChecklist.length}</strong> zadań organizatora ukończonych</span>
        <div className="progress-track">
          <div style={{ width: `${view.organizerChecklist.length ? (done / view.organizerChecklist.length) * 100 : 0}%` }} />
        </div>
      </section>

      <section className="checklist-section">
        <div className="section-title">
          <CheckSquare size={21} />
          <div>
            <h2>Checklista organizatora</h2>
            <p>Zadania ułożone w czasie: od przygotowań, przez dzień wydarzenia, po powrót uczestników.</p>
          </div>
        </div>
        {groups.map((group) => (
          <div className="milestone-group" key={group.id}>
            <div className="milestone-heading">
              <div className="eyebrow">{group.title}</div>
              <small>{group.hint}</small>
            </div>
            <div className="checklist-grid">
              {group.items.map((item) => (
                <div className={item.isDone ? 'check-row done' : 'check-row'} key={item.id}>
                  <input type="checkbox" checked={!!item.isDone} disabled readOnly aria-label={item.label} />
                  <span><small>{item.area}</small>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {view.teamChecklists.length > 0 && (
        <section className="team-section">
          <div className="section-title">
            <Users size={21} />
            <div>
              <h2>Zadania osób w zespole</h2>
              <p>Podział odpowiedzialności za poszczególne obszary wydarzenia.</p>
            </div>
          </div>
          <div className="team-grid">
            {view.teamChecklists.map((team) => {
              const completed = team.completedTasks || [];
              return (
                <article className="team-card" key={team.role}>
                  <div className="eyebrow">{team.role}</div>
                  <ul>
                    {team.tasks.map((task) => (
                      <li key={task}>
                        <input type="checkbox" checked={completed.includes(task)} disabled readOnly aria-label={task} /> <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="panel">
        <div className="section-title">
          <Leaf size={21} />
          <div>
            <h2>Szacowany wpływ wydarzenia</h2>
            <p>Liczby są demonstracyjne. Powstają z wybranych poziomów i stałej bazy wiedzy, nie z pomiaru tego wydarzenia.</p>
          </div>
        </div>
        <div className="impact-stats">
          <div className="impact-stat">
            <div className="eyebrow">Przed optymalizacją</div>
            <strong>{formatKg(impact.kgCo2eMin)} – {formatKg(impact.kgCo2eMax)}</strong>
            <small>zakres bez wybranych ulepszeń</small>
          </div>
          <div className="impact-stat">
            <div className="eyebrow">Po optymalizacji</div>
            <strong>{formatKg(impact.optimizedKgCo2eMin)} – {formatKg(impact.optimizedKgCo2eMax)}</strong>
            <small>zakres po ustaleniach z tego planu</small>
          </div>
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
        <div className="motivator-grid">
          <article>
            <Leaf size={22} />
            <strong>{impact.ecoMotivator.squirrelsSaved}</strong>
            <span>{impact.ecoMotivator.metricName || 'wiewiórki uratowane'}</span>
          </article>
          <article>
            <TreePine size={22} />
            <strong>{impact.ecoMotivator.treesSaved}</strong>
            <span>drzewa</span>
          </article>
          <article>
            <BarChart3 size={22} />
            <strong>{impact.ecoMotivator.co2eSavedKg.toLocaleString('pl-PL', { maximumFractionDigits: 1 })}</strong>
            <span>kg CO2e mniej</span>
          </article>
        </div>
        <p className="motivator-message">{impact.ecoMotivator.message}</p>
      </section>
    </main>
  );
}
