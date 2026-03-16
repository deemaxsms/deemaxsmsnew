// Flag service to handle country flags from multiple sources
class FlagService {
  // Primary flag API sources (in order of preference)
  private flagSources = [
    (code: string) => `https://flagsapi.com/${code}/flat/32.png`,
    (code: string) => `https://countryflagsapi.com/png/${code}`,
    (code: string) => `https://flagcdn.com/32x24/${code.toLowerCase()}.png`,
  ];

  // Get flag URL with fallback
  getFlagUrl(countryCode: string): string {
    return this.flagSources[0](countryCode.toUpperCase());
  }

  // Get emoji flag as fallback (public method)
  getEmojiFlag(countryCode: string): string {
    try {
      const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    } catch {
      return '🏳️';
    }
  }

  // Create flag element with automatic fallback
  createFlagElement(countryCode: string, className: string = 'w-6 h-4 object-cover rounded'): HTMLElement {
    const container = document.createElement('div');
    container.className = 'inline-flex items-center';
    
    const img = document.createElement('img');
    img.src = this.getFlagUrl(countryCode);
    img.alt = `${countryCode} flag`;
    img.className = className;
    
    const emoji = document.createElement('span');
    emoji.textContent = this.getEmojiFlag(countryCode);
    emoji.className = 'text-lg';
    emoji.style.display = 'none';
    
    img.onerror = () => {
      img.style.display = 'none';
      emoji.style.display = 'inline';
    };
    
    container.appendChild(img);
    container.appendChild(emoji);
    
    return container;
  }
}

export const flagService = new FlagService();