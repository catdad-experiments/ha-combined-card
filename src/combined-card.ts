import { css, CSSResultGroup, html, LitElement } from "lit";
import { property, state, customElement } from "lit/decorators.js";
import { HomeAssistant, LovelaceCardConfig, LovelaceCard, computeCardSize, LovelaceCardEditor } from 'custom-card-helpers';
import * as pjson from '../package.json';

type fn = (...args: any[]) => void;

// Home Assistant really needs to make this an SDK so that we can
// stop trying to hack it. When they use these helpers, they can
// use them synchronously, but third-party devs can't.
const HELPERS = ((loadCardHelpers, callbacks: fn[]) => {
  const fileBugStr = 'Please file a bug at https://github.com/catdad-experiments/ha-combined-card and explain your setup.';

  if (!loadCardHelpers) {
    throw new Error(`This instance of Home Assistant does not have global card helpers. ${fileBugStr}`);
  }

  let _helpers;

  loadCardHelpers().then(helpers => {
    _helpers = helpers;
  }).catch(err => {
    throw new Error(`Failed to load card helpers. ${fileBugStr}: ${err.message}`);
  });

  return {
    push: (func: fn) => void callbacks.push(func),
    get helpers() {
      return _helpers;
    },
    get loaded() {
      return !!_helpers;
    }
  };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
})((window as any).loadCardHelpers, []);

const NAME = 'combined-card';

const LOG = (first: string, ...args: any[]) => {
  console.log(`%c ${NAME} v${pjson.version} \x1B[m ${first}`, 'color: #bad155; font-weight: bold; background: #555; border-radius: 2rem;', ...args);
};

LOG('loaded');

@customElement(NAME)
class CombinedCard extends LitElement implements LovelaceCard {
  @state()
  protected _config?: LovelaceCardConfig;

  @property()
  protected _card?: LovelaceCard;

  private _hass?: HomeAssistant;

  public async getCardSize(): Promise<number> {
    if (!this._config) {
      return 1;
    }

    const card = this._createCard(this._config);
    return await computeCardSize(card);
  }

  public setConfig(config: LovelaceCardConfig): void {
    if (!config || !config.cards || !Array.isArray(config.cards)) {
      throw new Error("Invalid configuration, `cards` is required");
    }

    this._config = config;
    const that = this;

    if (!HELPERS.loaded) {
      HELPERS.push(() => {
        LOG('SETTING CONFIG AFTER HELPERS LOADED');
        const _config: LovelaceCardConfig = that._config || config;
        that._config = { ..._config };
      });
    } else {
      this._card = this._createCard(config);
    }
  }

  protected render() {
    if (!this._config || !HELPERS.loaded) {
      return this._loading();
    }

    const element = this._createCard(this._config);
    const styles = [
      '--ha-card-border-color: rgba(0, 0, 0, 0)',
      '--ha-card-box-shadow: none'
    ];

    return html`
      <ha-card>
        <div style="${styles.join(';')}">${element}</div>
      </ha-card>
    `;
  }

  private _loading(): LovelaceCard {
    return html`<ha-card>Loading...</ha-card>` as any as LovelaceCard;
  }

  private _createCard(config: LovelaceCardConfig): LovelaceCard {
    if (!HELPERS.loaded) {
      return this._loading();
    }

    const element: LovelaceCard = HELPERS.helpers.createCardElement({
      ...config,
      type: 'vertical-stack'
    });

    if (this._hass) {
      element.hass = this._hass;
    }

    if (element) {
      element.addEventListener(
        'll-rebuild',
        (ev) => {
          ev.stopPropagation();
          this._rebuildCard(element, config);
        },
        { once: true },
      );
    }

    return element;
  }

  private _rebuildCard(
    cardElToReplace: LovelaceCard,
    config: LovelaceCardConfig
  ): void {
    const newCardEl = this._createCard(config);
    if (cardElToReplace.parentElement) {
      cardElToReplace.parentElement.replaceChild(newCardEl, cardElToReplace);
    }
  }

  static get styles(): CSSResultGroup {
    return css`
      ha-card {
        overflow: hidden;
      }
    `;
  }

  set hass(hass: HomeAssistant) {
    this._hass = hass;
  }
}

@customElement(`${NAME}-editor`)
class CombinedCardEditor extends LitElement implements LovelaceCardEditor {
  @state()
  protected _config: LovelaceCardConfig = {
    type: `custom:${NAME}`,
    cards: []
  };

  private _hass?: HomeAssistant;

  setConfig(config: LovelaceCardConfig): void {
    LOG('set config', config);
    this._config = config;
  }

  protected render() {
    return html`<ha-form>
      .hass=${this._hass}
      .data=${this._config}
    </ha-form>`;
  }

  set hass(hass: HomeAssistant) {
    this._hass = hass;
  }
}

// @ts-ignore
window.customCards = window.customCards || [];
// @ts-ignore
window.customCards.push({
    type: NAME,
    name: "Combined Card",
    description: "Combine a stack of cards into a single seamless card",
});
