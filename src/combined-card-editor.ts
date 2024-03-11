import { css, CSSResultGroup, html, LitElement } from "lit";
import { property, state, query, customElement } from "lit/decorators.js";
import { HomeAssistant, LovelaceCardConfig, LovelaceCard, computeCardSize, LovelaceCardEditor } from 'custom-card-helpers';
import { NAME, EDITOR_NAME, HELPERS, LOG } from './utils';

@customElement(EDITOR_NAME)
class CombinedCardEditor extends LitElement implements LovelaceCardEditor {
  @state()
  protected _config: LovelaceCardConfig = {
    type: `custom:${NAME}`,
    cards: []
  };

  @query("hui-card-element-editor") _cardEditorEl?;

  private _hass?: HomeAssistant;

  setConfig(config: LovelaceCardConfig): void {
    LOG('setConfig', config);
    this._config = config;
  }

  configChanged(newCondfig: LovelaceCardConfig): void {
    const event = new Event('config-changed', {
      bubbles: true,
      composed: true
    });

    // @ts-ignore
    event.detail = { config: newCondfig };

    this.dispatchEvent(event);
  }

  protected render() {
    return html`<div>The visual editor is not implemented yet</div>`;
  }

  set hass(hass: HomeAssistant) {
    this._hass = hass;
  }
}

customElements.whenDefined('hui-stack-card-editor').then((Element) => {
  LOG('stack editor defined', Element);
});
HELPERS.push(() => {
  console.log(HELPERS.helpers);
});
