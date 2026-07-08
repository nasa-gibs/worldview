/* eslint-disable react/jsx-props-no-spreading */
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import OutsideAlerter from './detect-outer-click';

const defaultProps = {
  onClick: jest.fn(),
};

const renderComponent = (props = {}, children = <span data-testid="inner">inside</span>) => render(
  <OutsideAlerter {...defaultProps} {...props}>
    {children}
  </OutsideAlerter>,
);

beforeEach(() => {
  jest.clearAllMocks();
  const existing = document.getElementById('wv-map');
  if (existing) existing.remove();
});

afterEach(() => {
  const existing = document.getElementById('wv-map');
  if (existing) existing.remove();
});

describe('OutsideAlerter', () => {
  describe('render', () => {
    it('renders a wrapper div', () => {
      renderComponent();
      expect(screen.getByTestId('inner').parentElement.tagName).toBe('DIV');
    });

    it('renders children inside the wrapper', () => {
      renderComponent();
      expect(screen.getByTestId('inner')).toBeInTheDocument();
    });
  });

  describe('componentDidMount — event listeners', () => {
    it('adds mousedown listener to document on mount', () => {
      const addSpy = jest.spyOn(document, 'addEventListener');
      renderComponent();
      expect(addSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      addSpy.mockRestore();
    });

    it('adds touchstart listener to document on mount', () => {
      const addSpy = jest.spyOn(document, 'addEventListener');
      renderComponent();
      expect(addSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
      addSpy.mockRestore();
    });

    it('adds mousedown listener to #wv-map when it exists', () => {
      const mapEl = document.createElement('div');
      mapEl.setAttribute('id', 'wv-map');
      document.body.appendChild(mapEl);
      const mapAddSpy = jest.spyOn(mapEl, 'addEventListener');

      renderComponent();

      expect(mapAddSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    });

    it('does not throw when #wv-map is absent', () => {
      expect(() => renderComponent()).not.toThrow();
    });
  });

  describe('componentWillUnmount — event listeners', () => {
    it('removes mousedown listener from document on unmount', () => {
      const removeSpy = jest.spyOn(document, 'removeEventListener');
      const { unmount } = renderComponent();
      act(() => { unmount(); });
      expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      removeSpy.mockRestore();
    });
  });

  describe('handleClickOutside', () => {
    it('calls onClick when mousedown fires outside the wrapper', () => {
      const onClick = jest.fn();
      renderComponent({ onClick });
      act(() => { document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); });
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when mousedown fires inside the wrapper', () => {
      const onClick = jest.fn();
      renderComponent({ onClick });
      const inner = screen.getByTestId('inner');
      act(() => { inner.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); });
      expect(onClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when disabled is true', () => {
      const onClick = jest.fn();
      renderComponent({ onClick, disabled: true });
      act(() => { document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); });
      expect(onClick).not.toHaveBeenCalled();
    });

    it('calls onClick on touchstart outside the wrapper', () => {
      const onClick = jest.fn();
      renderComponent({ onClick });
      act(() => { document.dispatchEvent(new TouchEvent('touchstart', { bubbles: true })); });
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick on touchstart when disabled', () => {
      const onClick = jest.fn();
      renderComponent({ onClick, disabled: true });
      act(() => { document.dispatchEvent(new TouchEvent('touchstart', { bubbles: true })); });
      expect(onClick).not.toHaveBeenCalled();
    });

    it('calls onClick via #wv-map mousedown when outside the wrapper', () => {
      const mapEl = document.createElement('div');
      mapEl.setAttribute('id', 'wv-map');
      document.body.appendChild(mapEl);

      const onClick = jest.fn();
      renderComponent({ onClick });

      act(() => { mapEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: false })); });
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});
