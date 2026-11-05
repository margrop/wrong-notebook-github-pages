#!/usr/bin/env python3
"""由主项目的 doc/PRIVACY.md、doc/PRIVACY.en.md 生成官网隐私政策页，只使用 Python 标准库。

页头、导航、页脚沿用同语言的下载页，正文由 Markdown 转换（只支持隐私说明用到的语法：
二级标题、段落、无序列表、链接、行内代码和加粗）。隐私说明改动后重新运行并提交生成的页面：

    python3 scripts/privacy_pages.py ../wrong-notebook/doc
"""

from html import escape
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
REPO_DOC = "https://github.com/margrop/wrong-notebook/blob/main/doc/"
REPO_ROOT = "https://github.com/margrop/wrong-notebook/blob/main/"

PAGES = {
    "zh": {
        "source": "PRIVACY.md",
        "template": "download/index.html",
        "target": "privacy/index.html",
        "title": "隐私政策 · 智能错题本",
        "description": "智能错题本的隐私政策：实例保存哪些数据、何时发送给第三方 AI 服务商、如何授权与撤回、删除账号与数据，以及官网的访问统计。",
        "nav_download": ('<a href="./" aria-current="page" class="active">下载</a>', '<a href="../download/">下载</a>'),
        "lang_switch": ('class="lang-switch" href="../en/download/"', 'class="lang-switch" href="../en/privacy/"'),
        "footer_lang": ('<a href="../en/download/" hreflang="en" lang="en">English</a>', '<a href="../en/privacy/" hreflang="en" lang="en">English</a>'),
        "footer_privacy": ('<a href="../privacy/">隐私说明</a>', '<a href="./" aria-current="page">隐私说明</a>'),
        "eyebrow": "PRIVACY",
        "heading": "隐私政策",
        "source_note": "本页与项目仓库中的 <a href=\"{url}\" target=\"_blank\" rel=\"noopener noreferrer\">doc/PRIVACY.md</a> 内容一致。",
    },
    "en": {
        "source": "PRIVACY.en.md",
        "template": "en/download/index.html",
        "target": "en/privacy/index.html",
        "title": "Privacy policy · Wrong Notebook",
        "description": "Wrong Notebook privacy policy: what an instance stores, when data is sent to third-party AI providers, how to allow or withdraw consent, deleting accounts and data, and website analytics.",
        "nav_download": ('<a href="./" aria-current="page" class="active">Download</a>', '<a href="../download/">Download</a>'),
        "lang_switch": ('class="lang-switch" href="../../download/"', 'class="lang-switch" href="../../privacy/"'),
        "footer_lang": ('<a href="../../download/" hreflang="zh-CN" lang="zh-CN">简体中文</a>', '<a href="../../privacy/" hreflang="zh-CN" lang="zh-CN">简体中文</a>'),
        "footer_privacy": ('<a href="../privacy/">Privacy policy</a>', '<a href="./" aria-current="page">Privacy policy</a>'),
        "eyebrow": "PRIVACY",
        "heading": "Privacy policy",
        "source_note": "This page matches <a href=\"{url}\" target=\"_blank\" rel=\"noopener noreferrer\">doc/PRIVACY.en.md</a> in the project repository.",
    },
}

LINK = re.compile(r"\[([^\]]+)\]\(([^)\s]+)\)")


def resolve_link(target: str) -> str:
    """仓库内的相对链接改为 GitHub 地址；外部链接与锚点保持不变"""
    if re.match(r"^[a-z]+:", target) or target.startswith("#"):
        return target
    if target.startswith("../"):
        return REPO_ROOT + target[3:]
    return REPO_DOC + target


def inline(text: str) -> str:
    parts: list[str] = []
    last = 0
    for match in LINK.finditer(text):
        parts.append(format_text(text[last:match.start()]))
        href = resolve_link(match.group(2))
        external = href.startswith("http")
        attrs = ' target="_blank" rel="noopener noreferrer"' if external else ""
        parts.append(f'<a href="{escape(href, quote=True)}"{attrs}>{format_text(match.group(1))}</a>')
        last = match.end()
    parts.append(format_text(text[last:]))
    return "".join(parts)


