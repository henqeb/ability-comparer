import { describe, expect, it } from 'vitest'
import { toPlainText } from './mediawiki.ts'

describe('toPlainText', () => {
  it('keeps link labels', () => {
    expect(toPlainText('Cast [[Cure (Final Fantasy XII)|Cure]] and [[Raise]].')).toBe('Cast Cure and Raise.')
  })

  it('keeps the last template argument and drops argument-less templates', () => {
    expect(toPlainText('{{LA|Belias (Final Fantasy XII)|Belias}}{{clear}}')).toBe('Belias')
  })

  it('drops tags, bold quotes and extra whitespace', () => {
    expect(toPlainText("'''Heals'''<br/>  all\n allies")).toBe('Heals all allies')
  })
})
