import { useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';

/**
 * Keeps a slider's displayed value fully controlled while debouncing the
 * commit (e.g. a redux dispatch that triggers a layer rebuild). While the
 * user is actively sliding, external prop updates are ignored so the thumb
 * doesn't jump; once the debounced commit fires, external updates resume.
 * @param {number} propValue | The externally-controlled value (e.g. from redux)
 * @param {function} commit | Called with the final value after `delay` ms of inactivity
 * @param {number} delay | Debounce delay in ms
 * @returns {[number, function, object]} [value, onSlide, isSlidingRef]
 */
export default function useDebouncedSliderValue(propValue, commit, delay = 250) {
  const [value, setValue] = useState(propValue);
  const isSliding = useRef(false);
  const commitRef = useRef(commit);
  commitRef.current = commit;

  const debouncedCommit = useRef(debounce((val) => {
    isSliding.current = false;
    commitRef.current(val);
  }, delay)).current;

  useEffect(() => {
    if (!isSliding.current) setValue(propValue);
  }, [propValue]);

  useEffect(() => () => debouncedCommit.cancel(), [debouncedCommit]);

  const onSlide = (val) => {
    isSliding.current = true;
    setValue(val);
    debouncedCommit(val);
  };

  return [value, onSlide, isSliding];
}
