/* eslint-disable react/jsx-props-no-spreading */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Notify from './notify';

describe('Notify Component', () => {
  const defaultProps = {
    bodyText: 'Test notification message',
    cancel: jest.fn(),
    accept: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<Notify {...defaultProps} />);
    expect(screen.getByText('Test notification message')).toBeInTheDocument();
  });

  test('displays the bodyText prop', () => {
    const bodyText = 'This is a test notification';
    render(<Notify {...defaultProps} bodyText={bodyText} />);
    expect(screen.getByText(bodyText)).toBeInTheDocument();
  });

  test('renders Cancel button', () => {
    render(<Notify {...defaultProps} />);
    const cancelButton = screen.getAllByRole('button', { name: 'Cancel' })[0];
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toHaveClass('cancel-notify');
  });

  test('renders OK button', () => {
    render(<Notify {...defaultProps} />);
    const okButton = screen.getAllByRole('button', { name: 'OK' })[0];
    expect(okButton).toBeInTheDocument();
    expect(okButton).toHaveClass('accept-notify');
  });

  test('calls cancel callback when Cancel button is clicked', () => {
    const cancelMock = jest.fn();
    render(<Notify {...defaultProps} cancel={cancelMock} />);
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(cancelMock).toHaveBeenCalledTimes(1);
  });

  test('calls accept callback when OK button is clicked', () => {
    const acceptMock = jest.fn();
    render(<Notify {...defaultProps} accept={acceptMock} />);
    const okButton = screen.getByText('OK');
    fireEvent.click(okButton);
    expect(acceptMock).toHaveBeenCalledTimes(1);
  });

  test('renders with optional props undefined', () => {
    const minimalProps = { bodyText: '', cancel: jest.fn(), accept: jest.fn() };
    render(<Notify {...minimalProps} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  test('renders notify div with correct className', () => {
    render(<Notify {...defaultProps} />);
    const notifyDiv = screen.getByText('Test notification message').closest('div');
    expect(notifyDiv).toHaveClass('notify');
  });

  test('handles empty bodyText', () => {
    render(<Notify {...defaultProps} bodyText="" />);
    const notifyDiv = document.querySelector('.notify');
    expect(notifyDiv).toBeInTheDocument();
  });

  test('cancel button has correct type', () => {
    render(<Notify {...defaultProps} />);
    const cancelButton = screen.getAllByRole('button', { name: 'Cancel' })[0];
    expect(cancelButton.tagName).toBe('BUTTON');
  });

  test('accept button has correct type', () => {
    render(<Notify {...defaultProps} />);
    const okButton = screen.getAllByRole('button', { name: 'OK' })[0];
    expect(okButton.tagName).toBe('BUTTON');
  });
});
