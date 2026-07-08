/* eslint-disable react/prop-types */
import { render } from '@testing-library/react';
import AboutModal from './about';

jest.mock('../util/scrollbar', () => ({ children, style }) => (
  <div data-testid="scrollbar" style={style}>
    {children}
  </div>
));

jest.mock('./about-section', () => ({ section }) => (
  <div data-testid={`about-section-${section}`}>{section}</div>
));

describe('AboutModal', () => {
  test('renders sections in the correct order', () => {
    const { container } = render(<AboutModal />);
    const sectionDivs = container.querySelectorAll('[data-testid^="about-section-"]');
    const sectionNames = Array.from(sectionDivs).map((el) => el.textContent);
    expect(sectionNames).toEqual([
      'welcome',
      'keyboard',
      'imagery',
      'acknowledgements',
      'disclaimer',
      'license',
    ]);
  });
});
