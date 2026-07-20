/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _helpers from "../_helpers.js";
import type * as admin from "../admin.js";
import type * as audit from "../audit.js";
import type * as backfill from "../backfill.js";
import type * as community from "../community.js";
import type * as drops from "../drops.js";
import type * as http from "../http.js";
import type * as invites from "../invites.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as lib_rateLimiter from "../lib/rateLimiter.js";
import type * as portals from "../portals.js";
import type * as seedBelleVendors from "../seedBelleVendors.js";
import type * as seedNewSuppliers from "../seedNewSuppliers.js";
import type * as seedSuppliers from "../seedSuppliers.js";
import type * as stats from "../stats.js";
import type * as stripe from "../stripe.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";
import type * as waitlist from "../waitlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  _helpers: typeof _helpers;
  admin: typeof admin;
  audit: typeof audit;
  backfill: typeof backfill;
  community: typeof community;
  drops: typeof drops;
  http: typeof http;
  invites: typeof invites;
  "lib/permissions": typeof lib_permissions;
  "lib/rateLimiter": typeof lib_rateLimiter;
  portals: typeof portals;
  seedBelleVendors: typeof seedBelleVendors;
  seedNewSuppliers: typeof seedNewSuppliers;
  seedSuppliers: typeof seedSuppliers;
  stats: typeof stats;
  stripe: typeof stripe;
  subscriptions: typeof subscriptions;
  users: typeof users;
  waitlist: typeof waitlist;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
