import type { Populate } from './populate';
import type { Select } from './select';

export type Schema<T = unknown> = T & { readonly __schema: unique symbol };

export type NoRef<T extends Schema> = T extends Schema<infer S> ? S : never;

export type SelectConfig = {
  [path: string]: 0 | 1;
};

export type PopulateInfo<
  S extends SelectConfig,
  P extends PopulateConfig,
  N extends boolean,
> =
  | 1
  | { select?: S, populate?: P, nullable?: N, [other: string]: unknown };

export type PopulateConfig = {
  [path: string]: PopulateInfo<SelectConfig, PopulateConfig, boolean>;
};

type Defaults<T> =
  T extends undefined | null
    ? {}
    : unknown extends T
      ? {}
      : T;

export type Projection<T extends Schema, S = {}, P = {}> =
  Select<
    Populate<T, Defaults<P>>,
    Defaults<S>,
    Defaults<P>
  >;
