import type { Milestone } from '../../types';

/** Polish names for the lifecycle milestones the organizer checklist is grouped by. */
export const MILESTONES: { id: Milestone; title: string; hint: string }[] = [
  { id: 'T-60', title: 'Na 60 dni przed wydarzeniem', hint: 'Decyzje, które trudno cofnąć później.' },
  { id: 'T-30', title: 'Na 30 dni przed wydarzeniem', hint: 'Zamówienia i ustalenia z dostawcami.' },
  { id: 'T-7', title: 'Na tydzień przed wydarzeniem', hint: 'Ostatnie potwierdzenia i materiały.' },
  { id: 'T-0', title: 'W dniu wydarzenia', hint: 'To, co dzieje się na miejscu.' },
  { id: 'T+7', title: 'Tydzień po wydarzeniu', hint: 'Pomiar, wnioski i następna edycja.' },
];

export const OTHER_MILESTONE = { id: 'inne', title: 'Bez wyznaczonego terminu', hint: 'Zadania, które warto zaplanować samodzielnie.' };

export interface MilestoneGroup<T> { id: string; title: string; hint: string; items: T[] }

/** Split checklist items into the fixed milestone order, dropping groups nobody filled. */
export function groupByMilestone<T extends { milestone?: Milestone | null }>(items: T[]): MilestoneGroup<T>[] {
  const groups: MilestoneGroup<T>[] = MILESTONES.map((milestone) => ({ ...milestone, items: items.filter((item) => item.milestone === milestone.id) }));
  groups.push({ ...OTHER_MILESTONE, items: items.filter((item) => !MILESTONES.some((milestone) => milestone.id === item.milestone)) });
  return groups.filter((group) => group.items.length > 0);
}
