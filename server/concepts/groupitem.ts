import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotFoundError } from "./errors";

export interface GroupItemDoc extends BaseDoc {
  group: ObjectId;
  item: ObjectId;
}

/**
 * concpet: GroupItem [Group, Item]
 */

export default class GroupItemConcept {
  public readonly groupitems: DocCollection<GroupItemDoc>;

  constructor(collectionName: string) {
    this.groupitems = new DocCollection<GroupItemDoc>(collectionName);
  }

  async addGroupItem(group: ObjectId, item: ObjectId) {
    await this.groupitems.createOne({ group, item });
    return { msg: "Added item to group!" };
  }

  async removeGroupItem(group: ObjectId, item: ObjectId) {
    await this.groupitems.deleteOne({ group, item });
    return { msg: "Removed item from group!" };
  }

  async getItemsInGroup(group: ObjectId) {
    const items = await this.groupitems.readMany({ group }, { projection: { item: 1 } });

    return items;
  }

  async deleteAllItemsInGroup(group: ObjectId) {
    await this.groupitems.deleteMany({ group });
    return { msg: "Deleted all instances of group!" };
  }

  // TODO
  async assertItemInGroup(group: ObjectId, item: ObjectId) {
    const pair = await this.groupitems.readOne({ group, item });
    if (!pair) {
      throw new NotFoundError(`Item ${item} not in group ${group}!`);
    }
  }
}
