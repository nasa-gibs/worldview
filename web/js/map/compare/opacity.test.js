import { createRoot } from 'react-dom/client';
import Opacity from './opacity'; // Adjust the import path if necessary
import { getCompareDates } from '../../modules/compare/selectors';
import util from '../../util/util';
import { COMPARE_MOVE_END } from '../../util/constants';

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(),
}));

jest.mock('../../components/compare/opacity-slider', () => () => <div data-testid="opacity-slider" />);

jest.mock('../../modules/compare/selectors', () => ({
  getCompareDates: jest.fn(),
}));

jest.mock('../../util/util', () => ({
  events: {
    trigger: jest.fn(),
  },
}));

describe('Opacity Compare Class', () => {
  let mockMap;
  let mockStore;
  let mockFirstLayer;
  let mockSecondLayer;
  let mockRoot;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Setup DOM
    document.body.innerHTML = '<div id="wv-map"></div>';

    // Mock createRoot returns
    mockRoot = {
      render: jest.fn(),
      unmount: jest.fn(),
    };
    createRoot.mockReturnValue(mockRoot);

    // Mock Layers
    mockFirstLayer = { setOpacity: jest.fn() };
    mockSecondLayer = { setOpacity: jest.fn() };

    // Mock Map
    mockMap = {
      getLayers: jest.fn(() => ({
        getArray: jest.fn(() => [mockFirstLayer, mockSecondLayer]),
      })),
    };

    // Mock Store
    mockStore = {
      getState: jest.fn(() => ({})),
    };

    // Mock Selectors
    getCompareDates.mockReturnValue({ dateA: '2023-01-01', dateB: '2023-01-02' });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes correctly and sets initial layer opacities', () => {
    const opacityInstance = new Opacity(mockMap, mockStore, {}, 75);

    expect(createRoot).toHaveBeenCalledWith(opacityInstance.sliderCase);
    expect(getCompareDates).toHaveBeenCalled();
    expect(opacityInstance.dateA).toBe('2023-01-01');
    expect(opacityInstance.dateB).toBe('2023-01-02');

    // oninput is called during create
    expect(mockFirstLayer.setOpacity).toHaveBeenCalledWith(0.25); // 1 - 0.75
    expect(mockSecondLayer.setOpacity).toHaveBeenCalledWith(0.75);
    expect(util.events.trigger).toHaveBeenCalledWith(COMPARE_MOVE_END, 75);
  });

  it('uses default value if valueOverride is not provided', () => {
    // eslint-disable-next-line no-unused-vars
    const opacityInstance = new Opacity(mockMap, mockStore, {});

    expect(mockFirstLayer.setOpacity).toHaveBeenCalledWith(0.25);
    expect(mockSecondLayer.setOpacity).toHaveBeenCalledWith(0.75);
  });

  it('updates dates and re-renders on update()', () => {
    const opacityInstance = new Opacity(mockMap, mockStore, {}, 50);

    getCompareDates.mockReturnValue({ dateA: '2023-02-01', dateB: '2023-02-02' });
    opacityInstance.update(mockStore);

    expect(opacityInstance.dateA).toBe('2023-02-01');
    expect(opacityInstance.dateB).toBe('2023-02-02');
    expect(mockRoot.render).toHaveBeenCalledTimes(2); // 1 for create, 1 for update
  });

  it('renders slider into the DOM map container', () => {
    const opacityInstance = new Opacity(mockMap, mockStore, {}, 50);
    const mapCase = document.getElementById('wv-map');

    expect(mapCase.contains(opacityInstance.sliderCase)).toBe(true);
    expect(mockRoot.render).toHaveBeenCalled();
  });

  it('adjusts opacities and triggers event on oninput()', () => {
    const opacityInstance = new Opacity(mockMap, mockStore, {}, 50);

    opacityInstance.oninput(30);

    expect(mockFirstLayer.setOpacity).toHaveBeenCalledWith(0.7); // 1 - 0.3
    expect(mockSecondLayer.setOpacity).toHaveBeenCalledWith(0.3);
    expect(util.events.trigger).toHaveBeenCalledWith(COMPARE_MOVE_END, 30);
  });

  it('destroys correctly and unmounts react root asynchronously', () => {
    const opacityInstance = new Opacity(mockMap, mockStore, {}, 50);
    const mapCase = document.getElementById('wv-map');

    expect(mapCase.contains(opacityInstance.sliderCase)).toBe(true);

    opacityInstance.destroy();

    // Immediate state changes
    expect(opacityInstance.isDestroyed).toBe(true);
    expect(opacityInstance.root).toBeNull();

    // Render should abort if destroyed
    opacityInstance.renderSlider([mockFirstLayer, mockSecondLayer]);
    expect(mockRoot.render).toHaveBeenCalledTimes(1); // Only the initial render from constructor

    // DOM and unmount handled in setTimeout
    jest.runAllTimers();

    expect(mockRoot.unmount).toHaveBeenCalled();
    expect(mapCase.contains(opacityInstance.sliderCase)).toBe(false);
  });

  it('prevents multiple destruction calls', () => {
    const opacityInstance = new Opacity(mockMap, mockStore, {}, 50);

    opacityInstance.destroy();
    opacityInstance.destroy(); // Second call

    jest.runAllTimers();
    expect(mockRoot.unmount).toHaveBeenCalledTimes(1);
  });
});
