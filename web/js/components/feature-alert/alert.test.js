import React from 'react';
import { render } from '@testing-library/react';
import FeaturedAlert from './alert';

jest.mock('../../modules/modal/actions', () => ({
  openCustomContent: jest.fn(),
}));

describe('FeaturedAlert component', () => {
  it('renders empty string', () => {
    const Wrapped = FeaturedAlert.WrappedComponent || FeaturedAlert;
    const { container } = render(
      React.createElement(Wrapped),
    );
    expect(container.innerHTML).toBe('');
  });
});
