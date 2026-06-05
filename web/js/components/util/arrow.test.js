/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Arrow from './arrow';

jest.mock('@edsc/earthdata-react-icons/horizon-design-system/hds/ui', () => ({
  ArrowFilledUp: ({ className, size }) => (
    <span data-testid="arrow-icon" className={className} data-size={size} />
  ),
}));

const defaultProps = {
  onClick: jest.fn(),
  type: 'day',
  direction: 'up',
  isKioskModeActive: false,
  arrowSize: '16px',
};

const renderComponent = (props = {}) => render(
  <Arrow {...defaultProps} {...props} />,
);

describe('Arrow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('button element', () => {
    it('renders a button', () => {
      renderComponent();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('button has type="button"', () => {
      renderComponent();
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('sets data-interval to the type prop', () => {
      renderComponent({ type: 'month' });
      expect(screen.getByRole('button')).toHaveAttribute('data-interval', 'month');
    });
  });

  describe('aria-label', () => {
    it('sets aria-label to "Increment {type}" when direction is "up"', () => {
      renderComponent({ direction: 'up', type: 'day' });
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Increment day');
    });

    it('sets aria-label to "Decrement {type}" when direction is "down"', () => {
      renderComponent({ direction: 'down', type: 'year' });
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Decrement year');
    });

    it('sets aria-label to "Decrement {type}" for non-up direction', () => {
      renderComponent({ direction: 'left', type: 'hour' });
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Decrement hour');
    });
  });

  describe('className — kiosk mode', () => {
    it('applies "d-none" when isKioskModeActive is true', () => {
      renderComponent({ isKioskModeActive: true, direction: 'up' });
      expect(screen.getByRole('button')).toHaveClass('d-none');
    });

    it('does not apply "d-none" when isKioskModeActive is false', () => {
      renderComponent({ isKioskModeActive: false, direction: 'up' });
      expect(screen.getByRole('button')).not.toHaveClass('d-none');
    });

    it('applies "date-arrows date-arrow-up" when isKioskModeActive is false and direction is "up"', () => {
      renderComponent({ isKioskModeActive: false, direction: 'up' });
      expect(screen.getByRole('button')).toHaveClass('date-arrows', 'date-arrow-up');
    });

    it('applies "date-arrows date-arrow-down" when isKioskModeActive is false and direction is "down"', () => {
      renderComponent({ isKioskModeActive: false, direction: 'down' });
      expect(screen.getByRole('button')).toHaveClass('date-arrows', 'date-arrow-down');
    });
  });

  describe('onClick handler', () => {
    it('calls onClick when the button is clicked', () => {
      const onClick = jest.fn();
      renderComponent({ onClick });
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick before the button is clicked', () => {
      const onClick = jest.fn();
      renderComponent({ onClick });
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('ArrowFilledUp icon', () => {
    it('renders the icon', () => {
      renderComponent();
      expect(screen.getByTestId('arrow-icon')).toBeInTheDocument();
    });

    it('sets className to "{direction}arrow" on the icon', () => {
      renderComponent({ direction: 'up' });
      expect(screen.getByTestId('arrow-icon')).toHaveClass('uparrow');
    });

    it('sets className to "downarrow" when direction is "down"', () => {
      renderComponent({ direction: 'down' });
      expect(screen.getByTestId('arrow-icon')).toHaveClass('downarrow');
    });

    it('passes arrowSize as size to the icon', () => {
      renderComponent({ arrowSize: '24px' });
      expect(screen.getByTestId('arrow-icon')).toHaveAttribute('data-size', '24px');
    });
  });
});
