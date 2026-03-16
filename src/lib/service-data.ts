export const serviceLogos: { [key: string]: string } = {
  wa: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg",
  tg: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg",
  go: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg",
  fb: "https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png",
  ig: "https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg",
  tw: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg",
  vk: "https://upload.wikimedia.org/wikipedia/commons/f/f3/VK_Compact_Logo_%282021-present%29.svg",
  vi: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Viber_logo.svg",
  ub: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png",
  li: "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png",
  ms: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
  am: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
  nf: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
  sp: "https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg",
};

export const countryData: { [key: string]: { name: string; flag: string } } = {
  "0": { name: "Russia", flag: "https://flagcdn.com/w40/ru.png" },
  "1": { name: "Ukraine", flag: "https://flagcdn.com/w40/ua.png" },
  "2": { name: "Kazakhstan", flag: "https://flagcdn.com/w40/kz.png" },
  "3": { name: "China", flag: "https://flagcdn.com/w40/cn.png" },
  "4": { name: "Philippines", flag: "https://flagcdn.com/w40/ph.png" },
  "5": { name: "Myanmar", flag: "https://flagcdn.com/w40/mm.png" },
  "6": { name: "Indonesia", flag: "https://flagcdn.com/w40/id.png" },
  "7": { name: "Malaysia", flag: "https://flagcdn.com/w40/my.png" },
  "8": { name: "Kenya", flag: "https://flagcdn.com/w40/ke.png" },
  "10": { name: "Vietnam", flag: "https://flagcdn.com/w40/vn.png" },
  "11": { name: "Kyrgyzstan", flag: "https://flagcdn.com/w40/kg.png" },
  "12": { name: "USA", flag: "https://flagcdn.com/w40/us.png" },
  "13": { name: "Israel", flag: "https://flagcdn.com/w40/il.png" },
  "14": { name: "Hong Kong", flag: "https://flagcdn.com/w40/hk.png" },
  "15": { name: "Poland", flag: "https://flagcdn.com/w40/pl.png" },
  "16": { name: "United Kingdom", flag: "https://flagcdn.com/w40/gb.png" },
  "22": { name: "India", flag: "https://flagcdn.com/w40/in.png" },
  "32": { name: "Romania", flag: "https://flagcdn.com/w40/ro.png" },
  "33": { name: "Colombia", flag: "https://flagcdn.com/w40/co.png" },
  "36": { name: "Canada", flag: "https://flagcdn.com/w40/ca.png" },
  "39": { name: "Argentina", flag: "https://flagcdn.com/w40/ar.png" },
};

export const getServiceLogo = (serviceCode: string) => {
  return serviceLogos[serviceCode] || "https://via.placeholder.com/40";
};

export const getCountryData = (countryCode: string) => {
  return countryData[countryCode] || { name: `Country ${countryCode}`, flag: "https://flagcdn.com/w40/un.png" };
};
