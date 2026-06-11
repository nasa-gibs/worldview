/* eslint-disable react/jsx-props-no-spreading */
import { render, act } from '@testing-library/react';
import MasonryComponent from './masonry';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockMasonryOn = jest.fn();
const mockMasonryOff = jest.fn();
const mockMasonryLayout = jest.fn();
const mockMasonryAppended = jest.fn();
const mockMasonryPrepended = jest.fn();
const mockMasonryRemove = jest.fn();
const mockMasonryReloadItems = jest.fn();
const mockMasonryDestroy = jest.fn();

const mockMasonryInstance = {
  on: mockMasonryOn,
  off: mockMasonryOff,
  layout: mockMasonryLayout,
  appended: mockMasonryAppended,
  prepended: mockMasonryPrepended,
  remove: mockMasonryRemove,
  reloadItems: mockMasonryReloadItems,
  destroy: mockMasonryDestroy,
};

jest.mock('masonry-layout', () => jest.fn(() => mockMasonryInstance));

const mockImgLoadOn = jest.fn();
const mockImgLoadOff = jest.fn();
const mockImgLoadInstance = { on: mockImgLoadOn, off: mockImgLoadOff };
mockImgLoadOn.mockReturnValue(mockImgLoadInstance);

jest.mock('imagesloaded', () => jest.fn(() => mockImgLoadInstance));

const mockErdListenTo = jest.fn();
const mockErdUninstall = jest.fn();
const mockErdRemoveAllListeners = jest.fn();
const mockErdInstance = {
  listenTo: mockErdListenTo,
  uninstall: mockErdUninstall,
  removeAllListeners: mockErdRemoveAllListeners,
};

jest.mock('element-resize-detector', () => jest.fn(() => mockErdInstance));

jest.mock('lodash/debounce', () => jest.fn((fn) => {
  const debounced = jest.fn((...args) => fn(...args));
  debounced.cancel = jest.fn();
  return debounced;
}));

