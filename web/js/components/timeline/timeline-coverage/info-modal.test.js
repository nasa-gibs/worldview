import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import LayerCoverageInfoModal from './info-modal';

describe('LayerCoverageInfoModal', () => {
  it('renders the outer container with class layer-coverage-info', () => {
    const { container } = render(<LayerCoverageInfoModal />);
    expect(container.querySelector('.layer-coverage-info')).toBeInTheDocument();
  });

  it('renders a <header> element', () => {
    const { container } = render(<LayerCoverageInfoModal />);
    expect(container.querySelector('header')).toBeInTheDocument();
  });

  it('renders two paragraphs inside the header', () => {
    const { container } = render(<LayerCoverageInfoModal />);
    const paragraphs = container.querySelector('header').querySelectorAll('p');
    expect(paragraphs).toHaveLength(2);
  });

  it('first header paragraph mentions striped horizontal blue lines', () => {
    const { container } = render(<LayerCoverageInfoModal />);
    const firstP = container.querySelector('header p');
    expect(firstP.textContent).toContain('striped');
    expect(firstP.textContent).toContain('blue lines');
  });

  it('second header paragraph mentions solid blue line', () => {
    const { container } = render(<LayerCoverageInfoModal />);
    const paragraphs = container.querySelector('header').querySelectorAll('p');
    expect(paragraphs[1].textContent).toContain('solid blue line');
  });

  it('renders the info-item-container div', () => {
    const { container } = render(<LayerCoverageInfoModal />);
    expect(container.querySelector('.layer-coverage-info-item-container')).toBeInTheDocument();
  });

  it('renders the left section with class layer-coverage-info-item-left', () => {
    const { container } = render(<LayerCoverageInfoModal />);
    expect(container.querySelector('.layer-coverage-info-item-left')).toBeInTheDocument();
  });

  it('renders the lc-axis image in the left section', () => {
    const { container } = render(<LayerCoverageInfoModal />);
    const img = container.querySelector('.layer-coverage-info-item-left img');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe('images/lc-axis.png');
  });

  it('renders the right section with class layer-coverage-info-item-right', () => {
    const { container } = render(<LayerCoverageInfoModal />);
    expect(container.querySelector('.layer-coverage-info-item-right')).toBeInTheDocument();
  });

  it('renders the lc-toggle image in the right section', () => {
    const { container } = render(<LayerCoverageInfoModal />);
    const img = container.querySelector('.layer-coverage-info-item-right img');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe('images/lc-toggle.png');
  });

  it('renders a <strong>Note:</strong> element', () => {
    const { getByText } = render(<LayerCoverageInfoModal />);
    expect(getByText('Note:')).toBeInTheDocument();
  });

  it('note paragraph mentions monthly layers', () => {
    const { container } = render(<LayerCoverageInfoModal />);
    const sections = container.querySelectorAll('.layer-coverage-info-item-right div');
    expect(sections[1].textContent).toContain('monthly layers');
  });
});
