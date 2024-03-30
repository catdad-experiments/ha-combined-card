import { css, CSSResultGroup, html, LitElement } from "lit";
import { state, customElement } from "lit/decorators.js";
import { HomeAssistant, LovelaceCardConfig, LovelaceCard } from 'custom-card-helpers';
import { NAME, EDITOR_NAME, HELPERS, LOG, loadStackEditor } from './utils';

@customElement(NAME)
class CombinedCard extends LitElement implements LovelaceCard {
  @state() private _config?: LovelaceCardConfig;
  @state() private _helpers?;

  private _card?: LovelaceCard;
  private _hass?: HomeAssistant;
  private _editMode: boolean = false;

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

        if (el.getCardSize) {
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
    if (!(this._config && this._helpers)) {
      LOG(`Rendering card: { config: ${!!this._config}, helpers: ${HELPERS.loaded} }`);
      return this._loading();
    }

    const element = this._createCard(this._config);
    const styles = [
      '--ha-card-border-width: 0px',
      '--ha-card-border-color: rgba(0, 0, 0, 0)',
      '--ha-card-box-shadow: none',
      '--ha-card-border-radius: none'
    ];

    return html`
      <ha-card>
        <div style="${styles.join(';')}">${element}</div>
      </ha-card>
    `;
  }

  private _loading(): LovelaceCard {
    LOG('render loading card');

    const style = [
      'height: 50px',
      'padding: var(--spacing, 12px)',
      'display: flex',
      'align-items: center'
    ];

    return html`<ha-card style="${style.join(';')}" class="loading">Loading...</ha-card>` as any as LovelaceCard;
  }

  private _createCard(config: LovelaceCardConfig): LovelaceCard {
    // TODO does this need to be removed?
    if (!this._helpers) {
      return this._loading();
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

  private _rebuildSelf(): void {
    const cardElToReplace = this._card as LovelaceCard;
    const config = this._config as LovelaceCardConfig;

    if (!cardElToReplace || !config) {
      return;
    }

    this._rebuildCard(cardElToReplace, config);
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
      type: 'custom:combined-card',
      cards: []
    };
  }
}

// Note: this is what adds the card to the UI card selector
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: NAME,
  name: "Combined Card",
  description: "Combine a stack of cards into a single seamless card",
});
