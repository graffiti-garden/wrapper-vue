import type { App } from "vue";
import { useGraffiti, useGraffitiSession } from "./session";
import SessionManager from "./SessionManager.vue";
import Query from "./Query.vue";
import type GraffitiClient from "@graffiti-garden/client-core";

declare module "vue" {
  export interface ComponentCustomProperties {
    $graffiti: GraffitiClient;
    $graffitiSession: ReturnType<typeof useGraffitiSession>;
  }

  export interface GlobalComponents {
    GraffitiSessionManager: typeof SessionManager;
    GraffitiQuery: typeof Query;
  }
}

const GraffitiPlugin = {
  install(app: App) {
    app.component("GraffitiSessionManager", SessionManager);
    app.component("GraffitiQuery", Query);
    app.config.globalProperties.$graffiti = useGraffiti();
    app.config.globalProperties.$graffitiSession = useGraffitiSession();
  },
};
export default GraffitiPlugin;

export * from "./composables";
export * from "./session";
export { SessionManager as GraffitiSessionManager, Query as GraffitiQuery };
