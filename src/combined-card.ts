import { css, CSSResultGroup, html, LitElement, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { HomeAssistant, LovelaceCardConfig, LovelaceCard, computeCardSize } from 'custom-card-helpers';
import * as pjson from '../package.json';

type fn = (...args: any[]) => void;

// TODO clean this up
// const { _HELPERS, _CALLBACKS } = (() => {})();
let UMM: fn[] = [];
let THINGS;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HELPERS = (window as any).loadCardHelpers ? (window as any).loadCardHelpers() : undefined;
if (HELPERS.then) {
  HELPERS.then(helpers => {
    console.log('HELPERS LOADED', UMM.length);
    THINGS = helpers;

    for (const func of UMM) {
      func();
    }

    UMM = [];
  });
}

const NAME = 'catdad-card';

console.info(
  `%c ${NAME} v${pjson.version} `,
  'color: #bad155; font-weight: bold; background: #555; border-radius: 2rem;',
);

class CatdadCombinedCard extends LitElement implements LovelaceCard {
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

    console.log('SETTING CONFIG', THINGS);

    if (!THINGS) {
      UMM.push(() => {
        console.log('SETTING CONFIG AGAIN IN A CALLBACK');
        const _config: LovelaceCardConfig = that._config || config;
        that._config = { ..._config };
      });
    } else {
      this._card = this._createCard(config);
    }
  }

  protected render() {
    console.log('RENDER');
    if (!this._config || !THINGS) {
      return nothing;
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

  private _createCard(config: LovelaceCardConfig): LovelaceCard {
    console.log('CREATE CARD');

    if (!THINGS) {
      return html`<div>nothing to render yet</div>` as any as LovelaceCard;
    }

    const element: LovelaceCard = THINGS.createCardElement({
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

customElements.define(NAME, CatdadCombinedCard);
