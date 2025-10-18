import { css, CSSResultGroup, html, LitElement } from "lit";
import { state } from "lit/decorators.js";
import { querySelectorDeep } from "query-selector-shadow-dom";
import { HomeAssistant, LovelaceCardConfig, LovelaceCard } from 'custom-card-helpers';
import { LOG } from './utils';

const NAME = 'catdad-auto-reload-card';

type Timer = ReturnType<typeof setTimeout>;
type Interval = ReturnType<typeof setInterval>;

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
  private _refreshInterval?: Interval;

  set hass(hass: HomeAssistant) {
    this._hass = hass;

    if (this._disconnectTimer) {
      clearTimeout(this._disconnectTimer);
    }

    this._disconnectTimer = setTimeout(() => {
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

    if (editMode) {
      this.disable();
    } else {
      this.enable();
    }
  }

  public async getCardSize(): Promise<number> {
    return 4;
  }

  public setConfig(config: LovelaceCardConfig): void {
    console.log('config was set', config);
    this._config = Object.assign({}, AutoReloadCard.getStubConfig(), config);
  }

  private enable(): void {
    if (this._editMode) {
      return;
    }

    try {
      if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
    }

    this._refreshInterval = setInterval(() => {
      const toast = querySelectorDeep('home-assistant notification-manager ha-toast ha-button[slot=action]');

      if (toast?.innerText.toLowerCase() === 'refresh') {
        location.reload();
      }
    }, 3000);

    } catch (e) {
      LOG(`failed to connect ${NAME}`, e);
    }
  }

  private disable(): void {
    try {
      if (this._disconnectTimer) {
        clearTimeout(this._disconnectTimer);
      }

      if (this._refreshInterval) {
        clearInterval(this._refreshInterval);
      }
    } catch (e) {
      LOG(`failed to disconnect ${NAME}`, e);
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.enable();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.disable();
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

    const debug = !!this._config?.debug;
    const show = this._editMode || debug;

    const placeholder = this._editMode
      ? 'Auto reload card placeholder'
      : debug
        ? 'Auto reload card debug info'
        : '';

    const lastUpdated = new Date(this._lastUpdated);
    const debugElem = debug
      ? isDate(lastUpdated)
        ? html`<div>last updated: ${lastUpdated.toLocaleString()}</div>`
        : html`<div>${this._lastUpdated}</div>`
      : null;

    return html`
      <ha-card style=${`${show ? '' : 'display: none'}`}>
        <div style=${styles.join(';')}>
          <div>${placeholder}</div>
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
        { name: "debug", selector: { boolean: {} } },
      ],
      computeLabel: (schema) => {
        if (schema.name === "debug") return "Render card with debug information";
        return undefined;
      },
    };
  }

  static getStubConfig() {
    return {
      type: `custom:${NAME}`,
    };
  }
}

customElements.define(NAME, AutoReloadCard);
