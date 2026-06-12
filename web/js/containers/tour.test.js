/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import {
  render, act, waitFor,
} from '@testing-library/react';
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

let mockTourStartProps = null;
jest.mock('../components/tour/modal-tour-start', () => (props) => {
  mockTourStartProps = props;
  return <div data-testid="tour-start" />;
});

let mockTourInProgressProps = null;
jest.mock('../components/tour/modal-tour-in-progress', () => (props) => {
  mockTourInProgressProps = props;
  return <div data-testid="tour-in-progress" />;
});

let mockTourCompleteProps = null;
jest.mock('../components/tour/modal-tour-complete', () => (props) => {
  mockTourCompleteProps = props;
  return <div data-testid="tour-complete" />;
});

jest.mock('../components/tour/joyride-wrapper', () => () => <div data-testid="joyride" />);

let mockAlertProps = null;
jest.mock('../components/util/alert', () => (props) => {
  mockAlertProps = props;
  return <div data-testid="alert" data-message={props.message} />;
});

jest.mock('./error-boundary', () => ({ children }) => <div>{children}</div>);

jest.mock('googleTagManager', () => ({
  __esModule: true,
  default: { pushEvent: jest.fn() },
}));

jest.mock('../util/local-storage', () => ({
  __esModule: true,
  default: {
    enabled: true,
    keys: { HIDE_TOUR: 'hideTour', GROUP_OVERLAYS: 'groupOverlays' },
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('../modules/palettes/util', () => ({
  preloadPalettes: jest.fn(() => Promise.resolve({ rendered: { p: 1 } })),
  hasCustomTypePalette: jest.fn(() => false),
}));

jest.mock('../modules/palettes/actions', () => ({
  clearCustoms: jest.fn(() => ({ type: 'CLEAR_CUSTOMS' })),
}));

jest.mock('../modules/palettes/constants', () => ({
  BULK_PALETTE_RENDERING_SUCCESS: 'BULK_PALETTE_RENDERING_SUCCESS',
  BULK_PALETTE_PRELOADING_SUCCESS: 'BULK_PALETTE_PRELOADING_SUCCESS',
}));

jest.mock('../modules/animation/actions', () => ({
  stop: jest.fn(() => ({ type: 'STOP_ANIMATION' })),
}));

jest.mock('../modules/modal/actions', () => ({
  onClose: jest.fn(() => ({ type: 'MODAL_CLOSE' })),
}));

jest.mock('../redux-location-state-customs', () => ({
  LOCATION_POP_ACTION: 'LOCATION_POP',
}));

jest.mock('../modules/layers/util', () => ({
  layersParse12: jest.fn(() => [
    { id: 'layer1', custom: false, disabled: false },
    { id: 'layer2', custom: true, disabled: false },
  ]),
}));

jest.mock('../modules/tour/actions', () => ({
  startTour: jest.fn(() => ({ type: 'START_TOUR' })),
  endTour: jest.fn(() => ({ type: 'END_TOUR' })),
  selectStory: jest.fn((id) => ({ type: 'SELECT_STORY', id })),
}));

jest.mock('../modules/product-picker/actions', () => ({
  resetProductPickerState: jest.fn(() => ({ type: 'RESET_PRODUCT_PICKER' })),
}));

jest.mock('../modules/sidebar/actions', () => ({
  changeTab: jest.fn((str) => ({ type: 'CHANGE_TAB', str })),
}));

jest.mock('../modules/layers/actions', () => ({
  toggleOverlayGroups: jest.fn(() => ({ type: 'TOGGLE_OVERLAY_GROUPS' })),
}));

jest.mock('../main', () => ({
  __esModule: true,
  default: { location: { search: '?x=1', pathname: '/' } },
}));

jest.mock('../util/util', () => ({
  __esModule: true,
  default: {
    fromQueryString: jest.fn(() => ({})),
  },
}));

jest.mock('../modules/map/util', () => ({
  promiseImageryForTour: jest.fn(() => Promise.resolve('imagery')),
}));

const Tour = require('./tour').default;
const googleTagManager = require('googleTagManager').default;
const safeLocalStorage = require('../util/local-storage').default;
const util = require('../util/util').default;
const { preloadPalettes, hasCustomTypePalette } = require('../modules/palettes/util');
const { clearCustoms } = require('../modules/palettes/actions');
const { layersParse12 } = require('../modules/layers/util');
const { promiseImageryForTour: promiseImageryForTourUtil } = require('../modules/map/util');

const stories = {
  story1: {
    id: 'story1',
    steps: [{ stepLink: 'l=x&t=1', description: 'd1.html' }],
  },
  story2: {
    id: 'story2',
    steps: [
      {
        stepLink: 'l=a',
        description: 'd1.html',
        transition: { element: 'animation', action: 'play' },
      },
      { stepLink: 'l=b', description: 'd2.html' },
    ],
  },
};
const storyOrder = ['story1', 'story2'];

const defaultProps = {
  isActive: true,
  stories,
  storyOrder,
  currentStoryId: '',
  config: { features: {}, parameters: {} },
  map: { ui: { selected: null } },
  screenHeight: 800,
  screenWidth: 1200,
  renderedPalettes: {},
  activeTab: 'layers',
  isKioskModeActive: false,
  isEmbedModeActive: false,
  groupOverlays: true,
  selectTour: jest.fn(),
  endTour: jest.fn(),
  startTour: jest.fn(),
  processStepLink: jest.fn(),
  preProcessStepLink: jest.fn(),
  promiseImageryForTour: jest.fn(),
  resetProductPicker: jest.fn(),
  changeTab: jest.fn(),
  toggleOverlayGroups: jest.fn(),
};

const renderComponent = (props = {}) => render(<Tour {...defaultProps} {...props} />);

// helper: select story2 from the start modal and wait for in-progress modal
async function selectStory2(extraProps = {}) {
  const result = renderComponent(extraProps);
  await act(async () => {
    mockTourStartProps.selectTour({ preventDefault: jest.fn() }, stories.story2, 1, 'story2');
  });
  await waitFor(() => expect(mockTourInProgressProps).not.toBeNull());
  return result;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockTourStartProps = null;
  mockTourInProgressProps = null;
  mockTourCompleteProps = null;
  mockAlertProps = null;
  safeLocalStorage.getItem.mockReturnValue(null);
  util.fromQueryString.mockReturnValue({});
  global.fetch = jest.fn(() => Promise.resolve({
    ok: true,
    text: () => Promise.resolve('plain description'),
  }));
});

describe('initial rendering', () => {
  it('renders the start modal when no story is selected', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('tour-start')).toBeInTheDocument();
    expect(mockTourStartProps.modalStart).toBe(true);
    expect(mockTourStartProps.checked).toBe(false);
  });

  it('renders nothing when there are no stories and the tour is inactive', () => {
    const { container } = renderComponent({
      stories: null,
      storyOrder: null,
      isActive: false,
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the support alert for an unknown story id', () => {
    const endTour = jest.fn();
    const { getByTestId } = renderComponent({ currentStoryId: 'unknown-story', endTour });
    expect(getByTestId('alert')).toHaveAttribute(
      'data-message',
      'Sorry, this tour is no longer supported.',
    );
    mockAlertProps.onDismiss();
    expect(endTour).toHaveBeenCalled();
  });

  it('restarts the linked story when mounted with a valid story id', async () => {
    const selectTour = jest.fn();
    const processStepLink = jest.fn();
    renderComponent({ currentStoryId: 'story2', selectTour, processStepLink });
    await waitFor(() => {
      expect(selectTour).toHaveBeenCalledWith('story2');
      expect(processStepLink).toHaveBeenCalled();
    });
  });
});

describe('selectTour', () => {
  it('starts the story, processes step links and fetches metadata', async () => {
    const selectTour = jest.fn();
    const processStepLink = jest.fn();
    const preProcessStepLink = jest.fn();
    await selectStory2({ selectTour, processStepLink, preProcessStepLink });
    expect(selectTour).toHaveBeenCalledWith('story2');
    expect(processStepLink).toHaveBeenCalledWith(
      'story2',
      1,
      2,
      'l=a&tr=story2&playanim=true&em=false',
      defaultProps.config,
      {},
    );
    expect(preProcessStepLink).toHaveBeenCalledWith(
      'l=b&tr=story2&playanim=true&em=false',
      defaultProps.config,
      defaultProps.promiseImageryForTour,
    );
    expect(global.fetch).toHaveBeenCalledWith('config/metadata/stories/story2/d1.html');
    await waitFor(() => {
      expect(mockTourInProgressProps.description).toBe('plain description');
      expect(mockTourInProgressProps.metaLoaded).toBe(true);
    });
  });

  it('appends the kiosk param and skips preprocessing single-step stories', async () => {
    const processStepLink = jest.fn();
    const preProcessStepLink = jest.fn();
    renderComponent({ isKioskModeActive: true, processStepLink, preProcessStepLink });
    await act(async () => {
      mockTourStartProps.selectTour({ preventDefault: jest.fn() }, stories.story1, 0, 'story1');
    });
    expect(processStepLink).toHaveBeenCalledWith(
      'story1',
      1,
      1,
      'l=x&t=1&tr=story1&kiosk=true&em=false',
      defaultProps.config,
      {},
    );
    expect(preProcessStepLink).not.toHaveBeenCalled();
  });

  it('uses the error message when metadata is a full html page', async () => {
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true,
      text: () => Promise.resolve('<html><body>nope</body></html>'),
    }));
    await selectStory2();
    await waitFor(() => {
      expect(mockTourInProgressProps.description)
        .toBe('<p>There was an error loading this description.</p>');
    });
  });

  it('uses the error message when the fetch response is not ok', async () => {
    global.fetch = jest.fn(() => Promise.resolve({
      ok: false,
      text: () => Promise.resolve('ignored'),
    }));
    await selectStory2();
    await waitFor(() => {
      expect(mockTourInProgressProps.description)
        .toBe('<p>There was an error loading this description.</p>');
    });
  });

  it('stores the fetch error when the request rejects', async () => {
    const fetchError = new Error('network');
    global.fetch = jest.fn(() => Promise.reject(fetchError));
    await selectStory2();
    await waitFor(() => {
      expect(mockTourInProgressProps.description).toBe(fetchError);
      expect(mockTourInProgressProps.isLoadingMeta).toBe(false);
    });
  });
});

