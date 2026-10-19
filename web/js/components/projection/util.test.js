import parse from './util';

const config = {
  projections: {
    geographic: { id: 'geographic' },
    arctic: { id: 'arctic' },
  },
};

describe('parse (projection util)', () => {
  describe('permalink v1.0–1.1 switch migration', () => {
    it('copies switch value to p and removes switch', () => {
      const state = { switch: 'geographic' };
      const errors = [];
      const result = parse(state, errors, config);
      expect(result.p).toBe('geographic');
      expect(result.switch).toBeUndefined();
    });

    it('does not modify state when switch is absent', () => {
      const state = { p: 'arctic' };
      const errors = [];
      const result = parse(state, errors, config);
      expect(result.p).toBe('arctic');
      expect(result.switch).toBeUndefined();
    });

    it('migrates switch even when p is also present', () => {
      const state = { switch: 'arctic', p: 'geographic' };
      const errors = [];
      const result = parse(state, errors, config);
      expect(result.p).toBe('arctic');
      expect(result.switch).toBeUndefined();
    });
  });

  describe('projection validation', () => {
    it('keeps p when projId is valid', () => {
      const state = { p: 'geographic' };
      const errors = [];
      const result = parse(state, errors, config);
      expect(result.p).toBe('geographic');
      expect(errors).toHaveLength(0);
    });

    it('removes p and pushes an error when projId is not in config', () => {
      const state = { p: 'unknown' };
      const errors = [];
      const result = parse(state, errors, config);
      expect(result.p).toBeUndefined();
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Unsupported projection: unknown');
    });

    it('does not push an error when p is absent', () => {
      const state = {};
      const errors = [];
      const result = parse(state, errors, config);
      expect(errors).toHaveLength(0);
      expect(result.p).toBeUndefined();
    });
  });

  describe('state immutability', () => {
    it('does not mutate the original state object', () => {
      const state = { p: 'unknown', other: 'value' };
      const original = { ...state };
      const errors = [];
      parse(state, errors, config);
      expect(state).toEqual(original);
    });

    it('preserves unrelated state keys', () => {
      const state = { p: 'geographic', t: '2024-01-01', z: 4 };
      const errors = [];
      const result = parse(state, errors, config);
      expect(result.t).toBe('2024-01-01');
      expect(result.z).toBe(4);
    });

    it('preserves unrelated keys even when projection is invalid', () => {
      const state = { p: 'bad', t: '2024-01-01' };
      const errors = [];
      const result = parse(state, errors, config);
      expect(result.t).toBe('2024-01-01');
    });
  });

  describe('combined migration + validation', () => {
    it('migrates switch then validates the resulting p', () => {
      const state = { switch: 'unknown' };
      const errors = [];
      const result = parse(state, errors, config);
      expect(result.p).toBeUndefined();
      expect(result.switch).toBeUndefined();
      expect(errors[0].message).toBe('Unsupported projection: unknown');
    });

    it('migrates switch and keeps valid p', () => {
      const state = { switch: 'arctic' };
      const errors = [];
      const result = parse(state, errors, config);
      expect(result.p).toBe('arctic');
      expect(errors).toHaveLength(0);
    });
  });
});
