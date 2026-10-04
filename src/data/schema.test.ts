import { describe, expect, it } from 'vitest'
import { GameDataSchema } from './schema'

const valid = () => ({
  game: {
    id: 'test',
    name: 'Test Game',
    sourceUrl: 'https://example.com',
    attributeDefs: [{ key: 'mp', label: 'MP cost', type: 'number' }],
    categories: [{ id: 'spell', label: 'Spell' }],
  },
  classes: [
    { id: 'test:mage', name: 'Mage', subclasses: [{ id: 'test:fire-mage', name: 'Fire Mage' }] },
    { id: 'test:cleric', name: 'Cleric' },
  ],
  abilities: [
    { id: 'test:heal', name: 'Heal', description: 'Heals.', category: 'spell', attributes: { mp: 4 } },
    { id: 'test:fire', name: 'Fire', description: 'Burns.', category: 'spell' },
  ],
  classAbilities: [
    { classId: 'test:mage', abilityId: 'test:heal' },
    { classId: 'test:cleric', abilityId: 'test:heal', meta: { level: 1 } },
    { classId: 'test:mage', abilityId: 'test:fire', meta: { subclass: 'test:fire-mage', level: 3 } },
  ],
})

const errors = (data: unknown) => {
  const r = GameDataSchema.safeParse(data)
  return r.success ? [] : r.error.issues.map((i) => i.message)
}

describe('GameDataSchema', () => {
  it('accepts valid data and fills defaults', () => {
    const r = GameDataSchema.parse(valid())
    expect(r.classes[1].subclasses).toEqual([])
    expect(r.classAbilities[0].meta).toEqual({})
    expect(r.game.categories[0].hiddenByDefault).toBe(false)
  })

  it('rejects ids without the game prefix', () => {
    const d = valid()
    d.abilities[0].id = 'other:heal'
    expect(errors(d)).toContain('must start with "test:"')
  })

  it('rejects duplicate ability ids', () => {
    const d = valid()
    d.abilities[1].id = 'test:heal'
    expect(errors(d)).toContain('duplicate id "test:heal"')
  })

  it('rejects links to unknown classes and abilities', () => {
    const d = valid()
    d.classAbilities.push({ classId: 'test:bard', abilityId: 'test:nope' })
    expect(errors(d)).toEqual(expect.arrayContaining(['unknown class "test:bard"', 'unknown ability "test:nope"']))
  })

  it('rejects a subclass that belongs to another class', () => {
    const d = valid()
    d.classAbilities.push({ classId: 'test:cleric', abilityId: 'test:fire', meta: { subclass: 'test:fire-mage', level: 1 } })
    expect(errors(d)).toContain('"test:fire-mage" is not a subclass of "test:cleric"')
  })

  it('rejects unknown categories and attribute keys', () => {
    const d = valid()
    d.abilities[1].category = 'augment'
    ;(d.abilities[1] as { attributes?: object }).attributes = { range: 'far' }
    expect(errors(d)).toEqual(expect.arrayContaining(['unknown category "augment"', 'no attributeDef for "range"']))
  })
})
