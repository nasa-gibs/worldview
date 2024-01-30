/* eslint-disable no-restricted-syntax */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import renderer from 'react-test-renderer';
import Coordinates from './coordinates';

let container;
let root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  root.unmount(container);
  container.remove();
  container = null;
});

describe('formats', () => {
  const formats = ['latlon-dd', 'latlon-dm', 'latlon-dms'];
  for (const format of formats) {
    // eslint-disable-next-line no-loop-func
    test(`coordinate in ${format} format`, () => {
      act(() => {
        root.render(<Coordinates
          format={format}
          latitude={0}
          longitude={0}
          crs="EPSG:4326"
          onFormatChange={jest.fn()}
        />);
      });
      expect(container.innerHTML).toMatchSnapshot();
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
  const instance = component.getInstance();

  instance.changeFormat();
  expect(callback).toBeCalledWith('latlon-dm');
});
