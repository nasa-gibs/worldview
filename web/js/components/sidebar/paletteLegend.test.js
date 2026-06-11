/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import PaletteLegend from './paletteLegend';

// reactstrap Tooltip tries to locate its target in the DOM on mount and throws in jsdom
jest.mock('reactstrap', () => ({
  ...jest.requireActual('reactstrap'),
  Tooltip: ({ children }) => <span className="mock-tooltip">{children}</span>,
}));

// VisibilitySensor renders its child via a render-prop
jest.mock('../util/visibility-sensor', () => ({ children }) => children());

jest.mock('../../modules/palettes/util', () => ({
  drawSidebarPaletteOnCanvas: jest.fn(),
  drawTicksOnCanvas: jest.fn(),
}));

jest.mock('../../modules/settings/util', () => ({
  checkTemperatureUnitConversion: jest.fn(() => ({ needsConversion: false, legendTempUnit: 'K' })),
  convertPaletteValue: jest.fn((val) => `conv(${val})`),
}));

jest.mock('../../modules/layers/util', () => ({
  getOrbitTrackTitle: jest.fn(() => 'Orbit Track'),
}));

jest.mock('../../modules/palettes/actions', () => ({
  setToggledClassification: jest.fn((...args) => ({ type: 'TOGGLE', args })),
  refreshDisabledClassification: jest.fn((...args) => ({ type: 'REFRESH', args })),
}));

const settingsUtil = require('../../modules/settings/util');
const palettesUtil = require('../../modules/palettes/util');
const palettesActions = require('../../modules/palettes/actions');

const continuousLegend = {
  id: 'leg1',
  title: 'Continuous Legend',
  type: 'continuous',
  colors: ['ff0000ff', '00ff00ff', '0000ffff'],
  tooltips: ['0', '50', '100'],
  refs: ['r0', 'r1', 'r2'],
  units: 'K',
  minLabel: 'lo',
  maxLabel: 'hi',
};

const classificationLegend = {
  id: 'leg2',
  title: 'Classification Legend',
  type: 'classification',
  colors: ['ff0000ff', '00ff00ff'],
  tooltips: ['Class A', 'Class B'],
  refs: ['r0', 'r1'],
};

function buildPalette(overrides = {}) {
  return {
    disabled: [],
    min: 0,
    max: 0,
    noclip: false,
    squash: false,
    entries: { refs: ['r0', 'r1', 'r2'] },
    custom: undefined,
    ...overrides,
  };
}

function buildLayer(overrides = {}) {
  return {
    id: 'MODIS_Layer',
    palette: { id: 'modis_palette' },
    type: 'wmts',
    colormapType: 'continuous',
    track: undefined,
    disabled: false,
    ...overrides,
  };
}

const mockStore = configureStore([]);

function renderLegend(props = {}) {
  const palette = props.palette || buildPalette();
  const getPalette = props.getPalette || jest.fn(() => palette);
  const store = mockStore({});
  store.dispatch = jest.fn();

  const allProps = {
    isRunningData: false,
    colorHex: null,
    width: 231,
    height: 12,
    getPalette,
    parentLayer: null,
    compareState: 'active',
    isDistractionFreeModeActive: false,
    paletteLegends: [continuousLegend],
    globalTemperatureUnit: '',
    isEmbedModeActive: false,
    isMobile: false,
    palettes: { custom: {} },
    paletteId: 'palette-1',
    isCustomPalette: false,
    showingVectorHand: false,
    showingChartingIcon: false,
    toggleAllClassifications: jest.fn(),
    ...props,
    layer: buildLayer(props.layer),
  };

  const utils = render(
    <Provider store={store}>
      <PaletteLegend {...allProps} />
    </Provider>,
  );
  return {
    store, getPalette, palette, ...utils,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  settingsUtil.checkTemperatureUnitConversion.mockReturnValue({
    needsConversion: false,
    legendTempUnit: 'K',
  });
});

