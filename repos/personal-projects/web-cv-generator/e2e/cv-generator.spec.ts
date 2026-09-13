import { expect, test, type Page } from '@playwright/test'

async function mockPrint(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(window, '__printCalls', {
      writable: true,
      value: 0
    })
    window.print = () => {
      window.__printCalls = Number(window.__printCalls) + 1
    }
  })
}

test.describe('web CV generator', () => {
  test('home lists Francisco Veloz', async ({ page }) => {
    await page.goto('./')
    await expect(page.getByRole('heading', { name: 'Resume sources', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Francisco Veloz' }).filter({ hasText: 'Default full-stack CV' })).toBeVisible()
  })

  test('clicking a source opens the preview', async ({ page }) => {
    await mockPrint(page)
    await page.goto('./')
    await page.getByRole('link', { name: 'Francisco Veloz' }).filter({ hasText: 'Default full-stack CV' }).click()
    await expect(page).toHaveURL(/[?&]resume=francisco-veloz(?:&|$)/)
    await expect(page.getByRole('heading', { level: 1, name: /Francisco/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Download PDF' })).toBeEnabled()
  })

  test('direct resume URL renders the sheet', async ({ page }) => {
    await page.goto('./?resume=francisco-veloz')
    await expect(page.getByRole('heading', { level: 1, name: /Francisco/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Download PDF' })).toBeEnabled()
  })

  test('download PDF calls print', async ({ page }) => {
    await mockPrint(page)
    await page.goto('./?resume=francisco-veloz')
    await expect(page.getByRole('button', { name: 'Download PDF' })).toBeEnabled()
    await page.getByRole('button', { name: 'Download PDF' }).click()
    const calls = await page.evaluate(() => {
      return window.__printCalls as number
    })
    expect(calls).toBe(1)
  })

  test('unknown slug shows not found', async ({ page }) => {
    await page.goto('./?resume=not-a-real-source')
    await expect(page.getByText('Resume not found')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Download PDF' })).toBeDisabled()
  })

  test('invalid slug does not fetch a traversal path', async ({ page }) => {
    const urls: string[] = []
    page.on('request', (request) => {
      if (request.resourceType() === 'document') {
        return
      }
      urls.push(request.url())
    })
    await page.goto('./?resume=../etc')
    await expect(page.getByText('Resume not found')).toBeVisible()
    const suspicious = urls.filter((url) => {
      return url.includes('..') || url.includes('etc.json') || url.includes('//etc')
    })
    expect(suspicious).toEqual([])
  })

  test('back to sources returns home', async ({ page }) => {
    await page.goto('./?resume=francisco-veloz')
    await page.getByRole('banner').getByRole('link', { name: 'Back to sources' }).click()
    await expect(page.getByRole('heading', { name: 'Resume sources', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Francisco Veloz' }).filter({ hasText: 'Default full-stack CV' })).toBeVisible()
  })

  test('print CSS lets the sheet paginate without a scroller', async ({ page }) => {
    await page.goto('./?resume=francisco-veloz')
    await expect(page.getByRole('heading', { level: 1, name: /Francisco/ })).toBeVisible()
    await page.emulateMedia({ media: 'print' })
    const printLayout = await page.evaluate(() => {
      const stages = Array.from(document.querySelectorAll('.preview-stage'))
      return {
        overflows: stages.map((stage) => {
          return getComputedStyle(stage).overflow
        }),
        htmlOverflow: getComputedStyle(document.documentElement).overflow,
        htmlHeight: getComputedStyle(document.documentElement).height,
        sheetHeight: document.querySelector('.cv-page')?.getBoundingClientRect().height ?? 0
      }
    })
    expect(printLayout.overflows.length).toBeGreaterThan(0)
    for (const overflow of printLayout.overflows) {
      expect(overflow).toBe('visible')
    }
    expect(printLayout.htmlOverflow).toBe('visible')
    expect(printLayout.sheetHeight).toBeGreaterThan(1122)
    const pdf = await page.pdf({ format: 'A4', printBackground: true })
    const pageCount = (pdf.toString('latin1').match(/\/Type\s*\/Page(?!s)/g) ?? []).length
    expect(pageCount).toBeGreaterThan(1)
  })
})
