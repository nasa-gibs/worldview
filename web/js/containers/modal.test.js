/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

let capturedMapState;
let capturedMapDispatch;
jest.mock('react-redux', () => ({
  connect: (mapState, mapDispatch) => {
    capturedMapState = mapState;
    capturedMapDispatch = mapDispatch;
    return (Component) => Component;
  },
}));

let mockModalProps = null;
jest.mock('reactstrap', () => ({
  Modal: (props) => {
    mockModalProps = props;
    return (
      <div data-testid="modal" id={props.id} className={props.className}>
        {props.children}
      </div>
    );
  },
  ModalBody: ({ children }) => <div data-testid="modal-body">{children}</div>,
  ModalHeader: (props) => (
    <div data-testid="modal-header">
      {props.children}
      {props.close}
    </div>
  ),
  ModalFooter: () => <div data-testid="modal-footer" />,
}));

let mockResizableProps = null;
jest.mock('react-resizable', () => ({
  Resizable: (props) => {
    mockResizableProps = props;
    return <div data-testid="resizable">{props.children}</div>;
  },
}));

jest.mock('../components/util/detect-outer-click', () => (props) => (
  <div data-testid="detect-outer-click">{props.children}</div>
));

jest.mock('./error-boundary', () => ({ children }) => <div>{children}</div>);

jest.mock('../util/customHooks', () => {
  const { useRef, useEffect } = require('react');
  return (val) => {
    const ref = useRef();
    useEffect(() => {
      ref.current = val;
    });
    return ref.current;
  };
});

jest.mock('../modules/modal/actions', () => ({
  onToggle: jest.fn(() => ({ type: 'MODAL_TOGGLE' })),
}));

const ModalContainer = require('./modal').default;
const { onToggle: onToggleAction } = require('../modules/modal/actions');

const defaultProps = {
  isCustom: false,
  id: 'TEST_MODAL',
  isOpen: true,
  customProps: {},
  isMobile: false,
  screenHeight: 800,
  screenWidth: 1200,
  isEmbedModeActive: false,
  isTemplateModal: false,
  bodyText: 'modal body text',
  headerText: 'Test Header',
  onToggle: jest.fn(),
};

const renderComponent = (props = {}) => render(
  <ModalContainer {...defaultProps} {...props} />,
);

beforeEach(() => {
  jest.clearAllMocks();
  mockModalProps = null;
  mockResizableProps = null;
});

