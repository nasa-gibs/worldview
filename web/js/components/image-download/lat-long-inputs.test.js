import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('ol/proj', () => ({
  transformExtent: jest.fn((extent) => extent),
}));
jest.mock('ol/extent', () => ({
  containsExtent: jest.fn(() => true),
  isEmpty: jest.fn(() => false),
}));

import LatLongSelect from './lat-long-inputs';
import * as olProj from 'ol/proj';
import { containsExtent } from 'ol/extent';

describe('LatLongSelect and Input', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const geoLatLong = [[-10, -20], [10, 20]];
  const viewExtent = [-180, -90, 180, 90];

  test('renders toggle button and shows/hides coordinates', () => {
    render(<LatLongSelect onLatLongChange={() => { }} geoLatLong={geoLatLong} viewExtent={viewExtent} crs="EPSG:4326" />);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Edit Coordinates');
    fireEvent.click(button);
    expect(screen.getByText('Top Right')).toBeInTheDocument();
    expect(screen.getByText('Bottom Left')).toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.queryByText('Top Right')).not.toBeInTheDocument();
  });

  test('inputs show formatted values', () => {
    render(<LatLongSelect onLatLongChange={() => { }} geoLatLong={geoLatLong} viewExtent={viewExtent} crs="EPSG:4326" />);
    fireEvent.click(screen.getByRole('button'));
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(4);
    expect(inputs[0]).toHaveValue('20.0000');
  });

  test('successful input update calls onLatLongChange on blur', async () => {
    const onLatLongChange = jest.fn();
    render(<LatLongSelect onLatLongChange={onLatLongChange} geoLatLong={geoLatLong} viewExtent={viewExtent} crs="EPSG:4326" />);
    fireEvent.click(screen.getByRole('button'));
    const latInput = screen.getAllByRole('textbox')[0];
    fireEvent.change(latInput, { target: { value: '15' } });
    fireEvent.blur(latInput);
    await waitFor(() => expect(onLatLongChange).toHaveBeenCalled());
    expect(olProj.transformExtent).toHaveBeenCalled();
    expect(containsExtent).toHaveBeenCalled();
  });

  test('pressing Enter triggers update and pressing Tab triggers update', async () => {
    const onLatLongChange = jest.fn();
    render(<LatLongSelect onLatLongChange={onLatLongChange} geoLatLong={geoLatLong} viewExtent={viewExtent} crs="EPSG:4326" />);
    fireEvent.click(screen.getByRole('button'));
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '12' } });
    fireEvent.keyDown(inputs[0], { keyCode: 13 });
    await waitFor(() => expect(onLatLongChange).toHaveBeenCalled());
    onLatLongChange.mockClear();
    fireEvent.change(inputs[1], { target: { value: '-5' } });
    fireEvent.keyDown(inputs[1], { keyCode: 9 });
    await waitFor(() => expect(onLatLongChange).toHaveBeenCalled());
  });

  test('invalid input shows Not Visible and resets after timeout', async () => {
    require('ol/extent').containsExtent.mockImplementation(() => false);
    jest.useFakeTimers();
    const onLatLongChange = jest.fn();
    render(<LatLongSelect onLatLongChange={onLatLongChange} geoLatLong={geoLatLong} viewExtent={viewExtent} crs="EPSG:4326" />);
    fireEvent.click(screen.getByRole('button'));
    const latInput = screen.getAllByRole('textbox')[0];
    fireEvent.change(latInput, { target: { value: '999' } });
    fireEvent.blur(latInput);
    expect(await screen.findByText('Not Visible')).toBeInTheDocument();
    jest.advanceTimersByTime(4000);
    await waitFor(() => expect(screen.queryByText('Not Visible')).not.toBeInTheDocument());
    jest.useRealTimers();
  });
});
