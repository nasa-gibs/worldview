import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import util from '../../util/util';
import OlCoordinates from './ol-coordinates';
import { registerProjections } from '../../fixtures';
import { MAP_MOUSE_MOVE, MAP_MOUSE_OUT } from '../../util/constants';

jest.mock('react-redux', () => ({ connect: () => (OlCoordinates) => OlCoordinates }));

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
  root.unmount(container);
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
