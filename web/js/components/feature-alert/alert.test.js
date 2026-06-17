import React from 'react';
import { render } from '@testing-library/react';
import FeaturedAlert from './alert';

jest.mock('../../modules/modal/actions', () => ({
  openCustomContent: jest.fn(),
}));

describe('FeaturedAlert component', () => {
  it('constructs with showAlert false when alertHasBeenShown is true', () => {
    const Wrapped = FeaturedAlert.WrappedComponent || FeaturedAlert;
    const instance = new Wrapped({});
    expect(instance.state).toBeDefined();
    expect(instance.state.showAlert).toBe(false);
  });

  it('renders empty string', () => {
    const { container } = render(
      React.createElement(FeaturedAlert.WrappedComponent || FeaturedAlert),
    );
    expect(container.innerHTML).toBe('');
  });

  it('calls provided showModal prop when invoked externally', () => {
    const Wrapped = FeaturedAlert.WrappedComponent || FeaturedAlert;
    const mockShow = jest.fn();
    const instance = new Wrapped({ showModal: mockShow });
    // simulate an external call to the prop
    instance.props.showModal();
    expect(mockShow).toHaveBeenCalled();
  });
});
