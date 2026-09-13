import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { usePrintCv } from './usePrintCv'

describe('usePrintCv', () => {
  it('calls window.print', () => {
    const print = vi.fn()
    window.print = print
    const { result } = renderHook(() => {
      return usePrintCv()
    })
    result.current.printCv()
    expect(print).toHaveBeenCalledTimes(1)
  })
})
