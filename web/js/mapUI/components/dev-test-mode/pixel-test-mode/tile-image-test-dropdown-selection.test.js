/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TileImageTestModeDropdown from './tile-image-test-dropdown-selection';

jest.mock('reactstrap', () => ({
  Dropdown: ({ children, isOpen, toggle, className }) => (
    <div
      data-testid="dropdown"
      data-open={String(isOpen)}
      className={className}
    >
      <button type="button" data-testid="dropdown-toggle-trigger" onClick={toggle} />
      {children}
    </div>
  ),
  DropdownToggle: ({ children, style, caret }) => (
    <button
      type="button"
      data-testid="dropdown-toggle"
      style={style}
      data-caret={String(!!caret)}
    >
      {children}
    </button>
  ),
  DropdownMenu: ({ children, style, className }) => (
    <div data-testid="dropdown-menu" style={style} className={className}>
      {children}
    </div>
  ),
  DropdownItem: ({ children, onClick, className }) => (
    <button
      type="button"
      data-testid={`dropdown-item-${children}`}
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  ),
}));

const mockActiveLayers = [
  { id: 'MODIS_Terra_CorrectedReflectance_TrueColor', period: 'daily' },
  { id: 'VIIRS_SNPP_Orbital_Track', period: 'daily' },
  { id: 'GOES-East_ABI_Band2_Red_Visible_1km', period: 'subdaily' },
];

const mockLayerSelection = { id: 'Select Layer', period: 'daily' };

function buildProps(overrides = {}) {
  return {
    activeLayers: mockActiveLayers,
    layerSelection: mockLayerSelection,
    setLayerSelection: jest.fn(),
    ...overrides,
  };
}

function renderComponent(overrides = {}) {
  const props = buildProps(overrides);
  const utils = render(<TileImageTestModeDropdown {...props} />);
  return { ...utils, props };
}

