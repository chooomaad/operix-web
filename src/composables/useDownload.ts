export function useDownload() {
  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a   = document.createElement('a')
    a.href    = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  async function downloadPdf(apiFn: () => Promise<{ data: Blob }>, filename: string) {
    const { data } = await apiFn()
    downloadBlob(new Blob([data], { type: 'application/pdf' }), filename)
  }

  async function downloadExcel(apiFn: () => Promise<{ data: Blob }>, filename: string) {
    const { data } = await apiFn()
    downloadBlob(new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename)
  }

  return { downloadBlob, downloadPdf, downloadExcel }
}
