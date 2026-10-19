/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import GifButton from './gif-button';
import googleTagManager from 'googleTagManager';
import { hasCustomPaletteInActiveProjection } from '../../modules/palettes/util';
import { hasNonDownloadableVisibleLayer, getNonDownloadableLayers } from '../../modules/image-download/util';
import { openCustomContent, onToggle } from '../../modules/modal/actions';

// Mock external dependencies
jest.mock('googleTagManager', () => ({
  pushEvent: jest.fn(),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <svg data-testid="fa-icon" />,
}));

jest.mock('reactstrap', () => ({
  UncontrolledTooltip: ({ children }) => <div data-testid="tooltip">{children}</div>,
}));

jest.mock('../../containers/gif', () => ({ onClose }) => (
  <div data-testid="gif-container">
    <button data-testid="close-gif-btn" onClick={onClose}>Close GIF</button>
  </div>
));

// Mock Redux Actions
jest.mock('../../modules/animation/actions', () => ({
  toggleComponentGifActive: jest.fn(() => ({ type: 'TOGGLE_GIF' })),
  changeStartAndEndDate: jest.fn(() => ({ type: 'CHANGE_DATES' })),
}));

jest.mock('../../modules/palettes/actions', () => ({
  clearCustoms: jest.fn(() => ({ type: 'CLEAR_CUSTOMS' })),
  refreshPalettes: jest.fn(() => ({ type: 'REFRESH_PALETTES' })),
}));

jest.mock('../../modules/map/actions', () => ({
  clearRotate: jest.fn(() => ({ type: 'CLEAR_ROTATE' })),
  refreshRotation: jest.fn(() => ({ type: 'REFRESH_ROTATION' })),
}));

jest.mock('../../modules/layers/actions', () => ({
  hideLayers: jest.fn(() => ({ type: 'HIDE_LAYERS' })),
  showLayers: jest.fn(() => ({ type: 'SHOW_LAYERS' })),
}));

jest.mock('../../modules/modal/actions', () => ({
  onToggle: jest.fn(() => ({ type: 'ON_TOGGLE' })),
  openCustomContent: jest.fn((id, payload) => ({ type: 'OPEN_CUSTOM_CONTENT', payload })),
}));

jest.mock('../../modules/palettes/util', () => ({
  hasCustomPaletteInActiveProjection: jest.fn(),
}));

jest.mock('../../modules/image-download/util', () => ({
  getNonDownloadableLayers: jest.fn(() => ['layer-1']),
  getNonDownloadableLayerWarning: jest.fn(() => 'Warning'),
  hasNonDownloadableVisibleLayer: jest.fn(),
}));

const mockStore = configureStore();

describe('GifButton Component', () => {
  let store;
  let initialState;

  beforeEach(() => {
    jest.clearAllMocks();
    hasCustomPaletteInActiveProjection.mockReturnValue(false);
    hasNonDownloadableVisibleLayer.mockReturnValue(false);
    initialState = {
      animation: { gifActive: false },
      palettes: { active: { 'layer-1': 'custom-palette' } },
      compare: { activeString: 'active' },
      map: { rotation: 0 },
      proj: {},
      layers: {
        active: {
          'layer-1': { id: 'layer-1', visible: true, type: 'wmts' },
        },
      },
    };
  });

  const renderComponent = (customProps = {}, customState = {}) => {
    store = mockStore({ ...initialState, ...customState });
    store.dispatch = jest.fn((action) => action);

    const defaultProps = {
      zeroDates: jest.fn(() => ({ startDate: '2023-01-01', endDate: '2023-01-02' })),
      onToggle: jest.fn(),
      numberOfFrames: 10,
      ...customProps,
    };

    return render(
      <Provider store={store}>
        <GifButton {...defaultProps} />
      </Provider>,
    );
  };

  it('renders the button correctly with default props', () => {
    renderComponent();
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).not.toHaveClass('disabled');
    expect(screen.getByTestId('tooltip')).toHaveTextContent('Create an animated GIF');
  });

  it('disables the button if numberOfFrames >= 40', () => {
    renderComponent({ numberOfFrames: 40 });
    const button = screen.getByRole('button');
    expect(button).toHaveClass('disabled');
  });

  it('does not dispatch events when button is disabled and clicked', async () => {
    renderComponent({ numberOfFrames: 45 });
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(googleTagManager.pushEvent).not.toHaveBeenCalled();
  });

  it('opens GIF flow and triggers tracking events on click', async () => {
    renderComponent({ numberOfFrames: 20 });
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      expect(googleTagManager.pushEvent).toHaveBeenCalledWith({
        event: 'GIF_create_animated_button',
      });
    });

    expect(store.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'CHANGE_DATES' }),
    );
    expect(store.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'TOGGLE_GIF' }),
    );
  });

  it('triggers notify for custom palettes and handles accept/cancel callbacks', async () => {
    hasCustomPaletteInActiveProjection.mockReturnValue(true);

    renderComponent();
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      expect(openCustomContent).toHaveBeenCalled();
    });

    const callArgs = openCustomContent.mock.calls[0];
    const { bodyComponentProps } = callArgs[1];

    // Test cancel callback
    bodyComponentProps.cancel();
    expect(onToggle).toHaveBeenCalled();

    // Test accept callback
    bodyComponentProps.accept();
    expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'CLEAR_CUSTOMS' }));
    // onToggle is called again during accept
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it('triggers notify for non-downloadable layers, using getNonDownloadableLayers logic', async () => {
    hasNonDownloadableVisibleLayer.mockReturnValue(true);

    renderComponent({}, { map: { rotation: 0 } });
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      // The openCustomContent should be called with image_download_notify_layers
      expect(openCustomContent).toHaveBeenCalledWith(
        'image_download_notify_layers',
        expect.any(Object),
      );
    });

    expect(getNonDownloadableLayers).toHaveBeenCalled();
  });
});
