import { render } from '@testing-library/react';
import SimpleStatistics from './simple-statistics';

describe('SimpleStatistics', () => {
  const standardData = {
    date: '2023-01-01',
    statData: {
      median: '10.1234',
      mean: 15.5678,
      min: '1.2',
      max: 100.999,
      stdev: '2.3456',
    },
  };

  const largeNumberData = {
    date: '2023-01-02',
    statData: {
      median: '12345.67',
      mean: '98765.43',
      min: 0,
      max: '1000000',
      stdev: 1234.5,
    },
  };

  it('renders dates and labels correctly', () => {
    const { getByText } = render(<SimpleStatistics data={standardData} />);

    expect(getByText('Date: 2023-01-01')).toBeTruthy();
    expect(getByText('Median:')).toBeTruthy();
    expect(getByText('Mean:')).toBeTruthy();
    expect(getByText('Min:')).toBeTruthy();
    expect(getByText('Max:')).toBeTruthy();
    expect(getByText('Stdev:')).toBeTruthy();
    expect(getByText(/Numerical analyses performed on imagery should/i)).toBeTruthy();
  });

  it('formats standard numbers to three decimal places', () => {
    const { getByText } = render(<SimpleStatistics data={standardData} />);

    expect(getByText('10.123')).toBeTruthy();
    expect(getByText('15.568')).toBeTruthy();
    expect(getByText('1.200')).toBeTruthy();
    expect(getByText('2.346')).toBeTruthy();
  });

  it('formats large numbers using scientific notation precision when digits before decimal are greater than 4', () => {
    const { getByText } = render(<SimpleStatistics data={largeNumberData} />);

    expect(getByText('1.23e+4')).toBeTruthy();
    expect(getByText('9.88e+4')).toBeTruthy();
    expect(getByText('1.00e+6')).toBeTruthy();
    expect(getByText('1234.500')).toBeTruthy();
  });
});
