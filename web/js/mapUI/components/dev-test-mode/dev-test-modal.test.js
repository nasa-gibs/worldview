import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DevTestModal from './dev-test-modal';

jest.mock('./dev-console-test', () => () => <div data-testid="console-test-mode" />);
jest.mock('./dev-preset-console-commands', () => () => <div data-testid="preset-console-commands" />);
jest.mock('./pixel-test-mode/dev-pixel-test', () => () => <div data-testid="pixel-test-mode" />);
jest.mock('./find-orbit-tracks-mode/dev-find-orbit-tracks-mode', () => () => <div data-testid="find-orbit-tracks-mode" />);

function renderComponent() {
  return render(<DevTestModal />);
}

describe('DevTestModal', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('renders the outer wrapper with id "dev-block"', () => {
      const { container } = renderComponent();
      expect(container.querySelector('#dev-block')).toBeInTheDocument();
    });

    it('renders the outer wrapper with correct classes', () => {
      const { container } = renderComponent();
      expect(container.querySelector('#dev-block')).toHaveClass(
        'd-flex',
        'flex-column',
        'justify-content-center',
        'align-items-center',
      );
    });

    it('renders ConsoleTestMode', () => {
      renderComponent();
      expect(screen.getByTestId('console-test-mode')).toBeInTheDocument();
    });

    it('renders PresetConsoleCommands', () => {
      renderComponent();
      expect(screen.getByTestId('preset-console-commands')).toBeInTheDocument();
    });

    it('renders PixelTestMode', () => {
      renderComponent();
      expect(screen.getByTestId('pixel-test-mode')).toBeInTheDocument();
    });

    it('renders exactly three active child components', () => {
      const { container } = renderComponent();
      expect(container.querySelector('#dev-block').children).toHaveLength(3);
    });

    it('does NOT render FindOrbitTracksTestMode (commented out)', () => {
      renderComponent();
      expect(screen.queryByTestId('find-orbit-tracks-mode')).not.toBeInTheDocument();
    });
  });

  describe('Child component order', () => {
    it('renders ConsoleTestMode before PresetConsoleCommands', () => {
      const { container } = renderComponent();
      const children = Array.from(container.querySelector('#dev-block').children);
      const consoleIdx = children.findIndex((el) => el.dataset.testid === 'console-test-mode');
      const presetIdx = children.findIndex((el) => el.dataset.testid === 'preset-console-commands');
      expect(consoleIdx).toBeLessThan(presetIdx);
    });

    it('renders PresetConsoleCommands before PixelTestMode', () => {
      const { container } = renderComponent();
      const children = Array.from(container.querySelector('#dev-block').children);
      const presetIdx = children.findIndex((el) => el.dataset.testid === 'preset-console-commands');
      const pixelIdx = children.findIndex((el) => el.dataset.testid === 'pixel-test-mode');
      expect(presetIdx).toBeLessThan(pixelIdx);
    });

    it('renders ConsoleTestMode as the first child', () => {
      const { container } = renderComponent();
      const firstChild = container.querySelector('#dev-block').children[0];
      expect(firstChild).toHaveAttribute('data-testid', 'console-test-mode');
    });

    it('renders PixelTestMode as the last child', () => {
      const { container } = renderComponent();
      const devBlock = container.querySelector('#dev-block');
      const lastChild = devBlock.children[devBlock.children.length - 1];
      expect(lastChild).toHaveAttribute('data-testid', 'pixel-test-mode');
    });
  });
});