describe('PaletteLegend rendering', () => {
  it('returns nothing when the layer has no palette', () => {
    const { container } = renderLegend({ layer: { palette: null } });
    expect(container.firstChild).toBeNull();
  });

  it('renders the panel with the palette id', () => {
    const { container } = renderLegend();
    expect(container.querySelector('#palette-1_panel')).toBeTruthy();
  });

  it('renders a continuous colorbar canvas', () => {
    const { container } = renderLegend();
    expect(container.querySelector('canvas.wv-palettes-colorbar')).toBeTruthy();
    expect(palettesUtil.drawSidebarPaletteOnCanvas).toHaveBeenCalled();
  });

  it('renders min/max labels with units', () => {
    const { getByText } = renderLegend();
    expect(getByText('lo K')).toBeTruthy();
    expect(getByText(/hi K/)).toBeTruthy();
  });

  it('renders a title when there is more than one colorbar', () => {
    const { container } = renderLegend({
      paletteLegends: [continuousLegend, { ...continuousLegend, id: 'leg1b' }],
    });
    const titles = container.querySelectorAll('.wv-palettes-title');
    expect(titles.length).toBe(2);
    expect(titles[0].textContent).toBe('Continuous Legend');
  });

  it('renders classification legends through the visibility sensor', () => {
    const { container } = renderLegend({ paletteLegends: [classificationLegend] });
    expect(container.querySelector('.wv-palettes-classes')).toBeTruthy();
  });

  it('ignores colormaps with an unsupported type', () => {
    const { container } = renderLegend({
      paletteLegends: [{ ...continuousLegend, type: 'mystery' }],
    });
    // panel renders but no colorbar for the unsupported type
    expect(container.querySelector('canvas.wv-palettes-colorbar')).toBeNull();
  });

  it('applies the custom palette class', () => {
    const { container } = renderLegend({ isCustomPalette: true });
    expect(container.querySelector('.is_custom')).toBeTruthy();
  });

  it('applies bottomspace class when showing the charting icon', () => {
    const { container } = renderLegend({ showingChartingIcon: true });
    expect(container.querySelector('.bottomspace-palette')).toBeTruthy();
  });

  it('applies bottomspace class for AERONET vector hand', () => {
    const { container } = renderLegend({
      showingVectorHand: true,
      layer: { id: 'AERONET_Layer' },
    });
    expect(container.querySelector('.bottomspace-palette')).toBeTruthy();
  });

  it('applies mobile colorbar styling', () => {
    const { container } = renderLegend({ isMobile: true });
    const canvas = container.querySelector('canvas.wv-palettes-colorbar');
    expect(canvas.style.width).toBe('100%');
  });
});

describe('PaletteLegend default classification disabling', () => {
  it('toggles all classifications from palette defaults on mount', () => {
    // toggleAllClassifications comes from connect's mapDispatchToProps, which dispatches
    // refreshDisabledClassification - assert against the mocked action creator
    const palette = buildPalette({ disabled: ['0', '1'] });
    renderLegend({
      palette,
      getPalette: jest.fn(() => palette),
      layer: { disabled: undefined },
    });
    expect(palettesActions.refreshDisabledClassification)
      .toHaveBeenCalledWith('MODIS_Layer', [0, 1], 0, 'active');
  });

  it('does not toggle when the layer already has a disabled value', () => {
    renderLegend({ layer: { disabled: false } });
    expect(palettesActions.refreshDisabledClassification).not.toHaveBeenCalled();
  });
});

describe('PaletteLegend running data (continuous)', () => {
  it('renders the running label when hovering produces a legend match', () => {
    const { container } = renderLegend({
      isRunningData: true,
      colorHex: 'ff0000ff',
    });
    expect(container.querySelector('.wv-running')).toBeTruthy();
  });

  it('converts min/max labels when temperature conversion is needed', () => {
    settingsUtil.checkTemperatureUnitConversion.mockReturnValue({
      needsConversion: true,
      legendTempUnit: 'K',
    });
    renderLegend({ isRunningData: true, colorHex: 'ff0000ff', globalTemperatureUnit: 'C' });
    expect(settingsUtil.convertPaletteValue).toHaveBeenCalled();
  });

  it('handles noclip palettes that label values outside the range', () => {
    const palette = buildPalette({ noclip: true, min: 1, max: 1 });
    expect(() => renderLegend({
      isRunningData: true,
      colorHex: 'ff0000ff',
      palette,
      getPalette: jest.fn(() => palette),
    })).not.toThrow();
  });

  it('adjusts running offset when embed mode is active', () => {
    const { container } = renderLegend({
      isRunningData: true,
      colorHex: 'ff0000ff',
      isEmbedModeActive: true,
    });
    expect(container.querySelector('.wv-palettes-legend')).toBeTruthy();
  });
});

describe('PaletteLegend colorbar interactions', () => {
  it('updates running state on mouse enter/leave of the colorbar', () => {
    const { container } = renderLegend();
    const canvas = container.querySelector('canvas.wv-palettes-colorbar');
    fireEvent.mouseEnter(canvas);
    expect(container.querySelector('.active-legend')).toBeTruthy();
    fireEvent.mouseLeave(canvas);
    expect(container.querySelector('.active-legend')).toBeNull();
  });

  it('reads canvas color on mouse move', () => {
    const { container } = renderLegend();
    const canvas = container.querySelector('canvas.wv-palettes-colorbar');
    expect(() => fireEvent.mouseMove(canvas, { clientX: 5, clientY: 5 })).not.toThrow();
  });
});

