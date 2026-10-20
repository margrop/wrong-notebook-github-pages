#!/usr/bin/env python3
"""生成可部署到 GitHub Pages 的静态文件，不需要安装任何依赖。"""

from pathlib import Path
from html import escape
from urllib.parse import urlsplit
import os
import shutil

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "dist"


def main() -> None:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    site_url = os.environ.get("SITE_URL", "").strip().rstrip("/")
    if site_url:
        parsed = urlsplit(site_url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc or parsed.query or parsed.fragment:
            raise SystemExit("SITE_URL 必须是完整站点地址，可带项目子路径，不能带查询参数或锚点。")
        page_url = escape(site_url + "/", quote=True)
        image_url = escape(site_url + "/assets/images/social-preview.png", quote=True)
        html = html.replace('content="./assets/images/social-preview.png"', f'content="{image_url}"')
        html = html.replace("<!-- deployment-metadata -->", f'<link rel="canonical" href="{page_url}">\n    <meta property="og:url" content="{page_url}">')
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir()
    (OUTPUT / "index.html").write_text(html, encoding="utf-8")
    # 仅复制官网资源；原应用的源码、数据库与配置不会进入发布包。
    shutil.copytree(ROOT / "assets", OUTPUT / "assets", dirs_exist_ok=True)
    (OUTPUT / ".nojekyll").touch()
    files = [file for file in OUTPUT.rglob("*") if file.is_file()]
    size = sum(file.stat().st_size for file in files)
    print(f"已生成 {OUTPUT.name}/：{len(files)} 个文件，{size / 1024:.1f} KiB")


if __name__ == "__main__":
    main()
