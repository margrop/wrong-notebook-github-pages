#!/usr/bin/env python3
"""生成可部署到 GitHub Pages 的静态文件，不需要安装任何依赖。"""

from pathlib import Path
from html import escape
from urllib.parse import urlsplit
import os
import re
import shutil

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "dist"

# 发布的页面：(源文件, 相对站点根目录的路径, 语言, 页面组)；同组页面互为语言版本
PAGES = [
    ("index.html", "", "zh-CN", "home"),
    ("en/index.html", "en/", "en", "home"),
    ("download/index.html", "download/", "zh-CN", "download"),
    ("en/download/index.html", "en/download/", "en", "download"),
]


def render(source: str, path: str, group: str, site_url: str) -> str:
    html = (ROOT / source).read_text(encoding="utf-8")
    if not site_url:
        return html
    page_url = escape(f"{site_url}/{path}", quote=True)
    # 分享图按语言区分：中文 assets/images/，英文 assets/images/en/
    html = re.sub(
        r'content="(?:\./|(?:\.\./)+)assets/images/((?:en/)?social-preview\.png)"',
        lambda m: f'content="{escape(site_url + "/assets/images/" + m.group(1), quote=True)}"',
        html,
    )
    # 搜索引擎要求语言版本互相声明完整地址，x-default 指向同组的中文页面。
    versions = [(target, lang) for _, target, lang, page_group in PAGES if page_group == group]
    alternates = [f'<link rel="alternate" hreflang="{lang}" href="{escape(f"{site_url}/{target}", quote=True)}">' for target, lang in versions]
    default = next(target for target, lang in versions if lang == "zh-CN")
    alternates.append(f'<link rel="alternate" hreflang="x-default" href="{escape(f"{site_url}/{default}", quote=True)}">')
    metadata = [f'<link rel="canonical" href="{page_url}">', f'<meta property="og:url" content="{page_url}">', *alternates]
    return html.replace("<!-- deployment-metadata -->", "\n    ".join(metadata))


def main() -> None:
    site_url = os.environ.get("SITE_URL", "").strip().rstrip("/")
    if site_url:
        parsed = urlsplit(site_url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc or parsed.query or parsed.fragment:
            raise SystemExit("SITE_URL 必须是完整站点地址，可带项目子路径，不能带查询参数或锚点。")
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir()
    for source, path, _, group in PAGES:
        target = OUTPUT / source
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(render(source, path, group, site_url), encoding="utf-8")
    # 仅复制官网资源；原应用的源码、数据库与配置不会进入发布包。
    shutil.copytree(ROOT / "assets", OUTPUT / "assets", dirs_exist_ok=True)
    (OUTPUT / ".nojekyll").touch()
    files = [file for file in OUTPUT.rglob("*") if file.is_file()]
    size = sum(file.stat().st_size for file in files)
    print(f"已生成 {OUTPUT.name}/：{len(files)} 个文件，{size / 1024:.1f} KiB")

if __name__ == "__main__":
    main()
