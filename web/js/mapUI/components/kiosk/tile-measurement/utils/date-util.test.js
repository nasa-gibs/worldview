import {
  formatDailyDate,
  formatSubdailyDate,
  formatReduxDailyDate,
  formatReduxSubdailyDate,
  getDates,
  getOrbitalDatesBackwards,
  getOrbitalDatesForwards,
  getOrbitalDatesForwardsAndBackwards,
  getOrbitalDates,
} from './date-util';

// ─── formatDailyDate ──────────────────────────────────────────────────────────

describe('formatDailyDate', () => {
  it('formats a standard date correctly', () => {
    expect(formatDailyDate(new Date(2024, 5, 15))).toBe('2024-06-15');
  });

  it('pads single-digit month with a leading zero', () => {
    expect(formatDailyDate(new Date(2024, 0, 5))).toBe('2024-01-05');
  });

  it('pads single-digit day with a leading zero', () => {
    expect(formatDailyDate(new Date(2024, 11, 3))).toBe('2024-12-03');
  });

  it('formats the last day of the year correctly', () => {
    expect(formatDailyDate(new Date(2024, 11, 31))).toBe('2024-12-31');
  });

  it('formats the first day of the year correctly', () => {
    expect(formatDailyDate(new Date(2024, 0, 1))).toBe('2024-01-01');
  });

  it('returns a string in YYYY-MM-DD format', () => {
    expect(formatDailyDate(new Date(2020, 2, 20))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ─── formatSubdailyDate ───────────────────────────────────────────────────────

describe('formatSubdailyDate', () => {
  it('formats a date with time correctly', () => {
    expect(formatSubdailyDate(new Date(2024, 5, 15, 14, 30))).toBe('2024-06-15T14:30:00Z');
  });

  it('pads single-digit hour with a leading zero', () => {
    expect(formatSubdailyDate(new Date(2024, 5, 15, 9, 5))).toBe('2024-06-15T09:05:00Z');
  });

  it('pads single-digit minute with a leading zero', () => {
    expect(formatSubdailyDate(new Date(2024, 5, 15, 10, 7))).toBe('2024-06-15T10:07:00Z');
  });

  it('formats midnight correctly', () => {
    expect(formatSubdailyDate(new Date(2024, 5, 15, 0, 0))).toBe('2024-06-15T00:00:00Z');
  });

  it('always ends with :00Z', () => {
    const result = formatSubdailyDate(new Date(2024, 5, 15, 12, 45));
    expect(result).toMatch(/:00Z$/);
  });

  it('returns a string in YYYY-MM-DDTHH:MM:00Z format', () => {
    expect(formatSubdailyDate(new Date(2024, 5, 15, 8, 20))).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00Z$/,
    );
  });
});

// ─── formatReduxDailyDate ─────────────────────────────────────────────────────

describe('formatReduxDailyDate', () => {
  it('formats a UTC date string correctly', () => {
    expect(formatReduxDailyDate(new Date('2024-06-15T00:00:00Z'))).toBe('2024-06-15');
  });

  it('pads single-digit month with a leading zero', () => {
    expect(formatReduxDailyDate(new Date('2024-01-05T00:00:00Z'))).toBe('2024-01-05');
  });

  it('pads single-digit day with a leading zero', () => {
    expect(formatReduxDailyDate(new Date('2024-03-03T00:00:00Z'))).toBe('2024-03-03');
  });

  it('formats the last day of the year correctly', () => {
    expect(formatReduxDailyDate(new Date('2024-12-31T00:00:00Z'))).toBe('2024-12-31');
  });

  it('returns a string in YYYY-MM-DD format', () => {
    expect(formatReduxDailyDate(new Date('2022-08-20T00:00:00Z'))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('ignores the time component', () => {
    expect(formatReduxDailyDate(new Date('2024-06-15T23:59:59Z'))).toBe('2024-06-15');
  });
});

// ─── formatReduxSubdailyDate ──────────────────────────────────────────────────

describe('formatReduxSubdailyDate', () => {
  it('formats a UTC datetime correctly', () => {
    expect(formatReduxSubdailyDate(new Date('2024-06-15T14:30:00Z'))).toBe('2024-06-15T14:30:00Z');
  });

  it('pads single-digit hour with a leading zero', () => {
    expect(formatReduxSubdailyDate(new Date('2024-06-15T09:05:00Z'))).toBe('2024-06-15T09:05:00Z');
  });

  it('pads single-digit minute with a leading zero', () => {
    expect(formatReduxSubdailyDate(new Date('2024-06-15T10:07:00Z'))).toBe('2024-06-15T10:07:00Z');
  });

  it('formats midnight correctly', () => {
    expect(formatReduxSubdailyDate(new Date('2024-06-15T00:00:00Z'))).toBe('2024-06-15T00:00:00Z');
  });

  it('always ends with :00Z', () => {
    expect(formatReduxSubdailyDate(new Date('2024-06-15T12:45:00Z'))).toMatch(/:00Z$/);
  });

  it('returns a string in YYYY-MM-DDTHH:MM:00Z format', () => {
    expect(formatReduxSubdailyDate(new Date('2024-06-15T08:20:00Z'))).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00Z$/,
    );
  });
});

// ─── getDates ─────────────────────────────────────────────────────────────────

describe('getDates', () => {
  const selectedDate = new Date('2024-06-15T12:00:00Z');

  describe('daily period', () => {
    it('returns an array when period is "daily"', () => {
      expect(Array.isArray(getDates(selectedDate, 'daily'))).toBe(true);
    });

    it('returns 7 dates for daily period', () => {
      expect(getDates(selectedDate, 'daily')).toHaveLength(7);
    });

    it('first date is the selected date', () => {
      const dates = getDates(selectedDate, 'daily');
      expect(dates[0]).toBe('2024-06-15');
    });

    it('dates are in descending order (most recent first)', () => {
      const dates = getDates(selectedDate, 'daily');
      expect(dates[0]).toBe('2024-06-15');
      expect(dates[1]).toBe('2024-06-14');
      expect(dates[2]).toBe('2024-06-13');
    });

    it('last date is 6 days before the selected date', () => {
      const dates = getDates(selectedDate, 'daily');
      expect(dates[6]).toBe('2024-06-09');
    });

    it('all dates match YYYY-MM-DD format', () => {
      getDates(selectedDate, 'daily').forEach((d) => {
        expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('wraps correctly around month boundaries', () => {
      const monthBoundary = new Date('2024-07-02T00:00:00Z');
      const dates = getDates(monthBoundary, 'daily');
      expect(dates).toContain('2024-06-30');
      expect(dates).toContain('2024-06-29');
    });

    it('wraps correctly around year boundaries', () => {
      const yearBoundary = new Date('2024-01-03T00:00:00Z');
      const dates = getDates(yearBoundary, 'daily');
      expect(dates).toContain('2023-12-31');
      expect(dates).toContain('2023-12-30');
    });
  });

  describe('subdaily period', () => {
    it('returns an array when period is "subdaily"', () => {
      expect(Array.isArray(getDates(selectedDate, 'subdaily'))).toBe(true);
    });

    it('returns 13 dates for subdaily period', () => {
      expect(getDates(selectedDate, 'subdaily')).toHaveLength(13);
    });

    it('all dates match subdaily format YYYY-MM-DDTHH:MM:00Z', () => {
      getDates(selectedDate, 'subdaily').forEach((d) => {
        expect(d).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00Z$/);
      });
    });

    it('all minutes are multiples of 10', () => {
      getDates(selectedDate, 'subdaily').forEach((d) => {
        const minutes = parseInt(d.slice(14, 16), 10);
        expect(minutes % 10).toBe(0);
      });
    });

    it('dates are in descending order (most recent first)', () => {
      const dates = getDates(selectedDate, 'subdaily');
      for (let i = 1; i < dates.length; i += 1) {
        expect(new Date(dates[i]).getTime()).toBeLessThan(new Date(dates[i - 1]).getTime());
      }
    });

    it('consecutive dates are exactly 10 minutes apart', () => {
      const dates = getDates(selectedDate, 'subdaily');
      for (let i = 1; i < dates.length; i += 1) {
        const diff = new Date(dates[i - 1]).getTime() - new Date(dates[i]).getTime();
        expect(diff).toBe(10 * 60 * 1000);
      }
    });

    it('first date is 30 minutes before selectedDate, rounded down to nearest 10 minutes', () => {
      const dates = getDates(new Date('2024-06-15T12:00:00Z'), 'subdaily');
      expect(dates[0]).toBe('2024-06-15T11:30:00Z');
    });

    it('rounds down an uneven minute correctly before subtracting 30 minutes', () => {
      const dates = getDates(new Date('2024-06-15T12:47:00Z'), 'subdaily');
      expect(dates[0]).toBe('2024-06-15T12:10:00Z');
    });
  });

  describe('period routing', () => {
    it('returns daily dates for period "daily"', () => {
      expect(getDates(selectedDate, 'daily')).toHaveLength(7);
    });

    it('returns subdaily dates for any period other than "daily"', () => {
      expect(getDates(selectedDate, 'subdaily')).toHaveLength(13);
    });

    it('returns subdaily dates when period is an empty string', () => {
      expect(getDates(selectedDate, '')).toHaveLength(13);
    });
  });
});

// ─── getOrbitalDatesBackwards ─────────────────────────────────────────────────

describe('getOrbitalDatesBackwards', () => {
  const selectedDate = new Date('2024-06-15T00:00:00Z');

  it('returns an array of 14 dates', () => {
    expect(getOrbitalDatesBackwards(selectedDate)).toHaveLength(14);
  });

  it('first date is the selected date', () => {
    expect(getOrbitalDatesBackwards(selectedDate)[0]).toBe('2024-06-15');
  });

  it('dates are in descending order', () => {
    const dates = getOrbitalDatesBackwards(selectedDate);
    for (let i = 1; i < dates.length; i += 1) {
      expect(new Date(dates[i]).getTime()).toBeLessThan(new Date(dates[i - 1]).getTime());
    }
  });

  it('last date is 13 days before the selected date', () => {
    const dates = getOrbitalDatesBackwards(selectedDate);
    expect(dates[13]).toBe('2024-06-02');
  });

  it('each consecutive date is 1 day earlier', () => {
    const dates = getOrbitalDatesBackwards(selectedDate);
    for (let i = 1; i < dates.length; i += 1) {
      const diff = new Date(dates[i - 1]).getTime() - new Date(dates[i]).getTime();
      expect(diff).toBe(24 * 60 * 60 * 1000);
    }
  });

  it('all dates match YYYY-MM-DD format', () => {
    getOrbitalDatesBackwards(selectedDate).forEach((d) => {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('wraps correctly across month boundaries', () => {
    const dates = getOrbitalDatesBackwards(new Date('2024-07-03T00:00:00Z'));
    expect(dates).toContain('2024-06-30');
    expect(dates).toContain('2024-06-29');
  });
});

// ─── getOrbitalDatesForwards ──────────────────────────────────────────────────

describe('getOrbitalDatesForwards', () => {
  const selectedDate = new Date('2024-06-01T00:00:00Z');
  const latestDate = '2024-06-15';

  it('first date is the selected date', () => {
    expect(getOrbitalDatesForwards(selectedDate, latestDate)[0]).toBe('2024-06-01');
  });

  it('does not exceed the latestDate', () => {
    const dates = getOrbitalDatesForwards(selectedDate, latestDate);
    dates.forEach((d) => {
      expect(new Date(d).getTime()).toBeLessThanOrEqual(new Date(latestDate).getTime());
    });
  });

  it('stops before the latestDate when latestDate is close', () => {
    // Use latestDate one day ahead so the boundary comparison is unambiguous
    const dates = getOrbitalDatesForwards(new Date('2024-06-14T00:00:00Z'), '2024-06-16');
    expect(dates).toContain('2024-06-14');
    expect(dates).toContain('2024-06-15');
    expect(dates).not.toContain('2024-06-17');
  });

  it('returns only the selected date when latestDate equals selectedDate', () => {
    const dates = getOrbitalDatesForwards(
      new Date('2024-06-15T00:00:00Z'),
      '2024-06-15',
    );
    expect(dates).toHaveLength(1);
    expect(dates[0]).toBe('2024-06-15');
  });

  it('returns up to 14 dates when latestDate is far in the future', () => {
    const dates = getOrbitalDatesForwards(selectedDate, '2030-01-01');
    expect(dates).toHaveLength(14);
  });

  it('dates are in ascending order', () => {
    const dates = getOrbitalDatesForwards(selectedDate, '2030-01-01');
    for (let i = 1; i < dates.length; i += 1) {
      expect(new Date(dates[i]).getTime()).toBeGreaterThan(new Date(dates[i - 1]).getTime());
    }
  });

  it('consecutive dates are 1 day apart', () => {
    const dates = getOrbitalDatesForwards(selectedDate, '2030-01-01');
    for (let i = 1; i < dates.length; i += 1) {
      const diff = new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime();
      expect(diff).toBe(24 * 60 * 60 * 1000);
    }
  });

  it('all dates match YYYY-MM-DD format', () => {
    getOrbitalDatesForwards(selectedDate, latestDate).forEach((d) => {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});

// ─── getOrbitalDatesForwardsAndBackwards ──────────────────────────────────────

describe('getOrbitalDatesForwardsAndBackwards', () => {
  const selectedDate = new Date('2024-06-15T00:00:00Z');
  const latestDate = '2030-01-01';

  it('returns a maximum of 14 dates', () => {
    expect(getOrbitalDatesForwardsAndBackwards(selectedDate, latestDate)).toHaveLength(14);
  });

  it('first date is always the selected date', () => {
    expect(getOrbitalDatesForwardsAndBackwards(selectedDate, latestDate)[0]).toBe('2024-06-15');
  });

  it('does not include dates beyond latestDate', () => {
    const dates = getOrbitalDatesForwardsAndBackwards(selectedDate, '2024-06-17');
    dates.forEach((d) => {
      expect(new Date(d).getTime()).toBeLessThanOrEqual(new Date('2024-06-17').getTime());
    });
  });

  it('includes both future and past dates', () => {
    const dates = getOrbitalDatesForwardsAndBackwards(selectedDate, latestDate);
    const hasAfter = dates.some((d) => new Date(d) > new Date(selectedDate));
    const hasBefore = dates.some((d) => new Date(d) < new Date(selectedDate));
    expect(hasAfter).toBe(true);
    expect(hasBefore).toBe(true);
  });

  it('all dates match YYYY-MM-DD format', () => {
    getOrbitalDatesForwardsAndBackwards(selectedDate, latestDate).forEach((d) => {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('does not contain duplicate dates', () => {
    const dates = getOrbitalDatesForwardsAndBackwards(selectedDate, latestDate);
    expect(new Set(dates).size).toBe(dates.length);
  });

  it('falls back to only past dates when latestDate equals selectedDate', () => {
    const dates = getOrbitalDatesForwardsAndBackwards(
      new Date('2024-06-15T00:00:00Z'),
      '2024-06-15',
    );
    dates.forEach((d) => {
      expect(new Date(d).getTime()).toBeLessThanOrEqual(new Date('2024-06-15').getTime());
    });
  });

  it('trims result to exactly 14 when more would be generated', () => {
    const dates = getOrbitalDatesForwardsAndBackwards(selectedDate, latestDate);
    expect(dates.length).toBeLessThanOrEqual(14);
  });
});

// ─── getOrbitalDates ──────────────────────────────────────────────────────────

describe('getOrbitalDates', () => {
  // Must be Date objects — the functions call .toLocaleString() on the selectedDate arg
  const selectedDate = new Date('2024-06-15T00:00:00Z');
  const latestDate = '2030-01-01';

  it('calls getOrbitalDatesForwards when searchMethod is 1', () => {
    const result = getOrbitalDates(selectedDate, latestDate, 1);
    expect(result).toBeDefined();
    expect(result[0]).toBe('2024-06-15');
    expect(new Date(result[1]).getTime()).toBeGreaterThan(new Date(result[0]).getTime());
  });

  it('calls getOrbitalDatesBackwards when searchMethod is 2', () => {
    const result = getOrbitalDates(selectedDate, latestDate, 2);
    expect(result).toBeDefined();
    expect(result[0]).toBe('2024-06-15');
    expect(new Date(result[1]).getTime()).toBeLessThan(new Date(result[0]).getTime());
  });

  it('calls getOrbitalDatesForwardsAndBackwards when searchMethod is 3', () => {
    const result = getOrbitalDates(selectedDate, latestDate, 3);
    expect(result).toBeDefined();
    expect(result).toHaveLength(14);
  });

  it('returns undefined when searchMethod is 0', () => {
    expect(getOrbitalDates(selectedDate, latestDate, 0)).toBeUndefined();
  });

  it('returns undefined when searchMethod is an unrecognized value', () => {
    expect(getOrbitalDates(selectedDate, latestDate, 99)).toBeUndefined();
  });

  it('returns undefined when searchMethod is undefined', () => {
    expect(getOrbitalDates(selectedDate, latestDate, undefined)).toBeUndefined();
  });

  it('returns an array for searchMethod 1', () => {
    expect(Array.isArray(getOrbitalDates(selectedDate, latestDate, 1))).toBe(true);
  });

  it('returns an array for searchMethod 2', () => {
    expect(Array.isArray(getOrbitalDates(selectedDate, latestDate, 2))).toBe(true);
  });

  it('returns an array for searchMethod 3', () => {
    expect(Array.isArray(getOrbitalDates(selectedDate, latestDate, 3))).toBe(true);
  });

  it('returns 14 dates for searchMethod 2 (backwards)', () => {
    expect(getOrbitalDates(selectedDate, latestDate, 2)).toHaveLength(14);
  });

  it('returns up to 14 dates for searchMethod 1 (forwards) with far latestDate', () => {
    expect(getOrbitalDates(selectedDate, latestDate, 1)).toHaveLength(14);
  });
});
