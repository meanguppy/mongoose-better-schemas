import mongoose from 'mongoose';
import { defineSchema } from './schema';
import type { Projection, Schema } from './types/projection';

export type TVideoSchema = Schema<{ url: string }>;

export type TProfileSchema = Schema<{
  name: string;
  createdAt: Date;
  video: TVideoSchema;
  nested: {
    video: TVideoSchema;
  }[];
}>;

export type TProfile<S = {}, P = {}> = Projection<TProfileSchema, S, P>;

const ProfileSchema = defineSchema<TProfileSchema>()({
  name: String,
  createdAt: Date,
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
  },
});

const Profile = mongoose.model('Profile', ProfileSchema);

async function main() {
  const profile1 = await Profile.findOne({});
  const profile2 = await Profile.findProjected({}, { name: 1 }, { video: 1 });
}

main();