describe('step navigation', () => {
  it('increments through steps and completes the tour', async () => {
    const processStepLink = jest.fn();
    const changeTab = jest.fn();
    await selectStory2({ processStepLink, changeTab, activeTab: 'events' });
    expect(mockTourInProgressProps.currentStep).toBe(1);

    await act(async () => {
      mockTourInProgressProps.incrementStep({ preventDefault: jest.fn() });
    });
    expect(changeTab).toHaveBeenCalledWith('layers');
    expect(mockTourInProgressProps.currentStep).toBe(2);
    expect(processStepLink).toHaveBeenLastCalledWith(
      'story2',
      2,
      2,
      'l=b&tr=story2&em=false',
      defaultProps.config,
      {},
    );

    await act(async () => {
      mockTourInProgressProps.incrementStep({ preventDefault: jest.fn() });
    });
    await waitFor(() => {
      expect(mockTourCompleteProps).not.toBeNull();
      expect(mockTourCompleteProps.modalComplete).toBe(true);
    });
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({
      event: 'tour_completed',
      story: { id: 'story2' },
    });
  });

  it('decrements steps and returns to the start modal from step one', async () => {
    const processStepLink = jest.fn();
    await selectStory2({ processStepLink });
    await act(async () => {
      mockTourInProgressProps.incrementStep({ preventDefault: jest.fn() });
    });
    expect(mockTourInProgressProps.currentStep).toBe(2);
    await act(async () => {
      mockTourInProgressProps.decreaseStep({ preventDefault: jest.fn() });
    });
    expect(mockTourInProgressProps.currentStep).toBe(1);
    expect(processStepLink).toHaveBeenLastCalledWith(
      'story2',
      1,
      2,
      'l=a&tr=story2&playanim=true&em=false',
      defaultProps.config,
      {},
    );
    await act(async () => {
      mockTourInProgressProps.decreaseStep({ preventDefault: jest.fn() });
    });
    expect(mockTourStartProps.modalStart).toBe(true);
  });
});

