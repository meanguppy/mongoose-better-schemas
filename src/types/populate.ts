import type { Types } from 'mongoose';
import type {
  Schema,
  PopulateConfig,
  Projection,
} from './projection';

type RemoveSchemaBrand<T> =
  T extends Schema
    ? Omit<T, '__schema'>
    : T;

type AppendPath<Parent extends string, Child> =
  Child extends string
    ? Parent extends ''
      ? Child
      : `${Parent}.${Child}`
    : Parent;

type NullIfNullable<N> =
  N extends false
    ? never
    : null;

type ExpandProjection<T extends Schema, RefVal> =
  RefVal extends 1
    ? null | Projection<T, {}, {}> | null
    : RefVal extends PopulateConfig<infer S, infer P, infer N>
      ? NullIfNullable<N> | Projection<T, S, P>
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

export type Populate<T extends Schema, P, Path extends string = ''> =
  RemoveSchemaBrand<{
    [K in keyof T]: MapPopulate<T[K], P, AppendPath<Path, K>>;
  }>;
