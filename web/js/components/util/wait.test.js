/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Wait from './wait';

jest.mock('./button', () => function MockButton({ text, onClick, id, className }) {
  return (
    <button
      type="button"
      data-testid="cancel-button"
      id={id}
      className={className}
      onClick={onClick}
    >
      {text}
    </button>
  );
});

const defaultProps = {
  statusText: 'Loading...',
  onCancel: jest.fn(),
};

const renderComponent = (props = {}) => render(
  <Wait {...defaultProps} {...props} />,
);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Wait', () => {
  describe('portal target', () => {
    it('renders into .wv-content when it exists in the document', () => {
      const wvContent = document.createElement('div');
      wvContent.className = 'wv-content';
      document.body.appendChild(wvContent);

      renderComponent();

      expect(wvContent.querySelector('.wv-wait-progress-overlay')).toBeInTheDocument();

      wvContent.remove();
    });

    it('falls back to document.body when .wv-content does not exist', () => {
      renderComponent();
      expect(document.body.querySelector('.wv-wait-progress-overlay')).toBeInTheDocument();
    });
  });

  describe('structure', () => {
    it('renders the overlay wrapper', () => {
      const { baseElement } = renderComponent();
      expect(baseElement.querySelector('.wv-wait-progress-overlay')).toBeInTheDocument();
    });

    it('renders an open dialog element', () => {
      renderComponent();
      const dialog = document.querySelector('.wv-wait-progress-dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('open');
    });

    it('renders the progress message container', () => {
      renderComponent();
      expect(document.querySelector('.wv-wait-progress-message')).toBeInTheDocument();
    });

    it('renders statusText inside the message span', () => {
      renderComponent({ statusText: 'Please wait...' });
      expect(screen.getByText('Please wait...')).toBeInTheDocument();
    });

    it('renders empty statusText when not provided', () => {
      renderComponent({ statusText: '' });
      expect(document.querySelector('.wv-wait-progress-message span').textContent).toBe('');
    });
  });

  describe('Cancel button — complete=false (default)', () => {
    it('renders the Cancel button when complete=false', () => {
      renderComponent({ complete: false });
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    });

    it('Cancel button has id="wv-wait-cancel-button"', () => {
      renderComponent({ complete: false });
      expect(document.getElementById('wv-wait-cancel-button')).toBeInTheDocument();
    });

    it('Cancel button has class "wv-button gray"', () => {
      renderComponent({ complete: false });
      expect(screen.getByTestId('cancel-button')).toHaveClass('wv-button', 'gray');
    });

    it('calls onCancel when Cancel button is clicked', () => {
      const onCancel = jest.fn();
      renderComponent({ complete: false, onCancel });
      fireEvent.click(screen.getByTestId('cancel-button'));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cancel button — complete=true', () => {
    it('does not render the Cancel button when complete=true', () => {
      renderComponent({ complete: true });
      expect(screen.queryByTestId('cancel-button')).not.toBeInTheDocument();
    });
  });
});
