import { css, CSSResultGroup, html, LitElement } from "lit";
import { state } from "lit/decorators.js";
import { querySelectorDeep } from "query-selector-shadow-dom";
import { HomeAssistant, LovelaceCardConfig, LovelaceCard } from 'custom-card-helpers';
import { LOG } from './utils';

const NAME = 'kiosk-card';
const EDITOR_NAME = `${NAME}-editor`;

export const card = {
  type: NAME,
  name: 'Catdad: Kiosk Card',
  description: 'Hide the navigation UI for the dashboard where this card is rendered'
};

class KioskCard extends LitElement implements LovelaceCard {
  @state() private _config?: LovelaceCardConfig;
  @state() private _editMode: boolean = false;

  private _hass?: HomeAssistant;

  set hass(hass: HomeAssistant) {
    this._hass = hass;
  }

  set editMode(editMode: boolean) {
    this._editMode = editMode;

    if (editMode) {
      this.disconnectedCallback();
    } else {
      this.connectedCallback();
    }
  }

  public async getCardSize(): Promise<number> {
    return 4;
  }

  public setConfig(config: LovelaceCardConfig): void {
    this._config = Object.assign({}, KioskCard.getStubConfig(), config);
  }

  connectedCallback(): void {
    super.connectedCallback()
    LOG('Kiosk card connected', this._editMode);

    try {
      const header = querySelectorDeep('ha-panel-lovelace .header');
      const view = querySelectorDeep('ha-panel-lovelace hui-view-container');
      const thisCard = querySelectorDeep('.catdad-kiosk-card');

      LOG('kiosk mode got elements:', { header, view, thisCard });

      // when this card is not being rendered, it should not apply kiosk mode
      if (!thisCard) {
        return;
      }

      if (!header || !view) {
        throw new Error('could not find necessary elements to apply kiosk mode');
      }

      if (this._editMode) {
        header.style.removeProperty('display');
        view.style.removeProperty('padding-top');
      } else {
        header.style.display = 'none';
        view.style.paddingTop = '0px';
      }
    } catch (e) {
      LOG('failed to connect kiosk mode', e);
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    LOG('Kiosk card disconnected');

    try {
      const header = querySelectorDeep('ha-panel-lovelace .header');
      const view = querySelectorDeep('ha-panel-lovelace hui-view-container');

      LOG('kiosk mode got elements:', { header, view });

      if (!header || !view) {
        throw new Error('could not find necessary elements to disconnect kiosk mode');
      }

      header.style.removeProperty('display');
      view.style.removeProperty('padding-top');
    } catch (e) {
      LOG('failed to disconnect kiosk mode', e);
    }
  }

  protected render() {
    const styles = [
      'height: 50px',
      'padding: var(--spacing, 12px)',
      'display: flex',
      'align-items: center',
      'justify-content: center',
    ];

    return html`
      <ha-card style=${`${this._editMode ? '' : 'display: none'}`}>
        <div class="catdad-kiosk-card" style=${styles.join(';')}>Kiosk mode card</div>
      </ha-card>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      ha-card {
        overflow: hidden;
      }
    `;
  }

  public static getConfigElement() {
    return document.createElement(EDITOR_NAME);
  }

  static getStubConfig() {
    return {
      type: `custom:${NAME}`,
    };
  }
}

class KioskCardEditor extends LitElement {
  setConfig() {}
  configChanged() {}

  render() {
    return html`<div>This card has no options!</div>`;
  }
}

customElements.define(NAME, KioskCard);
customElements.define(EDITOR_NAME, KioskCardEditor);
