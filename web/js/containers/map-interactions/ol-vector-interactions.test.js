import React from 'react';
import { act } from 'react';
import renderer from 'react-test-renderer';
import { Provider } from 'react-redux';
import util from '../../util/util';
import { VectorInteractions } from './ol-vector-interactions';
import VectorInteractionsConnected from './ol-vector-interactions';
import { registerProjections } from '../../fixtures';
import { MAP_MOUSE_MOVE, MAP_SINGLE_CLICK, GRANULE_HOVERED, MAP_MOVE_END, MAP_MOUSE_OUT, GRANULE_HOVER_UPDATE } from '../../util/constants';
import { hasNonClickableVectorLayer } from '../../modules/layers/util';
import { areCoordinatesAndPolygonExtentValid } from '../../map/granule/util';

jest.mock('../../modules/layers/util', () => ({
  hasNonClickableVectorLayer: jest.fn(() => false),
}));
jest.mock('../../map/granule/util', () => ({
  areCoordinatesAndPolygonExtentValid: jest.fn(() => false),
}));
jest.mock('../../modules/compare/util', () => ({
  isFromActiveCompareRegion: jest.fn(() => true),
}));
jest.mock('../../modules/layers/selectors', () => ({
  getActiveLayers: jest.fn(() => []),
  getGranulePlatform: jest.fn(() => null),
  getActiveGranuleFootPrints: jest.fn(() => null),
}));
jest.mock('../../modules/vector-styles/util', () => ({
  onMapClickGetVectorFeatures: jest.fn(() => ({ metaArray: [], selected: {} })),
}));
jest.mock('../../modules/modal/actions', () => ({
  openCustomContent: jest.fn(() => ({ type: 'OPEN_CUSTOM_CONTENT' })),
  onClose: jest.fn(() => ({ type: 'ON_CLOSE' })),
}));
jest.mock('../../modules/vector-styles/actions', () => ({
  selectVectorFeatures: jest.fn(() => ({ type: 'SELECT_VECTOR_FEATURES' })),
}));
jest.mock('../../modules/map/actions', () => ({
  changeCursor: jest.fn(() => ({ type: 'CHANGE_CURSOR' })),
}));

let consoleErrorSpy;
let originalConsoleError;

beforeAll(() => {
  originalConsoleError = console.error;
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
    if (typeof args[0] === 'string' && args[0].includes('react-test-renderer is deprecated')) return;
    originalConsoleError.call(console, ...args);
  });
});

afterAll(() => {
  if (consoleErrorSpy) consoleErrorSpy.mockRestore();
});

afterEach(() => {
  // Unmount the shared component so its event listeners don't bleed into subsequent tests.
  try { act(() => { component.unmount(); }); } catch { /* already unmounted by the test */ }
});

const { events } = util;
let component;
let map;
let changeCursor;
let selectVectorFeatures;
let getDialogObject;
let openVectorDialog;
beforeEach(() => {
  registerProjections();
  changeCursor = jest.fn();
  openVectorDialog = jest.fn();
  selectVectorFeatures = jest.fn();
  getDialogObject = () => ({
    metaArray: [0], selected: [1], offsetLeft: 100, offsetTop: 100,
  });
  act(() => {
    component = renderer.create(
      <VectorInteractions
        mouseEvents={events}
        isShowingClick={false}
        changeCursor={changeCursor}
        getDialogObject={getDialogObject}
        openVectorDialog={openVectorDialog}
        selectVectorFeatures={selectVectorFeatures}
        lastSelected={{}}
        measureIsActive={false}
        onCloseModal={jest.fn()}
        modalState={{ id: [], isOpen: false }}
        isDistractionFreeModeActive={false}
        isMobile={false}
        proj={{ id: 'geographic' }}
        activeLayers={[{ def: { type: 'vector' } }]}
      />,
    );
  });
  map = {
    getEventPixel: jest.fn(),
    getCoordinateFromPixel: () => [0, 0],
    hasFeatureAtPixel: () => false,
    getView: jest.fn().mockReturnThis(),
    getResolution: () => 0.0175,
  };
});

function doAsync(c) {
  setTimeout(() => {
    c(true);
  }, 10);
}

