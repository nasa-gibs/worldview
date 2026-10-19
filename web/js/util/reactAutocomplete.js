import React, {
  useState, useRef, useEffect, useImperativeHandle, useMemo,
} from 'react';
import PropTypes from 'prop-types';
import scrollIntoView from 'dom-scroll-into-view';

const IMPERATIVE_API = [
  'blur',
  'checkValidity',
  'click',
  'focus',
  'select',
  'setCustomValidity',
  'setSelectionRange',
  'setRangeText',
];

const DEFAULT_MENU_STYLE = {
  borderRadius: '3px',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
  background: 'rgba(255, 255, 255, 0.9)',
  padding: '2px 0',
  fontSize: '90%',
  position: 'fixed',
  overflow: 'auto',
  maxHeight: '50%',
};

function getScrollOffset() {
  return {
    x: window.pageXOffset !== undefined
      ? window.pageXOffset
      : (document.documentElement || document.body.parentNode || document.body).scrollLeft,
    y: window.pageYOffset !== undefined
      ? window.pageYOffset
      : (document.documentElement || document.body.parentNode || document.body).scrollTop,
  };
}

function defaultRenderInput(props) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <input {...props} />;
}

function composeEventHandlers(internal, external) {
  return external
    ? (e) => { internal(e); external(e); }
    : internal;
}

