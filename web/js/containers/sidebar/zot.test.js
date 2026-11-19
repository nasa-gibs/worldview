/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../util/util', () => ({
  __esModule: true,
  default: {
    encodeId: jest.fn((id) => String(id).replace(/[^a-zA-Z0-9]/g, '-')),
  },
}));

jest.mock('reactstrap', () => ({
  UncontrolledTooltip: function MockTooltip({ children, target, delay, autohide }) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-testid': 'tooltip',
        'data-target': target,
        'data-delay-show': delay ? delay.show : undefined,
        'data-delay-hide': delay ? delay.hide : undefined,
        'data-autohide': String(autohide),
      },
      children,
    );
  },
}));

// ─── Imports after mocks ──────────────────────────────────────────────────────

import Zot from './zot';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const defaultProps = {
  layer: 'layer-abc',
  zot: null,
  isMobile: false,
};

const renderComponent = (propOverrides = {}) => render(
  <Zot {...defaultProps} {...propOverrides} />,
);

// ─── Base rendering ───────────────────────────────────────────────────────────

describe('Zot base rendering', () => {
  it('renders a div with default "zot" class when zot prop is null', () => {
    const { container } = renderComponent();
    expect(container.querySelector('.zot')).toBeInTheDocument();
  });

  it('renders the "!" bold marker', () => {
    const { container } = renderComponent();
    expect(container.querySelector('b').textContent).toBe('!');
  });

  it('renders UncontrolledTooltip', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('tooltip')).toBeInTheDocument();
  });

  it('sets tooltip target to encoded layer id with -zot suffix', () => {
    const { getByTestId } = renderComponent({ layer: 'my:layer' });
    expect(getByTestId('tooltip')).toHaveAttribute('data-target', 'my-layer-zot');
  });

  it('sets div id to encoded layer id with -zot suffix', () => {
    const { container } = renderComponent({ layer: 'my:layer' });
    expect(container.querySelector('.zot').id).toBe('my-layer-zot');
  });

  it('calls util.encodeId with the layer prop', () => {
    const { default: util } = require('../../util/util');
    renderComponent({ layer: 'test-layer' });
    expect(util.encodeId).toHaveBeenCalledWith('test-layer');
  });
});

// ─── isMobile delay ───────────────────────────────────────────────────────────

describe('Zot isMobile delay', () => {
  it('uses show:50, hide:500 delay when isMobile is false', () => {
    const { getByTestId } = renderComponent({ isMobile: false });
    expect(getByTestId('tooltip')).toHaveAttribute('data-delay-show', '50');
    expect(getByTestId('tooltip')).toHaveAttribute('data-delay-hide', '500');
  });

  it('uses show:300, hide:300 delay when isMobile is true', () => {
    const { getByTestId } = renderComponent({ isMobile: true });
    expect(getByTestId('tooltip')).toHaveAttribute('data-delay-show', '300');
    expect(getByTestId('tooltip')).toHaveAttribute('data-delay-hide', '300');
  });

  it('passes autohide=false to tooltip when isMobile is false', () => {
    const { getByTestId } = renderComponent({ isMobile: false });
    expect(getByTestId('tooltip')).toHaveAttribute('data-autohide', 'false');
  });

  it('passes autohide=true to tooltip when isMobile is true', () => {
    const { getByTestId } = renderComponent({ isMobile: true });
    expect(getByTestId('tooltip')).toHaveAttribute('data-autohide', 'true');
  });
});

// ─── no zot prop ──────────────────────────────────────────────────────────────

describe('Zot with no zot prop', () => {
  it('renders plain "zot" class when zot is null', () => {
    const { container } = renderComponent({ zot: null });
    expect(container.querySelector('.zot').className).toBe('zot');
  });

  it('renders empty tooltip content when zot is null', () => {
    const { getByTestId } = renderComponent({ zot: null });
    const inner = getByTestId('tooltip').querySelector('[dangerouslySetInnerHTML]') || getByTestId('tooltip').querySelector('div');
    expect(inner).toBeInTheDocument();
  });
});

// ─── overZoomValue ────────────────────────────────────────────────────────────

