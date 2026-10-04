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

export type AttributeDef = z.infer<typeof AttributeDefSchema>
export type CategoryDef = z.infer<typeof CategoryDefSchema>
export type Game = z.infer<typeof GameSchema>
export type Subclass = z.infer<typeof SubclassSchema>
export type GameClass = z.infer<typeof GameClassSchema>
export type Ability = z.infer<typeof AbilitySchema>
export type ClassAbility = z.infer<typeof ClassAbilitySchema>
