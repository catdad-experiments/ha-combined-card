import { css, CSSResultGroup, html, LitElement } from "lit";
import { state } from "lit/decorators.js";
import { HomeAssistant, LovelaceCardConfig, LovelaceCard } from 'custom-card-helpers';
import { NAME, EDITOR_NAME, HELPERS, LOG, loadStackEditor } from './utils';

const getRandomId = (): string => Math.random().toString(36).slice(2);

class CombinedCard extends LitElement implements LovelaceCard {
  @state() private _config?: LovelaceCardConfig;
  @state() private _helpers?;
  @state() private _forceRender: string = getRandomId();

  private _card?: LovelaceCard;
  private _hass?: HomeAssistant;
  private _editMode: boolean = false;
  private _timer?: number;

  set hass(hass: HomeAssistant) {
    this._hass = hass;

    if (this._card) {
      this._card.hass = hass;
    }
  }

  set editMode(editMode: boolean) {
    this._editMode = editMode;

    if (this._card) {
      this._card.editMode = editMode;
    }
  }

  public async getCardSize(): Promise<number> {
    if (!this._config) {
      return 0;
    }

    await HELPERS.whenLoaded;

    const that = this;

    const size: number = await new Promise(r => {
      const tryToGetSize = async () => {
        const el = that._createCard(that._config as LovelaceCardConfig);

        if (el && el.getCardSize) {
          return await el.getCardSize();
        }

        return null;
      };

      const recurse = () => {
        tryToGetSize().then((size: null | number) => {
          if (typeof size === 'number') {
            return r(size);
          }

          setTimeout(() => recurse(), 50);
        });
      };

      recurse();
    });

    return size;
  }

  public setConfig(config: LovelaceCardConfig): void {
    if (!config || !config.cards || !Array.isArray(config.cards)) {
      throw new Error("Invalid configuration, `cards` is required");
    }

    this._config = config;
    const that = this;

    if (HELPERS.loaded) {
      this._helpers = HELPERS.helpers;
    } else {
      HELPERS.whenLoaded.then(() => {
        LOG('re-rendering card after helpers have loaded');
        that._helpers = HELPERS.helpers;
      });
    }
  }

  protected render() {
    const that = this;

    clearTimeout(this._timer);

    const loaded = this._config && this._helpers;

    if (!loaded) {
      this._timer = setTimeout(() => {
        LOG('re-render loading card');
        that._forceRender = getRandomId();
      }, 1000);
    }

    const element = loaded ?
      this._createCard(this._config as LovelaceCardConfig) :
      'Loading...';

    if (element && (element as LovelaceCard).addEventListener) {
      (element as LovelaceCard).addEventListener(
        'll-rebuild',
        (ev) => {
          LOG('rebuild event!!!');
          ev.stopPropagation();
          that._forceRender = getRandomId();
        },
        { once: true },
      );
    }

    const styles = loaded ? [
      '--ha-card-border-width: 0px',
      '--ha-card-border-color: rgba(0, 0, 0, 0)',
      '--ha-card-box-shadow: none',
      '--ha-card-border-radius: none'
    ] : [
      'height: 50px',
      'padding: var(--spacing, 12px)',
      'display: flex',
      'align-items: center'
    ];

    return html`
      <ha-card>
        <div render-id="${this._forceRender}" style="${styles.join(';')}">${element}</div>
      </ha-card>
    `;
  }

  private _createCard(config: LovelaceCardConfig): LovelaceCard | null {
    // TODO does this need to be removed?
    if (!this._helpers) {
      return null;
    }

    const element: LovelaceCard = this._helpers.createCardElement({
      ...config,
      type: 'vertical-stack'
    });

    this._card = element;

    if (this._hass) {
      element.hass = this._hass;
    }

    element.editMode = this._editMode;

    return element;
  }

  static get styles(): CSSResultGroup {
    return css`
      ha-card {
        overflow: hidden;
      }
    `;
  }

  // Note: this is what builds the visual editor for this card
  // the actual element it is creating is the one in
  // combined-card-editor.ts
  public static async getConfigElement() {
    const element = document.createElement(EDITOR_NAME);
    // @ts-ignore
    element.cardEditor = await loadStackEditor();

    return element;
  }

  static getStubConfig() {
    return {
      type: `custom:${NAME}`,
      cards: []
    };
  }
}

customElements.define(NAME, CombinedCard);
