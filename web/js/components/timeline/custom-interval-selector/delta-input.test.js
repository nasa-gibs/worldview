import { render, fireEvent } from '@testing-library/react';
import DeltaInput from './delta-input';

function renderInput(props = {}) {
  const changeDelta = props.changeDelta || jest.fn();
  const utils = render(<DeltaInput deltaValue={props.deltaValue ?? 5} changeDelta={changeDelta} />);
  const input = utils.container.querySelector('input.custom-interval-delta-input');
  return { changeDelta, input, ...utils };
}

describe('DeltaInput', () => {
  it('initializes the input value from deltaValue on mount', () => {
    const { input } = renderInput({ deltaValue: 7 });
    expect(input.value).toBe('7');
  });

  it('accepts numeric input below 1000', () => {
    const { input } = renderInput();
    fireEvent.change(input, { target: { value: '42' } });
    expect(input.value).toBe('42');
  });

  it('allows clearing the input to empty (zero)', () => {
    const { input } = renderInput();
    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('0');
  });

  it('ignores non-numeric input', () => {
    const { input } = renderInput({ deltaValue: 3 });
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(input.value).toBe('3');
  });

  it('ignores input of 1000 or greater', () => {
    const { input } = renderInput({ deltaValue: 3 });
    fireEvent.change(input, { target: { value: '2000' } });
    expect(input.value).toBe('3');
  });

  it('calls changeDelta and marks valid on blur with a valid value', () => {
    const { input, changeDelta } = renderInput({ deltaValue: 5 });
    fireEvent.blur(input);
    expect(changeDelta).toHaveBeenCalledWith(5);
    expect(input.style.borderColor).toBe('');
  });

  it('marks the input invalid on blur with an out-of-range value', () => {
    const { input, changeDelta } = renderInput();
    fireEvent.change(input, { target: { value: '' } }); // becomes 0
    fireEvent.blur(input);
    expect(changeDelta).not.toHaveBeenCalled();
    // jsdom normalizes the hex color to rgb form
    expect(input.style.borderColor).toBe('rgb(255, 0, 0)');
  });

  it('selects the text on focus', () => {
    const { input } = renderInput();
    const selectSpy = jest.spyOn(input, 'select');
    fireEvent.focus(input);
    expect(selectSpy).toHaveBeenCalled();
  });

  it('increments the value on ArrowUp', () => {
    const { input } = renderInput({ deltaValue: 5 });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.value).toBe('6');
  });

  it('decrements the value on ArrowDown', () => {
    const { input } = renderInput({ deltaValue: 5 });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.value).toBe('4');
  });

  it('does not decrement below 1', () => {
    const { input } = renderInput({ deltaValue: 1 });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.value).toBe('1');
  });

  it('does not increment at or above 1000', () => {
    const { input } = renderInput({ deltaValue: 999 });
    fireEvent.change(input, { target: { value: '999' } });
    fireEvent.keyDown(input, { key: 'ArrowUp' }); // 999 -> 1000
    fireEvent.keyDown(input, { key: 'ArrowUp' }); // 1000 is not < 1000, stays
    expect(input.value).toBe('1000');
  });

  it('submits the value on Enter', () => {
    const { input, changeDelta } = renderInput({ deltaValue: 8 });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(changeDelta).toHaveBeenCalledWith(8);
  });
});
