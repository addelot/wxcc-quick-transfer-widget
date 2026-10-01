// Webex Contact Center Quick Transfer V6
// Desktop Layout-driven Quick Transfer widget.
//
// Button labels and destination numbers are supplied by the
// Webex Contact Center Desktop Layout JSON through properties.
//
// No confirmation popup.
// Clicking a configured button immediately performs a blind transfer.
//
// Transfer API:
// Desktop.agentContact.blindTransferV2()

(function () {
  "use strict";

  const TAG = "wxcc-quick-transfer-v6";
  const LOG = "[WXCC QUICK TRANSFER V6]";

  const SDK_URLS = [
    "https://cdn.jsdelivr.net/npm/@wxcc-desktop/sdk/+esm",
    "https://esm.sh/@wxcc-desktop/sdk"
  ];

  if (customElements.get(TAG)) {
    console.log(LOG, "Already registered");
    return;
  }

  class QuickTransferV6 extends HTMLElement {

    static get observedAttributes() {
      return [
        "sales-label",
        "sales-number",
        "billing-label",
        "billing-number",
        "technical-label",
        "technical-number",
        "reception-label",
        "reception-number",
        "manager-label",
        "manager-number",
        "other-label",
        "other-number"
      ];
    }

    constructor() {
      super();

      /*
       * Defaults are deliberately empty except for Sales.
       * Desktop Layout properties override these values.
       */
      this.config = {
        salesLabel: "Sales",
        salesNumber: "",
        billingLabel: "Billing",
        billingNumber: "",
        technicalLabel: "Technical Support",
        technicalNumber: "",
        receptionLabel: "Reception",
        receptionNumber: "",
        managerLabel: "Manager",
        managerNumber: "",
        otherLabel: "Other",
        otherNumber: ""
      };

      this.Desktop = null;
      this.activeInteractionId = null;
      this.transferInProgress = false;
      this.pollTimer = null;

      const shadow = this.attachShadow({
        mode: "open"
      });

      shadow.innerHTML = `
        <style>

          :host {
            display: block;
            width: 100%;
            box-sizing: border-box;
            font-family: inherit;
          }

          .root {
            padding: 16px;
          }

          h2 {
            margin: 0 0 14px 0;
            font-size: 17px;
          }

          .buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          button {
            width: 100%;
            min-height: 54px;
            padding: 10px 14px;
            border: 2px solid rgba(0,0,0,0.18);
            border-radius: 8px;
            color: #ffffff;
            font-weight: 600;
            font-size: 14px;
            box-sizing: border-box;
            cursor: pointer;
            transition:
              opacity 0.15s ease,
              transform 0.05s ease;
          }

          button:hover:not(:disabled) {
            opacity: 0.9;
          }

          button:active:not(:disabled) {
            transform: translateY(1px);
          }

          button:disabled {
            opacity: 0.42;
            cursor: not-allowed;
          }

          .sales {
            background: #2563eb;
          }

          .billing {
            background: #16a34a;
          }

          .technical {
            background: #d97706;
          }

          .reception {
            background: #7c3aed;
          }

          .manager {
            background: #dc2626;
          }

          .other {
            background: #475569;
          }

          .label {
            display: block;
          }

          .number {
            display: block;
            margin-top: 3px;
            font-size: 11px;
            font-weight: 400;
            opacity: 0.95;
          }

          .status {
            display: none;
            padding: 9px 12px;
            margin-bottom: 12px;
            border-radius: 7px;
            border: 1px solid #cbd5e1;
            font-size: 12px;
          }

          .status.success {
            display: block;
            background: #dcfce7;
            border-color: #86efac;
            color: #166534;
          }

          .status.error {
            display: block;
            background: #fee2e2;
            border-color: #fca5a5;
            color: #991b1b;
          }

          .status.warning {
            display: block;
            background: #fef3c7;
            border-color: #fcd34d;
            color: #92400e;
          }

          .status.info {
            display: block;
            background: #dbeafe;
            border-color: #93c5fd;
            color: #1e40af;
          }

          @media (max-width: 700px) {
            .buttons {
              grid-template-columns: 1fr;
            }
          }

        </style>

        <div class="root">

          <h2>Quick Transfer</h2>

          <div id="status" class="status"></div>

          <div class="buttons">

            <button id="salesButton" class="sales" disabled>
              <span class="label"></span>
              <span class="number"></span>
            </button>

            <button id="billingButton" class="billing" disabled>
              <span class="label"></span>
              <span class="number"></span>
            </button>

            <button id="technicalButton" class="technical" disabled>
              <span class="label"></span>
              <span class="number"></span>
            </button>

            <button id="receptionButton" class="reception" disabled>
              <span class="label"></span>
              <span class="number"></span>
            </button>

            <button id="managerButton" class="manager" disabled>
              <span class="label"></span>
              <span class="number"></span>
            </button>

            <button id="otherButton" class="other" disabled>
              <span class="label"></span>
              <span class="number"></span>
            </button>

          </div>

        </div>
      `;

      this.shadow = shadow;
    }

    connectedCallback() {
      console.log(LOG, "Widget connected");

      /*
       * Desktop may supply values as JS properties.
       * Attributes are also supported as a fallback.
       */
      this.readLayoutProperties();
      this.renderButtons();
      this.start();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) {
        return;
      }

      const map = {
        "sales-label": "salesLabel",
        "sales-number": "salesNumber",
        "billing-label": "billingLabel",
        "billing-number": "billingNumber",
        "technical-label": "technicalLabel",
        "technical-number": "technicalNumber",
        "reception-label": "receptionLabel",
        "reception-number": "receptionNumber",
        "manager-label": "managerLabel",
        "manager-number": "managerNumber",
        "other-label": "otherLabel",
        "other-number": "otherNumber"
      };

      const property = map[name];

      if (property) {
        this.config[property] =
          newValue || "";

        if (this.shadow) {
          this.renderButtons();
          this.updateButtonStates();
        }
      }
    }

    readLayoutProperties() {
      const properties = [
        "salesLabel",
        "salesNumber",
        "billingLabel",
        "billingNumber",
        "technicalLabel",
        "technicalNumber",
        "receptionLabel",
        "receptionNumber",
        "managerLabel",
        "managerNumber",
        "otherLabel",
        "otherNumber"
      ];

      properties.forEach(property => {
        if (
          this[property] !== undefined &&
          this[property] !== null
        ) {
          this.config[property] =
            String(this[property]);
        }
      });

      /*
       * Attribute fallback.
       */
      const attributes = {
        salesLabel: "sales-label",
        salesNumber: "sales-number",
        billingLabel: "billing-label",
        billingNumber: "billing-number",
        technicalLabel: "technical-label",
        technicalNumber: "technical-number",
        receptionLabel: "reception-label",
        receptionNumber: "reception-number",
        managerLabel: "manager-label",
        managerNumber: "manager-number",
        otherLabel: "other-label",
        otherNumber: "other-number"
      };

      Object.entries(attributes).forEach(
        ([property, attribute]) => {

          const value =
            this.getAttribute(attribute);

          if (
            value !== null &&
            value !== ""
          ) {
            this.config[property] =
              value;
          }

        }
      );

      console.log(
        LOG,
        "Layout configuration:",
        this.config
      );
    }

    getButtons() {
      return [
        {
          id: "salesButton",
          label: this.config.salesLabel,
          number: this.config.salesNumber
        },
        {
          id: "billingButton",
          label: this.config.billingLabel,
          number: this.config.billingNumber
        },
        {
          id: "technicalButton",
          label: this.config.technicalLabel,
          number: this.config.technicalNumber
        },
        {
          id: "receptionButton",
          label: this.config.receptionLabel,
          number: this.config.receptionNumber
        },
        {
          id: "managerButton",
          label: this.config.managerLabel,
          number: this.config.managerNumber
        },
        {
          id: "otherButton",
          label: this.config.otherLabel,
          number: this.config.otherNumber
        }
      ];
    }

    renderButtons() {

      this.getButtons().forEach(config => {

        const button =
          this.shadow.getElementById(
            config.id
          );

        if (!button) {
          return;
        }

        const label =
          button.querySelector(".label");

        const number =
          button.querySelector(".number");

        if (label) {
          label.textContent =
            config.label || "Transfer";
        }

        if (number) {
          number.textContent =
            config.number || "";
        }

        if (!button.dataset.listenerAttached) {

          button.addEventListener(
            "click",
            () => this.transfer(config)
          );

          button.dataset.listenerAttached =
            "true";
        }

      });
    }

    showStatus(message, type) {

      const status =
        this.shadow.getElementById("status");

      if (!status) {
        return;
      }

      status.className =
        "status " +
        (type || "info");

      status.textContent =
        message;
    }

    hideStatus() {

      const status =
        this.shadow.getElementById("status");

      if (!status) {
        return;
      }

      status.className =
        "status";

      status.textContent =
        "";
    }

    updateButtonStates() {

      this.getButtons().forEach(config => {

        const button =
          this.shadow.getElementById(
            config.id
          );

        if (!button) {
          return;
        }

        /*
         * No number = button intentionally disabled.
         * No active interaction = all transfers disabled.
         */

        button.disabled =
          !config.number ||
          !this.activeInteractionId ||
          this.transferInProgress;

      });

    }

    async loadSDK() {

      if (
        window.Desktop &&
        window.Desktop.config
      ) {
        return window.Desktop;
      }

      for (
        const url of SDK_URLS
      ) {

        try {

          console.log(
            LOG,
            "Loading SDK:",
            url
          );

          const module =
            await import(url);

          const Desktop =
            module.Desktop ||
            module.default?.Desktop ||
            module.default ||
            null;

          if (
            Desktop &&
            Desktop.config
          ) {
            return Desktop;
          }

        } catch (error) {

          console.warn(
            LOG,
            "SDK URL failed:",
            url,
            error
          );

        }

      }

      throw new Error(
        "Unable to load the Webex Contact Center Desktop SDK."
      );
    }

    normalizeTaskMap(taskMap) {

      if (!taskMap) {
        return [];
      }

      if (
        taskMap instanceof Map
      ) {

        return Array.from(
          taskMap.entries()
        ).map(
          ([key, value]) => ({
            key,
            task: value
          })
        );

      }

      if (
        Array.isArray(taskMap)
      ) {

        return taskMap.map(
          (task, index) => ({
            key: String(index),
            task
          })
        );

      }

      if (
        typeof taskMap === "object"
      ) {

        return Object.entries(
          taskMap
        ).map(
          ([key, value]) => ({
            key,
            task: value
          })
        );

      }

      return [];
    }

    getTaskSummary(entry) {

      const task =
        entry?.task || {};

      const interaction =
        task.interaction || {};

      const interactionId =
        task.interactionId ||
        interaction.interactionId ||
        null;

      const mediaType =
        interaction.mediaType ||
        interaction.mediaChannel ||
        task.mediaType ||
        null;

      const state =
        interaction.state ||
        task.state ||
        null;

      return {
        interactionId,
        mediaType,
        state
      };
    }

    isActiveTelephony(summary) {

      if (
        !summary.interactionId
      ) {
        return false;
      }

      const media =
        String(
          summary.mediaType || ""
        ).toLowerCase();

      if (
        media !== "telephony"
      ) {
        return false;
      }

      const state =
        String(
          summary.state || ""
        ).toLowerCase();

      const inactiveStates = [
        "ended",
        "terminated",
        "closed",
        "wrapup",
        "wrappedup",
        "wrapped_up"
      ];

      return !inactiveStates.includes(
        state
      );
    }

    async findActiveInteraction() {

      if (!this.Desktop) {

        throw new Error(
          "Desktop object is not available."
        );

      }

      if (
        !this.Desktop.actions ||
        typeof this.Desktop.actions.getTaskMap !==
          "function"
      ) {

        throw new Error(
          "Desktop.actions.getTaskMap() is not available."
        );

      }

      const taskMap =
        await this.Desktop.actions.getTaskMap();

      const entries =
        this.normalizeTaskMap(
          taskMap
        );

      const summaries =
        entries.map(
          entry =>
            this.getTaskSummary(
              entry
            )
        );

      return (
        summaries.find(
          summary =>
            this.isActiveTelephony(
              summary
            )
        ) || null
      );
    }

    async refreshInteraction() {

      try {

        const active =
          await this.findActiveInteraction();

        this.activeInteractionId =
          active?.interactionId || null;

        this.updateButtonStates();

        if (
          !active &&
          !this.transferInProgress
        ) {

          this.hideStatus();

        }

      } catch (error) {

        console.error(
          LOG,
          "Interaction lookup failed:",
          error
        );

        this.activeInteractionId =
          null;

        this.updateButtonStates();

        this.showStatus(
          "Unable to detect the active call.",
          "error"
        );
      }
    }

    async transfer(buttonConfig) {

      if (
        this.transferInProgress
      ) {
        return;
      }

      if (
        !buttonConfig.number
      ) {
        return;
      }

      if (
        !this.Desktop?.agentContact
      ) {

        this.showStatus(
          "Contact control is not available.",
          "error"
        );

        return;
      }

      if (
        typeof this.Desktop.agentContact.blindTransferV2 !==
          "function"
      ) {

        this.showStatus(
          "blindTransferV2() is not available.",
          "error"
        );

        return;
      }

      /*
       * Refresh immediately before transfer to make
       * sure the interaction ID is current.
       */

      let active = null;

      try {

        active =
          await this.findActiveInteraction();

      } catch (error) {

        console.error(
          LOG,
          "Could not refresh interaction:",
          error
        );

      }

      const interactionId =
        active?.interactionId ||
        this.activeInteractionId;

      if (!interactionId) {

        this.showStatus(
          "No active call was found.",
          "warning"
        );

        return;
      }

      this.transferInProgress =
        true;

      this.activeInteractionId =
        interactionId;

      this.updateButtonStates();

      this.showStatus(
        "Transferring to " +
          buttonConfig.label +
          "...",
        "info"
      );

      try {

        console.log(
          LOG,
          "Starting blind transfer",
          {
            interactionId,
            to: buttonConfig.number,
            destinationType:
              "dialNumber"
          }
        );

        const response =
          await this.Desktop.agentContact.blindTransferV2({
            interactionId,

            data: {
              to:
                buttonConfig.number,

              destinationType:
                "dialNumber"
            }
          });

        console.log(
          LOG,
          "blindTransferV2 response:",
          response
        );

        const responseType =
          response?.type ||
          response?.data?.type ||
          response?.data?.eventType ||
          "Unknown";

        if (
          responseType ===
            "AgentBlindTransferFailedEvent" ||
          responseType ===
            "AgentBlindTransferFailed"
        ) {

          const reason =
            response?.reason ||
            response?.data?.reason ||
            "Unknown failure reason";

          throw new Error(
            reason
          );
        }

        this.showStatus(
          "Transfer sent to " +
            buttonConfig.label +
            ".",
          "success"
        );

        setTimeout(
          () => this.refreshInteraction(),
          1000
        );

      } catch (error) {

        console.error(
          LOG,
          "Blind transfer failed:",
          error
        );

        this.showStatus(
          "Transfer failed: " +
            (error?.message || error),
          "error"
        );

      } finally {

        this.transferInProgress =
          false;

        setTimeout(
          () => this.refreshInteraction(),
          500
        );
      }
    }

    async start() {

      try {

        this.Desktop =
          await this.loadSDK();

        if (
          !this.Desktop.config
        ) {

          throw new Error(
            "Desktop.config is not available."
          );
        }

        if (
          typeof this.Desktop.config.init !==
            "function"
        ) {

          throw new Error(
            "Desktop.config.init() is not available."
          );
        }

        await this.Desktop.config.init(
          "quick-transfer-v6",
          "Axis"
        );

        await this.refreshInteraction();

        this.pollTimer =
          setInterval(
            () =>
              this.refreshInteraction(),
            2000
          );

      } catch (error) {

        console.error(
          LOG,
          "Startup failed:",
          error
        );

        this.showStatus(
          "Quick Transfer could not start: " +
            (error?.message || error),
          "error"
        );
      }
    }

    disconnectedCallback() {

      if (
        this.pollTimer
      ) {

        clearInterval(
          this.pollTimer
        );

        this.pollTimer =
          null;
      }
    }
  }

  customElements.define(
    TAG,
    QuickTransferV6
  );

  console.log(
    LOG,
    "Registered:",
    TAG
  );

})();
