/* eslint-disable react/prop-types */

import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

let capturedMapState;
jest.mock('react-redux', () => ({
  connect: (mapState, mapDispatch) => {
    capturedMapState = mapState;
    return (Component) => Component;
  },
}));

const capturedBlocks = [];
jest.mock('../components/notifications/notification-block', () => (props) => {
  capturedBlocks.push(props);
  return <div data-testid={`block-${props.type}`} />;
});

jest.mock('../modules/notifications/util', () => ({
  getNumberOfTypeNotSeen: jest.fn(() => 2),
}));

const Notifications = require('./notifications').default;
const { getNumberOfTypeNotSeen } = require('../modules/notifications/util');

const object = {
  messages: [{ id: 1 }],
  outages: [{ id: 2 }],
  alerts: [{ id: 3 }],
};

beforeEach(() => {
  capturedBlocks.length = 0;
  jest.clearAllMocks();
  getNumberOfTypeNotSeen.mockReturnValue(2);
});

describe('Notifications render', () => {
  it('renders only the outage block when there are unseen outages outside kiosk mode', () => {
    const { getByTestId, queryByTestId } = render(
      <Notifications kioskModeEnabled={false} numberOutagesUnseen={3} object={object} />,
    );
    expect(getByTestId('block-outage')).toBeInTheDocument();
    expect(queryByTestId('block-alert')).toBeNull();
    expect(queryByTestId('block-message')).toBeNull();
    expect(capturedBlocks[0].arr).toBe(object.outages);
    expect(capturedBlocks[0].numberNotSeen).toBe(2);
  });

  it('renders all three blocks when no unseen outages', () => {
    const { getByTestId } = render(
      <Notifications kioskModeEnabled={false} numberOutagesUnseen={0} object={object} />,
    );
    expect(getByTestId('block-outage')).toBeInTheDocument();
    expect(getByTestId('block-alert')).toBeInTheDocument();
    expect(getByTestId('block-message')).toBeInTheDocument();
    expect(getNumberOfTypeNotSeen).toHaveBeenCalledWith('outage', object.outages);
    expect(getNumberOfTypeNotSeen).toHaveBeenCalledWith('alert', object.alerts);
    expect(getNumberOfTypeNotSeen).toHaveBeenCalledWith('message', object.messages);
  });

  it('renders all three blocks in kiosk mode even with unseen outages', () => {
    const { getByTestId } = render(
      <Notifications kioskModeEnabled numberOutagesUnseen={3} object={object} />,
    );
    expect(getByTestId('block-alert')).toBeInTheDocument();
    expect(getByTestId('block-message')).toBeInTheDocument();
  });
});

describe('mapStateToProps', () => {
  const makeState = (uiOverrides = {}) => ({
    notifications: { object, numberOutagesUnseen: 5 },
    ui: { eic: null, isKioskModeActive: false, ...uiOverrides },
  });

  it('maps notifications state', () => {
    const result = capturedMapState(makeState());
    expect(result.object).toBe(object);
    expect(result.numberOutagesUnseen).toBe(5);
    expect(result.kioskModeEnabled).toBe(false);
  });

  it('enables kiosk mode when eic is set', () => {
    expect(capturedMapState(makeState({ eic: 'da' })).kioskModeEnabled).toBe(true);
  });

  it('keeps kiosk mode off when eic is an empty string', () => {
    expect(capturedMapState(makeState({ eic: '' })).kioskModeEnabled).toBe(false);
  });

  it('enables kiosk mode when isKioskModeActive is true', () => {
    expect(capturedMapState(makeState({ isKioskModeActive: true })).kioskModeEnabled).toBe(true);
  });
});
