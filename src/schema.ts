import mongoose from 'mongoose';
import type { F } from 'ts-toolbelt';
import type {
  FilterQuery,
  HydratedDocument,
  Model,
  Query,
  SchemaDefinition,
  SchemaOptions,
  Schema as MongooseSchema,
} from 'mongoose';
import type { Projection, Schema } from './types/projection';

type Defaults<T> = unknown extends T ? {} : T;

function buildPopulateArray(populate: unknown) {
  // TODO
  return [];
}

export function defineSchema<T extends Schema>() {
  return function buildSchema<
    O extends SchemaOptions<'type', Projection<T>, unknown, unknown, unknown, unknown>,
  >(input: SchemaDefinition<Projection<T>>, opts?: O) {
    type FinalModel = Model<
      Projection<T>,
      Defaults<O['query']>,
      Defaults<O['methods']>,
      {} // forbid virtuals
    >;

    function findProjected<S, P>(
      this: FinalModel,
      filter: FilterQuery<unknown>,
      select?: F.Narrow<S>,
      populate?: F.Narrow<P>,
    ) {
      const q = this.find(filter);
      if (select) q.select(select);
      if (populate) q.populate(buildPopulateArray(populate));
      return q as unknown as Query<
        HydratedDocument<Projection<T, S, P>, Defaults<O['methods']>>[],
        Projection<T, S, P>,
        Defaults<O['query']>
      >;
    }

    function findOneProjected<S, P>(
      this: FinalModel,
      filter: FilterQuery<unknown>,
      select?: F.Narrow<S>,
      populate?: F.Narrow<P>,
    ) {
      const q = this.findOne(filter);
      if (select) q.select(select);
      if (populate) q.populate(buildPopulateArray(populate));
      return q as unknown as Query<
        HydratedDocument<Projection<T, S, P>, Defaults<O['methods']>> | null,
        Projection<T, S, P>,
        Defaults<O['query']>
      >;
    }

    const projectionStatics = {
      findProjected,
      findOneProjected,
    };

    type FinalSchema = MongooseSchema<
      Projection<T>,
      FinalModel,
      Defaults<O['methods']>,
      Defaults<O['query']>,
      {}, // forbid virtuals
      O['statics'] & typeof projectionStatics
    >;

    return new mongoose.Schema(input as never, {
      ...opts,
      statics: {
        ...(opts?.statics ?? {}),
        ...projectionStatics,
      },
    }) as FinalSchema;
  };
}
