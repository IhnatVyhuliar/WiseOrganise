import type { AreaCriteria, AreaCriterion, AreaSuggestion, EventArea, PilotConfig, VendorCriterion, ChecklistItem, TeamRole, AreaId, AreaQuestions, ContractClause, GreenwashingRisk, EcoSummary, ImpactSummary } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/** Maximum time a browser request may keep the interface waiting. */
export const REQUEST_TIMEOUT_MS = 30_000;

export const API_TIMEOUT_MESSAGE = 'Przekroczony czas odpowiedzi. Spróbuj ponownie.';
export const API_NOT_FOUND_MESSAGE = 'Nie znaleziono żądanego zasobu.';
export const API_SERVER_ERROR_MESSAGE = 'Błąd serwera. Spróbuj ponownie później.';
export const API_GENERAL_ERROR_MESSAGE = 'Wystąpił błąd. Spróbuj ponownie.';
export const API_INVALID_RESPONSE_MESSAGE = 'Odpowiedź serwera ma nieprawidłowy format.';

/** Error type used for all failures that may be shown by the application. */
export class ApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Return a fixed Polish message for an HTTP status when no safe detail exists. */
export function messageForStatus(status: number): string {
  if (status === 504 || status === 502 || status === 408) return API_TIMEOUT_MESSAGE;
  if (status === 404) return API_NOT_FOUND_MESSAGE;
  if (status >= 500 && status <= 599) return API_SERVER_ERROR_MESSAGE;
  return API_GENERAL_ERROR_MESSAGE;
}

const KNOWN_DETAIL_TRANSLATIONS: Record<string, string> = {
  'Event not found': 'Nie znaleziono wydarzenia.',
  'Generate the e-guide first': 'Najpierw wygeneruj poradnik, aby zaznaczać zadania.',
  'Recommendation not found': 'Nie znaleziono rekomendacji.',
  'Checklist item not found': 'Nie znaleziono zadania na checkliście.',
  'Analyze the event before accessing its checklist': 'Najpierw przeanalizuj wydarzenie, aby otworzyć checklistę.',
  'Analyze the event before updating its checklist': 'Najpierw przeanalizuj wydarzenie, aby zapisać checklistę.',
  'Select lifecycle options before requesting criteria': 'Najpierw wybierz poziomy obszarów, aby pobrać kryteria.',
  'Generate supplier criteria first': 'Najpierw wygeneruj kryteria dostawców.',
  'end_at must be later than start_at': 'Data zakończenia musi przypadać po dacie rozpoczęcia.',
};

function translateKnownDetail(message: string): string {
  if (KNOWN_DETAIL_TRANSLATIONS[message]) return KNOWN_DETAIL_TRANSLATIONS[message];
  if (/^Unknown checklist item:/i.test(message)) return 'Nieznane zadanie na checkliście.';
  return message;
}

/**
 * Keep only a short, single-line human message from an error payload.
 * Markup, serialized payloads, and common server diagnostics are never shown.
 */
function isCleanHumanReadableMessage(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const message = value.trim();
  if (!message || message.length > 300 || /[\r\n\u0000-\u001f]/.test(message)) return false;
  if (/[<>]/.test(message) || /^[\[{]/.test(message) || /[\]}]$/.test(message)) return false;


  return /[\p{L}\p{N}]/u.test(message);
}

function detailFromErrorBody(body: string): string | null {
  if (!body.trim()) return null;
  try {
    const payload: unknown = JSON.parse(body);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
    const detail = (payload as Record<string, unknown>).detail;
    if (typeof detail !== 'string') return null;
    const translated = translateKnownDetail(detail.trim());
    return isCleanHumanReadableMessage(translated) ? translated : null;
  } catch {
    return null;
  }
}

/** Use only messages created by this client; arbitrary thrown errors stay hidden. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;
  const message = translateKnownDetail(error.message);
  if (isCleanHumanReadableMessage(message)) return message;
  return error.status === undefined ? fallback : messageForStatus(error.status);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  const callerSignal = init?.signal;
  const abortFromCaller = () => controller.abort();
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort();
    else callerSignal.addEventListener('abort', abortFromCaller, { once: true });
  }

  try {
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      });
    } catch {
      throw new ApiError(timedOut ? API_TIMEOUT_MESSAGE : API_GENERAL_ERROR_MESSAGE);
    }

    let body = '';
    try {
      body = await response.text();
    } catch {
      throw new ApiError(timedOut ? API_TIMEOUT_MESSAGE : (response.ok ? API_INVALID_RESPONSE_MESSAGE : messageForStatus(response.status)), response.status);
    }

    if (!response.ok) {
      const safeDetail = detailFromErrorBody(body);
      throw new ApiError(safeDetail ?? messageForStatus(response.status), response.status);
    }
    if (response.status === 204) return undefined as T;
    if (!body.trim()) throw new ApiError(API_INVALID_RESPONSE_MESSAGE, response.status);

    try {
      return JSON.parse(body) as T;
    } catch {
      throw new ApiError(API_INVALID_RESPONSE_MESSAGE, response.status);
    }
  } finally {
    globalThis.clearTimeout(timeoutId);
    callerSignal?.removeEventListener('abort', abortFromCaller);
  }
}

export interface ReferenceData {
  six_r: { rank: number; name: string; description: string }[];
  areas: EventArea[];
  criteria: VendorCriterion[];
  area_questions: AreaQuestions[];
  area_criteria: AreaCriteria[];
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
  selected_options?: Record<string, number>;
  status: string;
  slug?: string | null;
  shareUrl?: string | null;
  share_url?: string | null;
}

/** Public read-only event payload returned for a shareable event slug. */
export interface PublicEventResponse {
  event?: EventRecord & Record<string, any>;
  eguide?: any;
  guide?: any;
  impact?: ImpactSummary;
  impactSummary?: ImpactSummary;
  [key: string]: any;
}

