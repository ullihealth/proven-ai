import { onRequest as __api_lessons__lessonId__video_token_ts_onRequest } from "/Users/jeffthompson/Dropbox/Ai Apps/01 PROVEN AI/proven-ai/functions/api/lessons/[lessonId]/video-token.ts"
import { onRequest as __api_auth___path___ts_onRequest } from "/Users/jeffthompson/Dropbox/Ai Apps/01 PROVEN AI/proven-ai/functions/api/auth/[[path]].ts"

export const routes = [
    {
      routePath: "/api/lessons/:lessonId/video-token",
      mountPath: "/api/lessons/:lessonId",
      method: "",
      middlewares: [],
      modules: [__api_lessons__lessonId__video_token_ts_onRequest],
    },
  {
      routePath: "/api/auth/:path*",
      mountPath: "/api/auth",
      method: "",
      middlewares: [],
      modules: [__api_auth___path___ts_onRequest],
    },
  ]