import { useEffect, useState } from "react";

/**
 * Tracks the `.dark` class on <html>, which ThemeToggle mutates directly
 * (no React context involved). Needed for third-party components whose
 * theming isn't driven by Tailwind's `dark:` variant, e.g. libraries that
 * expect an explicit light/dark class name instead.
 */
export function useIsDarkMode() {
  const [isDark, setIsDark] = useState(() =>
    typeof document === "undefined" ? false : document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const target = document.documentElement;
    const observer = new MutationObserver(() => setIsDark(target.classList.contains("dark")));
    observer.observe(target, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
