import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { A4Stage } from './index'

describe('A4Stage', () => {
  it('marks the scroller as preview-stage for print CSS', () => {
    const { container } = render(
      <A4Stage>
        <div>sheet</div>
      </A4Stage>
    )

    expect(container.firstElementChild?.className.split(' ')).toContain('preview-stage')
  })
})
