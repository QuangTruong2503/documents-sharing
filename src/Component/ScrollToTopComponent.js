import { faAngleDoubleUp, faArrowUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState, useEffect } from 'react';

const ScrollToTopComponent = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Function để cuộn lên đầu trang
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Kiểm tra vị trí cuộn của trang
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 100) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    // Cleanup event listener khi component bị unmount
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <div>
      {isVisible && (
        <button
        onClick={scrollToTop}
        className="fixed bottom-4 right-4 text-blue-600 bg-transparent border-solid border-2 border-blue-500 p-4 rounded-3xl shadow-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
      >
        <FontAwesomeIcon icon={faAngleDoubleUp}/>
      </button>
      )}
    </div>
  );
};

export default ScrollToTopComponent;
