"use strict";

// 首页下载按钮与下载页共用：识别访客的系统与架构，从 GitHub 最新正式版中挑选对应安装包。
// 中国大陆访客会自动测速可用的第三方线路；未启用脚本或 GitHub 接口不可用时保持 Releases 默认链接。
(() => {
  const RELEASE_API = "https://api.github.com/repos/margrop/wrong-notebook/releases/latest";
  const CACHE_KEY = "wn-latest-release";
  const CACHE_MS = 10 * 60 * 1000;
  const GEO_CACHE_KEY = "wn-download-geo";
  const GEO_CACHE_MS = 30 * 60 * 1000;
  const SOURCE_CACHE_KEY = "wn-download-auto-source";
  const SOURCE_CACHE_MS = 10 * 60 * 1000;
  const SOURCE_PREFERENCE_KEY = "wn-download-source-preference";
  const GEO_TIMEOUT_MS = 3500;
  const PROXY_TIMEOUT_MS = 5000;
  const PROBE_TARGET = "https://raw.githubusercontent.com/margrop/wrong-notebook/main/LICENSE";
  const PROBE_MARKER = "MIT License";
  const isEnglish = document.documentElement.lang.startsWith("en");

  const SOURCES = {
    auto: { id: "auto", prefix: "" },
    github: { id: "github", prefix: "" },
    ghfast: { id: "ghfast", prefix: "https://ghfast.top/" },
    ghproxy: { id: "ghproxy", prefix: "https://gh-proxy.net/" },
    llkk: { id: "llkk", prefix: "https://gs.llkk.cc/" },
  };
  const PROXY_SOURCE_IDS = ["ghfast", "ghproxy", "llkk"];

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
    "synology-x86_64": /^WrongNotebook-Synology-.+-x86_64\.spk$/,
    "synology-arm64": /^WrongNotebook-Synology-.+-arm64\.spk$/,
    "qnap-x86_64": /^WrongNotebook-QNAP-.+-x86_64\.qpkg$/,
    "qnap-arm64": /^WrongNotebook-QNAP-.+-arm64\.qpkg$/,
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
    sources: {
      auto: "Auto (China: test accelerators)",
      github: "GitHub direct",
      ghfast: "ghfast.top",
      ghproxy: "gh-proxy.net",
      llkk: "gs.llkk.cc",
    },
    sourceStatus: {
      initial: "Detecting your region and testing download routes…",
      manual: (name) => "Selected manually: " + name + ".",
      china: (name, latency) => "China mainland detected. Using " + name + (latency ? " (about " + latency + " ms)" : "") + ".",
      outside: "Outside mainland China detected. Using GitHub direct.",
      unknown: "Could not identify the region. Using GitHub direct.",
      fallback: "No accelerator passed the availability check. Using GitHub direct.",
    },
    detected: (system) => "Detected: " + system,
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
    sources: {
      auto: "自动选择（中国大陆自动测速）",
      github: "GitHub 原版",
      ghfast: "ghfast.top",
      ghproxy: "gh-proxy.net",
      llkk: "gs.llkk.cc",
    },
    sourceStatus: {
      initial: "正在识别地区并测速下载线路…",
      manual: (name) => "已手动选择：" + name + "。",
      china: (name, latency) => "已识别为中国大陆，自动使用 " + name + (latency ? "（约 " + latency + " ms）" : "") + "。",
      outside: "已识别为非中国大陆地区，使用 GitHub 原版。",
      unknown: "暂时无法识别地区，使用 GitHub 原版。",
      fallback: "加速线路均未通过可用性检查，已回退 GitHub 原版。",
    },
    detected: (system) => "检测到：" + system,
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

  let selectedSourceId = "auto";
  let activeSourceId = "github";
  let sourceDecision = 0;

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

  function readStorage(storage, key) {
    try {
      return JSON.parse(storage.getItem(key) || "null");
    } catch {
      return null;
    }
  }

  function writeStorage(storage, key, value) {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch {
      // 隐私模式或存储空间不足时不影响下载。
    }
  }

  function readCache() {
    const cached = readStorage(sessionStorage, CACHE_KEY);
    return cached && Date.now() - cached.time < CACHE_MS ? cached.release : null;
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
    writeStorage(sessionStorage, CACHE_KEY, { time: Date.now(), release });
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

  function sourceName(id) {
    return text.sources[id] || text.sources.github;
  }

  function hasSource(id) {
    return typeof id === "string" && Object.prototype.hasOwnProperty.call(SOURCES, id);
  }

  function setSourceStatus(value) {
    setText("[data-download-source-status]", value);
  }

  function syncSourceControls() {
    document.querySelectorAll("[data-download-source]").forEach((select) => {
      select.value = selectedSourceId;
    });
  }

  function isGithubUrl(value) {
    try {
      const url = new URL(value, document.baseURI);
      return url.protocol === "https:" && url.hostname === "github.com";
    } catch {
      return false;
    }
  }

  function buildSourceUrl(sourceId, directUrl) {
    const source = hasSource(sourceId) ? SOURCES[sourceId] : SOURCES.github;
    return source.prefix && isGithubUrl(directUrl) ? source.prefix + directUrl : directUrl;
  }

  function applyDownloadSource(sourceId) {
    activeSourceId = hasSource(sourceId) && sourceId !== "auto" ? sourceId : "github";
    document.querySelectorAll("[data-asset], [data-download-primary]").forEach((link) => {
      const directUrl = link.dataset.directUrl;
      if (!directUrl) return;
      link.href = buildSourceUrl(activeSourceId, directUrl);
      link.dataset.downloadSource = activeSourceId;
    });
  }

  function readSourcePreference() {
    try {
      const value = localStorage.getItem(SOURCE_PREFERENCE_KEY);
      return hasSource(value) ? value : "auto";
    } catch {
      return "auto";
    }
  }

  function saveSourcePreference(value) {
    try {
      localStorage.setItem(SOURCE_PREFERENCE_KEY, value);
    } catch {
      // 无法持久化时只在当前页面生效。
    }
  }

  function readGeoCache() {
    const cached = readStorage(sessionStorage, GEO_CACHE_KEY);
    return cached && Date.now() - cached.time < GEO_CACHE_MS ? cached : null;
  }

  async function fetchJsonWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Geo-IP " + response.status);
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  async function detectCountry() {
    const cached = readGeoCache();
    if (cached) return cached;
    // 依次尝试，避免一次打开页面同时把访客 IP 发给多个服务。
    const endpoints = [
      { url: "https://ipwho.is/", getCode: (data) => data && data.success !== false && data.country_code },
      { url: "https://ipinfo.io/json", getCode: (data) => data && data.country },
    ];
    for (const endpoint of endpoints) {
      try {
        const data = await fetchJsonWithTimeout(endpoint.url, GEO_TIMEOUT_MS);
        const countryCode = String(endpoint.getCode(data) || "").trim().toUpperCase();
        if (!countryCode) continue;
        const result = { time: Date.now(), countryCode, isChina: countryCode === "CN" };
        writeStorage(sessionStorage, GEO_CACHE_KEY, result);
        return result;
      } catch {
        // 当前服务不可用时再试备用服务；全部失败由调用方回退 GitHub 原版。
      }
    }
    return null;
  }

  async function probeSource(sourceId) {
    const source = SOURCES[sourceId];
    const started = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);
    try {
      // 使用仓库内的小型纯文本文件，并要求 CORS 与内容标记，避免把打不开或被劫持的线路判为可用。
      const response = await fetch(source.prefix + PROBE_TARGET, {
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        redirect: "follow",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Proxy " + response.status);
      const body = await response.text();
      if (!body.trimStart().startsWith(PROBE_MARKER)) throw new Error("Proxy probe content mismatch");
      const ended = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
      return { id: sourceId, latency: Math.max(1, Math.round(ended - started)) };
    } finally {
      clearTimeout(timeout);
    }
  }

  async function chooseChinaSource() {
    const cached = readStorage(sessionStorage, SOURCE_CACHE_KEY);
    if (cached && Date.now() - cached.time < SOURCE_CACHE_MS && hasSource(cached.sourceId) && cached.sourceId !== "auto" && cached.sourceId !== "github") {
      return cached;
    }
    const results = await Promise.allSettled(PROXY_SOURCE_IDS.map((id) => probeSource(id)));
    const valid = results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value)
      .sort((a, b) => a.latency - b.latency);
    if (!valid.length) return null;
    const chosen = { time: Date.now(), sourceId: valid[0].id, latency: valid[0].latency };
    writeStorage(sessionStorage, SOURCE_CACHE_KEY, chosen);
    return chosen;
  }

  async function resolveAutoSource(token) {
    setSourceStatus(text.sourceStatus.initial);
    const geo = await detectCountry();
    if (token !== sourceDecision || selectedSourceId !== "auto") return;
    if (!geo) {
      applyDownloadSource("github");
      setSourceStatus(text.sourceStatus.unknown);
      return;
    }
    if (!geo.isChina) {
      applyDownloadSource("github");
      setSourceStatus(text.sourceStatus.outside);
      return;
    }
    const chosen = await chooseChinaSource();
    if (token !== sourceDecision || selectedSourceId !== "auto") return;
    if (!chosen) {
      applyDownloadSource("github");
      setSourceStatus(text.sourceStatus.fallback);
      return;
    }
    applyDownloadSource(chosen.sourceId);
    setSourceStatus(text.sourceStatus.china(sourceName(chosen.sourceId), chosen.latency));
  }

  function startSourceSelection() {
    selectedSourceId = readSourcePreference();
    syncSourceControls();
    document.querySelectorAll("[data-download-source]").forEach((select) => {
      select.addEventListener("change", () => {
        const next = hasSource(select.value) ? select.value : "auto";
        selectedSourceId = next;
        saveSourcePreference(next);
        syncSourceControls();
        sourceDecision += 1;
        if (next === "auto") {
          applyDownloadSource("github");
          void resolveAutoSource(sourceDecision);
        } else {
          applyDownloadSource(next);
          setSourceStatus(text.sourceStatus.manual(sourceName(next)));
        }
      });
    });
    if (selectedSourceId === "auto") {
      applyDownloadSource("github");
      sourceDecision += 1;
      void resolveAutoSource(sourceDecision);
    } else {
      applyDownloadSource(selectedSourceId);
      setSourceStatus(text.sourceStatus.manual(sourceName(selectedSourceId)));
    }
  }

  // 把页面上所有 data-asset 按钮指向最新版本的实际文件，并显示文件大小与文件名
  function fillAssets(release) {
    document.querySelectorAll("[data-asset]").forEach((link) => {
      const asset = findAsset(release, link.dataset.asset);
      if (!asset) return;
      link.dataset.directUrl = asset.url;
      link.href = buildSourceUrl(activeSourceId, asset.url);
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
        link.dataset.directUrl = asset.url;
        link.href = buildSourceUrl(activeSourceId, asset.url);
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
        link.dataset.directUrl = asset.url;
        link.href = buildSourceUrl(activeSourceId, asset.url);
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
    startSourceSelection();
    const systemPromise = detectSystem();
    let release = null;
    try {
      release = await loadRelease();
      fillAssets(release);
    } catch {
      setText("[data-release-version]", text.releaseFallback);
    }
    showSystem(await systemPromise, release);
    // showSystem 可能刚为首页主按钮补上实际文件地址，再应用一次当前线路。
    applyDownloadSource(activeSourceId);
  }

  void init();
})();
