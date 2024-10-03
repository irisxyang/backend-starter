import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface WeightingDoc extends BaseDoc {
  user: ObjectId;

  food: string;
  ambience: string;
  service: string;
  price: string;
  novelty: string;
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
  async create(user: ObjectId, food: string, ambience: string, service: string, price: string, novelty: string) {
    const _id = await this.weightings.createOne({ user, food, ambience, service, price, novelty });
    return { msg: "Preference successfully created", weighting: await this.weightings.readOne({ _id }) };
  }

  // get weighting for a user
  async getWeightings() {
    // page?
    return await this.weightings.readMany({}, { sort: { _id: -1 } });
  }

  // gets weighting for a specific user
  async getUserWeighting(user: ObjectId) {
    return await this.weightings.readMany({ user });
  }

  // update a weighting
  async update(_id: ObjectId, food?: string, ambience?: string, price?: string, service?: string, novelty?: string) {
    await this.weightings.partialUpdateOne({ _id }, { food, ambience, price, service, novelty });
    return { msg: "Weighting successfully updated!" };
  }

  // reset a weighting
  async reset(_id: ObjectId) {
    const resetWeight = "1";
    await this.weightings.partialUpdateOne({ _id }, { food: resetWeight, ambience: resetWeight, price: resetWeight, service: resetWeight, novelty: resetWeight });
    return { msg: "Review deleted successfully!" };
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
}

export class WeightingUserNotMatchError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the user for weighting {1}!", user, _id);
  }
}
