
import React from 'react';

interface MapEmbedProps {
  title: string;
  url: string; // The original source URL from Gemini
}

const MapEmbed: React.FC<MapEmbedProps> = ({ title, url }) => {
  const apiKey = 'AIzaSyCjQonAd4bgyETQR82Tx_o8H4SpskeEYdg';

  // A valid Google Cloud API key with the "Maps Embed API" enabled is required.
  // Ensure you have a billing account associated with your Google Cloud project.
  // If the key is missing or invalid, this component will fall back to a direct link.
  if (!apiKey) {
    console.warn("Google Maps API key not available for embedding. Falling back to a direct link.");
    // Fallback to the original link if the key is missing
    return (
        <a 
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-highlight dark:text-dark-highlight hover:underline"
        >
            View on Google Maps: {title}
        </a>
    );
  }

  // Use the title as the query for the place search in the embed API. This is generally reliable.
  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(title)}`;

  return (
    <div className="aspect-video w-full max-w-md rounded-lg overflow-hidden border border-overlay dark:border-dark-overlay">
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={embedUrl}
        title={`Google Map for ${title}`}
      ></iframe>
    </div>
  );
};

export default MapEmbed;
