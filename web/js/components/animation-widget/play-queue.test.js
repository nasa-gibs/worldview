/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, cleanup, act, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('./loading-indicator', () => {
  return function MockLoadingIndicator() {
    return <div data-testid="loading-indicator">Loading...</div>;
  };
});

jest.mock('reactstrap', () => ({
  Progress: ({ value }) => <div data-testid="progress-bar" data-value={String(value)} />,
}));

jest.mock('p-queue', () => {
  class MockPQueue {
    constructor() {
      this.size = 0;
      this.pending = 0;
    }

    add(fn) {
      return fn();
    }

    clear() {}
    onEmpty() {
      return Promise.resolve();
    }
  }

  const Timeout = class TimeoutError extends Error {};

  return {
    __esModule: true,
    default: MockPQueue,
    TimeoutError: Timeout,
  };
});

jest.mock('../../util/util', () => {
  const mocked = {
    dateAdd: jest.fn((date, interval, delta) => new Date(date.getTime() + 86400000)),
    objectLength: jest.fn((obj) => Object.keys(obj || {}).length),
    toISOStringSeconds: jest.fn((date) => (date ? date.toISOString() : '')),
    parseDateUTC: jest.fn((str) => new Date(str)),
  };

  return {
    __esModule: true,
    default: mocked,
    ...mocked,
  };
});

jest.mock('../../modules/date/util', () => ({
  getNextImageryDelta: jest.fn(() => new Date('2026-05-01T00:00:00Z')),
}));

const PlayQueue = require('./play-queue').default;
const { TimeoutError } = require('p-queue');
const { getNextImageryDelta } = jest.requireMock('../../modules/date/util');

