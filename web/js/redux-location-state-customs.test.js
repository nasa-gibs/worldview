import { stateToParams, encode, createParamsString, LOCATION_POP_ACTION } from './redux-location-state-customs';

jest.mock('lodash', () => ({
  each: jest.fn((arr, fn) => arr.forEach(fn)),
  get: jest.fn((obj, path) => {
    const parts = path.split('.');
    return parts.reduce((acc, part) => (acc ? acc[part] : undefined), obj);
  }),
  isEqual: jest.fn((a, b) => {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }),
}));

jest.mock('./modules/link/constants', () => ({
  ENCODING_EXCEPTIONS: [
    { match: /%2C/g, replace: ',' },
    { match: /%2F/g, replace: '/' },
  ],
}));

describe('LOCATION_POP_ACTION', () => {
  it('is defined', () => {
    expect(LOCATION_POP_ACTION).toBe('REDUX-LOCATION-POP-ACTION');
  });
});

describe('encode', () => {
  it('encodes a basic string', () => {
    const result = encode('hello world');
    expect(result).toBe('hello%20world');
  });

  it('applies encoding exceptions to replace %2C with comma', () => {
    const result = encode('a,b');
    expect(result).toBe('a,b');
  });

  it('applies encoding exceptions to replace %2F with slash', () => {
    const result = encode('a/b');
    expect(result).toBe('a/b');
  });

  it('encodes special characters', () => {
    const result = encode('foo=bar');
    expect(result).toContain('foo');
    expect(result).toContain('bar');
  });
});

describe('createParamsString', () => {
  it('returns empty string for empty object', () => {
    expect(createParamsString({})).toBe('');
  });

  it('returns query string with single param', () => {
    const result = createParamsString({ foo: 'bar' });
    expect(result).toBe('?foo=bar');
  });

  it('returns query string with multiple params', () => {
    const result = createParamsString({ foo: 'bar', baz: 'qux' });
    expect(result).toContain('foo=bar');
    expect(result).toContain('baz=qux');
    expect(result.startsWith('?')).toBe(true);
  });

  it('encodes keys and values', () => {
    const result = createParamsString({ 'my key': 'my value' });
    expect(result).toContain('my%20key');
  });
});

