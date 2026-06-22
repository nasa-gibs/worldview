/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  const capture = {};
  const mockConnect = (msp, mdp) => {
    capture.msp = msp;
    capture.mdp = mdp;
    return (Component) => Component;
  };
  mockConnect.connectCapture = capture;
  return { ...actual, connect: mockConnect };
});

jest.mock('reactstrap', () => ({
  Nav: ({ children }) => <nav data-testid="nav">{children}</nav>,
  NavItem: ({ children }) => <div data-testid="nav-item">{children}</div>,
  NavLink: ({ children, className, onClick }) => (
    <a data-testid="nav-link" className={className} onClick={onClick}>{children}</a>
  ),
  TabContent: ({ children, activeTab }) => (
    <div data-testid="tab-content" data-active-tab={activeTab}>{children}</div>
  ),
  TabPane: ({ children, tabId }) => (
    <div data-testid={`tab-pane-${tabId}`}>{children}</div>
  ),
}));

jest.mock('./layers-container', () => function MockLayersContainer({ isActive, compareState, height }) {
  return (
    <div
      data-testid={`layers-container-${compareState}`}
      data-is-active={String(isActive)}
      data-height={height}
    />
  );
});

jest.mock('../../modules/compare/actions', () => ({
  toggleActiveCompareState: jest.fn(() => ({ type: 'TOGGLE_ACTIVE_COMPARE_STATE' })),
}));

jest.mock('../../modules/compare/selectors', () => ({
  getCompareDates: jest.fn(() => ({ dateA: '2021-01-01', dateB: '2021-06-01' })),
}));

jest.mock('../../components/util/monospace-date', () => function MockMonospaceDate({ date }) {
  return <span data-testid="monospace-date">{date}</span>;
});

import CompareCase from './compare';
import { toggleActiveCompareState as toggleActiveCompareStateAction } from '../../modules/compare/actions';
import { getCompareDates } from '../../modules/compare/selectors';

let capturedMapStateToProps;
let capturedMapDispatchToProps;

beforeAll(() => {
  const { connect } = jest.requireMock('react-redux');
  capturedMapStateToProps = connect.connectCapture.msp;
  capturedMapDispatchToProps = connect.connectCapture.mdp;
});

beforeEach(() => {
  jest.clearAllMocks();
  getCompareDates.mockReturnValue({ dateA: '2021-01-01', dateB: '2021-06-01' });
});

const defaultProps = {
  isActive: true,
  dateA: '2021-01-01',
  dateB: '2021-06-01',
  toggleActiveCompareState: jest.fn(),
  isCompareA: true,
  height: 400,
};

const renderComponent = (propOverrides = {}) => render(
  <CompareCase {...defaultProps} {...propOverrides} />,
);

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('CompareCase rendering', () => {
  it('renders without hidden class when isActive is true', () => {
    const { container } = renderComponent();
    expect(container.firstChild.className).toBe('');
  });

  it('renders with hidden class when isActive is false', () => {
    const { container } = renderComponent({ isActive: false });
    expect(container.firstChild.className).toContain('hidden');
  });

  it('renders two NavLinks', () => {
    const { getAllByTestId } = renderComponent();
    expect(getAllByTestId('nav-link')).toHaveLength(2);
  });

  it('renders two MonospaceDate components with correct dates', () => {
    const { getAllByTestId } = renderComponent();
    const dates = getAllByTestId('monospace-date');
    expect(dates[0].textContent).toBe('2021-01-01');
    expect(dates[1].textContent).toBe('2021-06-01');
  });

  it('renders two LayersContainers (one per tab pane)', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('layers-container-active')).toBeInTheDocument();
    expect(getByTestId('layers-container-activeB')).toBeInTheDocument();
  });

  it('passes height to both LayersContainers', () => {
    const { getByTestId } = renderComponent({ height: 600 });
    expect(getByTestId('layers-container-active')).toHaveAttribute('data-height', '600');
    expect(getByTestId('layers-container-activeB')).toHaveAttribute('data-height', '600');
  });
});

// ─── Tab active state ─────────────────────────────────────────────────────────

