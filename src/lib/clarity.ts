/**
 * Microsoft Clarity Analytics integration for BPEXCH1.com
 * Initializes Clarity once using the configured environment variable.
 */
declare global {
  interface Window {
    clarity?: (...args: any[]) => void;
  }
}

let isInitialized = false;

export function initClarity(): void {
  if (isInitialized || typeof window === "undefined") {
    return;
  }

  // Support Vite and Next.js style env variables
  const clarityProjectId =
    import.meta.env.VITE_CLARITY_PROJECT_ID ||
    (import.meta.env as any).NEXT_PUBLIC_CLARITY_PROJECT_ID;

  if (!clarityProjectId || typeof clarityProjectId !== "string" || clarityProjectId.trim() === "") {
    return;
  }

  const cleanId = clarityProjectId.trim();

  // Standard official Microsoft Clarity loader with ES-compliant rest parameters
  (function (c: any, l: Document, a: string, r: string, i: string) {
    c[a] =
      c[a] ||
      function (...args: any[]) {
        (c[a].q = c[a].q || []).push(args);
      };
    const t = l.createElement(r) as HTMLScriptElement;
    t.async = true;
    t.src = `https://www.clarity.ms/tag/${i}`;
    const y = l.getElementsByTagName(r)[0];
    if (y && y.parentNode) {
      y.parentNode.insertBefore(t, y);
    } else {
      l.head.appendChild(t);
    }
  })(window, document, "clarity", "script", cleanId);

  isInitialized = true;
}
