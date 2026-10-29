/** Polish number formatting shared by the organizer impact view and the public page. */
export const formatKg = (value: number) => `${value.toLocaleString('pl-PL', { maximumFractionDigits: 1 })} kg CO2e`;
export const formatPln = (value: number) => `${value.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`;
