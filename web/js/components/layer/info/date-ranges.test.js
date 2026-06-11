import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import DateRanges from './date-ranges';

const originalWorker = global.Worker;
const originalDOMParser = global.DOMParser;
const originalCrypto = global.crypto;

beforeAll(() => {
  global.crypto = global.crypto || {};
  global.crypto.randomUUID = jest.fn(() => 'test-uuid');
});

afterAll(() => {
  global.Worker = originalWorker;
  global.DOMParser = originalDOMParser;
  global.crypto = originalCrypto;
});

describe('DateRanges', () => {
  const staticLayer = {
    id: 'static-layer',
    period: 'P1D',
    dateRanges: [
      { startDate: '2020-01-01', endDate: '2020-01-02' },
      { startDate: '2020-02-01', endDate: '2020-02-02' },
    ],
    ongoing: false,
  };

  const ongoingLayer = {
    id: 'ongoing-layer',
    period: 'P1D',
    dateRanges: [
      { startDate: '2020-03-01', endDate: '2020-03-02' },
    ],
    startDate: '2020-03-01',
    endDate: '2020-03-31',
    ongoing: true,
  };

  it('renders the date range panel hidden and displays static ranges after clicking', async () => {
    render(<DateRanges layer={staticLayer} describeDomainsUrl="http://example.com" />);

    const toggleButton = screen.getByText('*View Dates');
    expect(toggleButton).toBeInTheDocument();

    const hiddenListHeading = screen.getByText('Date Ranges:');
    expect(hiddenListHeading).not.toBeVisible();

    fireEvent.click(toggleButton);

    await waitFor(() => expect(screen.getByText('Date Ranges:')).toBeVisible());
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBe(2);
  });

  it('uses the describe domains worker and renders merged domain date ranges', async () => {
    let mockWorkerInstance;
    const mockParseFromString = jest.fn().mockReturnValue({
      querySelector: jest.fn().mockReturnValue({ textContent: '2020-03-01/2020-03-31' }),
    });

    global.Worker = jest.fn().mockImplementation(() => {
      mockWorkerInstance = {
        postMessage: jest.fn(),
        terminate: jest.fn(),
        onmessage: null,
        onerror: null,
      };
      return mockWorkerInstance;
    });

    global.DOMParser = jest.fn().mockImplementation(() => (
      { parseFromString: mockParseFromString }
    ));

    render(<DateRanges layer={ongoingLayer} describeDomainsUrl="http://example.com" />);

    fireEvent.click(screen.getByText('*View Dates'));

    await waitFor(() => expect(mockWorkerInstance.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ operation: 'requestDescribeDomains' }),
    ));

    await act(async () => {
      mockWorkerInstance.onmessage({ data: '<root><Domain>2020-03-01/2020-03-31</Domain></root>' });
    });

    expect(mockWorkerInstance.postMessage).toHaveBeenCalledWith({
      operation: 'mergeDomains',
      args: ['2020-03-01/2020-03-31', 0],
    });

    await act(async () => {
      mockWorkerInstance.onmessage({ data: [['2020-03-01', '2020-03-31']] });
    });

    await waitFor(() => expect(screen.getByText('Date Ranges:')).toBeVisible());
    expect(screen.getAllByRole('listitem').length).toBe(1);
    expect(mockWorkerInstance.terminate).toHaveBeenCalledTimes(1);
  });

  it('does not request worker data again after the ranges are already loaded', async () => {
    let mockWorkerInstance;
    global.Worker = jest.fn().mockImplementation(() => {
      mockWorkerInstance = {
        postMessage: jest.fn(),
        terminate: jest.fn(),
        onmessage: null,
        onerror: null,
      };
      return mockWorkerInstance;
    });

    global.DOMParser = jest.fn().mockImplementation(() => ({ parseFromString: jest.fn().mockReturnValue({ querySelector: jest.fn().mockReturnValue({ textContent: '2020-03-01/2020-03-31' }) }) }));

    render(<DateRanges layer={ongoingLayer} describeDomainsUrl="http://example.com" />);

    fireEvent.click(screen.getByText('*View Dates'));

    await waitFor(() => expect(mockWorkerInstance.postMessage).toHaveBeenCalledTimes(1));

    await act(async () => {
      mockWorkerInstance.onmessage({ data: [['2020-03-01', '2020-03-31']] });
    });

    fireEvent.click(screen.getByText('*View Dates'));
    fireEvent.click(screen.getByText('*View Dates'));

    expect(mockWorkerInstance.postMessage).toHaveBeenCalledTimes(1);
  });

  it('falls back to layer.dateRanges when the worker errors', async () => {
    let mockWorkerInstance;
    global.Worker = jest.fn().mockImplementation(() => {
      mockWorkerInstance = {
        postMessage: jest.fn(),
        terminate: jest.fn(),
        onmessage: null,
        onerror: null,
      };
      return mockWorkerInstance;
    });

    global.DOMParser = jest.fn().mockImplementation(() => ({ parseFromString: jest.fn() }));

    render(<DateRanges layer={ongoingLayer} describeDomainsUrl="http://example.com" />);

    fireEvent.click(screen.getByText('*View Dates'));

    await waitFor(() => expect(mockWorkerInstance.postMessage).toHaveBeenCalledTimes(1));

    await act(async () => {
      mockWorkerInstance.onerror({ type: 'error' });
    });

    await waitFor(() => expect(screen.getByText('Date Ranges:')).toBeVisible());
    expect(screen.getAllByRole('listitem').length).toBe(1);
    expect(mockWorkerInstance.terminate).toHaveBeenCalledTimes(1);
  });
});
