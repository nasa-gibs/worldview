import { renderHook } from '@testing-library/react';
import usePrevious from './customHooks';

describe('usePrevious', () => {
  it('returns undefined on the first render', () => {
    const { result } = renderHook(() => usePrevious('initial'));
    expect(result.current).toBeUndefined();
  });

  it('returns the previous string value after an update', () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: 'first' },
    });

    rerender({ value: 'second' });
    expect(result.current).toBe('first');
  });

  it('returns the previous value after a second update', () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: 'first' },
    });

    rerender({ value: 'second' });
    rerender({ value: 'third' });
    expect(result.current).toBe('second');
  });

  it('works with numeric values', () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: 1 },
    });

    rerender({ value: 2 });
    expect(result.current).toBe(1);
  });

  it('works with object values', () => {
    const obj1 = { a: 1 };
    const obj2 = { a: 2 };

    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: obj1 },
    });

    rerender({ value: obj2 });
    expect(result.current).toBe(obj1);
  });

  it('works with boolean values', () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: false },
    });

    rerender({ value: true });
    expect(result.current).toBe(false);
  });

  it('works with null values', () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: null },
    });

    rerender({ value: 'something' });
    expect(result.current).toBeNull();
  });

  it('works with undefined values', () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: undefined },
    });

    rerender({ value: 'defined' });
    expect(result.current).toBeUndefined();
  });

  it('does not update previous value when re-rendered with the same value', () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: 'same' },
    });

    rerender({ value: 'changed' });
    rerender({ value: 'changed' }); // same value again
    expect(result.current).toBe('changed');
  });

  it('tracks multiple successive updates correctly', () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: 0 },
    });

    rerender({ value: 1 });
    expect(result.current).toBe(0);

    rerender({ value: 2 });
    expect(result.current).toBe(1);

    rerender({ value: 3 });
    expect(result.current).toBe(2);
  });

  it('works with array values', () => {
    const arr1 = [1, 2, 3];
    const arr2 = [4, 5, 6];

    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: arr1 },
    });

    rerender({ value: arr2 });
    expect(result.current).toEqual([1, 2, 3]);
    expect(result.current).toBe(arr1);
  });
});