describe('stateToParams', () => {
  const location = { pathname: '/', search: '' };

  describe('when config is invalid', () => {
    it('returns location as-is when initialState is null', () => {
      const result = stateToParams(null, {}, location);
      expect(result).toEqual({ location: { ...location } });
    });

    it('returns location as-is when initialState is not an object', () => {
      const result = stateToParams('string', {}, location);
      expect(result).toEqual({ location: { ...location } });
    });

    it('returns location as-is when initialState has no global key', () => {
      const result = stateToParams({ notGlobal: {} }, {}, location);
      expect(result).toEqual({ location: { ...location } });
    });

    it('returns location as-is when global is not an object', () => {
      const result = stateToParams({ global: 'string' }, {}, location);
      expect(result).toEqual({ location: { ...location } });
    });
  });

  describe('when config is valid', () => {
    it('returns location with search and shouldPush=false', () => {
      const initialState = { global: {} };
      const result = stateToParams(initialState, {}, location);
      expect(result).toHaveProperty('location');
      expect(result.shouldPush).toBe(false);
    });

    it('excludes params where currentItemState equals initialValue', () => {
      const initialState = {
        global: {
          p: {
            stateKey: 'proj.id',
            initialState: 'geographic',
          },
        },
      };
      const currentState = { proj: { id: 'geographic' } };
      const result = stateToParams(initialState, currentState, location);
      expect(result.location.search).toBe('');
    });

    it('includes params where currentItemState differs from initialValue', () => {
      const initialState = {
        global: {
          p: {
            stateKey: 'proj.id',
            initialState: 'geographic',
          },
        },
      };
      const currentState = { proj: { id: 'arctic' } };
      const result = stateToParams(initialState, currentState, location);
      expect(result.location.search).toContain('p=arctic');
    });

    it('excludes params where currentItemState is undefined', () => {
      const initialState = {
        global: {
          p: {
            stateKey: 'proj.id',
            initialState: 'geographic',
          },
        },
      };
      const currentState = {};
      const result = stateToParams(initialState, currentState, location);
      expect(result.location.search).toBe('');
    });

    it('uses serialize function when provided', () => {
      const serialize = jest.fn(() => 'serialized');
      const initialState = {
        global: {
          ab: {
            stateKey: 'animation.isActive',
            initialState: false,
            options: { serialize },
          },
        },
      };
      const currentState = { animation: { isActive: true } };
      const result = stateToParams(initialState, currentState, location);
      expect(serialize).toHaveBeenCalled();
      expect(result.location.search).toContain('ab=serialized');
    });

    it('short circuits when serialize returns undefined', () => {
      const serialize = jest.fn(() => undefined);
      const initialState = {
        global: {
          ab: {
            stateKey: 'animation.isActive',
            initialState: false,
            options: { serialize },
          },
        },
      };
      const currentState = { animation: { isActive: true } };
      const result = stateToParams(initialState, currentState, location);
      expect(result.location.search).toBe('');
    });

    it('passes globalState to serialize when serializeNeedsGlobalState is true', () => {
      const serialize = jest.fn(() => 'value');
      const initialState = {
        global: {
          ab: {
            stateKey: 'animation.isActive',
            initialState: false,
            options: { serialize, serializeNeedsGlobalState: true },
          },
        },
      };
      const currentState = { animation: { isActive: true } };
      stateToParams(initialState, currentState, location);
      expect(serialize).toHaveBeenCalledWith(true, currentState, undefined);
    });

    it('passes prev to serialize when serializeNeedsPrev is true', () => {
      const serialize = jest.fn(() => 'value');
      const initialState = {
        global: {
          ab: {
            stateKey: 'animation.isActive',
            initialState: false,
            options: { serialize, serializeNeedsPrev: true },
          },
        },
      };
      const currentState = { animation: { isActive: true } };
      stateToParams(initialState, currentState, location);
      expect(serialize).toHaveBeenCalledWith(true, undefined, expect.any(Object));
    });

    it('uses bool type serializer', () => {
      const initialState = {
        global: {
          ab: {
            stateKey: 'animation.isActive',
            initialState: false,
            type: 'bool',
          },
        },
      };
      const currentState = { animation: { isActive: true } };
      const result = stateToParams(initialState, currentState, location);
      expect(result.location.search).toContain('ab=true');
    });

    it('uses number type serializer', () => {
      const initialState = {
        global: {
          av: {
            stateKey: 'animation.speed',
            initialState: 3,
            type: 'number',
          },
        },
      };
      const currentState = { animation: { speed: 5 } };
      const result = stateToParams(initialState, currentState, location);
      expect(result.location.search).toContain('av=5');
    });

    it('uses date type serializer', () => {
      const date = new Date('2020-01-01T00:00:00Z');
      const differentDate = new Date('2020-06-01T00:00:00Z');
      const initialState = {
        global: {
          t: {
            stateKey: 'date.selected',
            initialState: date,
            type: 'date',
          },
        },
      };
      const currentState = { date: { selected: differentDate } };
      const result = stateToParams(initialState, currentState, location);
      expect(result.location.search).toContain('t=');
    });

    it('uses array type serializer', () => {
      const initialState = {
        global: {
          s: {
            stateKey: 'locationSearch.coordinates',
            initialState: [],
            type: 'array',
          },
        },
      };
      const currentState = { locationSearch: { coordinates: [10, 20] } };
      const result = stateToParams(initialState, currentState, location);
      expect(result.location.search).toContain('s=10');
    });

    it('uses object type serializer', () => {
      const initialState = {
        global: {
          e: {
            stateKey: 'events',
            initialState: {},
            type: 'object',
          },
        },
      };
      const currentState = { events: { active: true } };
      const result = stateToParams(initialState, currentState, location);
      expect(result.location.search).toContain('e=');
    });

    it('includes param when setAsEmptyItem is true even if default', () => {
      const initialState = {
        global: {
          lg: {
            stateKey: 'layers.active.groupOverlays',
            initialState: true,
            type: 'bool',
            options: { setAsEmptyItem: true },
          },
        },
      };
      const currentState = { layers: { active: { groupOverlays: true } } };
      const result = stateToParams(initialState, currentState, location);
      expect(result.location.search).toContain('lg=true');
    });

    it('treats empty object currentItemState as undefined', () => {
      const initialState = {
        global: {
          p: {
            stateKey: 'proj',
            initialState: 'geographic',
          },
        },
      };
      const currentState = { proj: {} };
      const result = stateToParams(initialState, currentState, location);
      expect(result.location.search).toBe('');
    });

    it('uses lodashIsEqual for object comparison', () => {
      const { isEqual } = require('lodash');
      const initialState = {
        global: {
          compare: {
            stateKey: 'compare',
            initialState: { active: false },
          },
        },
      };
      const currentState = { compare: { active: false } };
      stateToParams(initialState, currentState, location);
      expect(isEqual).toHaveBeenCalled();
    });

    it('handles date type where both initial and current are same date', () => {
      const date = new Date('2020-01-01T00:00:00Z');
      const initialState = {
        global: {
          t: {
            stateKey: 'date.selected',
            initialState: date,
            type: 'date',
          },
        },
      };
      const currentState = { date: { selected: new Date('2020-01-01T00:00:00Z') } };
      const result = stateToParams(initialState, currentState, location);
      expect(result.location.search).toBe('');
    });

    it('handles date type when prev already has params', () => {
      const date = new Date('2020-01-01T00:00:00Z');
      const sameDate = new Date('2020-01-01T00:00:00Z');
      const initialState = {
        global: {
          p: {
            stateKey: 'proj.id',
            initialState: 'geographic',
          },
          t: {
            stateKey: 'date.selected',
            initialState: date,
            type: 'date',
          },
        },
      };
      const currentState = { proj: { id: 'arctic' }, date: { selected: sameDate } };
      const result = stateToParams(initialState, currentState, location);
      expect(result.location.search).toContain('p=arctic');
    });

    it('handles missing initialValue for date type gracefully', () => {
      const initialState = {
        global: {
          t: {
            stateKey: 'date.selected',
            initialState: null,
            type: 'date',
          },
        },
      };
      const currentState = { date: { selected: new Date('2020-01-01T00:00:00Z') } };
      const result = stateToParams(initialState, currentState, location);
      expect(result.location.search).toContain('t=');
    });
  });

  describe('typeHandles', () => {
    it('number serialize handles non-number value', () => {
      const initialState = {
        global: {
          av: { stateKey: 'animation.speed', initialState: 1, type: 'number' },
        },
      };
      const currentState = { animation: { speed: '5' } };
      const result = stateToParams(initialState, currentState, location);
      expect(result.location.search).toContain('av=5');
    });

    it('object serialize returns undefined for null value', () => {
      const initialState = {
        global: {
          e: { stateKey: 'events', initialState: null, type: 'object' },
        },
      };
      const currentState = { events: null };
      const result = stateToParams(initialState, currentState, location);
      expect(result.location.search).toBe('');
    });

    it('object serialize handles JSON.stringify error gracefully', () => {
      const circular = {};
      circular.self = circular;
      const serialize = jest.fn((val) => {
        if (!val || typeof val !== 'object') return undefined;
        try {
          return JSON.stringify(val);
        } catch {
          return undefined;
        }
      });
      const initialState = {
        global: {
          e: {
            stateKey: 'events',
            initialState: null,
            options: { serialize },
          },
        },
      };
      const currentState = { events: circular };
      const result = stateToParams(initialState, currentState, location);
      expect(result.location.search).toBe('');
    });
  });
});
