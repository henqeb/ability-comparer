import { z } from 'zod'

// Namespaced, stable IDs: "<gameId>:<slug>", e.g. "bg3:cure-wounds".
const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'must be a lowercase-kebab slug')
const namespacedId = z.string().regex(/^[a-z0-9]+:[a-z0-9]+(-[a-z0-9]+)*$/, 'must be "<gameId>:<slug>"')

export const AttributeDefSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'number']),
})

export const CategoryDefSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  hiddenByDefault: z.boolean().default(false),
})

export const GameSchema = z.object({
  id: slug,
  name: z.string().min(1),
  sourceUrl: z.url(),
  attributeDefs: z.array(AttributeDefSchema).default([]),
  categories: z.array(CategoryDefSchema).min(1),
})

export const SubclassSchema = z.object({
  id: namespacedId,
  name: z.string().min(1),
})

export const GameClassSchema = z.object({
  id: namespacedId,
  name: z.string().min(1),
  iconPath: z.string().optional(),
  subclasses: z.array(SubclassSchema).default([]),
})

export const AbilitySchema = z.object({
  id: namespacedId,
  name: z.string().min(1),
  description: z.string(),
  iconPath: z.string().optional(),
  category: z.string().min(1),
  attributes: z.record(z.string(), z.union([z.string(), z.number()])).default({}),
})

export const ClassAbilitySchema = z.object({
  classId: namespacedId,
  abilityId: namespacedId,
  meta: z
    .object({
      level: z.number().int().positive().optional(),
      subclass: namespacedId.optional(),
    })
    .default({}),
})

// One file per game: src/data/games/<gameId>.json
export const GameDataSchema = z
  .object({
    game: GameSchema,
    classes: z.array(GameClassSchema).min(1),
    abilities: z.array(AbilitySchema),
    classAbilities: z.array(ClassAbilitySchema),
  })
  .superRefine((data, ctx) => {
    const gameId = data.game.id
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: 'custom', path, message })

    const checkUnique = (ids: string[], path: string) => {
      const seen = new Set<string>()
      ids.forEach((id, i) => {
        if (seen.has(id)) issue([path, i, 'id'], `duplicate id "${id}"`)
        seen.add(id)
      })
    }
    checkUnique(data.classes.map((c) => c.id), 'classes')
    checkUnique(data.abilities.map((a) => a.id), 'abilities')

    const prefix = `${gameId}:`
    data.classes.forEach((c, i) => {
      if (!c.id.startsWith(prefix)) issue(['classes', i, 'id'], `must start with "${prefix}"`)
    })
    data.abilities.forEach((a, i) => {
      if (!a.id.startsWith(prefix)) issue(['abilities', i, 'id'], `must start with "${prefix}"`)
    })

    const categoryIds = new Set(data.game.categories.map((c) => c.id))
    data.abilities.forEach((a, i) => {
      if (!categoryIds.has(a.category)) issue(['abilities', i, 'category'], `unknown category "${a.category}"`)
    })

    const attributeKeys = new Set(data.game.attributeDefs.map((d) => d.key))
    data.abilities.forEach((a, i) => {
      for (const key of Object.keys(a.attributes)) {
        if (!attributeKeys.has(key)) issue(['abilities', i, 'attributes', key], `no attributeDef for "${key}"`)
      }
    })

    const classById = new Map(data.classes.map((c) => [c.id, c]))
    const abilityIds = new Set(data.abilities.map((a) => a.id))
    const links = new Set<string>()
    data.classAbilities.forEach((link, i) => {
      const cls = classById.get(link.classId)
      if (!cls) issue(['classAbilities', i, 'classId'], `unknown class "${link.classId}"`)
      if (!abilityIds.has(link.abilityId)) issue(['classAbilities', i, 'abilityId'], `unknown ability "${link.abilityId}"`)
      const sub = link.meta.subclass
      if (cls && sub && !cls.subclasses.some((s) => s.id === sub)) {
        issue(['classAbilities', i, 'meta', 'subclass'], `"${sub}" is not a subclass of "${cls.id}"`)
      }
      const key = `${link.classId}|${link.abilityId}|${sub ?? ''}`
      if (links.has(key)) issue(['classAbilities', i], `duplicate link ${key}`)
      links.add(key)
    })
  })

export type AttributeDef = z.infer<typeof AttributeDefSchema>
export type CategoryDef = z.infer<typeof CategoryDefSchema>
export type Game = z.infer<typeof GameSchema>
export type Subclass = z.infer<typeof SubclassSchema>
export type GameClass = z.infer<typeof GameClassSchema>
export type Ability = z.infer<typeof AbilitySchema>
export type ClassAbility = z.infer<typeof ClassAbilitySchema>
export type GameData = z.infer<typeof GameDataSchema>
