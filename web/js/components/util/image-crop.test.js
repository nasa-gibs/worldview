/* eslint-disable react/jsx-props-no-spreading */
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Crop from './image-crop';

// Capture latest ReactCrop props so tests can invoke callbacks directly
const reactCropProps = {};

jest.mock('react-image-crop', () => ({
  __esModule: true,
  default: (props) => {
    Object.assign(reactCropProps, props);
    return (
      <div
        data-testid="react-crop"
        data-background={props.style?.background}
        data-zindex={String(props.style?.zIndex)}
        data-keep-selection={String(props.keepSelection)}
      >
        {props.children}
      </div>
    );
  },
}));

// Render portal children inline so they appear in the normal DOM tree
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node) => node,
}));

const TRANSPARENT_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const defaultProps = {
  onChange: jest.fn(),
  onClose: jest.fn(),
  onDragStop: jest.fn(),
  x: 20,
  y: 10,
  width: 30,
  height: 10,
};

const renderComponent = (props = {}) => render(
  <Crop {...defaultProps} {...props} />,
);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Crop (image-crop)', () => {
  describe('render', () => {
    it('renders without throwing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('renders the ReactCrop element', () => {
      renderComponent();
      expect(screen.getByTestId('react-crop')).toBeInTheDocument();
    });

    it('renders the transparent gif img', () => {
      renderComponent();
      expect(screen.getByRole('img')).toHaveAttribute('src', TRANSPARENT_GIF);
    });

    it('passes maxWidth and maxHeight to the img style', () => {
      renderComponent({ maxWidth: 500, maxHeight: 400 });
      const img = screen.getByRole('img');
      expect(img).toHaveStyle({ width: '500px', height: '400px' });
    });
  });

  describe('ReactCrop props', () => {
    it('passes keepSelection=true', () => {
      renderComponent({ keepSelection: true });
      expect(screen.getByTestId('react-crop')).toHaveAttribute('data-keep-selection', 'true');
    });

    it('passes keepSelection=false when not set', () => {
      renderComponent({ keepSelection: false });
      expect(screen.getByTestId('react-crop')).toHaveAttribute('data-keep-selection', 'false');
    });

    it('passes zIndex in style', () => {
      renderComponent({ zIndex: 10 });
      expect(screen.getByTestId('react-crop')).toHaveAttribute('data-zindex', '10');
    });

    it('sets background to "none" when initial crop has width and height', () => {
      renderComponent({ width: 30, height: 10 });
      expect(screen.getByTestId('react-crop')).toHaveAttribute('data-background', 'none');
    });

    it('sets background to rgba(0,0,0,0.5) when initial crop width is 0', () => {
      renderComponent({ width: 0, height: 10 });
      expect(screen.getByTestId('react-crop')).toHaveAttribute('data-background', 'rgba(0, 0, 0, 0.5)');
    });

    it('sets background to rgba(0,0,0,0.5) when initial crop height is 0', () => {
      renderComponent({ width: 30, height: 0 });
      expect(screen.getByTestId('react-crop')).toHaveAttribute('data-background', 'rgba(0, 0, 0, 0.5)');
    });
  });

  describe('useEffect — crop state syncs with props', () => {
    it('updates background to rgba after width prop changes to 0', () => {
      const { rerender } = renderComponent({ width: 30, height: 10 });
      expect(screen.getByTestId('react-crop')).toHaveAttribute('data-background', 'none');

      act(() => {
        rerender(<Crop {...defaultProps} width={0} />);
      });

      expect(screen.getByTestId('react-crop')).toHaveAttribute('data-background', 'rgba(0, 0, 0, 0.5)');
    });

    it('updates background to "none" after width prop changes from 0 to positive', () => {
      const { rerender } = renderComponent({ width: 0, height: 10 });
      expect(screen.getByTestId('react-crop')).toHaveAttribute('data-background', 'rgba(0, 0, 0, 0.5)');

      act(() => {
        rerender(<Crop {...defaultProps} width={40} />);
      });

      expect(screen.getByTestId('react-crop')).toHaveAttribute('data-background', 'none');
    });
  });

  describe('onDrag (onChange)', () => {
    it('calls onChange when both width and height are truthy', () => {
      const onChange = jest.fn();
      renderComponent({ onChange });
      const boundaries = { x: 5, y: 5, width: 20, height: 15 };
      act(() => { reactCropProps.onChange(boundaries); });
      expect(onChange).toHaveBeenCalledWith(boundaries);
    });

    it('does not call onChange when width is 0', () => {
      const onChange = jest.fn();
      renderComponent({ onChange });
      act(() => { reactCropProps.onChange({ x: 5, y: 5, width: 0, height: 15 }); });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not call onChange when height is 0', () => {
      const onChange = jest.fn();
      renderComponent({ onChange });
      act(() => { reactCropProps.onChange({ x: 5, y: 5, width: 20, height: 0 }); });
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('onFinishDrag (onComplete)', () => {
    it('calls onDragStop when dimensions are positive and a value changed', () => {
      const onDragStop = jest.fn();
      // Initial prevCrop: {x:20, y:10, width:30, height:10}
      renderComponent({ onDragStop });
      const boundaries = { x: 5, y: 10, width: 30, height: 10 };
      act(() => { reactCropProps.onComplete(boundaries); });
      expect(onDragStop).toHaveBeenCalledWith(boundaries);
    });

    it('calls onClose when width is 0', () => {
      const onClose = jest.fn();
      renderComponent({ onClose });
      act(() => { reactCropProps.onComplete({ x: 5, y: 10, width: 0, height: 10 }); });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when height is 0', () => {
      const onClose = jest.fn();
      renderComponent({ onClose });
      act(() => { reactCropProps.onComplete({ x: 5, y: 10, width: 20, height: 0 }); });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when crop values are unchanged from initial', () => {
      const onClose = jest.fn();
      // Initial prevCrop: {x:20, y:10, width:30, height:10}
      renderComponent({ onClose });
      act(() => { reactCropProps.onComplete({ x: 20, y: 10, width: 30, height: 10 }); });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onDragStop when crop values are unchanged', () => {
      const onDragStop = jest.fn();
      renderComponent({ onDragStop });
      act(() => { reactCropProps.onComplete({ x: 20, y: 10, width: 30, height: 10 }); });
      expect(onDragStop).not.toHaveBeenCalled();
    });
  });

  describe('default parameter fallbacks', () => {
    it('renders with only onChange provided (all other props use defaults)', () => {
      expect(() => render(<Crop onChange={jest.fn()} />)).not.toThrow();
    });

    it('uses default onClose (() => {}) when onClose is not provided and close is triggered', () => {
      render(<Crop onChange={jest.fn()} onDragStop={jest.fn()} />);
      // width=0 triggers the onClose branch; default is () => {} so no throw
      expect(() => act(() => {
        reactCropProps.onComplete({ x: 20, y: 10, width: 0, height: 10 });
      })).not.toThrow();
    });

    it('uses default onDragStop (() => {}) when onDragStop is not provided and drag is detected', () => {
      render(<Crop onChange={jest.fn()} onClose={jest.fn()} />);
      // x differs from prevCrop initial (x=20) → triggers onDragStop branch
      expect(() => act(() => {
        reactCropProps.onComplete({ x: 5, y: 10, width: 30, height: 10 });
      })).not.toThrow();
    });
  });

  describe('showCoordinates / RenderCoordinates', () => {
    const coordProps = {
      showCoordinates: true,
      coordinates: { topRight: '10°N 20°E', bottomLeft: '5°S 15°W' },
      topRightStyle: { width: 80 },
      bottomLeftStyle: { width: 80 },
    };

    it('does not render coordinate divs when showCoordinates is false', () => {
      renderComponent({ showCoordinates: false });
      expect(document.getElementById('wv-image-top')).not.toBeInTheDocument();
      expect(document.getElementById('wv-image-bottom')).not.toBeInTheDocument();
    });

    it('renders both coordinate divs when showCoordinates=true and width >= 50', () => {
      renderComponent(coordProps);
      expect(document.getElementById('wv-image-top')).toBeInTheDocument();
      expect(document.getElementById('wv-image-bottom')).toBeInTheDocument();
    });

    it('renders topRight coordinate text', () => {
      renderComponent(coordProps);
      expect(screen.getByText('10°N 20°E')).toBeInTheDocument();
    });

    it('renders bottomLeft coordinate text', () => {
      renderComponent(coordProps);
      expect(screen.getByText('5°S 15°W')).toBeInTheDocument();
    });

    it('renders nothing when bottomLeftStyle.width < 50', () => {
      renderComponent({
        ...coordProps,
        topRightStyle: { width: 30 },
        bottomLeftStyle: { width: 30 },
      });
      expect(document.getElementById('wv-image-top')).not.toBeInTheDocument();
      expect(document.getElementById('wv-image-bottom')).not.toBeInTheDocument();
    });

    it('applies topRightStyle to the top coordinate div', () => {
      renderComponent(coordProps);
      expect(document.getElementById('wv-image-top')).toHaveStyle({ width: '80px' });
    });

    it('applies bottomLeftStyle to the bottom coordinate div', () => {
      renderComponent(coordProps);
      expect(document.getElementById('wv-image-bottom')).toHaveStyle({ width: '80px' });
    });
  });
});
