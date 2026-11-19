/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

jest.mock('./util/util', () => ({
  events: { trigger: jest.fn() },
  loadScripts: jest.fn(),
  wrap: jest.fn((fn) => () => fn()),
}));
jest.mock('./util/customHooks', () => jest.fn(() => undefined));
jest.mock('./util/constants', () => ({ STARTUP: 'STARTUP' }));
jest.mock('./brand', () => ({
  release: jest.fn(() => false),
  NAME: 'TestApp',
  VERSION: '1.0',
  BUILD_TIMESTAMP: '2024-01-01',
}));
jest.mock('./containers/map-interactions/map-interactions', () => () => <div data-testid="map-interactions" />);
jest.mock('./containers/toolbar', () => () => <div data-testid="toolbar" />);
jest.mock('./containers/sidebar/sidebar', () => () => <div data-testid="sidebar" />);
jest.mock('./containers/modal', () => () => <div data-testid="modal" />);
jest.mock('./modules/modal/actions', () => ({ openCustomContent: jest.fn(() => ({ type: 'OPEN_CUSTOM_CONTENT' })) }));
jest.mock('./components/location-search/location-search', () => () => <div data-testid="location-search" />);
jest.mock('./containers/embed', () => () => <div data-testid="embed" />);
jest.mock('./components/measure-tool/measure-button', () => () => <div data-testid="measure-button" />);
jest.mock('./containers/alertDropdown', () => () => <div data-testid="alert-dropdown" />);
jest.mock('./components/map/loading-spinner', () => () => <div data-testid="loading-spinner" />);
jest.mock('./font-awesome-library', () => {});
jest.mock('./containers/tour', () => () => <div data-testid="tour" />);
jest.mock('./containers/timeline/timeline', () => () => <div data-testid="timeline" />);
jest.mock('./containers/animation-widget/animation-widget', () => () => <div data-testid="animation-widget" />);
jest.mock('./containers/error-boundary', () => ({ children }) => <div>{children}</div>);
jest.mock('./components/util/debug', () => () => <div data-testid="debug" />);
jest.mock('./modules/key-press/actions', () => jest.fn(() => ({ type: 'KEY_PRESS' })));
jest.mock('./modules/screen-size/actions', () => jest.fn(() => ({ type: 'SET_SCREEN_INFO' })));
jest.mock('./modules/notifications/util', () => ({ addToLocalStorage: jest.fn() }));
jest.mock('./containers/notifications', () => () => <div data-testid="notifications" />);
jest.mock('./modules/notifications/actions', () => ({ outageNotificationsSeenAction: jest.fn(() => ({ type: 'OUTAGE_SEEN' })) }));
jest.mock('bootstrap/dist/css/bootstrap.min.css', () => {});
jest.mock('ol/ol.css', () => {});
jest.mock('simplebar/dist/simplebar.min.css', () => {});
jest.mock('react-image-crop/dist/ReactCrop.css', () => {});
jest.mock('react-resizable/css/styles.css', () => {});
jest.mock('../scss/index.scss', () => {});
jest.mock('@elastic/react-search-ui-views/lib/styles/styles.css', () => {});

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    connect: () => (Component) => Component,
  };
});

import util from './util/util';
import usePrevious from './util/customHooks';
import Brand from './brand';
import App from './app';

const defaultProps = {
  isAnimationWidgetActive: false,
  isEmbedModeActive: false,
  isMobile: false,
  isTourActive: false,
  kioskModeEnabled: false,
  e2eModeEnabled: false,
  numberOutagesUnseen: 0,
  locationKey: 'test-key',
  modalId: 'test-modal',
  notifications: { object: { outages: [] } },
  parameters: {},
  config: { scripts: null },
  hideNotificationsPopup: false,
  keyPressAction: jest.fn(),
  setScreenInfoAction: jest.fn(),
  notificationClick: jest.fn(),
};

const renderApp = (propOverrides = {}) => render(<App {...defaultProps} {...propOverrides} />);

