import type { O, String } from 'ts-toolbelt';
import type { Types } from 'mongoose';

type TargetPaths<S> =
  keyof S extends string
    ? String.Split<keyof S, '.'>
    : never;

type ProjectionMap<T extends Record<string, unknown[]>> = {
  [K in keyof T]:
    T[K] extends []
      ? 1
      : T[K] extends string[]
        ? MergePathTuples<T[K]>
        : never;
};

type MergePathTuples<PS extends ReadonlyArray<string>> = ProjectionMap<{
  [K in PS[0]]: PS extends [K, ...infer Rest] ? Rest : never;
}>;

type SelectInclusive<T, S> =
  T extends ReadonlyArray<unknown>
    ? { [K in keyof T]: SelectInclusive<T[K], S> }
    : {
      [K in keyof T as K extends keyof S ? K : never]:
        K extends keyof S
          ? S[K] extends 1
            ? T[K]
            : SelectInclusive<T[K], S[K]>
          : never;
    };

type PartOfExcludePath<K, S> =
  K extends keyof S
    ? S[K] extends 1 // exclude key if at the end of the path
      ? never
      : K // but include if in the middle of the path
    : K;

type SelectExclusive<T, S> =
  T extends ReadonlyArray<unknown>
    ? { [K in keyof T]: SelectExclusive<T[K], S> }
    : {
      [K in keyof T as PartOfExcludePath<K, S>]:
        K extends keyof S
          ? SelectExclusive<T[K], S[K]>
          : T[K];
    };

type SelectBranch<T extends object, S, P = {}> =
  S[keyof S] extends 0
    ? SelectExclusive<T, MergePathTuples<TargetPaths<S>>>
    : S[keyof S] extends 1
      ? SelectInclusive<T, MergePathTuples<TargetPaths<S & P>>>
      : never;

export type Select<T extends object, S = {}, P = {}> =
  S extends { _id: 0 }
    ? SelectBranch<Omit<T, '_id'>, Omit<S, '_id'>, P>
    : { _id: 1 } extends S
      ? {} extends S
        ? O.Merge<{ _id: Types.ObjectId }, T>
        : SelectBranch<O.Merge<{ _id: Types.ObjectId }, T>, { _id: 1 }, P>
      : O.Merge<{ _id: Types.ObjectId }, SelectBranch<T, Omit<S, '_id'>, P>>;
