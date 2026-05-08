import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import TravelModeTitle from './travelModeTitle';

jest.mock('../tile-measurement/utils/layer-data-eic', () => ({
  travelModeData: {
    1: { title: 'True Color Imagery from Terra satellite' },
    2: { title: 'Geostationary imagery from NOAA and JAXA satellites' },
    3: { title: 'Active fires detected by Suomi NPP satellite' },
    4: { title: 'Black Marble Night Time Imaging from Suomi NPP satellite' },
    5: { title: 'Rain and Snow' },
  },
}));

const mockStore = configureMockStore();

function buildStore(travelMode) {
  return mockStore({ ui: { travelMode } });
}

function renderComponent(travelMode) {
  const store = buildStore(travelMode);
  const utils = render(
    <Provider store={store}>
      <TravelModeTitle />
    </Provider>,
  );
  return { ...utils, store };
}

describe('TravelModeTitle', () => {
  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders without crashing', () => {
      expect(() => renderComponent(1)).not.toThrow();
    });

    it('renders the outer wrapper with id "travel-mode-title"', () => {
      const { container } = renderComponent(1);
      expect(container.querySelector('#travel-mode-title')).toBeInTheDocument();
    });

    it('renders a span inside the wrapper', () => {
      const { container } = renderComponent(1);
      expect(container.querySelector('#travel-mode-title span')).toBeInTheDocument();
    });
  });

  // ── Title text: known travelModeIDs ───────────────────────────────────────

  describe('Title text: known travelModeIDs', () => {
    it('renders the title for travelMode 1', () => {
      renderComponent(1);
      expect(screen.getByText('True Color Imagery from Terra satellite')).toBeInTheDocument();
    });

    it('renders the title for travelMode 2', () => {
      renderComponent(2);
      expect(screen.getByText('Geostationary imagery from NOAA and JAXA satellites')).toBeInTheDocument();
    });

    it('renders the title for travelMode 3', () => {
      renderComponent(3);
      expect(screen.getByText('Active fires detected by Suomi NPP satellite')).toBeInTheDocument();
    });

    it('renders the title for travelMode 4', () => {
      renderComponent(4);
      expect(screen.getByText('Black Marble Night Time Imaging from Suomi NPP satellite')).toBeInTheDocument();
    });

    it('renders the title for travelMode 5', () => {
      renderComponent(5);
      expect(screen.getByText('Rain and Snow')).toBeInTheDocument();
    });
  });

  // ── Title text: unknown / falsy travelModeIDs ─────────────────────────────

  describe('Title text: unknown / falsy travelModeIDs', () => {
    it('renders an empty string when travelMode is 0 (not in travelModeData)', () => {
      renderComponent(0);
      const span = document.querySelector('#travel-mode-title span');
      expect(span).toBeEmptyDOMElement();
    });

    it('renders an empty string when travelMode is null', () => {
      renderComponent(null);
      const span = document.querySelector('#travel-mode-title span');
      expect(span).toBeEmptyDOMElement();
    });

    it('renders an empty string when travelMode is undefined', () => {
      renderComponent(undefined);
      const span = document.querySelector('#travel-mode-title span');
      expect(span).toBeEmptyDOMElement();
    });

    it('renders an empty string when travelMode is an unrecognized number', () => {
      renderComponent(999);
      const span = document.querySelector('#travel-mode-title span');
      expect(span).toBeEmptyDOMElement();
    });

    it('renders an empty string when travelMode is an empty string', () => {
      renderComponent('');
      const span = document.querySelector('#travel-mode-title span');
      expect(span).toBeEmptyDOMElement();
    });
  });

  // ── useSelector ───────────────────────────────────────────────────────────

  describe('useSelector', () => {
    it('reads state.ui.travelMode from the Redux store', () => {
      renderComponent(1);
      expect(screen.getByText('True Color Imagery from Terra satellite')).toBeInTheDocument();
    });

    it('updates the title when the store has a different travelMode', () => {
      renderComponent(2);
      expect(screen.getByText('Geostationary imagery from NOAA and JAXA satellites')).toBeInTheDocument();
    });

    it('does not render the wrong title for the given travelMode', () => {
      renderComponent(1);
      expect(screen.queryByText('Rain and Snow')).not.toBeInTheDocument();
    });
  });
});
