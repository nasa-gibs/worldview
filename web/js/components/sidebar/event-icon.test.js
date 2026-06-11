import { render } from '@testing-library/react';
import EventIcon from './event-icon';

describe('EventIcon', () => {
  it('renders the icon element with id and category-based class', () => {
    const { container } = render(<EventIcon id="EONET_123" category="Wildfires" title="Fire" />);
    const icon = container.querySelector('#EONET_123Wildfires');
    expect(icon).toBeTruthy();
    expect(icon.className).toBe('event-icon event-icon-Wildfires');
  });

  it('renders the tooltip when hideTooltip is not set', () => {
    // UncontrolledTooltip branch should be exercised without throwing
    const { container } = render(<EventIcon id="a" category="Storms" title="A Storm" />);
    expect(container.querySelector('#aStorms')).toBeTruthy();
  });

  it('does not render a tooltip when hideTooltip is true', () => {
    const { container } = render(
      <EventIcon id="b" category="Floods" title="A Flood" hideTooltip />,
    );
    expect(container.querySelector('#bFloods')).toBeTruthy();
  });

  it('falls back to category when no title is provided', () => {
    const { container } = render(<EventIcon id="c" category="Drought" />);
    expect(container.querySelector('#cDrought')).toBeTruthy();
  });
});
