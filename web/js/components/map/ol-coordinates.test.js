import { createRoot } from 'react-dom/client';
import { act } from 'react';
import util from '../../util/util';
import OlCoordinates from './ol-coordinates';
import { registerProjections } from '../../fixtures';
import { MAP_MOUSE_MOVE, MAP_MOUSE_OUT } from '../../util/constants';

jest.mock('react-redux', () => ({ connect: () => (OlCoordinatesMock) => OlCoordinatesMock }));

const { events } = util;
let container;
let map;
let root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  registerProjections();
  root = createRoot(container);

  map = {
    getEventPixel: jest.fn(),
    getCoordinateFromPixel: () => [0, 0],
  };
  act(() => {
    root.render(<OlCoordinates show />);
  });
});

afterEach(() => {
  util.setCoordinateFormat('latlon-dd');
  act(() => {
    root.unmount();
  });
  container.remove();
  container = null;
});

test('shows coordinates of (10, 20) when moving the mouse', () => {
  map.getCoordinateFromPixel = () => [10, 20];
  act(() => {
    events.trigger(MAP_MOUSE_MOVE, {}, map, 'EPSG:4326');
  });
  expect(container.innerHTML).toMatchSnapshot();
});

test('shows coordinates of (-160, 20) when moving the mouse over wrapped', () => {
  map.getCoordinateFromPixel = () => [200, 20];
  act(() => {
    events.trigger(MAP_MOUSE_MOVE, {}, map, 'EPSG:4326');
  });
  expect(container.innerHTML).toMatchSnapshot();
});

test('shows 20°00.000\'N, 10°00.000\'E when set to degrees and minutes format', () => {
  util.setCoordinateFormat('latlon-dm');
  map.getCoordinateFromPixel = () => [10, 20];
  act(() => {
    events.trigger(MAP_MOUSE_MOVE, {}, map, 'EPSG:4326');
  });
  expect(container.innerHTML).toMatchSnapshot();
});

test('clears coordinates when mouse moves off the map', () => {
  map.getCoordinateFromPixel = () => [10, 20];
  act(() => {
    events.trigger(MAP_MOUSE_MOVE, {}, map, 'EPSG:4326');
    events.trigger(MAP_MOUSE_OUT, {}, map, 'EPSG:4326');
  });
  expect(container.innerHTML).toMatchSnapshot();
});

test('reprojects (0,0) to (-45, 90) for EPSG:3413', () => {
  map.getCoordinateFromPixel = () => [0, 0];
  act(() => {
    events.trigger(MAP_MOUSE_MOVE, {}, map, 'EPSG:3413');
  });
  expect(container.innerHTML).toMatchSnapshot();
});

test('clears coordinates when pixel coordinate is null', () => {
  map.getCoordinateFromPixel = () => null;
  act(() => {
    events.trigger(MAP_MOUSE_MOVE, {}, map, 'EPSG:4326');
  });
  expect(container.querySelector('.wv-coords-map')).toBeNull();
});

test('clears coordinates when lat is out of bounds (>90)', () => {
  map.getCoordinateFromPixel = () => [0, 5000000];
  act(() => {
    events.trigger(MAP_MOUSE_MOVE, {}, map, 'EPSG:4326');
  });
  expect(container.querySelector('.wv-coords-map')).toBeNull();
});

test('clears coordinates when lon is far out of bounds (>250) for geographic', () => {
  map.getCoordinateFromPixel = () => [300, 10];
  act(() => {
    events.trigger(MAP_MOUSE_MOVE, {}, map, 'EPSG:4326');
  });
  expect(container.querySelector('.wv-coords-map')).toBeNull();
});

test('does not clear coordinates when mouseOut target has wv-coords-map class', () => {
  map.getCoordinateFromPixel = () => [10, 20];
  act(() => {
    events.trigger(MAP_MOUSE_MOVE, {}, map, 'EPSG:4326');
  });
  const coordsEl = container.querySelector('.wv-coords-map');
  expect(coordsEl).not.toBeNull();

  const mockTarget = { classList: { contains: (cls) => cls === 'wv-coords-map' } };
  act(() => {
    events.trigger(MAP_MOUSE_OUT, { relatedTarget: mockTarget });
  });
  expect(container.querySelector('.wv-coords-map')).not.toBeNull();
});

test('hides coordinates container on mobile (display none)', () => {
  const mobileContainer = document.createElement('div');
  document.body.appendChild(mobileContainer);
  const mobileRoot = createRoot(mobileContainer);
  act(() => {
    mobileRoot.render(<OlCoordinates show isMobile />);
  });
  const coordsCase = mobileContainer.querySelector('#ol-coords-case');
  expect(coordsCase.style.display).toBe('none');
  act(() => { mobileRoot.unmount(); });
  mobileContainer.remove();
});

test('renders coordinates container element', () => {
  const coordsCase = container.querySelector('#ol-coords-case');
  expect(coordsCase).not.toBeNull();
});

test('shows coordinates in dms format when format is set', () => {
  util.setCoordinateFormat('latlon-dms');
  map.getCoordinateFromPixel = () => [10, 20];
  act(() => {
    events.trigger(MAP_MOUSE_MOVE, {}, map, 'EPSG:4326');
  });
  expect(container.innerHTML).toMatchSnapshot();
});
