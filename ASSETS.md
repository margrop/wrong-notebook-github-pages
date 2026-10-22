# 素材来源

官网根据 `../wrong-notebook` 当前 `main` 分支制作；配图于 2026-10-22 随原项目 `doc/screenshots/` 更新。英文版使用英文演示题目重新截图，包含英文解析、知识点、动画文字、作答记录和试卷。

## 真实应用截图

中文页素材来源为原项目 `doc/screenshots/` 的对应 PNG，英文页（`assets/images/en/`）来源为 `doc/screenshots/en/` 的同名英文 PNG。均为浅色模式，不包含实例访问地址或登录凭据。中文截图的用户名替换为「学生」；英文截图使用独立的 `Student` 演示用户，题目、练习历史、统计和掌握估计均为演示数据。官网用 `cwebp -q 88` 转换为 WebP，保持画面内容与尺寸。

英文内容素材见原项目 `doc/screenshots/en/demo-questions.json` 与 `hexagon-coloring.svg`。英文标签用于演示；应用自带的知识点库仍遵循中国 K-12 课程体系。

| 官网素材（英文页为 `assets/images/en/` 同名文件） | 原项目素材（英文为 `doc/screenshots/en/`） | 展示用途 |
| --- | --- | --- |
| `assets/images/notebook.webp` | `doc/screenshots/notebook.png` | 首页及错题管理 |
| `assets/images/upload.webp` | `doc/screenshots/upload.png` | 拍照、文字与直接录入 |
| `assets/images/svg-animation.webp` | `doc/screenshots/svg-animation.png` | 分步骤动画讲解 |
| `assets/images/mastery-history.webp` | `doc/screenshots/mastery-history.png` | 作答历史与掌握情况 |
| `assets/images/exam-print.webp` | `doc/screenshots/exam-print.png` | 打印预览与导出 |
| `assets/images/error-stats.webp` | `doc/screenshots/error-stats.png` | 错题统计 |

更新时使用浅色模式，等待图表和过渡动画完成，重新核对截图中的用户名、邮箱、内部地址与凭据，并同步替代文本、说明及对应原项目功能。英文版须检查题干、答案、解析、知识点、动画内嵌文字、试卷标题和变式题均为英文，不能仅切换界面语言。涉及两种语言的功能变化同步更新两套素材；仅修正某种语言的内容时更新对应素材，并重新生成该语言的分享图。

## 其他素材

- `assets/icons/app-icon.png`：来自原项目 `public/icons/icon.png`，缩放至 128 × 128。
- `assets/images/social-preview.png` / `assets/images/en/social-preview.png`：中英文分享图（1200 × 630），由官网文案、配色与对应语言的浅色错题本截图用 Pillow 合成。
- 页面图标、线条、纸张、示意卡片均为本地 HTML / CSS / SVG；举一反三题目明确标记为功能示意。
- 页面使用系统字体，无需下载网络字体。
