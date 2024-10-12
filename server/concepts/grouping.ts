import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface GroupingDoc extends BaseDoc {
  creator: ObjectId;
  name: string;
}

/**
 * concept: Grouping [User, Restaurant]
 */
export default class GroupingConcept {
  public readonly groups: DocCollection<GroupingDoc>;

  constructor(collectionName: string) {
    this.groups = new DocCollection<GroupingDoc>(collectionName);
  }

  // make new group
  async create(creator: ObjectId, name: string) {
    const _id = await this.groups.createOne({ creator, name });
    return { msg: "Group successfully created!", group: await this.groups.readOne({ _id }) };
  }

  // get group by name and user
  async getUserGroupByName(creator: ObjectId, name: string) {
    return await this.groups.readMany({ creator, name });
  }

  // get all groups by a user
  async getUserGroups(creator: ObjectId) {
    return await this.groups.readMany({ creator });
  }

  // change group name
  async updateGroupName(_id: ObjectId, name: string) {
    await this.groups.partialUpdateOne({ _id }, { name });
    return { msg: "Group name successfully updated!" };
  }

  // delete group
  async deleteGroup(_id: ObjectId) {
    await this.groups.deleteOne({ _id });
    return { msg: "Group successfully deleted!" };
  }

  // assert user is creator
  async assertUserIsCreator(_id: ObjectId, user: ObjectId) {
    const group = await this.groups.readOne({ _id });
    if (!group) {
      throw new NotFoundError(`Group ${_id} does not exist!`);
    }
    if (group.creator.toString() !== user.toString()) {
      throw new UserCreatorNotMatchError(user, _id);
    }
  }
}

export class UserCreatorNotMatchError extends NotAllowedError {
  constructor(
    public readonly creator: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the creeator of group {1}!", creator, _id);
  }
}