test('if there is a feature at pixel dispatch changeCursor action', () => {
  map.hasFeatureAtPixel = () => true;
  map.forEachFeatureAtPixel = () => {};
  events.trigger(MAP_MOUSE_MOVE, {}, map, 'EPSG:3413');
  doAsync(() => expect(changeCursor.mock.calls.length).toBe(1));
});
test('if there is a feature at pixel on click get dialog', () => {
  act(() => {
    events.trigger(MAP_SINGLE_CLICK, { pixel: [0, 0] }, map, 'EPSG:4326');
  });
  expect(changeCursor.mock.calls.length).toBe(0);
  expect(selectVectorFeatures.mock.calls.length).toBe(1);
  expect(openVectorDialog.mock.calls.length).toBe(1);
});
test('if there is not a feature at pixel do not dispatch changeCursor action', () => {
  map.hasFeatureAtPixel = () => false;
  events.trigger(MAP_MOUSE_MOVE, { pixel: [0, 0] }, map, 'EPSG:4326');
  doAsync(() => expect(changeCursor.mock.calls.length).toBe(0));
});
test('Check that hover changes', () => {
  map.hasFeatureAtPixel = () => false;
  events.trigger(MAP_MOUSE_MOVE, { pixel: [0, 0] }, map, 'EPSG:4326');
  doAsync(() => expect(changeCursor.mock.calls.length).toBe(0));
});
test('Check that cursor-hover class is not present', () => {
  expect(component.toJSON()).toMatchSnapshot();
});

describe('componentDidUpdate - clear orphaned granule footprint', () => {
  let granuleComponent;
  let granuleHoveredSpy;

  beforeEach(() => {
    granuleHoveredSpy = jest.fn();
    events.on(GRANULE_HOVERED, granuleHoveredSpy);
  });

  afterEach(() => {
    events.off(GRANULE_HOVERED, granuleHoveredSpy);
    if (granuleComponent) {
      act(() => {
        granuleComponent.unmount();
      });
    }
  });

  test('clears granule footprint when granuleFootprints prop changes and granuleDate is set', () => {
    const initialFootprints = { '2024-01-15': [[[0, 0], [1, 0], [1, 1], [0, 1]]] };
    const updatedFootprints = { '2024-01-16': [[[2, 2], [3, 2], [3, 3], [2, 3]]] };

    act(() => {
      granuleComponent = renderer.create(
        <VectorInteractions
          mouseEvents={events}
          isShowingClick={false}
          changeCursor={changeCursor}
          getDialogObject={getDialogObject}
          openVectorDialog={openVectorDialog}
          selectVectorFeatures={selectVectorFeatures}
          lastSelected={{}}
          measureIsActive={false}
          onCloseModal={jest.fn()}
          modalState={{ id: [], isOpen: false }}
          isDistractionFreeModeActive={false}
          isMobile={false}
          proj={{ id: 'geographic' }}
          activeLayers={[]}
          granuleFootprints={initialFootprints}
        />,
      );
    });

    // Simulate having a hovered granule by setting internal state
    const instance = granuleComponent.getInstance();
    act(() => {
      instance.setState({ granuleDate: '2024-01-15', granulePlatform: 'MODIS' });
    });

    // Update granuleFootprints prop to simulate date change
    act(() => {
      granuleComponent.update(
        <VectorInteractions
          mouseEvents={events}
          isShowingClick={false}
          changeCursor={changeCursor}
          getDialogObject={getDialogObject}
          openVectorDialog={openVectorDialog}
          selectVectorFeatures={selectVectorFeatures}
          lastSelected={{}}
          measureIsActive={false}
          onCloseModal={jest.fn()}
          modalState={{ id: [], isOpen: false }}
          isDistractionFreeModeActive={false}
          isMobile={false}
          proj={{ id: 'geographic' }}
          activeLayers={[]}
          granuleFootprints={updatedFootprints}
        />,
      );
    });

    // Verify state was cleared
    expect(instance.state.granuleDate).toBeNull();
    expect(instance.state.granulePlatform).toBeNull();
    // Verify GRANULE_HOVERED event was triggered with null
    expect(granuleHoveredSpy).toHaveBeenCalledWith(null);
  });

  test('does NOT clear granule footprint when granuleDate is null', () => {
    const initialFootprints = { '2024-01-15': [[[0, 0], [1, 0], [1, 1], [0, 1]]] };
    const updatedFootprints = { '2024-01-16': [[[2, 2], [3, 2], [3, 3], [2, 3]]] };

    act(() => {
      granuleComponent = renderer.create(
        <VectorInteractions
          mouseEvents={events}
          isShowingClick={false}
          changeCursor={changeCursor}
          getDialogObject={getDialogObject}
          openVectorDialog={openVectorDialog}
          selectVectorFeatures={selectVectorFeatures}
          lastSelected={{}}
          measureIsActive={false}
          onCloseModal={jest.fn()}
          modalState={{ id: [], isOpen: false }}
          isDistractionFreeModeActive={false}
          isMobile={false}
          proj={{ id: 'geographic' }}
          activeLayers={[]}
          granuleFootprints={initialFootprints}
        />,
      );
    });

    // granuleDate is null (no hover) — should NOT trigger clear
    const instance = granuleComponent.getInstance();

    act(() => {
      granuleComponent.update(
        <VectorInteractions
          mouseEvents={events}
          isShowingClick={false}
          changeCursor={changeCursor}
          getDialogObject={getDialogObject}
          openVectorDialog={openVectorDialog}
          selectVectorFeatures={selectVectorFeatures}
          lastSelected={{}}
          measureIsActive={false}
          onCloseModal={jest.fn()}
          modalState={{ id: [], isOpen: false }}
          isDistractionFreeModeActive={false}
          isMobile={false}
          proj={{ id: 'geographic' }}
          activeLayers={[]}
          granuleFootprints={updatedFootprints}
        />,
      );
    });

    expect(granuleHoveredSpy).not.toHaveBeenCalled();
    expect(instance.state.granuleDate).toBeNull();
  });

  test('does NOT clear granule footprint when granuleFootprints prop is the same reference', () => {
    const sameFootprints = { '2024-01-15': [[[0, 0], [1, 0], [1, 1], [0, 1]]] };

    act(() => {
      granuleComponent = renderer.create(
        <VectorInteractions
          mouseEvents={events}
          isShowingClick={false}
          changeCursor={changeCursor}
          getDialogObject={getDialogObject}
          openVectorDialog={openVectorDialog}
          selectVectorFeatures={selectVectorFeatures}
          lastSelected={{}}
          measureIsActive={false}
          onCloseModal={jest.fn()}
          modalState={{ id: [], isOpen: false }}
          isDistractionFreeModeActive={false}
          isMobile={false}
          proj={{ id: 'geographic' }}
          activeLayers={[]}
          granuleFootprints={sameFootprints}
        />,
      );
    });

    const instance = granuleComponent.getInstance();
    act(() => {
      instance.setState({ granuleDate: '2024-01-15', granulePlatform: 'MODIS' });
    });

    // Re-render with the SAME object reference
    act(() => {
      granuleComponent.update(
        <VectorInteractions
          mouseEvents={events}
          isShowingClick={false}
          changeCursor={changeCursor}
          getDialogObject={getDialogObject}
          openVectorDialog={openVectorDialog}
          selectVectorFeatures={selectVectorFeatures}
          lastSelected={{}}
          measureIsActive={false}
          onCloseModal={jest.fn()}
          modalState={{ id: [], isOpen: false }}
          isDistractionFreeModeActive={false}
          isMobile={false}
          proj={{ id: 'geographic' }}
          activeLayers={[]}
          granuleFootprints={sameFootprints}
        />,
      );
    });

    // Should NOT clear because same reference
    expect(granuleHoveredSpy).not.toHaveBeenCalled();
    expect(instance.state.granuleDate).toBe('2024-01-15');
  });
});

