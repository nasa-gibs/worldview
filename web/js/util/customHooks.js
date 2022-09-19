import { useState, useEffect, useRef} from 'react';

//customHook to get previous value of a prop... see prevProps from class components
export default function usePrevious (value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref.current;
};