describe('PlayQueue Component', () => {
  let defaultProps;
  let rafCallbacks;
  let nextRafId;
  let currentTime;
  let viewHandlers;
  let view;
  let selected;

  const flushRaf = (timestamp = currentTime) => {
    const callbacks = Array.from(rafCallbacks.values());
    rafCallbacks.clear();
    callbacks.forEach((cb) => cb(timestamp));
  };

  beforeAll(() => {
    rafCallbacks = new Map();
    nextRafId = 1;

    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      const id = nextRafId++;
      rafCallbacks.set(id, cb);
      return id;
    });

    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      rafCallbacks.delete(id);
    });

    if (!document.timeline) {
      document.timeline = { currentTime: 1000 };
    }
  });

  beforeEach(() => {
    jest.useFakeTimers();
    currentTime = 1000;
    jest.spyOn(performance, 'now').mockImplementation(() => currentTime);

    viewHandlers = {};
    view = {
      on: jest.fn((name, cb) => {
        viewHandlers[name] = cb;
      }),
      un: jest.fn(),
    };
    selected = {
      getView: jest.fn(() => view),
      on: jest.fn((name, cb) => {
        viewHandlers[name] = cb;
      }),
      un: jest.fn(),
    };

    defaultProps = {
      endDate: new Date('2026-05-10T00:00:00Z'),
      isMobile: false,
      isPlaying: true,
      promiseImageryForTime: jest.fn(() => Promise.resolve()),
      selectDate: jest.fn(),
      speed: 10,
      startDate: new Date('2026-05-01T00:00:00Z'),
      togglePlaying: jest.fn(),
      currentDate: new Date('2026-05-01T00:00:00Z'),
      delta: 1,
      interval: 'day',
      isLoopActive: true,
      onClose: jest.fn(),
      numberOfFrames: 10,
      snappedCurrentDate: new Date('2026-05-01T00:00:00Z'),
      isKioskModeActive: false,
      map: {
        ui: {
          selected,
        },
      },
      autoSelected: false,
      layers: [],
    };
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
    jest.clearAllTimers();
    // Fully drain RAF callbacks with a safety limit to prevent infinite loops
    let attempts = 0;
    while (rafCallbacks.size > 0 && attempts < 10) {
      flushRaf();
      attempts++;
    }
    rafCallbacks.clear();
    jest.useRealTimers();
  });

  afterAll(() => {
    // Reset state for subsequent test runs
    rafCallbacks.clear();
    nextRafId = 1;
    currentTime = 1000;
    jest.restoreAllMocks();
  });

  const advanceAnimation = async (ms) => {
    currentTime += ms;
    await act(async () => {
      jest.advanceTimersByTime(ms);
      flushRaf(currentTime);
      await Promise.resolve();
    });
  };

  const renderPlayQueue = async (props = {}) => {
    let result;

    await act(async () => {
      result = render(<PlayQueue {...defaultProps} {...props} />);
      await Promise.resolve();
    });

    return result;
  };

  it('renders the loading indicator while buffering frames when there is only one frame', async () => {
    await act(async () => {
      render(<PlayQueue {...defaultProps} isPlaying={false} numberOfFrames={1} />);
      await Promise.resolve();
    });

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('updates the loop active ref on prop change without throwing', async () => {
    const { rerender } = await renderPlayQueue({ isLoopActive: false });
    rerender(<PlayQueue {...defaultProps} isLoopActive />);
    expect(defaultProps.togglePlaying).not.toHaveBeenCalled();
  });

  it('handles speed changes and buffer size calculations on rerender', async () => {
    const { rerender } = await renderPlayQueue({ speed: 0.5 });
    rerender(<PlayQueue {...defaultProps} speed={2} />);
    expect(defaultProps.promiseImageryForTime).toHaveBeenCalled();
  });

  it('cleans up registered event listeners on unmount', async () => {
    const { unmount } = await renderPlayQueue({ isPlaying: false });
    unmount();

    expect(selected.getView).toHaveBeenCalled();
    expect(view.un).toHaveBeenCalledWith('propertychange', expect.any(Function));
    expect(selected.un).toHaveBeenCalledWith('moveend', expect.any(Function));
  });

  it('handles TimeoutError during imagery preload', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    defaultProps.promiseImageryForTime.mockRejectedValue(new TimeoutError('Loading timed out'));

    await act(async () => {
      render(<PlayQueue {...defaultProps} />);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Imagery loading timed out'));
    });

    consoleSpy.mockRestore();
  });

  it('executes the animation loop and advances frames', async () => {
    await renderPlayQueue();

    await advanceAnimation(5000);
    await advanceAnimation(5000);

    expect(defaultProps.selectDate).toHaveBeenCalled();
  });

  it('renders progress bar on mobile when animation starts', async () => {
    await renderPlayQueue({ isMobile: true, speed: 2 });

    await waitFor(() => {
      expect(screen.queryByTestId('progress-bar')).toBeInTheDocument();
    });

    expect(screen.getByTestId('progress-bar')).toHaveAttribute('data-value');
  });

  it('uses autoSelected date calculation when enabled', async () => {
    await renderPlayQueue({ autoSelected: true, layers: [{}] });
    expect(getNextImageryDelta).toHaveBeenCalled();
  });

  it('selects the startDate immediately when there is only one frame', async () => {
    await renderPlayQueue({ numberOfFrames: 1 });

    expect(defaultProps.selectDate).toHaveBeenCalledWith(defaultProps.startDate);
    expect(defaultProps.togglePlaying).toHaveBeenCalled();
  });

  it('stops playing and toggles off when loop is disabled and endDate is reached', async () => {
    await renderPlayQueue({ isLoopActive: false, snappedCurrentDate: defaultProps.endDate });

    await advanceAnimation(5000);
    await advanceAnimation(5000);

    expect(defaultProps.togglePlaying).toHaveBeenCalled();
  });

  it('loops back to startDate when reaching endDate with loop active', async () => {
    await renderPlayQueue({ isLoopActive: true, snappedCurrentDate: defaultProps.endDate });

    await advanceAnimation(5000);
    await advanceAnimation(5000);

    expect(defaultProps.togglePlaying).not.toHaveBeenCalled();
    expect(defaultProps.selectDate).toHaveBeenCalledWith(defaultProps.startDate);
  });
});