describe('start modal interactions', () => {
  it('toggleModalStart closing the modal ends the tour', async () => {
    const endTour = jest.fn();
    renderComponent({ endTour });
    await act(async () => {
      mockTourStartProps.toggleModalStart({ preventDefault: jest.fn() });
    });
    expect(endTour).toHaveBeenCalled();
  });

  it('hideTour stores the preference and shows the disabled alert on end', async () => {
    const endTour = jest.fn();
    const { getByTestId } = renderComponent({ endTour });
    await act(async () => {
      mockTourStartProps.hideTour();
    });
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({ event: 'tour_hide_checked' });
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith('hideTour', expect.any(Date));
    await act(async () => {
      mockTourStartProps.endTour({ preventDefault: jest.fn() });
    });
    expect(endTour).not.toHaveBeenCalled();
    expect(getByTestId('alert')).toHaveAttribute(
      'data-message',
      expect.stringContaining('To view these tours again'),
    );
  });

  it('hideTour does not re-store the preference when already hidden', async () => {
    safeLocalStorage.getItem.mockReturnValue('2020-01-01');
    renderComponent();
    await act(async () => {
      mockTourStartProps.hideTour();
    });
    expect(safeLocalStorage.setItem).not.toHaveBeenCalled();
  });

  it('showTour removes the stored preference', async () => {
    safeLocalStorage.getItem.mockReturnValue('2020-01-01');
    renderComponent();
    await act(async () => {
      mockTourStartProps.showTour();
    });
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({ event: 'tour_hide_unchecked' });
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith('hideTour');
  });

  it('showTour does nothing when no preference is stored', async () => {
    renderComponent();
    await act(async () => {
      mockTourStartProps.showTour();
    });
    expect(safeLocalStorage.removeItem).not.toHaveBeenCalled();
  });

  it('endTour calls the endTour prop when no disabled alert is shown', async () => {
    const endTour = jest.fn();
    renderComponent({ endTour });
    await act(async () => {
      mockTourStartProps.endTour({ preventDefault: jest.fn() });
    });
    expect(endTour).toHaveBeenCalled();
  });
});

