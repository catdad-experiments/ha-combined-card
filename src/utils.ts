import * as pjson from '../package.json';

export type fn = (...args: any[]) => void;

export const NAME = 'combined-card';
export const EDITOR_NAME = `${NAME}-editor`;

export const LOG = (first: string, ...args: any[]) => {
  console.log(`%c ${NAME} v${pjson.version} \x1B[m ${first}`, 'color: #bad155; font-weight: bold; background: #555; border-radius: 2rem;', ...args);
};

LOG('loaded');

// Home Assistant really needs to make this an SDK so that we can
// stop trying to hack it. When they use these helpers, they can
// use them synchronously, but third-party devs can't.
export const HELPERS = ((loadCardHelpers, callbacks: fn[]) => {
  const fileBugStr = 'Please file a bug at https://github.com/catdad-experiments/ha-combined-card and explain your setup.';
  let loaded = false;

  if (!loadCardHelpers) {
    throw new Error(`This instance of Home Assistant does not have global card helpers. ${fileBugStr}`);
  }

  let _helpers;

  loadCardHelpers().then(helpers => {
    _helpers = helpers;

    for (const func of callbacks) {
      func();
    }

    callbacks = [];

    loaded = true;
  }).catch(err => {
    throw new Error(`Failed to load card helpers. ${fileBugStr}: ${err.message}`);
  });

  return {
    push: (func: fn) => {
      if (loaded) {
        func();
      } else {
        callbacks.push(func);
      }
    },
    get helpers() {
      return _helpers;
    },
    get loaded() {
      return !!_helpers;
    },
    get whenLoaded() {
      return new Promise(resolve => {
        if (loaded) {
          return resolve(_helpers);
        }

        callbacks.push(() => resolve(_helpers));
      });
    }
  };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
})((window as any).loadCardHelpers, []);

export const loadStackEditor = ((name) => async () => {
  if (name.length) {
    return name;
  }

  const [huiStackCardEditor] = await Promise.all([
    customElements.whenDefined('hui-stack-card-editor').then(() => {
      return 'hui-stack-card-editor';
    }),
    customElements.whenDefined('hui-vertical-stack-card').then((Element) => {
      // @ts-ignore
      Element.getConfigElement();
    }),
    HELPERS.whenLoaded.then(() => {
      console.log('helpers', HELPERS.helpers);
      HELPERS.helpers.createCardElement({
        type: 'vertical-stack',
        cards: []
      });
    })
  ]);

  name = 'hui-vertical-stack-card';

  return name;
})('');