describe('TileImageTestModeDropdown', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('renders the Dropdown wrapper', () => {
      renderComponent();
      expect(screen.getByTestId('dropdown')).toBeInTheDocument();
    });

    it('renders the Dropdown with class "mb-3 mt-2"', () => {
      renderComponent();
      expect(screen.getByTestId('dropdown')).toHaveClass('mb-3', 'mt-2');
    });

    it('renders the DropdownToggle with the current layerSelection id', () => {
      renderComponent();
      expect(screen.getByTestId('dropdown-toggle')).toHaveTextContent('Select Layer');
    });

    it('renders the DropdownToggle with the correct background color', () => {
      renderComponent();
      expect(screen.getByTestId('dropdown-toggle')).toHaveStyle({ backgroundColor: '#d54e21' });
    });

    it('renders the DropdownToggle with caret', () => {
      renderComponent();
      expect(screen.getByTestId('dropdown-toggle')).toHaveAttribute('data-caret', 'true');
    });

    it('renders the DropdownMenu with class "bg-dark"', () => {
      renderComponent();
      expect(screen.getByTestId('dropdown-menu')).toHaveClass('bg-dark');
    });

    it('renders the DropdownMenu with correct transform style', () => {
      renderComponent();
      expect(screen.getByTestId('dropdown-menu')).toHaveStyle({
        transform: 'translate3d(-30px, 0px, 0px)',
      });
    });

    it('renders a DropdownItem for each active layer', () => {
      renderComponent();
      mockActiveLayers.forEach((layer) => {
        expect(screen.getByTestId(`dropdown-item-${layer.id}`)).toBeInTheDocument();
      });
    });

    it('renders the correct number of DropdownItems', () => {
      renderComponent();
      expect(screen.getAllByTestId(/^dropdown-item-/)).toHaveLength(mockActiveLayers.length);
    });

    it('renders each DropdownItem with correct text', () => {
      renderComponent();
      mockActiveLayers.forEach((layer) => {
        expect(screen.getByTestId(`dropdown-item-${layer.id}`)).toHaveTextContent(layer.id);
      });
    });

    it('renders each DropdownItem with correct classes', () => {
      renderComponent();
      mockActiveLayers.forEach((layer) => {
        expect(screen.getByTestId(`dropdown-item-${layer.id}`)).toHaveClass('text-white', 'bg-dark');
      });
    });

    it('reflects a different layerSelection id in the toggle', () => {
      renderComponent({ layerSelection: { id: 'MODIS_Terra_CorrectedReflectance_TrueColor', period: 'daily' } });
      expect(screen.getByTestId('dropdown-toggle')).toHaveTextContent('MODIS_Terra_CorrectedReflectance_TrueColor');
    });

    it('renders with an empty activeLayers array without crashing', () => {
      expect(() => renderComponent({ activeLayers: [] })).not.toThrow();
    });

    it('renders no DropdownItems when activeLayers is empty', () => {
      renderComponent({ activeLayers: [] });
      expect(screen.queryAllByTestId(/^dropdown-item-/)).toHaveLength(0);
    });
  });

  describe('dropdownOpen state / toggle', () => {
    it('renders dropdown as closed (isOpen=false) by default', () => {
      renderComponent();
      expect(screen.getByTestId('dropdown')).toHaveAttribute('data-open', 'false');
    });

    it('opens the dropdown when toggle is called', () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('dropdown-toggle-trigger'));
      expect(screen.getByTestId('dropdown')).toHaveAttribute('data-open', 'true');
    });

    it('closes the dropdown on second toggle call', () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('dropdown-toggle-trigger'));
      fireEvent.click(screen.getByTestId('dropdown-toggle-trigger'));
      expect(screen.getByTestId('dropdown')).toHaveAttribute('data-open', 'false');
    });

    it('toggles open/closed correctly across multiple clicks', () => {
      renderComponent();
      const trigger = screen.getByTestId('dropdown-toggle-trigger');
      fireEvent.click(trigger);
      expect(screen.getByTestId('dropdown')).toHaveAttribute('data-open', 'true');
      fireEvent.click(trigger);
      expect(screen.getByTestId('dropdown')).toHaveAttribute('data-open', 'false');
      fireEvent.click(trigger);
      expect(screen.getByTestId('dropdown')).toHaveAttribute('data-open', 'true');
    });
  });

  describe('handleSelection', () => {
    it('calls setLayerSelection when a DropdownItem is clicked', () => {
      const { props } = renderComponent();
      fireEvent.click(screen.getByTestId(`dropdown-item-${mockActiveLayers[0].id}`));
      expect(props.setLayerSelection).toHaveBeenCalledTimes(1);
    });

    it('calls setLayerSelection with the correct layer object', () => {
      const { props } = renderComponent();
      fireEvent.click(screen.getByTestId(`dropdown-item-${mockActiveLayers[0].id}`));
      expect(props.setLayerSelection).toHaveBeenCalledWith(mockActiveLayers[0]);
    });

    it('calls setLayerSelection with the second layer when second item is clicked', () => {
      const { props } = renderComponent();
      fireEvent.click(screen.getByTestId(`dropdown-item-${mockActiveLayers[1].id}`));
      expect(props.setLayerSelection).toHaveBeenCalledWith(mockActiveLayers[1]);
    });

    it('calls setLayerSelection with the third layer when third item is clicked', () => {
      const { props } = renderComponent();
      fireEvent.click(screen.getByTestId(`dropdown-item-${mockActiveLayers[2].id}`));
      expect(props.setLayerSelection).toHaveBeenCalledWith(mockActiveLayers[2]);
    });

    it('does not call setLayerSelection before any item is clicked', () => {
      const { props } = renderComponent();
      expect(props.setLayerSelection).not.toHaveBeenCalled();
    });

    it('calls setLayerSelection once per click even when clicked multiple times', () => {
      const { props } = renderComponent();
      const item = screen.getByTestId(`dropdown-item-${mockActiveLayers[0].id}`);
      fireEvent.click(item);
      fireEvent.click(item);
      expect(props.setLayerSelection).toHaveBeenCalledTimes(2);
    });

    it('always passes the full layer object including period', () => {
      const { props } = renderComponent();
      fireEvent.click(screen.getByTestId(`dropdown-item-${mockActiveLayers[2].id}`));
      expect(props.setLayerSelection).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'GOES-East_ABI_Band2_Red_Visible_1km', period: 'subdaily' }),
      );
    });
  });
});