describe('tour completion and reset', () => {
  it('resetTour returns to the start modal and records the event', async () => {
    const startTour = jest.fn();
    await selectStory2({ startTour });
    await act(async () => {
      mockTourInProgressProps.incrementStep({ preventDefault: jest.fn() });
    });
    await act(async () => {
      mockTourInProgressProps.incrementStep({ preventDefault: jest.fn() });
    });
    await waitFor(() => expect(mockTourCompleteProps).not.toBeNull());
    await act(async () => {
      mockTourCompleteProps.resetTour({ preventDefault: jest.fn() });
    });
    expect(startTour).toHaveBeenCalled();
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({ event: 'tour_more_stories_button' });
    expect(mockTourStartProps.modalStart).toBe(true);
  });
});

describe('group overlays preference', () => {
  it('restores the preference when the tour ends', async () => {
    const toggleOverlayGroups = jest.fn();
    const { rerender } = renderComponent({
      isActive: false,
      groupOverlays: false,
      toggleOverlayGroups,
    });
    act(() => {
      rerender(
        <Tour
          {...defaultProps}
          isActive
          groupOverlays={false}
          toggleOverlayGroups={toggleOverlayGroups}
        />,
      );
    });
    act(() => {
      rerender(
        <Tour
          {...defaultProps}
          isActive={false}
          groupOverlays={false}
          toggleOverlayGroups={toggleOverlayGroups}
        />,
      );
    });
    // snapshot was true (storage not 'disabled'), groupOverlays false → restore
    expect(toggleOverlayGroups).toHaveBeenCalled();
  });

  it('does not toggle when the preference matches', async () => {
    const toggleOverlayGroups = jest.fn();
    const { rerender } = renderComponent({
      isActive: false,
      groupOverlays: true,
      toggleOverlayGroups,
    });
    act(() => {
      rerender(
        <Tour {...defaultProps} isActive groupOverlays toggleOverlayGroups={toggleOverlayGroups} />,
      );
    });
    act(() => {
      rerender(
        <Tour
          {...defaultProps}
          isActive={false}
          groupOverlays
          toggleOverlayGroups={toggleOverlayGroups}
        />,
      );
    });
    expect(toggleOverlayGroups).not.toHaveBeenCalled();
  });

  it('restores the preference on unmount while active', () => {
    const toggleOverlayGroups = jest.fn();
    const { unmount } = renderComponent({
      isActive: true,
      groupOverlays: false,
      toggleOverlayGroups,
    });
    unmount();
    expect(toggleOverlayGroups).toHaveBeenCalled();
  });
});

