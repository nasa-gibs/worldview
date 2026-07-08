/* eslint-disable react/prop-types */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import GlobalSettings from './global-settings';
import {
  changeTemperatureUnit,
  changeDatelineVisibility,
  changeCoordinateFormat,
} from '../../modules/settings/actions';

jest.mock('../../modules/settings/actions', () => ({
  changeTemperatureUnit: jest.fn(() => ({ type: 'CHANGE_TEMP' })),
  changeDatelineVisibility: jest.fn(() => ({ type: 'CHANGE_DATELINE' })),
  changeCoordinateFormat: jest.fn(() => ({ type: 'CHANGE_COORD' })),
}));

jest.mock('./temperature-unit-buttons', () => ({ changeTemperatureUnit }) => (
  <button data-testid="temp-btn" onClick={() => changeTemperatureUnit('F')} />
));

jest.mock('./coordinate-format-buttons', () => ({ changeCoordinateFormat }) => (
  <button data-testid="coord-btn" onClick={() => changeCoordinateFormat('DMS')} />
));

jest.mock('../util/hover-tooltip', () => () => <div data-testid="hover-tooltip" />);

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <svg data-testid="fa-icon" />,
}));

const mockStore = configureStore([]);

describe('GlobalSettings Component', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      settings: {
        globalTemperatureUnit: 'C',
        alwaysShowDatelines: true,
        coordinateFormat: 'decimal',
      },
    });
    store.dispatch = jest.fn();
    jest.clearAllMocks();
  });

  it('renders the component and buttons properly', () => {
    render(
      <Provider store={store}>
        <GlobalSettings />
      </Provider>,
    );
    expect(screen.getByText('Always')).toBeInTheDocument();
    expect(screen.getByText('On Hover')).toBeInTheDocument();
    expect(screen.getByText('Show Antimeridian / Approximate Date Line')).toBeInTheDocument();
  });

  it('dispatches toggleAlwaysShowDatelines(true) on "Always" button click', () => {
    render(
      <Provider store={store}>
        <GlobalSettings />
      </Provider>,
    );
    fireEvent.click(screen.getByText('Always'));
    expect(changeDatelineVisibility).toHaveBeenCalledWith(true);
    expect(store.dispatch).toHaveBeenCalled();
  });

  it('dispatches toggleAlwaysShowDatelines(false) on "On Hover" button click', () => {
    render(
      <Provider store={store}>
        <GlobalSettings />
      </Provider>,
    );
    fireEvent.click(screen.getByText('On Hover'));
    expect(changeDatelineVisibility).toHaveBeenCalledWith(false);
    expect(store.dispatch).toHaveBeenCalled();
  });

  it('dispatches changeTemperatureUnit action triggered by child component', () => {
    render(
      <Provider store={store}>
        <GlobalSettings />
      </Provider>,
    );
    fireEvent.click(screen.getByTestId('temp-btn'));
    expect(changeTemperatureUnit).toHaveBeenCalledWith('F');
    expect(store.dispatch).toHaveBeenCalled();
  });

  it('dispatches changeCoordinateFormat action triggered by child component', () => {
    render(
      <Provider store={store}>
        <GlobalSettings />
      </Provider>,
    );
    fireEvent.click(screen.getByTestId('coord-btn'));
    expect(changeCoordinateFormat).toHaveBeenCalledWith('DMS');
    expect(store.dispatch).toHaveBeenCalled();
  });
});
