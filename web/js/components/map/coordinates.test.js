import React from 'react';
import renderer from 'react-test-renderer';
import Coordinates from './coordinates';

describe('formats', () => {
  let formats = ['latlon-dd', 'latlon-dm', 'latlon-dms'];
  for (let format of formats) {
    test(`coordinate in ${format} format`, () => {
      let component = renderer.create(<Coordinates
        format={format}
        latitude={0}
        longitude={0}
        crs='EPSG:4326'
        onFormatChange={jest.fn()}
      />);
      expect(component.toJSON()).toMatchSnapshot();
    });
  }
});

test('change format from latlon-dd to latlon-dm', () => {
  let callback = jest.fn();
  let component = renderer.create(<Coordinates
    format='latlon-dd'
    latitude={0}
    longitude={0}
    crs='EPSG:4326'
    onFormatChange={callback}
  />);

  let tree = component.toJSON();
  tree.props.onClick();
  expect(callback).toBeCalledWith('latlon-dm');
});
