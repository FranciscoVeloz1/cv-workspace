export function usePrintCv(): { printCv: () => void } {
  const printCv = () => {
    window.print()
  }
  return { printCv }
}
