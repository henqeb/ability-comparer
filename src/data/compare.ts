import type { Ability, GameData } from './schema'

export type Selection = { classId: string; subclassId?: string }

export type Comparison = {
  // Per selected class: its full ability set (base + chosen subclass).
  all: Record<string, Ability[]>
  // Abilities every selected class has.
  shared: Ability[]
  // Per selected class: abilities none of the comparison classes have.
  // 1 selected → compared against every other class in the game.
  // 2+ selected → compared against the other selected classes only.
  unique: Record<string, Ability[]>
}

// Base-class abilities plus the given subclass's. With subclassId === 'any',
// includes every subclass (used for unselected classes in the 1-class case).
export function abilityIds(data: GameData, classId: string, subclassId?: string | 'any'): Set<string> {
  const ids = new Set<string>()
  for (const link of data.classAbilities) {
    if (link.classId !== classId) continue
    const sub = link.meta.subclass
    if (!sub || subclassId === 'any' || sub === subclassId) ids.add(link.abilityId)
  }
  return ids
}

export function compare(data: GameData, selections: Selection[]): Comparison {
  const classIds = selections.map((s) => s.classId)
  if (new Set(classIds).size !== classIds.length) throw new Error('each class can only be selected once')

  // Keep the game file's ability order so results are stable.
  const toAbilities = (ids: Set<string>) => data.abilities.filter((a) => ids.has(a.id))

  const sets = new Map(selections.map((s) => [s.classId, abilityIds(data, s.classId, s.subclassId)]))

  const others =
    selections.length === 1
      ? data.classes.filter((c) => c.id !== classIds[0]).map((c) => abilityIds(data, c.id, 'any'))
      : null

  const all: Record<string, Ability[]> = {}
  const unique: Record<string, Ability[]> = {}
  for (const [classId, ids] of sets) {
    all[classId] = toAbilities(ids)
    const against = others ?? [...sets].filter(([id]) => id !== classId).map(([, s]) => s)
    unique[classId] = toAbilities(new Set([...ids].filter((id) => !against.some((s) => s.has(id)))))
  }

  const [first, ...rest] = [...sets.values()]
  const shared = first ? toAbilities(new Set([...first].filter((id) => rest.every((s) => s.has(id))))) : []

  return { all, shared, unique }
}
