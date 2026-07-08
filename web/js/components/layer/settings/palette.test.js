/* eslint-disable react/prop-types */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('../../../modules/palettes/util', () => ({
  drawPaletteOnCanvas: jest.fn(),
}));
jest.mock('../../../util/util', () => ({
  hexToRGBA: jest.fn((hex) => `rgba(${hex})`),
}));
jest.mock('../../util/scrollbar', () => {
  function MockScrollbar({ children }) {
    return <div data-testid="scrollbar">{children}</div>;
  }
  return MockScrollbar;
});

import PaletteSelect from './palette';

const canvas = document.createElement('canvas');
canvas.width = 120;
canvas.height = 10;

const continuousLegend = {
  type: 'continuous',
  colors: ['ff0000', '00ff00', '0000ff'],
  name: 'My Palette',
};

const classificationLegend = {
  type: 'classification',
  colors: ['ff0000'],
};

const layer = {
  id: 'test-layer',
  palette: { recommended: [] },
};

const defaultProps = {
  activePalette: '__default',
  canvas,
  clearCustomPalette: jest.fn(),
  getCustomPalette: jest.fn(),
  getDefaultLegend: jest.fn(() => continuousLegend),
  groupName: 'active',
  index: 0,
  layer,
  paletteOrder: [],
  palettesTranslate: jest.fn((src, tgt) => tgt),
  setCustomPalette: jest.fn(),
};

const renderPalette = (overrides = {}) => {
  const props = { ...defaultProps, ...overrides };
  return render(
    <PaletteSelect
      activePalette={props.activePalette}
      canvas={props.canvas}
      clearCustomPalette={props.clearCustomPalette}
      getCustomPalette={props.getCustomPalette}
      getDefaultLegend={props.getDefaultLegend}
      groupName={props.groupName}
      index={props.index}
      layer={props.layer}
      paletteOrder={props.paletteOrder}
      palettesTranslate={props.palettesTranslate}
      setCustomPalette={props.setCustomPalette}
    />,
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  defaultProps.getDefaultLegend.mockReturnValue(continuousLegend);
});

describe('PaletteSelect', () => {
  describe('layout', () => {
    it('renders the Color Palette heading', () => {
      renderPalette();
      expect(screen.getByText('Color Palette')).toBeInTheDocument();
    });

    it('renders the scrollbar', () => {
      renderPalette();
      expect(screen.getByTestId('scrollbar')).toBeInTheDocument();
    });

    it('renders the default palette radio input', () => {
      renderPalette();
      // Continuous legend uses legend.name as label
      expect(screen.getByRole('radio', { name: /My Palette/i })).toBeInTheDocument();
    });
  });

  describe('default palette selection', () => {
    it('renders default palette as selected when activePalette is "__default"', () => {
      renderPalette({ activePalette: '__default' });
      expect(screen.getByRole('radio', { name: /My Palette/i }).closest('.wv-palette-selector-row')).toHaveClass('checked');
    });

    it('renders default palette as unselected when activePalette is something else', () => {
      renderPalette({ activePalette: 'custom-id' });
      expect(screen.getByRole('radio', { name: /My Palette/i }).closest('.wv-palette-selector-row')).not.toHaveClass('checked');
    });

    it('calls clearCustomPalette when default radio is clicked', () => {
      const clearCustomPalette = jest.fn();
      renderPalette({ clearCustomPalette });
      fireEvent.click(screen.getByRole('radio', { name: /My Palette/i }));
      expect(clearCustomPalette).toHaveBeenCalledWith('test-layer', 0, 'active');
    });
  });

  describe('classification single-color default', () => {
    it('renders single-color item for classification legend', () => {
      defaultProps.getDefaultLegend.mockReturnValue(classificationLegend);
      renderPalette();
      expect(screen.getByText('Default')).toBeInTheDocument();
    });
  });

  describe('custom palettes from paletteOrder', () => {
    it('renders a custom palette entry from paletteOrder', () => {
      const customPalette = {
        id: 'custom-blue',
        name: 'Blue Palette',
        colors: ['0000ff', '0000aa'],
      };
      renderPalette({
        paletteOrder: ['custom-blue'],
        getCustomPalette: jest.fn(() => customPalette),
        palettesTranslate: jest.fn(() => ['0000ff', '0000aa']),
      });
      expect(screen.getByText('Blue Palette')).toBeInTheDocument();
    });

    it('calls setCustomPalette when a custom palette radio is clicked', () => {
      const customPalette = {
        id: 'custom-blue',
        name: 'Blue Palette',
        colors: ['0000ff', '0000aa'],
      };
      const setCustomPalette = jest.fn();
      renderPalette({
        paletteOrder: ['custom-blue'],
        getCustomPalette: jest.fn(() => customPalette),
        setCustomPalette,
        palettesTranslate: jest.fn(() => ['0000ff']),
      });
      fireEvent.click(screen.getByRole('radio', { name: /Blue Palette/i }));
      expect(setCustomPalette).toHaveBeenCalledWith('test-layer', 'custom-blue', 0, 'active');
    });

    it('skips palettes listed in layer.palette.recommended', () => {
      const layerWithRecommended = { ...layer, palette: { recommended: ['custom-blue'] } };
      renderPalette({
        layer: layerWithRecommended,
        paletteOrder: ['custom-blue'],
        getCustomPalette: jest.fn(() => ({ id: 'custom-blue', name: 'Blue', colors: ['0000ff'] })),
      });
      expect(screen.queryByText('Blue')).not.toBeInTheDocument();
    });
  });
});
