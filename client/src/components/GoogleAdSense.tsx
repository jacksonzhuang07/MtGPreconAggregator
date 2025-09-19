import { useEffect, useRef } from 'react';

interface GoogleAdSenseProps {
  adSlot: string;
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export function GoogleAdSense({ 
  adSlot, 
  adFormat = 'auto', 
  className = '',
  style = {}
}: GoogleAdSenseProps) {
  const adRef = useRef<HTMLModElement>(null);
  const publisherId = import.meta.env.VITE_GOOGLE_ADSENSE_PUBLISHER_ID || 
                     (typeof process !== 'undefined' && process.env?.GOOGLE_ADSENSE_PUBLISHER_ID);

  useEffect(() => {
    // Load AdSense script if not already loaded
    if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    // Initialize the ad
    const pushAd = () => {
      try {
        if (window.adsbygoogle && adRef.current) {
          window.adsbygoogle.push({});
        }
      } catch (error) {
        console.error('AdSense error:', error);
      }
    };

    // Wait for the script to load
    const checkAdSense = () => {
      if (window.adsbygoogle) {
        pushAd();
      } else {
        setTimeout(checkAdSense, 100);
      }
    };

    checkAdSense();
  }, [publisherId]);

  if (!publisherId) {
    return (
      <div className={`bg-muted/50 border border-border rounded-lg p-4 text-center ${className}`} style={style}>
        <p className="text-sm text-muted-foreground">Ad placement</p>
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          display: 'block',
          textAlign: 'center',
          ...style
        }}
        data-ad-client={publisherId}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
}