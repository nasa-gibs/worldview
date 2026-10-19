import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import GranuleAlertModalBody from './granuleAlertModal';

describe('GranuleAlertModalBody', () => {
  test('renders heading with correct text', () => {
    render(<GranuleAlertModalBody />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("Why can't I see the imagery for this layer?");
  });

  test('renders explanatory paragraph and preserves apostrophes', () => {
    render(<GranuleAlertModalBody />);

    // paragraph contains a few recognizable phrases from the component
    const paragraph = screen.getByText((content, node) => {
      return content.includes('Certain imagery visualization layers') && content.includes("isn't imagery to view at every location");
    });

    expect(paragraph).toBeInTheDocument();
    // ensure HTML entity &apos; was rendered as an apostrophe
    expect(paragraph).toHaveTextContent("isn't imagery to view at every location across the globe");
  });

  test('contains the expected container class and rows', () => {
    const { container } = render(<GranuleAlertModalBody />);

    // top-level container should have class 'event-alert-modal-body'
    const top = container.querySelector('.event-alert-modal-body');
    expect(top).toBeInTheDocument();

    // there should be two rows with padding classes used in the component
    const rows = container.querySelectorAll('.p-2, .p-3');
    expect(rows.length).toBeGreaterThanOrEqual(2);
  });
});
