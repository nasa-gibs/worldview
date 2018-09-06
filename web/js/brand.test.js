import brand from './brand';

let unmocked = {};

beforeAll(() => {
  unmocked.VERSION = brand.VERSION;
});

afterEach(() => {
  brand.VERSION = unmocked.VERSION;
});

test('is development build', () => {
  expect(brand.release()).toBeFalsy();
});

test('is release build', () => {
  brand.VERSION = '0.0.0';
  expect(brand.release()).toBeTruthy();
});

test('URL with build nonce', () => {
  expect(brand.url('foo')).toBe('foo?v=@BUILD_NONCE@');
});

test('URL build build nonce, existing query string', () => {
  expect(brand.url('foo?bar=1')).toBe('foo?bar=1&v=@BUILD_NONCE@');
});
