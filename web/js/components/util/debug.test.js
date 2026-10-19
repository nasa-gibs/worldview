import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Debug from './debug';

// Suppress the expected error boundary console output for the throw test
const suppressError = () => {};

describe('Debug', () => {
  describe('normal render', () => {
    it('renders without throwing when showError is false', () => {
      expect(() => render(<Debug parameters={{ showError: false }} />)).not.toThrow();
    });

    it('renders without throwing when showError is absent', () => {
      expect(() => render(<Debug parameters={{}} />)).not.toThrow();
    });

    it('returns empty string (renders nothing visible)', () => {
      const { container } = render(<Debug parameters={{}} />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('error path', () => {
    it('throws an Error when showError is true', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(suppressError);
      expect(() => render(<Debug parameters={{ showError: true }} />)).toThrow('this is a test error');
      spy.mockRestore();
    });

    it('thrown error is an instance of Error', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(suppressError);
      let caught;
      try {
        render(<Debug parameters={{ showError: true }} />);
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(Error);
      spy.mockRestore();
    });
  });
});
