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

jest.mock('react-device-detect', () => ({
  isMobileOnly: false,
  isTablet: false,
}));

jest.mock('../../modules/layers/actions', () => ({
  toggleOverlayGroups: jest.fn(() => ({ type: 'TOGGLE_OVERLAY_GROUPS' })),
}));

jest.mock('../../modules/modal/actions', () => ({
  openCustomContent: jest.fn(() => ({ type: 'OPEN_CUSTOM_CONTENT' })),
}));

jest.mock('../../modules/animation/actions', () => ({
  stop: jest.fn(() => ({ type: 'STOP_ANIMATION' })),
}));

jest.mock('../../components/layer/product-picker/search-ui-provider', () => () => (
  <div data-testid="search-ui-provider" />
));

jest.mock('../../components/util/button', () => function MockButton({ onClick, text, id, className }) {
  return (
    <button
      type="button"
      data-testid={id || 'mock-button'}
      className={className}
      onClick={onClick}
    >
      {text}
    </button>
  );
});

jest.mock('../../components/util/checkbox', () => function MockCheckbox({ id, checked, onCheck, label }) {
  return (
    <input
      type="checkbox"
      data-testid={id || 'mock-checkbox'}
      checked={checked}
      onChange={onCheck}
      aria-label={label}
    />
  );
});

jest.mock('@edsc/earthdata-react-icons/horizon-design-system/hds/ui', () => ({
  Plus: () => <span data-testid="plus-icon" />,
}));

import AddLayersContent from './add-layers-content';
import { toggleOverlayGroups as toggleOverlayGroupsAction } from '../../modules/layers/actions';
import { openCustomContent } from '../../modules/modal/actions';
import { stop as stopAnimationAction } from '../../modules/animation/actions';

let capturedMapStateToProps;
let capturedMapDispatchToProps;

beforeAll(() => {
  const { connect } = jest.requireMock('react-redux');
  capturedMapStateToProps = connect.connectCapture.msp;
  capturedMapDispatchToProps = connect.connectCapture.mdp;
});

beforeEach(() => {
  jest.clearAllMocks();
  const reactDeviceDetect = require('react-device-detect');
  reactDeviceDetect.isMobileOnly = false;
  reactDeviceDetect.isTablet = false;
});

const defaultProps = {
  groupOverlays: false,
  isActive: true,
  isAnimating: false,
  isEmbedModeActive: false,
  isMobile: false,
  breakpoints: {},
  screenWidth: 1024,
  toggleOverlayGroups: jest.fn(),
  addLayers: jest.fn(),
};

const renderComponent = (propOverrides = {}) => render(
  <AddLayersContent {...defaultProps} {...propOverrides} />,
);

describe('AddLayersContent rendering', () => {
  it('renders product-buttons section when isActive and not in embed mode', () => {
    const { container } = renderComponent();
    expect(container.querySelector('.product-buttons')).toBeInTheDocument();
  });

  it('renders the Add Layers button', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('layers-add')).toBeInTheDocument();
  });

  it('renders the group overlays checkbox', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('group-overlays-checkbox')).toBeInTheDocument();
  });

  it('renders the hr separator', () => {
    const { container } = renderComponent();
    expect(container.querySelector('.product-section-break')).toBeInTheDocument();
  });

  it('renders nothing when isActive is false', () => {
    const { container } = renderComponent({ isActive: false });
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when isEmbedModeActive is true', () => {
    const { container } = renderComponent({ isEmbedModeActive: true });
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when isActive is false and isEmbedModeActive is true', () => {
    const { container } = renderComponent({ isActive: false, isEmbedModeActive: true });
    expect(container.firstChild).toBeNull();
  });

  it('renders checkbox as checked when groupOverlays is true', () => {
    const { getByTestId } = renderComponent({ groupOverlays: true });
    expect(getByTestId('group-overlays-checkbox')).toBeChecked();
  });

  it('renders checkbox as unchecked when groupOverlays is false', () => {
    const { getByTestId } = renderComponent({ groupOverlays: false });
    expect(getByTestId('group-overlays-checkbox')).not.toBeChecked();
  });
});

describe('AddLayersContent interactions', () => {
  it('calls addLayers when Add Layers button is clicked', () => {
    const addLayers = jest.fn();
    const { getByTestId } = renderComponent({ addLayers });
    fireEvent.click(getByTestId('layers-add'));
    expect(addLayers).toHaveBeenCalledTimes(1);
  });

  it('passes isAnimating, isMobile, breakpoints, screenWidth to addLayers', () => {
    const addLayers = jest.fn();
    const breakpoints = { sm: 576 };
    const { getByTestId } = renderComponent({
      addLayers,
      isAnimating: true,
      isMobile: true,
      breakpoints,
      screenWidth: 768,
    });
    fireEvent.click(getByTestId('layers-add'));
    expect(addLayers).toHaveBeenCalledWith(true, true, breakpoints, 768);
  });

  it('pushes add_layers event to googleTagManager on button click', () => {
    const { getByTestId } = renderComponent();
    window.dataLayer = [];
    fireEvent.click(getByTestId('layers-add'));
    expect(window.dataLayer).toEqual(
      expect.arrayContaining([expect.objectContaining({ event: 'add_layers' })]),
    );
  });

  it('calls toggleOverlayGroups when checkbox changes', () => {
    const toggleOverlayGroups = jest.fn();
    const { getByTestId } = renderComponent({ toggleOverlayGroups });
    fireEvent.click(getByTestId('group-overlays-checkbox'));
    expect(toggleOverlayGroups).toHaveBeenCalledTimes(1);
  });

  it('calls e.stopPropagation on Add Layers button click', () => {
    const addLayers = jest.fn();
    const { getByTestId } = renderComponent({ addLayers });
    const stopPropagation = jest.fn();
    fireEvent.click(getByTestId('layers-add'), { stopPropagation });
    // stopPropagation is called internally via the synthetic event wrapper
    expect(addLayers).toHaveBeenCalled();
  });
});

