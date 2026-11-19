import {
  callIfExists,
  hasOwnProp,
  uniqueId,
  cssClasses,
  store,
  canUseDOM,
} from './helpers'; // Update path as needed

// ---------------------------------------------------------------------------
// callIfExists
// ---------------------------------------------------------------------------

describe('callIfExists()', () => {
  it('calls the function when it is a function', () => {
    const fn = jest.fn();
    callIfExists(fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('passes all additional arguments to the function', () => {
    const fn = jest.fn();
    callIfExists(fn, 'a', 'b', 'c');
    expect(fn).toHaveBeenCalledWith('a', 'b', 'c');
  });

  it('returns the result of the function call', () => {
    const fn = jest.fn(() => 42);
    const result = callIfExists(fn);
    expect(result).toBe(42);
  });

  it('returns false when func is not a function', () => {
    expect(callIfExists(null)).toBe(false);
    expect(callIfExists(undefined)).toBe(false);
    expect(callIfExists(42)).toBe(false);
    expect(callIfExists('string')).toBe(false);
    expect(callIfExists({})).toBe(false);
  });

  it('does not throw when func is null', () => {
    expect(() => callIfExists(null)).not.toThrow();
  });

  it('does not throw when func is undefined', () => {
    expect(() => callIfExists(undefined)).not.toThrow();
  });

  it('handles functions that return falsy values', () => {
    expect(callIfExists(() => 0)).toBe(0);
    expect(callIfExists(() => '')).toBe('');
    expect(callIfExists(() => null)).toBe(null);
    expect(callIfExists(() => false)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// hasOwnProp
// ---------------------------------------------------------------------------

describe('hasOwnProp()', () => {
  it('returns true for a direct own property', () => {
    const obj = { key: 'value' };
    expect(hasOwnProp(obj, 'key')).toBe(true);
  });

  it('returns false for an inherited property', () => {
    const parent = { inherited: true };
    const child = Object.create(parent);
    expect(hasOwnProp(child, 'inherited')).toBe(false);
  });

  it('returns false for a property that does not exist', () => {
    expect(hasOwnProp({}, 'missing')).toBe(false);
  });

  it('returns true for a property with an undefined value', () => {
    const obj = { key: undefined };
    expect(hasOwnProp(obj, 'key')).toBe(true);
  });

  it('returns true for a property with a falsy value', () => {
    const obj = { key: null };
    expect(hasOwnProp(obj, 'key')).toBe(true);
  });

  it('works correctly with objects that have a custom hasOwnProperty', () => {
    const obj = { hasOwnProperty: () => false, realProp: true };
    // Uses Object.prototype.hasOwnProperty so custom override is ignored
    expect(hasOwnProp(obj, 'realProp')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// uniqueId
// ---------------------------------------------------------------------------

describe('uniqueId()', () => {
  it('returns a string', () => {
    expect(typeof uniqueId()).toBe('string');
  });

  it('returns a non-empty string', () => {
    expect(uniqueId().length).toBeGreaterThan(0);
  });

  it('returns different values on successive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => uniqueId()));
    // Allow for a tiny collision probability — at least 95 unique out of 100
    expect(ids.size).toBeGreaterThan(95);
  });

  it('returns a string derived from base-36', () => {
    const id = uniqueId();
    // base-36 characters: 0-9 and a-z
    expect(id).toMatch(/^[0-9a-z]+$/);
  });
});

// ---------------------------------------------------------------------------
// cssClasses
// ---------------------------------------------------------------------------

describe('cssClasses', () => {
  it('is an object', () => {
    expect(typeof cssClasses).toBe('object');
  });

  it('has the correct menu class', () => {
    expect(cssClasses.menu).toBe('react-contextmenu');
  });

  it('has the correct menuVisible class', () => {
    expect(cssClasses.menuVisible).toBe('react-contextmenu--visible');
  });

  it('has the correct menuWrapper class', () => {
    expect(cssClasses.menuWrapper).toBe('react-contextmenu-wrapper');
  });

  it('has the correct menuItem class', () => {
    expect(cssClasses.menuItem).toBe('react-contextmenu-item');
  });

  it('has the correct menuItemActive class', () => {
    expect(cssClasses.menuItemActive).toBe('react-contextmenu-item--active');
  });

  it('has the correct menuItemDisabled class', () => {
    expect(cssClasses.menuItemDisabled).toBe('react-contextmenu-item--disabled');
  });

  it('has the correct menuItemDivider class', () => {
    expect(cssClasses.menuItemDivider).toBe('react-contextmenu-item--divider');
  });

  it('has the correct menuItemSelected class', () => {
    expect(cssClasses.menuItemSelected).toBe('react-contextmenu-item--selected');
  });

  it('has the correct subMenu class', () => {
    expect(cssClasses.subMenu).toBe('react-contextmenu-submenu');
  });

  it('has exactly 9 class entries', () => {
    expect(Object.keys(cssClasses)).toHaveLength(9);
  });
});

// ---------------------------------------------------------------------------
// store
// ---------------------------------------------------------------------------

describe('store', () => {
  it('is an object', () => {
    expect(typeof store).toBe('object');
  });

  it('is initially empty', () => {
    expect(store).toEqual({});
  });

  it('can have properties assigned to it', () => {
    store.testKey = 'testValue';
    expect(store.testKey).toBe('testValue');
    delete store.testKey;
  });
});

// ---------------------------------------------------------------------------
// canUseDOM
// ---------------------------------------------------------------------------

describe('canUseDOM', () => {
  it('is a boolean', () => {
    expect(typeof canUseDOM).toBe('boolean');
  });

  it('is true in a jsdom environment (window and document are available)', () => {
    // Jest runs in jsdom by default, so window and document.createElement exist
    expect(canUseDOM).toBe(true);
  });
});