// ---------------------------------------------------------------------------
// Helper used by the tests below — uses createElement to avoid JSX prop spreading
// ---------------------------------------------------------------------------
function makeComponent(extraProps = {}) {
  const baseProps = {
    mouseEvents: events,
    isShowingClick: false,
    changeCursor,
    getDialogObject,
    openVectorDialog,
    selectVectorFeatures,
    lastSelected: {},
    measureIsActive: false,
    onCloseModal: jest.fn(),
    modalState: { id: [], isOpen: false },
    isDistractionFreeModeActive: false,
    isMobile: false,
    proj: { id: 'geographic' },
    activeLayers: [{ def: { type: 'vector' } }],
  };
  let comp;
  act(() => {
    comp = renderer.create(
      React.createElement(VectorInteractions, Object.assign({}, baseProps, extraProps)),
    );
  });
  return comp;
}

// ---------------------------------------------------------------------------
// moveEnd
// ---------------------------------------------------------------------------
describe('moveEnd', () => {
  test('triggers GRANULE_HOVER_UPDATE when granuleDate and granulePlatform are set', () => {
    const spy = jest.fn();
    events.on(GRANULE_HOVER_UPDATE, spy);
    act(() => {
      component.getInstance().setState({ granuleDate: '2024-01-15', granulePlatform: 'MODIS' });
    });
    events.trigger(MAP_MOVE_END);
    expect(spy).toHaveBeenCalledWith('MODIS', '2024-01-15');
    events.off(GRANULE_HOVER_UPDATE, spy);
  });

  test('does not trigger GRANULE_HOVER_UPDATE when granule state is empty', () => {
    const spy = jest.fn();
    events.on(GRANULE_HOVER_UPDATE, spy);
    events.trigger(MAP_MOVE_END);
    expect(spy).not.toHaveBeenCalled();
    events.off(GRANULE_HOVER_UPDATE, spy);
  });
});

// ---------------------------------------------------------------------------
// mouseOut
// ---------------------------------------------------------------------------
test('mouseOut triggers GRANULE_HOVERED with null', () => {
  const spy = jest.fn();
  events.on(GRANULE_HOVERED, spy);
  events.trigger(MAP_MOUSE_OUT);
  expect(spy).toHaveBeenCalledWith(null);
  events.off(GRANULE_HOVERED, spy);
});

