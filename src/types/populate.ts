import type { Types } from 'mongoose';
import type {
  Schema,
  PopulateInfo,
  Projection,
} from './projection';

type AppendPath<Parent extends string, Child> =
  Child extends string
    ? Parent extends ''
      ? Child
      : `${Parent}.${Child}`
    : Parent;

type ExpandProjection<T extends Schema, RefVal> =
  RefVal extends 1
    ? Projection<T, {}, {}> | null
    : RefVal extends PopulateInfo<infer S, infer P, infer N>
      ? Projection<T, S, P> | (N extends false ? never : null)
      : never;

type MapPopulate<T, P, Path extends string> =
  T extends ReadonlyArray<unknown>
    ? { [N in keyof T]: MapPopulate<T[N], P, Path> }
    : T extends Schema
      ? Path extends keyof P
        ? ExpandProjection<T, P[Path]>
        : Types.ObjectId
      : T extends Record<string, unknown>
        ? { [K in keyof T]: MapPopulate<T[K], P, AppendPath<Path, K>> }
        : T;

export type Populate<T extends Schema, P> = Omit<{
  [K in keyof T]: K extends string ? MapPopulate<T[K], P, K> : never;
}, '__schema'>;
