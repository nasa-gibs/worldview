import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { formatKioskDate } from './util';

describe('formatKioskDate', () => {
  it('formats a kiosk date without time', () => {
    const date = new Date(Date.UTC(2022, 6, 4, 12, 5, 30));

    render(<div>{formatKioskDate(date, false)}</div>);

    expect(screen.getByText('04 Jul 2022')).toBeInTheDocument();
  });

  it('formats a subdaily kiosk date with time and EDT suffix', () => {
    const date = new Date(Date.UTC(2021, 0, 15, 18, 30, 0));

    render(<div>{formatKioskDate(date, true)}</div>);

    expect(screen.getByText('15 Jan 2021 13:30:00 EDT')).toBeInTheDocument();
  });

  it('preserves leading zeros for day and minute values', () => {
    const date = new Date(Date.UTC(2022, 0, 5, 9, 5, 0));
    const formatted = formatKioskDate(date, true);

    expect(formatted).toBe('05 Jan 2022 04:05:00 EDT');
    expect(formatted).toContain('05 Jan 2022');
    expect(formatted).toContain('04:05:00 EDT');
  });
});
