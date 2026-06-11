/* eslint-disable react/prop-types */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; // ← adds toBeInTheDocument, toHaveClass, toHaveStyle, toHaveAttribute, etc.
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import ConsoleTest from './dev-console-test';

// ─── Mock Dependencies ────────────────────────────────────────────────────────

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ id, className }) => (
    <span id={id} className={className} data-testid="font-awesome-icon" />
  ),
}));

jest.mock('reactstrap', () => ({
  Button: ({ children, onClick, style }) => (
    <button
      type="button"
      onClick={onClick}
      style={style}
      data-testid="console-test-button"
    >
      {children}
    </button>
  ),
  UncontrolledTooltip: ({ children, id, target, placement }) => (
    <div
      data-testid="uncontrolled-tooltip"
      data-id={id}
      data-target={target}
      data-placement={placement}
    >
      {children}
    </div>
  ),
}));

// ─── Shared Fixtures ──────────────────────────────────────────────────────────

const mockStore = configureMockStore();

const mockSelectedMap = { id: 'mock-selected-map' };

function buildStore(selectedOverride = mockSelectedMap) {
  return mockStore({
    map: {
      ui: {
        selected: selectedOverride,
      },
    },
  });
}

function renderComponent(storeOverride) {
  const store = storeOverride ?? buildStore();
  const utils = render(
    <Provider store={store}>
      <ConsoleTest />
    </Provider>,
  );
  return { ...utils, store };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ConsoleTest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('renders the "Console Test Mode" heading', () => {
      renderComponent();
      expect(screen.getByText('Console Test Mode')).toBeInTheDocument();
    });

    it('renders the heading as an h5 element', () => {
      renderComponent();
      const heading = screen.getByText('Console Test Mode');
      expect(heading.tagName).toBe('H5');
    });

    it('renders the info icon', () => {
      renderComponent();
      expect(screen.getByTestId('font-awesome-icon')).toBeInTheDocument();
    });

    it('renders the info icon with the correct id', () => {
      renderComponent();
      expect(document.getElementById('console-test-info-icon')).toBeInTheDocument();
    });

    it('renders the "Console test" button', () => {
      renderComponent();
      expect(screen.getByTestId('console-test-button')).toBeInTheDocument();
    });

    it('renders the button with the correct label', () => {
      renderComponent();
      expect(screen.getByText('Console test')).toBeInTheDocument();
    });

    it('renders the button with the correct background color', () => {
      renderComponent();
      const button = screen.getByTestId('console-test-button');
      expect(button).toHaveStyle({ backgroundColor: '#d54e21' });
    });

    it('renders the tooltip', () => {
      renderComponent();
      expect(screen.getByTestId('uncontrolled-tooltip')).toBeInTheDocument();
    });

    it('renders the tooltip with the correct target', () => {
      renderComponent();
      const tooltip = screen.getByTestId('uncontrolled-tooltip');
      expect(tooltip).toHaveAttribute('data-target', 'console-test-info-icon');
    });

    it('renders the tooltip with the correct id', () => {
      renderComponent();
      const tooltip = screen.getByTestId('uncontrolled-tooltip');
      expect(tooltip).toHaveAttribute('data-id', 'console-test-tooltip');
    });

    it('renders the tooltip with placement "right"', () => {
      renderComponent();
      const tooltip = screen.getByTestId('uncontrolled-tooltip');
      expect(tooltip).toHaveAttribute('data-placement', 'right');
    });

    it('renders the tooltip with the correct content', () => {
      renderComponent();
      expect(
        screen.getByText('Console any response. See the ConsoleTest component'),
      ).toBeInTheDocument();
    });

    it('renders the horizontal divider span', () => {
      const { container } = renderComponent();
      const divider = container.querySelector('span.border-top');
      expect(divider).toBeInTheDocument();
    });
  });

  // ── Layout / CSS classes ───────────────────────────────────────────────────

  describe('Layout and CSS classes', () => {
    it('renders the outer wrapper with correct flex classes', () => {
      const { container } = renderComponent();
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass(
        'd-flex',
        'flex-column',
        'justify-content-center',
        'align-items-center',
        'w-100',
        'mt-3',
      );
    });

    it('renders the inner header row with correct flex classes', () => {
      const { container } = renderComponent();
      const innerRow = container.querySelector('.d-flex.flex-row');
      expect(innerRow).toBeInTheDocument();
      expect(innerRow).toHaveClass('justify-content-center', 'align-items-center');
    });

    it('renders the heading with correct classes', () => {
      renderComponent();
      const heading = screen.getByText('Console Test Mode');
      expect(heading).toHaveClass('h5', 'fw-bold', 'd-inline-block', 'me-1');
    });
  });

  // ── useSelector ───────────────────────────────────────────────────────────

  describe('useSelector', () => {
    it('reads state.map.ui.selected from the Redux store', () => {
      const customSelected = { id: 'custom-map' };
      const store = buildStore(customSelected);
      renderComponent(store);
      fireEvent.click(screen.getByTestId('console-test-button'));
      expect(console.log).toHaveBeenCalledWith(customSelected);
    });

    it('reads null when state.map.ui.selected is null', () => {
      const store = buildStore(null);
      renderComponent(store);
      fireEvent.click(screen.getByTestId('console-test-button'));
      expect(console.log).toHaveBeenCalledWith(null);
    });

    it('reads an object when state.map.ui.selected is an object', () => {
      const selected = { proj: 'geographic', zoom: 3 };
      const store = buildStore(selected);
      renderComponent(store);
      fireEvent.click(screen.getByTestId('console-test-button'));
      expect(console.log).toHaveBeenCalledWith(selected);
    });
  });

  // ── consoleResponse / button click ────────────────────────────────────────

  describe('consoleResponse (button click)', () => {
    it('calls console.log when the button is clicked', () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('console-test-button'));
      expect(console.log).toHaveBeenCalledTimes(1);
    });

    it('logs the map value from the Redux store', () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('console-test-button'));
      expect(console.log).toHaveBeenCalledWith(mockSelectedMap);
    });

    it('does NOT call console.log before the button is clicked', () => {
      renderComponent();
      expect(console.log).not.toHaveBeenCalled();
    });

    it('calls console.log once per click', () => {
      renderComponent();
      const button = screen.getByTestId('console-test-button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      expect(console.log).toHaveBeenCalledTimes(3);
    });
  });
});
