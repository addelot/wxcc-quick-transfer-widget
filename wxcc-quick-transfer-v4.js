// Webex Contact Center Quick Transfer V4
// Sales blind transfer test using the current Desktop SDK.
// Sales destination: +46709246443
//
// V4 tests:
// 1. SDK loading
// 2. Desktop SDK initialization
// 3. Active interaction detection
// 4. Sales blindTransferV2() to a dial number
//
// Other buttons are intentionally disabled.
// No automatic transfer is performed.

(function () {
  "use strict";

  const TAG = "wxcc-quick-transfer-v4";
  const LOG = "[WXCC QUICK TRANSFER V4]";

  const SALES_NUMBER = "+46709246443";

  const SDK_URLS = [
    "https://cdn.jsdelivr.net/npm/@wxcc-desktop/sdk/+esm",
    "https://esm.sh/@wxcc-desktop/sdk"
  ];

  if (customElements.get(TAG)) {
    console.log(LOG, "Already registered");
    return;
  }

  class QuickTransferV4 extends HTMLElement {

    constructor() {
      super();

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
            margin: 0 0 6px 0;
            font-size: 18px;
          }

          .description {
            margin-bottom: 16px;
            font-size: 13px;
            color: #475569;
          }

          .status {
            padding: 11px 14px;
            margin-bottom: 10px;
            border-radius: 7px;
            border: 1px solid #cbd5e1;
            background: #f8fafc;
          }

          .label {
            font-weight: 600;
            margin-bottom: 4px;
          }

          .value {
            font-size: 13px;
          }

          .success {
            background: #dcfce7;
            border-color: #86efac;
            color: #166534;
          }

          .error {
            background: #fee2e2;
            border-color: #fca5a5;
            color: #991b1b;
          }

          .warning {
            background: #fef3c7;
            border-color: #fcd34d;
            color: #92400e;
          }

          .info {
            background: #dbeafe;
            border-color: #93c5fd;
            color: #1e40af;
          }

          .interaction {
            padding: 12px 14px;
            margin-bottom: 14px;
            border: 1px solid #cbd5e1;
            border-radius: 7px;
            background: #ffffff;
          }

          .row {
            display: grid;
            grid-template-columns: 150px 1fr;
            gap: 8px;
            margin: 4px 0;
            font-size: 12px;
          }

          .key {
            font-weight: 600;
            color: #475569;
          }

          .code {
            font-family: monospace;
            word-break: break-all;
          }

          .transfer-title {
            font-size: 16px;
            font-weight: 600;
            margin: 16px 0 10px 0;
          }

          .buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          button {
            width: 100%;
            min-height: 50px;
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
            opacity: 0.45;
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

          .result {
            margin-top: 12px;
          }

          .small {
            margin-top: 8px;
            font-size: 11px;
            color: #64748b;
          }

          @media (max-width: 700px) {

            .buttons {
              grid-template-columns: 1fr;
            }

            .row {
              grid-template-columns: 1fr;
              gap: 2px;
            }

          }

        </style>

        <div class="root">

          <h2>Quick Transfer V4</h2>

          <div class="description">
            Sales blind transfer test.
            Only Sales is currently configured.
          </div>

          <div id="sdkStatus" class="status info">

            <div class="label">
              SDK
            </div>

            <div id="sdkStatusValue" class="value">
              Loading...
            </div>

          </div>

          <div id="interactionStatus" class="status warning">

            <div class="label">
              Active Interaction
            </div>

            <div id="interactionStatusValue" class="value">
              Looking for an active telephony interaction...
            </div>

          </div>

          <div id="interactionDetails"
               class="interaction"
               style="display:none;">

            <div class="label">
              Current Interaction
            </div>

            <div class="row">
              <div class="key">
                Interaction ID
              </div>

              <div id="interactionId"
                   class="code">
                —
              </div>
            </div>

            <div class="row">
              <div class="key">
                Media Type
              </div>

              <div id="mediaType">
                —
              </div>
            </div>

            <div class="row">
              <div class="key">
                State
              </div>

              <div id="state">
                —
              </div>
            </div>

            <div class="row">
              <div class="key">
                Direction
              </div>

              <div id="direction">
                —
              </div>
            </div>

            <div class="row">
              <div class="key">
                ANI
              </div>

              <div id="ani">
                —
              </div>
            </div>

            <div class="row">
              <div class="key">
                DNIS
              </div>

              <div id="dnis">
                —
              </div>
            </div>

          </div>

          <div class="transfer-title">
            Quick Transfer
          </div>

          <div class="buttons">

            <button
              id="salesButton"
              class="sales"
              disabled>

              Sales<br>

              <span style="font-size:11px;font-weight:400;">
                +46709246443
              </span>

            </button>

            <button
              class="billing"
              disabled>

              Billing

            </button>

            <button
              class="technical"
              disabled>

              Technical Support

            </button>

            <button
              class="reception"
              disabled>

              Reception

            </button>

            <button
              class="manager"
              disabled>

              Manager

            </button>

            <button
              class="other"
              disabled>

              Other

            </button>

          </div>

          <div id="result"
               class="result"
               style="display:none;">
          </div>

          <div class="small">

            The Sales button performs a blind transfer only after
            you confirm the destination.

          </div>

        </div>
      `;

      this.shadow = shadow;

      this.Desktop = null;

      this.activeInteractionId = null;

      this.activeSummary = null;

      this.pollTimer = null;

      this.transferInProgress = false;

      this.onBlindTransferred =
        this.onBlindTransferred.bind(this);

      this.onBlindTransferFailed =
        this.onBlindTransferFailed.bind(this);
    }

    setStatus(
      id,
      message,
      type
    ) {

      const box =
        this.shadow.getElementById(id);

      const value =
        this.shadow.getElementById(
          id + "Value"
        );

      if (!box || !value) {
        return;
      }

      value.textContent =
        message;

      box.classList.remove(
        "success",
        "error",
        "warning",
        "info"
      );

      box.classList.add(
        type || "info"
      );
    }

    showResult(
      message,
      type
    ) {

      const result =
        this.shadow.getElementById(
          "result"
        );

      if (!result) {
        return;
      }

      result.style.display =
        "block";

      result.className =
        "status " +
        (type || "info");

      result.textContent =
        message;
    }

    async loadSDK() {

      if (
        window.Desktop &&
        window.Desktop.config
      ) {

        console.log(
          LOG,
          "Desktop already available"
        );

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

    normalizeTaskMap(
      taskMap
    ) {

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

    getTaskSummary(
      entry
    ) {

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

      const contactDirection =
        interaction.contactDirection?.type ||
        null;

      const callDetails =
        interaction.callProcessingDetails ||
        {};

      return {

        key:
          entry.key,

        interactionId:
          interactionId,

        mediaType:
          mediaType,

        state:
          state,

        direction:
          contactDirection,

        ani:
          callDetails.ani ||
          null,

        dnis:
          callDetails.dnis ||
          null,

        task:
          task,

        interaction:
          interaction

      };
    }

    isActiveTelephony(
      summary
    ) {

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

    updateInteractionUI(
      summary
    ) {

      const details =
        this.shadow.getElementById(
          "interactionDetails"
        );

      if (!summary) {

        this.activeInteractionId =
          null;

        this.activeSummary =
          null;

        if (details) {

          details.style.display =
            "none";

        }

        const sales =
          this.shadow.getElementById(
            "salesButton"
          );

        if (sales) {

          sales.disabled =
            true;

        }

        this.setStatus(
          "interactionStatus",
          "No active telephony interaction found.",
          "warning"
        );

        return;
      }

      this.activeInteractionId =
        summary.interactionId;

      this.activeSummary =
        summary;

      if (details) {

        details.style.display =
          "block";

      }

      this.setText(
        "interactionId",
        summary.interactionId
      );

      this.setText(
        "mediaType",
        summary.mediaType
      );

      this.setText(
        "state",
        summary.state
      );

      this.setText(
        "direction",
        summary.direction
      );

      this.setText(
        "ani",
        summary.ani
      );

      this.setText(
        "dnis",
        summary.dnis
      );

      const sales =
        this.shadow.getElementById(
          "salesButton"
        );

      if (sales) {

        sales.disabled =
          this.transferInProgress;

      }

      this.setStatus(
        "interactionStatus",

        "✓ Active telephony interaction: " +
          summary.interactionId,

        "success"
      );
    }

    setText(
      id,
      value
    ) {

      const element =
        this.shadow.getElementById(
          id
        );

      if (!element) {
        return;
      }

      element.textContent =
        value === null ||
        value === undefined ||
        value === ""
          ? "—"
          : String(value);
    }

    async findActiveInteraction() {

      if (
        !this.Desktop
      ) {

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

      console.log(
        LOG,
        "TaskMap:",
        taskMap
      );

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

      const active =
        summaries.find(
          summary =>
            this.isActiveTelephony(
              summary
            )
        );

      return active || null;
    }

    async refreshInteraction() {

      try {

        const active =
          await this.findActiveInteraction();

        this.updateInteractionUI(
          active
        );

      } catch (error) {

        console.error(
          LOG,
          "Interaction lookup failed:",
          error
        );

        this.setStatus(
          "interactionStatus",

          "✗ Unable to read the active interaction: " +
            (error?.message || error),

          "error"
        );
      }
    }

    async salesTransfer() {

      if (
        this.transferInProgress
      ) {
        return;
      }

      if (
        !this.Desktop
      ) {

        this.showResult(
          "Desktop SDK is not available.",
          "error"
        );

        return;
      }

      if (
        !this.Desktop.agentContact
      ) {

        this.showResult(
          "Desktop.agentContact is not available.",
          "error"
        );

        return;
      }

      if (
        typeof this.Desktop.agentContact.blindTransferV2 !==
          "function"
      ) {

        this.showResult(
          "blindTransferV2() is not available in this Desktop SDK.",
          "error"
        );

        return;
      }

      let interactionId =
        this.activeInteractionId;

      /*
       * Refresh immediately before transfer.
       * This avoids using a stale interaction ID.
       */

      try {

        const active =
          await this.findActiveInteraction();

        if (active) {

          interactionId =
            active.interactionId;

          this.updateInteractionUI(
            active
          );

        }

      } catch (error) {

        console.warn(
          LOG,
          "Could not refresh interaction before transfer:",
          error
        );

      }

      if (!interactionId) {

        this.showResult(
          "No active telephony interaction was found.",
          "warning"
        );

        return;
      }

      const confirmed =
        window.confirm(
          "Transfer the current call to Sales?\n\n" +
          "Destination: " +
          SALES_NUMBER +
          "\n\n" +
          "This is a blind transfer. " +
          "The current agent will leave the call."
        );

      if (!confirmed) {

        this.showResult(
          "Transfer cancelled.",
          "warning"
        );

        return;
      }

      this.transferInProgress =
        true;

      const salesButton =
        this.shadow.getElementById(
          "salesButton"
        );

      if (salesButton) {

        salesButton.disabled =
          true;

        salesButton.innerHTML =
          "Transferring...<br>" +
          '<span style="font-size:11px;font-weight:400;">' +
          SALES_NUMBER +
          "</span>";

      }

      this.showResult(
        "Sending blind transfer request to " +
          SALES_NUMBER +
          "...",
        "info"
      );

      try {

        console.log(
          LOG,
          "Starting blindTransferV2",
          {
            interactionId:
              interactionId,

            to:
              SALES_NUMBER,

            destinationType:
              "dialNumber"
          }
        );

        const response =
          await this.Desktop.agentContact.blindTransferV2({

            interactionId:
              interactionId,

            data: {

              to:
                SALES_NUMBER,

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
            response?.data?.interaction?.reason ||
            "Unknown failure reason";

          throw new Error(
            "Transfer failed: " +
              reason
          );
        }

        this.showResult(
          "✓ Blind transfer request accepted. " +
            "Response: " +
            responseType,
          "success"
        );

        console.log(
          LOG,
          "Transfer accepted:",
          response
        );

        if (salesButton) {

          salesButton.innerHTML =
            "✓ Transfer Sent<br>" +
            '<span style="font-size:11px;font-weight:400;">' +
            SALES_NUMBER +
            "</span>";

        }

      } catch (error) {

        console.error(
          LOG,
          "Blind transfer failed:",
          error
        );

        this.showResult(
          "✗ Blind transfer failed: " +
            (error?.message || error),
          "error"
        );

        if (salesButton) {

          salesButton.innerHTML =
            "Sales<br>" +
            '<span style="font-size:11px;font-weight:400;">' +
            SALES_NUMBER +
            "</span>";

        }

      } finally {

        this.transferInProgress =
          false;

        /*
         * We intentionally do not immediately
         * re-enable the button. The next task-map
         * refresh will determine whether an active
         * interaction still exists.
         */

        setTimeout(
          () => {
            this.refreshInteraction();
          },
          1000
        );

      }
    }

    subscribeTransferEvents() {

      if (
        !this.Desktop.agentContact ||
        typeof this.Desktop.agentContact.addEventListener !==
          "function"
      ) {

        console.warn(
          LOG,
          "agentContact event subscription is not available."
        );

        return;
      }

      try {

        this.Desktop.agentContact.addEventListener(
          "eAgentblindTransferred",
          this.onBlindTransferred
        );

        this.Desktop.agentContact.addEventListener(
          "eAgentBlindTransferred",
          this.onBlindTransferred
        );

        this.Desktop.agentContact.addEventListener(
          "eAgentblindTransferFailed",
          this.onBlindTransferFailed
        );

        this.Desktop.agentContact.addEventListener(
          "eAgentBlindTransferFailed",
          this.onBlindTransferFailed
        );

      } catch (error) {

        console.warn(
          LOG,
          "Could not subscribe to transfer events:",
          error
        );

      }
    }

    onBlindTransferred(
      event
    ) {

      console.log(
        LOG,
        "Blind transfer event:",
        event
      );

      this.showResult(
        "✓ Webex Contact Center reported a successful blind transfer.",
        "success"
      );
    }

    onBlindTransferFailed(
      event
    ) {

      console.error(
        LOG,
        "Blind transfer failure event:",
        event
      );

      const reason =
        event?.reason ||
        event?.data?.reason ||
        "Unknown reason";

      this.showResult(
        "✗ Webex Contact Center reported a transfer failure: " +
          reason,
        "error"
      );
    }

    async start() {

      try {

        this.Desktop =
          await this.loadSDK();

        this.setStatus(
          "sdkStatus",
          "✓ SDK loaded successfully.",
          "success"
        );

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
          "quick-transfer-v4",
          "Axis"
        );

        this.setStatus(
          "sdkStatus",
          "✓ SDK initialized successfully.",
          "success"
        );

        this.subscribeTransferEvents();

        const salesButton =
          this.shadow.getElementById(
            "salesButton"
          );

        if (salesButton) {

          salesButton.addEventListener(
            "click",
            () =>
              this.salesTransfer()
          );

        }

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

        this.setStatus(
          "sdkStatus",

          "✗ SDK startup failed: " +
            (error?.message || error),

          "error"
        );

        this.showResult(
          "Startup error: " +
            (error?.message || error),

          "error"
        );
      }
    }

    disconnectedCallback() {

      if (this.pollTimer) {

        clearInterval(
          this.pollTimer
        );

        this.pollTimer =
          null;
      }

      if (
        this.Desktop?.agentContact &&
        typeof this.Desktop.agentContact.removeEventListener ===
          "function"
      ) {

        try {

          this.Desktop.agentContact.removeEventListener(
            "eAgentblindTransferred",
            this.onBlindTransferred
          );

          this.Desktop.agentContact.removeEventListener(
            "eAgentBlindTransferred",
            this.onBlindTransferred
          );

          this.Desktop.agentContact.removeEventListener(
            "eAgentblindTransferFailed",
            this.onBlindTransferFailed
          );

          this.Desktop.agentContact.removeEventListener(
            "eAgentBlindTransferFailed",
            this.onBlindTransferFailed
          );

        } catch (error) {

          console.warn(
            LOG,
            "Event cleanup failed:",
            error
          );
        }
      }
    }

    connectedCallback() {

      console.log(
        LOG,
        "Widget connected"
      );

      this.start();
    }
  }

  customElements.define(
    TAG,
    QuickTransferV4
  );

  console.log(
    LOG,
    "Registered:",
    TAG
  );

})();