// ---------------------------------------------------------------------------
// mouseMove early returns
// ---------------------------------------------------------------------------
describe('mouseMove early returns', () => {
  test('returns early when measureIsActive is true', () => {
    act(() => { component.unmount(); });
    const testComp = makeComponent({ measureIsActive: true });
    map.hasFeatureAtPixel = () => true;
    map.forEachFeatureAtPixel = jest.fn();
    events.trigger(MAP_MOUSE_MOVE, { pixel: [0, 0] }, map, 'EPSG:4326');
    expect(changeCursor).not.toHaveBeenCalled();
    act(() => { testComp.unmount(); });
  });

  test('returns early when isCoordinateSearchActive is true', () => {
    act(() => { component.unmount(); });
    const testComp = makeComponent({ isCoordinateSearchActive: true });
    map.hasFeatureAtPixel = () => true;
    map.forEachFeatureAtPixel = jest.fn();
    events.trigger(MAP_MOUSE_MOVE, { pixel: [0, 0] }, map, 'EPSG:4326');
    expect(changeCursor).not.toHaveBeenCalled();
    act(() => { testComp.unmount(); });
  });

  test('returns early when coordinates are out of bounds', () => {
    act(() => { component.unmount(); });
    // isShowingClick=true so changeCursor(false) would fire if not for early return
    const testComp = makeComponent({ isShowingClick: true });
    map.hasFeatureAtPixel = () => false;
    map.getCoordinateFromPixel = () => [300, 0]; // lon 300 > 250
    events.trigger(MAP_MOUSE_MOVE, { pixel: [0, 0] }, map, 'EPSG:4326');
    expect(changeCursor).not.toHaveBeenCalled();
    act(() => { testComp.unmount(); });
  });
});

// ---------------------------------------------------------------------------
// handleCursorChange
// ---------------------------------------------------------------------------
describe('handleCursorChange', () => {
  test('calls changeCursor(true) when an active non-reference feature is at pixel', () => {
    const mockFeature = { getGeometry: () => ({ getType: () => 'Point' }) };
    const mockLayer = {
      wv: { def: { layergroup: 'Data' }, group: 'active' },
      get: () => null,
    };
    map.hasFeatureAtPixel = () => true;
    map.forEachFeatureAtPixel = (pixel, cb) => { cb(mockFeature, mockLayer); };
    events.trigger(MAP_MOUSE_MOVE, { pixel: [0, 0] }, map, 'EPSG:4326');
    expect(changeCursor).toHaveBeenCalledWith(true);
  });

  test('calls changeCursor(false) when no features and isShowingClick is true', () => {
    act(() => { component.unmount(); });
    const testComp = makeComponent({ isShowingClick: true });
    map.hasFeatureAtPixel = () => false;
    events.trigger(MAP_MOUSE_MOVE, { pixel: [0, 0] }, map, 'EPSG:4326');
    expect(changeCursor).toHaveBeenCalledWith(false);
    act(() => { testComp.unmount(); });
  });

  test('does not call changeCursor(true) when feature is on a Reference layer', () => {
    const mockFeature = { getGeometry: () => ({ getType: () => 'Point' }) };
    const mockLayer = {
      wv: { def: { layergroup: 'Reference' }, group: 'active' },
      get: () => null,
    };
    map.hasFeatureAtPixel = () => true;
    map.forEachFeatureAtPixel = (pixel, cb) => { cb(mockFeature, mockLayer); };
    events.trigger(MAP_MOUSE_MOVE, { pixel: [0, 0] }, map, 'EPSG:4326');
    expect(changeCursor).not.toHaveBeenCalledWith(true);
  });

  test('skips feature when geometry type is in clickDisabledFeatures', () => {
    const mockFeature = { getGeometry: () => ({ getType: () => 'Point' }) };
    const mockLayer = {
      wv: { def: { layergroup: 'Data', clickDisabledFeatures: ['Point'] }, group: 'active' },
      get: () => null,
    };
    map.hasFeatureAtPixel = () => true;
    map.forEachFeatureAtPixel = (pixel, cb) => { cb(mockFeature, mockLayer); };
    events.trigger(MAP_MOUSE_MOVE, { pixel: [0, 0] }, map, 'EPSG:4326');
    expect(changeCursor).not.toHaveBeenCalledWith(true);
  });
});

