/* eslint-disable no-restricted-syntax */
import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { act } from 'react-dom/test-utils';
import Coordinates from './coordinates';

let container;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  unmountComponentAtNode(container);
  container.remove();
  container = null;
});

describe('formats', () => {
  const formats = ['latlon-dd', 'latlon-dm', 'latlon-dms'];
  for (const format of formats) {
    // eslint-disable-next-line no-loop-func
    test(`coordinate in ${format} format`, () => {
      act(() => {
        render(<Coordinates
          format={format}
          latitude={0}
          longitude={0}
          crs="EPSG:4326"
          onFormatChange={jest.fn()}
        />, container);
      });
      expect(container.innerHTML).toMatchSnapshot();
    });
  }
});

test('change format from latlon-dd to latlon-dm', () => {
  const callback = jest.fn();
  act(() => {
    const component = render(<Coordinates
      format="latlon-dd"
      latitude={0}
      longitude={0}
      crs="EPSG:4326"
      onFormatChange={callback}
    />, container);

    component.changeFormat();
    expect(callback).toBeCalledWith('latlon-dm');
  });
});
