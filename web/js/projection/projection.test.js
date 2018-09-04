import { parse } from './projection';

function testConfig() {
  return {
    projections: {
      geographic: {}
    }
  };
};

test('1.1: parses valid projection', () => {
  let state = {
    'switch': 'geographic'
  };
  let errors = [];
  parse(state, errors, testConfig());
  expect(state.p).toBe('geographic');
  expect(errors).toHaveLength(0);
});

test('1.2: Parses valid projection', () => {
  let state = {
    'p': 'geographic'
  };
  let errors = [];
  parse(state, errors, testConfig());
  expect(state.p).toBe('geographic');
  expect(errors).toHaveLength(0);
});

test('Rejects unsupported projection', () => {
  let state = {
    'p': 'albers'
  };
  let errors = [];
  parse(state, errors, testConfig());
  expect(state.p).toBeFalsy();
  expect(errors).toHaveLength(1);
});
