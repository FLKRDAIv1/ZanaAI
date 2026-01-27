import React from 'react';

interface VideoEmbedProps {
  url: string;
}

const VideoEmbed: React.FC<VideoEmbedProps> = ({ url }) => {
  const getEmbedUrl = (videoUrl: string): string | null => {
    // Enhanced regex to handle standard (watch?v=), short (shorts/), and youtu.be links
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]+)/;
    const youtubeMatch = videoUrl.match(youtubeRegex);
    if (youtubeMatch && youtubeMatch[1]) {
      const videoId = youtubeMatch[1];
      return `https://www.youtube.com/embed/${videoId}`;
    }

    // Vimeo
    const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(.+)/;
    const vimeoMatch = videoUrl.match(vimeoRegex);
    if (vimeoMatch) {
      const videoId = vimeoMatch[1].split('/')[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    
    // Direct video file
     const videoFileRegex = /\.(mp4|webm|ogg)$/i;
     if (videoFileRegex.test(videoUrl)) {
       return videoUrl;
     }

    return null; // Return null to fallback to a regular link
  };
  
  const finalUrl = getEmbedUrl(url);

  if (!finalUrl) {
    return <a href={url} target="_blank" rel="noopener noreferrer" className="text-highlight dark:text-dark-highlight hover:underline">{url}</a>;
  }

  if (finalUrl.match(/\.(mp4|webm|ogg)$/i)) {
      return (
        <div className="my-2 aspect-video w-full max-w-md">
            <video controls className="w-full h-full rounded-lg">
                <source src={finalUrl} />
                Your browser does not support the video tag.
            </video>
        </div>
      );
  }

  return (
    <div className="my-2 aspect-video w-full max-w-md">
      <iframe
        src={finalUrl}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="w-full h-full rounded-lg"
      ></iframe>
    </div>
  );
};

export default VideoEmbed;