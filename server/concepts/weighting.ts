import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface WeightingDoc extends BaseDoc {
  user: ObjectId;

  preference: ObjectId;
}

/**
 * concept: Weighting [User]
 */
export default class WeightingConcept {
  public readonly weightings: DocCollection<WeightingDoc>;

  constructor(collectionName: string) {
    this.weightings = new DocCollection<WeightingDoc>(collectionName);
  }

  // create a new weighting set for a user
  async create(user: ObjectId, preference: ObjectId) {
    const _id = await this.weightings.createOne({ user, preference });
    return { msg: "Weighting successfully created", weighting: await this.weightings.readOne({ _id }) };
  }

  // gets weighting for a specific user
  async getUserWeighting(user: ObjectId) {
    return await this.weightings.readOne({ user });
  }

  // update a weighting
  async update(_id: ObjectId, preference: ObjectId) {
    await this.weightings.partialUpdateOne({ _id }, { preference });
    return { msg: "Weighting successfully updated!" };
  }

  async getPreferenceId(_id: ObjectId) {
    const preference = (await this.weightings.readOne({ _id }))?.preference;
    return preference;
  }

  // assert that the weighting corresponds to a user
  async assertUserWeighting(_id: ObjectId, user: ObjectId) {
    const weighting = await this.weightings.readOne({ _id });
    if (!weighting) {
      throw new NotFoundError(`Weighting ${_id} does not exist!`);
    }
    if (weighting.user.toString() !== user.toString()) {
      throw new WeightingUserNotMatchError(user, _id);
    }
  }

  // assert that user does not already have a weighting
  async assertUserWeightingDoesNotExist(user: ObjectId) {
    const weighting = await this.weightings.readOne({ user });
    if (weighting) {
      throw new NotAllowedError(`Weighting for ${user} already exists!`);
    }
  }

  // assert that the weighting corresponds to the correct Preference instance
  async assertPreferenceWeighting(_id: ObjectId, preference: ObjectId) {
    const weighting = await this.weightings.readOne({ _id });
    if (!weighting) {
      throw new NotFoundError(`Weighting ${_id} does not exist!`);
    }
    if (weighting.preference.toString() !== preference.toString()) {
      throw new WeightingPreferenceNotMatchError(preference, _id);
    }
  }
}

export class WeightingUserNotMatchError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the user for weighting {1}!", user, _id);
  }
}

export class WeightingPreferenceNotMatchError extends NotAllowedError {
  constructor(
    public readonly preference: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the preference for weighting {1}!", preference, _id);
  }
}
