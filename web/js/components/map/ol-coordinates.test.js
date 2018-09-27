import React from 'react';
import renderer from 'react-test-renderer';
import util from '../../util/util';
import OlCoordinates from './ol-coordinates';

test('mouse move', () => {
  util.browser.small = false;
  let events = util.events();
  let component = renderer.create(<OlCoordinates mouseEvents={events}/>);
  let map = {
    getEventPixel: jest.fn(),
    getCoordinateFromPixel: () => [10, 20]
  };
  events.trigger('mousemove', {}, map, 'EPSG:4326');
  let tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