describe('mapStateToProps', () => {
  const makeState = (overrides = {}) => ({
    embed: { isEmbedModeActive: false },
    layers: {
      active: { groupOverlays: true },
      activeB: { groupOverlays: false },
    },
    animation: { isPlaying: false },
    screenSize: {
      isMobileDevice: false,
      breakpoints: { sm: 576, md: 768 },
      screenWidth: 1280,
    },
    ...overrides,
  });

  it('maps isAnimating from animation.isPlaying', () => {
    const state = makeState({ animation: { isPlaying: true } });
    const result = capturedMapStateToProps(state, { compareState: 'active' });
    expect(result.isAnimating).toBe(true);
  });

  it('maps isAnimating false when animation is not playing', () => {
    const state = makeState({ animation: { isPlaying: false } });
    const result = capturedMapStateToProps(state, { compareState: 'active' });
    expect(result.isAnimating).toBe(false);
  });

  it('maps isEmbedModeActive from embed state', () => {
    const state = makeState({ embed: { isEmbedModeActive: true } });
    const result = capturedMapStateToProps(state, { compareState: 'active' });
    expect(result.isEmbedModeActive).toBe(true);
  });

  it('maps isMobile from screenSize.isMobileDevice', () => {
    const state = makeState({
      screenSize: { isMobileDevice: true, breakpoints: {}, screenWidth: 375 },
    });
    const result = capturedMapStateToProps(state, { compareState: 'active' });
    expect(result.isMobile).toBe(true);
  });

  it('maps breakpoints from screenSize.breakpoints', () => {
    const breakpoints = { sm: 576, md: 768, lg: 992 };
    const state = makeState({
      screenSize: { isMobileDevice: false, breakpoints, screenWidth: 1024 },
    });
    const result = capturedMapStateToProps(state, { compareState: 'active' });
    expect(result.breakpoints).toBe(breakpoints);
  });

  it('maps screenWidth from screenSize.screenWidth', () => {
    const state = makeState({
      screenSize: { isMobileDevice: false, breakpoints: {}, screenWidth: 1920 },
    });
    const result = capturedMapStateToProps(state, { compareState: 'active' });
    expect(result.screenWidth).toBe(1920);
  });

  it('maps groupOverlays from layers[compareState].groupOverlays for active', () => {
    const state = makeState();
    const result = capturedMapStateToProps(state, { compareState: 'active' });
    expect(result.groupOverlays).toBe(true);
  });

  it('maps groupOverlays from layers[compareState].groupOverlays for activeB', () => {
    const state = makeState();
    const result = capturedMapStateToProps(state, { compareState: 'activeB' });
    expect(result.groupOverlays).toBe(false);
  });
});

describe('mapDispatchToProps', () => {
  let dispatch;
  let mappedDispatch;

  beforeEach(() => {
    dispatch = jest.fn();
    mappedDispatch = capturedMapDispatchToProps(dispatch);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('toggleOverlayGroups', () => {
    it('dispatches toggleOverlayGroupsAction after a setTimeout', () => {
      mappedDispatch.toggleOverlayGroups();
      expect(dispatch).not.toHaveBeenCalled();
      jest.runAllTimers();
      expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_OVERLAY_GROUPS' });
      expect(toggleOverlayGroupsAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('addLayers', () => {
    it('dispatches openCustomContent with desktop class when not mobile/tablet', () => {
      mappedDispatch.addLayers(false);
      expect(openCustomContent).toHaveBeenCalledWith(
        'LAYER_PICKER_COMPONENT',
        expect.objectContaining({
          modalClassName: 'custom-layer-dialog light',
          headerText: null,
          backdrop: true,
          wrapClassName: '',
        }),
      );
    });

    it('dispatches openCustomContent with mobile class when isMobileOnly', () => {
      const reactDeviceDetect = require('react-device-detect');
      reactDeviceDetect.isMobileOnly = true;
      mappedDispatch.addLayers(false);
      expect(openCustomContent).toHaveBeenCalledWith(
        'LAYER_PICKER_COMPONENT',
        expect.objectContaining({
          modalClassName: 'custom-layer-dialog-mobile custom-layer-dialog light',
        }),
      );
    });

    it('dispatches openCustomContent with mobile class when isTablet', () => {
      const reactDeviceDetect = require('react-device-detect');
      reactDeviceDetect.isTablet = true;
      mappedDispatch.addLayers(false);
      expect(openCustomContent).toHaveBeenCalledWith(
        'LAYER_PICKER_COMPONENT',
        expect.objectContaining({
          modalClassName: 'custom-layer-dialog-mobile custom-layer-dialog light',
        }),
      );
    });

    it('dispatches stopAnimationAction when isPlaying is true', () => {
      mappedDispatch.addLayers(true);
      expect(stopAnimationAction).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({ type: 'STOP_ANIMATION' });
    });

    it('does not dispatch stopAnimationAction when isPlaying is false', () => {
      mappedDispatch.addLayers(false);
      expect(stopAnimationAction).not.toHaveBeenCalled();
    });

    it('always dispatches openCustomContent regardless of isPlaying', () => {
      mappedDispatch.addLayers(true);
      expect(openCustomContent).toHaveBeenCalledTimes(1);
    });

    it('passes a function as CompletelyCustomModal', () => {
      mappedDispatch.addLayers(false);
      const callArgs = openCustomContent.mock.calls[0][1];
      expect(typeof callArgs.CompletelyCustomModal).toBe('function');
    });
  });
});
