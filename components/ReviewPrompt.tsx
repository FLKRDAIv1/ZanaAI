import React, { useState } from 'react';
import { ZanaIcon } from './icons/ZanaIcon';
import { StarIcon } from './icons/StarIcon';
import { TelegramIcon } from './icons/TelegramIcon';

interface ReviewPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReviewPrompt: React.FC<ReviewPromptProps> = ({ isOpen, onClose }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  if (!isOpen) {
    return null;
  }

  const handleFeedbackClick = () => {
    window.open('https://apps.apple.com/gb/app/zana-ai/id6754184180?uo=2', '_blank');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/60 animate-fade-in"
        onClick={onClose}
      />

      <div className="relative z-50 w-full max-w-xs animate-scale-in rounded-2xl bg-surface dark:bg-dark-surface p-6 text-center shadow-lg">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-overlay dark:bg-dark-overlay">
            <ZanaIcon className="w-10 h-10" />
        </div>

        <h2 id="review-modal-title" className="text-lg font-bold text-primary dark:text-dark-primary">
          چێژ لە زانا AI وەردەگریت؟
        </h2>
        <p className="mt-1 text-sm text-subtle dark:text-dark-subtle">
          بۆچوونی تۆ یارمەتیمان دەدات باشتر بین.
        </p>

        <div className="my-5 flex justify-center space-x-1" dir="ltr">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1"
              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
            >
              <StarIcon
                className={`h-8 w-8 transition-colors ${
                  (hoverRating || rating) >= star
                    ? 'text-yellow-400'
                    : 'text-muted/50 dark:text-dark-muted/50'
                }`}
              />
            </button>
          ))}
        </div>

        <div className="flex flex-col space-y-2">
            <button
                onClick={handleFeedbackClick}
                disabled={rating === 0}
                className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-highlight text-white font-semibold rounded-lg shadow-lg hover:bg-opacity-90 transition-all disabled:bg-muted dark:disabled:bg-dark-muted disabled:cursor-not-allowed btn-premium-glow"
            >
                <TelegramIcon className="w-5 h-5 mr-2"/>
                <span>پێشنیار بنێرە</span>
            </button>
            <button
                onClick={onClose}
                className="w-full px-4 py-2.5 bg-overlay dark:bg-dark-overlay font-semibold rounded-lg hover:bg-opacity-80 transition-colors"
            >
                نەک ئێستا
            </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewPrompt;