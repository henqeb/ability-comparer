import { describe, expect, it } from 'vitest'
import { parseLicenseList } from './ff12-parse.ts'

// Trimmed from the Shikari page, keeping each row shape the wiki uses.
const page = `==Profile==
Not a license table.
==License list==
===[[Technicks]]===
{|class="full-width article-table FFXII"
|-
!style="width:20%"|Name
!style="width:70%"|Description
!style="width:10%"|LP cost
|-
!{{LA|Libra (Final Fantasy XII)|Libra}}
|Reveal more detailed target information.
|style="text-align:center"|25
|}

===[[Augment (Final Fantasy XII)|Augments]]===
{|class="full-width article-table FFXII" style="text-align:center"
|-
!{{A|Potion Lore}} 1-2
|style="text-align:left"|[[Final Fantasy XII items|Potions]] restore 10%/15% more HP.
|2
|20/35
|}

===[[Esper (Final Fantasy XII)|Espers]] and [[Quickening (ability)|Quickenings]]===
{|class="full-width FFXII article-table"
|-
!width="20%"|Name
|-
!Quickening
|[[#Gil Toss|Gil Toss]] and
[[#Libra|Libra]]
|style="text-align:center"|50
|}
==Etymology==
!Not|a row`

describe('parseLicenseList', () => {
  it('returns one row per license, skipping header rows and other sections', () => {
    expect(parseLicenseList(page)).toEqual([
      {
        section: 'Technicks',
        name: '{{LA|Libra (Final Fantasy XII)|Libra}}',
        cells: ['Reveal more detailed target information.', '25'],
      },
      {
        section: 'Augments',
        name: '{{A|Potion Lore}} 1-2',
        cells: ['[[Final Fantasy XII items|Potions]] restore 10%/15% more HP.', '2', '20/35'],
      },
      {
        section: 'Espers and Quickenings',
        name: 'Quickening',
        cells: ['[[#Gil Toss|Gil Toss]] and [[#Libra|Libra]]', '50'],
      },
    ])
  })

  it('fails loudly when the page has no license list', () => {
    expect(() => parseLicenseList('==Profile==\nnothing')).toThrow('no "License list" section')
  })
})
