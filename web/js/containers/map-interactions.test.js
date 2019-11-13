import React from 'react';
import renderer from 'react-test-renderer';
import util from '../util/util';
import { OlCoordinates } from './map-interactions';
import { registerProjections } from '../fixtures';

let events;
let component;
let map;
let changeCursor;
let selectVectorFeatures;
let getDialogObject;
let openVectorDiaglog;
beforeEach(() => {
  registerProjections();
  events = util.events();
  changeCursor = jest.fn();
  openVectorDiaglog = jest.fn();
  selectVectorFeatures = jest.fn();
  getDialogObject = () => { return { metaArray: [0], selected: [1], offsetLeft: 100, offsetTop: 100 }; };
  component = renderer.create(
    <OlCoordinates
      mouseEvents={events}
      isShowingClick={false}
      changeCursor={changeCursor}
      getDialogObject={getDialogObject}
      openVectorDiaglog={openVectorDiaglog}
      selectVectorFeatures={selectVectorFeatures}
      lastSelected={{}}
      modalState={{ id: [], isOpen: false }}
    />
  );
  map = {
    getEventPixel: jest.fn(),
    getCoordinateFromPixel: () => [0, 0],
    hasFeatureAtPixel: () => false
  };
});

afterEach(() => {
  util.setCoordinateFormat('latlon-dd');
});

test('shows coordinates of (10, 20) when moving the mouse', () => {
  map.getCoordinateFromPixel = () => [10, 20];
  events.trigger('mousemove', {}, map, 'EPSG:4326');
  expect(component.toJSON()).toMatchSnapshot();
  expect(changeCursor.mock.calls.length).toBe(0);
});
test('shows 10°00.000\'N, 20°00.000\'E when set to degrees and minutes format', () => {
  util.setCoordinateFormat('latlon-dm');
  map.getCoordinateFromPixel = () => [10, 20];
  events.trigger('mousemove', {}, map, 'EPSG:4326');
  expect(component.toJSON()).toMatchSnapshot();
  expect(changeCursor.mock.calls.length).toBe(0);
});

test('clears coordinates when mouse moves off the map', () => {
  map.getCoordinateFromPixel = () => [10, 20];
  events.trigger('mousemove', {}, map, 'EPSG:4326');
  events.trigger('mouseout', {}, map, 'EPSG:4326');
  expect(component.toJSON()).toMatchSnapshot();
  expect(changeCursor.mock.calls.length).toBe(0);
});

test('reprojects (0,0) to (-45, 90) for EPSG:3413', () => {
  map.getCoordinateFromPixel = () => [0, 0];
  events.trigger('mousemove', {}, map, 'EPSG:3413');
  expect(component.toJSON()).toMatchSnapshot();
  expect(changeCursor.mock.calls.length).toBe(0);
});
test('if there is a feature at pixel dispatch changeCursor action', () => {
  map.hasFeatureAtPixel = () => true;
  events.trigger('mousemove', {}, map, 'EPSG:3413');
  expect(component.toJSON()).toMatchSnapshot();
  expect(changeCursor.mock.calls.length).toBe(1);
});
test('if there is a feature at pixel on click get dialod', () => {
  events.trigger('singleclick', { pixel: [0, 0] }, map, 'EPSG:4326');
  expect(component.toJSON()).toMatchSnapshot();
  expect(changeCursor.mock.calls.length).toBe(0);
  expect(selectVectorFeatures.mock.calls.length).toBe(1);
  expect(openVectorDiaglog.mock.calls.length).toBe(1);
});
