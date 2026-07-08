/* eslint-disable react/jsx-props-no-spreading */
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import JoyrideWrapper from './joyride-wrapper';
import util from '../../util/util';

// Capture latest props from the mocked Joyride so tests can inspect them
// and call onEvent() to simulate joyride lifecycle events.
let mockJoyrideProps = {};

// react-joyride exports Joyride as a named export (not default).
jest.mock('react-joyride', () => ({
  Joyride: (props) => { mockJoyrideProps = props; return <div data-testid="joyride" />; },
  STATUS: { FINISHED: 'finished', SKIPPED: 'skipped' },
  ACTIONS: { PREV: 'prev', NEXT: 'next', RESET: 'reset' },
  EVENTS: { STEP_AFTER: 'step:after', TARGET_NOT_FOUND: 'target:notFound' },
  LIFECYCLE: { TOOLTIP: 'tooltip' },
}));

jest.mock('../../util/util', () => ({
  __esModule: true,
  default: { events: { on: jest.fn(), off: jest.fn() } },
}));

jest.mock('../../util/constants', () => ({
  JOYRIDE_INCREMENT: 'joyride:increment',
}));

// ─── map mock ────────────────────────────────────────────────────────────────
const mockViewOn = jest.fn();
const mockViewUn = jest.fn();
const mockGetPixelFromCoordinate = jest.fn(() => [100, 200]);
const mockMap = {
  getView: jest.fn(() => ({ on: mockViewOn, un: mockViewUn })),
  getPixelFromCoordinate: mockGetPixelFromCoordinate,
};

// ─── MutationObserver mock ───────────────────────────────────────────────────
let mockObserver;

// ─── prop factories ──────────────────────────────────────────────────────────
const makeJoyrideStep = (overrides = {}) => ({
  target: '.some-target',
  content: 'Step content',
  ...overrides,
});

// A tour step with a targetCoordinates-aware joyride step at a given target.
const makeCoordStep = (target = '#jt-tour-target') => makeJoyrideStep({
  target,
  targetCoordinates: { topLeft: [0, 0], bottomRight: [100, 100] },
});

const makeTourStep = (joyrideOverrides = {}, stepOverrides = {}) => ({
  stepLink: 'https://worldview.earthdata.nasa.gov/?t=2020-01-01',
  joyride: {
    continuous: true,
    disableOverlayClose: false,
    spotlightClicks: false,
    steps: [makeJoyrideStep()],
    hideCloseButton: false,
    eventTriggersIncrement: false,
    ...joyrideOverrides,
  },
  ...stepOverrides,
});

const defaultProps = {
  tourSteps: [makeTourStep()],
  currentTourStep: 1,
  map: mockMap,
  proj: 'geographic',
  tourComplete: false,
  resetProductPicker: jest.fn(),
};

const renderComponent = (props = {}) => render(
  <JoyrideWrapper {...defaultProps} {...props} />,
);

const fireJoyride = (data) => act(() => { mockJoyrideProps.onEvent(data); });

// ─── setup / teardown ────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();

  mockJoyrideProps = {};
  mockObserver = { observe: jest.fn(), disconnect: jest.fn() };
  global.MutationObserver = jest.fn(() => mockObserver);
  global.requestAnimationFrame = jest.fn((cb) => cb());

  // setPlaceholderLocation does `const element = { ...el }`.  In jsdom the
  // `style` getter lives on the prototype, so the spread produces a plain
  // object with no `style` property, causing a crash.  Patch createElement so
  // every element has `style` as an own enumerable property that the spread
  // will copy correctly.
  const origCreate = document.createElement.bind(document);
  jest.spyOn(document, 'createElement').mockImplementation((tag, opts) => {
    const el = origCreate(tag, opts);
    const ownStyle = el.style;
    Object.defineProperty(el, 'style', {
      value: ownStyle, enumerable: true, writable: true, configurable: true,
    });
    return el;
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  document.querySelectorAll('#jt-tour-target').forEach((el) => el.remove());
  document.querySelectorAll('.react-joyride__overlay-fallback').forEach((el) => el.remove());
});

// ─── tests ───────────────────────────────────────────────────────────────────

