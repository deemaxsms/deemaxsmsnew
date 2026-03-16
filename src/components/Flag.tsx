import React from 'react';
import { flagService } from '@/services/flag-service';

interface FlagProps {
  countryCode: string;
  className?: string;
}

export const Flag: React.FC<FlagProps> = ({ countryCode, className = 'w-6 h-4' }) => {
  const flagUrl = flagService.getFlagUrl(countryCode);
  const emojiFlag = flagService.getEmojiFlag(countryCode);

  return (
    <div className="inline-flex items-center">
      <img
        src={flagUrl}
        alt={`${countryCode} flag`}
        className={`${className} object-cover rounded`}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent && !parent.querySelector('.emoji-flag')) {
            const emojiSpan = document.createElement('span');
            emojiSpan.className = 'emoji-flag text-lg';
            emojiSpan.textContent = emojiFlag;
            parent.appendChild(emojiSpan);
          }
        }}
      />
    </div>
  );
};