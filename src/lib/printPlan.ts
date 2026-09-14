export function openPlanPrintDialog(): boolean {
  const plan = document.getElementById('printable-plan');
  if (!plan) return false;

  const printWindow = window.open('', '_blank', 'width=900,height=1200');
  if (!printWindow) return false;

  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((node) => node.outerHTML)
    .join('');

  printWindow.document.open();
  printWindow.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Plano de Ensino</title>${styles}<style>body{margin:0;background:#fff}.print-shell{max-width:900px;margin:0 auto;padding:32px;background:#fff}@media print{.print-shell{max-width:none;padding:0}}</style></head><body><main class="print-shell">${plan.outerHTML}</main></body></html>`);
  printWindow.document.close();

  const print = () => {
    printWindow.focus();
    printWindow.print();
    printWindow.onafterprint = () => printWindow.close();
  };

  if (printWindow.document.readyState === 'complete') {
    window.setTimeout(print, 250);
  } else {
    printWindow.addEventListener('load', () => window.setTimeout(print, 150), { once: true });
  }

  return true;
}
