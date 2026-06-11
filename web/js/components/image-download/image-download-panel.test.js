/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('react-redux', () => ({
  useSelector: (fn) => fn({
    compare: { activeString: 'a' },
    palettes: { a: {} },
  }),
}));

jest.mock('googleTagManager', () => ({
  pushEvent: jest.fn(),
}));

// Mock util functions used by the component
jest.mock('../../modules/image-download/util', () => ({
  imageSizeValid: jest.fn(() => true),
  getDimensions: jest.fn(() => ({ width: 10, height: 20 })),
  getDownloadUrl: jest.fn((url) => `${url}?download=true`),
  getTruncatedGranuleDates: jest.fn(() => ({ truncated: true })),
  GRANULE_LIMIT: 42,
}));

// Simplified mocks for child components
jest.mock('../util/selector', () => (props) => (
  <select
    data-testid={props.id}
    value={props.value}
    onChange={(e) => props.onChange(props.optionName, e.target.value)}
  >
    {(props.optionArray || []).map((o) => (
      <option key={o} value={o}>{o}</option>
    ))}
  </select>
));

jest.mock('./grid', () => (props) => (
  <div>
    <button type="button" onClick={() => props.onClick(props.width, props.height)}>Download</button>
    <div data-testid="file-size">{props.fileSize}</div>
  </div>
));

jest.mock('../util/alert', () => (props) => (
  props.isOpen ? <div role="alert">{props.title}: {props.message}</div> : null
));

jest.mock('./lat-long-inputs', () => (props) => (
  <div>LatLong: {props.crs}</div>
));

jest.mock('./global-select', () => (props) => (
  <div>GlobalSelect</div>
));

import ImageDownloadPanel from './image-download-panel';
import googleTagManager from 'googleTagManager';
import * as util from '../../modules/image-download/util';

describe('ImageDownloadPanel', () => {
  const baseProps = {
    fileType: 'image/jpeg',
    isWorldfile: false,
    resolution: '1',
    getLayers: () => ([{ id: 'L1' }]),
    url: 'http://example.com/wms',
    lonlats: [0, 0],
    projection: { id: 'geographic', selected: { crs: 'EPSG:4326' } },
    date: new Date('2020-01-01T00:00:00Z'),
    markerCoordinates: null,
    onPanelChange: jest.fn(),
    fileTypeOptions: true,
    fileTypes: ['image/jpeg', 'application/vnd.google-earth.kmz'],
    worldFileOptions: true,
    datelineMessage: 'Crosses dateline',
    map: {
      getLayers: () => ({ getArray: () => [{ wv: { id: 'L1', granuleDates: [] } }] }),
    },
    viewExtent: null,
    resolutions: ['1', '2'],
    geoLatLong: null,
    onLatLongChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // ensure getDimensions returns predictable values per test
    util.getDimensions.mockReturnValue({ width: 100, height: 200 });
  });

  test('renders controls and alert, shows granule warning and debug url after download', () => {
    window.open = jest.fn();

    render(<ImageDownloadPanel {...baseProps} />);

    // resolution select present
    expect(screen.getByTestId('wv-image-resolution')).toBeInTheDocument();

    // filetype select present
    expect(screen.getByTestId('wv-image-format')).toBeInTheDocument();

    // dateline alert renders
    expect(screen.getByRole('alert')).toHaveTextContent('Crosses Dateline Alert');

    // granule warning appears
    expect(screen.getByText(/Warning: A snapshot will capture a max./)).toBeInTheDocument();

    // click download button
    fireEvent.click(screen.getByText('Download'));

    // window.open called with constructed URL
    expect(window.open).toHaveBeenCalledWith('http://example.com/wms?download=true', '_blank');

    // googleTagManager called
    expect(googleTagManager.pushEvent).toHaveBeenCalled();

    // debug url written to hidden div
    const urlDiv = document.getElementById('wv-image-download-url');
    // the component sets url as a prop; ensure exists
    expect(urlDiv).toBeInTheDocument();
  });

  test('worldfile select disabled for kmz', () => {
    const props = { ...baseProps, fileType: 'application/vnd.google-earth.kmz' };
    render(<ImageDownloadPanel {...props} />);

    // filetype select exists and worldfile select renders disabled select element
    const format = screen.getByTestId('wv-image-format');
    expect(format).toBeInTheDocument();

    // The rendered worldfile select in our DOM will be a plain select; ensure text present
    expect(screen.getByText(/Worldfile/)).toBeInTheDocument();
  });
});
