import React from 'react';
import renderer from 'react-test-renderer';
import VectorMetaTable from './vector-metadata-table';

let component;
beforeEach(() => {
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

test('Check that there is not popup', () => {
  expect(component.toJSON()).toMatchSnapshot();
});
test('If there is a valuemap, use valuemap', () => {
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
  expect(component.toJSON()).toMatchSnapshot();
});
