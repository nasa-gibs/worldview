/* eslint-disable react/jsx-props-no-spreading */
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

let capturedMapState;
let capturedMapDispatch;
jest.mock('react-redux', () => ({
  connect: (mapState, mapDispatch) => {
    capturedMapState = mapState;
    capturedMapDispatch = mapDispatch;
    return (Component) => Component;
  },
}));

let capturedIconListProps;
jest.mock('../components/util/icon-list', () => (props) => {
  capturedIconListProps = props;
  return <div data-testid="icon-list" />;
});

jest.mock('googleTagManager', () => ({
  __esModule: true,
  default: { pushEvent: jest.fn() },
}));

jest.mock('../modules/modal/actions', () => ({
  openCustomContent: jest.fn((id, params) => ({ type: 'OPEN_CUSTOM_CONTENT', id, params })),
  toggleAboutModal: jest.fn((isOpen) => ({ type: 'TOGGLE_ABOUT_MODAL', isOpen })),
}));

jest.mock('../modules/ui/actions', () => ({
  __esModule: true,
  default: jest.fn(() => ({ type: 'TOGGLE_DISTRACTION_FREE' })),
}));

jest.mock('../components/about/about', () => () => <div />);
jest.mock('../components/global-settings/global-settings', () => () => <div />);
jest.mock('./notifications', () => () => <div />);

jest.mock('../modules/feedback/util', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../modules/feedback/actions', () => ({
  __esModule: true,
  default: jest.fn(() => ({ type: 'INIT_FEEDBACK' })),
}));

jest.mock('../modules/tour/actions', () => ({
  startTour: jest.fn(() => ({ type: 'START_TOUR' })),
  endTour: jest.fn(() => ({ type: 'END_TOUR' })),
}));

jest.mock('../modules/notifications/actions', () => ({
  notificationsSeen: jest.fn(() => ({ type: 'NOTIFICATIONS_SEEN' })),
}));

jest.mock('../modules/notifications/util', () => ({
  addToLocalStorage: jest.fn(),
}));

const InfoList = require('./info').default;
const googleTagManager = require('googleTagManager').default;
const { openCustomContent, toggleAboutModal } = require('../modules/modal/actions');
const onClickFeedback = require('../modules/feedback/util').default;
const initFeedback = require('../modules/feedback/actions').default;
const { startTour: startTourAction, endTour: endTourAction } = require('../modules/tour/actions');
const { notificationsSeen } = require('../modules/notifications/actions');
const { addToLocalStorage } = require('../modules/notifications/util');

const defaultProps = {
  sendFeedback: jest.fn(),
  feedbackEnabled: false,
  feedbackIsInitiated: false,
  globalSettingsClick: jest.fn(),
  aboutClick: jest.fn(),
  config: { features: {}, stories: null, storyOrder: null },
  startTour: jest.fn(),
  isDistractionFreeModeActive: false,
  isTourActive: false,
  isMobile: false,
  openAboutModal: jest.fn(),
  toggleDistractionFreeMode: jest.fn(),
  notifications: {
    isActive: false, total: 0, numberUnseen: 0, type: '', object: {},
  },
  notificationClick: jest.fn(),
};

const renderComponent = (props = {}) => render(<InfoList {...defaultProps} {...props} />);

const findItem = (id) => capturedIconListProps.list.find((item) => item.id === id);

beforeEach(() => {
  jest.clearAllMocks();
  capturedIconListProps = null;
});

describe('InfoList list contents', () => {
  it('renders base items: settings, about, source code, api, distraction free', () => {
    renderComponent();
    const ids = capturedIconListProps.list.map((item) => item.id);
    expect(ids).toEqual([
      'settings_info_item',
      'about_info_item',
      'source_code_info_item',
      'api_access_info_item',
      'distraction_free_info_item',
    ]);
    expect(capturedIconListProps.size).toBe('small');
  });

  it('only shows the distraction free item in distraction free mode', () => {
    renderComponent({ isDistractionFreeModeActive: true });
    expect(capturedIconListProps.list).toHaveLength(1);
    expect(capturedIconListProps.list[0].text).toBe('Exit Distraction Free');
  });

  it('adds a feedback entry with onClick when feedback is enabled on desktop', () => {
    const sendFeedback = jest.fn();
    renderComponent({ feedbackEnabled: true, sendFeedback });
    const feedback = findItem('send_feedback_info_item');
    expect(feedback.onClick).toBeDefined();
    feedback.onClick();
    expect(sendFeedback).toHaveBeenCalledWith(false, false);
  });

  it('uses a mailto href for feedback on mobile and large icon size', () => {
    renderComponent({ feedbackEnabled: true, isMobile: true });
    const feedback = findItem('send_feedback_info_item');
    expect(feedback.href).toContain('mailto:');
    expect(capturedIconListProps.size).toBe('large');
  });

  it('adds the explore tour item when tour features are configured', () => {
    const startTour = jest.fn();
    renderComponent({
      startTour,
      config: { features: { tour: true }, stories: {}, storyOrder: [] },
    });
    const tourItem = findItem('start_tour_info_item');
    expect(tourItem).toBeDefined();
    tourItem.onClick();
    expect(startTour).toHaveBeenCalledWith(false);
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({ event: 'tour_start_button' });
  });

  it('adds the notifications item when notifications are active', () => {
    const notificationClick = jest.fn();
    const notifications = {
      isActive: true, total: 3, numberUnseen: 2, type: 'message', object: { foo: 1 },
    };
    renderComponent({ notifications, notificationClick });
    const item = findItem('notifications_info_item');
    expect(item.badge).toBe(2);
    expect(item.iconName).toBe('gift');
    expect(item.className).toBe('message-notification');
    item.onClick();
    expect(notificationClick).toHaveBeenCalledWith({ foo: 1 }, 2);
  });

  it('uses outage icon for outage notifications', () => {
    renderComponent({
      notifications: {
        isActive: true, total: 1, numberUnseen: 1, type: 'outage', object: {},
      },
    });
    expect(findItem('notifications_info_item').iconName).toBe('exclamation-circle');
  });

  it('uses bolt icon for alert notifications and zero badge with no type', () => {
    renderComponent({
      notifications: {
        isActive: true, total: 1, numberUnseen: 1, type: 'alert', object: {},
      },
    });
    expect(findItem('notifications_info_item').iconName).toEqual(['fas', 'bolt']);
  });

  it('settings item triggers globalSettingsClick', () => {
    const globalSettingsClick = jest.fn();
    renderComponent({ globalSettingsClick });
    findItem('settings_info_item').onClick();
    expect(globalSettingsClick).toHaveBeenCalled();
  });

  it('about item triggers aboutClick and openAboutModal', () => {
    const aboutClick = jest.fn();
    const openAboutModal = jest.fn();
    renderComponent({ aboutClick, openAboutModal });
    findItem('about_info_item').onClick();
    expect(aboutClick).toHaveBeenCalled();
    expect(openAboutModal).toHaveBeenCalled();
  });

  it('distraction free item toggles distraction free mode', () => {
    const toggleDistractionFreeMode = jest.fn();
    renderComponent({ toggleDistractionFreeMode });
    findItem('distraction_free_info_item').onClick();
    expect(toggleDistractionFreeMode).toHaveBeenCalled();
  });
});

