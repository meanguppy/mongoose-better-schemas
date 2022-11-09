import type { Populate } from './populate';
import type { Select } from './select';

export type Schema<T = unknown> = T & { readonly __schema: unique symbol };
export type SelectConfig = Record<string, 0 | 1>;
export type PopulateConfig<S, P, N extends boolean> = 1 | {
  select?: S;
  populate?: P;
  nullable?: N;
};

type ApplyDefaults<T> =
  T extends undefined | null
    ? {}
    : unknown extends T
      ? {}
      : T;

export type Projection<T extends Schema, S = {}, P = {}> =
  Select<
    Populate<T, ApplyDefaults<P>>,
    ApplyDefaults<S>,
    ApplyDefaults<P>
  >;