// ---------------------------------------------------------------------------
// singleClick additional branches
// ---------------------------------------------------------------------------
describe('singleClick additional branches', () => {
  test('returns early when measureIsActive is true', () => {
    act(() => { component.unmount(); });
    const testComp = makeComponent({ measureIsActive: true });
    act(() => { events.trigger(MAP_SINGLE_CLICK, { pixel: [0, 0] }, map, 'EPSG:4326'); });
    expect(openVectorDialog).not.toHaveBeenCalled();
    expect(selectVectorFeatures).not.toHaveBeenCalled();
    act(() => { testComp.unmount(); });
  });

  test('returns early when isCoordinateSearchActive is true', () => {
    act(() => { component.unmount(); });
    const testComp = makeComponent({ isCoordinateSearchActive: true });
    act(() => { events.trigger(MAP_SINGLE_CLICK, { pixel: [0, 0] }, map, 'EPSG:4326'); });
    expect(openVectorDialog).not.toHaveBeenCalled();
    expect(selectVectorFeatures).not.toHaveBeenCalled();
    act(() => { testComp.unmount(); });
  });

  test('returns early when isCoordinatesMarker is true', () => {
    const markerDialog = () => ({
      isCoordinatesMarker: true,
      metaArray: [{ id: 'some' }],
      selected: {},
      offsetLeft: 10,
      offsetTop: 10,
    });
    act(() => { component.unmount(); });
    const testComp = makeComponent({ getDialogObject: markerDialog });
    act(() => { events.trigger(MAP_SINGLE_CLICK, { pixel: [0, 0] }, map, 'EPSG:4326'); });
    expect(openVectorDialog).not.toHaveBeenCalled();
    act(() => { testComp.unmount(); });
  });

  test('activates zoom alert when hasNonClickableVectorLayer is true and metaArray has items', () => {
    hasNonClickableVectorLayer.mockReturnValueOnce(true);
    const activateVectorZoomAlert = jest.fn();
    const dialogWithMeta = () => ({
      metaArray: [{ id: 'some-layer' }],
      selected: {},
      offsetLeft: 10,
      offsetTop: 10,
    });
    act(() => { component.unmount(); });
    const testComp = makeComponent({ getDialogObject: dialogWithMeta, activateVectorZoomAlert });
    act(() => { events.trigger(MAP_SINGLE_CLICK, { pixel: [0, 0] }, map, 'EPSG:4326'); });
    expect(activateVectorZoomAlert).toHaveBeenCalled();
    act(() => { testComp.unmount(); });
  });

  test('activates zoom alert when hasNonClickableVectorLayer is true and metaArray is empty', () => {
    hasNonClickableVectorLayer.mockReturnValueOnce(true);
    const activateVectorZoomAlert = jest.fn();
    const emptyDialog = () => ({ metaArray: [], selected: {}, offsetLeft: 10, offsetTop: 10 });
    act(() => { component.unmount(); });
    const testComp = makeComponent({ getDialogObject: emptyDialog, activateVectorZoomAlert });
    act(() => { events.trigger(MAP_SINGLE_CLICK, { pixel: [0, 0] }, map, 'EPSG:4326'); });
    expect(activateVectorZoomAlert).toHaveBeenCalled();
    act(() => { testComp.unmount(); });
  });

  test('activates exceeded results alert when exceededLengthLimit is true', () => {
    const activateVectorExceededResultsAlert = jest.fn();
    const exceededDialog = () => ({
      metaArray: [{ id: 'some-layer' }],
      selected: {},
      offsetLeft: 10,
      offsetTop: 10,
      exceededLengthLimit: true,
    });
    act(() => { component.unmount(); });
    const testComp = makeComponent({
      getDialogObject: exceededDialog,
      activateVectorExceededResultsAlert,
    });
    act(() => { events.trigger(MAP_SINGLE_CLICK, { pixel: [0, 0] }, map, 'EPSG:4326'); });
    expect(activateVectorExceededResultsAlert).toHaveBeenCalled();
    act(() => { testComp.unmount(); });
  });

  test('clears exceeded results alert when isVectorExceededAlertPresent and no exceeded limit', () => {
    const clearVectorExceededResultsAlert = jest.fn();
    const normalDialog = () => ({
      metaArray: [{ id: 'some-layer' }],
      selected: {},
      offsetLeft: 10,
      offsetTop: 10,
    });
    act(() => { component.unmount(); });
    const testComp = makeComponent({
      getDialogObject: normalDialog,
      clearVectorExceededResultsAlert,
      isVectorExceededAlertPresent: true,
    });
    act(() => { events.trigger(MAP_SINGLE_CLICK, { pixel: [0, 0] }, map, 'EPSG:4326'); });
    expect(clearVectorExceededResultsAlert).toHaveBeenCalled();
    act(() => { testComp.unmount(); });
  });

  test('closes modal and clears features when vector modal is open but no selection', () => {
    const onCloseModal = jest.fn();
    const emptyDialog = () => ({ metaArray: [], selected: {}, offsetLeft: 10, offsetTop: 10 });
    act(() => { component.unmount(); });
    const testComp = makeComponent({
      getDialogObject: emptyDialog,
      modalState: { id: ['vector_dialog'], isOpen: true },
      onCloseModal,
      lastSelected: {},
    });
    act(() => { events.trigger(MAP_SINGLE_CLICK, { pixel: [0, 0] }, map, 'EPSG:4326'); });
    expect(onCloseModal).toHaveBeenCalled();
    expect(selectVectorFeatures).toHaveBeenCalledWith({});
    act(() => { testComp.unmount(); });
  });

  test('calls handleGranuleHover on mobile click', () => {
    act(() => { component.unmount(); });
    const emptyDialog = () => ({ metaArray: [], selected: {}, offsetLeft: 10, offsetTop: 10 });
    const testComp = makeComponent({
      getDialogObject: emptyDialog,
      isMobile: true,
      screenSize: { screenWidth: 375, screenHeight: 667, isMobileDevice: true },
      granuleFootprints: { '2024-01-15': [[[0, 0], [1, 0], [1, 1]]] },
      granulePlatform: 'MODIS',
      compareState: { active: false },
      visibleExtent: [-180, -90, 180, 90],
    });
    // should not throw
    act(() => { events.trigger(MAP_SINGLE_CLICK, { pixel: [0, 0] }, map, 'EPSG:4326'); });
    act(() => { testComp.unmount(); });
  });
});

