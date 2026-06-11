/* eslint-disable react/prop-types */
import { render, act } from '@testing-library/react';
import connectMenu from './connectMenu';
import listener from './globalEventListener';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('./globalEventListener', () => ({
  register: jest.fn(() => 'mock-listen-id'),
  unregister: jest.fn(),
}));

jest.mock('./ContextMenuTrigger', () => ({
  propTypes: {
    id: () => {},
    children: () => {},
    collect: () => {},
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MENU_ID = 'test-menu';

// Simple child component that exposes its props via data-testid attributes
function ChildMenu({ id, trigger }) {
  return (
    <div data-testid="child">
      <span data-testid="id">{id}</span>
      <span data-testid="trigger">{trigger ? JSON.stringify(trigger) : 'null'}</span>
    </div>
  );
}

function createConnectedMenu(menuId = MENU_ID) {
  const Connected = connectMenu(menuId)(ChildMenu);
  return Connected;
}

// ---------------------------------------------------------------------------
// Factory / HOC structure
// ---------------------------------------------------------------------------

describe('connectMenu factory', () => {
  it('returns a function (connect) when called with a menuId', () => {
    const connect = connectMenu(MENU_ID);
    expect(typeof connect).toBe('function');
  });

  it('renders the Child component', () => {
    const Connected = createConnectedMenu();
    const { getByTestId } = render(<Connected />);
    expect(getByTestId('child')).toBeTruthy();
  });

  it('forwards menuId as the id prop to Child', () => {
    const Connected = createConnectedMenu();
    const { getByTestId } = render(<Connected />);
    expect(getByTestId('id').textContent).toBe(MENU_ID);
  });

  it('forwards additional props to Child', () => {
    function ChildWithExtra({ extra }) {
      return <div data-testid="extra">{extra}</div>;
    }
    const ConnectedExtra = connectMenu(MENU_ID)(ChildWithExtra);
    const { getByTestId } = render(<ConnectedExtra extra="hello" />);
    expect(getByTestId('extra').textContent).toBe('hello');
  });

  it('initialises trigger state as null', () => {
    const Connected = createConnectedMenu();
    const { getByTestId } = render(<Connected />);
    expect(getByTestId('trigger').textContent).toBe('null');
  });
});

// ---------------------------------------------------------------------------
// Lifecycle — listener registration
// ---------------------------------------------------------------------------

describe('ConnectMenu lifecycle', () => {
  beforeEach(() => jest.clearAllMocks());

  it('registers with the global listener on mount', () => {
    const Connected = createConnectedMenu();
    render(<Connected />);
    expect(listener.register).toHaveBeenCalledTimes(1);
  });

  it('passes handleShow and handleHide to listener.register', () => {
    const Connected = createConnectedMenu();
    render(<Connected />);
    const [showArg, hideArg] = listener.register.mock.calls[0];
    expect(typeof showArg).toBe('function');
    expect(typeof hideArg).toBe('function');
  });

  it('unregisters the listener on unmount', () => {
    const Connected = createConnectedMenu();
    const { unmount } = render(<Connected />);
    unmount();
    expect(listener.unregister).toHaveBeenCalledWith('mock-listen-id');
  });

  it('does not call unregister if listenId was never set', () => {
    listener.register.mockReturnValueOnce(null);
    const Connected = createConnectedMenu();
    const { unmount } = render(<Connected />);
    unmount();
    expect(listener.unregister).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// handleShow
// ---------------------------------------------------------------------------

describe('handleShow()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates trigger state when event id matches menuId', () => {
    const Connected = createConnectedMenu(MENU_ID);
    const { getByTestId } = render(<Connected />);

    const [handleShow] = listener.register.mock.calls[0];

    act(() => {
      handleShow({
        detail: {
          id: MENU_ID,
          data: { customProp: 'value' },
        },
      });
    });

    const trigger = JSON.parse(getByTestId('trigger').textContent);
    expect(trigger.customProp).toBe('value');
  });

  it('does not update state when event id does not match menuId', () => {
    const Connected = createConnectedMenu(MENU_ID);
    const { getByTestId } = render(<Connected />);

    const [handleShow] = listener.register.mock.calls[0];

    act(() => {
      handleShow({
        detail: {
          id: 'different-menu',
          data: { customProp: 'value' },
        },
      });
    });

    expect(getByTestId('trigger').textContent).toBe('null');
  });

  it('filters out ContextMenuTrigger propTypes keys from trigger data', () => {
    const Connected = createConnectedMenu(MENU_ID);
    const { getByTestId } = render(<Connected />);

    const [handleShow] = listener.register.mock.calls[0];

    act(() => {
      handleShow({
        detail: {
          id: MENU_ID,
          data: {
            // 'id' and 'collect' are in ContextMenuTrigger.propTypes → should be filtered
            id: 'should-be-removed',
            collect: 'should-be-removed',
            // custom prop → should be kept
            myCustomData: 'keep-me',
          },
        },
      });
    });

    const trigger = JSON.parse(getByTestId('trigger').textContent);
    expect(trigger.myCustomData).toBe('keep-me');
    expect(trigger.id).toBeUndefined();
    expect(trigger.collect).toBeUndefined();
  });

  it('filters out children key from trigger data', () => {
    const Connected = createConnectedMenu(MENU_ID);
    const { getByTestId } = render(<Connected />);

    const [handleShow] = listener.register.mock.calls[0];

    act(() => {
      handleShow({
        detail: {
          id: MENU_ID,
          data: {
            children: 'should-be-removed',
            myData: 'keep-me',
          },
        },
      });
    });

    const trigger = JSON.parse(getByTestId('trigger').textContent);
    expect(trigger.children).toBeUndefined();
    expect(trigger.myData).toBe('keep-me');
  });

  it('sets trigger to empty object when all data keys are filtered', () => {
    const Connected = createConnectedMenu(MENU_ID);
    const { getByTestId } = render(<Connected />);

    const [handleShow] = listener.register.mock.calls[0];

    act(() => {
      handleShow({
        detail: {
          id: MENU_ID,
          // only ignored keys
          data: { id: 'x', children: 'y', collect: 'z' },
        },
      });
    });

    const trigger = JSON.parse(getByTestId('trigger').textContent);
    expect(trigger).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// handleHide
// ---------------------------------------------------------------------------

describe('handleHide()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('resets trigger state to null', () => {
    const Connected = createConnectedMenu(MENU_ID);
    const { getByTestId } = render(<Connected />);

    const [handleShow, handleHide] = listener.register.mock.calls[0];

    // First show the menu
    act(() => {
      handleShow({
        detail: { id: MENU_ID, data: { myProp: 'hello' } },
      });
    });

    expect(getByTestId('trigger').textContent).not.toBe('null');

    // Then hide it
    act(() => {
      handleHide();
    });

    expect(getByTestId('trigger').textContent).toBe('null');
  });

  it('does not throw when called before handleShow', () => {
    const Connected = createConnectedMenu(MENU_ID);
    render(<Connected />);

    const [, handleHide] = listener.register.mock.calls[0];

    expect(() => act(() => handleHide())).not.toThrow();
  });
});