def format_text(text: str) -> str:
    html = escape(text, quote=False)
    html = re.sub(r"`([^`]+)`", r"<code>\1</code>", html)
    return re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", html)


def markdown_body(markdown: str) -> tuple[str, str]:
    """返回 (更新日期一行, 正文 HTML)；跳过一级标题，第二行的语言切换与日期单独提取"""
    lines = markdown.strip().splitlines()
    assert lines[0].startswith("# "), "隐私说明应以一级标题开头"
    meta = lines[2] if len(lines) > 2 else ""
    # 只保留日期：去掉语言切换和指向官网自身的链接
    updated = next((part.strip() for part in meta.split("·") if "202" in part), "")
    blocks: list[str] = []
    paragraph: list[str] = []
    items: list[str] = []

    def flush() -> None:
        if paragraph:
            blocks.append(f"<p>{inline(' '.join(paragraph))}</p>")
            paragraph.clear()
        if items:
            blocks.append("<ul>" + "".join(f"<li>{inline(item)}</li>" for item in items) + "</ul>")
            items.clear()

    for line in lines[3:]:
        if not line.strip():
            flush()
        elif line.startswith("## "):
            flush()
            text = line[3:].strip()
            blocks.append(f"<h2>{format_text(text)}</h2>")
        elif line.startswith("- "):
            if paragraph:
                flush()
            items.append(line[2:].strip())
        else:
            if items:
                flush()
            paragraph.append(line.strip())
    flush()
    return updated, "\n            ".join(blocks)


def replace_once(html: str, old: str, new: str) -> str:
    assert html.count(old) == 1, f"模板中应恰好出现一次：{old[:80]}"
    return html.replace(old, new)


def build(lang: str, doc_dir: Path) -> None:
    page = PAGES[lang]
    template = (ROOT / page["template"]).read_text(encoding="utf-8")
    updated, body = markdown_body((doc_dir / page["source"]).read_text(encoding="utf-8"))

    head_end = template.index("</head>")
    head = template[:head_end]
    head = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{escape(page["description"], quote=True)}">', head)
    head = re.sub(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{escape(page["title"], quote=True)}">', head)
    head = re.sub(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{escape(page["description"], quote=True)}">', head)
    head = re.sub(r"<title>[^<]*</title>", f"<title>{escape(page['title'])}</title>", head)
    head = re.sub(r'\n\s*<script src="(?:\.\./)+assets/download\.js" defer></script>', "", head)

    main_start = template.index('<main id="main">')
    main_end = template.index("</main>") + len("</main>")
    chrome_top = template[head_end:main_start]
    chrome_bottom = template[main_end:]
    old_nav, new_nav = page["nav_download"]
    assert chrome_top.count(old_nav) == 2, "页头与手机导航中都应有下载链接"
    chrome_top = chrome_top.replace(old_nav, new_nav)
    chrome_top = replace_once(chrome_top, *page["lang_switch"])
    chrome_bottom = replace_once(chrome_bottom, *page["footer_lang"])
    chrome_bottom = replace_once(chrome_bottom, *page["footer_privacy"])

    source_url = REPO_DOC + page["source"]
    main = f"""<main id="main">
      <section class="legal-page" aria-labelledby="privacy-title">
        <div class="container legal-container">
          <p class="eyebrow">{page["eyebrow"]}</p>
          <h1 id="privacy-title">{page["heading"]}</h1>
          <p class="legal-meta">{escape(updated)}</p>
          <div class="legal-body">
            {body}
          </div>
          <p class="legal-meta">{page["source_note"].format(url=source_url)}</p>
        </div>
      </section>
    </main>"""

    target = ROOT / page["target"]
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(head + chrome_top + main + chrome_bottom, encoding="utf-8")
    print(f"已生成 {page['target']}（{updated}）")


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("用法：python3 scripts/privacy_pages.py <主项目的 doc 目录>")
    doc_dir = Path(sys.argv[1]).resolve()
    for lang in PAGES:
        build(lang, doc_dir)


if __name__ == "__main__":
    main()
