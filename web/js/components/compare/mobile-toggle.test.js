import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import MobileComparisonToggle from './mobile-toggle';

jest.mock('../../modules/compare/actions', () => ({
  toggleActiveCompareState: jest.fn(() => ({ type: 'TOGGLE_ACTIVE_COMPARE_STATE' })),
}));

const mockStore = configureStore([]);

describe('MobileComparisonToggle', () => {
  it('returns null when active is false', () => {
    const store = mockStore({
      compare: { active: false, isCompareA: true },
    });
    const { container } = render(
      <Provider store={store}>
        <MobileComparisonToggle />
      </Provider>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders A and B buttons when active is true', () => {
    const store = mockStore({
      compare: { active: true, isCompareA: true },
    });
    render(
      <Provider store={store}>
        <MobileComparisonToggle />
      </Provider>,
    );
    expect(screen.getByText('A')).toBeDefined();
    expect(screen.getByText('B')).toBeDefined();
  });

  it('applies selected class to button A when isCompareA is true', () => {
    const store = mockStore({
      compare: { active: true, isCompareA: true },
    });
    render(
      <Provider store={store}>
        <MobileComparisonToggle />
      </Provider>,
    );
    expect(screen.getByText('A').className).toContain('compare-btn-selected');
    expect(screen.getByText('B').className).not.toContain('compare-btn-selected');
  });

  it('applies selected class to button B when isCompareA is false', () => {
    const store = mockStore({
      compare: { active: true, isCompareA: false },
    });
    render(
      <Provider store={store}>
        <MobileComparisonToggle />
      </Provider>,
    );
    expect(screen.getByText('A').className).not.toContain('compare-btn-selected');
    expect(screen.getByText('B').className).toContain('compare-btn-selected');
  });

  it('dispatches toggleActiveCompareState action when clicking B', () => {
    const store = mockStore({
      compare: { active: true, isCompareA: true },
    });
    store.dispatch = jest.fn();
    render(
      <Provider store={store}>
        <MobileComparisonToggle />
      </Provider>,
    );

    fireEvent.click(screen.getByText('B'));

    expect(store.dispatch).toHaveBeenCalled();
  });

  it('dispatches toggleActiveCompareState action when clicking A', () => {
    const store = mockStore({
      compare: { active: true, isCompareA: false },
    });
    store.dispatch = jest.fn();
    render(
      <Provider store={store}>
        <MobileComparisonToggle />
      </Provider>,
    );

    fireEvent.click(screen.getByText('A'));

    expect(store.dispatch).toHaveBeenCalled();
  });

  it('updates selection when isCompareA prop changes', () => {
    const store1 = mockStore({
      compare: { active: true, isCompareA: true },
    });
    const store2 = mockStore({
      compare: { active: true, isCompareA: false },
    });

    const { rerender } = render(
      <Provider store={store1}>
        <MobileComparisonToggle />
      </Provider>,
    );

    expect(screen.getByText('A').className).toContain('compare-btn-selected');

    rerender(
      <Provider store={store2}>
        <MobileComparisonToggle />
      </Provider>,
    );

    expect(screen.getByText('B').className).toContain('compare-btn-selected');
  });
});