// ---------------------------------------------------------------------------
// handleGranuleHover via mouseMove
// ---------------------------------------------------------------------------
describe('handleGranuleHover', () => {
  test('triggers GRANULE_HOVERED with platform and date when a valid polygon is found', () => {
    areCoordinatesAndPolygonExtentValid.mockReturnValue(true);
    const spy = jest.fn();
    events.on(GRANULE_HOVERED, spy);
    act(() => { component.unmount(); });
    const testComp = makeComponent({
      granuleFootprints: { '2024-01-15': [[[0, 0], [1, 0], [1, 1]]] },
      granulePlatform: 'MODIS',
      compareState: { active: false },
      visibleExtent: [-180, -90, 180, 90],
      isMobile: false,
    });
    events.trigger(MAP_MOUSE_MOVE, { pixel: [0, 0] }, map, 'EPSG:4326');
    expect(spy).toHaveBeenCalledWith('MODIS', '2024-01-15');
    areCoordinatesAndPolygonExtentValid.mockReturnValue(false);
    events.off(GRANULE_HOVERED, spy);
    act(() => { testComp.unmount(); });
  });

  test('clears granule footprint via GRANULE_HOVERED null when no valid polygon found', () => {
    areCoordinatesAndPolygonExtentValid.mockReturnValue(false);
    const spy = jest.fn();
    events.on(GRANULE_HOVERED, spy);
    act(() => { component.unmount(); });
    const testComp = makeComponent({
      granuleFootprints: { '2024-01-15': [[[0, 0], [1, 0], [1, 1]]] },
      granulePlatform: 'MODIS',
      compareState: { active: false },
      visibleExtent: [-180, -90, 180, 90],
      isMobile: false,
    });
    act(() => {
      testComp.getInstance().setState({ granuleDate: '2024-01-15', granulePlatform: 'MODIS' });
    });
    spy.mockClear();
    events.trigger(MAP_MOUSE_MOVE, { pixel: [0, 0] }, map, 'EPSG:4326');
    expect(spy).toHaveBeenCalledWith(null);
    events.off(GRANULE_HOVERED, spy);
    act(() => { testComp.unmount(); });
  });

  test('returns early when compare is active and pixel is outside active region', () => {
    const { isFromActiveCompareRegion: mockIsFAR } = require('../../modules/compare/util');
    mockIsFAR.mockReturnValueOnce(false);
    areCoordinatesAndPolygonExtentValid.mockReturnValue(true);
    const spy = jest.fn();
    events.on(GRANULE_HOVERED, spy);
    act(() => { component.unmount(); });
    const testComp = makeComponent({
      granuleFootprints: { '2024-01-15': [[[0, 0], [1, 0], [1, 1]]] },
      granulePlatform: 'MODIS',
      compareState: { active: true, activeString: 'active', mode: 'swipe' },
      visibleExtent: [-180, -90, 180, 90],
      swipeOffset: 100,
      isMobile: false,
    });
    events.trigger(MAP_MOUSE_MOVE, { pixel: [0, 0] }, map, 'EPSG:4326');
    expect(spy).not.toHaveBeenCalledWith('MODIS', '2024-01-15');
    areCoordinatesAndPolygonExtentValid.mockReturnValue(false);
    events.off(GRANULE_HOVERED, spy);
    act(() => { testComp.unmount(); });
  });
});

