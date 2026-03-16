// Pavior support widget type declarations
declare global {
  interface Window {
    Pavior: (action: string, config?: any) => void;
  }
  
  function Pavior(action: string, config?: any): void;
}

export {};