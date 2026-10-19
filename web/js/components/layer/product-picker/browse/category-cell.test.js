/* eslint-disable react/jsx-props-no-spreading */
import '@testing-library/jest-dom';
import { render, fireEvent, screen } from '@testing-library/react';
import CategoryCell from './category-cell';

describe('CategoryCell', () => {
  let baseProps;

  beforeEach(() => {
    baseProps = {
      category: {
        id: 'cat-1',
        title: 'Test Category',
        image: 'test-image.png',
        measurements: ['meas1', 'meas2'],
      },
      measurementConfig: {
        meas1: { id: 'm1', title: 'Measurement 1' },
        meas2: { id: 'm2', title: 'Measurement 2' },
      },
      drawMeasurements: jest.fn(),
      hasMeasurementSource: jest.fn(() => true),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with an image and measurements', () => {
    render(<CategoryCell {...baseProps} />);

    expect(screen.getByText('Test Category')).toBeInTheDocument();
    expect(screen.getByText('Measurement 1')).toBeInTheDocument();
    expect(screen.getByText('Measurement 2')).toBeInTheDocument();
  });

  it('renders correctly without an image', () => {
    const propsWithoutImage = {
      ...baseProps,
      category: {
        ...baseProps.category,
        image: null,
      },
    };

    const { container } = render(<CategoryCell {...propsWithoutImage} />);
    const backgroundDiv = container.querySelector('.category-background-cover');
    expect(backgroundDiv).toBeInTheDocument();
  });

  it('calls drawMeasurements with category when category title is clicked', () => {
    render(<CategoryCell {...baseProps} />);

    const titleButton = screen.getByText('Test Category');
    fireEvent.click(titleButton);

    expect(baseProps.drawMeasurements).toHaveBeenCalledWith(baseProps.category);
  });

  it('calls drawMeasurements with category, current.id, and index when a measurement is clicked', () => {
    render(<CategoryCell {...baseProps} />);

    const measurementButton = screen.getByText('Measurement 1');
    fireEvent.click(measurementButton);

    expect(baseProps.drawMeasurements).toHaveBeenCalledWith(baseProps.category, 'm1', 0);
  });

  it('renders ellipsis button and handles click when there are 7 or more measurements', () => {
    const propsWithManyMeasurements = {
      ...baseProps,
      category: {
        ...baseProps.category,
        measurements: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8'],
      },
      measurementConfig: {
        m1: { id: 'm1', title: 'M 1' },
        m2: { id: 'm2', title: 'M 2' },
        m3: { id: 'm3', title: 'M 3' },
        m4: { id: 'm4', title: 'M 4' },
        m5: { id: 'm5', title: 'M 5' },
        m6: { id: 'm6', title: 'M 6' },
        m7: { id: 'm7', title: 'M 7' },
        m8: { id: 'm8', title: 'M 8' },
      },
    };

    render(<CategoryCell {...propsWithManyMeasurements} />);

    const ellipsisButton = screen.getByText('...');
    expect(ellipsisButton).toBeInTheDocument();

    fireEvent.click(ellipsisButton);
    expect(propsWithManyMeasurements.drawMeasurements)
      .toHaveBeenCalledWith(propsWithManyMeasurements.category);
  });

  it('throws an error if a measurement lacks a config entry', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const propsWithMissingConfig = {
      ...baseProps,
      category: {
        ...baseProps.category,
        measurements: ['missing_meas'],
      },
    };

    expect(() => render(<CategoryCell {...propsWithMissingConfig} />)).toThrow(
      'No measurement config entry for "missing_meas".',
    );

    consoleSpy.mockRestore();
  });
});
