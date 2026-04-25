// ─── CSV download ─────────────────────────────────────────────────────────────
export function downloadCSV(filename: string, rows: (string | number)[][]): void {
  const csv = rows
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, `${filename}.csv`)
}

// ─── Trigger file download ─────────────────────────────────────────────────────
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Branded PDF styles ───────────────────────────────────────────────────────
const PDF_STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    background: #ffffff;
    color: #111827;
    line-height: 1.6;
    font-size: 13px;
  }
  .page { max-width: 800px; margin: 0 auto; padding: 48px 56px; }
  /* Header */
  .header {
    display: flex; align-items: center; justify-content: space-between;
    padding-bottom: 20px; margin-bottom: 32px;
    border-bottom: 2px solid #6366f1;
  }
  .logo { display: flex; align-items: center; gap: 10px; }
  .logo-badge {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex; align-items: center; justify-content: center;
    color: white; font-weight: 900; font-size: 14px;
  }
  .logo-text { font-weight: 900; font-size: 16px; color: #111827; }
  .logo-sub  { font-size: 11px; color: #6b7280; margin-top: 1px; }
  .header-meta { text-align: right; font-size: 11px; color: #9ca3af; }
  /* Title */
  .doc-title { font-size: 22px; font-weight: 900; color: #111827; margin-bottom: 4px; }
  .doc-sub   { font-size: 13px; color: #6b7280; margin-bottom: 32px; }
  /* Sections */
  h2 { font-size: 13px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 0.08em; margin: 28px 0 12px; }
  h3 { font-size: 13px; font-weight: 600; color: #374151; margin: 14px 0 6px; }
  p  { font-size: 13px; color: #374151; margin-bottom: 8px; line-height: 1.65; }
  ul { padding-left: 18px; margin-bottom: 12px; }
  li { font-size: 13px; color: #374151; margin-bottom: 4px; }
  .card {
    border: 1px solid #e5e7eb; border-radius: 10px;
    padding: 16px 20px; margin-bottom: 12px; background: #fafafa;
  }
  .card-accent { border-left: 3px solid #6366f1; }
  .tag {
    display: inline-block; padding: 2px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 700; margin-right: 4px; margin-bottom: 4px;
  }
  .tag-indigo { background: #eef2ff; color: #4338ca; }
  .tag-violet { background: #f5f3ff; color: #6d28d9; }
  .tag-green  { background: #f0fdf4; color: #166534; }
  .tag-red    { background: #fef2f2; color: #991b1b; }
  .tag-alto   { background: #dcfce7; color: #166534; }
  .tag-medio  { background: #fef9c3; color: #854d0e; }
  .tag-bajo   { background: #fee2e2; color: #991b1b; }
  .metric-row { display: flex; gap: 16px; margin-bottom: 12px; }
  .metric { flex: 1; background: #f3f4f6; border-radius: 8px; padding: 12px 16px; }
  .metric-value { font-size: 20px; font-weight: 900; color: #6366f1; }
  .metric-label { font-size: 11px; color: #6b7280; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
  th { background: #f3f4f6; padding: 8px 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600; color: #374151; }
  td { padding: 8px 12px; border: 1px solid #e5e7eb; vertical-align: top; color: #374151; }
  .phase { border-left: 3px solid #6366f1; padding: 12px 16px; margin-bottom: 16px; background: #fafafa; border-radius: 0 8px 8px 0; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .footer {
    margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb;
    font-size: 11px; color: #9ca3af; text-align: center;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 24px 32px; }
    .no-break { page-break-inside: avoid; }
  }
`

// ─── Generate branded HTML document ───────────────────────────────────────────
function buildDocument(title: string, subtitle: string, bodyHTML: string): string {
  const date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} — AgencyOS</title>
  <style>${PDF_STYLES}</style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="logo">
        <div class="logo-badge">A</div>
        <div>
          <div class="logo-text">AgencyOS</div>
          <div class="logo-sub">Sistema de campañas con IA</div>
        </div>
      </div>
      <div class="header-meta">
        Generado el ${date}<br>
        agencyos.com
      </div>
    </div>
    <div class="doc-title">${title}</div>
    ${subtitle ? `<div class="doc-sub">${subtitle}</div>` : ''}
    ${bodyHTML}
    <div class="footer">
      Generado con AgencyOS · agencyos.com · ${date}
    </div>
  </div>
</body>
</html>`
}

// ─── Download as PDF (via print dialog auto-triggered) ────────────────────────
export function downloadPDF(title: string, subtitle: string, bodyHTML: string): void {
  const html = buildDocument(title, subtitle, bodyHTML)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url  = URL.createObjectURL(blob)

  // Open in new window and auto-trigger print (browser saves as PDF)
  const win = window.open(url, '_blank', 'width=900,height=750')
  if (!win) {
    // Fallback: direct download of HTML if popup blocked
    triggerDownload(blob, `${title.replace(/\s+/g, '_')}.html`)
    URL.revokeObjectURL(url)
    return
  }
  win.addEventListener('load', () => {
    URL.revokeObjectURL(url)
    setTimeout(() => win.print(), 300)
  })
}

// ─── Legacy alias used by frameworks ──────────────────────────────────────────
export function printHTML(title: string, bodyHTML: string): void {
  downloadPDF(title, '', bodyHTML)
}
