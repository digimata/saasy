import { useEffect, useState } from "react";

// -------------------------------
// projects/saasy/apps/web/hooks/auth/use-lang.ts
//
// export function useLang()    L9
// -------------------------------

export function useLang() {
  const [lang, setLang] = useState<string>();

  useEffect(() => {
    const checkLang = () => {
      const currentLang = document.documentElement.getAttribute("lang");
      setLang(currentLang ?? undefined);
    };

    // Initial check
    checkLang();

    // Listen for changes to lang attribute on html tag
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "lang") {
          checkLang();
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  return { lang };
}