export type EGuideAiStatus = 'disabled' | 'in_progress' | 'ready' | 'failed';

/** Normalize the guide contract, accepting Polish and English enum spellings. */
export function normalizeEguide(raw: any): any {
  const value = String(raw?.ai_status ?? raw?.aiStatus ?? raw?.status_ai ?? raw?.status ?? '').toLowerCase();
  const aiStatus: EGuideAiStatus = value === 'w toku' || value === 'in_progress' || value === 'in progress' ? 'in_progress' : value === 'gotowe' || value === 'ready' ? 'ready' : value === 'nieudane' || value === 'failed' ? 'failed' : 'disabled';
  return {
    ...raw,
    aiStatus,
    aiEnabled: raw?.ai_enabled ?? raw?.aiEnabled ?? aiStatus !== 'disabled',
    organizerChecklist: raw?.organizer_checklist || raw?.organizerChecklist || [],
    teamChecklists: (raw?.team_checklists || raw?.teamChecklists || []).map((team: any) => { const { contact: _contact, ...withoutContact } = team || {}; return withoutContact; }),
    decisions: raw?.ustalenia || raw?.decisions || raw?.selected_areas || raw?.selectedAreas || [],
  };
}

/** Single checkbox toggle sent to PATCH /events/{id}/eguide/checklist. */
export interface ChecklistDonePayload { itemId: string; isDone: boolean; role?: string; task?: string; }

/** POST /events/{id}/suggest-areas. Always 200: `message` says why there are none. */
export interface AreaSuggestionResponse { available: boolean; message: string; suggestions: AreaSuggestion[]; }

