import { useState } from 'react';
import { Check, ChevronDown, Info, ListChecks, Sparkles } from 'lucide-react';
import type { AreaSuggestionResponse } from '../../lib/api';
import type { AreaId, EventArea } from '../../types';
import '../../styles/needs.css';

/** Step 2 of the creator: what the organizer actually needs at this event. */
export function NeedsStep({ areas, value, onConfirm, onBack, onSuggest }: { areas: EventArea[]; value: AreaId[] | null; onConfirm: (areas: AreaId[]) => Promise<void>; onBack: () => void; onSuggest: () => Promise<AreaSuggestionResponse> }) {
  const allIds = areas.map((area) => area.id as AreaId);
  const [picked, setPicked] = useState<AreaId[]>(value && value.length ? value : allIds);
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<AreaSuggestionResponse | null>(null);
  const reasons = new Map((suggestion?.available ? suggestion.suggestions : []).map((item) => [item.areaId, item.reason]));
  // Suggestions pre-tick the areas; they never lock the organizer's own choice.
  const suggest = async () => {
    setSuggesting(true);
    try {
      const result = await onSuggest();
      setSuggestion(result);
      if (result.available && result.suggestions.length) {
        const proposed = result.suggestions.map((item) => item.areaId);
        setPicked(allIds.filter((id) => proposed.includes(id)));
      }
    } catch {
      setSuggestion({ available: false, message: 'Nie udało się połączyć z serwerem. Zaznacz obszary samodzielnie poniżej.', suggestions: [] });
    } finally {
      setSuggesting(false);
    }
  };
  const toggle = (id: AreaId) => setPicked(picked.includes(id) ? picked.filter((item) => item !== id) : allIds.filter((item) => item === id || picked.includes(item)));
  const confirm = async () => { if (!picked.length) return; setSaving(true); try { await onConfirm(picked); } finally { setSaving(false); } };
  return <section className="panel needs-panel">
    <div className="section-title"><ListChecks size={20} /><div className="needs-intro"><h2>Czego potrzebujesz na wydarzeniu?</h2><p>Zaznacz tylko te obszary, które naprawdę wystąpią. Poradnik i checklisty pokażą zadania wyłącznie dla nich — reszta zniknie z Twojej listy.</p></div></div>
    <div className="needs-ai">
      <button className="button secondary" type="button" onClick={suggest} disabled={suggesting}><Sparkles size={17} /> {suggesting ? 'Pytam AI…' : 'Zaproponuj obszary na podstawie opisu (AI)'}</button>
      {suggestion && <div className={suggestion.available ? 'needs-ai-note' : 'notice'}>{!suggestion.available && <Info size={18} />}<p>{suggestion.message}</p></div>}
    </div>
    <div className="needs-grid">
      {areas.map((area) => {
        const id = area.id as AreaId;
        const on = picked.includes(id);
        return <button key={area.id} type="button" className={on ? 'need-toggle on' : 'need-toggle'} aria-pressed={on} onClick={() => toggle(id)}>
          <span className="need-mark"><Check size={15} /></span>
          <span><strong>{area.name}</strong><small>{reasons.get(id) ?? area.stage}</small></span>
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
