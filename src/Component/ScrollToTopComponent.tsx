import { faAngleUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState, useEffect, useCallback } from 'react';

const ScrollToTopComponent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Memoized scroll handler
  const handleScroll = useCallback(() => {
    const scrollPosition = window.scrollY;
    setIsVisible(scrollPosition > 200); // Increased threshold for better UX
  }, []);

  // Memoized scroll to top function
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  useEffect(() => {
    // Throttle scroll event for better performance
    let throttleTimeout: NodeJS.Timeout | null = null;
    
    const throttledScroll = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          handleScroll();
          throttleTimeout = null;
        }, 200);
      }
    };

    window.addEventListener('scroll', throttledScroll);
    
    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', throttledScroll);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [handleScroll]);

  return (
    <button
      onClick={scrollToTop}
      className={`
        fixed bottom-20 right-12 z-50
        w-12 h-12 flex items-center justify-center
        bg-white text-blue-600
        rounded-full shadow-lg
        border border-blue-200
        opacity-0 transition-all duration-300 ease-in-out
        hover:bg-blue-50 hover:shadow-xl
        ${isVisible ? 'opacity-100 translate-y-0' : 'translate-y-8 pointer-events-none'}
      `}
      aria-label="Scroll to top"
    >
      <FontAwesomeIcon 
        icon={faAngleUp} 
        className="w-6 h-6"
      />
    </button>
  );
};

export default ScrollToTopComponent;