describe('PaletteLegend classification rendering', () => {
  it('marks the active key when running data matches', () => {
    const { container } = renderLegend({
      paletteLegends: [classificationLegend],
      isRunningData: true,
      colorHex: 'ff0000ff',
    });
    expect(container.querySelector('.wv-active')).toBeTruthy();
  });

  it('renders a single-key classification with a category label', () => {
    const singleKeyLegend = {
      ...classificationLegend,
      colors: ['ff0000ff'],
      tooltips: ['Only Class'],
    };
    const { container } = renderLegend({ paletteLegends: [singleKeyLegend] });
    const label = container.querySelector('.wv-running-category-label');
    expect(label).toBeTruthy();
    expect(label.textContent).toBe('Only Class');
  });

  it('renders an orbit track label for track layers', () => {
    const singleKeyLegend = {
      ...classificationLegend,
      colors: ['ff0000ff'],
      tooltips: ['Track'],
    };
    const { container } = renderLegend({
      paletteLegends: [singleKeyLegend],
      layer: { track: 'ascending' },
    });
    expect(container.querySelector('.wv-running-category-label').textContent)
      .toContain('Orbit Track');
  });

  it('renders an invisible (checkerbox) classification key without a tooltip', () => {
    const invisibleLegend = {
      ...classificationLegend,
      colors: ['00000000', 'ff0000ff'],
      tooltips: ['Invisible', 'Visible'],
    };
    const { container } = renderLegend({ paletteLegends: [invisibleLegend] });
    expect(container.querySelector('.checkerbox-bg')).toBeTruthy();
  });

  it('marks disabled classification keys', () => {
    const palette = buildPalette({ disabled: [0] });
    const { container } = renderLegend({
      paletteLegends: [classificationLegend],
      palette,
      getPalette: jest.fn(() => palette),
    });
    expect(container.querySelector('.disabled-classification')).toBeTruthy();
  });

  it('uses a custom palette color when palette.custom is set', () => {
    const palette = buildPalette({ custom: 'myCustom' });
    const { container } = renderLegend({
      paletteLegends: [classificationLegend],
      palette,
      getPalette: jest.fn(() => palette),
      palettes: { custom: { myCustom: { colors: ['abcdefff'] } } },
    });
    expect(container.querySelector('.wv-palettes-class')).toBeTruthy();
  });

  it('renders a sublayer key when a parentLayer is provided', () => {
    const { container } = renderLegend({
      paletteLegends: [classificationLegend],
      parentLayer: { id: 'PARENT' },
    });
    expect(container.querySelector('.wv-palettes-classes')).toBeTruthy();
  });

  it('handles classification mouse interactions', () => {
    const { container } = renderLegend({ paletteLegends: [classificationLegend] });
    const key = container.querySelector('.wv-palettes-class');
    fireEvent.mouseMove(key);
    fireEvent.mouseEnter(key);
    fireEvent.mouseLeave(key);
    expect(key).toBeTruthy();
  });
});

describe('PaletteLegend prop change effects', () => {
  const baseProps = () => {
    const palette = buildPalette();
    return {
      getPalette: jest.fn(() => palette),
      width: 231,
      height: 12,
      parentLayer: null,
      compareState: 'active',
      isDistractionFreeModeActive: false,
      paletteLegends: [continuousLegend],
      globalTemperatureUnit: '',
      isEmbedModeActive: false,
      isMobile: false,
      palettes: { custom: {} },
      paletteId: 'palette-1',
      isCustomPalette: false,
      showingVectorHand: false,
      showingChartingIcon: false,
      toggleAllClassifications: jest.fn(),
    };
  };

  it('recomputes the canvas when the layer changes', () => {
    const store = mockStore({});
    store.dispatch = jest.fn();
    const props = baseProps();
    const { rerender } = render(
      <Provider store={store}>
        <PaletteLegend {...props} isRunningData={false} colorHex={null} layer={buildLayer()} />
      </Provider>,
    );
    palettesUtil.drawSidebarPaletteOnCanvas.mockClear();
    rerender(
      <Provider store={store}>
        <PaletteLegend {...props} isRunningData={false} colorHex={null} layer={buildLayer({ id: 'NEW_Layer' })} />
      </Provider>,
    );
    expect(palettesUtil.drawSidebarPaletteOnCanvas).toHaveBeenCalled();
  });

  it('updates color hex and running-data state when those props change', () => {
    const store = mockStore({});
    store.dispatch = jest.fn();
    const props = baseProps();
    const { rerender, container } = render(
      <Provider store={store}>
        <PaletteLegend {...props} isRunningData={false} colorHex="ff0000ff" layer={buildLayer()} />
      </Provider>,
    );
    rerender(
      <Provider store={store}>
        <PaletteLegend {...props} isRunningData colorHex="00ff00ff" layer={buildLayer()} />
      </Provider>,
    );
    expect(container.querySelector('#palette-1_panel')).toBeTruthy();
  });
});
