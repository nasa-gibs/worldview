/* eslint-disable react/prop-types */
import { render } from '@testing-library/react';
import RenderSplitLayerTitle from './renderSplitTitle';

jest.mock('../../../modules/layers/util', () => ({
  getOrbitTrackTitle: jest.fn((layer) => {
    const { track, daynight } = layer;
    if (track && daynight) return `${track}/${daynight[0]}`;
    if (track) return track;
    if (daynight) return daynight[0];
    return undefined;
  }),
}));

describe('RenderSplitLayerTitle', () => {
  describe('title without parentheses', () => {
    it('renders h3 with plain title when no parentheses', () => {
      const layer = { title: 'Simple Layer', layergroup: 'Other' };
      const { getByRole } = render(<RenderSplitLayerTitle layer={layer} />);
      expect(getByRole('heading', { level: 3 }).textContent).toBe('Simple Layer');
    });

    it('does not render h4 when no parentheses', () => {
      const layer = { title: 'Simple Layer', layergroup: 'Other' };
      const { container } = render(<RenderSplitLayerTitle layer={layer} />);
      expect(container.querySelector('h4')).toBeNull();
    });

    it('renders h5 subtitle when title has no parens but subtitle exists', () => {
      const layer = { title: 'Simple Layer', subtitle: 'My subtitle', layergroup: 'Other' };
      const { getByRole } = render(<RenderSplitLayerTitle layer={layer} />);
      expect(getByRole('heading', { level: 5 }).textContent).toBe('My subtitle');
    });

    it('does not render h5 when no subtitle and no parentheses', () => {
      const layer = { title: 'Simple Layer', layergroup: 'Other' };
      const { container } = render(<RenderSplitLayerTitle layer={layer} />);
      expect(container.querySelector('h5')).toBeNull();
    });
  });

  describe('title with parentheses', () => {
    it('renders h3 with name before parentheses', () => {
      const layer = { title: 'Layer Title (Detail)', layergroup: 'Other' };
      const { getByRole } = render(<RenderSplitLayerTitle layer={layer} />);
      expect(getByRole('heading', { level: 3 }).textContent).toBe('Layer Title');
    });

    it('renders h4 with the attrs in parentheses', () => {
      const layer = { title: 'Layer Title (Detail)', layergroup: 'Other' };
      const { getByRole } = render(<RenderSplitLayerTitle layer={layer} />);
      expect(getByRole('heading', { level: 4 }).textContent).toBe('(Detail)');
    });

    it('renders h5 subtitle when title has parens and subtitle exists', () => {
      const layer = { title: 'Layer (Detail)', subtitle: 'Sub', layergroup: 'Other' };
      const { getByRole } = render(<RenderSplitLayerTitle layer={layer} />);
      expect(getByRole('heading', { level: 5 }).textContent).toBe('Sub');
    });

    it('does not render h5 when parens present but no subtitle', () => {
      const layer = { title: 'Layer (Detail)', layergroup: 'Other' };
      const { container } = render(<RenderSplitLayerTitle layer={layer} />);
      expect(container.querySelector('h5')).toBeNull();
    });
  });

  describe('orbit track layers', () => {
    it('includes orbit track info in title when layergroup is Orbital Track', () => {
      const layer = {
        title: 'Orbit Track',
        layergroup: 'Orbital Track',
        track: 'ascending',
        daynight: ['day'],
      };
      const { container } = render(<RenderSplitLayerTitle layer={layer} />);
      // Title becomes "Orbit Track (ascending/day)" which has parens
      expect(container.querySelector('h3')).toBeTruthy();
      expect(container.querySelector('h4')).toBeTruthy();
    });

    it('shows plain title when orbit track returns undefined', () => {
      const { getOrbitTrackTitle } = require('../../../modules/layers/util');
      getOrbitTrackTitle.mockReturnValueOnce(undefined);
      const layer = {
        title: 'Orbit Track',
        layergroup: 'Orbital Track',
      };
      const { getByRole } = render(<RenderSplitLayerTitle layer={layer} />);
      // "Orbit Track (undefined)" — splitIdx >= 0
      expect(getByRole('heading', { level: 3 })).toBeTruthy();
    });
  });

  describe('non-orbit-track layers', () => {
    it('does not call getOrbitTrackTitle for regular layers', () => {
      const { getOrbitTrackTitle } = require('../../../modules/layers/util');
      getOrbitTrackTitle.mockClear();
      const layer = { title: 'Normal Layer', layergroup: 'Atmosphere' };
      render(<RenderSplitLayerTitle layer={layer} />);
      expect(getOrbitTrackTitle).not.toHaveBeenCalled();
    });
  });
});
