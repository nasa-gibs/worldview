import React from 'react';
import renderer from 'react-test-renderer';
import util from '../../util/util';
import { VectorInteractions } from './ol-vector-interactions';
import { registerProjections } from '../../fixtures';

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
  map = {
    getEventPixel: jest.fn(),
    getCoordinateFromPixel: () => [0, 0],
    hasFeatureAtPixel: () => false,
    getView: jest.fn().mockReturnThis(),
    getResolution: () => 0.0175,
  };
});

test('if there is a feature at pixel dispatch changeCursor action', () => {
  map.hasFeatureAtPixel = () => true;
  events.trigger('map:mousemove', {}, map, 'EPSG:3413');
  doAsync(() => expect(changeCursor.mock.calls.length).toBe(1));
});
test('if there is a feature at pixel on click get dialog', () => {
  events.trigger('map:singleclick', { pixel: [0, 0] }, map, 'EPSG:4326');
  expect(changeCursor.mock.calls.length).toBe(0);
  expect(selectVectorFeatures.mock.calls.length).toBe(1);
  expect(openVectorDialog.mock.calls.length).toBe(1);
});
test('if there is not a feature at pixel do not dispatch changeCursor action', () => {
  map.hasFeatureAtPixel = () => false;
  events.trigger('map:mousemove', { pixel: [0, 0] }, map, 'EPSG:4326');
  doAsync(() => expect(changeCursor.mock.calls.length).toBe(0));
});
test('Check that hover changes', () => {
  map.hasFeatureAtPixel = () => false;
  events.trigger('map:mousemove', { pixel: [0, 0] }, map, 'EPSG:4326');
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
