import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('../../map/util', () => ({
  saveRotation: jest.fn(),
}));
jest.mock('../../modules/map/actions', () => ({
  refreshRotation: jest.fn((r) => ({ type: 'REFRESH_ROTATION', payload: r })),
}));
jest.mock('../util/hover-tooltip', () => () => null);
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}));
jest.mock('lodash', () => ({
  debounce: (fn) => fn,
}));

let mockMap;
let mockProj;
let mockRotation;
let mockIsDistractionFreeModeActive;
let mockIsMobile;
const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: (selector) => selector({
    map: { ui: { selected: mockMap }, rotation: mockRotation },
    proj: mockProj,
    ui: { isDistractionFreeModeActive: mockIsDistractionFreeModeActive },
    screenSize: { isMobileDevice: mockIsMobile },
  }),
  useDispatch: () => mockDispatch,
  shallowEqual: (a, b) => a === b,
}));

import Rotation from './rotation';

const makeMockMap = () => {
  const animate = jest.fn();
  const getRotation = jest.fn(() => 0);
  const getView = jest.fn(() => ({ animate, getRotation }));
  return { getView, animate };
};

const renderRotation = () => render(<Rotation />);

describe('Rotation component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMap = makeMockMap();
    mockProj = { id: 'arctic' };
    mockRotation = 0;
    mockIsDistractionFreeModeActive = false;
    mockIsMobile = false;
  });

  describe('visibility', () => {
    it('renders rotation buttons for polar projection', () => {
      const { container } = renderRotation();
      expect(container.firstChild).toBeInTheDocument();
    });

    it('does not render for geographic projection', () => {
      mockProj = { id: 'geographic' };
      const { container } = renderRotation();
      expect(container.firstChild).toBeNull();
    });

    it('does not render for webmerc projection', () => {
      mockProj = { id: 'webmerc' };
      const { container } = renderRotation();
      expect(container.firstChild).toBeNull();
    });

    it('does not render when distraction free mode is active', () => {
      mockIsDistractionFreeModeActive = true;
      const { container } = renderRotation();
      expect(container.firstChild).toBeNull();
    });

    it('renders for antarctic projection', () => {
      mockProj = { id: 'antarctic' };
      const { container } = renderRotation();
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('button classes', () => {
    it('uses mobile class when isMobile is true', () => {
      mockIsMobile = true;
      const { container } = renderRotation();
      expect(container.firstChild).toHaveClass('wv-rotation-buttons-mobile');
    });

    it('uses desktop class when isMobile is false', () => {
      mockIsMobile = false;
      const { container } = renderRotation();
      expect(container.firstChild).toHaveClass('wv-rotation-buttons');
    });
  });

  describe('rotation display', () => {
    it('shows 0 degrees when rotation is 0 radians', () => {
      mockRotation = 0;
      const { getByRole } = renderRotation();
      const resetButton = getByRole('button', { name: /0/i });
      expect(resetButton).toBeInTheDocument();
    });

    it('shows correct degrees when rotation is Math.PI (180 degrees)', () => {
      mockRotation = Math.PI;
      const { container } = renderRotation();
      const resetButton = container.querySelector('.wv-map-reset-rotation');
      expect(resetButton.textContent).toBe('180');
    });
  });

  describe('button interaction', () => {
    it('renders left rotate button', () => {
      const { container } = renderRotation();
      expect(container.querySelector('.wv-map-rotate-left')).toBeInTheDocument();
    });

    it('renders right rotate button', () => {
      const { container } = renderRotation();
      expect(container.querySelector('.wv-map-rotate-right')).toBeInTheDocument();
    });

    it('renders reset rotation button', () => {
      const { container } = renderRotation();
      expect(container.querySelector('.wv-map-reset-rotation')).toBeInTheDocument();
    });

    it('calls map.getView().animate on reset button mousedown', () => {
      const { container } = renderRotation();
      const resetBtn = container.querySelector('.wv-map-reset-rotation');
      fireEvent.mouseDown(resetBtn);
      expect(mockMap.getView().animate).toHaveBeenCalledWith({ duration: 500, rotation: 0 });
    });

    it('calls map.getView().animate on left rotate mousedown', () => {
      const { container } = renderRotation();
      const leftBtn = container.querySelector('.wv-map-rotate-left');
      act(() => { fireEvent.mouseDown(leftBtn); });
      expect(mockMap.getView().animate).toHaveBeenCalled();
    });

    it('calls map.getView().animate on right rotate mousedown', () => {
      const { container } = renderRotation();
      const rightBtn = container.querySelector('.wv-map-rotate-right');
      act(() => { fireEvent.mouseDown(rightBtn); });
      expect(mockMap.getView().animate).toHaveBeenCalled();
    });

    it('calls clearInterval on mouseup of rotate left', () => {
      const clearIntervalSpy = jest.spyOn(window, 'clearInterval');
      const { container } = renderRotation();
      const leftBtn = container.querySelector('.wv-map-rotate-left');
      act(() => { fireEvent.mouseDown(leftBtn); });
      fireEvent.mouseUp(leftBtn);
      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });

    it('calls clearInterval on mouseout of rotate right', () => {
      const clearIntervalSpy = jest.spyOn(window, 'clearInterval');
      const { container } = renderRotation();
      const rightBtn = container.querySelector('.wv-map-rotate-right');
      act(() => { fireEvent.mouseDown(rightBtn); });
      fireEvent.mouseOut(rightBtn);
      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });

    it('stops propagation on mouse move', () => {
      const { container } = renderRotation();
      const leftBtn = container.querySelector('.wv-map-rotate-left');
      const event = new MouseEvent('mousemove', { bubbles: true });
      const stopPropagation = jest.spyOn(event, 'stopPropagation');
      leftBtn.dispatchEvent(event);
      expect(stopPropagation).toHaveBeenCalled();
    });
  });
});
