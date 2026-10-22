"use strict";

// 英文页面与中文页面共用本脚本，按 <html lang> 选择界面文字。
const isEnglish = document.documentElement.lang.startsWith("en");
// 英文页使用 images/en/ 下的英文界面与英文演示内容截图
const imageDir = isEnglish ? "en/" : "";
const text = isEnglish
  ? { enlarge: (title) => `Enlarge screenshot: ${title}`, copied: "Command copied. Paste it into your terminal.", copyManually: "Press Ctrl+C / ⌘C to copy the selected command", openNav: "Open navigation", closeNav: "Close navigation" }
  : { enlarge: (title) => `放大${title}截图`, copied: "命令已复制，可粘贴到终端运行", copyManually: "请按 Ctrl+C / ⌘C 复制已选中的命令", openNav: "打开导航", closeNav: "关闭导航" };

// 所有预览素材均采集于原应用；英文版使用独立的英文演示数据。
const screenshots = isEnglish ? {
  notebook: { title: "My notebook", alt: "English question cards with summaries, difficulty stars, English knowledge points and filters", description: "Filter by knowledge point, grade, mastery and A/B paper to quickly find the questions you need to review." },
  upload: { title: "Photo and text input", alt: "Photo upload, manual input, direct entry and clipboard paste on the home page", description: "Upload or drag photos, paste screenshots, or type the question. Turn on review before import to check results before saving." },
  "svg-animation": { title: "SVG animated explanation", alt: "English SVG explanation of a hexagon coloring problem, with an English counting table and player controls", description: "The solution becomes a step-by-step SVG animation with pause, seeking, replay and full screen, so you can follow at your own pace." },
  "mastery-history": { title: "Answer history and mastery", alt: "An English variant question, sample answer history and a mastery estimate", description: "Results from similar-question practice and exams are kept under the original question. Mastery is estimated from practice to guide your next review." },
  "exam-print": { title: "Exam print preview", alt: "Print preview of an English demo exam with source IDs, answer page toggle, download and print options", description: "Build practice exams around weak knowledge points, include an answer page, download HTML, or print and save as PDF from the browser." },
  "error-stats": { title: "Statistics", alt: "Charts of mistake count, mastered count, subject distribution and monthly trend", description: "Review mistake count, mastery rate, subject distribution and monthly trend; practice statistics also show accuracy and distribution." },
} : {
  notebook: { title: "我的错题本", alt: "错题卡片展示题目摘要、难度星级与知识点，并支持多维度筛选", description: "按知识点、年级、掌握情况和 A/B 卷筛选，把需要复习的题目快速找出来。" },
  upload: { title: "拍照与文字录入", alt: "首页的拍照上传、手动输入、直接录入和剪贴板粘贴入口", description: "拍照上传、拖拽图片、粘贴截图，也能输入文字。可以开启导入前人工确认，先校对再保存。" },
  "svg-animation": { title: "SVG 动画讲解", alt: "六边形染色题的 SVG 动画讲解、递推计数表与播放控制", description: "把解题过程变成分步骤的 SVG 动画，支持暂停、拖动进度、重播和全屏，按自己的节奏理解。" },
  "mastery-history": { title: "作答历史与掌握情况", alt: "题目下汇总变式题、作答历史和 AI 掌握概率评估", description: "原题下保留举一反三和试卷作答结果。根据实际练习记录评估掌握概率，辅助决定下一次复习。" },
  "exam-print": { title: "试卷打印预览", alt: "真实试卷的打印预览，包含来源 ID、答案页开关、下载与打印入口", description: "围绕薄弱知识点生成练习卷，可选答案页、下载 HTML，或通过浏览器打印、保存为 PDF。" },
  "error-stats": { title: "学习统计", alt: "错题数量、已掌握数量、科目分布和月度趋势图表", description: "回看错题数量、掌握率、学科分布与月度趋势；练习统计中还可以查看正确率和练习分布。" },
};

