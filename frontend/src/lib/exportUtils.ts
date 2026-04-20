// ─── CSV download ─────────────────────────────────────────────────────────────
export function downloadCSV(filename: string, rows: (string | number)[][]): void {
  const csv = rows
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── PDF via print window ─────────────────────────────────────────────────────
export function printHTML(title: string, bodyHTML: string): void {
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) return
  win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 48px; color: #111827; line-height: 1.6; }
    h1  { color: #6C63FF; font-size: 22px; font-weight: 900; border-bottom: 2px solid #6C63FF; padding-bottom: 10px; margin-bottom: 28px; }
    h2  { color: #1f2937; font-size: 16px; font-weight: 700; margin: 28px 0 12px; }
    h3  { color: #374151; font-size: 13px; font-weight: 600; margin: 16px 0 6px; }
    p   { font-size: 13px; color: #374151; margin-bottom: 8px; }
    ul  { padding-left: 20px; margin-bottom: 12px; }
    li  { font-size: 13px; color: #374151; margin-bottom: 4px; }
    .section { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .metric { display: inline-block; margin-right: 24px; }
    .metric-value { font-size: 22px; font-weight: 900; color: #6C63FF; }
    .metric-label { font-size: 11px; color: #6b7280; display: block; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
    .alto  { background: #dcfce7; color: #166534; }
    .medio { background: #fef9c3; color: #854d0e; }
    .bajo  { background: #fee2e2; color: #991b1b; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
    th { background: #f9fafb; padding: 8px 10px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600; }
    td { padding: 8px 10px; border: 1px solid #e5e7eb; vertical-align: top; }
    .phase { border-left: 3px solid #6C63FF; padding-left: 16px; margin-bottom: 20px; }
    @media print { body { padding: 24px; } }
  </style>
</head>
<body>${bodyHTML}</body>
</html>`)
  win.document.close()
  setTimeout(() => win.print(), 400)
}
