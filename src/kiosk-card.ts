import { css, CSSResultGroup, html, LitElement } from "lit";
import { state } from "lit/decorators.js";
import { querySelectorDeep } from "query-selector-shadow-dom";
import { HomeAssistant, LovelaceCardConfig, LovelaceCard } from 'custom-card-helpers';
import { LOG } from './utils';

const NAME = 'kiosk-card';

export const card = {
  type: NAME,
  name: 'Catdad: Kiosk Card',
  description: 'Hide the navigation UI for the dashboard where this card is rendered'
};

const getRandomId = (): string => Math.random().toString(36).slice(2);

const getElementOrThrow = (parent: Document | Element | ShadowRoot, path: string): Element => {
  const element = parent.querySelector(path);
  if (!element) {
    throw new Error(`could not find element at "${path}"`);
  }

  return element;
}

class KioskCard extends LitElement implements LovelaceCard {
  @state() private _config?: LovelaceCardConfig;
  @state() private _forceRender: string = getRandomId();
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
      'align-items: center'
    ];

    try {
      const header = querySelectorDeep('ha-panel-lovelace .header');
      const view = querySelectorDeep('ha-panel-lovelace hui-view-container');

      LOG('kiosk mode got elements:', { header, view });

      if (!header || !view) {
        throw new Error('could not find necessary elements to apply kiosk mode');
      }

      header.style.display = 'none';
      view.style.paddingTop = '0px';
    } catch (e) {
      LOG('failed to initiate kiosk mode', e);
    }

    return html`
      <ha-card>
        <div style="${styles.join(';')}">This is the kiosk card ${this._editMode ? 'in edit mode' : ''}</div>
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

  // Note: this is what builds the visual editor for this card
  // the actual element it is creating is the one in
  // combined-card-editor.ts
  // public static async getConfigElement() {
  //   const element = document.createElement(EDITOR_NAME);
  //   // @ts-ignore
  //   element.cardEditor = await loadStackEditor();

  //   return element;
  // }

  static getStubConfig() {
    return {
      type: `custom:${NAME}`,
    };
  }
}

customElements.define(NAME, KioskCard);
