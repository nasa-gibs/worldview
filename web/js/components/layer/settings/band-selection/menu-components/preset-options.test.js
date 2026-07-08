import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PresetOptions from './preset-options';

const defaultProps = {
  setBandSelection: jest.fn(),
  setSelectedPreset: jest.fn(),
  selectedPreset: null,
  presetOptions: 'sentinel',
};

const renderPresets = (overrides = {}) => {
  const props = { ...defaultProps, ...overrides };
  return render(
    <PresetOptions
      setBandSelection={props.setBandSelection}
      setSelectedPreset={props.setSelectedPreset}
      selectedPreset={props.selectedPreset}
      presetOptions={props.presetOptions}
    />,
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PresetOptions', () => {
  describe('static structure', () => {
    it('renders the section label', () => {
      renderPresets();
      expect(screen.getByText('Other selectable presets (optional):')).toBeInTheDocument();
    });

    it('renders the scrollable container', () => {
      const { container } = renderPresets();
      expect(container.querySelector('.band-selection-presets-scrollable')).toBeInTheDocument();
    });
  });

  describe('Sentinel presets (default)', () => {
    it('renders 14 preset cards for sentinel', () => {
      const { container } = renderPresets({ presetOptions: 'sentinel' });
      expect(container.querySelectorAll('.band-selection-preset-card')).toHaveLength(14);
    });

    it('renders the Color Infrared sentinel preset title', () => {
      renderPresets({ presetOptions: 'sentinel' });
      expect(screen.getByText('Color Infrared')).toBeInTheDocument();
    });

    it('renders expression text for index presets instead of R/G/B', () => {
      renderPresets({ presetOptions: 'sentinel' });
      expect(screen.getByText('(B08-B04)/(B08+B04)')).toBeInTheDocument();
    });

    it('renders R/G/B band label for RGB presets', () => {
      renderPresets({ presetOptions: 'sentinel' });
      expect(screen.getByText('R: B08, G: B04, B: B03')).toBeInTheDocument();
    });

    it('renders preset images with correct src and alt', () => {
      renderPresets({ presetOptions: 'sentinel' });
      const img = screen.getByAltText('Color Infrared');
      expect(img).toHaveAttribute('src', 'images/layers/previews/geographic/HLS_False_Color_Sentinel_th.jpg');
    });

    it('renders sentinel presets when presetOptions is not "landsat"', () => {
      renderPresets({ presetOptions: 'anything-else' });
      expect(screen.getByText('R: B08, G: B04, B: B03')).toBeInTheDocument();
    });
  });

  describe('Landsat presets', () => {
    it('renders 14 preset cards for landsat', () => {
      const { container } = renderPresets({ presetOptions: 'landsat' });
      expect(container.querySelectorAll('.band-selection-preset-card')).toHaveLength(14);
    });

    it('renders the Color Infrared landsat preset with correct bands', () => {
      renderPresets({ presetOptions: 'landsat' });
      expect(screen.getByText('R: B05, G: B04, B: B03')).toBeInTheDocument();
    });

    it('renders expression text for landsat index presets', () => {
      renderPresets({ presetOptions: 'landsat' });
      expect(screen.getByText('(B05-B04)/(B05+B04)')).toBeInTheDocument();
    });

    it('renders landsat preset images with correct src', () => {
      renderPresets({ presetOptions: 'landsat' });
      const img = screen.getByAltText('Color Infrared');
      expect(img).toHaveAttribute('src', 'images/layers/previews/geographic/HLS_False_Color_Landsat_th.jpg');
    });
  });

  describe('selected preset highlight', () => {
    it('applies selected-preset class to the active preset card', () => {
      const { container } = renderPresets({
        presetOptions: 'sentinel',
        selectedPreset: { id: 'HLS_False_Color_Sentinel' },
      });
      const selected = container.querySelector('.selected-preset');
      expect(selected).toBeInTheDocument();
      expect(selected).toHaveClass('band-selection-preset-card');
    });

    it('does not apply selected-preset class when selectedPreset is null', () => {
      const { container } = renderPresets({ selectedPreset: null });
      expect(container.querySelector('.selected-preset')).not.toBeInTheDocument();
    });

    it('only one card has selected-preset class', () => {
      const { container } = renderPresets({
        presetOptions: 'landsat',
        selectedPreset: { id: 'HLS_False_Color_Landsat' },
      });
      expect(container.querySelectorAll('.selected-preset')).toHaveLength(1);
    });

    it('does not select a card when selectedPreset id does not match any preset', () => {
      const { container } = renderPresets({
        selectedPreset: { id: 'non-existent-id' },
      });
      expect(container.querySelector('.selected-preset')).not.toBeInTheDocument();
    });
  });

  describe('handlePresetSelect on card click', () => {
    it('calls setSelectedPreset with the clicked preset object', () => {
      const setSelectedPreset = jest.fn();
      renderPresets({ presetOptions: 'sentinel', setSelectedPreset });
      fireEvent.click(screen.getByText('Color Infrared').closest('.band-selection-preset-card'));
      expect(setSelectedPreset).toHaveBeenCalledWith(expect.objectContaining({
        id: 'HLS_False_Color_Sentinel',
        title: 'Color Infrared',
      }));
    });

    it('calls setBandSelection with all preset fields on card click', () => {
      const setBandSelection = jest.fn();
      renderPresets({ presetOptions: 'sentinel', setBandSelection });
      fireEvent.click(screen.getByText('Color Infrared').closest('.band-selection-preset-card'));
      expect(setBandSelection).toHaveBeenCalledWith({
        r: 'B08',
        g: 'B04',
        b: 'B03',
        assets: undefined,
        expression: undefined,
        rescale: undefined,
        colormap_name: undefined,
        color_formula: 'Gamma RGB 2.5 Saturation 1.2 Sigmoidal RGB 10 0.35',
        bands_regex: 'B[0-9][0-9A-Za-z]',
        asset_as_band: undefined,
      });
    });

    it('calls setBandSelection with expression fields for an index preset', () => {
      const setBandSelection = jest.fn();
      renderPresets({ presetOptions: 'sentinel', setBandSelection });
      fireEvent.click(screen.getByText('Vegetation Index (NDVI)').closest('.band-selection-preset-card'));
      expect(setBandSelection).toHaveBeenCalledWith(expect.objectContaining({
        expression: '(B08-B04)/(B08+B04)',
        rescale: '-1,1',
        colormap_name: 'brbg',
        asset_as_band: true,
      }));
    });

    it('calls setBandSelection with landsat preset fields on card click', () => {
      const setBandSelection = jest.fn();
      renderPresets({ presetOptions: 'landsat', setBandSelection });
      fireEvent.click(screen.getByText('Color Infrared').closest('.band-selection-preset-card'));
      expect(setBandSelection).toHaveBeenCalledWith(expect.objectContaining({
        r: 'B05',
        g: 'B04',
        b: 'B03',
        bands_regex: 'B[0-9][0-9]',
      }));
    });

    it('calls both setSelectedPreset and setBandSelection on a single click', () => {
      const setBandSelection = jest.fn();
      const setSelectedPreset = jest.fn();
      renderPresets({ setBandSelection, setSelectedPreset });
      fireEvent.click(screen.getByText('Color Infrared').closest('.band-selection-preset-card'));
      expect(setSelectedPreset).toHaveBeenCalledTimes(1);
      expect(setBandSelection).toHaveBeenCalledTimes(1);
    });
  });
});
