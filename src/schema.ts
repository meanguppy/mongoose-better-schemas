import mongoose from 'mongoose';
import type { F } from 'ts-toolbelt';
import type {
  FilterQuery,
  Document,
  Model,
  Query,
  SchemaDefinition,
  SchemaOptions,
  Schema as MongooseSchema,
  SortOrder,
} from 'mongoose';
import type {
  Projection,
  Schema,
  SelectConfig,
  PopulateConfig,
} from './types';

type Defaults<T> = unknown extends T ? {} : T;

type PopulateItem = {
  path: string,
  select?: Record<string, 1 | 0>,
  populate?: PopulateItem[],
};

type QueryOptions<S, P, L, N> = {
  select?: F.Narrow<S>;
  populate?: F.Narrow<P>;
  lean?: F.Narrow<L>;
  orFail?: F.Narrow<N>;
  skip?: number;
  limit?: number;
  sort?: Record<string, SortOrder>;
};

function buildPopulateArray(populate: PopulateConfig | undefined): PopulateItem[] {
  if (!populate || typeof populate !== 'object') return [];
  return Object.entries(populate).flatMap(([name, val]) => {
    if (val === 1) return { path: name };
    if (val && typeof val === 'object') {
      const { select = {}, populate: innerPopulate } = val;
      return { path: name, select, populate: buildPopulateArray(innerPopulate) };
    }
    return [];
  });
}

export function defineSchema<T extends Schema>() {
  return function buildSchema<
    O extends SchemaOptions<Projection<T>, unknown, unknown, unknown, unknown> = {},
  >(input: SchemaDefinition<Projection<T>>, schemaOpts?: O) {
    type FinalModel = Model<
      Projection<T>,
      Defaults<O['query']>,
      Defaults<O['methods']>,
      {} // forbid virtuals
    >;

    type AsDoc<Doc> = Document<
      Doc extends { _id?: infer U } ? U : never,
      Defaults<O['query']>,
      Doc
    > & Doc;

    type ResultType<S, P, L> =
      [L] extends [true]
        ? Projection<T, S, P>
        : AsDoc<Projection<T, S, P>> & O['methods'];

    function buildQuery(
      query: Query<unknown, unknown>,
      opts: QueryOptions<unknown, unknown, unknown, unknown>,
    ) {
      const { select, populate, orFail, lean, skip, limit, sort } = opts;
      if (select) query.select(select);
      if (populate) query.populate(buildPopulateArray(populate));
      if (sort) query.sort(sort);
      if (orFail === true) query.orFail();
      if (lean === true) query.lean();
      if (skip !== undefined) query.skip(skip);
      if (limit !== undefined) query.limit(limit);
      return query;
    }

    function findProjected<
      S extends SelectConfig = {},
      P extends PopulateConfig = {},
      L extends boolean = false,
      N extends boolean = false,
    >(
      this: FinalModel,
      filter: FilterQuery<unknown>,
      opts: QueryOptions<S, P, L, N> = {},
    ) {
      // @ts-expect-error: necessary for now
      return buildQuery(this.find(filter), opts).exec() as (
        Promise<ResultType<S, P, L>[]>
      );
    }

    function findOneProjected<
      S extends SelectConfig = {},
      P extends PopulateConfig = {},
      L extends boolean = false,
      N extends boolean = false,
    >(
      this: FinalModel,
      filter: FilterQuery<unknown>,
      opts: QueryOptions<S, P, L, N> = {},
    ) {
      // @ts-expect-error: necessary for now
      return buildQuery(this.findOne(filter), opts).exec() as (
        Promise<ResultType<S, P, L> | (N extends false ? null : never)>
      );
    }

    const projectionStatics = {
      findProjected,
      findOneProjected,
    };

    return new mongoose.Schema(input as never, {
      ...schemaOpts,
      statics: {
        ...(schemaOpts?.statics as Record<string, unknown> || {}),
        ...projectionStatics,
      },
    }) as MongooseSchema<
      Projection<T>,
      FinalModel,
      Defaults<O['methods']>,
      Defaults<O['query']>,
      {}, // forbid virtuals
      O['statics'] & typeof projectionStatics
    >;
  };
}
