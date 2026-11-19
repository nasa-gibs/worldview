/* eslint-disable react/prop-types */
import { act } from 'react';
import renderer from 'react-test-renderer';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import VectorMetaTable from './table';

// Isolate VectorMetaTooltip so Description-branch tests don't pull in fontawesome/reactstrap
jest.mock('./tooltip', () => function MockVectorMetaTooltip({ id, description }) {
  return <span data-testid="vector-tooltip" data-id={id}>{description}</span>;
});

// ─── keep console quiet about react-test-renderer deprecation ────────────────
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

// ─── snapshot tests (existing) ───────────────────────────────────────────────
let component;
beforeEach(() => {
  act(() => {
    component = renderer.create(
      <VectorMetaTable
        metaArray={[{
          features: { GRAND_ID: 4886 },
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
          features: { GRAND_ID: 4886, Urborrur: 'U' },
          legend: [
            { Identifier: 'GRAND_ID' },
            { Identifier: 'Urborrur', ValueMap: { U: 'Urban', R: 'Rural' } },
          ],
          featureTitle: 'Choclococha',
        }]}
      />,
    );
  });
  expect(component.toJSON()).toMatchSnapshot();
});

// ─── shouldComponentUpdate ───────────────────────────────────────────────────
describe('shouldComponentUpdate', () => {
  const baseMetaArray = (val) => [{
    features: { NAME: val },
    legend: [{ Identifier: 'NAME' }],
    featureTitle: 'Feature',
  }];

  it('prevents re-render when id and title both match', () => {
    const { rerender } = render(
      <VectorMetaTable id={1} title="dam" metaArray={baseMetaArray('Alpha')} />,
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();

    rerender(<VectorMetaTable id={1} title="dam" metaArray={baseMetaArray('Beta')} />);
    // shouldComponentUpdate returned false — output unchanged
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();
  });

  it('allows re-render when id changes', () => {
    const { rerender } = render(
      <VectorMetaTable id={1} title="dam" metaArray={baseMetaArray('Alpha')} />,
    );
    rerender(<VectorMetaTable id={2} title="dam" metaArray={baseMetaArray('Beta')} />);
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('allows re-render when title changes', () => {
    const { rerender } = render(
      <VectorMetaTable id={1} title="dam" metaArray={baseMetaArray('Alpha')} />,
    );
    rerender(<VectorMetaTable id={1} title="lake" metaArray={baseMetaArray('Beta')} />);
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('allows re-render when id is not set', () => {
    const { rerender } = render(
      <VectorMetaTable title="dam" metaArray={baseMetaArray('Alpha')} />,
    );
    rerender(<VectorMetaTable title="dam" metaArray={baseMetaArray('Beta')} />);
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('allows re-render when title is not set', () => {
    const { rerender } = render(
      <VectorMetaTable id={1} metaArray={baseMetaArray('Alpha')} />,
    );
    rerender(<VectorMetaTable id={1} metaArray={baseMetaArray('Beta')} />);
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });
});

// ─── render branches ─────────────────────────────────────────────────────────
describe('VectorMetaTable render', () => {
  it('uses featureTitle as the table header', () => {
    render(
      <VectorMetaTable
        metaArray={[{
          features: { ID: 1 },
          legend: [{ Identifier: 'ID' }],
          featureTitle: 'My Dam',
        }]}
      />,
    );
    expect(screen.getByRole('columnheader')).toHaveTextContent('My Dam');
  });

  it('falls back to "obj.title <index+1>" when featureTitle is absent', () => {
    render(
      <VectorMetaTable
        metaArray={[{
          features: { ID: 1 },
          legend: [{ Identifier: 'ID' }],
          title: 'River',
        }]}
      />,
    );
    expect(screen.getByRole('columnheader')).toHaveTextContent('River 1');
  });

  it('renders the Identifier as cell label when Title is absent', () => {
    render(
      <VectorMetaTable
        metaArray={[{
          features: { GRAND_ID: 42 },
          legend: [{ Identifier: 'GRAND_ID' }],
          featureTitle: 'Feature',
        }]}
      />,
    );
    expect(screen.getByText('GRAND_ID')).toBeInTheDocument();
  });

  it('renders Title as cell label when Title is present', () => {
    render(
      <VectorMetaTable
        metaArray={[{
          features: { GRAND_ID: 42 },
          legend: [{ Identifier: 'GRAND_ID', Title: 'Dam ID' }],
          featureTitle: 'Feature',
        }]}
      />,
    );
    expect(screen.getByText('Dam ID')).toBeInTheDocument();
  });

  it('formats integer feature values with toLocaleString when DataType=int and Function≠Identify', () => {
    render(
      <VectorMetaTable
        metaArray={[{
          features: { AREA: 1234567 },
          legend: [{ Identifier: 'AREA', DataType: 'int', Function: 'Style' }],
          featureTitle: 'Feature',
        }]}
      />,
    );
    expect(screen.getByText((1234567).toLocaleString('en'))).toBeInTheDocument();
  });

  it('does not format integer when Function=Identify', () => {
    render(
      <VectorMetaTable
        metaArray={[{
          features: { AREA: 1234567 },
          legend: [{ Identifier: 'AREA', DataType: 'int', Function: 'Identify' }],
          featureTitle: 'Feature',
        }]}
      />,
    );
    // raw numeric value (not locale-formatted), rendered as-is via metaFeaturesIdentifierValue
    expect(screen.getByText('1234567')).toBeInTheDocument();
  });

  it('skips row entirely when feature value is null/missing', () => {
    const { container } = render(
      <VectorMetaTable
        metaArray={[{
          features: {},
          legend: [{ Identifier: 'MISSING_FIELD' }],
          featureTitle: 'Feature',
        }]}
      />,
    );
    expect(container.querySelectorAll('tbody tr')).toHaveLength(0);
  });

  it('renders Description tooltip when Description is present', () => {
    render(
      <VectorMetaTable
        metaArray={[{
          features: { NAME: 'Foo' },
          legend: [{ Identifier: 'NAME', Description: 'The feature name' }],
          featureTitle: 'Feature',
        }]}
      />,
    );
    expect(screen.getByTestId('vector-tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('vector-tooltip')).toHaveTextContent('The feature name');
  });

  it('does not render a Description tooltip when Description is absent', () => {
    render(
      <VectorMetaTable
        metaArray={[{
          features: { NAME: 'Foo' },
          legend: [{ Identifier: 'NAME' }],
          featureTitle: 'Feature',
        }]}
      />,
    );
    expect(screen.queryByTestId('vector-tooltip')).not.toBeInTheDocument();
  });

  it('renders Units next to the value when Units is set', () => {
    render(
      <VectorMetaTable
        metaArray={[{
          features: { AREA: 100 },
          legend: [{ Identifier: 'AREA', Units: 'km²' }],
          featureTitle: 'Feature',
        }]}
      />,
    );
    expect(screen.getByText('km²')).toBeInTheDocument();
  });

  it('does not render a Units span when Units is absent', () => {
    const { container } = render(
      <VectorMetaTable
        metaArray={[{
          features: { AREA: 100 },
          legend: [{ Identifier: 'AREA' }],
          featureTitle: 'Feature',
        }]}
      />,
    );
    // Only one <span> (the value itself), no units span
    const spans = container.querySelectorAll('td span');
    expect(spans).toHaveLength(1);
  });

  it('renders multiple metaArray entries as separate tables', () => {
    render(
      <VectorMetaTable
        metaArray={[
          {
            features: { ID: 1 },
            legend: [{ Identifier: 'ID' }],
            featureTitle: 'Dam A',
          },
          {
            features: { ID: 2 },
            legend: [{ Identifier: 'ID' }],
            featureTitle: 'Dam B',
          },
        ]}
      />,
    );
    expect(screen.getByText('Dam A')).toBeInTheDocument();
    expect(screen.getByText('Dam B')).toBeInTheDocument();
  });

  it('renders ValueMap lookup value instead of raw feature value', () => {
    render(
      <VectorMetaTable
        metaArray={[{
          features: { STATUS: 'U' },
          legend: [{ Identifier: 'STATUS', ValueMap: { U: 'Urban', R: 'Rural' } }],
          featureTitle: 'Feature',
        }]}
      />,
    );
    expect(screen.getByText('Urban')).toBeInTheDocument();
    expect(screen.queryByText('U')).not.toBeInTheDocument();
  });
});
