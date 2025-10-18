import { css, CSSResultGroup, html, LitElement } from "lit";
import { state } from "lit/decorators.js";
import { querySelectorDeep } from "query-selector-shadow-dom";
import { HomeAssistant, LovelaceCardConfig, LovelaceCard } from 'custom-card-helpers';
import { LOG } from './utils';

const NAME = 'catdad-auto-reload-card';

type Timer = ReturnType<typeof setTimeout>;

const minute = 1000 * 60;

const isDate = (value: unknown): value is Date => {
  return value instanceof Date && !isNaN(value.getTime());
};

export const card = {
  type: NAME,
  name: 'Catdad: Auto Reload Card',
  description: 'Reload the dashboard if it loses connection'
};

class AutoReloadCard extends LitElement implements LovelaceCard {
  @state() private _config?: LovelaceCardConfig;
  @state() private _editMode: boolean = false;
  @state() private _lastUpdated: string = 'entity not found in state';

  private _hass?: HomeAssistant;
  private _disconnectTimer?: Timer;

  set hass(hass: HomeAssistant) {
    this._hass = hass;

    if (this._disconnectTimer) {
      clearTimeout(this._disconnectTimer);
    }

    this._disconnectTimer = setTimeout(() => {
      console.log('has not updated in two minutes');
      location.reload();
    }, 2 * minute);

    if (this._config) {
      const state = hass.states[this._config.entity];

      if (state) {
        this._lastUpdated = state.last_updated;
      }
    }
  }

  set editMode(editMode: boolean) {
    this._editMode = editMode;

    // if (editMode) {
    //   this.disable();
    // } else {
    //   this.enable();
    // }
  }

  public async getCardSize(): Promise<number> {
    return 4;
  }

  public setConfig(config: LovelaceCardConfig): void {
    console.log('config was set', config);
    this._config = Object.assign({}, AutoReloadCard.getStubConfig(), config);
  }

  private enable(): void {
    try {
      const header = querySelectorDeep('ha-panel-lovelace .header');
      const view = querySelectorDeep('ha-panel-lovelace hui-view-container');
      const thisCard = querySelectorDeep('kiosk-card');

      // LOG('kiosk mode got elements:', { header, view, thisCard });

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

  private disable(): void {
    try {
      const header = querySelectorDeep('ha-panel-lovelace .header');
      const view = querySelectorDeep('ha-panel-lovelace hui-view-container');

      // LOG('kiosk mode got elements:', { header, view });

      if (!header || !view) {
        throw new Error('could not find necessary elements to disconnect kiosk mode');
      }

      header.style.removeProperty('display');
      view.style.removeProperty('padding-top');
    } catch (e) {
      LOG('failed to disconnect kiosk mode', e);
    }
  }

  connectedCallback(): void {
    super.connectedCallback()
    // this.enable();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    if (this._disconnectTimer) {
      clearTimeout(this._disconnectTimer);
    }
    // this.disable();
  }

  protected render() {
    const styles = [
      'padding: var(--spacing, 12px)',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'flex-direction: column',
      'gap: calc(var(--spacing, 12px) / 4)',
    ];

    const lastUpdated = new Date(this._lastUpdated);
    const debugElem = isDate(lastUpdated)
      ? html`<div>last updated: ${lastUpdated.toLocaleString()}</div>`
      : html`<div>${this._lastUpdated}</div>`;

    return html`
      <ha-card style=${`${this._editMode ? '' : ''}`}>
        <div style=${styles.join(';')}>
          <div>Auto reload card placeholder</div>
          ${debugElem}
        </div>
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

  public static getConfigForm() {
    return {
      schema: [
        { name: "entity", required: true, selector: { entity: {} } },
      ]
    };
  }

  static getStubConfig() {
    return {
      type: `custom:${NAME}`,
    };
  }
}

customElements.define(NAME, AutoReloadCard);