describe('mapStateToProps', () => {
  it('maps tour state', () => {
    const state = {
      screenSize: { screenWidth: 1300, screenHeight: 700 },
      config: { stories, storyOrder },
      tour: { active: true, selected: 'story1' },
      palettes: { rendered: { r: 1 } },
      models: {},
      compare: { activeString: 'active' },
      map: { ui: {} },
      sidebar: { activeTab: 'events' },
      ui: { isKioskModeActive: true },
      embed: { isEmbedModeActive: false },
      layers: { active: { groupOverlays: true } },
    };
    const result = capturedMapState(state);
    expect(result.isActive).toBe(true);
    expect(result.currentStoryId).toBe('story1');
    expect(result.stories).toBe(stories);
    expect(result.storyOrder).toBe(storyOrder);
    expect(result.isKioskModeActive).toBe(true);
    expect(result.screenWidth).toBe(1300);
    expect(result.renderedPalettes).toEqual({ r: 1 });
    expect(result.activeTab).toBe('events');
    expect(result.groupOverlays).toBe(true);
    result.promiseImageryForTour(['l'], '2020-01-01', 'active');
    expect(promiseImageryForTourUtil).toHaveBeenCalledWith(state, ['l'], '2020-01-01', 'active');
  });
});

describe('mapDispatchToProps', () => {
  let dispatch;
  let props;
  beforeEach(() => {
    dispatch = jest.fn();
    props = capturedMapDispatch(dispatch);
  });

  it('dispatches the simple actions', () => {
    props.startTour();
    expect(dispatch).toHaveBeenCalledWith({ type: 'START_TOUR' });
    props.endTour();
    expect(dispatch).toHaveBeenCalledWith({ type: 'END_TOUR' });
    props.selectTour('story1');
    expect(dispatch).toHaveBeenCalledWith({ type: 'SELECT_STORY', id: 'story1' });
    props.resetProductPicker();
    expect(dispatch).toHaveBeenCalledWith({ type: 'RESET_PRODUCT_PICKER' });
    props.changeTab('layers');
    expect(dispatch).toHaveBeenCalledWith({ type: 'CHANGE_TAB', str: 'layers' });
    props.toggleOverlayGroups();
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_OVERLAY_GROUPS' });
  });

  it('processStepLink dispatches stop, close and location pop without palettes', () => {
    props.processStepLink('story1', 1, 2, 'l=a&tr=story1', { config: true }, {});
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({
      event: 'tour_selected_story',
      story: { id: 'story1', selectedStep: 1, totalSteps: 2 },
    });
    expect(dispatch).toHaveBeenCalledWith({ type: 'STOP_ANIMATION' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'MODAL_CLOSE' });
    expect(clearCustoms).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({
      type: 'LOCATION_POP',
      payload: expect.objectContaining({ search: 'l=a&tr=story1' }),
    });
  });

  it('processStepLink clears customs when palettes are rendered', () => {
    props.processStepLink('story1', 1, 2, 'l=a', { config: true }, { rendered: 1 });
    expect(clearCustoms).toHaveBeenCalled();
  });

  it('processStepLink preloads palettes for custom palette layers', async () => {
    util.fromQueryString.mockReturnValue({ l: 'layers(custom)', l1: 'layersB(custom)' });
    hasCustomTypePalette.mockReturnValue(true);
    props.processStepLink('story1', 1, 2, 'l=layers(custom)', { config: true }, {});
    expect(layersParse12).toHaveBeenCalled();
    expect(preloadPalettes).toHaveBeenCalled();
    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({
        type: 'BULK_PALETTE_RENDERING_SUCCESS',
        rendered: { p: 1 },
      });
      expect(dispatch).toHaveBeenCalledWith({
        type: 'LOCATION_POP',
        payload: expect.anything(),
      });
    });
  });

  it('preProcessStepLink preloads palettes and promises imagery for both layer sets', async () => {
    util.fromQueryString.mockReturnValue({
      l: 'layersA', t: '2020-01-01', l1: 'layersB', t1: '2020-01-02',
    });
    const promiseImageryForTour = jest.fn(() => Promise.resolve());
    await props.preProcessStepLink('l=layersA', { config: true }, promiseImageryForTour);
    expect(preloadPalettes).toHaveBeenCalled();
    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({
        type: 'BULK_PALETTE_PRELOADING_SUCCESS',
        tourStoryPalettes: { p: 1 },
      });
      expect(promiseImageryForTour).toHaveBeenCalledTimes(2);
      expect(promiseImageryForTour).toHaveBeenCalledWith(
        expect.any(Array), '2020-01-02', 'activeB',
      );
    });
  });
});
