import React from 'react';
import renderer from 'react-test-renderer';
import Coordinates from './coordinates';

describe('formats', () => {
  const formats = ['latlon-dd', 'latlon-dm', 'latlon-dms'];
  for (const format of formats) {
    test(`coordinate in ${format} format`, () => {
      const component = renderer.create(<Coordinates
        format={format}
        latitude={0}
        longitude={0}
        crs="EPSG:4326"
        onFormatChange={jest.fn()}
      />);
      expect(component.toJSON()).toMatchSnapshot();
    });
  }
});

test('change format from latlon-dd to latlon-dm', () => {
  const callback = jest.fn();
  const component = renderer.create(<Coordinates
    format="latlon-dd"
    latitude={0}
    longitude={0}
    crs="EPSG:4326"
    onFormatChange={callback}
  />);

  const tree = component.toJSON();
  tree.props.onClick();
  expect(callback).toBeCalledWith('latlon-dm');
});
