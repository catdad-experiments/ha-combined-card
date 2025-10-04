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
  private _timer?: number;

  set hass(hass: HomeAssistant) {
    this._hass = hass;
  }

  set editMode(editMode: boolean) {
    this._editMode = editMode;
  }

  public async getCardSize(): Promise<number> {
    return 4;
  }

  public setConfig(config: LovelaceCardConfig): void {
    this._config = Object.assign({}, KioskCard.getStubConfig(), config);
  }

  protected render() {
    clearTimeout(this._timer);

    const styles = [
      'height: 50px',
      'padding: var(--spacing, 12px)',
      'display: flex',
      'align-items: center',
      'justify-content: center',
    ];

    try {
      const header = querySelectorDeep('ha-panel-lovelace .header') as HTMLElement | null;
      const view = querySelectorDeep('ha-panel-lovelace hui-view-container') as HTMLElement | null;

      LOG('kiosk mode got elements:', { header, view });

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
      LOG('failed to initiate kiosk mode', e);
    }

    if (this._editMode) {
      return html`
        <ha-card>
          <div style="${styles.join(';')}">Kiosk mode card</div>
        </ha-card>
      `;
    }

    return null;
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
