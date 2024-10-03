import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Authing, Friending, Posting, Sessioning } from "./app";
import { PostOptions } from "./concepts/posting";
import { SessionDoc } from "./concepts/sessioning";
import Responses from "./responses";

import { z } from "zod";

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
    return { message: "getRestaurants" };
  }

  // add new restaurant
  @Router.post("/restaurants")
  async addRestaurant(name: string, address: string, url: string) {
    // sync with deleting reviews for that restaurant?
    return { message: "addRestaurant" };
  }

  // update restaurant info
  @Router.patch("/restaurants/:id")
  async updateRestaurantInfo(id: string, name?: string, address?: string, url?: string) {
    return { message: "updateRestaurantInfo, id: " + id };
  }

  // delete restaurant
  @Router.delete("/restaurants/:id")
  async deleteRestaurant(id: string) {
    // sync with deleting reviews for that restaurant?
    return { message: "addRestaurant" };
  }

  // gets weightings for a user
  @Router.get("/weightings")
  async getUserWeighting(session: SessionDoc) {
    // only able to get your own weightings
    return { message: "getUserWeighting" };
  }

  // adds a new weighting for a user
  @Router.post("/weightings")
  async addWeighting(session: SessionDoc, food: string, ambience: string, service: string, price: string, novelty: string) {
    // sync w creating a user?
    return { message: "addWeighting" };
  }

  // update weighting
  @Router.patch("/weightings/:id")
  async updateWeightingForUser(session: SessionDoc, id: string, food?: string, ambience?: string, service?: string, price?: string, novelty?: string) {
    return { message: "updateWeightingForUser" };
  }

  // reset weightings
  @Router.patch("/weightings/reset/:id")
  async resetWeightingForUser(session: SessionDoc, id: string) {
    return { message: "resetWeightingForUser" };
  }

  // get reviews (all, by user, or for a restaurant)
  @Router.get("/reviews")
  async getReviews(reviewer?: string, restaurant?: string) {
    return { message: "getReviews" };
  }

  // create a new review
  @Router.post("/reviews")
  async createReview(session: SessionDoc, restaurant: string, comment: string, food: string, ambience: string, service: string, price: string, novelty: string) {
    return { message: "createReview" };
  }

  // update review
  @Router.patch("/reviews/:id")
  async updateReview(session: SessionDoc, id: string, comment?: string, food?: string, ambience?: string, service?: string, price?: string, novelty?: string) {
    return { message: "updateReview" };
  }

  // delete review
  @Router.delete("/reviews/:id")
  async deleteReview(session: SessionDoc, id: string) {
    return { message: "deleteReview" };
  }

  // get group by user (by name possibly)
  @Router.get("/groups/user")
  async getUserGroups(session: SessionDoc, user: string, name?: string) {
    // only able to get user's groups if you are friends with them
    return { message: "getUserGroups" };
  }

  // create new group
  @Router.post("/groups")
  async createGroup(session: SessionDoc, name: string, restaurants: Array<string>) {
    return { message: "createGroup" };
  }

  // delete existing group
  @Router.delete("/groups/:id")
  async deleteGroup(session: SessionDoc, id: string) {
    return { message: "deleteGroup" };
  }

  // add restaurant to group
  @Router.patch("/groups/:id")
  async addRestaurantToGroup(session: SessionDoc, id: string, restaurant: string) {
    return { message: "addRestaurantToGroup" };
  }

  // delete restaurant from group
  @Router.patch("/groups/:id")
  async deleteRestaurantFromGroup(session: SessionDoc, id: string, restaurant: string) {
    return { message: "deleteRestaurantFromGroup" };
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
