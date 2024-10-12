import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface ReviewDoc extends BaseDoc {
  reviewer: ObjectId;
  restaurant: ObjectId;
  comment: string;

  preference: ObjectId;
}

/**
 * concept: Reviewing [User, Subject, Preference]
 * Subject = Restaurant
 */
export default class ReviewingConcept {
  public readonly reviews: DocCollection<ReviewDoc>;

  constructor(collectionName: string) {
    this.reviews = new DocCollection<ReviewDoc>(collectionName);
  }

  // make a new review
  async create(reviewer: ObjectId, restaurant: ObjectId, comment: string, preference: ObjectId) {
    const _id = await this.reviews.createOne({ reviewer, restaurant, comment, preference });
    return { msg: "Review successfully created!", review: await this.reviews.readOne({ _id }) };
  }

  // get all reviews
  async getReviews(user?: ObjectId, restaurant?: ObjectId) {
    // page?
    let reviews;
    if (user && restaurant) {
      reviews = await this.reviews.readOne({ user, restaurant });
    } else if (user) {
      reviews = await this.reviews.readMany({ user });
    } else if (restaurant) {
      reviews = await this.reviews.readMany({ restaurant });
    } else {
      reviews = await this.reviews.readMany({}, { sort: { _id: -1 } });
    }

    return reviews;
  }

  async getReviewById(_id: ObjectId) {
    return await this.reviews.readOne({ _id });
  }

  // gets reviews by a specific user
  async getByUser(reviewer: ObjectId) {
    return await this.reviews.readMany({ reviewer });
  }

  // update a review
  async update(_id: ObjectId, comment?: string) {
    await this.reviews.partialUpdateOne({ _id }, { comment });
    return { msg: "Review successfully updated!" };
  }

  // delete a review
  async delete(_id: ObjectId) {
    await this.reviews.deleteOne({ _id });
    return { msg: "Review deleted successfully!" };
  }

  // get preference id associated with review
  async getPreferenceId(_id: ObjectId) {
    const preference = (await this.reviews.readOne({ _id }))?.preference;
    return preference;
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

  // assert that review corresponds to the correct Preference instance?
}

export class ReviewReviewerNotMatchError extends NotAllowedError {
  constructor(
    public readonly reviewer: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the reviewer of review {1}!", reviewer, _id);
  }
}
