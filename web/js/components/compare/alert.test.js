import { render, screen } from '@testing-library/react';
import CompareAlertModalBody from './alert';

describe('CompareAlertModalBody', () => {
  it('renders the modal header correctly', () => {
    render(<CompareAlertModalBody />);
    expect(screen.getByRole('heading', { level: 1 })).toBeDefined();
    expect(screen.getByText('How to get started?')).toBeDefined();
  });

  it('renders the correct number of list items and images', () => {
    render(<CompareAlertModalBody />);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(3);

    expect(images[0].getAttribute('src')).toBe('images/ab-tabs.png');
    expect(images[1].getAttribute('src')).toBe('images/ab-picks.png');
    expect(images[2].getAttribute('src')).toBe('images/ab-modes.png');
  });

  it('renders the descriptive text for each step', () => {
    render(<CompareAlertModalBody />);

    expect(screen.getByText(/Select the respective tab \(A or B\) in order to update the layers/i)).toBeDefined();
    expect(screen.getByText(/There are now two time sliders on the timeline/i)).toBeDefined();
    expect(screen.getByText(/There are three compare modes/i)).toBeDefined();
  });
});
