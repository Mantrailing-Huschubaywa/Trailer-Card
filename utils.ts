
// utils.ts

import { TrainingLevelEnum } from './types';

/**
 * Parses a date string in DD.MM.YYYY format into a Date object.
 * @param dateString The date string to parse.
 * @returns A Date object, or null if parsing fails.
 */
export const parseDateString = (dateString: string): Date | null => {
  if (!dateString) return null;

  // Check if ISO-8601 or YYYY-MM-DD format (contains '-')
  if (dateString.includes('-')) {
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? null : d;
  }

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

/**
 * Formats a Date object as a German date string with a fixed, zero-padded
 * DD.MM.YYYY layout (e.g. '05.07.2026' instead of '5.7.2026').
 *
 * This is used everywhere a transaction/customer date is created so that
 * every stored/displayed date has exactly the same format, regardless of
 * which day of the month it is. Using this instead of a bare
 * `toLocaleDateString('de-DE')` call avoids the inconsistent-looking dates
 * (some with leading zeros, some without) that were showing up across the app.
 * @param date The date to format.
 * @returns A zero-padded DD.MM.YYYY string.
 */
export const formatDateDE = (date: Date): string => {
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Helper function to get color classes based on training level for the avatar circle.
 * @param level The training level of the customer.
 * @returns A Tailwind CSS background color class string.
 */
export const getAvatarColorForLevel = (level: TrainingLevelEnum): string => {
  switch (level) {
    case TrainingLevelEnum.EINSTEIGER:
      return 'bg-fuchsia-500';
    case TrainingLevelEnum.GRUNDLAGEN:
      return 'bg-lime-500';
    case TrainingLevelEnum.FORTGESCHRITTENE:
      return 'bg-sky-500';
    case TrainingLevelEnum.MASTERCLASS:
      return 'bg-amber-500';
    case TrainingLevelEnum.EXPERT:
      return 'bg-indigo-500';
    default:
      return 'bg-gray-400';
  }
};
