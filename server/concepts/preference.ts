import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError } from "./errors";

export interface PreferenceDoc extends BaseDoc {
  food: number;
  ambience: number;
  service: number;
  price: number;
  novelty: number;
}

/**
 * concept: Preference [Object]
 */

export default class PreferenceConcept {
  public readonly preferences: DocCollection<PreferenceDoc>;

  constructor(collectionName: string) {
    this.preferences = new DocCollection<PreferenceDoc>(collectionName);
  }

  // create new preference
  async createPreference(food: number, ambience: number, service: number, price: number, novelty: number) {
    const _id = await this.preferences.createOne({ food, ambience, service, price, novelty });
    return { msg: "Preference successfully created!", preference: _id };
  }

  // get preference by id
  async getPreferenceById(_id: ObjectId) {
    return await this.preferences.readOne({ _id });
  }

  // allows editing of preference attribute values
  async updatePreference(_id: ObjectId, food?: number, ambience?: number, service?: number, price?: number, novelty?: number) {
    const curPref = await this.getPreferenceById(_id);
    if (!curPref) {
      throw new NotAllowedError("Preference does not exist!");
    }
    const foodNum = food ? food : curPref.food;
    const ambienceNum = ambience ? ambience : curPref.ambience;
    const serviceNum = service ? service : curPref.service;
    const priceNum = price ? price : curPref.price;
    const noveltyNum = novelty ? novelty : curPref.novelty;
    await this.preferences.partialUpdateOne({ _id }, { food: foodNum, ambience: ambienceNum, service: serviceNum, price: priceNum, novelty: noveltyNum });
    return { msg: "Preference successfully updated!" };
  }

  async preferencesToNumbers(_id: ObjectId) {
    const prefToNum = new Map<string, number>();
    const preference = await this.preferences.readOne({ _id });
    if (!preference) {
      throw new NotAllowedError("Preference does not exist!");
    }
    prefToNum.set("food", preference.food);
    prefToNum.set("ambience", preference.ambience);
    prefToNum.set("service", preference.service);
    prefToNum.set("price", preference.price);
    prefToNum.set("novelty", preference.novelty);

    return prefToNum;
  }

  // delete preference
  async deletePreference(_id: ObjectId) {
    await this.preferences.deleteOne({ _id });
    return { msg: "Preference deleted successfully!" };
  }
}
