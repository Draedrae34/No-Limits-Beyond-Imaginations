#!/usr/bin/env python3
"""Generate PDF from whitepaper markdown using fpdf2 with Unicode support."""

import re
from pathlib import Path
from fpdf import FPDF

MARKDOWN_PATH = Path("D:/Projects/Silent-Spirits-Legacy/whitepaper-submission/WHITEPAPER.md")
PDF_PATH = Path("D:/Projects/Silent-Spirits-Legacy/arxiv-submission/paper.pdf")
FONT_PATH = "C:/Windows/Fonts/arial.ttf"


class WhitepaperPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.add_font("ArialUnicode", "", FONT_PATH, uni=True)
        self.add_font("ArialUnicode", "B", FONT_PATH, uni=True)
        self.add_font("ArialUnicode", "I", FONT_PATH, uni=True)
        self.add_font("ArialUnicode", "BI", FONT_PATH, uni=True)

    def header(self):
        pass

    def footer(self):
        self.set_y(-15)
        self.set_font("ArialUnicode", "I", 8)
        self.set_text_color(100, 100, 100)
        self.cell(0, 10, f"Page {self.page_no()}", align="C", new_x="LMARGIN", new_y="NEXT")

    def add_section_title(self, title):
        self.set_font("ArialUnicode", "B", 16)
        self.set_text_color(0, 0, 0)
        self.multi_cell(0, 10, title, align="L", new_x="LMARGIN", new_y="NEXT")
        self.ln(4)

    def add_subsection_title(self, title):
        self.set_font("ArialUnicode", "B", 13)
        self.set_text_color(0, 0, 0)
        self.multi_cell(0, 8, title, align="L", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def add_body_text(self, text):
        self.set_font("ArialUnicode", "", 10)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 5, text, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def add_bullet_list(self, items):
        self.set_font("ArialUnicode", "", 10)
        self.set_text_color(30, 30, 30)
        for item in items:
            bullet_text = f"  • {item}"
            self.multi_cell(0, 5, bullet_text, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def add_numbered_list(self, items):
        self.set_font("ArialUnicode", "", 10)
        self.set_text_color(30, 30, 30)
        for i, item in enumerate(items, 1):
            numbered_text = f"{i}. {item}"
            self.multi_cell(0, 5, numbered_text, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)


def parse_markdown(md_text):
    lines = md_text.split("\n")
    elements = []
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()

        if line.startswith("# ") and not line.startswith("## "):
            elements.append(("h1", line[2:].strip()))
        elif line.startswith("## ") and not line.startswith("### "):
            elements.append(("h2", line[3:].strip()))
        elif line.startswith("### ") and not line.startswith("#### "):
            elements.append(("h3", line[4:].strip()))
        elif line.strip() == "---":
            elements.append(("hr", ""))
        elif line.startswith("|"):
            table_lines = [line]
            j = i + 1
            while j < len(lines) and lines[j].strip().startswith("|"):
                table_lines.append(lines[j].rstrip())
                j += 1
            elements.append(("table", table_lines))
            i = j - 1
        elif re.match(r"^\d+\.\s", line.strip()):
            items = []
            while i < len(lines) and re.match(r"^\d+\.\s", lines[i].strip()):
                items.append(re.sub(r"^\d+\.\s*", "", lines[i].strip()))
                i += 1
            elements.append(("numbered_list", items))
            continue
        elif line.strip().startswith("- ") or line.strip().startswith("* "):
            items = []
            while i < len(lines) and (lines[i].strip().startswith("- ") or lines[i].strip().startswith("* ")):
                items.append(re.sub(r"^[-*]\s*", "", lines[i].strip()))
                i += 1
            elements.append(("bullet_list", items))
            continue
        elif line.strip().startswith("```"):
            code_lines = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("```"):
                code_lines.append(lines[i])
                i += 1
            elements.append(("code", "\n".join(code_lines)))
        elif line.strip() == "":
            elements.append(("blank", ""))
        else:
            elements.append(("paragraph", line.strip()))

        i += 1

    return elements


def render_table(pdf, table_lines):
    if len(table_lines) < 2:
        return

    rows = []
    for line in table_lines:
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        rows.append(cells)

    col_count = max(len(row) for row in rows)
    page_width = 200
    col_width = page_width / col_count

    pdf.set_font("ArialUnicode", "B", 9)
    pdf.set_fill_color(240, 240, 240)
    for cell in rows[0]:
        pdf.cell(col_width, 6, cell, border=1, fill=True)
    pdf.ln()

    pdf.set_font("ArialUnicode", "", 9)
    for row in rows[2:]:
        for cell in row:
            pdf.cell(col_width, 6, cell, border=1)
        pdf.ln()

    pdf.ln(4)


def render_pdf(elements, output_path):
    pdf = WhitepaperPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    for elem_type, content in elements:
        if elem_type == "h1":
            pdf.set_font("ArialUnicode", "B", 18)
            pdf.set_text_color(0, 0, 0)
            pdf.multi_cell(0, 10, content, align="L", new_x="LMARGIN", new_y="NEXT")
            pdf.ln(4)
        elif elem_type == "h2":
            pdf.add_section_title(content)
        elif elem_type == "h3":
            pdf.add_subsection_title(content)
        elif elem_type == "paragraph":
            pdf.add_body_text(content)
        elif elem_type == "bullet_list":
            pdf.add_bullet_list(content)
        elif elem_type == "numbered_list":
            pdf.add_numbered_list(content)
        elif elem_type == "code":
            pdf.set_font("Courier", "", 8)
            pdf.set_text_color(40, 40, 40)
            pdf.multi_cell(0, 4, content, new_x="LMARGIN", new_y="NEXT")
            pdf.ln(2)
            pdf.set_font("ArialUnicode", "", 10)
        elif elem_type == "table":
            render_table(pdf, content)
        elif elem_type == "hr":
            pdf.ln(2)
            y = pdf.get_y()
            pdf.line(10, y, 200, y)
            pdf.ln(4)

    pdf.output(str(output_path))
    print(f"PDF generated: {output_path}")
    print(f"Size: {output_path.stat().st_size / 1024:.1f} KB")


def main():
    md_text = MARKDOWN_PATH.read_text(encoding="utf-8")
    elements = parse_markdown(md_text)
    render_pdf(elements, PDF_PATH)


if __name__ == "__main__":
    main()
