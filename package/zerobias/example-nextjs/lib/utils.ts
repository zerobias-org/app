export function getFutureDate(addYears:number) {
  const date = new Date();
  const year = date.getFullYear() + addYears;
  const newDate = new Date();
  newDate.setFullYear(year);
  return newDate;
}

export function minutesToDuration(minutes:number) {
  return `PT${minutes}M`;
}