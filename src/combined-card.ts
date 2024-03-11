import { css, CSSResultGroup, html, LitElement } from "lit";
import { property, state, query, customElement } from "lit/decorators.js";
import { HomeAssistant, LovelaceCardConfig, LovelaceCard, computeCardSize } from 'custom-card-helpers';
import { NAME, EDITOR_NAME, HELPERS, LOG } from './utils';

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

    const card = this._card || this._createCard(this._config);
    const size = await computeCardSize(card);

    return size;
  }

  public setConfig(config: LovelaceCardConfig): void {
    if (!config || !config.cards || !Array.isArray(config.cards)) {
      throw new Error("Invalid configuration, `cards` is required");
    }

    this._config = config;
    const that = this;

    if (!HELPERS.loaded) {
      HELPERS.push(() => {
        LOG('re-rendering card after helpers have loaded');
        that._rebuildSelf();
      });
    }
  }

  protected render() {
    if (!this._config || !HELPERS.loaded) {
      LOG(`Rendering card: { config: ${!!this._config}, helpers: ${HELPERS.loaded} }`);
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
    LOG('render loading card');
    return html`<ha-card class="loading">Loading...</ha-card>` as any as LovelaceCard;
  }

  private _createCard(config: LovelaceCardConfig): LovelaceCard {
    if (!HELPERS.loaded) {
      return this._loading();
    }

    const element: LovelaceCard = HELPERS.helpers.createCardElement({
      ...config,
      type: 'vertical-stack'
    });

    this._card = element;

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

  private _rebuildSelf(): void {
    const cardElToReplace = this._card as LovelaceCard;
    const config = this._config as LovelaceCardConfig;

    if (!cardElToReplace || !config) {
      LOG('skipping rebuild self');
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

      ha-card.loading {
        padding: var(--spacing);
      }
    `;
  }

  set hass(hass: HomeAssistant) {
    this._hass = hass;

    // we don't really need to rebuild this card
    // since it is only a passthrough, but
    // set hass of the nested stack so that it
    // rebuilds itself
    if (this._card) {
      this._card.hass = hass;
    }
  }

  static getConfigElement() {
    return document.createElement(EDITOR_NAME);
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
