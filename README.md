# mongoose-better-schemas

Streamline TypeScript schema definitions, and add proper typings for `select` and `populate` projections.

## Why?

The type definitions provided by mongoose are lacking in some of the most crucial areas: schema definition, `select`, and `populate` methods.

Consider the following limitations:

1. **Schema types contain no information regarding the relationships between models: only `ObjectId` is used to signify a reference to _some_ model.**

   Therefore, [these relationships must be specified manually on every single `populate` call](https://mongoosejs.com/docs/typescript/populate.html)! This process quickly becomes unwieldy, all while being completely unchecked and prone to errors:
   * First, all model types being populated must be imported near each instance of `populate`.
   * Next, you must manually write a type that will be merged into the result, which becomes extremely verbose and complex as soon as you encounter any of the following: nested data, arrays, deep-populations, or `select` projections.
     * You will absolutely have to reach for an array of utility types to ensure your type is written correctly.
   * Lastly, the type must be passed as a generic to the `populate` method.

2. **The `select` method has no effect on a query's return type: it assumes the full document is returned each time.**

   Therefore, you must manually write a type that represents the projection and assert it. This can quickly become complex when dealing with nested data or arrays, plus even more so when considering the intricacies of [Mongo exclusive selects](https://www.mongodb.com/docs/manual/tutorial/project-fields-from-query-results/#return-all-but-the-excluded-fields).

#### This process is completely unchecked, anything goes! It is entirely your responsibility to ensure that your types align with ALL of the following:
   * the general structure of the schema
   * the relationships between the models
   * the *actual* paths being populated, including deeper populations
   * the *actual* keys being selected, including those inside deeper populations
   * BONUS: do not forget to track down and update each type when you make a change to any schema!

If any of these steps get botched, your typings will be incorrect without any warning, leading to bugs and/or runtime errors.

## The solution

`mongoose-better-schemas` solves all of the problems listed above with the following setup:

```typescript
import mongoose from 'mongoose';
import { defineSchema, type DefineSchema } from 'mongoose-better-schemas';

// Define schema types
type TDriverSchema = DefineSchema<{
  firstName: string;
  lastName: string;
  vehicles: TVehicleSchema[]; // defines a relationship
  salary: number;
}>;
type TVehicleSchema = DefineSchema<{
  make: string;
  drivers: TDriverSchema[];
  price: number;
}>;

// Construct mongoose Schemas
const DriverSchema = defineSchema<TDriverSchema>()({
  firstName: String,
  lastName: String,
  vehicles: [{ ref: 'Vehicle', type: mongoose.Schema.Types.ObjectId }],
  salary: Number,
});
const VehicleSchema = defineSchema<TVehicleSchema>()({
  make: String,
  drivers: [{ ref: 'Driver', type: mongoose.Schema.Types.ObjectId }],
  price: Number,
});

// Register mongoose Models
const Driver = mongoose.model('Driver', DriverSchema);
const Vehicle = mongoose.model('Vehicle', VehicleSchema);
```

Now use the `findProjected` and `findOneProjected` methods on the models in your application code, instead of the untyped `select` and `populate` methods.

## Usage

```typescript
type QueryOptions = {
  select?: { [path: string]: 0 | 1 }
  populate?: { [path: string]: PopulateInfo | 1 }
  lean?: boolean
  skip?: number
  limit?: number
  sort?: { [path: string]: SortOrder }
};

type PopulateInfo = {
  select?: { [path: string]: 0 | 1 }
  populate?: { [path: string]: 1 | PopulateInfo } // deep-populate
  nullable?: boolean // whether the lookup can yield a null or not
};

// `T` represents the fully transformed schema type (selected and populated)
Model.findProjected(filter: FilterQuery, opts: QueryOptions): Promise<T[]>;
Model.findOneProjected(filter: FilterQuery, opts: QueryOptions): Promise<T | null>;
```

## Notes
* The somewhat strange syntax for the `defineSchema` method is due to [function currying](https://javascript.info/currying-partials). This pattern is a workaround for a limitation with TypeScript, allowing us to partially infer generics: the schema type is passed manually, but the typings for custom query, instance, and static methods can be inferred automatically.