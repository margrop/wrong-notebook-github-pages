# 智能错题本 · 项目官网

用于介绍和宣传 [margrop/wrong-notebook](https://github.com/margrop/wrong-notebook) 的官方网站，提供简体中文（首页）和英文（`en/`）两个版本。基于相邻 `../wrong-notebook` 项目的现有功能与真实截图制作。

官网地址：**<https://blog.margrop.net/wrong-notebook-github-pages/>**，英文版 <https://blog.margrop.net/wrong-notebook-github-pages/en/>（GitHub Pages 继承账号现有的自定义域名。）

纯 HTML、CSS 与原生 JavaScript，无需 npm 安装或前端构建工具，可部署到 GitHub Pages 的根域名、项目子路径及其他静态托管服务。

## 本地预览

需要 Python 3.10+：

```bash
python3 scripts/build.py
python3 scripts/check_site.py dist
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

打开 <http://127.0.0.1:4173>。也可在项目根目录直接启动 HTTP 服务预览源码，修改后刷新页面即可。

## 发布到 GitHub Pages

1. 将本目录作为独立仓库上传到 GitHub，主分支使用 `main` 或 `master`。
2. 进入仓库 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。
3. 推送主分支，或在 **Actions → 发布 GitHub Pages 官网 → Run workflow** 手动运行。
4. 工作流会生成 `dist/`、检查站内链接与资源，再发布。实际访问地址以工作流的 `github-pages` 环境链接为准。

工作流也会对 Pull Request 执行检查，但不会发布。无需部署密钥或第三方服务。Pages 发布时会使用实际站点地址自动生成 canonical、`og:url` 和分享图的完整 HTTPS 地址。自定义域名可在 Pages 设置中配置，随后重新运行工作流。

部署到其他静态服务时，可以通过 `SITE_URL=https://example.com/project python3 scripts/build.py` 生成对应站点元数据。该参数不影响资源的相对路径，仍然兼容项目子目录。

## 页面与交互

- 首页主视觉、四步学习流程、功能卡片、六组真实界面预览。
- 截图标签支持方向键、Home / End，图片可点击放大，Esc 关闭。
- 在线演示站入口与演示账号说明。
- Docker / 安装包（Windows、macOS、Linux、飞牛OS）/ npm / 本地源码四种部署方式切换，命令复制与受限环境下的手动复制回退。
- 常见问题折叠面板、手机导航、当前章节高亮。
- 手机、平板与桌面布局，减少动态效果偏好、语义化标签与键盘操作。
- 页头和页脚可切换中英文，发布时自动生成 `hreflang` 语言版本声明；两个页面共用样式与脚本，脚本按 `<html lang>` 选择提示文字。
- 本地图标、WebP 截图、分享图、搜索引擎描述，无外部字体、统计或 CDN 脚本。

## 文件结构

```text
index.html                  中文页面内容与语义结构
en/index.html               英文页面（资源以 ../assets/ 引用）
assets/styles.css           布局、视觉与响应式样式
assets/site.js              预览、弹窗、标签、导航与复制
assets/images/              已脱敏的真实界面与分享图
assets/icons/               原项目应用图标
scripts/build.py            生成 dist 发布文件
scripts/check_site.py       资源、锚点、ARIA 与子路径检查
.github/workflows/pages.yml GitHub Pages 检查及发布
```

## 内容与素材维护

功能说明以原项目的 README 和实现为依据。修改页面内容时，中文和英文页面需同步更新。更新页面时，先核对实际能力，避免把示意题目、AI 评估或界面中的个人统计表述为产品效果承诺。

截图于 2026-10-22 采集于原应用，均为浅色模式；中文页使用中文界面截图，英文页使用 `assets/images/en/` 下以英文题目、答案、解析、知识点、动画和试卷内容重新拍摄的截图。英文用户及作答记录为独立的演示数据。本官网将 PNG 转为 WebP，并复用了应用图标。具体来源与更新方式见 [ASSETS.md](ASSETS.md)。

项目应用基于 [wttwins/wrong-notebook](https://github.com/wttwins/wrong-notebook) 扩展，官网页脚保留了上游致谢。
