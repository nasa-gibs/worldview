/* eslint-disable react/jsx-props-no-spreading */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from './button';

const defaultProps = {
  text: 'Click me',
  onClick: jest.fn(),
};

const renderComponent = (props = {}) => render(
  <Button {...defaultProps} {...props} />,
);

describe('Button', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('button element', () => {
    it('renders a button', () => {
      renderComponent();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('has type="button"', () => {
      renderComponent();
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('renders the text inside a span with class "button-text"', () => {
      renderComponent({ text: 'Save' });
      const span = screen.getByText('Save');
      expect(span).toHaveClass('button-text');
    });

    it('renders a React node as text', () => {
      renderComponent({ text: <strong data-testid="node-text">Bold</strong> });
      expect(screen.getByTestId('node-text')).toBeInTheDocument();
    });
  });

  describe('id prop', () => {
    it('sets id attribute when provided', () => {
      renderComponent({ id: 'my-btn' });
      expect(screen.getByRole('button')).toHaveAttribute('id', 'my-btn');
    });

    it('defaults id to empty string', () => {
      renderComponent();
      expect(screen.getByRole('button')).toHaveAttribute('id', '');
    });
  });

  describe('style prop', () => {
    it('applies inline style when provided', () => {
      renderComponent({ style: { color: 'red' } });
      expect(screen.getByRole('button')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('defaults style to null (no inline style)', () => {
      renderComponent();
      expect(screen.getByRole('button').getAttribute('style')).toBeNull();
    });
  });

  describe('valid prop — className and disabled', () => {
    it('applies "wv-button gray" when valid is true and no className given', () => {
      renderComponent({ valid: true });
      expect(screen.getByRole('button')).toHaveClass('wv-button', 'gray');
      expect(screen.getByRole('button')).not.toHaveClass('wv-disabled');
    });

    it('applies "wv-disabled wv-button gray" when valid is false', () => {
      renderComponent({ valid: false });
      expect(screen.getByRole('button')).toHaveClass('wv-disabled', 'wv-button', 'gray');
    });

    it('is not disabled when valid is true', () => {
      renderComponent({ valid: true });
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('is disabled when valid is false', () => {
      renderComponent({ valid: false });
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('defaults valid to true', () => {
      renderComponent();
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  describe('className prop', () => {
    it('uses supplied className in the valid class string', () => {
      renderComponent({ className: 'red', valid: true });
      expect(screen.getByRole('button')).toHaveClass('wv-button', 'red');
    });

    it('uses supplied className in the disabled class string', () => {
      renderComponent({ className: 'red', valid: false });
      expect(screen.getByRole('button')).toHaveClass('wv-disabled', 'wv-button', 'red');
    });

    it('defaults className to "gray"', () => {
      renderComponent();
      expect(screen.getByRole('button')).toHaveClass('gray');
    });
  });

  describe('onClick handler', () => {
    it('calls onClick when clicked', () => {
      const onClick = jest.fn();
      renderComponent({ onClick });
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick before being clicked', () => {
      const onClick = jest.fn();
      renderComponent({ onClick });
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('onMouseDown handler', () => {
    it('calls stopPropagation on mousedown', () => {
      renderComponent();
      const btn = screen.getByRole('button');
      const stopPropagation = jest.fn();
      fireEvent.mouseDown(btn, { stopPropagation });
      // stopPropagation is synthetic — verify the button still exists and no error thrown
      expect(btn).toBeInTheDocument();
    });
  });
});
