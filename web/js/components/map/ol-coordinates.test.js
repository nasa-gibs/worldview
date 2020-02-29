import React from 'react';
import util from '../../util/util';
import { OlCoordinates } from './ol-coordinates';
import { registerProjections } from '../../fixtures';
import renderer from 'react-test-renderer';

let events;
let component;
let map;

beforeEach(() => {
  registerProjections();
  events = util.events();
  component = renderer.create(
    <OlCoordinates
      mouseEvents={events}
      distractionFreeMode={false}
    />
  );
  map = {
    getEventPixel: jest.fn(),
    getCoordinateFromPixel: () => [0, 0]
  };
});

afterEach(() => {
  util.setCoordinateFormat('latlon-dd');
});

test('shows coordinates of (10, 20) when moving the mouse', () => {
  map.getCoordinateFromPixel = () => [10, 20];
  events.trigger('mousemove', {}, map, 'EPSG:4326');
  expect(component.toJSON()).toMatchSnapshot();
});

test('shows coordinates of (-160, 20) when moving the mouse over wrapped', () => {
  map.getCoordinateFromPixel = () => [200, 20];
  events.trigger('mousemove', {}, map, 'EPSG:4326');
  expect(component.toJSON()).toMatchSnapshot();
});

test('shows 20°00.000\'N, 10°00.000\'E when set to degrees and minutes format', () => {
  util.setCoordinateFormat('latlon-dm');
  map.getCoordinateFromPixel = () => [10, 20];
  events.trigger('mousemove', {}, map, 'EPSG:4326');
  expect(component.toJSON()).toMatchSnapshot();
});

test('clears coordinates when mouse moves off the map', () => {
  map.getCoordinateFromPixel = () => [10, 20];
  events.trigger('mousemove', {}, map, 'EPSG:4326');
  events.trigger('mouseout', {}, map, 'EPSG:4326');
  expect(component.toJSON()).toMatchSnapshot();
});

test('reprojects (0,0) to (-45, 90) for EPSG:3413', () => {
  map.getCoordinateFromPixel = () => [0, 0];
  events.trigger('mousemove', {}, map, 'EPSG:3413');
  expect(component.toJSON()).toMatchSnapshot();
});