describe('JoyrideWrapper', () => {
  describe('null guards', () => {
    it('returns null when map is falsy', () => {
      const { container } = renderComponent({ map: null });
      expect(container.querySelector('[data-testid="joyride"]')).not.toBeInTheDocument();
    });

    it('returns null when proj does not match stepLink proj (no p= → "geographic")', () => {
      const { container } = renderComponent({ proj: 'arctic' });
      expect(container.querySelector('[data-testid="joyride"]')).not.toBeInTheDocument();
    });
  });

  describe('renders Joyride', () => {
    it('renders Joyride when proj matches and steps exist', () => {
      const { container } = renderComponent();
      expect(container.querySelector('[data-testid="joyride"]')).toBeInTheDocument();
    });

    it('passes run=true when steps are provided', () => {
      renderComponent();
      expect(mockJoyrideProps.run).toBe(true);
    });

    it('passes run=false when joyride.steps is empty', () => {
      const tourSteps = [makeTourStep({ steps: [] })];
      renderComponent({ tourSteps });
      expect(mockJoyrideProps.run).toBe(false);
    });

    it('passes steps array to Joyride', () => {
      const step = makeJoyrideStep({ title: 'My Step' });
      const tourSteps = [makeTourStep({ steps: [step] })];
      renderComponent({ tourSteps });
      expect(mockJoyrideProps.steps).toContainEqual(expect.objectContaining({ title: 'My Step' }));
    });

    it('passes the styles object including overlay and tooltip entries', () => {
      renderComponent();
      expect(mockJoyrideProps.styles).toMatchObject({
        overlay: { transition: 'none' },
        tooltip: { padding: 15 },
      });
    });
  });

  describe('stepLink proj parsing', () => {
    it('extracts proj from p= param in stepLink and matches correctly', () => {
      const tourSteps = [makeTourStep({}, {
        stepLink: 'https://worldview.earthdata.nasa.gov/?t=2020-01-01&p=arctic',
      })];
      const { container } = renderComponent({ tourSteps, proj: 'arctic' });
      expect(container.querySelector('[data-testid="joyride"]')).toBeInTheDocument();
    });

    it('defaults stepProj to "geographic" when no p= param present', () => {
      // defaultProps has no p= in stepLink and proj="geographic" → matches → renders
      const { container } = renderComponent({ proj: 'geographic' });
      expect(container.querySelector('[data-testid="joyride"]')).toBeInTheDocument();
    });

    it('returns null when extracted proj does not match component proj', () => {
      const tourSteps = [makeTourStep({}, {
        stepLink: 'https://worldview.earthdata.nasa.gov/?p=arctic',
      })];
      const { container } = renderComponent({ tourSteps, proj: 'geographic' });
      expect(container.querySelector('[data-testid="joyride"]')).not.toBeInTheDocument();
    });
  });

  describe('checkContinuous', () => {
    it('passes continuous=true when no step after index 0 has targetCoordinates', () => {
      const tourSteps = [makeTourStep({ continuous: true, steps: [makeJoyrideStep()] })];
      renderComponent({ tourSteps });
      expect(mockJoyrideProps.continuous).toBe(true);
    });

    it('passes continuous=false when a step after index 0 has targetCoordinates', () => {
      const steps = [makeJoyrideStep(), makeCoordStep()];
      const tourSteps = [makeTourStep({ continuous: true, steps })];
      renderComponent({ tourSteps });
      expect(mockJoyrideProps.continuous).toBe(false);
    });
  });

  describe('styles — hideNextButton / hideCloseButton', () => {
    it('hides next button when steps[stepIndex] has hideNextButton=true', () => {
      // After effect, stepIndex=0; steps[0].hideNextButton=true → buttonNext hidden.
      const steps = [makeJoyrideStep({ hideNextButton: true })];
      const tourSteps = [makeTourStep({ steps })];
      renderComponent({ tourSteps });
      expect(mockJoyrideProps.styles.buttonNext).toEqual({ display: 'none' });
    });

    it('hides close button when joyride config has hideCloseButton=true', () => {
      const steps = [makeJoyrideStep({ hideNextButton: true })];
      const tourSteps = [makeTourStep({ steps, hideCloseButton: true })];
      renderComponent({ tourSteps });
      expect(mockJoyrideProps.styles.buttonClose).toEqual({ display: 'none' });
    });
  });

  describe('Joyride options', () => {
    it('sets overlayClickAction=false when disableOverlayClose=true', () => {
      renderComponent({ tourSteps: [makeTourStep({ disableOverlayClose: true })] });
      expect(mockJoyrideProps.options.overlayClickAction).toBe(false);
    });

    it('sets overlayClickAction="close" when disableOverlayClose=false', () => {
      renderComponent();
      expect(mockJoyrideProps.options.overlayClickAction).toBe('close');
    });

    it('sets blockTargetInteraction=true when spotlightClicks=false', () => {
      renderComponent();
      expect(mockJoyrideProps.options.blockTargetInteraction).toBe(true);
    });

    it('sets blockTargetInteraction=false when spotlightClicks=true', () => {
      renderComponent({ tourSteps: [makeTourStep({ spotlightClicks: true })] });
      expect(mockJoyrideProps.options.blockTargetInteraction).toBe(false);
    });
  });

  describe('joyrideStateCallback (onEvent)', () => {
    it('sets overlayStarted=true on LIFECYCLE.TOOLTIP — shows fallback overlay', () => {
      renderComponent();
      fireJoyride({
        action: 'next', index: 0, type: 'beacon', status: 'running', lifecycle: 'tooltip',
      });
      expect(document.querySelector('.react-joyride__overlay-fallback')).toBeInTheDocument();
    });

    it('increments stepIndex on STEP_AFTER with NEXT action', () => {
      const tourSteps = [makeTourStep({ steps: [makeJoyrideStep(), makeJoyrideStep()] })];
      renderComponent({ tourSteps });
      fireJoyride({
        action: 'next', index: 0, type: 'step:after', status: 'running', lifecycle: 'ready',
      });
      expect(mockJoyrideProps.stepIndex).toBe(1);
    });

    it('decrements stepIndex on STEP_AFTER with PREV action', () => {
      const tourSteps = [makeTourStep({ steps: [makeJoyrideStep(), makeJoyrideStep()] })];
      renderComponent({ tourSteps });
      fireJoyride({ action: 'next', index: 0, type: 'step:after', status: 'running', lifecycle: 'ready' });
      fireJoyride({ action: 'prev', index: 1, type: 'step:after', status: 'running', lifecycle: 'ready' });
      expect(mockJoyrideProps.stepIndex).toBe(0);
    });

    it('handles TARGET_NOT_FOUND by advancing stepIndex', () => {
      const tourSteps = [makeTourStep({ steps: [makeJoyrideStep(), makeJoyrideStep()] })];
      renderComponent({ tourSteps });
      fireJoyride({
        action: 'next', index: 0, type: 'target:notFound', status: 'running', lifecycle: 'init',
      });
      expect(mockJoyrideProps.stepIndex).toBe(1);
    });

    it('resets run=false and stepIndex=0 on STATUS.FINISHED', () => {
      renderComponent();
      fireJoyride({
        action: 'close', index: 0, type: 'step:after', status: 'finished', lifecycle: 'complete',
      });
      expect(mockJoyrideProps.run).toBe(false);
      expect(mockJoyrideProps.stepIndex).toBe(0);
    });

    it('resets run=false and stepIndex=0 on STATUS.SKIPPED', () => {
      renderComponent();
      fireJoyride({
        action: 'close', index: 0, type: 'step:after', status: 'skipped', lifecycle: 'complete',
      });
      expect(mockJoyrideProps.run).toBe(false);
      expect(mockJoyrideProps.stepIndex).toBe(0);
    });
  });

  describe('useEffect — JOYRIDE_INCREMENT event listener', () => {
    it('registers JOYRIDE_INCREMENT listener on mount', () => {
      renderComponent();
      expect(util.events.on).toHaveBeenCalledWith('joyride:increment', expect.any(Function));
    });

    it('de-registers listener on unmount', () => {
      const { unmount } = renderComponent();
      act(() => { unmount(); });
      expect(util.events.off).toHaveBeenCalledWith('joyride:increment', expect.any(Function));
    });
  });

  describe('useEffect — resetProductPicker', () => {
    it('calls resetProductPicker when eventTriggersIncrement=true', () => {
      const resetProductPicker = jest.fn();
      const tourSteps = [makeTourStep({ eventTriggersIncrement: true })];
      renderComponent({ tourSteps, resetProductPicker });
      expect(resetProductPicker).toHaveBeenCalled();
    });

    it('does not call resetProductPicker when eventTriggersIncrement=false', () => {
      const resetProductPicker = jest.fn();
      renderComponent({ resetProductPicker });
      expect(resetProductPicker).not.toHaveBeenCalled();
    });
  });

  describe('useEffect — map view change listener', () => {
    it('registers map view "change" listener when hasTargetCoordinates=true', () => {
      const tourSteps = [makeTourStep({ steps: [makeCoordStep()] })];
      renderComponent({ tourSteps });
      expect(mockViewOn).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('does not register map view listener when hasTargetCoordinates=false', () => {
      renderComponent(); // default steps have no targetCoordinates
      expect(mockViewOn).not.toHaveBeenCalled();
    });

    it('de-registers map view listener on unmount', () => {
      const tourSteps = [makeTourStep({ steps: [makeCoordStep()] })];
      const { unmount } = renderComponent({ tourSteps });
      act(() => { unmount(); });
      expect(mockViewUn).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });

  describe('useEffect — MutationObserver', () => {
    it('creates MutationObserver and observes body when run && projMatches && !isInitializing', () => {
      renderComponent(); // steps → run=true; proj matches; isInitializing→false via effect
      expect(global.MutationObserver).toHaveBeenCalled();
      expect(mockObserver.observe).toHaveBeenCalledWith(
        document.body,
        expect.objectContaining({ subtree: true, childList: true }),
      );
    });

    it('disconnects MutationObserver on unmount', () => {
      const { unmount } = renderComponent();
      act(() => { unmount(); });
      expect(mockObserver.disconnect).toHaveBeenCalled();
    });

    it('does not create MutationObserver when run=false (no steps)', () => {
      const tourSteps = [makeTourStep({ steps: [] })];
      renderComponent({ tourSteps });
      expect(global.MutationObserver).not.toHaveBeenCalled();
    });
  });

  describe('addPlaceholderElements / setPlaceholderLocation', () => {
    it('creates a placeholder span in body for steps with targetCoordinates', () => {
      const tourSteps = [makeTourStep({ steps: [makeCoordStep()] })];
      renderComponent({ tourSteps });
      expect(document.getElementById('jt-tour-target')).toBeInTheDocument();
    });

    it('sets absolute positioning on the placeholder span', () => {
      const tourSteps = [makeTourStep({ steps: [makeCoordStep()] })];
      renderComponent({ tourSteps });
      const span = document.getElementById('jt-tour-target');
      expect(span.style.position).toBe('absolute');
    });

    it('calls map.getPixelFromCoordinate with topLeft and bottomRight', () => {
      const tourSteps = [makeTourStep({ steps: [makeCoordStep()] })];
      renderComponent({ tourSteps });
      expect(mockGetPixelFromCoordinate).toHaveBeenCalledWith([0, 0]);
      expect(mockGetPixelFromCoordinate).toHaveBeenCalledWith([100, 100]);
    });

    it('skips placeholder creation when the target element already exists in DOM', () => {
      const existing = document.createElement('span');
      existing.id = 'jt-tour-target';
      document.body.appendChild(existing);

      const tourSteps = [makeTourStep({ steps: [makeCoordStep()] })];
      renderComponent({ tourSteps });

      // No duplicate should have been created
      expect(document.querySelectorAll('#jt-tour-target')).toHaveLength(1);
      existing.remove();
    });
  });

  describe('updateTargetsOnResize — triggered via joyrideStateCallback + requestAnimationFrame', () => {
    it('calls requestAnimationFrame when STEP_AFTER advances to a step with targetCoordinates', () => {
      const steps = [makeJoyrideStep(), makeCoordStep()];
      const tourSteps = [makeTourStep({ steps })];
      renderComponent({ tourSteps });
      fireJoyride({
        action: 'next', index: 0, type: 'step:after', status: 'running', lifecycle: 'ready',
      });
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it('calls getPixelFromCoordinate again when updateTargetsOnResize fires', () => {
      const steps = [makeJoyrideStep(), makeCoordStep()];
      const tourSteps = [makeTourStep({ steps })];
      renderComponent({ tourSteps });
      // Clear the initial calls from mount
      mockGetPixelFromCoordinate.mockClear();
      fireJoyride({
        action: 'next', index: 0, type: 'step:after', status: 'running', lifecycle: 'ready',
      });
      expect(mockGetPixelFromCoordinate).toHaveBeenCalled();
    });
  });

  describe('fallback overlay portal', () => {
    it('renders fallback overlay when run && overlayStarted && !hasJoyrideOverlay', () => {
      renderComponent();
      // LIFECYCLE.TOOLTIP sets overlayStarted=true; hasJoyrideOverlay stays false in jsdom
      fireJoyride({ action: 'next', index: 0, type: 'beacon', status: 'running', lifecycle: 'tooltip' });
      expect(document.querySelector('.react-joyride__overlay-fallback')).toBeInTheDocument();
    });

    it('does not render fallback overlay before overlayStarted=true', () => {
      renderComponent();
      expect(document.querySelector('.react-joyride__overlay-fallback')).not.toBeInTheDocument();
    });
  });

  describe('tourComplete cleanup', () => {
    it('renders without error when tourComplete=true', () => {
      expect(() => renderComponent({ tourComplete: true })).not.toThrow();
    });
  });
});