describe('App component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePrevious.mockReturnValue(undefined);
    util.wrap.mockImplementation((fn) => () => fn());
  });

  describe('rendering', () => {
    it('renders without crashing', () => {
      const { getByTestId } = renderApp();
      expect(getByTestId('toolbar')).toBeInTheDocument();
    });

    it('renders wv-content div with correct id', () => {
      const { container } = renderApp();
      expect(container.querySelector('#wv-content')).toBeInTheDocument();
    });

    it('applies embed-mode class when isEmbedModeActive is true', () => {
      const { container } = renderApp({ isEmbedModeActive: true });
      expect(container.querySelector('#wv-content').className).toContain('embed-mode');
    });

    it('does not apply embed-mode class when isEmbedModeActive is false', () => {
      const { container } = renderApp();
      expect(container.querySelector('#wv-content').className).not.toContain('embed-mode');
    });

    it('renders core components always', () => {
      const { getByTestId } = renderApp();
      expect(getByTestId('loading-spinner')).toBeInTheDocument();
      expect(getByTestId('toolbar')).toBeInTheDocument();
      expect(getByTestId('map-interactions')).toBeInTheDocument();
      expect(getByTestId('sidebar')).toBeInTheDocument();
      expect(getByTestId('timeline')).toBeInTheDocument();
      expect(getByTestId('measure-button')).toBeInTheDocument();
      expect(getByTestId('embed')).toBeInTheDocument();
      expect(getByTestId('modal')).toBeInTheDocument();
    });

    it('renders LocationSearch when not mobile and not embed mode', () => {
      const { getByTestId } = renderApp({ isMobile: false, isEmbedModeActive: false });
      expect(getByTestId('location-search')).toBeInTheDocument();
    });

    it('does not render LocationSearch when isMobile is true', () => {
      const { queryByTestId } = renderApp({ isMobile: true });
      expect(queryByTestId('location-search')).not.toBeInTheDocument();
    });

    it('does not render LocationSearch when isEmbedModeActive is true', () => {
      const { queryByTestId } = renderApp({ isEmbedModeActive: true });
      expect(queryByTestId('location-search')).not.toBeInTheDocument();
    });

    it('renders AnimationWidget when isAnimationWidgetActive is true', () => {
      const { getByTestId } = renderApp({ isAnimationWidgetActive: true });
      expect(getByTestId('animation-widget')).toBeInTheDocument();
    });

    it('does not render AnimationWidget when isAnimationWidgetActive is false', () => {
      const { queryByTestId } = renderApp({ isAnimationWidgetActive: false });
      expect(queryByTestId('animation-widget')).not.toBeInTheDocument();
    });

    it('uses locationKey as AnimationWidget key when provided', () => {
      const { getByTestId } = renderApp({ isAnimationWidgetActive: true, locationKey: 'my-key' });
      expect(getByTestId('animation-widget')).toBeInTheDocument();
    });

    it('uses fallback key "2" for AnimationWidget when locationKey is null', () => {
      const { getByTestId } = renderApp({ isAnimationWidgetActive: true, locationKey: null });
      expect(getByTestId('animation-widget')).toBeInTheDocument();
    });

    it('renders Tour when isTourActive, no unseen outages, not mobile', () => {
      const { getByTestId } = renderApp({
        isTourActive: true,
        numberOutagesUnseen: 0,
        isMobile: false,
        isEmbedModeActive: false,
      });
      expect(getByTestId('tour')).toBeInTheDocument();
    });

    it('renders Tour when isTourActive and hideNotificationsPopup is true', () => {
      const { getByTestId } = renderApp({
        isTourActive: true,
        numberOutagesUnseen: 5,
        hideNotificationsPopup: true,
        isMobile: false,
        isEmbedModeActive: false,
      });
      expect(getByTestId('tour')).toBeInTheDocument();
    });

    it('does not render Tour when isTourActive is false', () => {
      const { queryByTestId } = renderApp({ isTourActive: false });
      expect(queryByTestId('tour')).not.toBeInTheDocument();
    });

    it('does not render Tour when isTourActive but unseen outages > 0 and not hideNotificationsPopup', () => {
      const { queryByTestId } = renderApp({
        isTourActive: true,
        numberOutagesUnseen: 3,
        hideNotificationsPopup: false,
        isMobile: false,
        isEmbedModeActive: false,
      });
      expect(queryByTestId('tour')).not.toBeInTheDocument();
    });

    it('does not render Tour when isTourActive but isMobile and not embed mode', () => {
      const { queryByTestId } = renderApp({
        isTourActive: true,
        numberOutagesUnseen: 0,
        isMobile: true,
        isEmbedModeActive: false,
      });
      expect(queryByTestId('tour')).not.toBeInTheDocument();
    });

    it('renders Tour when isTourActive, isMobile, and isEmbedModeActive', () => {
      const { getByTestId } = renderApp({
        isTourActive: true,
        numberOutagesUnseen: 0,
        isMobile: true,
        isEmbedModeActive: true,
      });
      expect(getByTestId('tour')).toBeInTheDocument();
    });

    it('renders static div elements', () => {
      const { container } = renderApp();
      expect(container.querySelector('#layer-modal')).toBeInTheDocument();
      expect(container.querySelector('#layer-settings-modal')).toBeInTheDocument();
      expect(container.querySelector('#eventsHolder')).toBeInTheDocument();
      expect(container.querySelector('#imagedownload')).toBeInTheDocument();
    });
  });

  describe('startup useEffect', () => {
    it('sets config.parameters on mount', () => {
      const config = { scripts: null };
      const parameters = { foo: 'bar' };
      renderApp({ config, parameters });
      expect(config.parameters).toEqual(parameters);
    });

    it('calls loadScripts when config.scripts is defined', () => {
      const scripts = ['script1.js', 'script2.js'];
      renderApp({ config: { scripts } });
      expect(util.loadScripts).toHaveBeenCalledWith(scripts);
    });

    it('does not call loadScripts when config.scripts is null', () => {
      renderApp({ config: { scripts: null } });
      expect(util.loadScripts).not.toHaveBeenCalled();
    });

    it('logs development warning when Brand.release() is false', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      Brand.release.mockReturnValue(false);
      renderApp();
      expect(warnSpy).toHaveBeenCalledWith('Development version');
      warnSpy.mockRestore();
    });

    it('logs version info when Brand.release() is true', () => {
      const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
      Brand.release.mockReturnValue(true);
      renderApp();
      expect(infoSpy).toHaveBeenCalled();
      infoSpy.mockRestore();
    });

    it('calls setScreenInfoAction on mount', () => {
      const setScreenInfoAction = jest.fn();
      renderApp({ setScreenInfoAction });
      expect(setScreenInfoAction).toHaveBeenCalled();
    });

    it('calls setScreenInfoAction on window resize', () => {
      const setScreenInfoAction = jest.fn();
      renderApp({ setScreenInfoAction });
      setScreenInfoAction.mockClear();
      act(() => { window.dispatchEvent(new Event('resize')); });
      expect(setScreenInfoAction).toHaveBeenCalled();
    });

    it('calls setScreenInfoAction on orientationchange', () => {
      const setScreenInfoAction = jest.fn();
      renderApp({ setScreenInfoAction });
      setScreenInfoAction.mockClear();
      act(() => { window.dispatchEvent(new Event('orientationchange')); });
      expect(setScreenInfoAction).toHaveBeenCalled();
    });

    it('triggers STARTUP event on mount', () => {
      renderApp();
      expect(util.events.trigger).toHaveBeenCalledWith('STARTUP');
    });

    it('adds resize and orientationchange listeners on mount', () => {
      const addEventSpy = jest.spyOn(window, 'addEventListener');
      renderApp();
      const eventNames = addEventSpy.mock.calls.map(([name]) => name);
      expect(eventNames).toContain('resize');
      expect(eventNames).toContain('orientationchange');
      addEventSpy.mockRestore();
    });
  });

  describe('keydown useEffect', () => {
    it('adds keydown listener on mount', () => {
      const addEventSpy = jest.spyOn(document, 'addEventListener');
      renderApp();
      expect(addEventSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      addEventSpy.mockRestore();
    });

    it('removes keydown listener on unmount', () => {
      const removeEventSpy = jest.spyOn(document, 'removeEventListener');
      const { unmount } = renderApp();
      unmount();
      expect(removeEventSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      removeEventSpy.mockRestore();
    });

    it('removes resize listener on unmount', () => {
      const removeEventSpy = jest.spyOn(window, 'removeEventListener');
      const { unmount } = renderApp();
      unmount();
      expect(removeEventSpy.mock.calls.map(([name]) => name)).toContain('resize');
      removeEventSpy.mockRestore();
    });

    it('removes orientationchange listener on unmount', () => {
      const removeEventSpy = jest.spyOn(window, 'removeEventListener');
      const { unmount } = renderApp();
      unmount();
      expect(removeEventSpy.mock.calls.map(([name]) => name)).toContain('orientationchange');
      removeEventSpy.mockRestore();
    });

    it('calls keyPressAction on keydown event', () => {
      const keyPressAction = jest.fn();
      renderApp({ keyPressAction });
      act(() => {
        const event = new KeyboardEvent('keydown', { keyCode: 65, shiftKey: false, ctrlKey: false, bubbles: true });
        Object.defineProperty(event, 'srcElement', { value: { nodeName: 'BODY' } });
        document.dispatchEvent(event);
      });
      expect(keyPressAction).toHaveBeenCalled();
    });

    it('passes ctrlKey=true when ctrlKey is pressed', () => {
      const keyPressAction = jest.fn();
      renderApp({ keyPressAction });
      act(() => {
        const event = new KeyboardEvent('keydown', { keyCode: 65, shiftKey: false, ctrlKey: true, bubbles: true });
        Object.defineProperty(event, 'srcElement', { value: { nodeName: 'BODY' } });
        document.dispatchEvent(event);
      });
      expect(keyPressAction).toHaveBeenCalledWith(65, false, true, false);
    });

    it('passes ctrlOrCmdKey=true when metaKey is pressed', () => {
      const keyPressAction = jest.fn();
      renderApp({ keyPressAction });
      act(() => {
        const event = new KeyboardEvent('keydown', { keyCode: 65, shiftKey: false, metaKey: true, bubbles: true });
        Object.defineProperty(event, 'srcElement', { value: { nodeName: 'BODY' } });
        document.dispatchEvent(event);
      });
      expect(keyPressAction).toHaveBeenCalledWith(65, false, true, false);
    });

    it('passes isInput=true when srcElement is INPUT', () => {
      const keyPressAction = jest.fn();
      renderApp({ keyPressAction });
      act(() => {
        const event = new KeyboardEvent('keydown', { keyCode: 65, bubbles: true });
        Object.defineProperty(event, 'srcElement', { value: { nodeName: 'INPUT' } });
        document.dispatchEvent(event);
      });
      expect(keyPressAction).toHaveBeenCalledWith(65, false, false, true);
    });
  });

  describe('notification useEffect', () => {
    it('calls notificationClick when numberOutagesUnseen increases and conditions met', () => {
      usePrevious.mockReturnValue(0);
      const notificationClick = jest.fn();
      const notifications = { object: { outages: [{ id: 1 }] } };
      renderApp({
        numberOutagesUnseen: 3,
        kioskModeEnabled: false,
        e2eModeEnabled: false,
        hideNotificationsPopup: false,
        notifications,
        notificationClick,
      });
      expect(notificationClick).toHaveBeenCalledWith(notifications, 3);
    });

    it('does not call notificationClick when kioskModeEnabled is true', () => {
      usePrevious.mockReturnValue(0);
      const notificationClick = jest.fn();
      renderApp({ numberOutagesUnseen: 3, kioskModeEnabled: true, notificationClick });
      expect(notificationClick).not.toHaveBeenCalled();
    });

    it('does not call notificationClick when e2eModeEnabled is true', () => {
      usePrevious.mockReturnValue(0);
      const notificationClick = jest.fn();
      renderApp({ numberOutagesUnseen: 3, e2eModeEnabled: true, notificationClick });
      expect(notificationClick).not.toHaveBeenCalled();
    });

    it('does not call notificationClick when hideNotificationsPopup is true', () => {
      usePrevious.mockReturnValue(0);
      const notificationClick = jest.fn();
      renderApp({ numberOutagesUnseen: 3, hideNotificationsPopup: true, notificationClick });
      expect(notificationClick).not.toHaveBeenCalled();
    });

    it('does not call notificationClick when numberOutagesUnseen is 0', () => {
      usePrevious.mockReturnValue(0);
      const notificationClick = jest.fn();
      renderApp({ numberOutagesUnseen: 0, notificationClick });
      expect(notificationClick).not.toHaveBeenCalled();
    });

    it('does not call notificationClick when numberOutagesUnseen is unchanged', () => {
      usePrevious.mockReturnValue(3);
      const notificationClick = jest.fn();
      renderApp({ numberOutagesUnseen: 3, notificationClick });
      expect(notificationClick).not.toHaveBeenCalled();
    });
  });

  describe('setVhCSSProperty', () => {
    it('sets --vh CSS property on mount', () => {
      const setPropertySpy = jest.spyOn(document.documentElement.style, 'setProperty');
      renderApp();
      expect(setPropertySpy).toHaveBeenCalledWith('--vh', expect.stringContaining('px'));
      setPropertySpy.mockRestore();
    });

    it('updates --vh on window resize', () => {
      const setPropertySpy = jest.spyOn(document.documentElement.style, 'setProperty');
      renderApp();
      act(() => { window.dispatchEvent(new Event('resize')); });
      expect(setPropertySpy).toHaveBeenCalledWith('--vh', expect.stringContaining('px'));
      setPropertySpy.mockRestore();
    });

    it('updates --vh on orientationchange', () => {
      const setPropertySpy = jest.spyOn(document.documentElement.style, 'setProperty');
      renderApp();
      act(() => { window.dispatchEvent(new Event('orientationchange')); });
      expect(setPropertySpy).toHaveBeenCalledWith('--vh', expect.stringContaining('px'));
      setPropertySpy.mockRestore();
    });
  });
});

