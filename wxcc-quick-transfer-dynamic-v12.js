
(function () {
  "use strict";

  const TAG = "wxcc-quick-transfer-v12";

  const SDK_URLS = [
    "https://cdn.jsdelivr.net/npm/@wxcc-desktop/sdk/+esm",
    "https://esm.sh/@wxcc-desktop/sdk"
  ];

  if (customElements.get(TAG)) {
    return;
  }

  class QuickTransferV12 extends HTMLElement {

    constructor() {
      super();

      this.Desktop = null;
      this.activeInteractionId = null;
      this.transferInProgress = false;
      this.pollTimer = null;
      this.transferQueues = [];
      this.agentSessionId = null;
      this.agentInfoUpdatedHandler = null;
      this.agentChannelStateChangedHandler = null;
      this.queueListRequestInProgress = false;

      this.config = {
        title: "Quick Transfer",
        columns: 2,
        buttonWidth: "100%",
        buttonHeight: "60px",
        buttonMinHeight: "60px",
        buttonGap: "10px",
        columnGap: "10px",
        rowGap: "10px",
        fontSize: "14px",
        numberFontSize: "11px",
        fontWeight: "600",
        padding: "10px 14px",
        borderRadius: "8px",
        borderWidth: "2px",
        borderColor: "rgba(0,0,0,0.18)",
        boxShadow: "0 2px 4px rgba(0,0,0,0.18)",
        showNumbers: true,
        buttons: []
      };

      this.shadow = this.attachShadow({
        mode: "open"
      });

      this.shadow.innerHTML = `
        <style>
          :host {
            display: block;
            width: 100%;
            box-sizing: border-box;
            font-family: inherit;
          }

          .root {
            padding: 16px;
            box-sizing: border-box;
            width: 100%;
          }

          h2 {
            margin: 0 0 14px 0;
            font-size: 17px;
          }

          .buttons {
            display: grid;
            width: 100%;
            box-sizing: border-box;
          }

          button {
            box-sizing: border-box;
            cursor: pointer;
            transition:
              opacity .15s ease,
              transform .05s ease;
          }

          button:hover:not(:disabled) {
            opacity: .90;
          }

          button:active:not(:disabled) {
            transform: translateY(1px);
          }

          button:disabled {
            opacity: .42;
            cursor: not-allowed;
          }

          .label {
            display: block;
          }

          .number {
            display: block;
            margin-top: 3px;
            font-weight: 400;
            opacity: .95;
          }

          .status {
            display: none;
            padding: 9px 12px;
            margin-bottom: 12px;
            border-radius: 7px;
            border: 1px solid #cbd5e1;
            font-size: 12px;
            box-sizing: border-box;
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
              grid-template-columns: 1fr !important;
            }
          }
        </style>

        <div class="root">
          <h2 id="title"></h2>

          <div id="status" class="status"></div>

          <div id="buttons" class="buttons"></div>
        </div>
      `;
    }

    connectedCallback() {
      this.readLayoutConfig();
      this.render();
      this.start();
    }

    readLayoutConfig() {

      const read = (name, fallback) => {
        return (
          this[name] !== undefined &&
          this[name] !== null
        )
          ? this[name]
          : fallback;
      };

      this.config.title = String(
        read("title", this.config.title)
      );

      this.config.columns = Math.max(
        1,
        Number(read("columns", this.config.columns)) || 2
      );

      this.config.buttonWidth = String(
        read("buttonWidth", this.config.buttonWidth)
      );

      this.config.buttonHeight = String(
        read("buttonHeight", this.config.buttonHeight)
      );

      this.config.buttonMinHeight = String(
        read("buttonMinHeight", this.config.buttonMinHeight)
      );

      this.config.buttonGap = String(
        read("buttonGap", this.config.buttonGap)
      );

      this.config.columnGap = String(
        read("columnGap", this.config.buttonGap)
      );

      this.config.rowGap = String(
        read("rowGap", this.config.buttonGap)
      );

      this.config.fontSize = String(
        read("fontSize", this.config.fontSize)
      );

      this.config.numberFontSize = String(
        read("numberFontSize", this.config.numberFontSize)
      );

      this.config.fontWeight = String(
        read("fontWeight", this.config.fontWeight)
      );

      this.config.padding = String(
        read("padding", this.config.padding)
      );

      this.config.borderRadius = String(
        read("borderRadius", this.config.borderRadius)
      );

      this.config.borderWidth = String(
        read("borderWidth", this.config.borderWidth)
      );

      this.config.borderColor = String(
        read("borderColor", this.config.borderColor)
      );

      this.config.boxShadow = String(
        read("boxShadow", this.config.boxShadow)
      );

      this.config.showNumbers =
        read("showNumbers", this.config.showNumbers) !== false;

      let buttons = read("buttons", []);

      if (typeof buttons === "string") {
        try {
          buttons = JSON.parse(buttons);
        } catch (error) {
          console.error(
            "[WXCC Quick Transfer V12] Could not parse buttons JSON",
            error
          );
          buttons = [];
        }
      }

      this.config.buttons = Array.isArray(buttons)
        ? buttons
        : [];
    }

    getVisibleButtons() {
      return this.config.buttons.filter(
        button =>
          button &&
          button.visible !== false
      );
    }

    render() {

      const title = this.shadow.getElementById("title");
      title.textContent = this.config.title;

      const box = this.shadow.getElementById("buttons");
      box.innerHTML = "";

      const configuredWidth = String(
        this.config.buttonWidth || "100%"
      ).trim();

      box.style.width = "max-content";
      box.style.maxWidth = "100%";

      if (configuredWidth === "100%") {
        box.style.gridTemplateColumns =
          `repeat(${this.config.columns}, max-content)`;
      } else {
        box.style.gridTemplateColumns =
          `repeat(${this.config.columns}, ${configuredWidth})`;
      }

      box.style.columnGap = this.config.columnGap;
      box.style.rowGap = this.config.rowGap;

      this.getVisibleButtons().forEach(cfg => {

        const button = document.createElement("button");

        button.style.background =
          cfg.backgroundColor || "#475569";

        button.style.color =
          cfg.textColor || "#ffffff";

        button.style.width =
          cfg.width || this.config.buttonWidth;

        button.style.height =
          cfg.height || this.config.buttonHeight;

        button.style.minHeight =
          cfg.minHeight || this.config.buttonMinHeight;

        button.style.fontSize =
          cfg.fontSize || this.config.fontSize;

        button.style.fontWeight =
          cfg.fontWeight || this.config.fontWeight;

        button.style.padding =
          cfg.padding || this.config.padding;

        button.style.borderRadius =
          cfg.borderRadius || this.config.borderRadius;

        button.style.borderWidth =
          cfg.borderWidth || this.config.borderWidth;

        button.style.borderStyle =
          cfg.borderStyle || "solid";

        button.style.borderColor =
          cfg.borderColor || this.config.borderColor;

        button.style.boxShadow =
          cfg.boxShadow || this.config.boxShadow;

        const label = document.createElement("span");
        label.className = "label";
        label.textContent = cfg.label || "Transfer";
        button.appendChild(label);

        if (
          this.config.showNumbers &&
          cfg.showNumber !== false &&
          cfg.number
        ) {
          const number = document.createElement("span");
          number.className = "number";

          number.style.fontSize =
            cfg.numberFontSize || this.config.numberFontSize;

          number.textContent = cfg.number;
          button.appendChild(number);
        }

        button.addEventListener("click", () => {
          this.transfer(cfg);
        });

        box.appendChild(button);
      });

      this.updateButtonStates();
    }

    updateButtonStates() {

      const buttons = this.getVisibleButtons();

      [
        ...this.shadow.querySelectorAll("#buttons button")
      ].forEach((button, index) => {

        const cfg = buttons[index] || {};

        const isQueue =
          String(cfg.type || "blind").toLowerCase() === "queue";

        const hasDestination = isQueue
          ? !!cfg.queueId
          : !!cfg.number;

        button.disabled =
          cfg.enabled === false ||
          !hasDestination ||
          !this.activeInteractionId ||
          this.transferInProgress;
      });
    }

    showStatus(message, type) {

      const element = this.shadow.getElementById("status");

      element.textContent = message;
      element.className = "status " + (type || "info");
    }

    hideStatus() {

      const element = this.shadow.getElementById("status");

      element.textContent = "";
      element.className = "status";
    }

    async loadSDK() {

      let lastError;

      for (const url of SDK_URLS) {
        try {

          const module = await import(url);

          const Desktop =
            module.Desktop ||
            module.default?.Desktop ||
            module.default;

          if (Desktop) {
            return Desktop;
          }

        } catch (error) {
          lastError = error;
        }
      }

      throw (
        lastError ||
        new Error(
          "Unable to load Webex Contact Center Desktop SDK."
        )
      );
    }

    normalizeTaskMap(taskMap) {

      if (!taskMap) {
        return [];
      }

      if (taskMap instanceof Map) {
        return Array.from(taskMap.values());
      }

      if (Array.isArray(taskMap)) {
        return taskMap;
      }

      if (typeof taskMap === "object") {
        return Object.values(taskMap);
      }

      return [];
    }

    getTaskSummary(entry) {

      const task = entry?.task || entry || {};
      const interaction = task.interaction || {};

      return {
        interactionId:
          task.interactionId ||
          interaction.interactionId ||
          null,

        mediaType:
          interaction.mediaType ||
          interaction.mediaChannel ||
          task.mediaType ||
          null,

        state:
          interaction.state ||
          task.state ||
          null
      };
    }

    isActiveTelephony(summary) {

      if (!summary.interactionId) {
        return false;
      }

      if (
        String(summary.mediaType || "").toLowerCase() !==
        "telephony"
      ) {
        return false;
      }

      const state = String(
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

      return !inactiveStates.includes(state);
    }

    async findActiveInteraction() {

      const taskMap =
        await this.Desktop.actions.getTaskMap();

      return (
        this.normalizeTaskMap(taskMap)
          .map(item => this.getTaskSummary(item))
          .find(item => this.isActiveTelephony(item)) ||
        null
      );
    }

    async refreshInteraction() {

      try {

        const active = await this.findActiveInteraction();

        this.activeInteractionId =
          active?.interactionId || null;

        this.updateButtonStates();

        if (!active && !this.transferInProgress) {
          this.hideStatus();
        }

      } catch (error) {

        console.error(
          "[WXCC Quick Transfer V12] Interaction lookup failed",
          error
        );

        this.activeInteractionId = null;
        this.updateButtonStates();
      }
    }

    async loadTransferQueues() {

      if (this.queueListRequestInProgress) return;

      const agentInfo =
        this.Desktop?.agentStateInfo?.latestData || {};

      const agentProfileId =
        agentInfo.agentProfileID ||
        agentInfo.agentProfileId;

      const agentSessionId =
        this.agentSessionId || agentInfo.agentSessionId;

      if (!agentProfileId || !agentSessionId) {
        console.warn(
          "[WXCC Quick Transfer V12] Queue lookup waiting for agent profile/session data.",
          {
            agentProfileId: !!agentProfileId,
            agentSessionId: !!agentSessionId,
            availableAgentInfoFields: Object.keys(agentInfo || {})
          }
        );
        return;
      }

      this.queueListRequestInProgress = true;

      try {
        const response =
          await this.Desktop.agentContact.vteamList({
            data: {
              agentProfileId: String(agentProfileId),
              agentSessionId: String(agentSessionId),
              channelType: "telephony",
              type: "inboundqueue",
              trackingId: (
                typeof crypto !== "undefined" &&
                typeof crypto.randomUUID === "function"
              )
                ? crypto.randomUUID()
                : String(Date.now())
            }
          });

        console.log(
          "[WXCC Quick Transfer V12] Raw vteamList response:",
          response
        );

        const candidates = [
          response?.data?.data?.vteamList,
          response?.data?.vteamList,
          response?.data?.data?.data?.vteamList,
          response?.vteamList
        ];

        this.transferQueues =
          candidates.find(Array.isArray) || [];

        console.group(
          "[WXCC Quick Transfer V12] Available telephony queues"
        );

        if (this.transferQueues.length) {
          console.table(
            this.transferQueues.map(queue => ({
              name: queue.name,
              analyzerId: queue.analyzerId,
              id: queue.id,
              type: queue.type,
              channelType: queue.channelType
            }))
          );
        } else {
          console.warn(
            "No vteamList array was found. Check the raw response above."
          );
        }

        console.groupEnd();

      } catch (error) {
        console.error(
          "[WXCC Quick Transfer V12] Queue lookup failed:",
          error
        );
      } finally {
        this.queueListRequestInProgress = false;
      }
    }

    resolveQueueDestination(cfg) {

      const configuredId = String(cfg.queueId || "").trim();
      const configuredName = String(
        cfg.queueName || cfg.label || ""
      ).trim().toLowerCase();

      const matchById = this.transferQueues.find(queue =>
        [
          queue.analyzerId,
          queue.id,
          queue.queueId,
          queue.uuid
        ].some(value =>
          value !== undefined &&
          value !== null &&
          String(value) === configuredId
        )
      );

      const matchByName = configuredName
        ? this.transferQueues.find(queue =>
            String(queue.name || "").trim().toLowerCase() === configuredName
          )
        : null;

      const match = matchById || matchByName;

      if (!match) {
        throw new Error(
          "Queue not found in vteamList. The configured queue must be returned by Cisco's transfer queue lookup."
        );
      }

      // Diagnostic fallback: this tenant's vteamList records expose id/dbId
      // but no analyzerId. Cisco documents analyzerId as the normal vTeam ID.
      // This test sends the returned UUID as data.to so the API response can
      // confirm whether this tenant accepts that identifier.
      const destinationId =
        match.analyzerId ||
        match.id ||
        match.dbId ||
        match.queueId ||
        match.uuid;

      if (!destinationId) {
        throw new Error("Matched queue has no usable destination identifier.");
      }

      console.info(
        "[WXCC Quick Transfer V12] Diagnostic queue destination:",
        {
          configuredQueueId: configuredId,
          configuredLabel: cfg.label,
          queueName: match.name,
          queueId: match.id,
          dbId: match.dbId,
          analyzerId: match.analyzerId,
          destinationId,
          identifierSource: match.analyzerId ? "analyzerId" : "UUID fallback (id/dbId)"
        }
      );

      return destinationId;
    }

    async transfer(cfg) {

      const transferType = String(
        cfg.type || "blind"
      ).trim().toLowerCase();

      const isQueue = transferType === "queue";

      const destination = isQueue
        ? cfg.queueId
        : cfg.number;

      if (
        this.transferInProgress ||
        cfg.enabled === false ||
        !destination
      ) {
        return;
      }

      try {

        const active = await this.findActiveInteraction();

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

        this.transferInProgress = true;
        this.activeInteractionId = interactionId;

        this.updateButtonStates();

        this.showStatus(
          "Transferring to " +
          (cfg.label || destination) +
          "...",
          "info"
        );

        let response;

        /*
         * QUEUE TRANSFER
         *
         * queueId must be the queue analyzerId/vTeam ID.
         * It is not the queue display name.
         */

        if (transferType === "queue") {

          if (!this.transferQueues.length) {
            await this.loadTransferQueues();
          }

          const queueAnalyzerId =
            this.resolveQueueDestination(cfg);

          response =
            await this.Desktop.agentContact.vteamTransferV2({

              interactionId,

              data: {
                to: String(queueAnalyzerId),
                destinationType: "queue"
              }

            });

        } else if (transferType === "consult") {

          response =
            await this.Desktop.agentContact.consultV2({

              interactionId,

              data: {
                to: String(cfg.number),
                destinationType: "dialNumber",
                holdParticipants: true
              }

            });

        } else if (transferType === "consulttransfer") {

          response =
            await this.Desktop.agentContact.consultTransferV2({

              interactionId,

              data: {
                to: String(cfg.number),
                destinationType: "dialNumber"
              }

            });

        } else {

          response =
            await this.Desktop.agentContact.blindTransferV2({

              interactionId,

              data: {
                to: String(cfg.number),
                destinationType: "dialNumber"
              }

            });
        }

        console.info(
          "[WXCC Quick Transfer V12] Raw transfer API response:",
          response
        );

        const responseType =
          response?.type ||
          response?.data?.type ||
          response?.data?.eventType ||
          "";

        if (
          responseType === "AgentVteamTransferFailed" ||
          responseType === "AgentVteamTransferFailedEvent" ||
          responseType === "AgentBlindTransferFailedEvent" ||
          responseType === "AgentBlindTransferFailed" ||
          responseType === "AgentConsultTransferFailedEvent" ||
          responseType === "AgentConsultTransferFailed"
        ) {
          throw new Error(
            response?.reason ||
            response?.data?.reason ||
            "Unknown failure reason"
          );
        }

        const actionText =
          transferType === "consult"
            ? "Consult started with "
            : transferType === "consulttransfer"
              ? "Consult transfer sent to "
              : "Transfer sent to ";

        this.showStatus(
          actionText +
          (cfg.label || destination) +
          ".",
          "success"
        );

      } catch (error) {

        const errorDetails = {};

        if (error !== null && error !== undefined) {
          errorDetails.name = error.name;
          errorDetails.message = error.message;
          errorDetails.stack = error.stack;

          let current = error;
          let depth = 0;

          while (current && depth < 3) {
            Object.getOwnPropertyNames(current).forEach(key => {
              try {
                const value = current[key];

                if (
                  value === null ||
                  ["string", "number", "boolean"].includes(typeof value)
                ) {
                  errorDetails[key] = value;
                } else if (value && typeof value === "object") {
                  try {
                    errorDetails[key] = JSON.parse(JSON.stringify(value));
                  } catch (_) {
                    errorDetails[key] = String(value);
                  }
                }
              } catch (propertyError) {
                errorDetails[key] = "[Could not read property]";
              }
            });

            current = Object.getPrototypeOf(current);
            depth++;
          }
        }

        console.error(
          "[WXCC Quick Transfer V12] Transfer failed - detailed error:",
          errorDetails
        );

        console.error(
          "[WXCC Quick Transfer V12] Original error object:",
          error
        );

        this.showStatus(
          "Transfer failed: " +
          (error?.message || error),
          "error"
        );

      } finally {

        this.transferInProgress = false;
        this.updateButtonStates();

        setTimeout(() => {
          this.refreshInteraction();
        }, 500);
      }
    }

    async start() {

      try {

        this.Desktop = await this.loadSDK();

        await this.Desktop.config.init(
          "quick-transfer-v12",
          "Axis"
        );

        this.agentInfoUpdatedHandler = eventData => {
          const latestAgentInfo =
            this.Desktop?.agentStateInfo?.latestData || {};

          console.log(
            "[WXCC Quick Transfer V12] Agent info updated event:",
            eventData
          );

          console.log(
            "[WXCC Quick Transfer V12] Agent info snapshot inside updated event:",
            {
              agentProfileID: latestAgentInfo.agentProfileID,
              agentSessionId: latestAgentInfo.agentSessionId,
              agentSessionIdType: typeof latestAgentInfo.agentSessionId,
              availableFields: Object.keys(latestAgentInfo)
            }
          );

          if (latestAgentInfo.agentSessionId) {
            this.agentSessionId = latestAgentInfo.agentSessionId;
          }

          this.loadTransferQueues();
        };

        this.agentChannelStateChangedHandler = eventData => {
          const latestAgentInfo =
            this.Desktop?.agentStateInfo?.latestData || {};

          const payload = eventData?.data?.data ||
            eventData?.data ||
            eventData?.detail?.data ||
            eventData?.detail ||
            eventData ||
            {};
          const sessionId =
            payload.agentSessionId ||
            payload.data?.agentSessionId ||
            payload.data?.data?.agentSessionId ||
            eventData?.agentSessionId ||
            latestAgentInfo.agentSessionId;

          console.log(
            "[WXCC Quick Transfer V12] eAgentChannelStateChanged event:",
            eventData
          );

          if (sessionId) {
            this.agentSessionId = String(sessionId);
            console.info(
              "[WXCC Quick Transfer V12] Captured agentSessionId from channel-state event."
            );
            this.loadTransferQueues();
          } else {
            console.warn(
              "[WXCC Quick Transfer V12] Channel-state event received without agentSessionId.",
              {
                eventKeys: Object.keys(payload || {}),
                latestAgentInfoFields: Object.keys(latestAgentInfo || {})
              }
            );
          }
        };

        this.Desktop.agentStateInfo.addEventListener(
          "updated",
          this.agentInfoUpdatedHandler
        );

        this.Desktop.agentStateInfo.addEventListener(
          "eAgentChannelStateChanged",
          this.agentChannelStateChangedHandler
        );

        console.info(
          "[WXCC Quick Transfer V12] Registered eAgentChannelStateChanged listener.",
          {
            hasAgentStateInfo: !!this.Desktop.agentStateInfo,
            hasAddEventListener: typeof this.Desktop.agentStateInfo?.addEventListener === "function",
            hasRemoveEventListener: typeof this.Desktop.agentStateInfo?.removeEventListener === "function"
          }
        );

        await this.loadTransferQueues();
        await this.refreshInteraction();

        this.pollTimer = setInterval(() => {
          this.refreshInteraction();
        }, 2000);

      } catch (error) {

        console.error(
          "[WXCC Quick Transfer V12] Startup failed",
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

      if (this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
      }

      if (this.Desktop?.agentStateInfo?.removeEventListener) {
        if (this.agentInfoUpdatedHandler) {
          this.Desktop.agentStateInfo.removeEventListener(
            "updated",
            this.agentInfoUpdatedHandler
          );
          this.agentInfoUpdatedHandler = null;
        }

        if (this.agentChannelStateChangedHandler) {
          this.Desktop.agentStateInfo.removeEventListener(
            "eAgentChannelStateChanged",
            this.agentChannelStateChangedHandler
          );
          this.agentChannelStateChangedHandler = null;
        }
      }
    }
  }

  customElements.define(
    TAG,
    QuickTransferV12
  );

})();
