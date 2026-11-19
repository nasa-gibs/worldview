import mapCompare from './compare'; // Update with the actual path
import Swipe from './swipe';
import Opacity from './opacity';
import util from '../../util/util';
import { setValue } from '../../modules/compare/actions';
import { COMPARE_MOVE_START, COMPARE_MOVE_END } from '../../util/constants';

jest.mock('./swipe');
jest.mock('./opacity');
jest.mock('../../modules/compare/actions', () => ({
  setValue: jest.fn(),
}));
jest.mock('../../util/util', () => {
  const listeners = {};
  return {
    events: {
      on: jest.fn((event, callback) => {
        listeners[event] = callback;
      }),
      trigger: (event, payload) => {
        if (listeners[event]) listeners[event](payload);
      },
    },
    browser: {
      mobileAndTabletDevice: false,
    },
  };
});

describe('mapCompare', () => {
  let store;
  let mapMock;

  beforeEach(() => {
    jest.clearAllMocks();

    store = {
      dispatch: jest.fn(),
      getState: jest.fn(() => ({
        proj: { selected: 'EPSG:3857' },
        compare: { value: 75 },
      })),
    };

    mapMock = {};

    Swipe.mockImplementation(() => ({
      update: jest.fn(),
      destroy: jest.fn(),
      getSwipeOffset: jest.fn(() => 100),
    }));

    Opacity.mockImplementation(() => ({
      update: jest.fn(),
      destroy: jest.fn(),
    }));
  });

  it('initializes and sets up event listeners correctly', () => {
    const instance = mapCompare(store);

    expect(util.events.on).toHaveBeenCalledWith(COMPARE_MOVE_START, expect.any(Function));
    expect(util.events.on).toHaveBeenCalledWith(COMPARE_MOVE_END, expect.any(Function));

    // Trigger START
    util.events.trigger(COMPARE_MOVE_START);
    expect(instance.dragging).toBe(true);

    // Trigger END
    util.events.trigger(COMPARE_MOVE_END, 40);
    expect(instance.dragging).toBe(false);
    expect(instance.value).toBe(40);
    expect(setValue).toHaveBeenCalledWith(40);
    expect(store.dispatch).toHaveBeenCalled();
  });

  it('creates a new comparison instance', () => {
    const instance = mapCompare(store);
    instance.create(mapMock, 'swipe');

    expect(Swipe).toHaveBeenCalled();
    expect(instance.active).toBe(true);
    expect(instance.value).toBe(75);
  });

  it('updates an existing comparison instance if mode and state are the same', () => {
    const instance = mapCompare(store);
    instance.create(mapMock, 'swipe');

    const mockSwipeInstance = Swipe.mock.results[0].value;

    // Call create again with same mode and state
    instance.create(mapMock, 'swipe');
    expect(mockSwipeInstance.update).toHaveBeenCalledWith(store);
  });

  it('destroys old instance and creates new one if mode changes', () => {
    const instance = mapCompare(store);
    instance.create(mapMock, 'swipe');

    const mockSwipeInstance = Swipe.mock.results[0].value;

    instance.create(mapMock, 'opacity');
    expect(mockSwipeInstance.destroy).toHaveBeenCalled();
    expect(Opacity).toHaveBeenCalled();
  });

  it('calls update on comparison if it exists', () => {
    const instance = mapCompare(store);
    instance.create(mapMock, 'swipe');

    const mockSwipeInstance = Swipe.mock.results[0].value;
    const groupMock = {};
    instance.update(groupMock);

    expect(mockSwipeInstance.update).toHaveBeenCalledWith(store, groupMock);
  });

  it('returns offset only for swipe mode', () => {
    const instance = mapCompare(store);

    expect(instance.getOffset()).toBeNull(); // No comparison yet

    instance.create(mapMock, 'opacity');
    expect(instance.getOffset()).toBeNull(); // Wrong mode

    instance.create(mapMock, 'swipe');
    expect(instance.getOffset()).toBe(100); // Swipe mode
  });

  it('destroys the comparison properly', () => {
    const instance = mapCompare(store);
    instance.create(mapMock, 'swipe');

    const mockSwipeInstance = Swipe.mock.results[0].value;

    instance.destroy();

    expect(mockSwipeInstance.destroy).toHaveBeenCalled();
    expect(instance.value).toBe(50);
    expect(setValue).toHaveBeenCalledWith(50);
    expect(store.dispatch).toHaveBeenCalled();
    expect(instance.active).toBe(false);
  });
});
