import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LayerInfo from './info';
import { dateOverlap } from '../../../modules/layers/util';
import { coverageDateFormatter } from '../../../modules/date/util';

jest.mock('../../../modules/layers/util', () => ({
  dateOverlap: jest.fn(),
}));

jest.mock('./date-ranges', () => () => <div data-testid="date-ranges-mock" />);

jest.mock('../../../modules/date/util', () => ({
  coverageDateFormatter: jest.fn((type, date) => `${type}:${date}`),
}));

global.fetch = jest.fn();

describe('LayerInfo Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    global.fetch.mockResolvedValue({
      text: jest.fn().mockResolvedValue('<div>Mock HTML Content</div>'),
    });
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  const baseLayer = {
    id: 'test-layer',
    period: 'daily',
    description: 'layer-desc-path',
  };

  it('renders loading state initially and fetches layer metadata', async () => {
    render(<LayerInfo layer={baseLayer} />);

    expect(screen.getByText('Loading Layer Description...')).toBeInTheDocument();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('config/metadata/layers/layer-desc-path.html', expect.any(Object));
      expect(screen.getByText('Mock HTML Content')).toBeInTheDocument();
    });
  });

  it('renders start date and end date with date formatter', async () => {
    const layer = {
      ...baseLayer,
      startDate: '2020-01-01',
      endDate: '2020-12-31',
    };

    render(<LayerInfo layer={layer} />);

    expect(screen.getByText(/Temporal Coverage:/)).toBeInTheDocument();
    expect(coverageDateFormatter).toHaveBeenCalledWith('START-DATE', '2020-01-01', 'daily');
    expect(coverageDateFormatter).toHaveBeenCalledWith('END-DATE', '2020-12-31', 'daily');

    await waitFor(() => {
      expect(screen.getByText(/START-DATE:2020-01-01/)).toBeInTheDocument();
      expect(screen.getByText(/END-DATE:2020-12-31/)).toBeInTheDocument();
    });
  });

  it('renders start date with "Present" if no end date', async () => {
    const layer = {
      ...baseLayer,
      startDate: '2020-01-01',
    };

    render(<LayerInfo layer={layer} />);

    await waitFor(() => {
      expect(screen.getByText('- Present')).toBeInTheDocument();
    });
  });

  it('renders DateRanges component when getDateOverlapDateRanges is true', () => {
    dateOverlap.mockReturnValue({ overlap: false });

    const layer = {
      ...baseLayer,
      startDate: '2020-01-01',
      endDate: '2020-12-31',
      dateRanges: ['range1', 'range2'],
    };

    render(<LayerInfo layer={layer} describeDomainsUrl="http://test.url" />);

    expect(dateOverlap).toHaveBeenCalledWith('daily', ['range1', 'range2']);
    expect(screen.getByTestId('date-ranges-mock')).toBeInTheDocument();
  });

  it('fetches measurement metadata when measurementDescriptionPath is provided', async () => {
    render(
      <LayerInfo
        layer={baseLayer}
        measurementDescriptionPath="measurement-desc-path"
      />,
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('config/metadata/layers/measurement-desc-path.html', expect.any(Object));
      const mockElements = screen.getAllByText('Mock HTML Content');
      expect(mockElements).toHaveLength(2); // One for layer, one for measurement
    });
  });

  it('handles fetch errors gracefully and logs to console', async () => {
    global.fetch.mockRejectedValue(new Error('Fetch failed'));

    render(<LayerInfo layer={baseLayer} />);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(expect.any(Error));
      expect(screen.getByText('Loading Layer Description...')).toBeInTheDocument(); // Stays in loading state since it rejected
    });
  });

  it('aborts fetch on unmount', async () => {
    const { unmount } = render(<LayerInfo layer={baseLayer} />);

    const abortSpy = jest.spyOn(AbortController.prototype, 'abort');
    unmount();

    expect(abortSpy).toHaveBeenCalled();
  });
});
