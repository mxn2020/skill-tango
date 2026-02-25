/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiLogs from "../aiLogs.js";
import type * as aiPipeline from "../aiPipeline.js";
import type * as auth from "../auth.js";
import type * as content from "../content.js";
import type * as http from "../http.js";
import type * as nvidia from "../nvidia.js";
import type * as prompts from "../prompts.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiLogs: typeof aiLogs;
  aiPipeline: typeof aiPipeline;
  auth: typeof auth;
  content: typeof content;
  http: typeof http;
  nvidia: typeof nvidia;
  prompts: typeof prompts;
  users: typeof users;
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

export declare const components: {};
