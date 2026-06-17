/* eslint-disable react/jsx-props-no-spreading */
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import OlOverlay from 'ol/Overlay';
import LineText from './text';
import * as compareSelectors from '../../modules/compare/selectors';
import util from '../../util/util';

jest.mock('ol/Overlay');
jest.mock('../../util/util');
jest.mock('../../modules/compare/selectors');

describe('LineText Component', () => {
  const mockMap = {
    addOverlay: jest.fn(),
  };

  const defaultProps = {
    active: true,
    date: new Date('2023-01-15'),
    x: 100,
    isCompareActive: false,
    isLeft: false,
    map: mockMap,
    textCoords: [100, 200],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    OlOverlay.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Constructor & State', () => {
    it('should initialize with correct state', () => {
      const instance = new LineText(defaultProps);

      expect(instance.state.overlay).toBe('');
      expect(instance.nodeRef).toBeDefined();
      expect(instance.nodeRef.current).toBeNull();
    });
  });

  describe('getDateText', () => {
    it('should return comparison text when compare is active (left)', () => {
      const props = { ...defaultProps, isCompareActive: true, isLeft: true };
      const instance = new LineText(props);
      const result = instance.getDateText();

      expect(result).toEqual({
        dateLeft: '+ 1 day',
        dateRight: '',
      });
    });

    it('should return comparison text when compare is active (right)', () => {
      const props = { ...defaultProps, isCompareActive: true, isLeft: false };
      const instance = new LineText(props);
      const result = instance.getDateText();

      expect(result).toEqual({
        dateLeft: '',
        dateRight: '- 1 day',
      });
    });

    it('should return dates from selector when compare is not active', () => {
      const mockDate = new Date('2023-01-15');
      const mockDateA = '2023-01-16';
      const mockDateB = '2023-01-15';
      const props = { ...defaultProps, date: mockDate, isCompareActive: false };

      util.dateAdd.mockReturnValue(new Date('2023-01-16'));
      compareSelectors.getCompareDates.mockReturnValue({
        dateA: mockDateA,
        dateB: mockDateB,
      });

      const instance = new LineText(props);
      const result = instance.getDateText();

      expect(util.dateAdd).toHaveBeenCalledWith(mockDate, 'day', 1);
      expect(compareSelectors.getCompareDates).toHaveBeenCalled();
      expect(result).toEqual({
        dateLeft: mockDateA,
        dateRight: mockDateB,
      });
    });
  });

  describe('render', () => {
    it('should render SVG with correct styling', () => {
      const { container } = render(<LineText {...defaultProps} />);
      const svg = container.querySelector('svg.dateline-text');

      expect(svg).toBeInTheDocument();
      expect(svg).toHaveStyle('position: absolute');
      expect(svg).toHaveStyle('pointer-events: none');
    });

    it('should render text elements when active is true', () => {
      const props = { ...defaultProps, active: true };
      const { container } = render(<LineText {...props} />);

      expect(container.querySelectorAll('text')).toHaveLength(2);
      expect(container.querySelectorAll('rect')).toHaveLength(2);
    });

    it('should not render text elements when active is false', () => {
      const props = { ...defaultProps, active: false };
      const { container } = render(<LineText {...props} />);

      expect(container.querySelectorAll('text')).toHaveLength(0);
      expect(container.querySelectorAll('rect')).toHaveLength(0);
    });

    it('should adjust text width for compare mode', () => {
      const props = { ...defaultProps, isCompareActive: true, active: true };
      compareSelectors.getCompareDates.mockReturnValue({
        dateA: 'dateA',
        dateB: 'dateB',
      });

      const { container } = render(<LineText {...props} />);
      const rects = container.querySelectorAll('rect');

      expect(Number(rects[0].getAttribute('width'))).toBe(70);
      expect(Number(rects[1].getAttribute('width'))).toBe(70);
    });

    it('should set correct text opacity based on date values', () => {
      compareSelectors.getCompareDates.mockReturnValue({
        dateA: 'dateA',
        dateB: 'dateB',
      });

      const { container } = render(<LineText {...defaultProps} active />);
      const texts = container.querySelectorAll('text');

      expect(texts[0].getAttribute('opacity')).toBe('1');
      expect(texts[1].getAttribute('opacity')).toBe('1');
    });

    it('should set zero opacity when date is null', () => {
      compareSelectors.getCompareDates.mockReturnValue({
        dateA: null,
        dateB: null,
      });

      const { container } = render(<LineText {...defaultProps} active />);
      const texts = container.querySelectorAll('text');

      expect(texts[0].getAttribute('opacity')).toBe('0');
      expect(texts[1].getAttribute('opacity')).toBe('0');
    });

    it('should position second rect correctly', () => {
      compareSelectors.getCompareDates.mockReturnValue({
        dateA: 'dateA',
        dateB: 'dateB',
      });

      const { container } = render(<LineText {...defaultProps} active />);
      const rects = container.querySelectorAll('rect');
      const texts = container.querySelectorAll('text');

      expect(Number(rects[1].getAttribute('x'))).toBe(134);
      expect(Number(texts[1].getAttribute('x'))).toBe(140);
    });

    it('should use correct SVG transform based on widths', () => {
      const props = { ...defaultProps, isCompareActive: false };
      const { container } = render(<LineText {...props} />);
      const svg = container.querySelector('svg');

      expect(svg.style.transform).toContain('translateX');
    });

    it('should use shorter widths in compare mode for transform', () => {
      const props = { ...defaultProps, isCompareActive: true };
      const { container } = render(<LineText {...props} />);
      const svg = container.querySelector('svg');

      expect(svg.style.transform).toBe('translateX(-85px)');
    });
  });

  describe('PropTypes', () => {
    it('should have correct propTypes defined', () => {
      expect(LineText.propTypes).toBeDefined();
      expect(LineText.propTypes.active).toBeDefined();
      expect(LineText.propTypes.date).toBeDefined();
      expect(LineText.propTypes.x).toBeDefined();
      expect(LineText.propTypes.isCompareActive).toBeDefined();
      expect(LineText.propTypes.isLeft).toBeDefined();
      expect(LineText.propTypes.map).toBeDefined();
      expect(LineText.propTypes.textCoords).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should handle full lifecycle with compare mode', () => {
      compareSelectors.getCompareDates.mockReturnValue({
        dateA: 'dateA',
        dateB: 'dateB',
      });

      const mockOverlay = {
        setPosition: jest.fn(),
      };
      OlOverlay.mockImplementation(() => mockOverlay);

      const { container, rerender } = render(<LineText {...defaultProps} isCompareActive />);

      expect(container.querySelectorAll('text')).toHaveLength(2);
      expect(mockOverlay.setPosition).toHaveBeenCalled();

      rerender(<LineText {...defaultProps} isCompareActive x={200} textCoords={[200, 250]} />);
      expect(mockOverlay.setPosition).toHaveBeenLastCalledWith([200, 250]);
    });

    it('should handle null date gracefully', () => {
      compareSelectors.getCompareDates.mockReturnValue({
        dateA: null,
        dateB: null,
      });

      const props = { ...defaultProps, date: null, active: true };
      const { container } = render(<LineText {...props} />);

      const texts = container.querySelectorAll('text');
      expect(texts[0].getAttribute('opacity')).toBe('0');
      expect(texts[1].getAttribute('opacity')).toBe('0');
    });

    it('should handle rect opacity based on date presence', () => {
      compareSelectors.getCompareDates.mockReturnValue({
        dateA: '2023-01-16',
        dateB: null,
      });

      const { container } = render(<LineText {...defaultProps} active />);
      const rects = container.querySelectorAll('rect');

      expect(rects[0].getAttribute('opacity')).toBe('0.85');
      expect(rects[1].getAttribute('opacity')).toBe('0');
    });
  });
});