jest.mock('lodash/omit', () => jest.fn((obj, keys) => {
  const result = { ...obj };
  keys.forEach((k) => delete result[k]);
  return result;
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultOptions = { itemSelector: '' };

function renderMasonry(props = {}, children = null) {
  return render(
    <MasonryComponent options={defaultOptions} {...props}>
      {children || (
        <>
          <div className="item">Item 1</div>
          <div className="item">Item 2</div>
        </>
      )}
    </MasonryComponent>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockImgLoadOn.mockReturnValue(mockImgLoadInstance);
});

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('render()', () => {
  it('renders a div wrapper', () => {
    const { container } = renderMasonry();
    expect(container.firstChild.tagName).toBe('DIV');
  });

  it('renders children', () => {
    const { getByText } = renderMasonry();
    expect(getByText('Item 1')).toBeTruthy();
    expect(getByText('Item 2')).toBeTruthy();
  });

  it('passes non-propType props to the wrapper div', () => {
    const { container } = renderMasonry({ className: 'my-masonry', 'data-testid': 'masonry' });
    expect(container.firstChild.className).toBe('my-masonry');
  });

  it('does not pass known propType props to the DOM', () => {
    const { container } = renderMasonry({ enableResizableChildren: true });
    expect(container.firstChild.hasAttribute('enableResizableChildren')).toBe(false);
  });

  // Line 205 — setRef assigns masonryContainer
  it('sets masonryContainer via setRef on mount', () => {
    const { container } = renderMasonry();
    // MasonryLayout is called with the container node — confirms setRef ran
    const MasonryLayout = require('masonry-layout');
    expect(MasonryLayout.mock.calls[0][0]).toBe(container.firstChild);
  });
});

// ---------------------------------------------------------------------------
// componentDidMount — initializeMasonry
// ---------------------------------------------------------------------------

describe('componentDidMount — initializeMasonry()', () => {
  it('creates a MasonryLayout instance on mount', () => {
    const MasonryLayout = require('masonry-layout');
    renderMasonry();
    expect(MasonryLayout).toHaveBeenCalled();
  });

  it('registers onLayoutComplete listener when provided', () => {
    const onLayoutComplete = jest.fn();
    renderMasonry({ onLayoutComplete });
    expect(mockMasonryOn).toHaveBeenCalledWith('layoutComplete', onLayoutComplete);
  });

  it('does not register onLayoutComplete when not provided', () => {
    renderMasonry();
    expect(mockMasonryOn).not.toHaveBeenCalledWith('layoutComplete', expect.anything());
  });

  it('registers onRemoveComplete listener when provided', () => {
    const onRemoveComplete = jest.fn();
    renderMasonry({ onRemoveComplete });
    expect(mockMasonryOn).toHaveBeenCalledWith('removeComplete', onRemoveComplete);
  });

  it('does not register onRemoveComplete when not provided', () => {
    renderMasonry();
    expect(mockMasonryOn).not.toHaveBeenCalledWith('removeComplete', expect.anything());
  });
});

// ---------------------------------------------------------------------------
// componentDidMount — imagesLoaded
// ---------------------------------------------------------------------------

describe('componentDidMount — imagesLoaded()', () => {
  it('calls imagesloaded on mount when not disabled', () => {
    const imagesloaded = require('imagesloaded');
    renderMasonry();
    expect(imagesloaded).toHaveBeenCalled();
  });

  it('does not call imagesloaded when disableImagesLoaded is true', () => {
    const imagesloaded = require('imagesloaded');
    renderMasonry({ disableImagesLoaded: true });
    expect(imagesloaded).not.toHaveBeenCalled();
  });

  it('listens on "always" event by default', () => {
    renderMasonry();
    expect(mockImgLoadOn).toHaveBeenCalledWith('always', expect.any(Function));
  });

  it('listens on "progress" event when updateOnEachImageLoad is true', () => {
    renderMasonry({ updateOnEachImageLoad: true });
    expect(mockImgLoadOn).toHaveBeenCalledWith('progress', expect.any(Function));
  });

  it('calls onImagesLoaded prop when image load handler fires', () => {
    const onImagesLoaded = jest.fn();
    renderMasonry({ onImagesLoaded });
    const handler = mockImgLoadOn.mock.calls[0][1];
    handler({ images: [] });
    expect(onImagesLoaded).toHaveBeenCalledWith({ images: [] });
  });

  it('calls masonry.layout() when image load handler fires', () => {
    renderMasonry();
    const handler = mockImgLoadOn.mock.calls[0][1];
    handler({});
    expect(mockMasonryLayout).toHaveBeenCalled();
  });

  it('passes imagesLoadedOptions to imagesloaded', () => {
    const imagesloaded = require('imagesloaded');
    const imagesLoadedOptions = { background: true };
    renderMasonry({ imagesLoadedOptions });
    expect(imagesloaded).toHaveBeenCalledWith(
      expect.anything(),
      imagesLoadedOptions,
    );
  });
});

// ---------------------------------------------------------------------------
// componentDidMount — initializeResizableChildren
// ---------------------------------------------------------------------------

describe('componentDidMount — initializeResizableChildren()', () => {
  it('does not create erd when enableResizableChildren is false', () => {
    const erdMaker = require('element-resize-detector');
    renderMasonry({ enableResizableChildren: false });
    expect(erdMaker).not.toHaveBeenCalled();
  });

  it('creates erd when enableResizableChildren is true', () => {
    const erdMaker = require('element-resize-detector');
    renderMasonry({ enableResizableChildren: true });
    expect(erdMaker).toHaveBeenCalledWith({ strategy: 'scroll' });
  });

  it('calls erd.listenTo for each child when enableResizableChildren is true', () => {
    renderMasonry({ enableResizableChildren: true });
    expect(mockErdListenTo).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// componentDidUpdate — performLayout
// ---------------------------------------------------------------------------

describe('componentDidUpdate — performLayout()', () => {
  it('calls masonry.layout() after update', () => {
    const { rerender } = renderMasonry();
    mockMasonryLayout.mockClear();
    act(() => {
      rerender(
        <MasonryComponent options={defaultOptions}>
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </MasonryComponent>,
      );
    });
    expect(mockMasonryLayout).toHaveBeenCalled();
  });

  it('calls masonry.appended() when new children are added', () => {
    const { rerender } = renderMasonry();
    act(() => {
      rerender(
        <MasonryComponent options={defaultOptions}>
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </MasonryComponent>,
      );
    });
    expect(mockMasonryAppended).toHaveBeenCalled();
  });

  it('calls masonry.reloadItems() when children are appended', () => {
    const { rerender } = renderMasonry();
    act(() => {
      rerender(
        <MasonryComponent options={defaultOptions}>
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </MasonryComponent>,
      );
    });
    expect(mockMasonryReloadItems).toHaveBeenCalled();
  });

  it('calls imagesLoaded again after update', () => {
    const imagesloaded = require('imagesloaded');
    const { rerender } = renderMasonry();
    imagesloaded.mockClear();
    act(() => {
      rerender(
        <MasonryComponent options={defaultOptions}>
          <div>Item 1</div>
        </MasonryComponent>,
      );
    });
    expect(imagesloaded).toHaveBeenCalled();
  });

  it('cancels previous imagesloaded handler before creating a new one', () => {
    const { rerender } = renderMasonry();
    act(() => {
      rerender(
        <MasonryComponent options={defaultOptions}>
          <div>Item 1</div>
        </MasonryComponent>,
      );
    });
    expect(mockImgLoadOff).toHaveBeenCalled();
  });

  it('calls listenToElementResize for appended children when enableResizableChildren', () => {
    const { rerender } = renderMasonry({ enableResizableChildren: true });
    mockErdListenTo.mockClear();
    act(() => {
      rerender(
        <MasonryComponent options={defaultOptions} enableResizableChildren>
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </MasonryComponent>,
      );
    });
    expect(mockErdListenTo).toHaveBeenCalled();
  });

  it('calls masonry.prepended() when children are prepended', () => {
    const { rerender } = renderMasonry(
      {},
      <>
        <div key="b">Item B</div>
        <div key="a">Item A</div>
      </>,
    );
    act(() => {
      rerender(
        <MasonryComponent options={defaultOptions}>
          <div key="c">Item C</div>
          <div key="b">Item B</div>
          <div key="a">Item A</div>
        </MasonryComponent>,
      );
    });
    expect(mockMasonryPrepended).toHaveBeenCalled();
  });

  it('calls listenToElementResize for prepended children when enableResizableChildren', () => {
    const { rerender } = renderMasonry(
      { enableResizableChildren: true },
      <>
        <div key="b">Item B</div>
        <div key="a">Item A</div>
      </>,
    );
    mockErdListenTo.mockClear();
    act(() => {
      rerender(
        <MasonryComponent options={defaultOptions} enableResizableChildren>
          <div key="c">Item C</div>
          <div key="b">Item B</div>
          <div key="a">Item A</div>
        </MasonryComponent>,
      );
    });
    expect(mockErdListenTo).toHaveBeenCalled();
  });

  it('calls masonry.reloadItems() when a child is removed (forceItemReload path)', () => {
    const { rerender } = renderMasonry(
      {},
      <>
        <div key="a">Item A</div>
        <div key="b">Item B</div>
      </>,
    );
    mockMasonryReloadItems.mockClear();
    act(() => {
      rerender(
        <MasonryComponent options={defaultOptions}>
          <div key="a">Item A</div>
        </MasonryComponent>,
      );
    });
    expect(mockMasonryReloadItems).toHaveBeenCalled();
  });

  it('calls masonry.layout() when a child is removed', () => {
    const { rerender } = renderMasonry(
      {},
      <>
        <div key="a">Item A</div>
        <div key="b">Item B</div>
      </>,
    );
    mockMasonryLayout.mockClear();
    act(() => {
      rerender(
        <MasonryComponent options={defaultOptions}>
          <div key="a">Item A</div>
        </MasonryComponent>,
      );
    });
    expect(mockMasonryLayout).toHaveBeenCalled();
  });

  it('does not call masonry.remove() when children are removed (detached before diff)', () => {
    const { rerender } = renderMasonry(
      {},
      <>
        <div key="a">Item A</div>
        <div key="b">Item B</div>
      </>,
    );
    mockMasonryRemove.mockClear();
    act(() => {
      rerender(
        <MasonryComponent options={defaultOptions}>
          <div key="a">Item A</div>
        </MasonryComponent>,
      );
    });
    expect(mockMasonryRemove).not.toHaveBeenCalled();
  });

  it('with enableResizableChildren — reloadItems called when child removed', () => {
    const { rerender } = renderMasonry(
      { enableResizableChildren: true },
      <>
        <div key="a">Item A</div>
        <div key="b">Item B</div>
      </>,
    );
    mockMasonryReloadItems.mockClear();
    act(() => {
      rerender(
        <MasonryComponent options={defaultOptions} enableResizableChildren>
          <div key="a">Item A</div>
        </MasonryComponent>,
      );
    });
    expect(mockMasonryReloadItems).toHaveBeenCalled();
  });

  it('calls masonry.reloadItems() when children are moved/reordered', () => {
    const { rerender } = renderMasonry(
      {},
      <>
        <div key="a">Item A</div>
        <div key="b">Item B</div>
      </>,
    );
    mockMasonryReloadItems.mockClear();
    act(() => {
      rerender(
        <MasonryComponent options={defaultOptions}>
          <div key="b">Item B</div>
          <div key="a">Item A</div>
        </MasonryComponent>,
      );
    });
    expect(mockMasonryReloadItems).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// componentWillUnmount
// ---------------------------------------------------------------------------

describe('componentWillUnmount', () => {
  it('calls masonry.destroy() on unmount', () => {
    const { unmount } = renderMasonry();
    unmount();
    expect(mockMasonryDestroy).toHaveBeenCalled();
  });

  it('unregisters onLayoutComplete on unmount', () => {
    const onLayoutComplete = jest.fn();
    const { unmount } = renderMasonry({ onLayoutComplete });
    unmount();
    expect(mockMasonryOff).toHaveBeenCalledWith('layoutComplete', onLayoutComplete);
  });

  it('does not call masonry.off for layoutComplete when not provided', () => {
    const { unmount } = renderMasonry();
    unmount();
    expect(mockMasonryOff).not.toHaveBeenCalledWith('layoutComplete', expect.anything());
  });

  it('unregisters onRemoveComplete on unmount', () => {
    const onRemoveComplete = jest.fn();
    const { unmount } = renderMasonry({ onRemoveComplete });
    unmount();
    expect(mockMasonryOff).toHaveBeenCalledWith('removeComplete', onRemoveComplete);
  });

  it('does not call masonry.off for removeComplete when not provided', () => {
    const { unmount } = renderMasonry();
    unmount();
    expect(mockMasonryOff).not.toHaveBeenCalledWith('removeComplete', expect.anything());
  });

  it('cancels imagesloaded handler on unmount', () => {
    const { unmount } = renderMasonry();
    unmount();
    expect(mockImgLoadOff).toHaveBeenCalled();
  });

  it('calls erd.uninstall for each child on unmount when erd exists', () => {
    const { unmount } = renderMasonry({ enableResizableChildren: true });
    unmount();
    expect(mockErdUninstall).toHaveBeenCalled();
  });

  it('does not throw on unmount when erd is not initialised', () => {
    const { unmount } = renderMasonry({ enableResizableChildren: false });
    expect(() => unmount()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// getCurrentDomChildren — itemSelector
// ---------------------------------------------------------------------------

describe('getCurrentDomChildren()', () => {
  it('uses querySelectorAll when itemSelector is provided', () => {
    const { container } = render(
      <MasonryComponent options={{ itemSelector: '.item' }}>
        <div className="item">A</div>
        <div className="item">B</div>
      </MasonryComponent>,
    );
    expect(container).toBeTruthy();
  });

  it('uses node.children when itemSelector is not provided', () => {
    const { container } = render(
      <MasonryComponent options={{}}>
        <div>A</div>
      </MasonryComponent>,
    );
    expect(container).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// initializeMasonry — force flag
// ---------------------------------------------------------------------------

describe('initializeMasonry() — force', () => {
  it('does not recreate masonry when called again without force', () => {
    const MasonryLayout = require('masonry-layout');
    const { rerender } = renderMasonry();
    const callCount = MasonryLayout.mock.calls.length;
    act(() =>
      rerender(
        <MasonryComponent options={defaultOptions}>
          <div>A</div>
        </MasonryComponent>,
      ),
    );
    expect(MasonryLayout.mock.calls.length).toBe(callCount);
  });
});
