import { render, screen, fireEvent, within, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import BandsDropdown from './band-dropdown';

const sentinelLayer = { title: 'HLS Sentinel Layer', bandCombo: ['B04'] };
const landsatLayer = { title: 'HLS Landsat Layer', bandCombo: ['B03'] };

const defaultProps = {
  channel: 'r',
  bandSelection: {},
  setBandSelection: jest.fn(),
  layer: sentinelLayer,
  setSelectedPreset: jest.fn(),
};

const renderDropdown = (overrides = {}) => {
  const props = { ...defaultProps, ...overrides };
  return render(
    <BandsDropdown
      channel={props.channel}
      bandSelection={props.bandSelection}
      setBandSelection={props.setBandSelection}
      layer={props.layer}
      setSelectedPreset={props.setSelectedPreset}
    />,
  );
};

const openMenu = () => act(() => { fireEvent.click(screen.getByRole('button')); });

const getMenu = () => screen.getByRole('menu');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('BandsDropdown', () => {
  describe('toggle button label', () => {
    it('shows bandSelection value for the channel when set', () => {
      renderDropdown({ bandSelection: { r: 'B08' } });
      expect(screen.getByRole('button')).toHaveTextContent('B08');
    });

    it('falls back to bandCombo[0] when channel has no selection', () => {
      renderDropdown({ bandSelection: {} });
      expect(screen.getByRole('button')).toHaveTextContent('B04');
    });

    it('falls back to bandCombo[0] for a Landsat layer', () => {
      renderDropdown({ layer: landsatLayer, bandSelection: {} });
      expect(screen.getByRole('button')).toHaveTextContent('B03');
    });
  });

  describe('Sentinel band choices', () => {
    const sentinelBands = ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B8A', 'B09', 'B10', 'B11', 'B12'];

    it('renders all 13 Sentinel band items when the layer title does not include Landsat', async () => {
      renderDropdown();
      await openMenu();
      expect(within(getMenu()).getAllByRole('menuitem')).toHaveLength(sentinelBands.length);
    });

    it('renders each Sentinel band as a menu item', async () => {
      renderDropdown();
      await openMenu();
      const menu = getMenu();
      sentinelBands.forEach((band) => {
        expect(within(menu).getByText(band)).toBeInTheDocument();
      });
    });

    it('includes B8A (Sentinel-only band)', async () => {
      renderDropdown();
      await openMenu();
      expect(within(getMenu()).getByText('B8A')).toBeInTheDocument();
    });
  });

  describe('Landsat band choices', () => {
    const landsatBands = ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B09', 'B10'];

    it('renders all 9 Landsat band items when title includes Landsat', async () => {
      renderDropdown({ layer: landsatLayer });
      await openMenu();
      expect(within(getMenu()).getAllByRole('menuitem')).toHaveLength(landsatBands.length);
    });

    it('renders each Landsat band as a menu item', async () => {
      renderDropdown({ layer: landsatLayer });
      await openMenu();
      const menu = getMenu();
      landsatBands.forEach((band) => {
        expect(within(menu).getByText(band)).toBeInTheDocument();
      });
    });

    it('does not include B8A for Landsat', async () => {
      renderDropdown({ layer: landsatLayer });
      await openMenu();
      expect(within(getMenu()).queryByText('B8A')).not.toBeInTheDocument();
    });

    it('does not include B08 for Landsat', async () => {
      renderDropdown({ layer: landsatLayer });
      await openMenu();
      expect(within(getMenu()).queryByText('B08')).not.toBeInTheDocument();
    });
  });

  describe('handleSelection', () => {
    it('calls setBandSelection with the updated channel value on item click', async () => {
      const setBandSelection = jest.fn();
      renderDropdown({ bandSelection: { r: 'B01', g: 'B02' }, setBandSelection });
      await openMenu();
      act(() => { fireEvent.click(within(getMenu()).getByText('B05')); });
      expect(setBandSelection).toHaveBeenCalledWith({ r: 'B05', g: 'B02' });
    });

    it('calls setSelectedPreset with null on item click', async () => {
      const setSelectedPreset = jest.fn();
      renderDropdown({ setSelectedPreset });
      await openMenu();
      act(() => { fireEvent.click(within(getMenu()).getByText('B03')); });
      expect(setSelectedPreset).toHaveBeenCalledWith(null);
    });

    it('preserves existing bandSelection keys when updating channel', async () => {
      const setBandSelection = jest.fn();
      renderDropdown({
        channel: 'g',
        bandSelection: { r: 'B04', g: 'B03', b: 'B02' },
        setBandSelection,
      });
      await openMenu();
      act(() => { fireEvent.click(within(getMenu()).getByText('B11')); });
      expect(setBandSelection).toHaveBeenCalledWith({ r: 'B04', g: 'B11', b: 'B02' });
    });

    it('handles an empty bandSelection object when selecting a band', async () => {
      const setBandSelection = jest.fn();
      renderDropdown({ channel: 'b', bandSelection: {}, setBandSelection });
      await openMenu();
      act(() => { fireEvent.click(within(getMenu()).getByText('B07')); });
      expect(setBandSelection).toHaveBeenCalledWith({ b: 'B07' });
    });
  });

  describe('dropdown open/close toggle', () => {
    it('starts closed — menu is not present', () => {
      renderDropdown();
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('opens on toggle button click', async () => {
      renderDropdown();
      await openMenu();
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('closes again on a second toggle button click', async () => {
      renderDropdown();
      await openMenu();
      await act(async () => { fireEvent.click(screen.getByRole('button')); });
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });
});
