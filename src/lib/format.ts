export function formatPrice(price: number) {
  return `$${price.toLocaleString("es-AR")}`;
}

export function formatDateForDisplay(date: string) {
  const [year, month, day] = normalizeDateValue(date).split("-");

  if (!year || !month || !day) {
    return date;
  }

  return `${day}/${month}/${year}`;
}

export function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function normalizeDateValue(date: string) {
  return date.slice(0, 10);
}

export function normalizeTimeValue(time: string) {
  const [hours = "00", minutes = "00"] = time.split(":");

  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

export function timeValueToMinutes(time: string) {
  const [hours, minutes] = normalizeTimeValue(time).split(":").map(Number);

  return hours * 60 + minutes;
}
