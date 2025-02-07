# Graffiti Wrapper for Vue.js

This is a wrapper around the [Graffiti API](https://api.graffiti.garden/classes/Graffiti.html)
as [Vue.js](https://vuejs.org/) plugin.
It provides the following features:
- A global Graffiti instance via the `$graffiti`
[global property](https://vuejs.org/api/application.html#app-config-globalproperties)
in templates and the Options API, or the `useGraffiti` [composable](https://vuejs.org/guide/reusability/composables.html)
in the Composition API.
- A `useGraffitiDiscover` [composable](https://vuejs.org/guide/reusability/composables.html)
and a `GraffitiDiscover` [renderless component](https://vuejs.org/guide/components/slots#renderless-components)
that produce a reactive arrays of objects from the results of [`discover`](https://api.graffiti.garden/classes/Graffiti.html#discover).
- A reactive [`GraffitiSession`](https://api.graffiti.garden/interfaces/GraffitiSession.html) object
that holds the user's most recent log-in state announced
from [`sessionEvents`](https://api.graffiti.garden/classes/Graffiti.html#sessionevents).
It is accessible via the `$graffitiSession` global property in templates and the Options API,
or the `useGraffitiSession` composable in the Composition API.

## Installation

You must install this package along with Vue.js and an implementation of the Graffiti API.
In this example, we will use the [PouchDB implementation](https://github.com/graffiti-garden/implementation-local)
of the Graffiti API, but any other would be similar.
In node.js, simply install them with npm:

```bash
npm install vue
npm install @graffiti-garden/implementation-local
npm install @graffiti-garden/wrapper-vue
```

In the browser, you can use a CDN like
[jsDelivr](https://www.jsdelivr.com/).
Add an import map the the `<head>` of your HTML file:

```html
<head>
    <script type="importmap">
        {
            "imports": {
                "vue": "https://cdn.jsdelivr.net/npm/vue/dist/vue.esm-browser.js",
                "@graffiti-garden/implementation-local": "https://cdn.jsdelivr.net/npm/@graffiti-garden/implementation-local/dist/index.browser.js",
                "@graffiti-garden/wrapper-vue": "https://cdn.jsdelivr.net/npm/@graffiti-garden/wrapper-vue/dist/plugin.mjs"
            }
        }
    </script>
</head>
```

In ether case install the plugin in your Vue app as follows:

```typescript
import { createApp } from "vue";
import { GraffitiLocal } from "@graffiti-garden/implementation-local";
import { GraffitiPlugin } from "@graffiti-garden/wrapper-vue";

createApp({})
  .use(GraffitiPlugin, {
    useGraffiti: () => new GraffitiLocal(),
  });
  .mount("#app");
```

See full examples of both with both methods in the [examples](./examples) directory,
which are live [here](https://graffiti.garden/wrapper-vue/).
