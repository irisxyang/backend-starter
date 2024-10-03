import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotFoundError } from "./errors";

export interface RestaurantDoc extends BaseDoc {
  name: string;
  address: string;
  url: string;
}

/**
 * concept: Restaurant
 */
export default class RestaurantConcept {
  public readonly restaurants: DocCollection<RestaurantDoc>;

  constructor(collectionName: string) {
    this.restaurants = new DocCollection<RestaurantDoc>(collectionName);
  }

  // add a new restaurant to overall restaurants
  async addRestaurant(name: string, address: string, url: string) {
    const _id = await this.restaurants.createOne({ name, address, url });
    return { msg: "Restaurant successfully added!", restaurant: await this.restaurants.readOne({ _id }) };
  }

  // delete a restaurant
  async removeRestaurant(_id: ObjectId) {
    await this.restaurants.deleteOne({ _id });
    return { msg: "Restaurant successfully removed!" };
  }

  // get all restaurants
  async getRestaurants() {
    return await this.restaurants.readMany({}, { sort: { _id: -1 } });
  }

  // get a specific restaurant by name
  async getRestaurantsByName(name: string) {
    const restaurants = await this.restaurants.readMany({ name });
    if (restaurants === null) {
      throw new NotFoundError(`Restaurant not found!`);
    }
    return restaurants;
  }

  // change information for a restaurant
  async update(_id: ObjectId, name?: string, address?: string, url?: string) {
    await this.restaurants.partialUpdateOne({ _id }, { name, address, url });
    return { msg: "Restaurant successfully updated!" };
  }
}
