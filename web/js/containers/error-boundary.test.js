/* eslint-disable react/prop-types */

import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

let capturedMapDispatch;
jest.mock('react-redux', () => ({
  connect: (mapState, mapDispatch) => {
    capturedMapDispatch = mapDispatch;
    return (Component) => Component;
  },
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: (props) => <i data-icon={String(props.icon)} />,
}));

jest.mock('../modules/modal/actions', () => ({
  openCustomContent: jest.fn((id, params) => ({ type: 'OPEN_CUSTOM_CONTENT', id, params })),
}));

const ErrorBoundary = require('./error-boundary').default;
const { openCustomContent } = require('../modules/modal/actions');

function Bomb() {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    const { getByText } = render(
      <ErrorBoundary errorAlert={jest.fn()}>
        <div>safe child</div>
      </ErrorBoundary>,
    );
    expect(getByText('safe child')).toBeInTheDocument();
  });

  it('renders nothing and calls errorAlert when a child throws', () => {
    const errorAlert = jest.fn();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(
      <ErrorBoundary errorAlert={errorAlert}>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(errorAlert).toHaveBeenCalled();
    expect(consoleWarn).toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });
});

describe('mapDispatchToProps', () => {
  it('errorAlert dispatches the error modal with header and body', () => {
    const dispatch = jest.fn();
    const props = capturedMapDispatch(dispatch);
    props.errorAlert();
    expect(openCustomContent).toHaveBeenCalledWith('ERROR_MODAL', expect.objectContaining({
      headerText: 'Error!',
      bodyComponent: expect.any(Function),
    }));
    expect(dispatch).toHaveBeenCalled();
  });

  it('the body component renders the error message content', () => {
    const dispatch = jest.fn();
    capturedMapDispatch(dispatch).errorAlert();
    const { bodyComponent: Body } = openCustomContent.mock.calls.at(-1)[1];
    const { container } = render(<Body />);
    expect(container.querySelector('.error-header')).toBeInTheDocument();
    expect(container.querySelector('.error-body')).toBeInTheDocument();
  });
});