// ---------------------------------------------------------------------------
// handleCursorChange — additional branch coverage
// ---------------------------------------------------------------------------
describe('handleCursorChange additional branches', () => {
  test('skips feature when layer is null', () => {
    const mockFeature = { getGeometry: () => ({ getType: () => 'Point' }) };
    map.hasFeatureAtPixel = () => true;
    map.forEachFeatureAtPixel = (pixel, cb) => { cb(mockFeature, null); };
    events.trigger(MAP_MOUSE_MOVE, { pixel: [0, 0] }, map, 'EPSG:4326');
    expect(changeCursor).not.toHaveBeenCalledWith(true);
  });

  test('skips feature when layer has no wv.def', () => {
    const mockFeature = { getGeometry: () => ({ getType: () => 'Point' }) };
    const mockLayer = { wv: {}, get: () => null };
    map.hasFeatureAtPixel = () => true;
    map.forEachFeatureAtPixel = (pixel, cb) => { cb(mockFeature, mockLayer); };
    events.trigger(MAP_MOUSE_MOVE, { pixel: [0, 0] }, map, 'EPSG:4326');
    expect(changeCursor).not.toHaveBeenCalledWith(true);
  });

  test('skips feature when coordinate is outside layer extent', () => {
    const mockFeature = { getGeometry: () => ({ getType: () => 'Point' }) };
    const mockLayer = {
      wv: { def: { layergroup: 'Data' }, group: 'active' },
      get: () => [10, 10, 20, 20], // extent that does not contain [0,0]
    };
    map.hasFeatureAtPixel = () => true;
    map.forEachFeatureAtPixel = (pixel, cb) => { cb(mockFeature, mockLayer); };
    map.getCoordinateFromPixel = () => [0, 0]; // outside [10,10,20,20]
    events.trigger(MAP_MOUSE_MOVE, { pixel: [0, 0] }, map, 'EPSG:4326');
    expect(changeCursor).not.toHaveBeenCalledWith(true);
  });

  test('treats feature as rendered when layer is wrapped (wrapadjacentdays=true)', () => {
    const mockFeature = { getGeometry: () => ({ getType: () => 'Point' }) };
    const mockLayer = {
      wv: { def: { layergroup: 'Data', wrapadjacentdays: true }, group: 'active' },
      get: () => null,
    };
    map.hasFeatureAtPixel = () => true;
    map.forEachFeatureAtPixel = (pixel, cb) => { cb(mockFeature, mockLayer); };
    events.trigger(MAP_MOUSE_MOVE, { pixel: [0, 0] }, map, 'EPSG:4326');
    expect(changeCursor).toHaveBeenCalledWith(true);
  });
});

// ---------------------------------------------------------------------------
// singleClick — additional branch coverage
// ---------------------------------------------------------------------------
describe('singleClick additional branch coverage', () => {
  test('uses AERONET modal width when metaArray item id includes AERONET', () => {
    const aeronetDialog = () => ({
      metaArray: [{ id: 'AERONET_Points_All' }],
      selected: { AERONET_Points_All: [{}] },
      offsetLeft: 10,
      offsetTop: 10,
    });
    act(() => { component.unmount(); });
    const testComp = makeComponent({ getDialogObject: aeronetDialog });
    act(() => { events.trigger(MAP_SINGLE_CLICK, { pixel: [0, 0] }, map, 'EPSG:4326'); });
    // openVectorDialog should be called (not zoom alert, since hasNonClickableVectorLayer = false)
    expect(openVectorDialog).toHaveBeenCalled();
    act(() => { testComp.unmount(); });
  });

  test('calls selectVectorFeatures when lastSelected has entries and modal is not open', () => {
    const emptyMeta = () => ({
      metaArray: [],
      selected: {},
      offsetLeft: 10,
      offsetTop: 10,
    });
    act(() => { component.unmount(); });
    const testComp = makeComponent({
      getDialogObject: emptyMeta,
      lastSelected: { someLayer: [{}] },
      modalState: { id: [], isOpen: false },
    });
    act(() => { events.trigger(MAP_SINGLE_CLICK, { pixel: [0, 0] }, map, 'EPSG:4326'); });
    expect(selectVectorFeatures).toHaveBeenCalledWith({});
    act(() => { testComp.unmount(); });
  });

  test('skips selectVectorFeatures on mobile when hasNonClickableVectorLayer', () => {
    hasNonClickableVectorLayer.mockReturnValueOnce(true);
    const activateVectorZoomAlert = jest.fn();
    const dialogWithSelected = () => ({
      metaArray: [],
      selected: { someLayer: [{}] },
      offsetLeft: 10,
      offsetTop: 10,
    });
    act(() => { component.unmount(); });
    const testComp = makeComponent({
      getDialogObject: dialogWithSelected,
      activateVectorZoomAlert,
      isMobile: true,
      screenSize: { screenWidth: 375, screenHeight: 667, isMobileDevice: true },
      lastSelected: { someLayer: [{}] },
      compareState: { active: false },
      visibleExtent: [-180, -90, 180, 90],
      granuleFootprints: {},
    });
    act(() => { events.trigger(MAP_SINGLE_CLICK, { pixel: [0, 0] }, map, 'EPSG:4326'); });
    expect(selectVectorFeatures).not.toHaveBeenCalled();
    act(() => { testComp.unmount(); });
  });

  test('mouseMove skips granuleHover when isMobile is true', () => {
    areCoordinatesAndPolygonExtentValid.mockReturnValue(true);
    const spy = jest.fn();
    events.on(GRANULE_HOVERED, spy);
    act(() => { component.unmount(); });
    const testComp = makeComponent({
      granuleFootprints: { '2024-01-15': [[[0, 0], [1, 0], [1, 1]]] },
      granulePlatform: 'MODIS',
      compareState: { active: false },
      visibleExtent: [-180, -90, 180, 90],
      isMobile: true,
    });
    events.trigger(MAP_MOUSE_MOVE, { pixel: [0, 0] }, map, 'EPSG:4326');
    expect(spy).not.toHaveBeenCalledWith('MODIS', '2024-01-15');
    areCoordinatesAndPolygonExtentValid.mockReturnValue(false);
    events.off(GRANULE_HOVERED, spy);
    act(() => { testComp.unmount(); });
  });
});

