import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

jest.mock('../../../modules/layers/constants', () => ({
  DEFAULT_NUM_GRANULES: 10,
  MIN_GRANULES: 1,
  MAX_GRANULES: 30,
}));
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));
jest.mock('reactstrap', () => {
  const actual = jest.requireActual('reactstrap');
  return { ...actual, UncontrolledTooltip: () => null };
});

import GranuleCountSlider from './granule-count-slider';

const mockStore = configureStore([]);
const store = mockStore({ layers: { active: { granulePlatform: 'Terra' } } });

const defaultProps = {
  count: 10,
  def: { id: 'MODIS_Terra_CorrRefl_TrueColor' },
  granuleDates: ['2023-01-01', '2023-01-02'],
  updateGranuleLayerOptions: jest.fn(),
};

const renderSlider = (overrides = {}) => {
  const props = { ...defaultProps, ...overrides };
  return render(
    <Provider store={store}>
      <GranuleCountSlider
        count={props.count}
        def={props.def}
        granuleDates={props.granuleDates}
        updateGranuleLayerOptions={props.updateGranuleLayerOptions}
      />
    </Provider>,
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GranuleCountSlider', () => {
  describe('layout', () => {
    it('renders the Granule Count heading', () => {
      renderSlider();
      expect(screen.getByText('Granule Count')).toBeInTheDocument();
    });

    it('renders the info icon', () => {
      renderSlider();
      expect(screen.getByTestId('fa-icon')).toBeInTheDocument();
    });

    it('renders the range input', () => {
      renderSlider();
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('displays the current count as the label', () => {
      renderSlider({ count: 15 });
      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });

  describe('range input attributes', () => {
    it('sets min to MIN_GRANULES (1)', () => {
      renderSlider();
      expect(screen.getByRole('slider')).toHaveAttribute('min', '1');
    });

    it('sets max to MAX_GRANULES (30)', () => {
      renderSlider();
      expect(screen.getByRole('slider')).toHaveAttribute('max', '30');
    });

    it('sets defaultValue to the count prop', () => {
      renderSlider({ count: 7 });
      expect(screen.getByRole('slider')).toHaveAttribute('value', '7');
    });
  });

  describe('onChange', () => {
    it('updates the displayed count label when slider changes', () => {
      renderSlider({ count: 10 });
      fireEvent.change(screen.getByRole('slider'), { target: { value: '20' } });
      expect(screen.getByText('20')).toBeInTheDocument();
    });

    it('calls updateGranuleLayerOptions with new value on change', () => {
      const updateGranuleLayerOptions = jest.fn();
      renderSlider({ updateGranuleLayerOptions });
      fireEvent.change(screen.getByRole('slider'), { target: { value: '18' } });
      expect(updateGranuleLayerOptions).toHaveBeenCalledWith(
        defaultProps.granuleDates,
        defaultProps.def,
        18,
      );
    });

    it('calls updateGranuleLayerOptions with parsed integer value', () => {
      const updateGranuleLayerOptions = jest.fn();
      renderSlider({ updateGranuleLayerOptions });
      fireEvent.change(screen.getByRole('slider'), { target: { value: '5' } });
      expect(updateGranuleLayerOptions).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        5,
      );
    });
  });
});
