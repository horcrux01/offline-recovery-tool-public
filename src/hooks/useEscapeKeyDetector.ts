import { useEffect, useRef } from 'react';

const useEscapeKeyDetector = <P extends HTMLElement>(handler: () => void) => {
  const ref = useRef<P>(null);
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.keyCode === 27) {
        handler();
      }
    }

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  return ref;
};

export default useEscapeKeyDetector;
