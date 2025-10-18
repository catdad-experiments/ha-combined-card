import { css, CSSResultGroup, html, LitElement } from "lit";
import { state } from "lit/decorators.js";
import { querySelectorDeep } from "query-selector-shadow-dom";
import { HomeAssistant, LovelaceCardConfig, LovelaceCard } from 'custom-card-helpers';
import { type Interval, type Timer, LOG, isNumber } from './utils';

const NAME = 'catdad-auto-reload-card';

type StoredState = {
  lastRefresh: string;
  disconnectCount: number;
  updateCount: number;
};

const minute = 1000 * 60;

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
      this.refreshFromDisconnect();
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
        this.refreshFromUpdate();
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

  private readStoredState(): StoredState {
    try {
      const state = JSON.parse(localStorage.getItem(NAME) || '{}');

      return {
        lastRefresh: typeof state.lastRefresh === 'string' ? state.lastRefresh : 'none',
        disconnectCount: isNumber(state.disconnectCount) ? state.disconnectCount : 0,
        updateCount: isNumber(state.updateCount) ? state.updateCount : 0,
      };
    } catch (e) {
      return {
        lastRefresh: 'none',
        disconnectCount: 0,
        updateCount: 0,
      }
    }
  }

  private writeStoredState(state: StoredState): void {
    localStorage.setItem(NAME, JSON.stringify(state));
  }

  private refreshFromDisconnect(): void {
    const state = this.readStoredState();
    this.writeStoredState({
      ...state,
      lastRefresh: new Date().toISOString(),
      disconnectCount: state.disconnectCount + 1
    });

    location.reload();
  }

  private refreshFromUpdate(): void {
    const state = this.readStoredState();
    this.writeStoredState({
      ...state,
      lastRefresh: new Date().toISOString(),
      updateCount: state.updateCount + 1,
    });

    location.reload();
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
        ? 'Auto reload card debug info:'
        : '👋';

    const debugElem = debug
      ? html`
          <pre>${JSON.stringify({
            lastEntityUpdate: this._lastUpdated,
            ...this.readStoredState()
          }, null, 1)
            .split(/,?\n/)
            .map(l => l.trim())
            .filter(l => !['{', '}'].includes(l))
            .join('\n').trim()
          }</pre>`
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
