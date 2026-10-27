import { useState } from 'react';
import { Check, ChevronDown, ListChecks } from 'lucide-react';
import type { AreaId, EventArea } from '../../types';
import '../../styles/needs.css';

/** Step 2 of the creator: what the organizer actually needs at this event. */
export function NeedsStep({ areas, value, onConfirm, onBack }: { areas: EventArea[]; value: AreaId[] | null; onConfirm: (areas: AreaId[]) => Promise<void>; onBack: () => void }) {
  const allIds = areas.map((area) => area.id as AreaId);
  const [picked, setPicked] = useState<AreaId[]>(value && value.length ? value : allIds);
  const [saving, setSaving] = useState(false);
  const toggle = (id: AreaId) => setPicked(picked.includes(id) ? picked.filter((item) => item !== id) : allIds.filter((item) => item === id || picked.includes(item)));
  const confirm = async () => { if (!picked.length) return; setSaving(true); try { await onConfirm(picked); } finally { setSaving(false); } };
  return <section className="panel needs-panel">
    <div className="section-title"><ListChecks size={20} /><div className="needs-intro"><h2>Czego potrzebujesz na wydarzeniu?</h2><p>Zaznacz tylko te obszary, które naprawdę wystąpią. Poradnik i checklisty pokażą zadania wyłącznie dla nich — reszta zniknie z Twojej listy.</p></div></div>
    <div className="needs-grid">
      {areas.map((area) => {
        const id = area.id as AreaId;
        const on = picked.includes(id);
        return <button key={area.id} type="button" className={on ? 'need-toggle on' : 'need-toggle'} aria-pressed={on} onClick={() => toggle(id)}>
          <span className="need-mark"><Check size={15} /></span>
          <span><strong>{area.name}</strong><small>{area.stage}</small></span>
        </button>;
      })}
    </div>
    <div className="needs-summary"><strong>{picked.length} z {areas.length}</strong><span>obszarów w Twoim wydarzeniu</span>{!picked.length && <span className="warning">Zaznacz przynajmniej jeden obszar.</span>}</div>
    <div className="needs-actions">
      <button className="button secondary" onClick={onBack}>Wstecz</button>
      <button className="button primary" onClick={confirm} disabled={!picked.length || saving}>{saving ? 'Zapisuję…' : <>Przejdź do opcji <ChevronDown size={17} /></>}</button>
    </div>
  </section>;
}
