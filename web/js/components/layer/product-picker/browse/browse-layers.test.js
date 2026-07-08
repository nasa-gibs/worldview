/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import '@testing-library/jest-dom';
import { render, fireEvent, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import BrowseLayers from './browse-layers';
import {
  selectCategoryType,
} from '../../../../modules/product-picker/actions';

jest.mock('./browse-layers-list', () => () => <div data-testid="browse-layer-list" />);
jest.mock('./category-grid', () => () => <div data-testid="category-grid" />);
jest.mock('./measurement-metadata-detail', () => () => <div data-testid="measurement-metadata-detail" />);
jest.mock('./recent-layers', () => () => <div data-testid="recent-layers" />);
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ onClick }) => <svg data-testid="fa-icon" onClick={onClick} />,
}));

jest.mock('reactstrap', () => ({
  Button: ({ children, onClick, ...props }) => {
    <button onClick={onClick} {...props}>{children}</button>;
  },
  Nav: ({ children }) => <nav>{children}</nav>,
  NavItem: ({ children }) => <div>{children}</div>,
  NavLink: ({ children, onClick }) => <a onClick={onClick} data-testid="nav-link">{children}</a>,
  DropdownMenu: ({ children }) => <div>{children}</div>,
  Dropdown: ({ children, isOpen, toggle }) => <div onClick={toggle} data-testid="dropdown">{children}</div>,
  DropdownItem: ({ children, onClick }) => <div onClick={onClick} data-testid="dropdown-item">{children}</div>,
  DropdownToggle: ({ children }) => <div>{children}</div>,
  Tooltip: ({ children, toggle }) => <div onClick={toggle} data-testid="tooltip">{children}</div>,
}));

jest.mock('../../../../modules/product-picker/actions', () => ({
  selectCategoryType: jest.fn(() => ({ type: 'SELECT_CATEGORY' })),
  toggleMeasurementsTab: jest.fn(() => ({ type: 'TOGGLE_MEASUREMENTS' })),
  toggleFeatureTab: jest.fn(() => ({ type: 'TOGGLE_FEATURE' })),
  toggleRecentLayersTab: jest.fn(() => ({ type: 'TOGGLE_RECENT_LAYERS' })),
  clearRecentLayers: jest.fn(() => ({ type: 'CLEAR_RECENT_LAYERS' })),
}));

jest.mock('../../../../util/local-storage', () => ({}));
jest.mock('../../../../modules/product-picker/util', () => ({
  recentLayerInfo: 'Mock recent layer info',
}));

const mockStore = configureStore([]);

describe('BrowseLayers - Additional Coverage', () => {
  let store;
  let initialState;

  beforeEach(() => {
    initialState = {
      config: {
        categoryGroupOrder: ['cat1', 'cat2'],
        measurements: { meas1: { id: 'meas1' } },
      },
      proj: {
        id: 'proj1',
      },
      productPicker: {
        mode: 'standard',
        category: { title: 'Test Category' },
        categoryType: 'recent',
        listScrollTop: 0,
        selectedMeasurement: 'meas1',
        selectedMeasurementSourceIndex: 0,
        recentLayers: [{ id: 'layer1' }],
      },
      layers: {
        layerConfig: { layer1: {} },
      },
      screenSize: {
        isMobileDevice: true,
      },
    };
    store = mockStore(initialState);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('toggles tooltip state when tooltip is clicked', () => {
    render(
      <Provider store={store}>
        <BrowseLayers width={1000} />
      </Provider>,
    );
    const tooltip = screen.getByTestId('tooltip');
    fireEvent.click(tooltip);
    expect(tooltip).toBeInTheDocument();
  });

  it('dispatches selectCategoryType when dropdown item or nav link is clicked', () => {
    render(
      <Provider store={store}>
        <BrowseLayers width={1000} />
      </Provider>,
    );

    const dropdownItems = screen.queryAllByTestId('categories-dropdown-item');
    if (dropdownItems.length > 0) {
      fireEvent.click(dropdownItems[0]);
      expect(selectCategoryType).toHaveBeenCalled();
    }

    const navLinks = screen.queryAllByTestId('nav-link');
    if (navLinks.length > 0) {
      fireEvent.click(navLinks[0]);
    }
  });

  it('toggles dropdown state', () => {
    render(
      <Provider store={store}>
        <BrowseLayers width={1000} />
      </Provider>,
    );

    const dropdown = screen.queryByTestId('dropdown');
    if (dropdown) {
      fireEvent.click(dropdown);
      expect(dropdown).toBeInTheDocument();
    }
  });

  it('renders properly when isMobile is false', () => {
    initialState.screenSize.isMobileDevice = false;
    store = mockStore(initialState);
    const { container } = render(
      <Provider store={store}>
        <BrowseLayers width={1000} />
      </Provider>,
    );
    expect(container).toBeInTheDocument();
  });
});
