// Domain utilities for authentication and configuration

export const AUTHORIZED_DOMAINS = [
  "localhost",
  "127.0.0.1",
  "smsglobe.net",
  "app.smsglobe.net", 
  "smsglobe-test.vercel.app",
  "deemax-3223e.firebaseapp.com"
];

export const getCurrentDomain = (): string => {
  if (typeof window === "undefined") return "localhost";
  return window.location.hostname;
};

export const getCurrentOrigin = (): string => {
  if (typeof window === "undefined") return "http://localhost:3000";
  return window.location.origin;
};

export const isAuthorizedDomain = (domain?: string): boolean => {
  const currentDomain = domain || getCurrentDomain();
  
  return AUTHORIZED_DOMAINS.some(authorizedDomain => 
    currentDomain === authorizedDomain || 
    currentDomain.endsWith(`.${authorizedDomain}`) ||
    (authorizedDomain.includes('.') && currentDomain.endsWith(authorizedDomain))
  );
};

export const isProductionEnvironment = (): boolean => {
  if (typeof window === "undefined") return false;
  
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Consider it production if:
  // 1. It's HTTPS and not localhost
  // 2. It's on a known production domain
  // 3. It's on Vercel or Firebase hosting
  return (
    protocol === "https:" && 
    hostname !== "localhost" && 
    hostname !== "127.0.0.1"
  ) || (
    hostname.endsWith(".vercel.app") ||
    hostname.endsWith(".firebaseapp.com") ||
    AUTHORIZED_DOMAINS.includes(hostname)
  );
};

export const shouldUseRecaptcha = (): boolean => {
  return isProductionEnvironment() && !!import.meta.env.VITE_PUBLIC_RECAPTCHA_SITE_KEY;
};

export const getAuthRedirectUrl = (): string => {
  const origin = getCurrentOrigin();
  return `${origin}/__/auth/handler`;
};

// Debug function to log current domain info
export const logDomainInfo = (): void => {
  if (typeof window === "undefined") return;
  
  console.log("Domain Debug Info:", {
    hostname: window.location.hostname,
    origin: window.location.origin,
    protocol: window.location.protocol,
    isAuthorized: isAuthorizedDomain(),
    isProduction: isProductionEnvironment(),
    shouldUseRecaptcha: shouldUseRecaptcha(),
    redirectUrl: getAuthRedirectUrl()
  });
};