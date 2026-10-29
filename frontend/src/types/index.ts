export type LifecycleStage = 'Przed' | 'W trakcie' | 'Po';
export type SixR = 'Przemyśl' | 'Rezygnuj' | 'Ograniczaj' | 'Używaj ponownie' | 'Naprawiaj' | 'Recykling';
export type CostEffect = 'Obniża koszt' | 'Bez dodatkowych kosztów' | 'Wymaga budżetu' | 'Zależy od oferty' | 'Wymaga czasu zespołu';
export type AreaId = 'dojazd' | 'zakwaterowanie' | 'catering' | 'materialy' | 'gadzety' | 'ludzie' | 'po-wydarzeniu' | 'miejsce-i-sala' | 'energia-i-woda' | 'komunikacja' | 'dostepnosc';
export type Milestone = 'T-60' | 'T-30' | 'T-7' | 'T-0' | 'T+7';
export type FlagColor = 'green' | 'yellow' | 'red';
export interface OptionLevel { level: 1 | 2 | 3; label: 'minimum' | 'lepiej' | 'najlepiej'; description: string; why: string; cost: CostEffect; tags: string[]; sixR?: SixR[]; }
export interface EventArea { id: string; name: string; stage: LifecycleStage; lead: string; levels: OptionLevel[]; providerQuestions: string[]; criteria?: AreaCriterion[]; greenwashingRisks?: GreenwashingRisk[]; note?: string; }
export interface VendorCriterion { name: string; howToVerify: string; warning: string; }
/** A criterion written for one lifecycle area: narrower than VendorCriterion, and it names the evidence to ask for. */
export interface AreaCriterion { name: string; howToVerify: string; evidence: string; warning: string; }
export interface AreaCriteria { areaId: AreaId; areaName: string; criteria: AreaCriterion[]; }
export interface AreaSuggestion { areaId: AreaId; reason: string; }
export interface AreaQuestions { areaId: string; areaName: string; providerQuestions: string[]; }
export interface ChecklistItem { id: string; area: string; areaId?: AreaId | null; label: string; milestone?: Milestone | null; minLevel?: number; isDone?: boolean; }
export interface TeamRole { role: string; tasks: string[]; taskAreas?: AreaId[]; completedTasks?: string[]; }
export interface ContractClause { kind: string; text: string; }
export interface GreenwashingRisk { vendorName: string; claim: string; areaIds?: AreaId[]; flag: FlagColor; explanation: string; followUp: string; }
export interface EcoSummary { kgCo2eMin: number; kgCo2eMax: number; optimizedKgCo2eMin: number; optimizedKgCo2eMax: number; savedPln: number; emissionFactorSources: string[]; }
export interface EcoMotivator { squirrelsSaved: number; treesSaved: number; co2eSavedKg: number; message: string; metricName: string; }
export interface ImpactSummary extends EcoSummary { provenance: string[]; ecoMotivator: EcoMotivator; }
/** One arrangement: the level the organizer chose for a lifecycle area. Mirrors Ustalenie in backend/app/schemas/eguide.py. */
export interface Ustalenie { areaId: AreaId; areaName: string; level: number; levelLabel: string; justification: string; costEffect: string; }
/** Read-only projection served by GET /public/events/{slug}; mirrors PublicEventView in backend/app/schemas/public.py. */
export interface PublicEventView {
  title: string;
  eventType: string;
  eventDate: string;
  location: string;
  attendees: number;
  ustalenia: Ustalenie[];
  organizerChecklist: ChecklistItem[];
  teamChecklists: TeamRole[];
  impactSummary: ImpactSummary;
}
export interface PilotConfig { city: string; radiusKm: number; eventStart: string; prioritizeRail: boolean; prioritizeElectricBuses: boolean; }
