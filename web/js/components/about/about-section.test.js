import { render, waitFor } from '@testing-library/react';
import AboutSection from './about-section';

global.fetch = jest.fn();

const mockAbortController = {
  abort: jest.fn(),
  signal: { aborted: false },
};

beforeEach(() => {
  jest.clearAllMocks();
  global.AbortController = jest.fn(() => mockAbortController);
});

describe('AboutSection', () => {
  test('renders a div when fetch is successful', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      text: jest.fn().mockResolvedValueOnce('Hello'),
    });

    const { container } = render(<AboutSection section="test" />);

    await waitFor(() => {
      expect(container.querySelector('div').textContent).toBe('Hello');
    });
  });

  test('displays HTML text content when fetch is successful and ok is true', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      text: jest.fn().mockResolvedValueOnce('About Content'),
    });

    const { container } = render(<AboutSection section="overview" />);

    await waitFor(() => {
      expect(container.querySelector('div').textContent).toBe('About Content');
    });
  });

  test('displays empty text when fetch response is not ok', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      text: jest.fn().mockResolvedValueOnce('Error Content'),
    });

    const { container } = render(<AboutSection section="overview" />);

    await waitFor(() => {
      expect(container.querySelector('div').textContent).toBe('');
    });
  });

  test('calls fetch with the correct URL based on section prop', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      text: jest.fn().mockResolvedValueOnce('Mission Content'),
    });

    const { container } = render(<AboutSection section="mission" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('brand/about/mission.html');
      expect(container.querySelector('div').textContent).toBe('Mission Content');
    });
  });

  test('displays "no section name provided" when section is an empty string', async () => {
    const { container } = render(<AboutSection section="" />);

    await waitFor(() => {
      expect(fetch).not.toHaveBeenCalled();
      expect(container.querySelector('div').textContent).toBe('no section name provided');
    });
  });

  test('displays "could not load metadata" when fetch throws and signal is not aborted', async () => {
    fetch.mockRejectedValueOnce(new Error('Network Error'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = render(<AboutSection section="overview" />);

    await waitFor(() => {
      expect(container.querySelector('div').textContent).toBe('could not load metadata');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  test('displays empty text and does not log error when fetch throws and signal is aborted', async () => {
    fetch.mockRejectedValueOnce(new Error('Aborted'));

    const abortedController = {
      abort: jest.fn(),
      signal: { aborted: true },
    };
    global.AbortController = jest.fn(() => abortedController);

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = render(<AboutSection section="overview" />);

    await waitFor(() => {
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(container.querySelector('div').textContent).toBe('');
    });

    consoleErrorSpy.mockRestore();
  });

  test('calls controller.abort() when controller is not null', async () => {
    fetch.mockImplementationOnce(() => new Promise(() => {}));

    render(<AboutSection section="overview" />);

    await waitFor(() => {
      expect(mockAbortController.abort).toHaveBeenCalled();
    });
  });
});