describe('Zot with overZoomValue', () => {
  it('adds "overzoom" class when overZoomValue is set', () => {
    const { container } = renderComponent({ zot: { overZoomValue: 3 } });
    expect(container.querySelector('.zot')).toHaveClass('overzoom');
  });

  it('does not add "underzoom" class when overZoomValue is set', () => {
    const { container } = renderComponent({ zot: { overZoomValue: 3 } });
    expect(container.querySelector('.zot')).not.toHaveClass('underzoom');
  });

  it('tooltip contains overzoomed message with multiplier', () => {
    const { getByTestId } = renderComponent({ zot: { overZoomValue: 2 } });
    expect(getByTestId('tooltip').innerHTML).toContain('overzoomed by 2x');
  });
});

// ─── underZoomValue ───────────────────────────────────────────────────────────

describe('Zot with underZoomValue', () => {
  it('adds "underzoom" class when underZoomValue > 0', () => {
    const { container } = renderComponent({ zot: { underZoomValue: 4 } });
    expect(container.querySelector('.zot')).toHaveClass('underzoom');
  });

  it('does not add "overzoom" class when only underZoomValue is set', () => {
    const { container } = renderComponent({ zot: { underZoomValue: 4 } });
    expect(container.querySelector('.zot')).not.toHaveClass('overzoom');
  });

  it('tooltip contains underzoomed message with multiplier', () => {
    const { getByTestId } = renderComponent({ zot: { underZoomValue: 4 } });
    expect(getByTestId('tooltip').innerHTML).toContain('underzoomed by 4x');
  });

  it('does not add underzoom class when underZoomValue is 0', () => {
    const { container } = renderComponent({ zot: { underZoomValue: 0 } });
    expect(container.querySelector('.zot').className).toBe('zot');
  });

  it('does not add underzoom class when underZoomValue is negative', () => {
    const { container } = renderComponent({ zot: { underZoomValue: -1 } });
    expect(container.querySelector('.zot').className).toBe('zot');
  });
});

// ─── hasGranules ──────────────────────────────────────────────────────────────

describe('Zot with hasGranules', () => {
  it('adds "no-granules" class when hasGranules is false and property exists', () => {
    const { container } = renderComponent({ zot: { hasGranules: false } });
    expect(container.querySelector('.zot')).toHaveClass('no-granules');
  });

  it('does not add "no-granules" class when hasGranules is true', () => {
    const { container } = renderComponent({ zot: { hasGranules: true } });
    expect(container.querySelector('.zot').className).toBe('zot');
  });

  it('does not add "no-granules" class when hasGranules key is absent', () => {
    const { container } = renderComponent({ zot: {} });
    expect(container.querySelector('.zot').className).toBe('zot');
  });

  it('tooltip contains no-imagery message when hasGranules is false', () => {
    const { getByTestId } = renderComponent({ zot: { hasGranules: false } });
    expect(getByTestId('tooltip').innerHTML).toContain('No visible imagery');
  });
});

// ─── layerNotices ─────────────────────────────────────────────────────────────

describe('Zot with layerNotices', () => {
  it('adds "layer-notice" class when layerNotices is set', () => {
    const { container } = renderComponent({ zot: { layerNotices: 'Some notice.' } });
    expect(container.querySelector('.zot')).toHaveClass('layer-notice');
  });

  it('appends layerNotices text to tooltip', () => {
    const { getByTestId } = renderComponent({ zot: { layerNotices: 'Custom notice text.' } });
    expect(getByTestId('tooltip').innerHTML).toContain('Custom notice text.');
  });

  it('applies both "overzoom" and "layer-notice" classes when both are set', () => {
    const { container } = renderComponent({ zot: { overZoomValue: 2, layerNotices: 'Also a notice.' } });
    const el = container.querySelector('.zot');
    expect(el).toHaveClass('overzoom');
    expect(el).toHaveClass('layer-notice');
  });

  it('tooltip contains both overzoom and notice text when both are set', () => {
    const { getByTestId } = renderComponent({ zot: { overZoomValue: 2, layerNotices: 'Notice here.' } });
    expect(getByTestId('tooltip').innerHTML).toContain('overzoomed by 2x');
    expect(getByTestId('tooltip').innerHTML).toContain('Notice here.');
  });

  it('layerNotices overrides underzoom class (layerNotices wins)', () => {
    const { container } = renderComponent({ zot: { underZoomValue: 3, layerNotices: 'A notice.' } });
    const el = container.querySelector('.zot');
    expect(el).toHaveClass('layer-notice');
  });

  it('layerNotices overrides no-granules class', () => {
    const { container } = renderComponent({ zot: { hasGranules: false, layerNotices: 'A notice.' } });
    const el = container.querySelector('.zot');
    expect(el).toHaveClass('layer-notice');
    expect(el).not.toHaveClass('no-granules');
  });
});
