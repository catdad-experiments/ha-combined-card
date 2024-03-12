import { html, LitElement } from "lit";
import { HomeAssistant, LovelaceCardConfig, LovelaceCardEditor } from 'custom-card-helpers';
import { NAME, EDITOR_NAME, LOG } from './utils';

class CombinedCardEditor extends LitElement implements LovelaceCardEditor {
  private _hass?: HomeAssistant;
  private _stackCardEditor?;

  private _setEditorConfig(config: LovelaceCardConfig) {
    // @ts-ignore
    if (this._stackCardEditor) {
      this._stackCardEditor.setConfig({
        type: 'vertical-stack',
        cards: config.cards || []
      });
    }
  }

  setConfig(config: LovelaceCardConfig): void {
    LOG('setConfig', config);
    this._setEditorConfig(config);
  }

  configChanged(newCondfig: LovelaceCardConfig): void {
    const event = new Event('config-changed', {
      bubbles: true,
      composed: true
    });

    // @ts-ignore
    event.detail = { config: newCondfig };

    LOG('configChanged', newCondfig);

    this.dispatchEvent(event);
  }

  protected render() {
    LOG('render', this._stackCardEditor);

    this._stackCardEditor.addEventListener('config-changed', ev => {
      ev.stopPropagation();

      this.configChanged({
        ...ev.detail.config,
        type: `custom:${NAME}`
      });
    });

    return html`<div>${this._stackCardEditor}</div>`;
  }

  set hass(hass: HomeAssistant) {
    this._hass = hass;

    if (this._stackCardEditor) {
      this._stackCardEditor.hass = hass;
    }
  }

  set lovelace(ll) {
    if (this._stackCardEditor) {
      this._stackCardEditor.lovelace = ll;
    }
  }

  set cardEditor(editor) {
    this._stackCardEditor = editor;
  }
}

customElements.define(EDITOR_NAME, CombinedCardEditor);