// The /criteria and /recommendations routes stay on the backend as a neutral
// category compatibility shim, but they have no client: criteria come from
// /reference-data, and no screen may ever rank a vendor.
export const api = {
  reference: () => request<ReferenceData>('/reference-data'),
  createEvent: (payload: Record<string, unknown>) => request<EventRecord>('/events', { method: 'POST', body: JSON.stringify(payload) }),
  getEvent: (id: string) => request<EventRecord>(`/events/${id}`),
  /** Fetch a read-only event view without creating or changing an event. */
  publicEvent: async (slug: string) => {
    const encoded = encodeURIComponent(slug);
    try {
      return await request<PublicEventResponse>(`/events/public/${encoded}`);
    } catch (error) {
      // Keep compatibility with deployments that mount public reads below /public.
      if (error instanceof ApiError && error.status === 404) return request<PublicEventResponse>(`/public/events/${encoded}`);
      throw error;
    }
  },
  updateEvent: (id: string, payload: Record<string, unknown>) => request<EventRecord>(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  setNeededAreas: (id: string, areas: AreaId[]) => request<EventRecord>(`/events/${id}/needed-areas`, { method: 'PATCH', body: JSON.stringify({ neededAreas: areas }) }),
  analyze: (id: string) => request<unknown>(`/events/${id}/analyze`, { method: 'POST' }),
  checklist: (id: string) => request<unknown>(`/events/${id}/checklist`),
  updateChecklist: (id: string, payload: unknown) => request<unknown>(`/events/${id}/checklist`, { method: 'PATCH', body: JSON.stringify(payload) }),
  options: (id: string) => request<{ areas: EventArea[]; selectedOptions: Record<string, number> }>(`/events/${id}/options`),
  updateOptions: (id: string, selections: unknown[]) => request<unknown>(`/events/${id}/options`, { method: 'PATCH', body: JSON.stringify({ selections }) }),
  /** Returns the whole compiled guide, so no follow-up GET is needed. */
  generateEguide: async (id: string) => normalizeEguide(await request<any>(`/events/${id}/eguide`, { method: 'POST' })),
  eguide: async (id: string) => normalizeEguide(await request<any>(`/events/${id}/eguide`)),
  setChecklistDone: async (id: string, payload: ChecklistDonePayload) => normalizeEguide(await request<any>(`/events/${id}/eguide/checklist`, { method: 'PATCH', body: JSON.stringify(payload) })),
  impact: (id: string) => request<ImpactSummary>(`/events/${id}/impact`),
  suggestAreas: (id: string) => request<AreaSuggestionResponse>(`/events/${id}/suggest-areas`, { method: 'POST' }),
};

/** Area-scoped criterion; the backend spells the keys in Polish on /reference-data. */
const toAreaCriterion = (item: any): AreaCriterion => ({
  name: item.name,
  howToVerify: item.howToVerify || item.jak_sprawdzic || '',
  evidence: item.evidence || item.dowod || '',
  warning: item.warning || item.sygnal_ostrzegawczy || '',
});

const toRisk = (item: any): GreenwashingRisk => ({
  vendorName: item.vendorName || item.vendor_name,
  claim: item.claim,
  areaIds: item.areaIds || item.area_ids || [],
  flag: item.flag,
  explanation: item.explanation,
  followUp: item.followUp || item.follow_up,
});

export function normalizeReference(raw: any): ReferenceData {
  const areaCriteria: AreaCriteria[] = (raw.area_criteria || raw.areaCriteria || []).map((item: any) => ({
    areaId: item.areaId || item.area_id,
    areaName: item.areaName || item.area_name,
    criteria: (item.criteria || []).map(toAreaCriterion),
  }));
  const areas = (raw.areas || []).map((area: any) => ({
    ...area,
    providerQuestions: area.providerQuestions || area.provider_questions || [],
    // The area may carry its own criteria; if it does not, join on the id so the
    // creator can always show the criteria that belong to the choice on screen.
    criteria: (area.criteria && area.criteria.length ? area.criteria : areaCriteria.find((entry) => entry.areaId === area.id)?.criteria || []).map(toAreaCriterion),
    greenwashingRisks: (area.greenwashingRisks || area.greenwashing_risks || []).map(toRisk),
    levels: (area.levels || []).map((level: any) => ({ ...level, useAiSuggestions: level.useAiSuggestions ?? level.use_ai_suggestions, sixR: level.sixR || level.six_r || [] })),
  }));
  const ecoSummary = raw.eco_summary || raw.ecoSummary;
  return {
    six_r: raw.six_r || raw.sixR || [],
    areas,
    criteria: (raw.criteria || []).map((item: any) => ({ name: item.name, howToVerify: item.howToVerify || item.jak_sprawdzic, warning: item.warning || item.sygnal_ostrzegawczy })),
    area_criteria: areaCriteria,
    area_questions: (raw.area_questions || raw.areaQuestions || []).map((item: any) => ({ areaId: item.areaId || item.area_id, areaName: item.areaName || item.area_name, providerQuestions: item.providerQuestions || item.pytania_do_dostawcy || [] })),
    organizer_checklist: (raw.organizer_checklist || raw.organizerChecklist || []).map((item: any) => ({ ...item, areaId: item.areaId ?? item.area_id ?? null, milestone: item.milestone ?? null, minLevel: item.minLevel ?? item.min_level ?? 1, isDone: item.isDone ?? item.is_done ?? false })),
    team_roles: (raw.team_roles || raw.teamRoles || []).map((item: any) => { const { contact: _contact, ...withoutContact } = item || {}; return { ...withoutContact, taskAreas: item.taskAreas || item.task_areas || [], completedTasks: item.completedTasks || item.completed_tasks || [] }; }),
    contract_clauses: raw.contract_clauses || raw.contractClauses || [],
    greenwashing_risks: (raw.greenwashing_risks || raw.greenwashingRisks || []).map(toRisk),
    eco_summary: ecoSummary ? { kgCo2eMin: ecoSummary.kgCo2eMin ?? ecoSummary.kg_co2e_min, kgCo2eMax: ecoSummary.kgCo2eMax ?? ecoSummary.kg_co2e_max, optimizedKgCo2eMin: ecoSummary.optimizedKgCo2eMin ?? ecoSummary.optimized_kg_co2e_min, optimizedKgCo2eMax: ecoSummary.optimizedKgCo2eMax ?? ecoSummary.optimized_kg_co2e_max, savedPln: ecoSummary.savedPln ?? ecoSummary.saved_pln, emissionFactorSources: ecoSummary.emissionFactorSources || ecoSummary.emission_factor_sources || [] } : null,
    default_pilot: raw.default_pilot || raw.defaultPilot || { city: 'Podaj miejsce wydarzenia', radiusKm: 20, eventStart: '09:30', prioritizeRail: true, prioritizeElectricBuses: true },
    source_ids: raw.source_ids || raw.sourceIds || [],
  };
}
