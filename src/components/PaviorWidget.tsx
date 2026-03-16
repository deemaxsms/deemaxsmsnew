import { useEffect } from 'react';

const PaviorWidget = () => {
  useEffect(() => {
    // Function to initialize Pavior
    const initializePavior = () => {
      console.log('Attempting to initialize Pavior...');
      
      if (typeof window.Pavior !== 'undefined') {
        try {
          window.Pavior('init', {
            teamVanityId: 'smsglobe-service',
            doChat: true,
            doTimeTravel: true,
            quadClickForFeedback: true,
          });
          console.log('✅ Pavior widget initialized successfully');
        } catch (error) {
          console.error('❌ Error initializing Pavior:', error);
        }
      } else {
        console.log('⏳ Pavior not ready yet, retrying in 1 second...');
        setTimeout(initializePavior, 1000);
      }
    };

    // Load Pavior script if not already loaded
    if (!document.querySelector('script[src="https://app.pavior.com/embed"]')) {
      const script = document.createElement('script');
      script.src = 'https://app.pavior.com/embed';
      script.async = true;
      script.onload = () => {
        console.log('📦 Pavior script loaded');
        setTimeout(initializePavior, 500); // Give it a moment to initialize
      };
      script.onerror = () => {
        console.error('❌ Failed to load Pavior script');
      };
      document.head.appendChild(script);
    } else {
      // Script already exists, try to initialize
      initializePavior();
    }

    // Cleanup function
    return () => {
      // Pavior cleanup if needed
      if (typeof window.Pavior !== 'undefined') {
        try {
          window.Pavior('destroy');
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  return null; // This component doesn't render anything visible
};

export default PaviorWidget;