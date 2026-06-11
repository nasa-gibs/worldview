/* eslint-disable react/prop-types */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('../../util/switch', () => {
  function MockSwitch({
    id, label, active, toggle,
  }) {
    return (
      <button
        type="button"
        data-testid={`switch-${id}`}
        data-active={active ? 'true' : 'false'}
        onClick={toggle}
      >
        {label}
      </button>
    );
  }
  return MockSwitch;
});
jest.mock('../../util/scrollbar', () => {
  function MockScrollbar({ children }) {
    return <div data-testid="scrollbar">{children}</div>;
  }
  return MockScrollbar;
});

import ClassificationToggle from './classification-toggle';

const legend = {
  id: 'test-legend',
  colors: ['ff0000', '00ff00', '0000ff'],
  tooltips: ['Red', 'Green', 'Blue'],
};

const palette = { disabled: [] };

const defaultProps = {
  legend,
  palette,
  toggle: jest.fn(),
  toggleAll: jest.fn(),
  height: 300,
};

const renderToggle = (overrides = {}) => {
  const props = { ...defaultProps, ...overrides };
  return render(
    <ClassificationToggle
      legend={props.legend}
      palette={props.palette}
      toggle={props.toggle}
      toggleAll={props.toggleAll}
      height={props.height}
    />,
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ClassificationToggle', () => {
  describe('layout', () => {
    it('renders the Disable/Enable heading', () => {
      renderToggle();
      expect(screen.getByText('Disable/Enable')).toBeInTheDocument();
    });

    it('renders the outer container', () => {
      const { container } = renderToggle();
      expect(container.querySelector('.layer-classification-toggle')).toBeInTheDocument();
    });

    it('renders the scrollbar', () => {
      renderToggle();
      expect(screen.getByTestId('scrollbar')).toBeInTheDocument();
    });
  });

  describe('color switches', () => {
    it('renders one switch per legend color', () => {
      renderToggle();
      const switches = screen.getAllByTestId(/^switch-test-legend/);
      expect(switches).toHaveLength(3);
    });

    it('renders a switch labeled with the tooltip for each color', () => {
      renderToggle();
      expect(screen.getByText('Red')).toBeInTheDocument();
      expect(screen.getByText('Green')).toBeInTheDocument();
      expect(screen.getByText('Blue')).toBeInTheDocument();
    });

    it('renders switches as active when color index not in palette.disabled', () => {
      renderToggle({ palette: { disabled: [] } });
      expect(screen.getByTestId('switch-test-legend0')).toHaveAttribute('data-active', 'true');
    });

    it('renders switch as inactive when index is in palette.disabled', () => {
      renderToggle({ palette: { disabled: [1] } });
      expect(screen.getByTestId('switch-test-legend1')).toHaveAttribute('data-active', 'false');
    });
  });

  describe('header "All" switch', () => {
    it('renders the "All" switch when toggleAll is provided', () => {
      renderToggle();
      expect(screen.getByTestId('switch-header-disable')).toBeInTheDocument();
    });

    it('does not render the "All" switch when toggleAll is not provided', () => {
      renderToggle({ toggleAll: undefined });
      expect(screen.queryByTestId('switch-header-disable')).not.toBeInTheDocument();
    });

    it('"All" switch starts inactive when palette.disabled length equals switchLength', () => {
      renderToggle({ palette: { disabled: [0, 1, 2] } });
      expect(screen.getByTestId('switch-header-disable')).toHaveAttribute('data-active', 'false');
    });

    it('"All" switch starts active when palette is not fully disabled', () => {
      renderToggle({ palette: { disabled: [] } });
      expect(screen.getByTestId('switch-header-disable')).toHaveAttribute('data-active', 'true');
    });

    it('calls toggleAll with all indices when "All" is clicked while active', () => {
      const toggleAll = jest.fn();
      renderToggle({ toggleAll, palette: { disabled: [] } });
      fireEvent.click(screen.getByTestId('switch-header-disable'));
      expect(toggleAll).toHaveBeenCalledWith([0, 1, 2]);
    });

    it('calls toggleAll with empty array when "All" is clicked while inactive (re-enable)', () => {
      const toggleAll = jest.fn();
      renderToggle({ toggleAll, palette: { disabled: [0, 1, 2] } });
      fireEvent.click(screen.getByTestId('switch-header-disable'));
      expect(toggleAll).toHaveBeenCalledWith([]);
    });
  });

  describe('individual toggle', () => {
    it('calls toggle with the correct index when a color switch is clicked', () => {
      const toggle = jest.fn();
      renderToggle({ toggle });
      fireEvent.click(screen.getByTestId('switch-test-legend1'));
      expect(toggle).toHaveBeenCalledWith(1);
    });

    it('calls toggle with index 0 for the first color', () => {
      const toggle = jest.fn();
      renderToggle({ toggle });
      fireEvent.click(screen.getByTestId('switch-test-legend0'));
      expect(toggle).toHaveBeenCalledWith(0);
    });
  });
});
