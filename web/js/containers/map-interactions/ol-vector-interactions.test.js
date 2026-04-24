import { act } from 'react';
import renderer from 'react-test-renderer';
import util from '../../util/util';
import { VectorInteractions } from './ol-vector-interactions';
import { registerProjections } from '../../fixtures';
import { MAP_MOUSE_MOVE, MAP_SINGLE_CLICK, GRANULE_HOVERED } from '../../util/constants';

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
