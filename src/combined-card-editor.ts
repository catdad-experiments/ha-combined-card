import { css, CSSResultGroup, html, LitElement } from "lit";
import { property, state, query, customElement } from "lit/decorators.js";
import { HomeAssistant, LovelaceCardConfig, LovelaceCard, computeCardSize, LovelaceCardEditor } from 'custom-card-helpers';
import { NAME, HELPERS, LOG } from './utils';

@customElement(`${NAME}-editor`)
class CombinedCardEditor extends LitElement implements LovelaceCardEditor {
  @state()
  protected _config: LovelaceCardConfig = {
    type: `custom:${NAME}`,
    cards: []
  };

  @query("hui-card-element-editor") _cardEditorEl?;

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
