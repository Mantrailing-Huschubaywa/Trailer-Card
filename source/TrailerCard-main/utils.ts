
// utils.ts

/**
 * Parses a date string in DD.MM.YYYY format into a Date object.
 * @param dateString The date string to parse.
 * @returns A Date object, or null if parsing fails.
 */
export const parseDateString = (dateString: string): Date | null => {
  const parts = dateString.split('.');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(parts[2], 10);

    const date = new Date(year, month, day);
    // Validate if the parsed date components match the input to catch invalid dates like "31.02.2025"
    if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
      return date;
    }
  }
  return null;
};

/**
 * Checks if two Date objects represent the same day (ignoring time).
 * @param date1 The first Date object.
 * @param date2 The second Date object.
 * @returns True if they represent the same day, false otherwise.
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

/**
 * Checks if two Date objects represent the same month and year (ignoring day and time).
 * @param date1 The first Date object.
 * @param date2 The second Date object.
 * @returns True if they represent the same month and year, false otherwise.
 */
export const isSameMonth = (date1: Date, date2: Date): boolean => {
  return (
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};
