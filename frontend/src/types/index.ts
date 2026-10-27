export type LifecycleStage = 'Przed' | 'W trakcie' | 'Po';
export type SixR = 'Przemyśl' | 'Rezygnuj' | 'Ograniczaj' | 'Używaj ponownie' | 'Naprawiaj' | 'Recykling';
export type CostEffect = 'Obniża koszt' | 'Bez dodatkowych kosztów' | 'Wymaga budżetu' | 'Zależy od oferty' | 'Wymaga czasu zespołu';
export type AreaId = 'dojazd' | 'zakwaterowanie' | 'catering' | 'materialy' | 'gadzety' | 'ludzie' | 'po-wydarzeniu';
export type Milestone = 'T-60' | 'T-30' | 'T-7' | 'T-0' | 'T+7';
export type FlagColor = 'green' | 'yellow' | 'red';
export interface OptionLevel { level: 1 | 2 | 3; label: 'minimum' | 'lepiej' | 'najlepiej'; description: string; why: string; cost: CostEffect; tags: string[]; sixR?: SixR[]; }
export interface EventArea { id: string; name: string; stage: LifecycleStage; lead: string; levels: OptionLevel[]; providerQuestions: string[]; note?: string; }
export interface VendorCriterion { name: string; howToVerify: string; warning: string; }
export interface AreaQuestions { areaId: string; areaName: string; providerQuestions: string[]; }
export interface ChecklistItem { id: string; area: string; areaId?: AreaId | null; label: string; milestone?: Milestone | null; isDone?: boolean; }
export interface TeamRole { role: string; contact: string; tasks: string[]; completedTasks?: string[]; }
export interface ContractClause { kind: string; text: string; }
export interface GreenwashingRisk { vendorName: string; claim: string; flag: FlagColor; explanation: string; followUp: string; }
export interface EcoSummary { kgCo2eMin: number; kgCo2eMax: number; optimizedKgCo2eMin: number; optimizedKgCo2eMax: number; savedPln: number; emissionFactorSources: string[]; }
export interface EcoMotivator { squirrelsSaved: number; treesSaved: number; co2eSavedKg: number; message: string; metricName: string; }
export interface ImpactSummary extends EcoSummary { provenance: string[]; ecoMotivator: EcoMotivator; }
export interface PilotConfig { city: string; radiusKm: number; eventStart: string; prioritizeRail: boolean; prioritizeElectricBuses: boolean; }
