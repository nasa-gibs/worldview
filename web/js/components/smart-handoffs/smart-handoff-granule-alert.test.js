import { render } from '@testing-library/react';
import GranuleAlertModalBody from './smart-handoff-granule-alert';

describe('GranuleAlertModalBody', () => {
  it('renders the modal heading', () => {
    const { getByRole } = render(<GranuleAlertModalBody />);
    expect(getByRole('heading', { level: 1 }).textContent).toContain('NONE');
  });

  it('renders the explanatory paragraphs and the numbered list', () => {
    const { container } = render(<GranuleAlertModalBody />);
    expect(container.querySelectorAll('p').length).toBe(3);
    expect(container.querySelectorAll('ol li').length).toBe(2);
  });

  it('renders external reference links that open in a new tab safely', () => {
    const { container } = render(<GranuleAlertModalBody />);
    const links = container.querySelectorAll('a[target="_blank"]');
    expect(links.length).toBe(2);
    links.forEach((link) => {
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
      expect(link.getAttribute('href')).toMatch(/^https:\/\//);
    });
  });

  it('renders within the basic-modal wrapper', () => {
    const { container } = render(<GranuleAlertModalBody />);
    expect(container.querySelector('.basic-modal')).toBeTruthy();
  });
});
