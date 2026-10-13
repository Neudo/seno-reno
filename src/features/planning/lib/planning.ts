import type { ChantierRecord } from "@/features/chantiers/api/chantiers-api";

export function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getMonthDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const visibleDays = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;

  return Array.from(
    { length: visibleDays },
    (_, index) =>
      new Date(month.getFullYear(), month.getMonth(), 1 - mondayOffset + index),
  );
}

export function getEndDate(chantier: ChantierRecord) {
  return (
    chantier.actualEndDate ??
    chantier.plannedEndDate ??
    chantier.plannedStartDate
  );
}

export function isScheduledOn(chantier: ChantierRecord, date: Date) {
  if (!chantier.plannedStartDate) return false;
  const isoDate = toIsoDate(date);
  return (
    isoDate >= chantier.plannedStartDate && isoDate <= getEndDate(chantier)!
  );
}

export function overlapsMonth(chantier: ChantierRecord, month: Date) {
  if (!chantier.plannedStartDate) return false;
  const monthStart = toIsoDate(
    new Date(month.getFullYear(), month.getMonth(), 1),
  );
  const monthEnd = toIsoDate(
    new Date(month.getFullYear(), month.getMonth() + 1, 0),
  );
  return (
    chantier.plannedStartDate <= monthEnd && getEndDate(chantier)! >= monthStart
  );
}

export function getPlanningChantiers(
  chantiers: ChantierRecord[],
  selectedChantierId: string,
  month?: Date,
) {
  return chantiers
    .filter(
      (chantier) =>
        (!selectedChantierId || chantier.id === selectedChantierId) &&
        (!month || overlapsMonth(chantier, month)),
    )
    .sort((left, right) => {
      if (left.plannedStartDate === right.plannedStartDate) {
        return left.name.localeCompare(right.name, "fr");
      }
      if (!left.plannedStartDate) return 1;
      if (!right.plannedStartDate) return -1;
      return left.plannedStartDate.localeCompare(right.plannedStartDate);
    });
}
