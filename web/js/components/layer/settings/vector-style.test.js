/* eslint-disable react/prop-types */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('../../../modules/vector-styles/util', () => ({
  isConditional: jest.fn(() => false),
}));
jest.mock('../../util/scrollbar', () => {
  function MockScrollbar({ children }) {
    return <div data-testid="scrollbar">{children}</div>;
  }
  return MockScrollbar;
});

import VectorStyleSelect from './vector-style';
import { isConditional } from '../../../modules/vector-styles/util';

const makeLayer = (id = 'fire-layer') => ({
  id,
  vectorStyle: { id: 'fire-style' },
});

const makeVectorStyles = (layers) => ({
  'fire-style': { layers },
});

const plainLayer = {
  id: 'fire-layer-plain',
  'source-description': 'Fire Points',
  paint: { 'circle-color': '#ff0000' },
};
const lineLayer = {
  id: 'fire-layer-line',
  paint: { 'line-color': '#00ff00' },
};
const fillLayer = {
  id: 'fire-layer-fill',
  paint: { 'fill-color': '#0000ff' },
};

const defaultProps = {
  activeVectorStyle: 'fire-layer-plain',
  clearStyle: jest.fn(),
  setStyle: jest.fn(),
  groupName: 'active',
  index: 0,
  layer: makeLayer(),
  vectorStyles: makeVectorStyles([plainLayer]),
};

const renderStyle = (overrides = {}) => {
  const props = { ...defaultProps, ...overrides };
  return render(
    <VectorStyleSelect
      activeVectorStyle={props.activeVectorStyle}
      clearStyle={props.clearStyle}
      setStyle={props.setStyle}
      groupName={props.groupName}
      index={props.index}
      layer={props.layer}
      vectorStyles={props.vectorStyles}
    />,
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  isConditional.mockReturnValue(false);
});

describe('VectorStyleSelect', () => {
  describe('layout', () => {
    it('renders the Vector Styles heading', () => {
      renderStyle();
      expect(screen.getByText('Vector Styles')).toBeInTheDocument();
    });

    it('renders the scrollbar', () => {
      renderStyle();
      expect(screen.getByTestId('scrollbar')).toBeInTheDocument();
    });

    it('renders a radio input for each unique style layer', () => {
      renderStyle();
      expect(screen.getAllByRole('radio')).toHaveLength(1);
    });
  });

  describe('single-style item rendering', () => {
    it('renders the source-description as the label when present', () => {
      renderStyle();
      expect(screen.getByText('Fire Points')).toBeInTheDocument();
    });

    it('falls back to layer id as label when source-description is absent', () => {
      renderStyle({ vectorStyles: makeVectorStyles([lineLayer]), activeVectorStyle: 'fire-layer-line' });
      expect(screen.getByText('fire-layer-line')).toBeInTheDocument();
    });

    it('renders the item with "checked" class when it matches activeVectorStyle', () => {
      renderStyle({ activeVectorStyle: 'fire-layer-plain' });
      expect(screen.getByRole('radio').closest('.wv-palette-selector-row')).toHaveClass('checked');
    });

    it('renders item without "checked" class when id does not match activeVectorStyle', () => {
      renderStyle({ activeVectorStyle: 'other-id' });
      expect(screen.getByRole('radio').closest('.wv-palette-selector-row')).not.toHaveClass('checked');
    });

    it('renders using fill-color paint when present', () => {
      renderStyle({ vectorStyles: makeVectorStyles([fillLayer]), activeVectorStyle: 'fire-layer-fill' });
      expect(screen.getByText('fire-layer-fill')).toBeInTheDocument();
    });
  });

  describe('onChangeVectorStyle', () => {
    it('calls setStyle when a non-matching style is selected', () => {
      jest.useFakeTimers();
      const setStyle = jest.fn();
      renderStyle({ setStyle, activeVectorStyle: 'other-id' });
      fireEvent.click(screen.getByRole('radio'));
      jest.runAllTimers();
      expect(setStyle).toHaveBeenCalledWith(defaultProps.layer, 'fire-layer-plain', 'active');
      jest.useRealTimers();
    });

    it('calls clearStyle when selected vectorStyleId matches the layer id', () => {
      jest.useFakeTimers();
      const clearStyle = jest.fn();
      const layer = makeLayer('fire-layer-plain');
      renderStyle({ clearStyle, layer, activeVectorStyle: 'other' });
      fireEvent.click(screen.getByRole('radio'));
      jest.runAllTimers();
      expect(clearStyle).toHaveBeenCalledWith(layer, 'fire-layer-plain', 'active');
      jest.useRealTimers();
    });
  });

  describe('duplicate style deduplication', () => {
    it('renders only unique style layers when duplicates exist', () => {
      renderStyle({ vectorStyles: makeVectorStyles([plainLayer, plainLayer]) });
      expect(screen.getAllByRole('radio')).toHaveLength(1);
    });
  });

  describe('conditional (multi-item) rendering', () => {
    it('renders no radio inputs for conditional styles', () => {
      isConditional.mockReturnValue(true);
      const conditionalLayer = {
        id: 'cond-layer',
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'type'], 'fire'], '#ff0000',
            '#ffffff',
          ],
        },
      };
      renderStyle({ vectorStyles: makeVectorStyles([conditionalLayer]), activeVectorStyle: 'cond-layer' });
      expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    });
  });
});
