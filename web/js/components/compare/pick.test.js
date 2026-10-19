/* eslint-disable react/jsx-props-no-spreading */
import { render } from '@testing-library/react';
import Pick from './pick';

describe('Pick', () => {
  const defaultProps = {
    color: '#ff0000',
    height: 60,
    max: 100,
    path: 'M0,0 L10,10',
    position: 50,
    width: 20,
    yOffset: 30,
  };

  it('renders correctly without text prop', () => {
    const { container } = render(
      <svg>
        <Pick {...defaultProps} />
      </svg>,
    );

    const groupElement = container.querySelector('g');
    expect(groupElement).toBeDefined();
    expect(groupElement.getAttribute('transform')).toBe('translate(50,30)');

    const pathElement = container.querySelector('path');
    expect(pathElement).toBeDefined();
    expect(pathElement.getAttribute('d')).toBe(defaultProps.path);
    expect(pathElement.getAttribute('style')).toContain('visibility: visible');
    expect(pathElement.getAttribute('style')).toContain('fill: #ff0000');

    const textElement = container.querySelector('text');
    expect(textElement).toBeNull();
  });

  it('renders text when text prop is provided', () => {
    const { container } = render(
      <svg>
        <Pick {...defaultProps} text="Pick Label" />
      </svg>,
    );

    const textElement = container.querySelector('text');
    expect(textElement).toBeDefined();
    expect(textElement.textContent).toBe('Pick Label');
    expect(textElement.getAttribute('style')).toContain('visibility: visible');
  });

  it('applies hidden visibility when position is less than 0', () => {
    const { container } = render(
      <svg>
        <Pick {...defaultProps} position={-5} text="Hidden Label" />
      </svg>,
    );

    const pathElement = container.querySelector('path');
    expect(pathElement.getAttribute('style')).toContain('visibility: hidden');

    const textElement = container.querySelector('text');
    expect(textElement.getAttribute('style')).toContain('visibility: hidden');
  });

  it('applies hidden visibility when position is greater than max', () => {
    const { container } = render(
      <svg>
        <Pick {...defaultProps} position={150} />
      </svg>,
    );

    const pathElement = container.querySelector('path');
    expect(pathElement.getAttribute('style')).toContain('visibility: hidden');
  });

  it('handles rendering with minimal props', () => {
    const minimalProps = {
      height: 100,
      max: 200,
      path: 'M0,0',
      position: 100,
      width: 50,
      yOffset: 10,
    };
    const { container } = render(
      <svg>
        <Pick {...minimalProps} />
      </svg>,
    );

    const pathElement = container.querySelector('path');
    expect(pathElement).toBeDefined();
    expect(pathElement.getAttribute('style')).not.toContain('fill:');
  });
});
