"use strict";

// 深色模式切换：自动（跟随系统，默认）→ 浅色 → 深色，偏好只保存在本浏览器。
// 首屏的 data-theme 由 <head> 中的内联脚本设置，避免深色模式下闪现浅色页面。
(() => {
  const STORAGE_KEY = "wn-site-theme";
  const ORDER = ["system", "light", "dark"];
  const isEnglish = document.documentElement.lang.startsWith("en");
  const names = isEnglish
    ? { prefix: "Theme", system: "Auto (follow system)", light: "Light", dark: "Dark" }
    : { prefix: "主题", system: "自动（跟随系统）", light: "浅色", dark: "深色" };
  const separator = isEnglish ? ": " : "：";
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const root = document.documentElement;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const lightThemeColor = themeColor ? themeColor.getAttribute("content") : null;

  function readPreference() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return ORDER.includes(saved) ? saved : "system";
    } catch {
      return "system";
    }
  }

  function apply(preference) {
    const dark = preference === "dark" || (preference === "system" && media.matches);
    root.setAttribute("data-theme-preference", preference);
    root.setAttribute("data-theme", dark ? "dark" : "light");
    if (themeColor && lightThemeColor) themeColor.setAttribute("content", dark ? "#121118" : lightThemeColor);
    const label = `${names.prefix}${separator}${names[preference]}`;
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
    });
  }

  let preference = readPreference();
  apply(preference);

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      preference = ORDER[(ORDER.indexOf(preference) + 1) % ORDER.length];
      try {
        localStorage.setItem(STORAGE_KEY, preference);
      } catch {
        // 存储不可用时只在本次浏览中生效
      }
      apply(preference);
    });
  });

  // 跟随系统时，系统切换深浅色后立即更新
  media.addEventListener("change", () => { if (preference === "system") apply(preference); });
  // 其他标签页修改偏好时同步
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    preference = readPreference();
    apply(preference);
  });
})();
