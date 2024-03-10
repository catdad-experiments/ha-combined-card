import { css, CSSResultGroup, html, LitElement } from "lit";
import { property, state, query, customElement } from "lit/decorators.js";
import { HomeAssistant, LovelaceCardConfig, LovelaceCard, computeCardSize, LovelaceCardEditor } from 'custom-card-helpers';
import { NAME, HELPERS, LOG } from './utils';

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
        LOG('setting card config after helpers have loaded');
        const _config: LovelaceCardConfig = that._config || config;
        that._config = { ..._config };
      });
    } else {
      this._card = this._createCard(config);
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
    return html`<ha-card class="loading">Loading...</ha-card>` as any as LovelaceCard;
  }

  private _createCard(config: LovelaceCardConfig): LovelaceCard {
    if (!HELPERS.loaded) {
      LOG('Creating card without helpers loaded');
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
      LOG('registering rebuild event');
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
    LOG('rebuild');
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
  }
}

// Note: this is what adds the card to the UI card selector
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
    type: NAME,
    name: "Combined Card",
    description: "Combine a stack of cards into a single seamless card",
});
