import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface ReviewDoc extends BaseDoc {
  reviewer: ObjectId;
  restaurant: ObjectId;
  comment: string;

  food: string;
  ambience: string;
  service: string;
  price: string;
  novelty: string;
}

/**
 * concept: Reviewing [User]
 */
export default class ReviewingConcept {
  public readonly reviews: DocCollection<ReviewDoc>;

  constructor(collectionName: string) {
    this.reviews = new DocCollection<ReviewDoc>(collectionName);
  }

  // make a new review
  async create(reviewer: ObjectId, restaurant: ObjectId, comment: string, food: string, ambience: string, service: string, price: string, novelty: string) {
    const _id = await this.reviews.createOne({ reviewer, restaurant, comment, food, ambience, service, price, novelty });
    return { msg: "Review successfully created!", review: await this.reviews.readOne({ _id }) };
  }

  // get all reviews
  async getReviews() {
    // page?
    return await this.reviews.readMany({}, { sort: { _id: -1 } });
  }

  // gets posts by a specific user
  async getByUser(reviewer: ObjectId) {
    return await this.reviews.readMany({ reviewer });
  }

  // update a review
  async update(_id: ObjectId, comment?: string, food?: string, ambience?: string, price?: string, service?: string, novelty?: string) {
    await this.reviews.partialUpdateOne({ _id }, { comment, food, ambience, price, service, novelty });
    return { msg: "Review successfully updated!" };
  }

  // delete a review
  async delete(_id: ObjectId) {
    await this.reviews.deleteOne({ _id });
    return { msg: "Review deleted successfully!" };
  }

  // assert that the reviewer of a review is a user
  async assertReviewerIsUser(_id: ObjectId, user: ObjectId) {
    const review = await this.reviews.readOne({ _id });
    if (!review) {
      throw new NotFoundError(`Review ${_id} does not exist!`);
    }
    if (review.reviewer.toString() !== user.toString()) {
      throw new ReviewReviewerNotMatchError(user, _id);
    }
  }
}

export class ReviewReviewerNotMatchError extends NotAllowedError {
  constructor(
    public readonly reviewer: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the reviewer of review {1}!", reviewer, _id);
  }
}
