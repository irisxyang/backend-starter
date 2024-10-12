import { ObjectId } from "mongodb";

import { getExpressRouter, Router } from "./framework/router";

import { Authing, Friending, Grouping, GroupRestaurant, Posting, Preference, Restaurant, Reviewing, Sessioning, Weighting } from "./app";
import { PostOptions } from "./concepts/posting";
import { SessionDoc } from "./concepts/sessioning";
import Responses from "./responses";

import { z } from "zod";
import { NotAllowedError } from "./concepts/errors";

/**
 * Web server routes for the app. Implements synchronizations between concepts.
 */
class Routes {
  // Synchronize the concepts from `app.ts`.

  // @Router.get("/test/:arg")
  // test(arg: string) {
  //   return { message: "you said " + arg };
  // }

  // get all restaurants
  @Router.get("/restaurants")
  async getRestaurants() {
    const restaurants = await Restaurant.getRestaurants();
    return restaurants;
  }

  // add new restaurant
  @Router.post("/restaurants")
  async addRestaurant(name: string, address: string, url: string) {
    const restaurant = await Restaurant.addRestaurant(name, address, url);
    return { msg: restaurant.msg, restaurant: restaurant };
  }

  // update restaurant info
  @Router.patch("/restaurants/:id")
  async updateRestaurantInfo(id: string, name?: string, address?: string, url?: string) {
    const oid = new ObjectId(id);
    return await Restaurant.update(oid, name, address, url);
  }

  // delete restaurant
  @Router.delete("/restaurants/:id")
  async deleteRestaurant(id: string) {
    // sync with deleting reviews for that restaurant?
    const oid = new ObjectId(id);
    return await Restaurant.removeRestaurant(oid);
  }

  // create a weighting for a user
  @Router.post("/user/weightings")
  async createUserWeighting(session: SessionDoc, food: string, ambience: string, service: string, price: string, novelty: string) {
    const user = Sessioning.getUser(session);
    // each user should only have one weighting
    await Weighting.assertUserWeightingDoesNotExist(user);

    // cast to int
    const foodNum = food ? parseInt(food) : 0;
    const ambienceNum = ambience ? parseInt(ambience) : 0;
    const serviceNum = service ? parseInt(service) : 0;
    const priceNum = price ? parseInt(price) : 0;
    const noveltyNum = novelty ? parseInt(novelty) : 0;

    const preference = await Preference.createPreference(foodNum, ambienceNum, serviceNum, priceNum, noveltyNum);

    return await Weighting.create(user, preference.preference);
  }

  // get weighting preferences for a user
  @Router.get("/user/weightings")
  async getUserWeightingPreference(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    const weightingId = (await Weighting.getUserWeighting(user))?._id;
    if (!weightingId) {
      throw new NotAllowedError("Weighting does not exist!");
    }
    const preferenceId = await Weighting.getPreferenceId(weightingId);
    if (!preferenceId) {
      throw new NotAllowedError("Weighting does not exist!");
    }
    const prefs = await Preference.preferencesToNumbers(preferenceId);
    return { food: prefs.get("food"), service: prefs.get("service"), ambience: prefs.get("ambience"), price: prefs.get("price"), novelty: prefs.get("novelty") };
  }

  // update user weightings
  @Router.patch("/user/weightings")
  async updateUserWeighting(session: SessionDoc, food: string, ambience: string, service: string, price: string, novelty: string) {
    const user = Sessioning.getUser(session);

    const preferenceId = (await Weighting.getUserWeighting(user))?.preference;
    if (!preferenceId) {
      throw new NotAllowedError("preference does not exist!");
    }

    // cast to int
    const foodNum = food ? parseInt(food) : undefined;
    const ambienceNum = ambience ? parseInt(ambience) : undefined;
    const serviceNum = service ? parseInt(service) : undefined;
    const priceNum = price ? parseInt(price) : undefined;
    const noveltyNum = novelty ? parseInt(novelty) : undefined;

    return await Preference.updatePreference(preferenceId, foodNum, ambienceNum, serviceNum, priceNum, noveltyNum);
  }

  // get reviews (all, by user, or for a restaurant)
  @Router.get("/reviews")
  async getReviews(reviewer?: string, restaurant?: string) {
    let userId;
    let restaurantId;
    if (reviewer) {
      userId = new ObjectId(reviewer);
    }
    if (restaurant) {
      restaurantId = new ObjectId(restaurant);
    }
    return await Reviewing.getReviews(userId, restaurantId);
  }

  // create a new review
  @Router.post("/reviews")
  async createReview(session: SessionDoc, restaurant: string, comment: string, food: string, ambience: string, service: string, price: string, novelty: string) {
    const user = Sessioning.getUser(session);
    // cast to int
    const foodNum = food ? parseInt(food) : 0;
    const ambienceNum = ambience ? parseInt(ambience) : 0;
    const serviceNum = service ? parseInt(service) : 0;
    const priceNum = price ? parseInt(price) : 0;
    const noveltyNum = novelty ? parseInt(novelty) : 0;

    const preference = await Preference.createPreference(foodNum, ambienceNum, serviceNum, priceNum, noveltyNum);

    const restaurantId = new ObjectId(restaurant);

    return await Reviewing.create(user, restaurantId, comment, preference.preference);
  }

  // get review preference
  @Router.get("/review/preference")
  async getReviewPreference(review: string) {
    const reviewId = new ObjectId(review);
    const preferenceId = await Reviewing.getPreferenceId(reviewId);
    if (!preferenceId) {
      throw new Error("Preference does not exist!");
    }
    const prefs = await Preference.preferencesToNumbers(preferenceId);
    return { food: prefs.get("food"), service: prefs.get("service"), ambience: prefs.get("ambience"), price: prefs.get("price"), novelty: prefs.get("novelty") };
  }

