export type LifecycleStage = 'Przed' | 'W trakcie' | 'Po';
export type SixR = 'Przemyśl' | 'Rezygnuj' | 'Ograniczaj' | 'Używaj ponownie' | 'Naprawiaj' | 'Recykling';
export type CostEffect = 'Obniża koszt' | 'Bez dodatkowych kosztów' | 'Wymaga budżetu' | 'Zależy od oferty' | 'Wymaga czasu zespołu';
export interface OptionLevel { level: 1 | 2 | 3; label: 'minimum' | 'lepiej' | 'najlepiej'; description: string; why: string; cost: CostEffect; tags: string[]; }
export interface EventArea { id: string; name: string; stage: LifecycleStage; lead: string; levels: OptionLevel[]; providerQuestions: string[]; note?: string; }
export interface VendorCriterion { name: string; howToVerify: string; warning: string; }
export interface ChecklistItem { id: string; area: string; label: string; milestone?: string; isDone?: boolean; }
export interface TeamRole { role: string; contact: string; tasks: string[]; }
export interface PilotConfig { city: string; radiusKm: number; eventStart: string; prioritizeRail: boolean; prioritizeElectricBuses: boolean; }