describe('mapStateToProps', () => {
  it('maps state correctly', () => {
    const state = {
      ui: { isDistractionFreeModeActive: true },
      feedback: { isInitiated: true },
      tour: { active: true },
      notifications: { isActive: true },
      config: { features: { feedback: true } },
      models: {},
      screenSize: { isMobileDevice: true },
    };
    const result = capturedMapState(state);
    expect(result.feedbackEnabled).toBe(true);
    expect(result.feedbackIsInitiated).toBe(true);
    expect(result.isDistractionFreeModeActive).toBe(true);
    expect(result.isTourActive).toBe(true);
    expect(result.isMobile).toBe(true);
  });
});

describe('mapDispatchToProps', () => {
  let dispatch;
  let props;
  beforeEach(() => {
    dispatch = jest.fn();
    props = capturedMapDispatch(dispatch);
  });

  it('toggleDistractionFreeMode dispatches the toggle action', () => {
    props.toggleDistractionFreeMode();
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_DISTRACTION_FREE' });
  });

  it('sendFeedback initiates feedback when not yet initiated', () => {
    props.sendFeedback(false, true);
    expect(onClickFeedback).toHaveBeenCalledWith(false, true);
    expect(initFeedback).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({ type: 'INIT_FEEDBACK' });
  });

  it('sendFeedback skips init when already initiated', () => {
    props.sendFeedback(true, false);
    expect(onClickFeedback).toHaveBeenCalledWith(true, false);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('notificationClick opens the notification modal and marks seen on close', () => {
    props.notificationClick({ some: 'obj' }, 2);
    expect(openCustomContent).toHaveBeenCalledWith('NOTIFICATION_LIST_MODAL', expect.objectContaining({
      headerText: 'Notifications',
    }));
    const { onClose } = openCustomContent.mock.calls.at(-1)[1];
    onClose();
    expect(notificationsSeen).toHaveBeenCalled();
    expect(addToLocalStorage).toHaveBeenCalledWith({ some: 'obj' });
  });

  it('notificationClick onClose does nothing when nothing unseen', () => {
    props.notificationClick({ some: 'obj' }, 0);
    const { onClose } = openCustomContent.mock.calls.at(-1)[1];
    onClose();
    expect(notificationsSeen).not.toHaveBeenCalled();
  });

  it('startTour dispatches startTour directly when tour is not active', () => {
    props.startTour(false);
    expect(startTourAction).toHaveBeenCalled();
    expect(endTourAction).not.toHaveBeenCalled();
  });

  it('startTour restarts the tour when already active', () => {
    jest.useFakeTimers();
    props.startTour(true);
    expect(endTourAction).toHaveBeenCalled();
    jest.runAllTimers();
    expect(startTourAction).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('globalSettingsClick opens the global settings modal', () => {
    props.globalSettingsClick();
    expect(openCustomContent).toHaveBeenCalledWith('GLOBAL_SETTINGS_MODAL', expect.objectContaining({
      headerText: 'Global Settings',
    }));
  });

  it('aboutClick dispatches toggleAboutModal(true)', () => {
    props.aboutClick();
    expect(toggleAboutModal).toHaveBeenCalledWith(true);
  });

  it('openAboutModal opens the about modal and toggles off on close', () => {
    props.openAboutModal();
    expect(openCustomContent).toHaveBeenCalledWith('ABOUT_MODAL', expect.objectContaining({
      headerText: 'About',
    }));
    const { onClose } = openCustomContent.mock.calls.at(-1)[1];
    onClose();
    expect(toggleAboutModal).toHaveBeenCalledWith(false);
  });
});
