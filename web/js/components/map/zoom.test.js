import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('../../map/util', () => ({
  mapUtilZoomAction: jest.fn(),
}));
jest.mock('../util/hover-tooltip', () => () => null);
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}));
jest.mock('react-redux', () => ({
  connect: (mapStateToProps) => {
    globalThis.zoomMapStateToProps = mapStateToProps;
    return (Component) => Component;
  },
}));

import Zoom from './zoom';
import { mapUtilZoomAction } from '../../map/util';

const makeMap = (zoom = 5) => ({
  getView: () => ({
    getZoom: () => zoom,
    animate: jest.fn(),
  }),
});

const renderZoom = ({
  map = makeMap(5),
  zoomLevel = 5,
  numZoomLevels = 10,
  isDistractionFreeModeActive = false,
  isMobile = false,
  isChartingActive = false,
} = {}) => render(
  <Zoom
    map={map}
    zoomLevel={zoomLevel}
    numZoomLevels={numZoomLevels}
    isDistractionFreeModeActive={isDistractionFreeModeActive}
    isMobile={isMobile}
    isChartingActive={isChartingActive}
  />,
);

describe('Zoom component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders zoom in and zoom out buttons', () => {
      const { getByLabelText } = renderZoom();
      expect(getByLabelText('Zoom in view')).toBeInTheDocument();
      expect(getByLabelText('Zoom out view')).toBeInTheDocument();
    });

    it('returns null when map is not provided', () => {
      const { container } = renderZoom({ map: null });
      expect(container.firstChild).toBeNull();
    });

    it('returns null when distraction free mode is active', () => {
      const { container } = renderZoom({ isDistractionFreeModeActive: true });
      expect(container.firstChild).toBeNull();
    });

    it('returns null when charting mode is active', () => {
      const { container } = renderZoom({ isChartingActive: true });
      expect(container.firstChild).toBeNull();
    });

    it('uses mobile class when isMobile is true', () => {
      const { container } = renderZoom({ isMobile: true });
      expect(container.firstChild).toHaveClass('wv-zoom-buttons-mobile');
    });

    it('uses desktop class when isMobile is false', () => {
      const { container } = renderZoom({ isMobile: false });
      expect(container.firstChild).toHaveClass('wv-zoom-buttons');
    });
  });

  describe('disabled states', () => {
    it('disables zoom in button when at max zoom level', () => {
      const { getByLabelText } = renderZoom({ zoomLevel: 10, numZoomLevels: 10 });
      expect(getByLabelText('Zoom in view')).toBeDisabled();
    });

    it('disables zoom out button when at zoom level 0', () => {
      const { getByLabelText } = renderZoom({ zoomLevel: 0 });
      expect(getByLabelText('Zoom out view')).toBeDisabled();
    });

    it('does not disable zoom in button below max zoom', () => {
      const { getByLabelText } = renderZoom({ zoomLevel: 5, numZoomLevels: 10 });
      expect(getByLabelText('Zoom in view')).not.toBeDisabled();
    });

    it('does not disable zoom out button above zoom 0', () => {
      const { getByLabelText } = renderZoom({ zoomLevel: 1 });
      expect(getByLabelText('Zoom out view')).not.toBeDisabled();
    });
  });

  describe('click handlers', () => {
    it('calls mapUtilZoomAction with +1 when zoom in is clicked', () => {
      const map = makeMap(5);
      const { getByLabelText } = renderZoom({ map });
      fireEvent.click(getByLabelText('Zoom in view'));
      expect(mapUtilZoomAction).toHaveBeenCalledWith(map, 1);
    });

    it('calls mapUtilZoomAction with -1 when zoom out is clicked', () => {
      const map = makeMap(5);
      const { getByLabelText } = renderZoom({ map });
      fireEvent.click(getByLabelText('Zoom out view'));
      expect(mapUtilZoomAction).toHaveBeenCalledWith(map, -1);
    });

    it('does not call mapUtilZoomAction when zoom in is disabled', () => {
      const map = makeMap(10);
      const { getByLabelText } = renderZoom({ map, zoomLevel: 10, numZoomLevels: 10 });
      fireEvent.click(getByLabelText('Zoom in view'));
      expect(mapUtilZoomAction).not.toHaveBeenCalled();
    });

    it('does not call mapUtilZoomAction when zoom out is disabled', () => {
      const map = makeMap(0);
      const { getByLabelText } = renderZoom({ map, zoomLevel: 0 });
      fireEvent.click(getByLabelText('Zoom out view'));
      expect(mapUtilZoomAction).not.toHaveBeenCalled();
    });
  });

  describe('mouse move event', () => {
    it('stops propagation on mouse move over zoom in button', () => {
      const { getByLabelText } = renderZoom();
      const event = new MouseEvent('mousemove', { bubbles: true });
      const stopPropagation = jest.spyOn(event, 'stopPropagation');
      getByLabelText('Zoom in view').dispatchEvent(event);
      expect(stopPropagation).toHaveBeenCalled();
    });

    it('stops propagation on mouse move over zoom out button', () => {
      const { getByLabelText } = renderZoom();
      const event = new MouseEvent('mousemove', { bubbles: true });
      const stopPropagation = jest.spyOn(event, 'stopPropagation');
      getByLabelText('Zoom out view').dispatchEvent(event);
      expect(stopPropagation).toHaveBeenCalled();
    });
  });

  describe('mapStateToProps', () => {
    const makeState = (overrides = {}) => ({
      screenSize: { isMobileDevice: true },
      map: { ui: { selected: makeMap(7) } },
      proj: { selected: { numZoomLevels: 12 } },
      ui: { isDistractionFreeModeActive: true },
      charting: { active: false },
      ...overrides,
    });

    it('maps the selected map and derived zoom state', () => {
      const state = makeState();
      const props = globalThis.zoomMapStateToProps(state);
      expect(props.map).toBe(state.map.ui.selected);
      expect(props.zoomLevel).toBe(7);
      expect(props.numZoomLevels).toBe(12);
      expect(props.isDistractionFreeModeActive).toBe(true);
      expect(props.isMobile).toBe(true);
      expect(props.isChartingActive).toBe(false);
    });

    it('returns a null zoom level when no map is selected', () => {
      const state = makeState({ map: { ui: { selected: null } } });
      const props = globalThis.zoomMapStateToProps(state);
      expect(props.map).toBeNull();
      expect(props.zoomLevel).toBeNull();
    });
  });
});