describe('ModalContainer basic rendering', () => {
  it('renders header and body text', () => {
    const { getByText, getByTestId } = renderComponent();
    expect(getByTestId('modal-header')).toHaveTextContent('Test Header');
    expect(getByText('modal body text')).toBeInTheDocument();
    expect(mockModalProps.id).toBe('test_modal');
    expect(mockModalProps.className).toBe('default-modal');
  });

  it('toggle includes onClose when modal is open', () => {
    const onToggle = jest.fn();
    const onClose = jest.fn();
    const { container } = renderComponent({ onToggle, onClose });
    fireEvent.click(container.querySelector('.modal-close-btn'));
    expect(onToggle).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('uses plain onToggle when modal is closed', () => {
    const onToggle = jest.fn();
    const onClose = jest.fn();
    renderComponent({ onToggle, onClose, isOpen: false });
    expect(mockModalProps.toggle).toBe(onToggle);
  });

  it('merges customProps when isCustom and id are set', () => {
    const { getByText } = renderComponent({
      isCustom: true,
      customProps: { bodyText: 'custom body', headerText: 'Custom Header' },
    });
    expect(getByText('custom body')).toBeInTheDocument();
  });

  it('renders a body component with closeModal and parentId', () => {
    let receivedProps = null;
    function Body(props) {
      receivedProps = props;
      return <div>body component</div>;
    }
    const { getByText } = renderComponent({
      isCustom: true,
      customProps: { bodyComponent: Body, bodyComponentProps: { extra: 7 } },
    });
    expect(getByText('body component')).toBeInTheDocument();
    expect(receivedProps.parentId).toBe('TEST_MODAL');
    expect(receivedProps.extra).toBe(7);
    expect(receivedProps.screenHeight).toBe(800);
  });

  it('renders bodyHeader when provided', () => {
    const { getByText } = renderComponent({
      isCustom: true,
      customProps: { bodyHeader: 'A Header' },
    });
    expect(getByText('A Header')).toBeInTheDocument();
  });

  it('renders footer when provided', () => {
    const { getByTestId } = renderComponent({
      isCustom: true,
      customProps: { footer: true },
    });
    expect(getByTestId('modal-footer')).toBeInTheDocument();
  });

  it('renders a CompletelyCustomModal with toggleWithClose', () => {
    let receivedProps = null;
    function CustomModal(props) {
      receivedProps = props;
      return <div>completely custom</div>;
    }
    const { getByText } = renderComponent({
      isCustom: true,
      customProps: { CompletelyCustomModal: CustomModal, dialogKey: 3 },
    });
    expect(getByText('completely custom')).toBeInTheDocument();
    expect(receivedProps.toggleWithClose).toBeDefined();
  });
});

describe('restricted display', () => {
  it('returns null for desktopOnly modals on mobile', () => {
    const { container } = renderComponent({ isMobile: true, desktopOnly: true });
    expect(container).toBeEmptyDOMElement();
  });

  it('returns null for mobileOnly modals on desktop', () => {
    const { container } = renderComponent({
      isCustom: true,
      customProps: { mobileOnly: true },
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('returns null for large modals in embed mode', () => {
    const { container } = renderComponent({
      isEmbedModeActive: true,
      isCustom: true,
      customProps: { size: 'lg' },
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders LAYER_INFO_MODAL even in embed mode', () => {
    const { queryByTestId } = renderComponent({
      id: 'LAYER_INFO_MODAL',
      isEmbedModeActive: true,
      isCustom: true,
      customProps: { size: 'lg' },
    });
    expect(queryByTestId('modal')).toBeInTheDocument();
  });

  it('calls toggle for desktopOnly modal opened on mobile', () => {
    const onToggle = jest.fn();
    renderComponent({ isMobile: true, desktopOnly: true, onToggle });
    expect(onToggle).toHaveBeenCalled();
  });
});

describe('template modals', () => {
  it('renders loading text while the template loads', () => {
    const { getByText } = renderComponent({
      isTemplateModal: true,
      bodyTemplate: { isLoading: true },
    });
    expect(getByText('Loading')).toBeInTheDocument();
    expect(mockModalProps.className).toBe('template-modal');
  });

  it('renders template html content when loaded', () => {
    const { container } = renderComponent({
      isTemplateModal: true,
      bodyTemplate: { isLoading: false, response: '<b>tpl-content</b>' },
    });
    expect(container.querySelector('#template-content').innerHTML).toBe('<b>tpl-content</b>');
  });
});

describe('resizing and styles', () => {
  it('wraps children in Resizable when isResizable', () => {
    const { getByTestId } = renderComponent({
      isCustom: true,
      customProps: { isResizable: true, width: 400, height: 500 },
    });
    expect(getByTestId('resizable')).toBeInTheDocument();
    expect(mockResizableProps.width).toBe(400);
  });

  it('onResize updates modal width and height style', () => {
    renderComponent({
      isCustom: true,
      customProps: { isResizable: true, width: 400, height: 500 },
    });
    act(() => {
      mockResizableProps.onResize(
        { stopPropagation: jest.fn() },
        { size: { width: 321, height: 432 } },
      );
    });
    expect(mockModalProps.style.width).toBe(321);
    expect(mockModalProps.style.height).toBe(432);
  });

  it('applies mobile fullscreen top offset', () => {
    renderComponent({
      isMobile: true,
      isCustom: true,
      customProps: { mobileFullScreen: true },
    });
    expect(mockModalProps.style.top).toBe(106);
    expect(mockModalProps.style.margin).toBe(0);
    // landscape resize applied via effect (screenHeight < screenWidth)
    expect(mockModalProps.style.width).toBe(445);
    expect(mockModalProps.style.height).toBe(300);
  });

  it('applies portrait fullscreen sizing when height exceeds width', () => {
    renderComponent({
      isMobile: true,
      isCustom: true,
      screenHeight: 900,
      screenWidth: 400,
      customProps: { mobileFullScreen: true },
    });
    expect(mockModalProps.style.width).toBe(400);
    expect(mockModalProps.style.height).toBe(794);
  });

  it('uses offset props for style on desktop', () => {
    renderComponent({
      isCustom: true,
      customProps: { offsetLeft: 11, offsetTop: 22, offsetRight: 33 },
    });
    expect(mockModalProps.style.left).toBe(11);
    expect(mockModalProps.style.top).toBe(22);
    expect(mockModalProps.style.right).toBe(33);
    expect(mockModalProps.style.margin).toBe('0.5rem auto');
  });
});

describe('dragging', () => {
  const dragProps = {
    isCustom: true,
    customProps: {
      isDraggable: true,
      dragHandle: '.drag-handle',
      offsetLeft: 100,
      offsetTop: 100,
      width: 300,
      height: 200,
      bodyComponent: () => (
        <div className="drag-handle">
          <span data-testid="drag-target">drag me</span>
        </div>
      ),
    },
  };

  it('moves the modal on drag', () => {
    const { getByTestId } = renderComponent(dragProps);
    const target = getByTestId('drag-target');
    act(() => {
      fireEvent.mouseDown(target, { button: 0, clientX: 10, clientY: 10 });
    });
    act(() => {
      fireEvent.mouseMove(window, { clientX: 60, clientY: 40 });
    });
    expect(mockModalProps.style.left).toBe(150);
    expect(mockModalProps.style.top).toBe(130);
    act(() => {
      fireEvent.mouseUp(window);
    });
    // after mouseup further movement is ignored
    act(() => {
      fireEvent.mouseMove(window, { clientX: 600, clientY: 400 });
    });
    expect(mockModalProps.style.left).toBe(150);
  });

  it('clamps movement onscreen when stayOnscreen is set', () => {
    const { getByTestId } = renderComponent({
      ...dragProps,
      customProps: { ...dragProps.customProps, stayOnscreen: true },
    });
    const target = getByTestId('drag-target');
    act(() => {
      fireEvent.mouseDown(target, { button: 0, clientX: 0, clientY: 0 });
    });
    act(() => {
      fireEvent.mouseMove(window, { clientX: 5000, clientY: 5000 });
    });
    // maxLeft = 1200-300, maxTop = 800-200
    expect(mockModalProps.style.left).toBe(900);
    expect(mockModalProps.style.top).toBe(600);
  });

  it('ignores non-left-button mousedown', () => {
    const { getByTestId } = renderComponent(dragProps);
    act(() => {
      fireEvent.mouseDown(getByTestId('drag-target'), { button: 2, clientX: 10, clientY: 10 });
    });
    act(() => {
      fireEvent.mouseMove(window, { clientX: 60, clientY: 40 });
    });
    expect(mockModalProps.style.left).toBe(100);
  });

  it('ignores mousedown outside the drag handle', () => {
    const { getByTestId } = renderComponent({
      ...dragProps,
      customProps: {
        ...dragProps.customProps,
        bodyComponent: () => <span data-testid="outside-target">outside</span>,
      },
    });
    act(() => {
      fireEvent.mouseDown(getByTestId('outside-target'), { button: 0, clientX: 10, clientY: 10 });
    });
    act(() => {
      fireEvent.mouseMove(window, { clientX: 60, clientY: 40 });
    });
    expect(mockModalProps.style.left).toBe(100);
  });
});

describe('mapStateToProps', () => {
  const makeState = (modalOverrides = {}) => ({
    embed: { isEmbedModeActive: true },
    modal: {
      bodyText: 'text',
      headerText: 'header',
      isCustom: true,
      id: 'SOME_MODAL',
      isOpen: true,
      template: null,
      customProps: { a: 1 },
      ...modalOverrides,
    },
    screenSize: {
      screenHeight: 700,
      screenWidth: 1000,
      orientation: 'landscape',
      isMobileDevice: true,
    },
  });

  it('maps modal state', () => {
    const result = capturedMapState(makeState());
    expect(result.bodyText).toBe('text');
    expect(result.headerText).toBe('header');
    expect(result.isCustom).toBe(true);
    expect(result.id).toBe('SOME_MODAL');
    expect(result.isOpen).toBe(true);
    expect(result.isTemplateModal).toBe(false);
    expect(result.bodyTemplate).toBeUndefined();
    expect(result.isMobile).toBe(true);
    expect(result.isEmbedModeActive).toBe(true);
    expect(result.screenHeight).toBe(700);
  });

  it('resolves template state when modal has a template', () => {
    const state = makeState({ template: 'someTemplate' });
    state.someTemplate = { isLoading: false, response: 'tpl' };
    const result = capturedMapState(state);
    expect(result.isTemplateModal).toBe(true);
    expect(result.bodyTemplate).toEqual({ isLoading: false, response: 'tpl' });
  });
});

describe('mapDispatchToProps', () => {
  it('onToggle dispatches the modal toggle action', () => {
    const dispatch = jest.fn();
    const props = capturedMapDispatch(dispatch);
    props.onToggle();
    expect(onToggleAction).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({ type: 'MODAL_TOGGLE' });
  });
});
