import {
  onScopeDispose,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from "vue";
import type {
  GraffitiLocation,
  GraffitiObject,
  GraffitiSession,
  JSONSchema4,
} from "@graffiti-garden/api";
import { useGraffitiSynchronize, useGraffitiSession } from "./globals";
import type { GraffitiStream } from "@graffiti-garden/api";
import { GetPoller, Poller, StreamPoller } from "./pollers";
import { ArrayReducer, Reducer, SingletonReducer } from "./reducers";

function makeComposable<Schema extends JSONSchema4>(
  reducer: Reducer<Schema>,
  poller: Poller<Schema>,
  synchronizeFactory: () => GraffitiStream<GraffitiObject<Schema>>,
  toWatch: readonly (() => any)[],
) {
  let synchronizeIterator: GraffitiStream<GraffitiObject<Schema>> | undefined =
    undefined;
  async function pollSynchronize() {
    synchronizeIterator = synchronizeFactory();
    for await (const result of synchronizeIterator) {
      if (result.error) {
        console.error(result.error);
        continue;
      }
      reducer.onObject(result.value);
    }
  }

  const poll = () => poller.poll(reducer.onObject.bind(reducer));

  const isPolling = ref(false);
  watch(
    toWatch,
    async (newValue, oldValue) => {
      // Catch unnecessary updates
      if (JSON.stringify(newValue) === JSON.stringify(oldValue)) {
        return;
      }

      synchronizeIterator?.return();
      reducer.clear();
      poller.clear();

      pollSynchronize();

      isPolling.value = true;
      try {
        await poll();
      } finally {
        isPolling.value = false;
      }
    },
    {
      immediate: true,
    },
  );
  onScopeDispose(() => synchronizeIterator?.return());

  return { poll, isPolling };
}

function toSessionGetter(
  sessionInjected: ReturnType<typeof useGraffitiSession>,
  session?: MaybeRefOrGetter<GraffitiSession | undefined | null>,
) {
  return () => {
    const sessionValue = toValue(session);
    if (sessionValue === undefined) {
      return sessionInjected?.value;
    } else {
      return sessionValue;
    }
  };
}

function callGetters<T extends readonly (() => any)[]>(
  getters: T,
): {
  [K in keyof T]: ReturnType<T[K]>;
} {
  return getters.map((fn) => fn()) as any;
}

/**
 * The [Graffiti.discover](https://api.graffiti.garden/classes/Graffiti.html#discover)
 * method as a reactive [composable](https://vuejs.org/guide/reusability/composables.html)
 * for use in the Vue [composition API](https://vuejs.org/guide/introduction.html#composition-api).
 *
 * Its corresponding renderless component is {@link GraffitiDiscover}.
 *
 * The arguments of this composable as the same as Graffiti.discover,
 * only they can also be [Refs](https://vuejs.org/api/reactivity-core.html#ref)
 * or [getters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get#description).
 * As they change the output will automatically update.
 * Reactivity only triggers when the root array or object changes,
 * not when the elements or properties change.
 * If you need deep reactivity, wrap your argument in a getter.
 */
export function useGraffitiDiscover<Schema extends JSONSchema4>(
  channels: MaybeRefOrGetter<string[]>,
  schema: MaybeRefOrGetter<Schema>,
  /**
   * If the session is `undefined`, the global session,
   * {@link ComponentCustomProperties.$graffitiSession | $graffitiSession},
   * will be used. Otherwise, the provided value will be used.
   */
  session?: MaybeRefOrGetter<GraffitiSession | undefined | null>,
) {
  const graffiti = useGraffitiSynchronize();
  const sessionInjected = useGraffitiSession();

  const channelsGetter = () => toValue(channels);
  const schemaGetter = () => toValue(schema);
  const sessionGetter = toSessionGetter(sessionInjected, session);
  const argGetters = [channelsGetter, schemaGetter, sessionGetter] as const;

  const synchronizeFactory = () =>
    graffiti.synchronizeDiscover(...callGetters(argGetters));
  const streamFactory = () => graffiti.discover(...callGetters(argGetters));

  const reducer = new ArrayReducer<Schema>(graffiti);
  const poller = new StreamPoller(schemaGetter, streamFactory);

  const { poll, isPolling } = makeComposable(
    reducer,
    poller,
    synchronizeFactory,
    argGetters,
  );

  return {
    /**
     * A [Ref](https://vuejs.org/api/reactivity-core.html#ref) that contains
     * an array of Graffiti objects. All tombstoned objects have been filtered out.
     */
    results: reducer.results,
    /**
     * A method to poll for new results.
     */
    poll,
    /**
     * A boolean [Ref](https://vuejs.org/api/reactivity-core.html#ref)
     * that indicates if the poll is currently running.
     * Useful to show a loading spinner or disable a button.
     */
    isPolling,
  };
}

/**
 * The [Graffiti.get](https://api.graffiti.garden/classes/Graffiti.html#get)
 * method as a reactive [composable](https://vuejs.org/guide/reusability/composables.html)
 * for use in the Vue [composition API](https://vuejs.org/guide/introduction.html#composition-api).
 *
 * Its corresponding renderless component is {@link GraffitiGet}.
 *
 * The arguments of this composable as the same as Graffiti.get,
 * only they can also be [Refs](https://vuejs.org/api/reactivity-core.html#ref)
 * or [getters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get#description).
 * As they change the output will automatically update.
 * Reactivity only triggers when the root array or object changes,
 * not when the elements or properties change.
 * If you need deep reactivity, wrap your argument in a getter.
 */
export function useGraffitiGet<Schema extends JSONSchema4>(
  locationOrUri: MaybeRefOrGetter<GraffitiLocation | string>,
  schema: MaybeRefOrGetter<Schema>,
  /**
   * If the session is `undefined`, the global session,
   * {@link ComponentCustomProperties.$graffitiSession | $graffitiSession},
   * will be used. Otherwise, the provided value will be used.
   */
  session?: MaybeRefOrGetter<GraffitiSession | undefined | null>,
) {
  const graffiti = useGraffitiSynchronize();
  const sessionInjected = useGraffitiSession();

  const locationOrUriGetter = () => toValue(locationOrUri);
  const schemaGetter = () => toValue(schema);
  const sessionGetter = toSessionGetter(sessionInjected, session);
  const argGetters = [
    locationOrUriGetter,
    schemaGetter,
    sessionGetter,
  ] as const;

  const synchronizeFactory = () =>
    graffiti.synchronizeGet(...callGetters(argGetters));

  const reducer = new SingletonReducer<Schema>();
  const poller = new GetPoller(() => graffiti.get(...callGetters(argGetters)));

  const { poll, isPolling } = makeComposable(
    reducer,
    poller,
    synchronizeFactory,
    argGetters,
  );

  return {
    /**
     * A [Ref](https://vuejs.org/api/reactivity-core.html#ref) that contains
     * the retrieved Graffiti object, if it exists. If the object has been deleted,
     * the result is `null`. If the object is still being fetched, the result is `undefined`.
     */
    result: reducer.result,
    /**
     * A method to poll for new results.
     */
    poll,
    /**
     * A boolean [Ref](https://vuejs.org/api/reactivity-core.html#ref)
     * that indicates if the poll is currently running.
     * Useful to show a loading spinner or disable a button.
     */
    isPolling,
  };
}

/**
 * The [Graffiti.recoverOrphans](https://api.graffiti.garden/classes/Graffiti.html#recoverorphans)
 * method as a reactive [composable](https://vuejs.org/guide/reusability/composables.html)
 * for use in the Vue [composition API](https://vuejs.org/guide/introduction.html#composition-api).
 *
 * Its corresponding renderless component is {@link GraffitiRecoverOrphans}.
 *
 * The arguments of this composable as the same as Graffiti.get,
 * only they can also be [Refs](https://vuejs.org/api/reactivity-core.html#ref)
 * or [getters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get#description).
 * As they change the output will automatically update.
 * Reactivity only triggers when the root array or object changes,
 * not when the elements or properties change.
 * If you need deep reactivity, wrap your argument in a getter.
 */
export function useGraffitiRecoverOrphans<Schema extends JSONSchema4>(
  schema: MaybeRefOrGetter<Schema>,
  session: MaybeRefOrGetter<GraffitiSession>,
) {
  const graffiti = useGraffitiSynchronize();

  const schemaGetter = () => toValue(schema);
  const sessionGetter = () => toValue(session);
  const argGetters = [schemaGetter, sessionGetter] as const;

  const synchronizeFactory = () =>
    graffiti.synchronizeRecoverOrphans(...callGetters(argGetters));

  const reducer = new ArrayReducer<Schema>(graffiti);
  const poller = new StreamPoller(schemaGetter, () =>
    graffiti.recoverOrphans(...callGetters(argGetters)),
  );

  const { poll, isPolling } = makeComposable(
    reducer,
    poller,
    synchronizeFactory,
    argGetters,
  );

  return {
    /**
     * A [Ref](https://vuejs.org/api/reactivity-core.html#ref) that contains
     * an array of Graffiti objects. All tombstoned objects have been filtered out.
     */
    results: reducer.results,
    /**
     * A method to poll for new results.
     */
    poll,
    /**
     * A boolean [Ref](https://vuejs.org/api/reactivity-core.html#ref)
     * that indicates if the poll is currently running.
     * Useful to show a loading spinner or disable a button.
     */
    isPolling,
  };
}
