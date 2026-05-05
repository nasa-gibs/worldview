import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TravelMode from './travelMode';

jest.mock('./travelModeTitle', () => () => <div data-testid="travel-mode-title" />);
jest.mock('./travelModeColorbars', () => () => <div data-testid="travel-mode-colorbars" />);

function renderComponent() {
  return render(<TravelMode />);
}

describe('TravelMode', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('renders the outer wrapper with id "travel-mode"', () => {
      const { container } = renderComponent();
      expect(container.querySelector('#travel-mode')).toBeInTheDocument();
    });

    it('renders TravelModeTitle', () => {
      renderComponent();
      expect(screen.getByTestId('travel-mode-title')).toBeInTheDocument();
    });

    it('renders TravelModeColorbars', () => {
      renderComponent();
      expect(screen.getByTestId('travel-mode-colorbars')).toBeInTheDocument();
    });

    it('renders exactly two children inside the wrapper', () => {
      const { container } = renderComponent();
      expect(container.querySelector('#travel-mode').children).toHaveLength(2);
    });
  });

  describe('Child component order', () => {
    it('renders TravelModeTitle before TravelModeColorbars', () => {
      const { container } = renderComponent();
      const children = Array.from(container.querySelector('#travel-mode').children);
      const titleIdx = children.findIndex((el) => el.dataset.testid === 'travel-mode-title');
      const colorbarsIdx = children.findIndex((el) => el.dataset.testid === 'travel-mode-colorbars');
      expect(titleIdx).toBeLessThan(colorbarsIdx);
    });

    it('renders TravelModeTitle as the first child', () => {
      const { container } = renderComponent();
      const firstChild = container.querySelector('#travel-mode').children[0];
      expect(firstChild).toHaveAttribute('data-testid', 'travel-mode-title');
    });

    it('renders TravelModeColorbars as the last child', () => {
      const { container } = renderComponent();
      const wrapper = container.querySelector('#travel-mode');
      const lastChild = wrapper.children[wrapper.children.length - 1];
      expect(lastChild).toHaveAttribute('data-testid', 'travel-mode-colorbars');
    });
  });
});
