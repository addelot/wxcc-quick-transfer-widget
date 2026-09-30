/*
 * Webex Contact Center Quick Transfer Widget
 *
 * Standalone version:
 * - No Webpack build required
 * - No Node.js required on your PC
 * - Loads the Webex Contact Center Desktop SDK from UNPKG
 *
 * Sales -> +46709246443
 * Other buttons are placeholders.
 */

const SDK_URL = "https://unpkg.com/@wxcc-desktop/sdk@3.0.1/dist/index.js";
const SALES_NUMBER = "+46709246443";

class WxccQuickTransfer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.interactionId = null;
    this.initialized = false;
    this.transferring = false;
    this.Desktop = null;

    this.boundAssigned = (msg) => this.handleContactEvent(msg);
    this.boundContact = (msg) => this.handleContactEvent(msg);
    this.boundWrapped = () => this.clearInteraction();

    this.render();
  }

  async connectedCallback() {
    try {
      this.setStatus("Loading Webex Contact Center SDK…");

      const sdk = await import(SDK_URL);
      this.Desktop = sdk.Desktop;

      if (!this.Desktop) {
        throw new Error("Desktop SDK object was not found.");
      }

      try {
        await this.Desktop.config.init({
          widgetName: "wxcc-quick-transfer-widget",
          widgetProvider: "Cisco"
        });
      } catch (firstError) {
        await this.Desktop.config.init(
          "wxcc-quick-transfer-widget",
          "Cisco"
        );
      }

      this.initialized = true;

      this.Desktop.agentContact.addEventListener(
        "eAgentContactAssigned",
        this.boundAssigned
      );

      this.Desktop.agentContact.addEventListener(
        "eAgentContact",
        this.boundContact
      );

      this.Desktop.agentContact.addEventListener(
        "eAgentContactWrappedUp",
        this.boundWrapped
      );

      this.updateFromStore();
      this.setStatus("Ready — waiting for an active call.");

    } catch (error) {
      console.error(
        "[wxcc-quick-transfer-widget] SDK initialization failed",
        error
      );

      this.setStatus(
        "SDK initialization failed. Check the browser console."
      );
    }
  }

  disconnectedCallback() {
    if (!this.initialized || !this.Desktop) return;

    try {
      this.Desktop.agentContact.removeEventListener(
        "eAgentContactAssigned",
        this.boundAssigned
      );

      this.Desktop.agentContact.removeEventListener(
        "eAgentContact",
        this.boundContact
      );

      this.Desktop.agentContact.removeEventListener(
        "eAgentContactWrappedUp",
        this.boundWrapped
      );

    } catch (error) {
      console.warn(
        "[wxcc-quick-transfer-widget] Event cleanup failed",
        error
      );
    }
  }

  handleContactEvent(msg) {
    const data = msg?.data ?? msg ?? {};

    const interactionId =
      data.interactionId ||
      data.interaction?.interactionId ||
      data.task?.interactionId ||
      data.task?.interaction?.interactionId;

    if (interactionId) {
      this.interactionId = interactionId;
      this.setButtonEnabled(true);
      this.setStatus("Active call detected.");
    }
  }

  updateFromStore() {
    try {
      const selected = this.Desktop?.agentContact?.taskSelected;

      const id =
        selected?.interactionId ||
        selected?.interaction?.interactionId ||
        selected?.task?.interactionId;

      if (id) {
        this.interactionId = id;
        this.setButtonEnabled(true);
        this.setStatus("Active call detected.");
      }

    } catch (error) {
      console.warn(
        "[wxcc-quick-transfer-widget] Could not read selected task",
        error
      );
    }
  }

  clearInteraction() {
    this.interactionId = null;
    this.transferring = false;
    this.setButtonEnabled(false);
    this.setStatus("Ready — waiting for an active call.");
  }

  async blindTransferSales() {
    if (this.transferring) return;

    this.updateFromStore();

    if (!this.interactionId) {
      this.setStatus("No active interaction selected.");
      return;
    }

    if (!this.Desktop?.agentContact?.blindTransferV2) {
      this.setStatus(
        "blindTransferV2() is not available in this SDK."
      );
      return;
    }

    this.transferring = true;
    this.setButtonEnabled(false);

    this.setStatus(
      `Transferring to ${SALES_NUMBER}…`
    );

    try {
      await this.Desktop.agentContact.blindTransferV2({
        interactionId: this.interactionId,

        data: {
          to: SALES_NUMBER,
          destinationType: "dialNumber"
        }
      });

      this.setStatus(
        `Blind transfer initiated to ${SALES_NUMBER}.`
      );

    } catch (error) {
      console.error(
        "[wxcc-quick-transfer-widget] Blind transfer failed",
        error
      );

      this.transferring = false;
      this.setButtonEnabled(true);

      this.setStatus(
        `Transfer failed: ${this.getErrorMessage(error)}`
      );
    }
  }

  getErrorMessage(error) {
    if (!error) return "Unknown error";

    if (typeof error === "string") {
      return error;
    }

    return (
      error.message ||
      error.reason ||
      error.error ||
      "Unknown error"
    );
  }

  setButtonEnabled(enabled) {
    const button =
      this.shadowRoot?.querySelector("#sales");

    if (button) {
      button.disabled =
        !enabled || this.transferring;
    }
  }

  setStatus(message) {
    const status =
      this.shadowRoot?.querySelector("#status");

    if (status) {
      status.textContent = message;
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>

        :host {
          display: block;
          width: 100%;
          box-sizing: border-box;
          font-family: Arial, Helvetica, sans-serif;
        }

        .card {
          padding: 16px;
          box-sizing: border-box;
        }

        .title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 6px;
        }

        .subtitle {
          font-size: 12px;
          color: #5b6770;
          margin-bottom: 14px;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        button {
          width: 100%;
          min-height: 48px;
          border: 2px solid rgba(0,0,0,.18);
          border-radius: 8px;
          padding: 10px 14px;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          box-sizing: border-box;
          box-shadow: 0 2px 4px rgba(0,0,0,.18);
          transition:
            filter .15s ease,
            opacity .15s ease;
        }

        button:hover:not(:disabled) {
          filter: brightness(.94);
        }

        button:disabled {
          opacity: .45;
          cursor: not-allowed;
          box-shadow: none;
        }

        #sales {
          background: #2563eb;
          border-color: #1d4ed8;
        }

        #billing {
          background: #16a34a;
        }

        #technical {
          background: #d97706;
        }

        #reception {
          background: #7c3aed;
        }

        #manager {
          background: #dc2626;
        }

        #other {
          background: #475569;
        }

        .status {
          margin-top: 14px;
          padding: 8px 10px;
          border-radius: 6px;
          background: rgba(0,0,0,.05);
          font-size: 12px;
          line-height: 1.35;
          word-break: break-word;
        }

      </style>

      <div class="card">

        <div class="title">
          Quick Transfer
        </div>

        <div class="subtitle">
          Sales is configured as a blind transfer test.
        </div>

        <div class="grid">

          <button
            id="sales"
            type="button"
            disabled
          >
            Sales
          </button>

          <button
            id="billing"
            type="button"
            disabled
          >
            Billing
          </button>

          <button
            id="technical"
            type="button"
            disabled
          >
            Technical Support
          </button>

          <button
            id="reception"
            type="button"
            disabled
          >
            Reception
          </button>

          <button
            id="manager"
            type="button"
            disabled
          >
            Manager
          </button>

          <button
            id="other"
            type="button"
            disabled
          >
            Other
          </button>

        </div>

        <div
          id="status"
          class="status"
        >
          Initializing…
        </div>

      </div>
    `;

    this.shadowRoot
      .querySelector("#sales")
      .addEventListener(
        "click",
        () => this.blindTransferSales()
      );
  }
}

customElements.define(
  "wxcc-quick-transfer",
  WxccQuickTransfer
);
