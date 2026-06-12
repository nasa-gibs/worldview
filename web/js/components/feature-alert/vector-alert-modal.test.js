import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import VectorAlertModalBody from './vector-alert-modal';

describe('VectorAlertModalBody', () => {
  it('should render the main container with correct className', () => {
    const { container } = render(<VectorAlertModalBody />);
    const mainContainer = container.querySelector('.event-alert-modal-body');
    expect(mainContainer).toBeInTheDocument();
  });

  it('should render the first heading about vector vs raster layers', () => {
    render(<VectorAlertModalBody />);
    const heading = screen.getByText(
      'What are vector layers and how do they differ from raster (image) layers?',
    );
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H2');
  });

  it('should render the first paragraph about vector and raster layers', () => {
    render(<VectorAlertModalBody />);
    const paragraph = screen.getByText(
      /Vector layers identify locations on earth using points, line segments or polygons/i,
    );
    expect(paragraph).toBeInTheDocument();
  });

  it('should render the second paragraph about zoom levels', () => {
    render(<VectorAlertModalBody />);
    const paragraph = screen.getByText(
      /To speed up map interactions, vector layers that have a vast number of features/i,
    );
    expect(paragraph).toBeInTheDocument();
  });

  it('should render the third heading about clickable features', () => {
    render(<VectorAlertModalBody />);
    const heading = screen.getByText(
      'How can I determine which layers have clickable features?',
    );
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H2');
  });

  it('should render the third paragraph about pointer icon', () => {
    render(<VectorAlertModalBody />);
    const paragraph = screen.getByText(
      /If you see the blue pointer icon next to the layer in the sidebar Layer List/i,
    );
    expect(paragraph).toBeInTheDocument();
  });

  it('should render the vector-alert.png image', () => {
    render(<VectorAlertModalBody />);
    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'images/vector-alert.png');
  });

  it('should render all rows with correct padding classes', () => {
    const { container } = render(<VectorAlertModalBody />);
    const rows = container.querySelectorAll('.row');
    expect(rows.length).toBeGreaterThan(0);

    rows.forEach((row) => {
      expect(
        row.classList.contains('p-2') || row.classList.contains('p-3'),
      ).toBe(true);
    });
  });

  it('should render all content inside Col components', () => {
    const { container } = render(<VectorAlertModalBody />);
    const cols = container.querySelectorAll('.col');
    expect(cols.length).toBeGreaterThan(0);
  });

  it('should have all three main headings', () => {
    render(<VectorAlertModalBody />);
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings).toHaveLength(3);
  });
});
