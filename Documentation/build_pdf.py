"""Build a single-HTML documentation bundle for PDF rendering."""
import pathlib, sys, re
import markdown

sys.stdout.reconfigure(encoding='utf-8')

REPO = pathlib.Path(__file__).resolve().parent.parent

ORDER = [
    ('Overview', 'README.md'),
    ('Architecture', 'docs/ARCHITECTURE.md'),
    ('Requirements', 'docs/REQUIREMENTS.md'),
    ('Entity-Relationship Diagram', 'docs/ERD.md'),
    ('Business Process Diagrams', 'docs/bpmn/README.md'),
    ('Roles — Index', 'docs/roles/README.md'),
    ('Student', 'docs/roles/student/README.md'),
    ('Student — User Scenarios', 'docs/roles/student/user-scenarios.md'),
    ('Student — Use Cases', 'docs/roles/student/use-cases.md'),
    ('Student — Activity Diagrams', 'docs/roles/student/activity-diagrams.md'),
    ('Student — Sequence Diagrams', 'docs/roles/student/sequence-diagrams.md'),
    ('Instructor', 'docs/roles/instructor/README.md'),
    ('Instructor — User Scenarios', 'docs/roles/instructor/user-scenarios.md'),
    ('Instructor — Use Cases', 'docs/roles/instructor/use-cases.md'),
    ('Instructor — Activity Diagrams', 'docs/roles/instructor/activity-diagrams.md'),
    ('Instructor — Sequence Diagrams', 'docs/roles/instructor/sequence-diagrams.md'),
    ('Academic Staff', 'docs/roles/academic-staff/README.md'),
    ('Academic Staff — User Scenarios', 'docs/roles/academic-staff/user-scenarios.md'),
    ('Academic Staff — Use Cases', 'docs/roles/academic-staff/use-cases.md'),
    ('Academic Staff — Activity Diagrams', 'docs/roles/academic-staff/activity-diagrams.md'),
    ('Academic Staff — Sequence Diagrams', 'docs/roles/academic-staff/sequence-diagrams.md'),
    ('Communications Staff', 'docs/roles/communications-staff/README.md'),
    ('Communications Staff — User Scenarios', 'docs/roles/communications-staff/user-scenarios.md'),
    ('Communications Staff — Use Cases', 'docs/roles/communications-staff/use-cases.md'),
    ('Communications Staff — Activity Diagrams', 'docs/roles/communications-staff/activity-diagrams.md'),
    ('Communications Staff — Sequence Diagrams', 'docs/roles/communications-staff/sequence-diagrams.md'),
    ('Finance Staff', 'docs/roles/finance-staff/README.md'),
    ('Finance Staff — User Scenarios', 'docs/roles/finance-staff/user-scenarios.md'),
    ('Finance Staff — Use Cases', 'docs/roles/finance-staff/use-cases.md'),
    ('Finance Staff — Activity Diagrams', 'docs/roles/finance-staff/activity-diagrams.md'),
    ('Finance Staff — Sequence Diagrams', 'docs/roles/finance-staff/sequence-diagrams.md'),
    ('System Admin', 'docs/roles/system-admin/README.md'),
    ('System Admin — User Scenarios', 'docs/roles/system-admin/user-scenarios.md'),
    ('System Admin — Use Cases', 'docs/roles/system-admin/use-cases.md'),
    ('System Admin — Activity Diagrams', 'docs/roles/system-admin/activity-diagrams.md'),
    ('System Admin — Sequence Diagrams', 'docs/roles/system-admin/sequence-diagrams.md'),
]


def fix_paths(html: str, base_dir: pathlib.Path) -> str:
    base = base_dir.resolve()

    def repl(m):
        attr = m.group(1)
        url = m.group(2)
        if url.startswith(('http://', 'https://', 'data:', 'file:', '#')):
            return m.group(0)
        target = (base / url).resolve()
        if target.exists():
            return f'{attr}="{target.as_uri()}"'
        return m.group(0)

    return re.sub(r'(src|href)="([^"]+)"', repl, html)