const Autocomplete = React.forwardRef(({
  items,
  value = '',
  onChange = () => {},
  onSelect = () => {},
  shouldItemRender,
  isItemSelectable = () => true,
  sortItems,
  getItemValue,
  renderItem,
  renderMenu: renderMenuProp,
  menuStyle = DEFAULT_MENU_STYLE,
  renderInput = defaultRenderInput,
  inputProps = {},
  wrapperProps = {},
  wrapperStyle = { display: 'inline-block' },
  autoHighlight = true,
  selectOnBlur = false,
  onMenuVisibilityChange = () => {},
  open,
  debug = false,
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });

  const ignoreBlurRef = useRef(false);
  const ignoreFocusRef = useRef(false);
  const scrollOffsetRef = useRef(null);
  const scrollTimerRef = useRef(null);
  const debugStatesRef = useRef([]);
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const itemRefs = useRef({});
  const prevIsOpenRef = useRef(false);

  const isOpenComputed = open !== undefined ? open : isOpen;

  const renderMenuFn = renderMenuProp || ((menuItems, val, style) => (
    <div style={{ ...style, ...menuStyle }}>{menuItems}</div>
  ));

  // Expose imperative API via ref
  useImperativeHandle(ref, () => {
    const handle = {
      setOpen: (val) => setIsOpen(val),
    };
    IMPERATIVE_API.forEach((method) => {
      handle[method] = (...args) => inputRef.current?.[method]?.(...args);
    });
    return handle;
  });

  // Derived: filtered and sorted items
  const filteredItems = useMemo(() => {
    let result = items || [];
    if (shouldItemRender) {
      result = result.filter((item) => shouldItemRender(item, value));
    }
    if (sortItems) {
      result = [...result].sort((a, b) => sortItems(a, b, value));
    }
    return result;
  }, [items, shouldItemRender, sortItems, value]);

  // Menu positioning
  function setMenuPositions() {
    const node = inputRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const computedStyle = global.window.getComputedStyle(node);
    const marginBottom = parseInt(computedStyle.marginBottom, 10) || 0;
    const marginLeft = parseInt(computedStyle.marginLeft, 10) || 0;
    const marginRight = parseInt(computedStyle.marginRight, 10) || 0;
    setMenuPos({
      top: rect.bottom + marginBottom,
      left: rect.left + marginLeft,
      width: rect.width + marginLeft + marginRight,
    });
  }

  // Effect: set menu positions when menu opens
  useEffect(() => {
    if (isOpenComputed) {
      setMenuPositions();
    }
  }, [isOpenComputed]);

  // Effect: scroll highlighted item into view (every render)
  useEffect(() => {
    if (isOpenComputed && highlightedIndex !== null) {
      const itemNode = itemRefs.current[highlightedIndex];
      const menuNode = menuRef.current;
      if (itemNode && menuNode) {
        scrollIntoView(itemNode, menuNode, { onlyScrollIfNeeded: true });
      }
    }
  });

  // Effect: notify menu visibility changes
  useEffect(() => {
    if (prevIsOpenRef.current !== isOpen) {
      onMenuVisibilityChange(isOpen);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, onMenuVisibilityChange]);

  // Effect: ensure highlighted index and auto-highlight
  useEffect(() => {
    if (highlightedIndex !== null && highlightedIndex >= filteredItems.length) {
      setHighlightedIndex(null);
      return;
    }

    if (autoHighlight) {
      let index = highlightedIndex === null ? 0 : highlightedIndex;
      for (let i = 0; i < filteredItems.length; i++) {
        if (isItemSelectable(filteredItems[index])) break;
        index = (index + 1) % filteredItems.length;
      }
      const matchedItem = filteredItems[index] && isItemSelectable(filteredItems[index])
        ? filteredItems[index]
        : null;
      let newHighlightedIndex = null;
      if (value !== '' && matchedItem) {
        const itemValue = getItemValue(matchedItem);
        const itemValueDoesMatch = itemValue.toLowerCase().indexOf(value.toLowerCase()) === 0;
        if (itemValueDoesMatch) {
          newHighlightedIndex = index;
        }
      }
      if (newHighlightedIndex !== highlightedIndex) {
        setHighlightedIndex(newHighlightedIndex);
      }
    }
  }, [items, shouldItemRender, sortItems, value, autoHighlight]);

  // Effect: cleanup timer on unmount
  useEffect(() => () => {
    clearTimeout(scrollTimerRef.current);
  }, []);

  // Key down handlers (plain object, no memoization to avoid stale closures)
  const keyDownHandlers = {
    ArrowDown(event) {
      event.preventDefault();
      if (!filteredItems.length) return;
      let index = highlightedIndex === null ? -1 : highlightedIndex;
      for (let i = 0; i < filteredItems.length; i++) {
        const p = (index + i + 1) % filteredItems.length;
        if (isItemSelectable(filteredItems[p])) {
          index = p;
          break;
        }
      }
      if (index > -1 && index !== highlightedIndex) {
        setHighlightedIndex(index);
        setIsOpen(true);
      }
    },

    ArrowUp(event) {
      event.preventDefault();
      if (!filteredItems.length) return;
      let index = highlightedIndex === null ? filteredItems.length : highlightedIndex;
      for (let i = 0; i < filteredItems.length; i++) {
        const p = (index - (1 + i) + filteredItems.length) % filteredItems.length;
        if (isItemSelectable(filteredItems[p])) {
          index = p;
          break;
        }
      }
      if (index !== filteredItems.length) {
        setHighlightedIndex(index);
        setIsOpen(true);
      }
    },

    Enter(event) {
      // Key code 229 is used for selecting items from character selectors (Pinyin, Kana, etc)
      if (event.keyCode !== 13) return;
      ignoreBlurRef.current = false;
      if (!isOpenComputed) return;
      if (highlightedIndex == null) {
        setIsOpen(false);
        inputRef.current.select();
      } else {
        event.preventDefault();
        const item = filteredItems[highlightedIndex];
        const val = getItemValue(item);
        setIsOpen(false);
        setHighlightedIndex(null);
        inputRef.current.setSelectionRange(val.length, val.length);
        onSelect(val, item);
      }
    },

    Escape() {
      ignoreBlurRef.current = false;
      setHighlightedIndex(null);
      setIsOpen(false);
    },

    Tab() {
      ignoreBlurRef.current = false;
    },
  };

  function handleKeyDown(event) {
    if (keyDownHandlers[event.key]) {
      keyDownHandlers[event.key](event);
    } else if (!isOpenComputed) {
      setIsOpen(true);
    }
  }

  function handleChange(event) {
    onChange(event, event.target.value);
  }

  function handleInputBlur(event) {
    if (ignoreBlurRef.current) {
      ignoreFocusRef.current = true;
      scrollOffsetRef.current = getScrollOffset();
      inputRef.current.focus();
      return;
    }
    if (selectOnBlur && highlightedIndex !== null) {
      const item = filteredItems[highlightedIndex];
      const val = getItemValue(item);
      setIsOpen(false);
      setHighlightedIndex(null);
      onSelect(val, item);
    } else {
      setIsOpen(false);
      setHighlightedIndex(null);
    }
    const { onBlur } = inputProps;
    if (onBlur) {
      onBlur(event);
    }
  }

  function handleInputFocus(event) {
    if (ignoreFocusRef.current) {
      ignoreFocusRef.current = false;
      const { x, y } = scrollOffsetRef.current;
      scrollOffsetRef.current = null;
      window.scrollTo(x, y);
      clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => {
        scrollTimerRef.current = null;
        window.scrollTo(x, y);
      }, 0);
      return;
    }
    setIsOpen(true);
    const { onFocus } = inputProps;
    if (onFocus) {
      onFocus(event);
    }
  }

  function isInputFocused() {
    const el = inputRef.current;
    return el && el.ownerDocument && (el === el.ownerDocument.activeElement);
  }

  function handleInputClick() {
    if (isInputFocused() && !isOpenComputed) {
      setIsOpen(true);
    }
  }

  function highlightItemFromMouse(index) {
    setHighlightedIndex(index);
  }

  function selectItemFromMouse(item) {
    const val = getItemValue(item);
    ignoreBlurRef.current = false;
    setIsOpen(false);
    setHighlightedIndex(null);
    onSelect(val, item);
  }

  function setIgnoreBlur(ignore) {
    ignoreBlurRef.current = ignore;
  }

  function renderMenuContent() {
    const menuItems = filteredItems.map((item, index) => {
      const element = renderItem(
        item,
        highlightedIndex === index,
        { cursor: 'default' },
      );
      return React.cloneElement(element, {
        onMouseEnter: isItemSelectable(item)
          ? () => highlightItemFromMouse(index)
          : null,
        onClick: isItemSelectable(item)
          ? () => selectItemFromMouse(item)
          : null,
        ref: (e) => { itemRefs.current[index] = e; },
      });
    });
    const style = {
      left: menuPos.left,
      top: menuPos.top,
      minWidth: menuPos.width,
    };
    const menu = renderMenuFn(menuItems, value, style);
    return React.cloneElement(menu, {
      ref: (e) => { menuRef.current = e; },
      onTouchStart: () => setIgnoreBlur(true),
      onMouseEnter: () => setIgnoreBlur(true),
      onMouseLeave: () => setIgnoreBlur(false),
    });
  }

  // Debug
  if (debug) {
    debugStatesRef.current.push({
      id: debugStatesRef.current.length,
      state: { isOpen, highlightedIndex },
    });
  }

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <div style={{ ...wrapperStyle }} {...wrapperProps}>
      {renderInput({
        ...inputProps,
        role: 'combobox',
        'aria-autocomplete': 'list',
        'aria-expanded': isOpenComputed,
        autoComplete: 'off',
        ref: (el) => { inputRef.current = el; },
        onFocus: handleInputFocus,
        onBlur: handleInputBlur,
        onChange: handleChange,
        onKeyDown: composeEventHandlers(handleKeyDown, inputProps.onKeyDown),
        onClick: composeEventHandlers(handleInputClick, inputProps.onClick),
        value,
      })}
      {isOpenComputed && renderMenuContent()}
      {debug && (
        <pre style={{ marginLeft: 300 }}>
          {JSON.stringify(
            debugStatesRef.current.slice(
              Math.max(0, debugStatesRef.current.length - 5),
              debugStatesRef.current.length,
            ),
            null,
            2,
          )}
        </pre>
      )}
    </div>
  );
});

Autocomplete.propTypes = {
  items: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  value: PropTypes.any,
  onChange: PropTypes.func,
  onSelect: PropTypes.func,
  shouldItemRender: PropTypes.func,
  isItemSelectable: PropTypes.func,
  sortItems: PropTypes.func,
  getItemValue: PropTypes.func.isRequired,
  renderItem: PropTypes.func.isRequired,
  renderMenu: PropTypes.func,
  menuStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  renderInput: PropTypes.func,
  inputProps: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  wrapperProps: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  wrapperStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  autoHighlight: PropTypes.bool,
  selectOnBlur: PropTypes.bool,
  onMenuVisibilityChange: PropTypes.func,
  open: PropTypes.bool,
  debug: PropTypes.bool,
};

export default Autocomplete;
