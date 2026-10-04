import { toPlainText } from './mediawiki.ts'

// One row of a job page's "License list" tables, still as wikitext.
// `cells` are the cells after the name: [description, (amount,) LP cost].
export type LicenseRow = { section: string; name: string; cells: string[] }

export function parseLicenseList(wikitext: string): LicenseRow[] {
  const list = wikitext.split(/^==\s*License list\s*==\s*$/m)[1]?.split(/^==[^=]/m)[0]
  if (list === undefined) throw new Error('no "License list" section')

  const rows: LicenseRow[] = []
  for (const section of list.split(/^===/m).slice(1)) {
    const heading = toPlainText(section.slice(0, section.indexOf('===')))
    for (const chunk of section.split(/^\|-/m).slice(1)) {
      const [head, ...cells] = splitCells(chunk)
      if (!head?.startsWith('!') || /^!\s*(style|width)=/.test(head)) continue // header row
      rows.push({ section: heading, name: head.slice(1).trim(), cells: cells.map(stripCellAttributes) })
    }
  }
  return rows
}

// A cell starts with "|" or "!"; any other line continues the previous cell.
function splitCells(chunk: string): string[] {
  const cells: string[] = []
  for (const line of chunk.split('\n').map((l) => l.trim())) {
    if (!line || line.startsWith('|}')) continue
    if (/^[|!]/.test(line) || cells.length === 0) cells.push(line)
    else cells[cells.length - 1] += ` ${line}`
  }
  return cells
}

// '|style="text-align:center"|40' → '40'
function stripCellAttributes(cell: string): string {
  return cell
    .slice(1)
    .replace(/^\s*(?:[a-z-]+=(?:"[^"]*"|\S+)\s*)+\|(?!\|)/, '')
    .trim()
}
