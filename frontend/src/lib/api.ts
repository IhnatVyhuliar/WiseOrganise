import type { EventArea, PilotConfig, VendorCriterion, ChecklistItem, TeamRole, AreaId, AreaQuestions, ContractClause, GreenwashingRisk, EcoSummary, ImpactSummary } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status})`);
  return response.status === 204 ? (undefined as T) : response.json();
}

export interface ReferenceData {
  six_r: { rank: number; name: string; description: string }[];
  areas: EventArea[];
  criteria: VendorCriterion[];
  area_questions: AreaQuestions[];
  organizer_checklist: ChecklistItem[];
  team_roles: TeamRole[];
  contract_clauses: ContractClause[];
  greenwashing_risks: GreenwashingRisk[];
  eco_summary: EcoSummary | null;
  default_pilot: PilotConfig;
  source_ids: string[];
}

export interface EventRecord {
  id: string;
  title: string;
  eventType: string;
  rawDescription: string;
  needsVenueHelp: boolean;
  attendees: number;
  budget: number;
  location: string;
  eventDate: string;
  participantOrigins: string;
  neededAreas: AreaId[];
  pilot: PilotConfig;
  selectedOptions: Record<string, number>;
  status: string;
}

/** Single checkbox toggle sent to PATCH /events/{id}/eguide/checklist. */
export interface ChecklistDonePayload { itemId: string; isDone: boolean; role?: string; task?: string; }

export const api = {
  reference: () => request<ReferenceData>('/reference-data'),
  createEvent: (payload: Record<string, unknown>) => request<EventRecord>('/events', { method: 'POST', body: JSON.stringify(payload) }),
  getEvent: (id: string) => request<EventRecord>(`/events/${id}`),
  updateEvent: (id: string, payload: Record<string, unknown>) => request<EventRecord>(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  setNeededAreas: (id: string, areas: AreaId[]) => request<EventRecord>(`/events/${id}/needed-areas`, { method: 'PATCH', body: JSON.stringify({ neededAreas: areas }) }),
  analyze: (id: string) => request<unknown>(`/events/${id}/analyze`, { method: 'POST' }),
  checklist: (id: string) => request<unknown>(`/events/${id}/checklist`),
  updateChecklist: (id: string, payload: unknown) => request<unknown>(`/events/${id}/checklist`, { method: 'PATCH', body: JSON.stringify(payload) }),
  options: (id: string) => request<{ areas: EventArea[]; selectedOptions: Record<string, number> }>(`/events/${id}/options`),
  updateOptions: (id: string, selections: unknown[]) => request<unknown>(`/events/${id}/options`, { method: 'PATCH', body: JSON.stringify({ selections }) }),
  criteria: () => request<unknown>('/events/criteria'),
  recommend: (id: string) => request<unknown>(`/events/${id}/recommend`, { method: 'POST' }),
  recommendations: (id: string) => request<unknown>(`/events/${id}/recommendations`),
  selectRecommendation: (id: string, recId: string) => request<unknown>(`/events/${id}/recommendations/${recId}/select`, { method: 'POST' }),
  generateEguide: (id: string) => request<unknown>(`/events/${id}/eguide`, { method: 'POST' }),
  eguide: (id: string) => request<unknown>(`/events/${id}/eguide`),
  setChecklistDone: (id: string, payload: ChecklistDonePayload) => request<any>(`/events/${id}/eguide/checklist`, { method: 'PATCH', body: JSON.stringify(payload) }),
  impact: (id: string) => request<ImpactSummary>(`/events/${id}/impact`),
};

export function normalizeReference(raw: any): ReferenceData {
  const areas = (raw.areas || []).map((area: any) => ({
    ...area,
    providerQuestions: area.providerQuestions || area.provider_questions || [],
    levels: (area.levels || []).map((level: any) => ({ ...level, useAiSuggestions: level.useAiSuggestions ?? level.use_ai_suggestions, sixR: level.sixR || level.six_r || [] })),
  }));
  const ecoSummary = raw.eco_summary || raw.ecoSummary;
  return {
    six_r: raw.six_r || raw.sixR || [],
    areas,
    criteria: (raw.criteria || []).map((item: any) => ({ name: item.name, howToVerify: item.howToVerify || item.jak_sprawdzic, warning: item.warning || item.sygnal_ostrzegawczy })),
    area_questions: (raw.area_questions || raw.areaQuestions || []).map((item: any) => ({ areaId: item.areaId || item.area_id, areaName: item.areaName || item.area_name, providerQuestions: item.providerQuestions || item.pytania_do_dostawcy || [] })),
    organizer_checklist: (raw.organizer_checklist || raw.organizerChecklist || []).map((item: any) => ({ ...item, areaId: item.areaId ?? item.area_id ?? null, milestone: item.milestone ?? null, minLevel: item.minLevel ?? item.min_level ?? 1, isDone: item.isDone ?? item.is_done ?? false })),
    team_roles: (raw.team_roles || raw.teamRoles || []).map((item: any) => ({ ...item, taskAreas: item.taskAreas || item.task_areas || [], completedTasks: item.completedTasks || item.completed_tasks || [] })),
    contract_clauses: raw.contract_clauses || raw.contractClauses || [],
    greenwashing_risks: (raw.greenwashing_risks || raw.greenwashingRisks || []).map((item: any) => ({ vendorName: item.vendorName || item.vendor_name, claim: item.claim, flag: item.flag, explanation: item.explanation, followUp: item.followUp || item.follow_up })),
    eco_summary: ecoSummary ? { kgCo2eMin: ecoSummary.kgCo2eMin ?? ecoSummary.kg_co2e_min, kgCo2eMax: ecoSummary.kgCo2eMax ?? ecoSummary.kg_co2e_max, optimizedKgCo2eMin: ecoSummary.optimizedKgCo2eMin ?? ecoSummary.optimized_kg_co2e_min, optimizedKgCo2eMax: ecoSummary.optimizedKgCo2eMax ?? ecoSummary.optimized_kg_co2e_max, savedPln: ecoSummary.savedPln ?? ecoSummary.saved_pln, emissionFactorSources: ecoSummary.emissionFactorSources || ecoSummary.emission_factor_sources || [] } : null,
    default_pilot: raw.default_pilot || raw.defaultPilot || { city: 'Uniwersytet Łódzki, Łódź', radiusKm: 20, eventStart: '09:30', prioritizeRail: true, prioritizeElectricBuses: true },
    source_ids: raw.source_ids || raw.sourceIds || [],
  };
}
