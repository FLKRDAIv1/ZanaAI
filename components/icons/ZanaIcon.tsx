import React from 'react';

// The Zana AI logo.
export const ZanaIcon: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = (props) => (
  <img 
    src="https://i.imgur.com/5doH41V.png" 
    alt="Zana AI Logo"
    // Spreading props allows for className and other attributes to be passed down.
    {...props}
  />
);
