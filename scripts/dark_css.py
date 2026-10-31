#!/usr/bin/env python3
"""由 assets/styles.css 生成深色模式样式 assets/dark.css，只使用 Python 标准库。

styles.css 中的颜色大多直接写在规则里。本脚本逐条找出含颜色的声明，按属性语义换算成深色：
- 背景、边框、阴影：浅色变为深色，按色度保留少许色相；中深色（主色按钮等）保持不变；
- 文字、图标：深色变为浅色，浅色文字（如按钮上的白字）保持不变，中间色适当提亮。
生成结果都限定在 html[data-theme="dark"] 下；换算不理想的地方写在 MANUAL 中，追加在最后。

用法：
    python3 scripts/dark_css.py          重新生成 assets/dark.css
    python3 scripts/dark_css.py --check  检查 assets/dark.css 是否与 styles.css 同步（CI 使用）
"""

from pathlib import Path
import colorsys
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "styles.css"
TARGET = ROOT / "assets" / "dark.css"
DARK = 'html[data-theme="dark"]'

COLOR = re.compile(
    r"#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{4}\b|#[0-9a-fA-F]{3}\b"
    r"|rgba?\(\s*\d+[\s,]+\d+[\s,]+\d+\s*(?:[/,]\s*[\d.]+%?\s*)?\)"
    r"|(?<![-\w])(?:white|black)(?![-\w])"
)
TEXT_PROPERTIES = {"color", "fill", "stroke", "outline", "outline-color", "caret-color", "text-decoration-color", "-webkit-text-fill-color"}
# 变量单独在 MANUAL 中按语义指定
SKIP_PROPERTIES = {"--bg", "--ink", "--muted", "--purple", "--purple-dark", "--line"}

MANUAL = f"""
/* 手动调整：全局变量与自动换算不合适的地方 */
{DARK} {{
  color-scheme: dark;
  --bg: #121118;
  --ink: #e9e7f0;
  --muted: #a3a0ae;
  --purple: #8b74f0;
  --purple-dark: #7a62ea;
  --line: #2c2a35;
}}
{DARK} .site-header {{ background: rgb(18 17 24 / 92%); border-bottom-color: var(--line); }}
{DARK} .skip-link {{ background: var(--purple); color: #fff; }}
{DARK} ::selection {{ background: #4b3c8c; color: #fff; }}
{DARK} img:not(.icon) {{ filter: brightness(.92); }}
"""


def parse_color(token: str) -> tuple[float, float, float, float]:
    token = token.lower()
    if token == "white":
        return 1, 1, 1, 1
    if token == "black":
        return 0, 0, 0, 1
    if token.startswith("#"):
        digits = token[1:]
        if len(digits) in (3, 4):
            digits = "".join(c * 2 for c in digits)
        values = [int(digits[i:i + 2], 16) / 255 for i in range(0, len(digits), 2)]
        return values[0], values[1], values[2], values[3] if len(values) == 4 else 1
    numbers = re.findall(r"[\d.]+%?", token)
    r, g, b = (int(n) / 255 for n in numbers[:3])
    alpha = 1.0
    if len(numbers) > 3:
        alpha = float(numbers[3].rstrip("%")) / 100 if numbers[3].endswith("%") else float(numbers[3])
    return r, g, b, alpha


def format_color(r: float, g: float, b: float, alpha: float) -> str:
    hex_color = "#" + "".join(f"{round(max(0, min(1, v)) * 255):02x}" for v in (r, g, b))
    return hex_color if alpha >= 1 else f"{hex_color}{round(alpha * 255):02x}"


def convert(token: str, text: bool) -> str:
    r, g, b, alpha = parse_color(token)
    hue, lightness, saturation = colorsys.rgb_to_hls(r, g, b)
    if text:
        if lightness > 0.72:
            return token  # 彩色底上的浅色文字
        if lightness < 0.45:
            lightness = 0.93 - lightness * 0.5
        else:
            lightness = 0.66 + (lightness - 0.45) * 0.3
    else:
        if lightness < 0.6:
            return token  # 主色按钮、深色底保持不变
        lightness = 0.10 + (1 - lightness) * 0.55
        # 按色度（而非 HLS 饱和度）保留色彩：近白的暖色底变为中性深灰，淡紫等浅色调保留少许色相
        chroma = max(r, g, b) - min(r, g, b)
        saturation = min(1.0, chroma * 1.2 / (1 - abs(2 * lightness - 1)))
    return format_color(*colorsys.hls_to_rgb(hue, lightness, saturation), alpha)


def dark_selector(selector: str) -> str:
    selector = selector.strip()
    if selector in (":root", "html"):
        return DARK
    if selector.startswith("html"):
        return DARK + selector[4:]
    return f"{DARK} {selector}"


def convert_rule(selectors: str, body: str) -> str | None:
    declarations = []
    for declaration in body.split(";"):
        if ":" not in declaration:
            continue
        prop, value = (part.strip() for part in declaration.split(":", 1))
        if prop in SKIP_PROPERTIES or not COLOR.search(value):
            continue
        text = prop in TEXT_PROPERTIES
        declarations.append(f"{prop}: {COLOR.sub(lambda m: convert(m.group(0), text), value)}")
    if not declarations:
        return None
    joined = ", ".join(dark_selector(s) for s in selectors.split(","))
    return f"{joined} {{ {'; '.join(declarations)}; }}"


def generate(css: str) -> str:
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    output: list[str] = []
    media: str | None = None
    media_rules: list[str] = []
    for match in re.finditer(r"(@media[^{]+)\{|([^{}@]+)\{([^{}]*)\}|\}", css):
        if match.group(1):
            media, media_rules = match.group(1).strip(), []
        elif match.group(2) is not None:
            rule = convert_rule(match.group(2), match.group(3))
            if rule:
                (media_rules if media else output).append(rule)
        elif media:
            # 打印样式不需要深色版本
            if media_rules and "print" not in media:
                output.append(f"{media} {{\n  " + "\n  ".join(media_rules) + "\n}")
            media = None
    header = "/* 由 scripts/dark_css.py 根据 styles.css 生成，请勿直接修改；手动调整写在脚本的 MANUAL 中。 */\n"
    return header + "\n".join(output) + "\n" + MANUAL


def main() -> int:
    content = generate(SOURCE.read_text(encoding="utf-8"))
    if "--check" in sys.argv:
        if not TARGET.exists() or TARGET.read_text(encoding="utf-8") != content:
            print("assets/dark.css 与 styles.css 不同步，请运行 python3 scripts/dark_css.py")
            return 1
        print("assets/dark.css 已同步")
        return 0
    TARGET.write_text(content, encoding="utf-8")
    print(f"已生成 {TARGET.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