const previewTabs = [...document.querySelectorAll("[data-preview]")];
let currentPreview = "notebook";
const previewImage = document.getElementById("preview-image");
const previewPanel = document.getElementById("preview-panel");

function selectPreview(key, moveFocus = false) {
  const item = screenshots[key];
  if (!item) return;
  currentPreview = key;
  for (const tab of previewTabs) {
    const selected = tab.dataset.preview === key;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && moveFocus) tab.focus();
  }
  previewImage.src = new URL(`images/${imageDir}${key}.webp`, document.querySelector('script[src$="site.js"]').src).href;
  previewImage.alt = item.alt;
  document.getElementById("preview-window-title").textContent = item.title;
  document.getElementById("preview-description").textContent = item.description;
  document.getElementById("preview-image-button").setAttribute("aria-label", text.enlarge(item.title));
  previewPanel.setAttribute("aria-labelledby", `tab-${key}`);
}

// 标签支持方向键、Home 与 End，鼠标和键盘具有相同的操作能力。
function bindTabKeys(tabs, activate) {
  tabs.forEach((tab, index) => {
    tab.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      activate(tabs[next]);
      tabs[next].focus();
    });
  });
}

previewTabs.forEach((tab) => tab.addEventListener("click", () => selectPreview(tab.dataset.preview)));
bindTabKeys(previewTabs, (tab) => selectPreview(tab.dataset.preview));

const dialog = document.getElementById("image-dialog");
const dialogImage = document.getElementById("dialog-image");

function showImage(key) {
  const item = screenshots[key];
  if (!item) return;
  dialogImage.src = new URL(`images/${imageDir}${key}.webp`, document.querySelector('script[src$="site.js"]').src).href;
  dialogImage.alt = item.alt;
  document.getElementById("dialog-title").textContent = item.title;
  document.getElementById("dialog-description").textContent = item.description;
  dialog.showModal();
  document.body.classList.add("dialog-open");
}

document.querySelectorAll("[data-image]").forEach((button) => button.addEventListener("click", () => showImage(button.dataset.image)));
document.getElementById("expand-preview").addEventListener("click", () => showImage(currentPreview));
document.getElementById("preview-image-button").addEventListener("click", () => showImage(currentPreview));
document.getElementById("close-dialog").addEventListener("click", () => dialog.close());
dialog.addEventListener("close", () => document.body.classList.remove("dialog-open"));
dialog.addEventListener("click", (event) => {
  // 仅点击弹窗外部的遮罩时关闭，避免点击图片或说明意外退出。
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});

const installTabs = [...document.querySelectorAll("[data-install]")];
function selectInstall(tab) {
  installTabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(`install-panel-${item.dataset.install}`).hidden = !selected;
  });
}
installTabs.forEach((tab) => tab.addEventListener("click", () => selectInstall(tab)));
bindTabKeys(installTabs, selectInstall);

let toastTimer;
function showToast(message) {
  const toast = document.getElementById("toast");
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, 3500);
}

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const code = document.getElementById(button.dataset.copy);
    try {
      await navigator.clipboard.writeText(code.textContent);
      showToast(text.copied);
    } catch {
      // 权限受限或非安全上下文时选中原文，保留可靠的手动复制方式。
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(code);
      selection.removeAllRanges();
      selection.addRange(range);
      showToast(text.copyManually);
    }
  });
});

const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.getElementById("mobile-nav");
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

// 未启用脚本时仍显示主体内容；增强功能就绪后才跟踪导航高亮。
if ("IntersectionObserver" in window) {
  // 只跟踪站内锚点，外部链接（如在线演示）没有对应章节。
  const navLinks = [...document.querySelectorAll('.desktop-nav a[href^="#"]')];
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      navLinks.forEach((link) => {
        const active = link.hash === `#${entry.target.id}`;
        link.classList.toggle("active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }
  }, { rootMargin: "-15% 0px -65% 0px", threshold: 0 });
  navLinks.forEach((link) => {
    const section = document.querySelector(link.hash);
    if (section) observer.observe(section);
  });
}
