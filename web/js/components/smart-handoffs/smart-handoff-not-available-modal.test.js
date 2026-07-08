import { render } from '@testing-library/react';
import SmartHandoffNotAvailableModal from './smart-handoff-not-available-modal';

describe('SmartHandoffNotAvailableModal', () => {
  it('renders the modal heading', () => {
    const { getByRole } = render(<SmartHandoffNotAvailableModal />);
    expect(getByRole('heading', { level: 1 }).textContent)
      .toContain('Why are some layers not available for download?');
  });

  it('renders the explanatory paragraphs', () => {
    const { container } = render(<SmartHandoffNotAvailableModal />);
    expect(container.querySelectorAll('p').length).toBe(4);
  });

  it('renders the MODIS True Color reference link safely', () => {
    const { container } = render(<SmartHandoffNotAvailableModal />);
    const link = container.querySelector('a[target="_blank"]');
    expect(link.getAttribute('rel')).toBe('noreferrer');
    expect(link.getAttribute('href')).toMatch(/^https:\/\//);
  });

  it('renders within the basic-modal wrapper', () => {
    const { container } = render(<SmartHandoffNotAvailableModal />);
    expect(container.querySelector('.basic-modal')).toBeTruthy();
  });
});
