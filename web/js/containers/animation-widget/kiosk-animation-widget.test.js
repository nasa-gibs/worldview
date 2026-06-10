/* eslint-disable react/jsx-props-no-spreading */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('../../components/kiosk/util', () => ({
  formatKioskDate: jest.fn((date, hasSubdailyLayers) => (
    hasSubdailyLayers
      ? `subdaily:${date.toISOString()}`
      : `daily:${date.toISOString()}`
  )),
}));

import { formatKioskDate } from '../../components/kiosk/util';
import KioskAnimationWidget from './kiosk-animation-widget';

const startDate = new Date('2023-01-01T00:00:00.000Z');
const endDate = new Date('2023-01-10T00:00:00.000Z');

const defaultProps = {
  startDate,
  endDate,
  hasSubdailyLayers: false,
};

const renderWidget = (overrides = {}) => render(
  <KioskAnimationWidget {...defaultProps} {...overrides} />,
);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('KioskAnimationWidget rendering', () => {
  test('renders wrapper and widget divs', () => {
    const { container } = renderWidget();
    expect(container.querySelector('.wv-kiosk-animation-wrapper')).toBeInTheDocument();
    expect(container.querySelector('.wv-kiosk-animation-widget')).toBeInTheDocument();
    expect(container.querySelector('.kiosk-animation-widget-row')).toBeInTheDocument();
  });

  test('renders " to " middle label', () => {
    const { container } = renderWidget();
    const middle = container.querySelector('#kiosk-animation-widget-middle-label');
    expect(middle).toBeInTheDocument();
    expect(middle.textContent).toBe(' to ');
  });

  test('renders two label spans', () => {
    const { container } = renderWidget();
    const labels = container.querySelectorAll('.kiosk-animation-widget-label');
    expect(labels).toHaveLength(2);
  });

  test('renders formatted start date in first label', () => {
    renderWidget({ hasSubdailyLayers: false });
    const labels = document.querySelectorAll('.kiosk-animation-widget-label');
    expect(labels[0].textContent).toBe(`daily:${startDate.toISOString()}`);
  });

  test('renders formatted end date in second label', () => {
    renderWidget({ hasSubdailyLayers: false });
    const labels = document.querySelectorAll('.kiosk-animation-widget-label');
    expect(labels[1].textContent).toBe(`daily:${endDate.toISOString()}`);
  });

  test('renders subdaily formatted dates when hasSubdailyLayers is true', () => {
    renderWidget({ hasSubdailyLayers: true });
    const labels = document.querySelectorAll('.kiosk-animation-widget-label');
    expect(labels[0].textContent).toBe(`subdaily:${startDate.toISOString()}`);
    expect(labels[1].textContent).toBe(`subdaily:${endDate.toISOString()}`);
  });
});

describe('KioskAnimationWidget formatKioskDate calls', () => {
  test('calls formatKioskDate with startDate and hasSubdailyLayers', () => {
    renderWidget({ hasSubdailyLayers: false });
    expect(formatKioskDate).toHaveBeenCalledWith(startDate, false);
  });

  test('calls formatKioskDate with endDate and hasSubdailyLayers', () => {
    renderWidget({ hasSubdailyLayers: false });
    expect(formatKioskDate).toHaveBeenCalledWith(endDate, false);
  });

  test('calls formatKioskDate twice per render', () => {
    renderWidget();
    expect(formatKioskDate).toHaveBeenCalledTimes(2);
  });

  test('passes hasSubdailyLayers true to formatKioskDate', () => {
    renderWidget({ hasSubdailyLayers: true });
    expect(formatKioskDate).toHaveBeenCalledWith(startDate, true);
    expect(formatKioskDate).toHaveBeenCalledWith(endDate, true);
  });

  test('uses return value of formatKioskDate for display', () => {
    formatKioskDate.mockReturnValue('Mocked Date');
    renderWidget();
    const labels = document.querySelectorAll('.kiosk-animation-widget-label');
    expect(labels[0].textContent).toBe('Mocked Date');
    expect(labels[1].textContent).toBe('Mocked Date');
  });
});
