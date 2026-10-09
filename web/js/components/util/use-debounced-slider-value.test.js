import { renderHook, act } from '@testing-library/react';
import useDebouncedSliderValue from './use-debounced-slider-value';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('useDebouncedSliderValue', () => {
  it('initializes value from propValue', () => {
    const { result } = renderHook(() => useDebouncedSliderValue(3, jest.fn()));
    const [value] = result.current;
    expect(value).toBe(3);
  });

  it('updates value immediately on slide, before the debounce fires', () => {
    const { result } = renderHook(() => useDebouncedSliderValue(3, jest.fn()));
    act(() => {
      const [, onSlide] = result.current;
      onSlide(7);
    });
    const [value] = result.current;
    expect(value).toBe(7);
  });

  it('only calls commit once, after the debounce delay, for a rapid sequence of slides', () => {
    const commit = jest.fn();
    const { result } = renderHook(() => useDebouncedSliderValue(1, commit, 250));
    act(() => {
      const [, onSlide] = result.current;
      onSlide(2);
      onSlide(3);
      onSlide(4);
    });
    expect(commit).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith(4);
  });

  it('ignores external propValue updates while actively sliding', () => {
    const { result, rerender } = renderHook(
      ({ propValue }) => useDebouncedSliderValue(propValue, jest.fn()),
      { initialProps: { propValue: 1 } },
    );
    act(() => {
      const [, onSlide] = result.current;
      onSlide(5);
    });
    rerender({ propValue: 9 });
    const [value] = result.current;
    expect(value).toBe(5);
  });

  it('resumes mirroring external propValue updates after the commit fires', () => {
    const { result, rerender } = renderHook(
      ({ propValue }) => useDebouncedSliderValue(propValue, jest.fn(), 250),
      { initialProps: { propValue: 1 } },
    );
    act(() => {
      const [, onSlide] = result.current;
      onSlide(5);
      jest.advanceTimersByTime(250);
    });
    rerender({ propValue: 9 });
    const [value] = result.current;
    expect(value).toBe(9);
  });
});
