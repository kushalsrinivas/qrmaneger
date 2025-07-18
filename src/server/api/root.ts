import { postRouter } from "@/server/api/routers/post";
import { qrRouter, publicQrRouter } from "@/server/api/routers/qr";
import { templatesRouter } from "@/server/api/routers/templates";
import { foldersRouter } from "@/server/api/routers/folders";
import { analyticsRouter } from "@/server/api/routers/analytics";
import { teamRouter } from "@/server/api/routers/team";
import { settingsRouter } from "@/server/api/routers/settings";
import { bulkRouter } from "@/server/api/routers/bulk";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  qr: qrRouter,
  publicQr: publicQrRouter,
  templates: templatesRouter,
  folders: foldersRouter,
  analytics: analyticsRouter,
  team: teamRouter,
  settings: settingsRouter,
  bulk: bulkRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