describe('CompareCase tab active state', () => {
  it('marks first NavLink active when isCompareA is true', () => {
    const { getAllByTestId } = renderComponent({ isCompareA: true });
    const [linkA, linkB] = getAllByTestId('nav-link');
    expect(linkA.className).toContain('active');
    expect(linkB.className).not.toContain('active');
  });

  it('marks second NavLink active when isCompareA is false', () => {
    const { getAllByTestId } = renderComponent({ isCompareA: false });
    const [linkA, linkB] = getAllByTestId('nav-link');
    expect(linkA.className).not.toContain('active');
    expect(linkB.className).toContain('active');
  });

  it('sets TabContent activeTab to "1" when isCompareA is true', () => {
    const { getByTestId } = renderComponent({ isCompareA: true });
    expect(getByTestId('tab-content')).toHaveAttribute('data-active-tab', '1');
  });

  it('sets TabContent activeTab to "2" when isCompareA is false', () => {
    const { getByTestId } = renderComponent({ isCompareA: false });
    expect(getByTestId('tab-content')).toHaveAttribute('data-active-tab', '2');
  });

  it('sets LayersContainer active=true for "active" compareState when isCompareA is true', () => {
    const { getByTestId } = renderComponent({ isCompareA: true });
    expect(getByTestId('layers-container-active')).toHaveAttribute('data-is-active', 'true');
    expect(getByTestId('layers-container-activeB')).toHaveAttribute('data-is-active', 'false');
  });

  it('sets LayersContainer active=true for "activeB" compareState when isCompareA is false', () => {
    const { getByTestId } = renderComponent({ isCompareA: false });
    expect(getByTestId('layers-container-active')).toHaveAttribute('data-is-active', 'false');
    expect(getByTestId('layers-container-activeB')).toHaveAttribute('data-is-active', 'true');
  });

  it('first NavLink has first-tab class', () => {
    const { getAllByTestId } = renderComponent();
    expect(getAllByTestId('nav-link')[0].className).toContain('first-tab');
  });

  it('second NavLink has second-tab class', () => {
    const { getAllByTestId } = renderComponent();
    expect(getAllByTestId('nav-link')[1].className).toContain('second-tab');
  });
});

// ─── Interactions ─────────────────────────────────────────────────────────────

describe('CompareCase interactions', () => {
  it('calls toggleActiveCompareState when first NavLink is clicked', () => {
    const toggleActiveCompareState = jest.fn();
    const { getAllByTestId } = renderComponent({ toggleActiveCompareState });
    fireEvent.click(getAllByTestId('nav-link')[0]);
    expect(toggleActiveCompareState).toHaveBeenCalledTimes(1);
  });

  it('calls toggleActiveCompareState when second NavLink is clicked', () => {
    const toggleActiveCompareState = jest.fn();
    const { getAllByTestId } = renderComponent({ toggleActiveCompareState });
    fireEvent.click(getAllByTestId('nav-link')[1]);
    expect(toggleActiveCompareState).toHaveBeenCalledTimes(1);
  });
});

// ─── mapStateToProps ──────────────────────────────────────────────────────────

describe('mapStateToProps', () => {
  const makeState = (overrides = {}) => ({
    compare: { isCompareA: true, active: true },
    screenSize: { isMobileDevice: false },
    ...overrides,
  });

  it('maps isCompareA from compare.isCompareA', () => {
    const state = makeState({ compare: { isCompareA: false, active: true } });
    const result = capturedMapStateToProps(state);
    expect(result.isCompareA).toBe(false);
  });

  it('maps isActive from compare.active', () => {
    const state = makeState({ compare: { isCompareA: true, active: false } });
    const result = capturedMapStateToProps(state);
    expect(result.isActive).toBe(false);
  });

  it('maps isMobile from screenSize.isMobileDevice', () => {
    const state = makeState({ screenSize: { isMobileDevice: true } });
    const result = capturedMapStateToProps(state);
    expect(result.isMobile).toBe(true);
  });

  it('maps dateA and dateB from getCompareDates', () => {
    getCompareDates.mockReturnValue({ dateA: '2022-03-01', dateB: '2022-09-15' });
    const state = makeState();
    const result = capturedMapStateToProps(state);
    expect(result.dateA).toBe('2022-03-01');
    expect(result.dateB).toBe('2022-09-15');
    expect(getCompareDates).toHaveBeenCalledWith(state);
  });
});

// ─── mapDispatchToProps ───────────────────────────────────────────────────────

describe('mapDispatchToProps', () => {
  it('toggleActiveCompareState dispatches the correct action', () => {
    const dispatch = jest.fn();
    const { toggleActiveCompareState } = capturedMapDispatchToProps(dispatch);
    toggleActiveCompareState();
    expect(toggleActiveCompareStateAction).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_ACTIVE_COMPARE_STATE' });
  });
});
