import React from 'react';
import util from '../util/util';
import { MapInteractions } from './map-interactions';
import { registerProjections } from '../fixtures';
import renderer from 'react-test-renderer';

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
    <MapInteractions
      mouseEvents={events}
      isShowingClick={false}
      changeCursor={changeCursor}
      getDialogObject={getDialogObject}
      openVectorDiaglog={openVectorDiaglog}
      selectVectorFeatures={selectVectorFeatures}
      lastSelected={{}}
      measureIsActive={false}
      onCloseModal={jest.fn()}
      modalState={{ id: [], isOpen: false }}
    />,
    {
      createNodeMock: (element) => {
        if (element.id === 'ol-coords-case') {
          return null;
        }
      }
    }
  );
  map = {
    getEventPixel: jest.fn(),
    getCoordinateFromPixel: () => [0, 0],
    hasFeatureAtPixel: () => false
  };
});

test('if there is a feature at pixel dispatch changeCursor action', () => {
  map.hasFeatureAtPixel = () => true;
  events.trigger('mousemove', {}, map, 'EPSG:3413');
  doAsync(() => expect(changeCursor.mock.calls.length).toBe(1));
});
test('if there is a feature at pixel on click get dialog', () => {
  events.trigger('singleclick', { pixel: [0, 0] }, map, 'EPSG:4326');
  expect(changeCursor.mock.calls.length).toBe(0);
  expect(selectVectorFeatures.mock.calls.length).toBe(1);
  expect(openVectorDiaglog.mock.calls.length).toBe(1);
});
test('if there is not a feature at pixel do not dispatch changeCursor action', () => {
  map.hasFeatureAtPixel = () => false;
  events.trigger('mousemove', { pixel: [0, 0] }, map, 'EPSG:4326');
  doAsync(() => expect(changeCursor.mock.calls.length).toBe(0));
});
test('Check that hover changes', () => {
  map.hasFeatureAtPixel = () => false;
  events.trigger('mousemove', { pixel: [0, 0] }, map, 'EPSG:4326');
  doAsync(() => expect(changeCursor.mock.calls.length).toBe(0));
});
test('Check that cursor-hover class is not present', () => {
  expect(component.toJSON()).toMatchSnapshot();
});
function doAsync(c) {
  setTimeout(() => {
    c(true);
  }, 10);
}
