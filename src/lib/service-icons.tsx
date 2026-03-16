import { MessageCircle, Send, Mail, Phone, Lock, Users, Video, Share2, ShoppingCart, Music } from "lucide-react";

export const serviceIcons: { [key: string]: any } = {
  wa: MessageCircle,
  tg: Send,
  go: Mail,
  fb: Users,
  ig: Video,
  tw: Share2,
  vk: Users,
  ok: Users,
  vi: Phone,
  wb: MessageCircle,
  av: ShoppingCart,
  ot: ShoppingCart,
  ub: Phone,
  qi: Mail,
  we: MessageCircle,
  bd: Mail,
  mm: Mail,
  mb: Mail,
  ya: Mail,
  ma: Mail,
};

export const getServiceIcon = (serviceCode: string) => {
  return serviceIcons[serviceCode] || MessageCircle;
};

export const countryFlags: { [key: string]: string } = {
  "0": "🇷🇺",
  "1": "🇺🇦",
  "2": "🇰🇿",
  "3": "🇨🇳",
  "4": "🇵🇭",
  "5": "🇲🇲",
  "6": "🇮🇩",
  "7": "🇲🇾",
  "8": "🇰🇪",
  "10": "🇻🇳",
  "11": "🇰🇬",
  "12": "🇺🇸",
  "13": "🇮🇱",
  "14": "🇭🇰",
  "15": "🇵🇱",
  "16": "🇬🇧",
  "22": "🇮🇳",
  "32": "🇷🇴",
  "33": "🇨🇴",
  "36": "🇨🇦",
  "39": "🇦🇷",
};

export const getCountryFlag = (countryCode: string) => {
  return countryFlags[countryCode] || "🌍";
};
