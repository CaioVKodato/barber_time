import { DateTime } from 'luxon';
import { env } from '../config/env.js';

/**
 * Regras de grade: domingo fechado, expediente, almoço e duração do slot.
 * Todos os instantes interpretados no fuso `SCHEDULE_TIMEZONE`.
 */

/**
 * @param {string} dateStr YYYY-MM-DD
 * @returns {DateTime} início do dia civil no fuso da barbearia
 */
export function parseBusinessDate(dateStr) {
  return DateTime.fromISO(dateStr, { zone: env.scheduleTimezone });
}

/**
 * Domingo (Luxon: weekday 7 = domingo) — barbearia fechada.
 * @param {DateTime} dayInZone
 */
export function isClosedOnThisDate(dayInZone) {
  if (!dayInZone.isValid) return true;
  if (!env.closedOnSunday) return false;
  return dayInZone.weekday === 7;
}

/**
 * Intervalo [slotStart, slotEnd) sobrepõe [lunchStart, lunchEnd)?
 * @param {DateTime} slotStart
 * @param {DateTime} slotEnd
 * @param {DateTime} lunchStart
 * @param {DateTime} lunchEnd
 */
export function slotOverlapsLunch(slotStart, slotEnd, lunchStart, lunchEnd) {
  if (!env.lunchBreakEnabled) return false;
  return slotStart < lunchEnd && slotEnd > lunchStart;
}

/**
 * Inícios de slot válidos (local) para um dia civil, ou array vazio se fechado.
 * @param {string} dateStr YYYY-MM-DD
 * @returns {DateTime[]}
 */
export function getBookableSlotStartsLocal(dateStr) {
  const d = parseBusinessDate(dateStr);
  if (!d.isValid) return [];
  if (isClosedOnThisDate(d)) return [];

  const open = d.set({
    hour: env.dayStartHour,
    minute: env.dayStartMinute,
    second: 0,
    millisecond: 0,
  });
  const close = d.set({
    hour: env.dayEndHour,
    minute: env.dayEndMinute,
    second: 0,
    millisecond: 0,
  });
  if (close <= open) return [];

  const lunchStart = d.set({
    hour: env.lunchStartHour,
    minute: env.lunchStartMinute,
    second: 0,
    millisecond: 0,
  });
  const lunchEnd = d.set({
    hour: env.lunchEndHour,
    minute: env.lunchEndMinute,
    second: 0,
    millisecond: 0,
  });

  const slotM = env.slotDurationMinutes;
  const out = [];
  for (let t = open; t.plus({ minutes: slotM }) <= close; t = t.plus({ minutes: slotM })) {
    const slotEnd = t.plus({ minutes: slotM });
    if (slotOverlapsLunch(t, slotEnd, lunchStart, lunchEnd)) continue;
    out.push(t);
  }
  return out;
}

/**
 * O instante local de início do corte é um dos slots retornados pela grade do dia?
 * @param {DateTime} localStart com fuso coerente (será normalizado para SCHEDULE_TIMEZONE)
 */
export function isValidBookableSlotStart(localStart) {
  const local = localStart.setZone(env.scheduleTimezone);
  if (local.second !== 0 || local.millisecond !== 0) return false;
  if (local.minute % env.slotDurationMinutes !== 0) return false;

  const dateStr = local.toFormat('yyyy-MM-dd');
  const candidates = getBookableSlotStartsLocal(dateStr);
  return candidates.some((c) => c.equals(local));
}
