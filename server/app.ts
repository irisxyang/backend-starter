import AuthenticatingConcept from "./concepts/authenticating";
import FriendingConcept from "./concepts/friending";
import GroupingConcept from "./concepts/grouping";
import GroupItemConcept from "./concepts/groupitem";
import PostingConcept from "./concepts/posting";
import PreferenceConcept from "./concepts/preference";
import RestaurantConcept from "./concepts/restaurant";
import ReviewingConcept from "./concepts/review";
import SessioningConcept from "./concepts/sessioning";
import WeightingConcept from "./concepts/weighting";

// The app is a composition of concepts instantiated here
// and synchronized together in `routes.ts`.
export const Sessioning = new SessioningConcept();
export const Authing = new AuthenticatingConcept("users");
export const Posting = new PostingConcept("posts");
export const Friending = new FriendingConcept("friends");
export const Restaurant = new RestaurantConcept("restaurants");
export const Grouping = new GroupingConcept("groupings");
export const GroupRestaurant = new GroupItemConcept("grouprestaurant");
export const Reviewing = new ReviewingConcept("reviews");
export const Weighting = new WeightingConcept("weightings");
export const Preference = new PreferenceConcept("preferences");
// preferences associated with reviews
export const PreferenceR = new PreferenceConcept("preferencer");
// preferences associated with user
export const PreferenceU = new PreferenceConcept("preferenceu");
