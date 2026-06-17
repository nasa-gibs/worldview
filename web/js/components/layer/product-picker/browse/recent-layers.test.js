/* eslint-disable react/prop-types */
import '@testing-library/jest-dom';
import { render, fireEvent, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import RecentLayersList from './recent-layers';
import { clearRecentLayers as clearRecentLayersAction } from '../../../../modules/product-picker/actions';

jest.mock('../search/search-layers-list', () => ({ results }) => (
  <div data-testid="search-layer-list">
    {results && results.map((r) => <div key={r.id}>{r.id}</div>)}
  </div>
));

jest.mock('../search/layer-metadata-detail', () => ({ layer }) => (
  <div data-testid="layer-metadata-detail">
    {layer && layer.id}
  </div>
));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, id }) => <svg data-testid={`fa-icon-${icon}`} id={id} />,
}));

jest.mock('reactstrap', () => ({
  Button: ({ children, onClick, id }) => (
    <button onClick={onClick} id={id}>
      {children}
    </button>
  ),
  Tooltip: ({ children, toggle, isOpen }) => (
    <div data-testid="tooltip" onClick={toggle} data-is-open={isOpen}>
      {children}
    </div>
  ),
}));

jest.mock('../../../../modules/product-picker/actions', () => ({
  clearRecentLayers: jest.fn(() => ({ type: 'CLEAR_RECENT_LAYERS' })),
}));

jest.mock('../../../../modules/product-picker/util', () => ({
  recentLayerInfo: 'This is recent layer info text.',
}));

const mockStore = configureStore([]);

describe('RecentLayersList', () => {
  let store;

  beforeEach(() => {
    global.innerWidth = 1024;
    store = mockStore({
      screenSize: {
        isMobileDevice: false,
      },
      productPicker: {
        selectedLayer: null,
        showMobileFacets: false,
        recentLayers: [{ id: 'layer1' }, { id: 'layer2' }],
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <Provider store={store}>
        <RecentLayersList />
      </Provider>,
    );

    expect(screen.getByTestId('search-layer-list')).toBeInTheDocument();
  });

  it('renders the header with title and clear button on desktop when there are recent layers', () => {
    render(
      <Provider store={store}>
        <RecentLayersList />
      </Provider>,
    );

    expect(screen.getByText('Recently Used Layers')).toBeInTheDocument();
    expect(screen.getByText('Clear List')).toBeInTheDocument();
  });

  it('does not render the header on mobile', () => {
    const mobileStore = mockStore({
      screenSize: {
        isMobileDevice: true,
      },
      productPicker: {
        selectedLayer: null,
        showMobileFacets: false,
        recentLayers: [{ id: 'layer1' }],
      },
    });

    render(
      <Provider store={mobileStore}>
        <RecentLayersList />
      </Provider>,
    );

    expect(screen.queryByText('Recently Used Layers')).not.toBeInTheDocument();
    expect(screen.queryByText('Clear List')).not.toBeInTheDocument();
  });

  it('does not render the header when there are no recent layers', () => {
    const emptyStore = mockStore({
      screenSize: {
        isMobileDevice: false,
      },
      productPicker: {
        selectedLayer: null,
        showMobileFacets: false,
        recentLayers: [],
      },
    });

    render(
      <Provider store={emptyStore}>
        <RecentLayersList />
      </Provider>,
    );

    expect(screen.queryByText('Recently Used Layers')).not.toBeInTheDocument();
    expect(screen.queryByText('Clear List')).not.toBeInTheDocument();
  });

  it('calls clearRecentLayers action when Clear List button is clicked', () => {
    render(
      <Provider store={store}>
        <RecentLayersList />
      </Provider>,
    );

    const clearButton = screen.getByText('Clear List');
    fireEvent.click(clearButton);

    expect(clearRecentLayersAction).toHaveBeenCalled();
    expect(store.getActions()).toContainEqual({ type: 'CLEAR_RECENT_LAYERS' });
  });

  it('renders SearchLayerList with recent layers', () => {
    render(
      <Provider store={store}>
        <RecentLayersList />
      </Provider>,
    );

    const searchLayerList = screen.getByTestId('search-layer-list');
    expect(searchLayerList).toBeInTheDocument();
    expect(screen.getByText('layer1')).toBeInTheDocument();
    expect(screen.getByText('layer2')).toBeInTheDocument();
  });

  it('renders LayerMetadataDetail when selectedLayer exists and there are recent layers', () => {
    const storeWithSelectedLayer = mockStore({
      screenSize: {
        isMobileDevice: false,
      },
      productPicker: {
        selectedLayer: { id: 'selected-layer' },
        showMobileFacets: false,
        recentLayers: [{ id: 'layer1' }],
      },
    });

    render(
      <Provider store={storeWithSelectedLayer}>
        <RecentLayersList />
      </Provider>,
    );

    const metadataDetail = screen.getByTestId('layer-metadata-detail');
    expect(metadataDetail).toBeInTheDocument();
    expect(screen.getByText('selected-layer')).toBeInTheDocument();
  });

  it('does not render LayerMetadataDetail when selectedLayer is null and smallView is true', () => {
    global.innerWidth = 800;

    const smallViewStore = mockStore({
      screenSize: {
        isMobileDevice: false,
      },
      productPicker: {
        selectedLayer: null,
        showMobileFacets: false,
        recentLayers: [{ id: 'layer1' }],
      },
    });

    render(
      <Provider store={smallViewStore}>
        <RecentLayersList />
      </Provider>,
    );

    expect(screen.queryByTestId('layer-metadata-detail')).not.toBeInTheDocument();
  });

  it('renders LayerMetadataDetail when not smallView even without selectedLayer', () => {
    global.innerWidth = 1200;

    render(
      <Provider store={store}>
        <RecentLayersList />
      </Provider>,
    );

    const metadataDetail = screen.getByTestId('layer-metadata-detail');
    expect(metadataDetail).toBeInTheDocument();
  });

  it('does not render LayerMetadataDetail when there are no recent layers', () => {
    const emptyStore = mockStore({
      screenSize: {
        isMobileDevice: false,
      },
      productPicker: {
        selectedLayer: { id: 'selected-layer' },
        showMobileFacets: false,
        recentLayers: [],
      },
    });

    render(
      <Provider store={emptyStore}>
        <RecentLayersList />
      </Provider>,
    );

    expect(screen.queryByTestId('layer-metadata-detail')).not.toBeInTheDocument();
  });

  it('toggles tooltip visibility when tooltip is clicked', () => {
    render(
      <Provider store={store}>
        <RecentLayersList />
      </Provider>,
    );

    const tooltip = screen.getByTestId('tooltip');
    expect(tooltip).toHaveAttribute('data-is-open', 'false');

    fireEvent.click(tooltip);
    expect(tooltip).toHaveAttribute('data-is-open', 'true');

    fireEvent.click(tooltip);
    expect(tooltip).toHaveAttribute('data-is-open', 'false');
  });

  it('renders the tooltip with recentLayerInfo text', () => {
    render(
      <Provider store={store}>
        <RecentLayersList />
      </Provider>,
    );

    expect(screen.getByText('This is recent layer info text.')).toBeInTheDocument();
  });

  it('renders the question-circle icon', () => {
    render(
      <Provider store={store}>
        <RecentLayersList />
      </Provider>,
    );

    expect(screen.getByTestId('fa-icon-question-circle')).toBeInTheDocument();
  });
});
