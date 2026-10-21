#!/usr/bin/env python3
"""检查发布目录中的资源、站内锚点及无障碍关联，使用 Python 标准库。"""

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re
import sys


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: set[str] = set()
        self.references: list[tuple[str, str]] = []
        self.links: list[str] = []
        self.errors: list[str] = []
        self.h1_count = 0
        self.language = ""

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        identifier = values.get("id")
        if identifier:
            if identifier in self.ids:
                self.errors.append(f"重复的 ID：{identifier}")
            self.ids.add(identifier)
        if tag == "html":
            self.language = values.get("lang", "")
        if tag == "h1":
            self.h1_count += 1
        if tag == "img" and "alt" not in values:
            self.errors.append(f"图片缺少替代文本：{values.get('src', '')}")
        if tag == "a" and values.get("target") == "_blank":
            if "noopener" not in values.get("rel", ""):
                self.errors.append("新窗口链接缺少 noopener")
        for attr in ("src", "href"):
            if values.get(attr):
                self.links.append(values[attr])
        for attr in ("aria-controls", "aria-labelledby", "aria-describedby"):
            for target in values.get(attr, "").split():
                self.references.append((attr, target))


# 需要检查的页面及其语言
PAGES = {"index.html": "zh-CN", "en/index.html": "en"}


def check_page(root: Path, name: str, language: str) -> tuple[PageParser, list[str]]:
    index = root / name
    page = PageParser()
    if not index.is_file():
        return page, [f"缺少 {name}，请先运行 python3 scripts/build.py"]
    html = index.read_text(encoding="utf-8")
    page.feed(html)
    if page.language != language:
        page.errors.append(f"页面语言应为 {language}")
    if page.h1_count != 1:
        page.errors.append(f"主标题数量应为 1，当前为 {page.h1_count}")
    for label, target in page.references:
        if target not in page.ids:
            page.errors.append(f"{label} 指向不存在的 ID：{target}")
    for link in page.links:
        parsed = urlsplit(link)
        if parsed.scheme or parsed.netloc:
            continue
        if parsed.path.startswith("/"):
            page.errors.append(f"根路径资源不兼容项目型 Pages：{link}")
        if parsed.path:
            # 相对页面所在目录解析；目录链接对应其中的 index.html，且不能超出发布目录。
            target = (index.parent / unquote(parsed.path)).resolve()
            if parsed.path.endswith("/"):
                target = target / "index.html"
            if not target.is_relative_to(root) or not target.is_file():
                page.errors.append(f"本地资源不存在：{link}")
        if not parsed.path and parsed.fragment and unquote(parsed.fragment) not in page.ids:
            page.errors.append(f"锚点不存在：{link}")
    # 预览图通过脚本动态切换，单独核对所有已声明的标签对应的图片。
    for preview in re.findall(r'data-preview="([\w-]+)"', html):
        if not (root / "assets" / "images" / f"{preview}.webp").is_file():
            page.errors.append(f"预览图不存在：{preview}")
    return page, [f"{name}：{error}" for error in page.errors]


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else "dist").resolve()
    errors: list[str] = []
    summary: list[str] = []
    for name, language in PAGES.items():
        page, page_errors = check_page(root, name, language)
        errors.extend(page_errors)
        summary.append(f"{name} {len(page.ids)} 个 ID、{len(page.links)} 个资源/链接")
    for path in root.rglob("*"):
        if path.is_file() and path.suffix in {".db", ".sqlite", ".sqlite3", ".env", ".pem", ".key"}:
            errors.append(f"发布包中发现不应发布的文件：{path.relative_to(root)}")
    if errors:
        print("静态检查未通过：")
        for error in errors:
            print(f"- {error}")
        return 1
    print(f"静态检查通过：{'；'.join(summary)}，ARIA 关联、图片文本与 Pages 子路径。")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
