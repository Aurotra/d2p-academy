export {};

declare global {
  interface Window {
    Tawk_API?: {
      maximize?: () => void;
      hideWidget?: () => void;
      showWidget?: () => void;
      toggle?: () => void;
      onLoad?: () => void;
    };
    Tawk_LoadStart?: Date;
  }
}
