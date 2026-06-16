import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventsAlertModalBody from './alert-body';

describe('EventsAlertModalBody', () => {
  it('should render the introductory paragraph', () => {
    render(<EventsAlertModalBody />);
    expect(screen.getByText(/There are a variety of factors as to why you may not be seeing an event/i)).toBeInTheDocument();
  });

  it('should render all list items', () => {
    render(<EventsAlertModalBody />);
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(7);
  });

  it('should render satellite overpass list item', () => {
    render(<EventsAlertModalBody />);
    expect(screen.getByText(/Satellite overpass may have occurred before the event/i)).toBeInTheDocument();
  });

  it('should render cloud cover list item', () => {
    render(<EventsAlertModalBody />);
    expect(screen.getByText(/Cloud cover may obscure the event/i)).toBeInTheDocument();
  });

  it('should render wildfire note in event timing list item', () => {
    render(<EventsAlertModalBody />);
    expect(screen.getByText(/Wildfire events are currently set to automatically display the next day/i)).toBeInTheDocument();
  });

  it('should render resolution list item', () => {
    render(<EventsAlertModalBody />);
    expect(screen.getByText(/The resolution of the imagery may be too coarse to see an event/i)).toBeInTheDocument();
  });

  it('should render swath data gaps list item with link', () => {
    render(<EventsAlertModalBody />);
    expect(screen.getByText(/There are normal swath data gaps in some of the imagery layers/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Swath Gap tour story/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', expect.stringContaining('worldview.earthdata.nasa.gov'));
  });

  it('should render events history list item', () => {
    render(<EventsAlertModalBody />);
    expect(screen.getByText(/Events listings currently only go back to 1 January 2000/i)).toBeInTheDocument();
  });

  it('should render categories history list item', () => {
    render(<EventsAlertModalBody />);
    expect(screen.getByText(/Not all categories have events that are populated back to 1 January 2000/i)).toBeInTheDocument();
  });

  it('should render footer paragraph with EONET link', () => {
    render(<EventsAlertModalBody />);
    expect(screen.getByText(/Events are curated and provided by the/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Earth Observatory Natural Event Tracker/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://eonet.gsfc.nasa.gov/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should have correct CSS class on main container', () => {
    const { container } = render(<EventsAlertModalBody />);
    const mainDiv = container.querySelector('.basic-modal.event-alert-modal-body');
    expect(mainDiv).toBeInTheDocument();
  });

  it('should render an unordered list', () => {
    render(<EventsAlertModalBody />);
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    expect(list.tagName).toBe('UL');
  });

  it('should have no accessibility violations', () => {
    const { container } = render(<EventsAlertModalBody />);
    expect(container.querySelector('h1')).toBeInTheDocument();
    expect(container.querySelector('ul')).toBeInTheDocument();
    expect(container.querySelectorAll('li').length).toBeGreaterThan(0);
  });
});
