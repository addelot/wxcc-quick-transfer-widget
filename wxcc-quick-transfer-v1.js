// Webex Contact Center Quick Transfer v1
// Based on the working Quick Transfer implementation supplied by the user.
// Configuration (labels, destinations and colors) is supplied by Desktop Layout JSON.

(function () {
  "use strict";

  const TAG = "wxcc-quick-transfer-v1";
  const LOG = "[QuickTransfer]";
  const VERSION = "v1";

  if (customElements.get(TAG)) {
    console.log(LOG, TAG, "already defined, skipping (" + VERSION + ")");
    return;
  }

  const SDK_URLS = [
    "https://cdn.jsdelivr.net/npm/@wxcc-desktop/sdk/+esm",
    "https://esm.sh/@wxcc-desktop/sdk"
  ];

  let sdkPromise = null;
  let initPromise = null;

  function loadDesktop() {
    if (sdkPromise) return sdkPromise;

    sdkPromise = (async () => {
      if (window.Desktop && window.Desktop.agentContact) {
        return window.Desktop;
      }

      for (const url of SDK_URLS) {
        try {
          const mod = await import(url);
          const D =
            mod.Desktop ||
            (mod.default && (mod.default.Desktop || mod.default)) ||
            null;

          if (D && D.agentContact) {
            console.log(LOG, "SDK loaded from", url);
            return D;
          }
        } catch (e) {
          console.warn(LOG, "SDK load failed from", url, e);
        }
      }

      return null;
    })();

    return sdkPromise;
  }

  function initDesktop(D) {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      try {
        if (D.config && typeof D.config.init === "function") {
          await D.config.init({
            widgetName: "quick-transfers",
            widgetProvider: "Axis"
          });
        }
      } catch (e) {
        console.error(LOG, "Desktop.config.init failed", e);
      }
    })();

    return initPromise;
  }

  const template = document.createElement("template");

  template.innerHTML = `
    <style>
      :host {
        display: block;
        width: 100%;
        min-height: 100%;
        box-sizing: border-box;
        font-family: inherit;
      }

      .root {
        padding: 16px;
        box-sizing: border-box;
        width: 100%;
      }

      .title {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 6px;
      }

      .subtitle {
        font-size: 13px;
        margin-bottom: 16px;
        color: #5f6368;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        width: 100%;
      }

      button {
        width: 100%;
        min-height: 52px;
        padding: 10px 14px;
        border: 2px solid rgba(0,0,0,.16);
        border-radius: 8px;
        color: #fff;
        font-size: 14px;
        font-family: inherit;
        font-weight: 600;
        cursor: pointer;
        box-sizing: border-box;
        box-shadow: 0 2px 4px rgba(0,0,0,.16);
      }

      button:hover:not(:disabled) {
        filter: brightness(.92);
      }

      button:disabled {
        opacity: .45;
        cursor: not-allowed;
      }

      .sales { background: #2563eb; }
      .billing { background: #16a34a; }
      .technical { background: #d97706; }
      .reception { background: #7c3aed; }
      .manager { background: #dc2626; }
      .other { background: #475569; }

      .status {
        margin-top: 14px;
        padding: 9px 10px;
        border-radius: 6px;
        background: #f1f5f9;
        color: #334155;
        font-size: 12px;
      }

      @media (max-width: 520px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
    </style>

    <div class="root">
      <div class="title">Quick Transfer</div>
      <div class="subtitle">
        Select a destination for the active call.
      </div>

      <div class="grid">
        <button class="sales">Sales</button>
        <button class="billing">Billing</button>
        <button class="technical">Technical Support</button>
        <button class="reception">Reception</button>
        <button class="manager">Manager</button>
        <button class="other">Other</button>
      </div>

      <div class="status">
        Loading Webex Contact Center SDK…
      </div>
    </div>
  `;

  class QuickTransferWidget extends HTMLElement {
    constructor() {
      super();

      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(
        template.content.cloneNode(true)
      );

      this._D = null;
      this._active = false;
      this._busy = false;
      this._poll = null;

      this._status =
        this.shadowRoot.querySelector(".status");

      this._buttons = [
        ...this.shadowRoot.querySelectorAll("button")
      ];

      this._events = [
        "eAgentContact",
        "eAgentContactAssigned",
        "eAgentContactEnded",
        "eAgentContactWrappedUp",
        "eAgentOfferContact",
        "eAgentWrapup"
      ];

      this._boundUpdate =
        this.updateButtons.bind(this);
    }

    get buttons() {
      return this._buttonsProp;
    }

    set buttons(value) {
      this._buttonsProp = value;

      if (this.isConnected) {
        this._applyDestinations();
      }
    }

    _getDestinations() {
      let list = this._buttonsProp;

      if (typeof list === "string") {
        try {
          list = JSON.parse(list);
        } catch (e) {
          list = null;
        }
      }

      if (!Array.isArray(list)) {
        try {
          list = JSON.parse(
            this.getAttribute("data-buttons") || "[]"
          );
        } catch (e) {
          list = [];
        }
      }

      return Array.isArray(list)
        ? list.filter(x => x && x.label)
        : [];
    }

    _applyDestinations() {
      const list = this._getDestinations();

      this._buttons.forEach((button, index) => {
        const item = list[index];

        if (!item) {
          button.disabled = true;
          delete button.dataset.dest;
          return;
        }

        button.textContent = item.label;

        button.dataset.dest =
          String(item.dest).trim();

        button.dataset.label =
          item.label;

        button.title =
          `${item.label} → ${item.dest}`;

        if (item.color) {
          button.style.background =
            item.color;
        }

        if (item.textColor) {
          button.style.color =
            item.textColor;
        }
      });
    }

    connectedCallback() {
      this._applyDestinations();

      this._buttons.forEach(button => {
        button.addEventListener("click", () => {
          const dest =
            button.dataset.dest;

          const label =
            button.dataset.label ||
            button.textContent.trim();

          if (dest) {
            this.handleTransfer(
              dest,
              label
            );
          }
        });
      });

      this.start();
    }

    disconnectedCallback() {
      clearInterval(this._poll);

      if (
        this._D?.agentContact
          ?.removeEventListener
      ) {
        this._events.forEach(evt => {
          try {
            this._D.agentContact
              .removeEventListener(
                evt,
                this._boundUpdate
              );
          } catch (e) {}
        });
      }
    }

    _setStatus(text) {
      this._status.textContent = text;
    }

    _setButtonsEnabled(enabled) {
      this._buttons.forEach(button => {
        button.disabled =
          !enabled ||
          !button.dataset.dest;
      });
    }

    async start() {
      this._setStatus(
        "Loading Webex Contact Center SDK…"
      );

      const D = await loadDesktop();

      if (!D) {
        this._setStatus(
          "SDK could not be loaded. Check browser console."
        );

        this._setButtonsEnabled(false);

        return;
      }

      this._D = D;

      await initDesktop(D);

      if (D.agentContact?.addEventListener) {
        this._events.forEach(evt => {
          try {
            D.agentContact.addEventListener(
              evt,
              this._boundUpdate
            );
          } catch (e) {}
        });
      }

      clearInterval(this._poll);

      this._poll = setInterval(
        this._boundUpdate,
        2000
      );

      await this.updateButtons();
    }

    async _findActiveCall() {
      const D = this._D;

      if (
        !D?.actions ||
        typeof D.actions.getTaskMap !==
          "function"
      ) {
        return null;
      }

      let map;

      try {
        map =
          await D.actions.getTaskMap();
      } catch (e) {
        console.warn(
          LOG,
          "getTaskMap failed",
          e
        );

        return null;
      }

      if (!map) return null;

      const entries =
        map instanceof Map
          ? Array.from(map.entries())
          : Object.entries(map);

      for (
        const [key, task]
        of entries
      ) {
        if (!task) continue;

        const interaction =
          task.interaction || {};

        const media =
          task.mediaType ||
          interaction.mediaType ||
          task.mediaChannel;

        if (media !== "telephony") {
          continue;
        }

        const state =
          String(
            task.state ||
            interaction.state ||
            ""
          ).toLowerCase();

        if (
          [
            "ended",
            "wrapup",
            "wrap_up",
            "closed",
            "terminated"
          ].includes(state)
        ) {
          continue;
        }

        if (
          task.isTerminated ||
          interaction.isTerminated ||
          task.isWrapUp
        ) {
          continue;
        }

        return (
          task.interactionId ||
          interaction.interactionId ||
          key
        );
      }

      return null;
    }

    async updateButtons() {
      if (this._busy) return;

      const interactionId =
        await this._findActiveCall();

      this._active =
        !!interactionId;

      this._setButtonsEnabled(
        this._active
      );

      this._setStatus(
        this._active
          ? "Active call — choose a transfer destination."
          : "No active call."
      );
    }

    async handleTransfer(
      dest,
      label
    ) {
      const D = this._D;

      if (
        !D?.agentContact ||
        typeof D.agentContact
          .blindTransfer !==
          "function"
      ) {
        alert(
          "Transfer API is not available."
        );

        return;
      }

      const interactionId =
        await this._findActiveCall();

      if (!interactionId) {
        alert(
          "No active call to transfer."
        );

        return;
      }

      this._busy = true;

      this._setButtonsEnabled(
        false
      );

      this._setStatus(
        `Transferring to ${label || dest}…`
      );

      try {
        // Same blindTransfer DN payload
        // as the colleague's working widget.
        await D.agentContact
          .blindTransfer({
            interactionId,

            data: {
              destAgentId: dest,
              destinationType: "DN",
              mediaType: "telephony"
            }
          });

        console.log(
          LOG,
          "Transfer succeeded to",
          dest
        );

        this._setStatus(
          `Transferred to ${label || dest}.`
        );

      } catch (err) {
        console.error(
          LOG,
          "Transfer failed",
          err
        );

        const message =
          err?.details?.msg
            ?.errorMessage ||
          err?.message ||
          JSON.stringify(err);

        alert(
          "Transfer failed: " +
          message
        );

        this._setStatus(
          "Transfer failed."
        );

      } finally {
        this._busy = false;

        await this.updateButtons();
      }
    }
  }

  customElements.define(
    TAG,
    QuickTransferWidget
  );

  console.log(
    LOG,
    TAG,
    "defined (" + VERSION + ")"
  );

})();
