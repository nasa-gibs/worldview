import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ZoomAlertModalBody from './zoomAlertModal';

describe('ZoomAlertModalBody', () => {
  it('should render without crashing', () => {
    render(<ZoomAlertModalBody />);
  });

  it('should render the main container with correct className', () => {
    const { container } = render(<ZoomAlertModalBody />);
    const eventAlertContainer = container.querySelector('.event-alert-modal-body');
    expect(eventAlertContainer).toBeInTheDocument();
  });

  it('should render the heading with correct text', () => {
    render(<ZoomAlertModalBody />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("Why can't I see the imagery at this zoom level?");
  });

  it('should render the description paragraph', () => {
    render(<ZoomAlertModalBody />);
    const paragraph = screen.getByText(/Imagery for certain layers is dynamically generated/i);
    expect(paragraph).toBeInTheDocument();
  });

  it('should render the complete message text', () => {
    render(<ZoomAlertModalBody />);
    expect(screen.getByText(/Imagery for certain layers is dynamically generated and only available when zoomed in\. Please zoom in to view this product\./i)).toBeInTheDocument();
  });

  it('should render two Row components', () => {
    const { container } = render(<ZoomAlertModalBody />);
    const rows = container.querySelectorAll('.row');
    expect(rows).toHaveLength(2);
  });

  it('should have correct padding classes on rows', () => {
    const { container } = render(<ZoomAlertModalBody />);
    const rows = container.querySelectorAll('.row');
    expect(rows[0]).toHaveClass('p-2');
    expect(rows[1]).toHaveClass('p-3');
  });

  it('should render Col components within Rows', () => {
    const { container } = render(<ZoomAlertModalBody />);
    const cols = container.querySelectorAll('.col');
    expect(cols.length).toBeGreaterThanOrEqual(2);
  });

  it('should have proper HTML structure', () => {
    const { container } = render(<ZoomAlertModalBody />);
    const eventAlertContainer = container.querySelector('.event-alert-modal-body');
    const rows = eventAlertContainer.querySelectorAll('.row');
    expect(rows.length).toBe(2);
    rows.forEach((row) => {
      expect(row.querySelectorAll('.col').length).toBeGreaterThan(0);
    });
  });
});
