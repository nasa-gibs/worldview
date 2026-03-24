import { createRoot } from 'react-dom/client';
import { act } from 'react';
import Coordinates from './coordinates';

let container;
let root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  container = null;
});

describe('formats', () => {
  const formats = ['latlon-dd', 'latlon-dm', 'latlon-dms'];
  for (const format of formats) {
    test(`coordinate in ${format} format`, () => {
      act(() => {
        root.render(
          <Coordinates
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
  act(() => {
    root.render(
      <Coordinates
        format="latlon-dd"
        latitude={0}
        longitude={0}
        crs="EPSG:4326"
        onFormatChange={callback}
      />,
    );
  });

  const button = container.querySelector('#coords-panel');
  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  expect(callback).toHaveBeenCalledWith('latlon-dm');
});