// ---------------------------------------------------------------------------
// componentWillUnmount
// ---------------------------------------------------------------------------
test('componentWillUnmount removes event listeners so events no longer reach handlers', () => {
  const spy = jest.fn();
  events.on(GRANULE_HOVERED, spy);

  // Confirm handler is active before unmount
  events.trigger(MAP_MOUSE_OUT);
  expect(spy).toHaveBeenCalledTimes(1);
  spy.mockClear();

  act(() => { component.unmount(); });

  // After unmount the component's mouseOut handler is unregistered; GRANULE_HOVERED won't fire
  events.trigger(MAP_MOUSE_OUT);
  expect(spy).not.toHaveBeenCalled();

  events.off(GRANULE_HOVERED, spy);
});

// ---------------------------------------------------------------------------
// Connected component — exercises mapStateToProps and mapDispatchToProps
// ---------------------------------------------------------------------------
describe('connected component', () => {
  const mockReduxState = {
    animation: { isPlaying: false },
    screenSize: { screenWidth: 1000, screenHeight: 800, isMobileDevice: false },
    compare: { active: false, mode: 'swipe', value: 50 },
    config: { projections: { geographic: { maxExtent: [-180, -90, 180, 90] } } },
    map: { isClickable: false },
    measure: { isActive: false },
    modal: { id: [], isOpen: false },
    proj: { id: 'geographic', selected: { crs: 'EPSG:4326' } },
    ui: { isDistractionFreeModeActive: false },
    vectorStyles: { selected: {} },
    alerts: { isVectorExceededAlertPresent: false },
    locationSearch: { isCoordinateSearchActive: false },
    embed: { isEmbedModeActive: false },
  };

  const mockStore = {
    getState: () => mockReduxState,
    subscribe: () => () => {},
    dispatch: jest.fn(),
  };

  test('renders via Redux connect, exercising mapStateToProps and mapDispatchToProps', () => {
    act(() => { component.unmount(); });
    let connectedComp;
    act(() => {
      connectedComp = renderer.create(
        React.createElement(Provider, { store: mockStore },
          React.createElement(VectorInteractionsConnected, null)),
      );
    });
    expect(connectedComp.toJSON()).toBeNull();
    act(() => { connectedComp.unmount(); });
  });

  test('connected component dispatches changeCursor on mouse move with feature', () => {
    act(() => { component.unmount(); });
    const mockFeature = { getGeometry: () => ({ getType: () => 'Point' }) };
    const mockLayer = {
      wv: { def: { layergroup: 'Data' }, group: 'active' },
      get: () => null,
    };
    map.hasFeatureAtPixel = () => true;
    map.forEachFeatureAtPixel = (pixel, cb) => { cb(mockFeature, mockLayer); };

    let connectedComp;
    act(() => {
      connectedComp = renderer.create(
        React.createElement(Provider, { store: mockStore },
          React.createElement(VectorInteractionsConnected, null)),
      );
    });
    events.trigger(MAP_MOUSE_MOVE, { pixel: [0, 0] }, map, 'EPSG:4326');
    expect(mockStore.dispatch).toHaveBeenCalled();
    act(() => { connectedComp.unmount(); });
  });
});
