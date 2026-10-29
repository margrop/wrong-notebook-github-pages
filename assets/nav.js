"use strict";

// 首页与下载页共用的手机导航菜单，按 <html lang> 选择按钮说明文字。
(() => {
  const isEnglish = document.documentElement.lang.startsWith("en");
  const text = isEnglish ? { openNav: "Open navigation", closeNav: "Close navigation" } : { openNav: "打开导航", closeNav: "关闭导航" };
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  if (!menuToggle || !mobileNav) return;
  function closeMenu() {
    mobileNav.hidden = true;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", text.openNav);
  }
  menuToggle.addEventListener("click", () => {
    const open = menuToggle.getAttribute("aria-expanded") !== "true";
    mobileNav.hidden = !open;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? text.closeNav : text.openNav);
  });
  mobileNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !mobileNav.hidden) {
      closeMenu();
      menuToggle.focus();
    }
  });
  window.matchMedia("(min-width: 681px)").addEventListener("change", (event) => { if (event.matches) closeMenu(); });
})();
