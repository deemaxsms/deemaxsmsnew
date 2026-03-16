import React from 'react';

interface ServiceIconProps {
  serviceName: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ServiceIcon: React.FC<ServiceIconProps> = ({ 
  serviceName, 
  className = '', 
  size = 'md' 
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'w-4 h-4 text-sm',
    md: 'w-6 h-6 text-base',
    lg: 'w-8 h-8 text-lg'
  };

  // Get service icon URL using multiple reliable sources
  const getServiceIconUrls = (service: string) => {
    const serviceDomains: Record<string, string> = {
      'Google': 'google.com',
      'Amazon': 'amazon.com',
      'Facebook': 'facebook.com',
      'Instagram': 'instagram.com',
      'WhatsApp': 'whatsapp.com',
      'Telegram': 'telegram.org',
      'Discord': 'discord.com',
      'Twitter': 'twitter.com',
      'LinkedIn': 'linkedin.com',
      'Uber': 'uber.com',
      'Apple': 'apple.com',
      'Microsoft': 'microsoft.com',
      'Airbnb': 'airbnb.com',
      'Netflix': 'netflix.com',
      'Spotify': 'spotify.com',
      'TikTok': 'tiktok.com',
      'Snapchat': 'snapchat.com',
      'Pinterest': 'pinterest.com',
      'Reddit': 'reddit.com',
      'YouTube': 'youtube.com'
    };

    const domain = serviceDomains[service] || `${service.toLowerCase()}.com`;
    
    // Multiple fallback sources for better reliability
    return [
      `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      `https://favicon.im/${domain}?larger=true`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      `https://logo.clearbit.com/${domain}`
    ];
  };

  // Emoji icons for services (fallback)
  const getServiceEmoji = (serviceName: string): string => {
    const emojiMap: Record<string, string> = {
      'whatsapp': '💬',
      'telegram': '✈️',
      'discord': '🎮',
      'instagram': '📷',
      'facebook': '👥',
      'twitter': '🐦',
      'x': '🐦',
      'google': '🔍',
      'gmail': '📧',
      'amazon': '📦',
      'apple': '🍎',
      'microsoft': '🪟',
      'netflix': '🎬',
      'spotify': '🎵',
      'tiktok': '🎭',
      'linkedin': '💼',
      'uber': '🚗',
      'paypal': '💳',
      'steam': '🎮',
      'github': '👨‍💻',
      'dropbox': '📁',
      'zoom': '📹',
      'snapchat': '👻',
      'pinterest': '📌',
      'reddit': '🤖',
      'twitch': '🎮',
      'youtube': '📺',
      'skype': '📞',
      'viber': '📱',
      'wechat': '💬',
      'line': '💚',
      'kakaotalk': '💛',
      'signal': '🔒',
      'verification': '🔐',
      'sms': '📱',
      'phone': '📞',
      'mobile': '📱',
      'airbnb': '🏠',
      'default': '🔗'
    };
    
    const key = serviceName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    return emojiMap[key] || emojiMap['default'] || '🔗';
  };

  const iconUrls = getServiceIconUrls(serviceName);
  const fallbackEmoji = getServiceEmoji(serviceName);

  return (
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center relative`}>
      <img
        src={iconUrls[0]}
        alt={`${serviceName} icon`}
        className={`${sizeClasses[size].split(' ')[0]} ${sizeClasses[size].split(' ')[1]} rounded object-contain`}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          const currentSrc = target.src;
          const currentIndex = iconUrls.indexOf(currentSrc);
          
          // Try next URL in the list
          if (currentIndex < iconUrls.length - 1) {
            target.src = iconUrls[currentIndex + 1];
          } else {
            // All URLs failed, show emoji fallback
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent && !parent.querySelector('.emoji-fallback')) {
              const emojiSpan = document.createElement('span');
              emojiSpan.className = 'emoji-fallback';
              emojiSpan.textContent = fallbackEmoji;
              parent.appendChild(emojiSpan);
            }
          }
        }}
        onLoad={(e) => {
          const target = e.target as HTMLImageElement;
          // Check if image is actually loaded (not a placeholder)
          if (target.naturalWidth === 0 || target.naturalHeight === 0) {
            // Trigger error handler to try next URL
            target.dispatchEvent(new Event('error'));
          }
        }}
      />
    </div>
  );
};