def main():
    md = markdown.Markdown(extensions=['tables', 'fenced_code', 'toc', 'attr_list', 'sane_lists'])

    parts = []
    parts.append('<h1 style="text-align:center;padding-top:35vh;">Campus Information System (CIS)</h1>')
    parts.append('<h2 style="text-align:center;">Complete Documentation Bundle</h2>')
    parts.append('<p style="text-align:center;color:#555">Requirements · ERD · BPMN · Per-role Use Cases, Activity &amp; Sequence Diagrams</p>')
    parts.append('<p style="text-align:center;color:#777;font-size:.9rem">FabioH28 — 2026</p>')
    parts.append('<div style="page-break-after:always"></div>')

    for title, path in ORDER:
        p = (REPO / path).resolve()
        if not p.exists():
            print(f'  WARN missing: {path}', file=sys.stderr)
            continue
        text = p.read_text(encoding='utf-8')
        text = re.sub(r'```mermaid[\s\S]*?```', '_[Mermaid diagram — see PNG in diagrams/ folder]_', text)
        md.reset()
        body_html = md.convert(text)
        body_html = fix_paths(body_html, p.parent)
        parts.append('<div style="page-break-before:always"></div>')
        parts.append(f'<h1>{title}</h1>')
        parts.append(body_html)

    parts.append('<div style="page-break-before:always"></div>')
    parts.append('<h1>Appendix A — Rendered Role Diagrams</h1>')
    for role in ['student', 'instructor', 'academic-staff', 'communications-staff', 'finance-staff', 'system-admin']:
        diag = REPO / f'docs/roles/{role}/diagrams'
        pngs = sorted(diag.glob('*.png'))
        if not pngs:
            continue
        parts.append(f'<h2>{role.replace("-", " ").title()}</h2>')
        for png in pngs:
            parts.append(f'<p><strong>{png.stem}</strong></p>')
            parts.append(f'<img src="{png.resolve().as_uri()}" style="max-width:100%;border:1px solid #ccc"/>')

    parts.append('<div style="page-break-before:always"></div>')
    parts.append('<h1>Appendix B — BPMN Diagrams</h1>')
    for png in sorted((REPO / 'docs/bpmn').glob('*.png')):
        parts.append(f'<p><strong>{png.stem}</strong></p>')
        parts.append(f'<img src="{png.resolve().as_uri()}" style="max-width:100%;border:1px solid #ccc"/>')

    parts.append('<div style="page-break-before:always"></div>')
    parts.append('<h1>Appendix C — Entity-Relationship Diagram (full)</h1>')
    for png in sorted((REPO / 'docs/diagrams').glob('erd-*.png')):
        parts.append(f'<img src="{png.resolve().as_uri()}" style="max-width:100%;border:1px solid #ccc"/>')

    css = """
<style>
@page { size: A4; margin: 18mm; }
body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10.5pt; line-height: 1.5; color: #1a1a1a; }
h1 { color: #1a3a8a; border-bottom: 2px solid #1a3a8a; padding-bottom: 6px; margin-top: 0; }
h2 { color: #1a3a8a; margin-top: 1.3em; }
h3 { color: #333; margin-top: 1em; }
table { border-collapse: collapse; width: 100%; margin: .8em 0; font-size: .92em; }
th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
th { background: #eef2ff; }
code { background: #f4f4f8; padding: 1px 4px; border-radius: 3px; font-size: .9em; }
pre { background: #f4f4f8; padding: 8px; border-radius: 4px; overflow-x: auto; font-size: .85em; }
blockquote { border-left: 3px solid #bbb; padding-left: 10px; color: #555; }
img { display: block; margin: 8px 0; max-width: 100%; }
hr { border: 0; border-top: 1px solid #ccc; margin: 1.5em 0; }
</style>
"""

    html_doc = f'<!doctype html><html><head><meta charset="utf-8">{css}</head><body>' + '\n'.join(parts) + '</body></html>'
    out = REPO / 'docs/CIS-documentation.html'
    out.write_text(html_doc, encoding='utf-8')
    print(f'  built {out} ({len(html_doc) // 1024} KB, {len(parts)} sections)')


if __name__ == '__main__':
    main()
