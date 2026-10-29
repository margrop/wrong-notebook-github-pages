"use strict";

// 首页下载按钮与下载页共用：识别访客的系统与架构，从 GitHub 最新正式版中挑选对应安装包。
// 未启用脚本或 GitHub 接口不可用时，所有按钮保持指向 Releases 页面的默认链接。
(() => {
  const RELEASE_API = "https://api.github.com/repos/margrop/wrong-notebook/releases/latest";
  const CACHE_KEY = "wn-latest-release";
  const CACHE_MS = 10 * 60 * 1000;
  const isEnglish = document.documentElement.lang.startsWith("en");

  // 安装包文件名带版本号，按版本无关的规则匹配
  const ASSETS = {
    "win-setup": /^WrongNotebook-Win-Setup-.+-x64\.exe$/,
    "win-portable": /^WrongNotebook-Win-Portable-.+-x64\.exe$/,
    "mac-arm64-dmg": /^WrongNotebook-Mac-.+-arm64\.dmg$/,
    "mac-arm64-zip": /^WrongNotebook-Mac-.+-arm64\.zip$/,
    "mac-x64-dmg": /^WrongNotebook-Mac-.+-x64\.dmg$/,
    "mac-x64-zip": /^WrongNotebook-Mac-.+-x64\.zip$/,
    "linux-x64-appimage": /^WrongNotebook-Linux-.+-x86_64\.AppImage$/,
    "linux-x64-deb": /^WrongNotebook-Linux-.+-amd64\.deb$/,
    "linux-arm64-appimage": /^WrongNotebook-Linux-.+-arm64\.AppImage$/,
    "linux-arm64-deb": /^WrongNotebook-Linux-.+-arm64\.deb$/,
    "android-phone": /^WrongNotebook-Android-Phone-.+\.apk$/,
    "android-tablet": /^WrongNotebook-Android-Tablet-.+\.apk$/,
    "android-client-phone": /^WrongNotebook-Android-Client-Phone-.+\.apk$/,
    "android-client-tablet": /^WrongNotebook-Android-Client-Tablet-.+\.apk$/,
    "fnos-x86": /^WrongNotebook-FnOS-.+-x86\.fpk$/,
    "fnos-arm": /^WrongNotebook-FnOS-.+-arm\.fpk$/,
    "npm-tgz": /^wrong-notebook-.+\.tgz$/,
    checksums: /^SHA256SUMS\.txt$/,
  };

  const text = isEnglish ? {
    systems: {
      windows: "Windows (x64)",
      "windows-arm": "Windows on ARM (runs the x64 build)",
      "mac-arm64": "macOS (Apple silicon)",
      "mac-x64": "macOS (Intel)",
      "linux-x64": "Linux (x86_64)",
      "linux-arm64": "Linux (arm64)",
      "android-phone": "Android phone",
      "android-tablet": "Android tablet",
      ios: "iPhone / iPad",
      unknown: "your device",
    },
    download: {
      windows: "Download for Windows",
      "windows-arm": "Download for Windows (x64)",
      "mac-arm64": "Download for macOS · Apple silicon",
      "mac-x64": "Download for macOS · Intel",
      "linux-x64": "Download for Linux · x86_64",
      "linux-arm64": "Download for Linux · arm64",
      "android-phone": "Download for Android phone",
      "android-tablet": "Download for Android tablet",
    },
    detected: (system) => `Detected: ${system}`,
    noPackage: "No installer for iPhone / iPad yet. Open the demo in Safari or add your own server to the Home Screen.",
    unknownSystem: "We could not detect your system. Choose a package below.",
    macGuess: "Detected from the graphics chip. On an Intel Mac, choose the Intel build below.",
    version: (version, date) => `Latest release ${version} · ${date}`,
    allDownloads: "All platforms",
    releaseFallback: "Could not reach GitHub just now. The buttons open the Releases page instead.",
    date: (value) => new Date(value).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" }),
  } : {
    systems: {
      windows: "Windows（x64）",
      "windows-arm": "Windows ARM（使用 x64 版本）",
      "mac-arm64": "macOS（Apple 芯片）",
      "mac-x64": "macOS（Intel 芯片）",
      "linux-x64": "Linux（x86_64）",
      "linux-arm64": "Linux（arm64）",
      "android-phone": "安卓手机",
      "android-tablet": "安卓平板",
      ios: "iPhone / iPad",
      unknown: "你的设备",
    },
    download: {
      windows: "下载 Windows 版",
      "windows-arm": "下载 Windows 版（x64）",
      "mac-arm64": "下载 macOS 版 · Apple 芯片",
      "mac-x64": "下载 macOS 版 · Intel 芯片",
      "linux-x64": "下载 Linux 版 · x86_64",
      "linux-arm64": "下载 Linux 版 · arm64",
      "android-phone": "下载安卓手机版",
      "android-tablet": "下载安卓平板版",
    },
    detected: (system) => `检测到：${system}`,
    noPackage: "iPhone / iPad 暂无安装包，可用 Safari 打开在线演示或自己的服务器，并添加到主屏幕。",
    unknownSystem: "未能识别你的系统，请在下方选择需要的安装包。",
    macGuess: "根据显卡信息判断；如果是 Intel 芯片的 Mac，请在下方选择 Intel 版本。",
    version: (version, date) => `最新正式版 ${version} · ${date}`,
    allDownloads: "全部系统与架构",
    releaseFallback: "暂时无法连接 GitHub，按钮将打开 Releases 页面。",
    date: (value) => new Date(value).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" }),
  };

  // 每种系统推荐的安装包；Windows ARM 可通过系统自带的转译运行 x64 版本
  const RECOMMENDED = {
    windows: "win-setup",
    "windows-arm": "win-setup",
    "mac-arm64": "mac-arm64-dmg",
    "mac-x64": "mac-x64-dmg",
    "linux-x64": "linux-x64-appimage",
    "linux-arm64": "linux-arm64-appimage",
    "android-phone": "android-phone",
    "android-tablet": "android-tablet",
  };

  // 卡片按平台分组，用于在下载页高亮访客所用的平台
  const CARD_OF = {
    windows: "windows", "windows-arm": "windows", "mac-arm64": "mac", "mac-x64": "mac",
    "linux-x64": "linux", "linux-arm64": "linux", "android-phone": "android", "android-tablet": "android", ios: "ios",
  };

  // Safari 与 Firefox 不提供 CPU 架构，按 WebGL 显卡名称区分 Intel 与 Apple 芯片的 Mac；无法判断时按 Apple 芯片处理
  function macArchFromGpu() {
    try {
      const gl = document.createElement("canvas").getContext("webgl");
      if (!gl) return { arch: "arm64", guessed: true };
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
      if (/intel|amd|radeon|nvidia/i.test(renderer)) return { arch: "x64", guessed: false };
      if (/apple m\d/i.test(renderer)) return { arch: "arm64", guessed: false };
    } catch {
      // 显卡信息不可用时按默认值处理
    }
    return { arch: "arm64", guessed: true };
  }

  async function detectSystem() {
    const ua = navigator.userAgent;
    const uaData = navigator.userAgentData;
    let hints = {};
    if (uaData && uaData.getHighEntropyValues) {
      try {
        hints = await uaData.getHighEntropyValues(["architecture", "bitness", "platform"]);
      } catch {
        // 浏览器拒绝提供高精度信息时退回 User-Agent
      }
    }
    const platform = `${hints.platform || (uaData && uaData.platform) || navigator.platform || ""}`.toLowerCase();
    const arm = hints.architecture ? hints.architecture === "arm" : null;
    // iPadOS 的 Safari 默认伪装成 Mac，靠触控点数区分
    if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return { key: "ios" };
    if (/android/i.test(ua)) return { key: /mobile/i.test(ua) ? "android-phone" : "android-tablet" };
    // 桌面系统优先按 User-Agent 判断，navigator.platform 作为补充
    const os = /windows/i.test(ua) ? "windows" : /mac os x/i.test(ua) ? "mac" : /linux|x11|cros/i.test(ua) ? "linux"
      : platform.includes("win") ? "windows" : platform.includes("mac") ? "mac" : platform.includes("linux") ? "linux" : "unknown";
    if (os === "windows") return { key: arm ? "windows-arm" : "windows" };
    if (os === "mac") {
      if (arm !== null) return { key: arm ? "mac-arm64" : "mac-x64" };
      const { arch, guessed } = macArchFromGpu();
      return { key: `mac-${arch}`, guessed };
    }
    if (os === "linux") {
      const arm64 = arm !== null ? arm : /aarch64|arm64|armv8/i.test(`${ua} ${navigator.platform}`);
      return { key: arm64 ? "linux-arm64" : "linux-x64" };
    }
    return { key: "unknown" };
  }

  function readCache() {
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
      return cached && Date.now() - cached.time < CACHE_MS ? cached.release : null;
    } catch {
      return null;
    }
  }

  async function loadRelease() {
    const cached = readCache();
    if (cached) return cached;
    const response = await fetch(RELEASE_API, { headers: { Accept: "application/vnd.github+json" } });
    if (!response.ok) throw new Error(`GitHub API ${response.status}`);
    const data = await response.json();
    const release = {
      version: String(data.tag_name || "").replace(/^v/, ""),
      date: data.published_at,
      url: data.html_url,
      assets: (data.assets || []).map((asset) => ({ name: asset.name, url: asset.browser_download_url, size: asset.size })),
    };
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), release }));
    } catch {
      // 隐私模式等无法缓存时每次重新请求
    }
    return release;
  }

  function findAsset(release, id) {
    const pattern = ASSETS[id];
    return pattern ? release.assets.find((asset) => pattern.test(asset.name)) : undefined;
  }

  function formatSize(bytes) {
    if (!bytes) return "";
    return bytes >= 1024 * 1024 ? `${Math.round(bytes / 1024 / 1024)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach((element) => { element.textContent = value; });
  }

  // 把页面上所有 data-asset 按钮指向最新版本的实际文件，并显示文件大小与文件名
  function fillAssets(release) {
    document.querySelectorAll("[data-asset]").forEach((link) => {
      const asset = findAsset(release, link.dataset.asset);
      if (!asset) return;
      link.href = asset.url;
      link.title = asset.name;
      const size = link.querySelector("[data-size]");
      if (size) size.textContent = formatSize(asset.size);
    });
    document.querySelectorAll("[data-release-link]").forEach((link) => { link.href = release.url; });
    setText("[data-release-version]", text.version(release.version, text.date(release.date)));
  }

  function showSystem(system, release) {
    const name = text.systems[system.key];
    const assetId = RECOMMENDED[system.key];
    const asset = assetId && release ? findAsset(release, assetId) : undefined;

    // 首页主按钮：识别到可用安装包时直接下载，否则保持指向下载页
    document.querySelectorAll("[data-download-primary]").forEach((link) => {
      const label = link.querySelector("[data-download-label]");
      if (!assetId) return;
      if (label) label.textContent = text.download[system.key];
      if (asset) {
        link.href = asset.url;
        link.title = asset.name;
      }
    });

    setText("[data-detected-system]", system.key === "unknown" ? text.unknownSystem : text.detected(name));
    document.querySelectorAll("[data-detected-note]").forEach((element) => {
      const note = system.key === "ios" ? text.noPackage : system.guessed ? text.macGuess : "";
      element.textContent = note;
      element.hidden = !note;
    });

    // 下载页：推荐按钮与高亮对应平台卡片
    document.querySelectorAll("[data-recommended]").forEach((link) => {
      link.hidden = !assetId;
      if (!assetId) return;
      link.dataset.asset = assetId;
      const label = link.querySelector("[data-download-label]");
      if (label) label.textContent = text.download[system.key];
      if (asset) {
        link.href = asset.url;
        link.title = asset.name;
        const size = link.querySelector("[data-size]");
        if (size) size.textContent = formatSize(asset.size);
      }
    });
    const card = document.querySelector(`[data-platform="${CARD_OF[system.key]}"]`);
    if (card) card.classList.add("is-detected");
    document.querySelectorAll(`[data-variant="${system.key}"]`).forEach((element) => element.classList.add("is-detected"));
  }

  async function init() {
    if (!document.querySelector("[data-asset], [data-download-primary], [data-recommended]")) return;
    const systemPromise = detectSystem();
    let release = null;
    try {
      release = await loadRelease();
      fillAssets(release);
    } catch {
      setText("[data-release-version]", text.releaseFallback);
    }
    showSystem(await systemPromise, release);
  }

  void init();
})();