describe('mapStateToProps', () => {
  const mockState = {
    notifications: {
      numberOutagesUnseen: 2,
      numberUnseen: 1,
      type: 'outage',
      object: { outages: [] },
    },
    ui: { eic: null, isKioskModeActive: false, isE2eModeActive: false },
    animation: { isActive: true },
    embed: { isEmbedModeActive: false },
    screenSize: { isMobileDevice: true },
    tour: { active: true },
    config: { scripts: null },
    parameters: { foo: 'bar' },
    location: { key: 'abc' },
    modal: { id: 'modal-1' },
  };

  const buildConnected = (mapState, state) => {
    const { connect: actualConnect } = jest.requireActual('react-redux');
    let capturedProps = null;
    const Capture = (p) => { capturedProps = p; return null; };
    const Connected = actualConnect(mapState)(Capture);
    const store = configureStore([])(state || mockState);
    render(<Provider store={store}><Connected /></Provider>);
    return capturedProps;
  };

  const fullMapState = (state) => {
    const { notifications } = state;
    const {
      numberOutagesUnseen, numberUnseen, type, object,
    } = notifications;
    const kioskModeEnabled = (state.ui.eic !== null && state.ui.eic !== '') || state.ui.isKioskModeActive;
    const e2eModeEnabled = state.ui.isE2eModeActive;
    const githubActionsRunning = process.env.GITHUB_ACTIONS === 'true';
    const locallyHosted = /localhost/.test(window.location.href);
    return {
      state,
      kioskModeEnabled,
      e2eModeEnabled,
      isAnimationWidgetActive: state.animation.isActive,
      isEmbedModeActive: state.embed.isEmbedModeActive,
      isMobile: state.screenSize.isMobileDevice,
      isTourActive: state.tour.active,
      notifications,
      numberOutagesUnseen,
      numberUnseen,
      object,
      tour: state.tour,
      type,
      config: state.config,
      parameters: state.parameters,
      locationKey: state.location.key,
      modalId: state.modal.id,
      hideNotificationsPopup: githubActionsRunning || locallyHosted,
    };
  };

  it('maps isAnimationWidgetActive from state', () => {
    expect(buildConnected(fullMapState).isAnimationWidgetActive).toBe(true);
  });

  it('maps isMobile from state', () => {
    expect(buildConnected(fullMapState).isMobile).toBe(true);
  });

  it('maps isTourActive from state', () => {
    expect(buildConnected(fullMapState).isTourActive).toBe(true);
  });

  it('maps numberOutagesUnseen from state', () => {
    expect(buildConnected(fullMapState).numberOutagesUnseen).toBe(2);
  });

  it('maps numberUnseen from state', () => {
    expect(buildConnected(fullMapState).numberUnseen).toBe(1);
  });

  it('maps type from state', () => {
    expect(buildConnected(fullMapState).type).toBe('outage');
  });

  it('maps object from state', () => {
    expect(buildConnected(fullMapState).object).toEqual({ outages: [] });
  });

  it('maps locationKey from state', () => {
    expect(buildConnected(fullMapState).locationKey).toBe('abc');
  });

  it('maps modalId from state', () => {
    expect(buildConnected(fullMapState).modalId).toBe('modal-1');
  });

  it('maps config from state', () => {
    expect(buildConnected(fullMapState).config).toEqual({ scripts: null });
  });

  it('maps parameters from state', () => {
    expect(buildConnected(fullMapState).parameters).toEqual({ foo: 'bar' });
  });

  it('maps isEmbedModeActive from state', () => {
    expect(buildConnected(fullMapState).isEmbedModeActive).toBe(false);
  });

  it('maps e2eModeEnabled from state', () => {
    expect(buildConnected(fullMapState).e2eModeEnabled).toBe(false);
  });

  it('sets kioskModeEnabled false when eic is null and isKioskModeActive is false', () => {
    expect(buildConnected(fullMapState).kioskModeEnabled).toBe(false);
  });

  it('sets kioskModeEnabled true when eic is set', () => {
    const state = { ...mockState, ui: { eic: 'some-eic', isKioskModeActive: false, isE2eModeActive: false } };
    expect(buildConnected(fullMapState, state).kioskModeEnabled).toBe(true);
  });

  it('sets kioskModeEnabled false when eic is empty string', () => {
    const state = { ...mockState, ui: { eic: '', isKioskModeActive: false, isE2eModeActive: false } };
    expect(buildConnected(fullMapState, state).kioskModeEnabled).toBe(false);
  });

  it('sets kioskModeEnabled true when isKioskModeActive is true', () => {
    const state = {
      ...mockState,
      ui: {
        eic: null, isKioskModeActive: true, isE2eModeActive: false,
      },
    };
    expect(buildConnected(fullMapState, state).kioskModeEnabled).toBe(true);
  });

  it('sets hideNotificationsPopup true when GITHUB_ACTIONS is true', () => {
    process.env.GITHUB_ACTIONS = 'true';
    expect(buildConnected(fullMapState).hideNotificationsPopup).toBe(true);
    delete process.env.GITHUB_ACTIONS;
  });

  it('sets hideNotificationsPopup true when URL contains localhost', () => {
    delete window.location;
    window.location = { href: 'http://localhost:3000' };
    expect(buildConnected(fullMapState).hideNotificationsPopup).toBe(true);
  });
});

