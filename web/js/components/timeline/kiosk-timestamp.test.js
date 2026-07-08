/* eslint-disable react/jsx-boolean-value */
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import KioskTimeStamp from './kiosk-timestamp';

jest.mock('../../util/util', () => ({
  __esModule: true,
  default: {
    pad: jest.fn((num, width, char) => String(num).padStart(width, char)),
  },
}));

jest.mock('../../modules/date/constants', () => ({
  MONTH_STRING_ARRAY: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
}));

// June 15, 2020 12:00 UTC = June 15 08:00 EDT (America/New_York, UTC-4 summer)
const summerDate = new Date('2020-06-15T12:00:00Z');
// January 15, 2020 17:00 UTC = January 15 12:00 EST (America/New_York, UTC-5 winter)
const winterDate = new Date('2020-01-15T17:00:00Z');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('KioskTimeStamp', () => {
  describe('subdaily=false — only date elements rendered', () => {
    it('renders day, month, and year elements', () => {
      const { container } = render(
        <KioskTimeStamp date={summerDate} subdaily={false} isKioskModeActive={false} />,
      );
      expect(container.querySelector('.kiosk-day')).toBeInTheDocument();
      expect(container.querySelector('.kiosk-month')).toBeInTheDocument();
      expect(container.querySelector('.kiosk-year')).toBeInTheDocument();
    });

    it('does not render time or timezone elements', () => {
      const { container } = render(
        <KioskTimeStamp date={summerDate} subdaily={false} isKioskModeActive={false} />,
      );
      expect(container.querySelector('.kiosk-hours')).not.toBeInTheDocument();
      expect(container.querySelector('.kiosk-minutes')).not.toBeInTheDocument();
      expect(container.querySelector('.kiosk-seconds')).not.toBeInTheDocument();
      expect(container.querySelector('.kiosk-timezone')).not.toBeInTheDocument();
    });

    it('shows UTC day, month, year when isKioskModeActive=false', () => {
      const { container } = render(
        <KioskTimeStamp date={summerDate} subdaily={false} isKioskModeActive={false} />,
      );
      expect(container.querySelector('.kiosk-day').textContent.trim()).toBe('15');
      expect(container.querySelector('.kiosk-month').textContent.trim()).toBe('JUN');
      expect(container.querySelector('.kiosk-year').textContent.trim()).toBe('2020');
    });

    it('still shows UTC values when isKioskModeActive=true but subdaily=false (updateKioskModeTime=false)', () => {
      // updateKioskModeTime = true && false = false → UTC values, not kiosk values
      const { container } = render(
        <KioskTimeStamp date={summerDate} subdaily={false} isKioskModeActive={true} />,
      );
      expect(container.querySelector('.kiosk-month').textContent.trim()).toBe('JUN');
      expect(container.querySelector('.kiosk-year').textContent.trim()).toBe('2020');
    });
  });

  describe('subdaily=true, isKioskModeActive=false — UTC mode', () => {
    it('renders all time elements', () => {
      const { container } = render(
        <KioskTimeStamp date={summerDate} subdaily={true} isKioskModeActive={false} />,
      );
      expect(container.querySelector('.kiosk-hours')).toBeInTheDocument();
      expect(container.querySelector('.kiosk-minutes')).toBeInTheDocument();
      expect(container.querySelector('.kiosk-seconds')).toBeInTheDocument();
      expect(container.querySelector('.kiosk-timezone')).toBeInTheDocument();
    });

    it('renders 2 colon separators', () => {
      const { container } = render(
        <KioskTimeStamp date={summerDate} subdaily={true} isKioskModeActive={false} />,
      );
      expect(container.querySelectorAll('.kiosk-colon')).toHaveLength(2);
    });

    it('shows "UTC" timezone label', () => {
      const { container } = render(
        <KioskTimeStamp date={summerDate} subdaily={true} isKioskModeActive={false} />,
      );
      expect(container.querySelector('.kiosk-timezone').textContent.trim()).toBe('UTC');
    });

    it('shows seconds as "00"', () => {
      const { container } = render(
        <KioskTimeStamp date={summerDate} subdaily={true} isKioskModeActive={false} />,
      );
      expect(container.querySelector('.kiosk-seconds').textContent.trim()).toBe('00');
    });

    it('shows UTC day, month, year', () => {
      const { container } = render(
        <KioskTimeStamp date={summerDate} subdaily={true} isKioskModeActive={false} />,
      );
      expect(container.querySelector('.kiosk-day').textContent.trim()).toBe('15');
      expect(container.querySelector('.kiosk-month').textContent.trim()).toBe('JUN');
      expect(container.querySelector('.kiosk-year').textContent.trim()).toBe('2020');
    });

    it('shows UTC hour (12 for noon UTC)', () => {
      const { container } = render(
        <KioskTimeStamp date={summerDate} subdaily={true} isKioskModeActive={false} />,
      );
      expect(container.querySelector('.kiosk-hours').textContent.trim()).toBe('12');
    });

    it('shows Intl minutes (NY-timezone minutes from formatToParts)', () => {
      const { container } = render(
        <KioskTimeStamp date={summerDate} subdaily={true} isKioskModeActive={false} />,
      );
      expect(container.querySelector('.kiosk-minutes').textContent.trim()).toBe('00');
    });
  });

  describe('subdaily=true, isKioskModeActive=true — kiosk (America/New_York) mode', () => {
    it('renders kiosk year and Intl-formatted month (3-letter slice, mixed case)', () => {
      const { container } = render(
        <KioskTimeStamp date={summerDate} subdaily={true} isKioskModeActive={true} />,
      );
      expect(container.querySelector('.kiosk-year').textContent.trim()).toBe('2020');
      // Intl gives 'June', sliced to 'Jun' — distinct from UTC path 'JUN'
      expect(container.querySelector('.kiosk-month').textContent.trim()).toBe('Jun');
    });

    it('shows America/New_York hour (UTC 12:00 = EDT 08:00)', () => {
      const { container } = render(
        <KioskTimeStamp date={summerDate} subdaily={true} isKioskModeActive={true} />,
      );
      expect(container.querySelector('.kiosk-hours').textContent.trim()).toBe('08');
    });

    it('shows EDT when DST is active (mocked getTimezoneOffset simulates summer offset)', () => {
      // Force current time to July so toLocaleString gives a summer NY date,
      // then mock getTimezoneOffset to return summer vs winter offsets.
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2020-07-15T12:00:00Z'));
      const tzSpy = jest.spyOn(Date.prototype, 'getTimezoneOffset').mockImplementation(function() {
        const m = this.getMonth();
        // EDT months (April–October): offset 240 min (UTC-4); EST: 300 min (UTC-5)
        return (m >= 3 && m <= 9) ? 240 : 300;
      });

      const { container } = render(
        <KioskTimeStamp date={summerDate} subdaily={true} isKioskModeActive={true} />,
      );
      expect(container.querySelector('.kiosk-timezone').textContent.trim()).toBe('EDT');

      tzSpy.mockRestore();
      jest.useRealTimers();
    });

    it('shows EST when DST is not active (all offsets equal → isDaylightSavingTime=false)', () => {
      // Constant offset means dateObj.getTimezoneOffset() === Jan1.getTimezoneOffset(),
      // so 300 < 300 = false → EST.
      const tzSpy = jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(300);

      const { container } = render(
        <KioskTimeStamp date={winterDate} subdaily={true} isKioskModeActive={true} />,
      );
      expect(container.querySelector('.kiosk-timezone').textContent.trim()).toBe('EST');

      tzSpy.mockRestore();
    });
  });
});
