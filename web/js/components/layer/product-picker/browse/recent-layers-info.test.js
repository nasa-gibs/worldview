/* eslint-disable react/prop-types */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import RecentLayersInfo from './recent-layers-info';

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }) => <svg data-testid={`fa-icon-${icon}`} />,
}));

jest.mock('../../../../modules/product-picker/util', () => ({
  recentLayerInfo: 'This is the recent layer information text.',
}));

describe('RecentLayersInfo', () => {
  it('renders without crashing', () => {
    render(<RecentLayersInfo />);
    expect(screen.getByTestId('fa-icon-clock')).toBeInTheDocument();
  });

  it('renders the clock icon', () => {
    render(<RecentLayersInfo />);
    const clockIcon = screen.getByTestId('fa-icon-clock');
    expect(clockIcon).toBeInTheDocument();
  });

  it('renders the heading "Recently Used Layers"', () => {
    render(<RecentLayersInfo />);
    const heading = screen.getByRole('heading', { name: /Recently Used Layers/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders the recentLayerInfo text', () => {
    render(<RecentLayersInfo />);
    const infoText = screen.getByText('This is the recent layer information text.');
    expect(infoText).toBeInTheDocument();
  });

  it('renders within a div with class "no-results"', () => {
    const { container } = render(<RecentLayersInfo />);
    const noResultsDiv = container.querySelector('.no-results');
    expect(noResultsDiv).toBeInTheDocument();
  });

  it('renders all elements in the correct structure', () => {
    const { container } = render(<RecentLayersInfo />);
    const noResultsDiv = container.querySelector('.no-results');

    expect(noResultsDiv).toContainElement(screen.getByTestId('fa-icon-clock'));
    expect(noResultsDiv).toContainElement(screen.getByRole('heading'));
    expect(noResultsDiv).toContainElement(screen.getByText('This is the recent layer information text.'));
  });
});