describe('mapDispatchToProps', () => {
  let dispatch;
  let openCustomContentMock;
  let outageNotificationsSeenActionMock;
  let addToLocalStorageMock;
  let keyPressMock;
  let setScreenInfoMock;

  beforeEach(() => {
    dispatch = jest.fn();
    openCustomContentMock = require('./modules/modal/actions').openCustomContent;
    outageNotificationsSeenActionMock = require('./modules/notifications/actions').outageNotificationsSeenAction;
    addToLocalStorageMock = require('./modules/notifications/util').addToLocalStorage;
    keyPressMock = require('./modules/key-press/actions');
    setScreenInfoMock = require('./modules/screen-size/actions');
    jest.clearAllMocks();
  });

  const buildDispatchProps = (d) => {
    const Notifications = require('./containers/notifications');
    return {
      keyPressAction: (keyCode, shiftKey, ctrlOrCmdKey, isInput) => {
        d(keyPressMock(keyCode, shiftKey, ctrlOrCmdKey, isInput));
      },
      setScreenInfoAction: () => { d(setScreenInfoMock()); },
      notificationClick: (obj, numberOutagesUnseen) => {
        const notificationsSeenObj = {
          alerts: [],
          layerNotices: [],
          messages: [],
          outages: obj.object.outages,
        };
        d(openCustomContentMock('NOTIFICATION_LIST_MODAL', {
          headerText: 'Notifications',
          bodyComponent: Notifications,
          source: 'outage-alert',
          onClose: () => {
            if (numberOutagesUnseen > 0) {
              d(outageNotificationsSeenActionMock());
              addToLocalStorageMock(notificationsSeenObj);
            }
          },
        }));
      },
    };
  };

  it('keyPressAction dispatches keyPress action', () => {
    const props = buildDispatchProps(dispatch);
    props.keyPressAction(65, false, false, false);
    expect(keyPressMock).toHaveBeenCalledWith(65, false, false, false);
    expect(dispatch).toHaveBeenCalled();
  });

  it('setScreenInfoAction dispatches setScreenInfo action', () => {
    const props = buildDispatchProps(dispatch);
    props.setScreenInfoAction();
    expect(setScreenInfoMock).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalled();
  });

  it('notificationClick dispatches openCustomContent', () => {
    const props = buildDispatchProps(dispatch);
    props.notificationClick({ object: { outages: [] } }, 0);
    expect(openCustomContentMock).toHaveBeenCalledWith('NOTIFICATION_LIST_MODAL', expect.objectContaining({
      headerText: 'Notifications',
      source: 'outage-alert',
    }));
  });

  it('notificationClick builds notificationsSeenObj with correct outages', () => {
    const outages = [{ id: 1 }, { id: 2 }];
    const props = buildDispatchProps(dispatch);
    props.notificationClick({ object: { outages } }, 1);
    const { onClose } = openCustomContentMock.mock.calls[0][1];
    onClose();
    expect(addToLocalStorageMock).toHaveBeenCalledWith({
      alerts: [],
      layerNotices: [],
      messages: [],
      outages,
    });
  });

  it('notificationClick onClose dispatches outageNotificationsSeenAction when numberOutagesUnseen > 0', () => {
    const outages = [{ id: 1 }];
    const props = buildDispatchProps(dispatch);
    props.notificationClick({ object: { outages } }, 2);
    const { onClose } = openCustomContentMock.mock.calls[0][1];
    onClose();
    expect(outageNotificationsSeenActionMock).toHaveBeenCalled();
    expect(addToLocalStorageMock).toHaveBeenCalled();
  });

  it('notificationClick onClose does not dispatch when numberOutagesUnseen is 0', () => {
    const props = buildDispatchProps(dispatch);
    props.notificationClick({ object: { outages: [] } }, 0);
    const { onClose } = openCustomContentMock.mock.calls[0][1];
    onClose();
    expect(outageNotificationsSeenActionMock).not.toHaveBeenCalled();
    expect(addToLocalStorageMock).not.toHaveBeenCalled();
  });
});
