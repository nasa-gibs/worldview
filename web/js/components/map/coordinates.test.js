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

test('change format from latlon-dm to latlon-dms', () => {
  const callback = jest.fn();
  act(() => {
    root.render(
      <Coordinates
        format="latlon-dm"
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
  expect(callback).toHaveBeenCalledWith('latlon-dms');
});

test('change format from latlon-dms to latlon-dd', () => {
  const callback = jest.fn();
  act(() => {
    root.render(
      <Coordinates
        format="latlon-dms"
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
  expect(callback).toHaveBeenCalledWith('latlon-dd');
});

test('returns null when latitude is null', () => {
  act(() => {
    root.render(
      <Coordinates
        format="latlon-dd"
        latitude={null}
        longitude={0}
        crs="EPSG:4326"
        onFormatChange={jest.fn()}
      />,
    );
  });
  expect(container.querySelector('#coords-panel')).toBeNull();
});

test('returns null when longitude is null', () => {
  act(() => {
    root.render(
      <Coordinates
        format="latlon-dd"
        latitude={0}
        longitude={null}
        crs="EPSG:4326"
        onFormatChange={jest.fn()}
      />,
    );
  });
  expect(container.querySelector('#coords-panel')).toBeNull();
});

test('renders crs label in the button', () => {
  act(() => {
    root.render(
      <Coordinates
        format="latlon-dd"
        latitude={10}
        longitude={20}
        crs="EPSG:3413"
        onFormatChange={jest.fn()}
      />,
    );
  });
  expect(container.textContent).toContain('EPSG:3413');
});

test('renders button with correct id and class', () => {
  act(() => {
    root.render(
      <Coordinates
        format="latlon-dd"
        latitude={10}
        longitude={20}
        crs="EPSG:4326"
        onFormatChange={jest.fn()}
      />,
    );
  });
  const button = container.querySelector('#coords-panel');
  expect(button).not.toBeNull();
  expect(button.className).toContain('wv-coords-map');
});
