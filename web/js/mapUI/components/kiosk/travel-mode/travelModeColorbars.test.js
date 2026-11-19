import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import TravelModeColorbars from './travelModeColorbars';

jest.mock('../../../../modules/palettes/util', () => ({
  drawTravelModePaletteOnCanvas: jest.fn(),
}));

import { drawTravelModePaletteOnCanvas } from '../../../../modules/palettes/util';

const mockStore = configureMockStore();

// ─── Legend / palette builders ────────────────────────────────────────────────

function buildLegend(overrides = {}) {
  return {
    id: 'legend-1',
    type: 'continuous',
    title: 'Sea Surface Temperature',
    minLabel: '0',
    maxLabel: '30',
    units: '°C',
    colors: ['#ff0000', '#00ff00'],
    ...overrides,
  };
}

function buildLayer(id, legends = [buildLegend()]) {
  return {
    id,
    maps: legends.map((legend) => ({ legend })),
  };
}

function buildStore({ active = {}, rendered = {} } = {}) {
  return mockStore({
    palettes: { active, rendered },
  });
}

function renderComponent(store) {
  const s = store ?? buildStore();
  const utils = render(
    <Provider store={s}>
      <TravelModeColorbars />
    </Provider>,
  );
  return { ...utils, store: s };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TravelModeColorbars', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── TravelModeColorbars: null / empty states ───────────────────────────────

  describe('TravelModeColorbars: null / empty states', () => {
    it('renders null when both active and rendered palettes are empty', () => {
      const { container } = renderComponent(buildStore({ active: {}, rendered: {} }));
      expect(container.firstChild).toBeNull();
    });

    it('renders null when palettes is null', () => {
      const { container } = renderComponent(buildStore({ active: {}, rendered: null }));
      expect(container.firstChild).toBeNull();
    });

    it('renders null when all maps contain only classification legends', () => {
      const classificationLegend = buildLegend({ type: 'classification' });
      const layer = buildLayer('layer-1', [classificationLegend]);
      const { container } = renderComponent(buildStore({
        active: {},
        rendered: { 'layer-1': layer },
      }));
      expect(container.firstChild).toBeNull();
    });

    it('renders null when filteredPalettes has no maps after filtering', () => {
      const layer = buildLayer('layer-1', [buildLegend({ type: 'classification' })]);
      const { container } = renderComponent(buildStore({
        active: {},
        rendered: { 'layer-1': layer },
      }));
      expect(container.firstChild).toBeNull();
    });
  });

  // ── TravelModeColorbars: palette source selection ─────────────────────────

  describe('TravelModeColorbars: palette source selection', () => {
    it('uses renderedPalettes when activePalettes is empty', () => {
      const layer = buildLayer('layer-1');
      renderComponent(buildStore({
        active: {},
        rendered: { 'layer-1': layer },
      }));
      expect(screen.getByText('Sea Surface Temperature')).toBeInTheDocument();
    });

    it('uses activePalettes when activePalettes has entries', () => {
      const activeLayer = buildLayer('layer-active', [buildLegend({ title: 'Active Layer Title' })]);
      const renderedLayer = buildLayer('layer-rendered', [buildLegend({ title: 'Rendered Layer Title' })]);
      renderComponent(buildStore({
        active: { 'layer-active': activeLayer },
        rendered: { 'layer-rendered': renderedLayer },
      }));
      expect(screen.getByText('Active Layer Title')).toBeInTheDocument();
      expect(screen.queryByText('Rendered Layer Title')).not.toBeInTheDocument();
    });

    it('falls back to renderedPalettes when activePalettes is empty object', () => {
      const renderedLayer = buildLayer('layer-1', [buildLegend({ title: 'Rendered Title' })]);
      renderComponent(buildStore({
        active: {},
        rendered: { 'layer-1': renderedLayer },
      }));
      expect(screen.getByText('Rendered Title')).toBeInTheDocument();
    });
  });

  // ── TravelModeColorbars: container rendering ──────────────────────────────

  describe('TravelModeColorbars: container rendering', () => {
    it('renders the container with id "travel-mode-colorbar-container"', () => {
      const layer = buildLayer('layer-1');
      const { container } = renderComponent(buildStore({
        active: {},
        rendered: { 'layer-1': layer },
      }));
      expect(container.querySelector('#travel-mode-colorbar-container')).toBeInTheDocument();
    });

    it('renders one ColorBarRow per non-classification legend', () => {
      const layer = buildLayer('layer-1', [
        buildLegend({ id: 'legend-1', title: 'Temp' }),
        buildLegend({ id: 'legend-2', title: 'Pressure' }),
      ]);
      renderComponent(buildStore({
        active: {},
        rendered: { 'layer-1': layer },
      }));
      expect(screen.getAllByText(/travel-mode-colorbar-row|Temp|Pressure/i)).toBeTruthy();
      expect(screen.getByText('Temp')).toBeInTheDocument();
      expect(screen.getByText('Pressure')).toBeInTheDocument();
    });

    it('renders ColorBarRows for multiple layers', () => {
      const layer1 = buildLayer('layer-1', [buildLegend({ id: 'leg-1', title: 'Layer One' })]);
      const layer2 = buildLayer('layer-2', [buildLegend({ id: 'leg-2', title: 'Layer Two' })]);
      renderComponent(buildStore({
        active: {},
        rendered: { 'layer-1': layer1, 'layer-2': layer2 },
      }));
      expect(screen.getByText('Layer One')).toBeInTheDocument();
      expect(screen.getByText('Layer Two')).toBeInTheDocument();
    });

    it('skips classification legends but renders non-classification ones in the same layer', () => {
      const layer = buildLayer('layer-1', [
        buildLegend({ id: 'leg-class', type: 'classification', title: 'Classification' }),
        buildLegend({ id: 'leg-cont', type: 'continuous', title: 'Continuous' }),
      ]);
      renderComponent(buildStore({
        active: {},
        rendered: { 'layer-1': layer },
      }));
      expect(screen.queryByText('Classification')).not.toBeInTheDocument();
      expect(screen.getByText('Continuous')).toBeInTheDocument();
    });
  });

  // ── ColorBarRow: title rendering ──────────────────────────────────────────

  describe('ColorBarRow: title rendering', () => {
    it('renders the legend title', () => {
      const layer = buildLayer('layer-1', [buildLegend({ title: 'My Layer' })]);
      renderComponent(buildStore({ active: {}, rendered: { 'layer-1': layer } }));
      expect(screen.getByText('My Layer')).toBeInTheDocument();
    });

    it('replaces "Nitric Oxide" title with "Nitrogen Dioxide"', () => {
      const layer = buildLayer('layer-1', [buildLegend({ title: 'Nitric Oxide' })]);
      renderComponent(buildStore({ active: {}, rendered: { 'layer-1': layer } }));
      expect(screen.getByText('Nitrogen Dioxide')).toBeInTheDocument();
      expect(screen.queryByText('Nitric Oxide')).not.toBeInTheDocument();
    });

    it('replaces "Deep Blue Aerosol Optical Depth" with "Aerosol Optical Depth"', () => {
      const layer = buildLayer('layer-1', [buildLegend({ title: 'Deep Blue Aerosol Optical Depth' })]);
      renderComponent(buildStore({ active: {}, rendered: { 'layer-1': layer } }));
      expect(screen.getByText('Aerosol Optical Depth')).toBeInTheDocument();
      expect(screen.queryByText('Deep Blue Aerosol Optical Depth')).not.toBeInTheDocument();
    });

    it('renders other titles unchanged', () => {
      const layer = buildLayer('layer-1', [buildLegend({ title: 'Carbon Monoxide' })]);
      renderComponent(buildStore({ active: {}, rendered: { 'layer-1': layer } }));
      expect(screen.getByText('Carbon Monoxide')).toBeInTheDocument();
    });

    it('renders title in a div with class "travel-mode-colorbar-title"', () => {
      const layer = buildLayer('layer-1', [buildLegend({ title: 'My Title' })]);
      const { container } = renderComponent(buildStore({ active: {}, rendered: { 'layer-1': layer } }));
      expect(container.querySelector('.travel-mode-colorbar-title')).toHaveTextContent('My Title');
    });
  });

  // ── ColorBarRow: min/max labels ───────────────────────────────────────────

  describe('ColorBarRow: min/max labels', () => {
    it('renders minLabel with units when units are defined', () => {
      const layer = buildLayer('layer-1', [buildLegend({ minLabel: '0', units: '°C' })]);
      renderComponent(buildStore({ active: {}, rendered: { 'layer-1': layer } }));
      expect(screen.getByText('0 °C')).toBeInTheDocument();
    });

    it('renders maxLabel with units when units are defined', () => {
      const layer = buildLayer('layer-1', [buildLegend({ maxLabel: '30', units: '°C' })]);
      renderComponent(buildStore({ active: {}, rendered: { 'layer-1': layer } }));
      expect(screen.getByText('30 °C')).toBeInTheDocument();
    });

    it('renders minLabel without units when units are undefined', () => {
      const layer = buildLayer('layer-1', [buildLegend({ minLabel: '0', units: undefined })]);
      renderComponent(buildStore({ active: {}, rendered: { 'layer-1': layer } }));
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('renders maxLabel without units when units are undefined', () => {
      const layer = buildLayer('layer-1', [buildLegend({ maxLabel: '100', units: undefined })]);
      renderComponent(buildStore({ active: {}, rendered: { 'layer-1': layer } }));
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('renders min label in a div with class "travel-mode-colorbar-min-label"', () => {
      const layer = buildLayer('layer-1', [buildLegend({ minLabel: '-10', units: 'K' })]);
      const { container } = renderComponent(buildStore({ active: {}, rendered: { 'layer-1': layer } }));
      expect(container.querySelector('.travel-mode-colorbar-min-label')).toHaveTextContent('-10 K');
    });

    it('renders max label in a div with class "travel-mode-colorbar-max-label"', () => {
      const layer = buildLayer('layer-1', [buildLegend({ maxLabel: '50', units: 'K' })]);
      const { container } = renderComponent(buildStore({ active: {}, rendered: { 'layer-1': layer } }));
      expect(container.querySelector('.travel-mode-colorbar-max-label')).toHaveTextContent('50 K');
    });
  });

  // ── ColorBarRow: canvas ───────────────────────────────────────────────────

  describe('ColorBarRow: canvas', () => {
    it('renders a canvas element', () => {
      const layer = buildLayer('layer-1');
      const { container } = renderComponent(buildStore({ active: {}, rendered: { 'layer-1': layer } }));
      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('renders canvas with class "travel-mode-colorbar"', () => {
      const layer = buildLayer('layer-1');
      const { container } = renderComponent(buildStore({ active: {}, rendered: { 'layer-1': layer } }));
      expect(container.querySelector('canvas.travel-mode-colorbar')).toBeInTheDocument();
    });

    it('renders canvas with width 400', () => {
      const layer = buildLayer('layer-1');
      const { container } = renderComponent(buildStore({ active: {}, rendered: { 'layer-1': layer } }));
      expect(container.querySelector('canvas')).toHaveAttribute('width', '400');
    });

    it('renders canvas with height 40', () => {
      const layer = buildLayer('layer-1');
      const { container } = renderComponent(buildStore({ active: {}, rendered: { 'layer-1': layer } }));
      expect(container.querySelector('canvas')).toHaveAttribute('height', '40');
    });
  });

  // ── ColorBarRow: drawTravelModePaletteOnCanvas ────────────────────────────

  describe('ColorBarRow: drawTravelModePaletteOnCanvas', () => {
    it('calls drawTravelModePaletteOnCanvas for a continuous legend', () => {
      const layer = buildLayer('layer-1', [buildLegend({ type: 'continuous' })]);
      renderComponent(buildStore({ active: {}, rendered: { 'layer-1': layer } }));
      expect(drawTravelModePaletteOnCanvas).toHaveBeenCalledTimes(1);
    });

    it('calls drawTravelModePaletteOnCanvas for a discrete legend', () => {
      const layer = buildLayer('layer-1', [buildLegend({ type: 'discrete' })]);
      renderComponent(buildStore({ active: {}, rendered: { 'layer-1': layer } }));
      expect(drawTravelModePaletteOnCanvas).toHaveBeenCalledTimes(1);
    });

    it('does NOT call drawTravelModePaletteOnCanvas for a classification legend', () => {
      const layer = buildLayer('layer-1', [buildLegend({ type: 'classification' })]);
      renderComponent(buildStore({ active: {}, rendered: { 'layer-1': layer } }));
      expect(drawTravelModePaletteOnCanvas).not.toHaveBeenCalled();
    });

    it('calls drawTravelModePaletteOnCanvas with the correct colors', () => {
      const colors = ['#ff0000', '#00ff00', '#0000ff'];
      const layer = buildLayer('layer-1', [buildLegend({ type: 'continuous', colors })]);
      renderComponent(buildStore({ active: {}, rendered: { 'layer-1': layer } }));
      expect(drawTravelModePaletteOnCanvas).toHaveBeenCalledWith(
        expect.anything(),
        colors,
        400,
        40,
      );
    });

    it('calls drawTravelModePaletteOnCanvas with width 400 and height 40', () => {
      const layer = buildLayer('layer-1', [buildLegend({ type: 'continuous' })]);
      renderComponent(buildStore({ active: {}, rendered: { 'layer-1': layer } }));
      expect(drawTravelModePaletteOnCanvas).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        400,
        40,
      );
    });

    it('calls drawTravelModePaletteOnCanvas once per continuous/discrete legend', () => {
      const layer = buildLayer('layer-1', [
        buildLegend({ id: 'leg-1', type: 'continuous' }),
        buildLegend({ id: 'leg-2', type: 'discrete' }),
      ]);
      renderComponent(buildStore({ active: {}, rendered: { 'layer-1': layer } }));
      expect(drawTravelModePaletteOnCanvas).toHaveBeenCalledTimes(2);
    });

    it('does NOT call drawTravelModePaletteOnCanvas for an unrecognized legend type', () => {
      const layer = buildLayer('layer-1', [buildLegend({ type: 'unknown' })]);
      renderComponent(buildStore({ active: {}, rendered: { 'layer-1': layer } }));
      expect(drawTravelModePaletteOnCanvas).not.toHaveBeenCalled();
    });
  });

  // ── ColorBarRow: DOM structure ────────────────────────────────────────────

  describe('ColorBarRow: DOM structure', () => {
    it('renders the row wrapper with class "travel-mode-colorbar-row"', () => {
      const layer = buildLayer('layer-1');
      const { container } = renderComponent(buildStore({ active: {}, rendered: { 'layer-1': layer } }));
      expect(container.querySelector('.travel-mode-colorbar-row')).toBeInTheDocument();
    });

    it('renders the canvas wrapper with class "travel-mode-colorbar-case"', () => {
      const layer = buildLayer('layer-1');
      const { container } = renderComponent(buildStore({ active: {}, rendered: { 'layer-1': layer } }));
      expect(container.querySelector('.travel-mode-colorbar-case')).toBeInTheDocument();
    });

    it('renders the label container with class "travel-mode-colorbar-label-container"', () => {
      const layer = buildLayer('layer-1');
      const { container } = renderComponent(buildStore({ active: {}, rendered: { 'layer-1': layer } }));
      expect(container.querySelector('.travel-mode-colorbar-label-container')).toBeInTheDocument();
    });

    it('renders the labels wrapper with class "travel-mode-colorbar-labels"', () => {
      const layer = buildLayer('layer-1');
      const { container } = renderComponent(buildStore({ active: {}, rendered: { 'layer-1': layer } }));
      expect(container.querySelector('.travel-mode-colorbar-labels')).toBeInTheDocument();
    });
  });
});