  // update review
  @Router.patch("/reviews/:id")
  async updateReview(session: SessionDoc, id: string, comment?: string, food?: string, ambience?: string, service?: string, price?: string, novelty?: string) {
    const user = Sessioning.getUser(session);

    // cast to int
    const foodNum = food ? parseInt(food) : undefined;
    const ambienceNum = ambience ? parseInt(ambience) : undefined;
    const serviceNum = service ? parseInt(service) : undefined;
    const priceNum = price ? parseInt(price) : undefined;
    const noveltyNum = novelty ? parseInt(novelty) : undefined;

    const reviewId = new ObjectId(id);

    // make sure reviewer is the same as session user
    // i.e. cannot update review if not the reviewer
    await Reviewing.assertReviewerIsUser(reviewId, user);

    const preferenceId = (await Reviewing.getReviewById(reviewId))?.preference;
    if (!preferenceId) {
      throw new NotAllowedError("preference does not exist!");
    }

    // update preference
    await Preference.updatePreference(preferenceId, foodNum, ambienceNum, serviceNum, priceNum, noveltyNum);

    // update review
    return await Reviewing.update(reviewId, comment);
  }

  // delete review
  @Router.delete("/reviews/:id")
  async deleteReview(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);

    const reviewId = new ObjectId(id);
    return await Reviewing.delete(reviewId);
  }

  // get group by user (TODO: by name?)
  @Router.get("/groups/user")
  async getUserGroups(session: SessionDoc, user: string) {
    // only able to get user's groups if you are friends with them?
    const userId = new ObjectId(user);

    return await Grouping.getUserGroups(userId);
  }

  // create new group
  @Router.post("/groups")
  async createGroup(session: SessionDoc, name: string) {
    const user = Sessioning.getUser(session);
    return await Grouping.create(user, name);
  }

  // delete existing group
  @Router.delete("/groups/:id")
  async deleteGroup(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    // only creator should be able to delete the group
    await Grouping.assertUserIsCreator(oid, user);
    await GroupRestaurant.deleteAllItemsInGroup(oid);

    return await Grouping.deleteGroup(oid);
  }

  // get restaurants in a group
  @Router.get("/group/restaurants")
  async getRestaurantsInGroup(id: string) {
    const groupId = new ObjectId(id);
    const restaurants = await GroupRestaurant.getItemsInGroup(groupId);
    return restaurants;
  }

  // add restaurant to group
  @Router.post("/group/add/:restaurant")
  async addRestaurantToGroup(session: SessionDoc, id: string, restaurant: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);

    // only creator should be able to add to group
    await Grouping.assertUserIsCreator(oid, user);

    const restaurantId = new ObjectId(restaurant);
    return await GroupRestaurant.addGroupItem(oid, restaurantId);
  }

  // delete restaurant from group
  @Router.delete("/group/remove/:restaurant")
  async deleteRestaurantFromGroup(session: SessionDoc, id: string, restaurant: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);

    // only creator should be able to delete from group
    await Grouping.assertUserIsCreator(oid, user);

    const restaurantId = new ObjectId(restaurant);
    return await GroupRestaurant.removeGroupItem(oid, restaurantId);
  }

  @Router.get("/session")
  async getSessionUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await Authing.getUsers();
  }

  @Router.get("/users/:username")
  @Router.validate(z.object({ username: z.string().min(1) }))
  async getUser(username: string) {
    return await Authing.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: SessionDoc, username: string, password: string) {
    Sessioning.isLoggedOut(session);
    return await Authing.create(username, password);
  }

  @Router.patch("/users/username")
  async updateUsername(session: SessionDoc, username: string) {
    const user = Sessioning.getUser(session);
    return await Authing.updateUsername(user, username);
  }

  @Router.patch("/users/password")
  async updatePassword(session: SessionDoc, currentPassword: string, newPassword: string) {
    const user = Sessioning.getUser(session);
    return Authing.updatePassword(user, currentPassword, newPassword);
  }

  @Router.delete("/users")
  async deleteUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    Sessioning.end(session);
    return await Authing.delete(user);
  }

  @Router.post("/login")
  async logIn(session: SessionDoc, username: string, password: string) {
    const u = await Authing.authenticate(username, password);
    Sessioning.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: SessionDoc) {
    Sessioning.end(session);
    return { msg: "Logged out!" };
  }

  @Router.get("/posts")
  @Router.validate(z.object({ author: z.string().optional() }))
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await Authing.getUserByUsername(author))._id;
      posts = await Posting.getByAuthor(id);
    } else {
      posts = await Posting.getPosts();
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: SessionDoc, content: string, options?: PostOptions) {
    const user = Sessioning.getUser(session);
    const created = await Posting.create(user, content, options);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:id")
  async updatePost(session: SessionDoc, id: string, content?: string, options?: PostOptions) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);
    return await Posting.update(oid, content, options);
  }

  @Router.delete("/posts/:id")
  async deletePost(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);
    return Posting.delete(oid);
  }

  @Router.get("/friends")
  async getFriends(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.idsToUsernames(await Friending.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: SessionDoc, friend: string) {
    const user = Sessioning.getUser(session);
    const friendOid = (await Authing.getUserByUsername(friend))._id;
    return await Friending.removeFriend(user, friendOid);
  }

  @Router.get("/friend/requests")
  async getRequests(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Responses.friendRequests(await Friending.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.sendRequest(user, toOid);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.removeRequest(user, toOid);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.acceptRequest(fromOid, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.rejectRequest(fromOid, user);
  }
}

/** The web app. */
export const app = new Routes();

/** The Express router. */
export const appRouter = getExpressRouter(app);
