import { act } from 'react';
import renderer from 'react-test-renderer';
import VectorMetaTable from './table';

let consoleErrorSpy;
let originalConsoleError;

beforeAll(() => {
  originalConsoleError = console.error;
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
    if (typeof args[0] === 'string' && args[0].includes('react-test-renderer is deprecated')) return;
    originalConsoleError.call(console, ...args);
  });
});

afterAll(() => {
  if (consoleErrorSpy) consoleErrorSpy.mockRestore();
});

let component;
beforeEach(() => {
  act(() => {
    component = renderer.create(
      <VectorMetaTable
        metaArray={[{
          features: {
            GRAND_ID: 4886,
          },
          legend: [{ Identifier: 'GRAND_ID' }],
          featureTitle: 'Choclococha',
        }]}
      />,
    );
  });
});

test('Check that there is not popup', () => {
  expect(component.toJSON()).toMatchSnapshot();
});
test('If there is a valuemap, use valuemap', () => {
  act(() => {
    component = renderer.create(
      <VectorMetaTable
        metaArray={[{
          features: {
            GRAND_ID: 4886,
            Urborrur: 'U',
          },
          legend: [
            {
              Identifier: 'GRAND_ID',
            }, {
              Identifier: 'Urborrur',
              ValueMap: { U: 'Urban', R: 'Rural' },
            },
          ],
          featureTitle: 'Choclococha',
        }]}
      />,
    );
  });
  expect(component.toJSON()).toMatchSnapshot();
});
