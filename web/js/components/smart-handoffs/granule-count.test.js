/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, fireEvent, waitFor } from '@testing-library/react';
import GranuleCount from './granule-count';

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: (props) => <span data-testid={`fa-${props.icon}`} />,
}));

jest.mock('../../util/cmr', () => ({
  cmrFetch: jest.fn(),
}));

const { cmrFetch } = require('../../util/cmr');

function mockGranules(entriesByUrl) {
  // entriesByUrl: function(url) => entries array, OR a single array used for all calls
  cmrFetch.mockImplementation((url) => {
    const entries = typeof entriesByUrl === 'function' ? entriesByUrl(url) : entriesByUrl;
    return Promise.resolve({ json: () => Promise.resolve({ feed: { entry: entries } }) });
  });
}

function buildProps(overrides = {}) {
  return {
    getGranulesUrl: jest.fn((params) => `https://cmr/search?concept=${params.conceptId}${params.bbox ? `&bbox=${params.bbox}` : ''}`),
    currentExtent: null,
    displayDate: '2023-05-01',
    startDate: '2023-05-01T00:00:00Z',
    endDate: '2023-05-02T00:00:00Z',
    selectedDate: '2023-05-01',
    selectedCollection: { value: 'C123-PROV' },
    showGranuleHelpModal: jest.fn(),
    ...overrides,
  };
}

function renderCount(overrides = {}) {
  const props = buildProps(overrides);
  const utils = render(<GranuleCount {...props} />);
  return { props, ...utils };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GranuleCount', () => {
  it('returns null when there is no selected collection', () => {
    const { container } = renderCount({ selectedCollection: null });
    expect(container.firstChild).toBeNull();
  });

  it('renders the header with the display date', () => {
    mockGranules([]);
    const { getByText } = renderCount();
    expect(getByText(/Available granules for/)).toBeTruthy();
  });

  it('shows the total granule count after a successful fetch', async () => {
    mockGranules([{ granule_size: '5' }, { granule_size: '5' }, { granule_size: '5' }]);
    const { container } = renderCount();
    await waitFor(() => {
      expect(container.querySelector('.granule-count-info').textContent).toContain('3');
    });
  });

  it('shows NONE when no granules are returned', async () => {
    mockGranules([]);
    const { getByText } = renderCount();
    await waitFor(() => {
      expect(getByText('NONE')).toBeTruthy();
    });
  });

  it('requests granules with a bbox and shows the selected-of-total count when an extent is set', async () => {
    // bbox request returns 2, total request returns 5
    mockGranules((url) => (url.includes('bbox')
      ? [{ granule_size: '10' }, { granule_size: '10' }]
      : [
        { granule_size: '10' }, { granule_size: '10' }, { granule_size: '10' },
        { granule_size: '10' }, { granule_size: '10' },
      ]));
    const { container, props } = renderCount({
      currentExtent: { southWest: '-10,-10', northEast: '10,10' },
    });
    await waitFor(() => {
      expect(container.querySelector('.granule-count-info').textContent).toContain('2 of ');
    });
    // a bbox URL should have been requested
    expect(props.getGranulesUrl).toHaveBeenCalledWith(
      expect.objectContaining({ bbox: '-10,-10,10,10' }),
    );
  });

  it('displays the download size in MB for small totals', async () => {
    mockGranules([{ granule_size: '4.5' }, { granule_size: '4.5' }]);
    const { container } = renderCount();
    await waitFor(() => {
      expect(container.querySelector('.granule-size').textContent).toContain('MB');
    });
  });

  it('displays the download size in GB for large totals', async () => {
    mockGranules([{ granule_size: '2000' }]);
    const { container } = renderCount();
    await waitFor(() => {
      expect(container.querySelector('.granule-size').textContent).toContain('GB');
    });
  });

  it('handles granules without a granule_size field', async () => {
    mockGranules([{}, {}]);
    const { container } = renderCount();
    await waitFor(() => {
      expect(container.querySelector('.granule-count-info').textContent).toContain('2');
    });
  });

  it('omits the date params when start/end dates are missing', async () => {
    mockGranules([]);
    const { props } = renderCount({ startDate: null, endDate: null });
    await waitFor(() => {
      expect(props.getGranulesUrl).toHaveBeenCalled();
    });
    const callArg = props.getGranulesUrl.mock.calls[0][0];
    expect(callArg.startDate).toBeUndefined();
    expect(callArg.endDate).toBeUndefined();
  });

  it('logs an error and renders NONE when the fetch fails', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    cmrFetch.mockRejectedValue(new Error('network failure'));
    const { getByText } = renderCount();
    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalled();
    });
    expect(getByText('NONE')).toBeTruthy();
    errorSpy.mockRestore();
  });

  it('calls showGranuleHelpModal when the help button is clicked', async () => {
    mockGranules([]);
    const { container, props } = renderCount();
    await waitFor(() => {
      expect(container.querySelector('.help-link')).toBeTruthy();
    });
    fireEvent.click(container.querySelector('.help-link'));
    expect(props.showGranuleHelpModal).toHaveBeenCalled();
  });
});
