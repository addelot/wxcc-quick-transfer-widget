(function () {
  "use strict";

  const TAG = "wxcc-quick-transfer-v7";

  const SDK_URLS = [
    "https://cdn.jsdelivr.net/npm/@wxcc-desktop/sdk/+esm",
    "https://esm.sh/@wxcc-desktop/sdk"
  ];

  if (customElements.get(TAG)) {
    return;
  }

  class QuickTransferV7 extends HTMLElement {

    constructor() {
      super();

      this.Desktop = null;
      this.activeInteractionId = null;
      this.transferInProgress = false;
      this.pollTimer = null;

      this.config = {
        title: "Quick Transfer",
        columns: 2,
        showNumbers: true,
        buttonMinHeight: "54px",
        buttonGap: "10px",
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
          }

          h2 {
            margin: 0 0 14px 0;
            font-size: 17px;
          }

          .buttons {
            display: grid;
          }

          button {
            width: 100%;
            padding: 10px 14px;
            border: 2px solid rgba(0, 0, 0, .18);
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            box-sizing: border-box;
            cursor: pointer;
            transition:
              opacity .15s ease,
              transform .05s ease;
          }

          button:hover:not(:disabled) {
            opacity: .9;
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
            font-size: 11px;
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

          <div
            id="status"
            class="status">
          </div>

          <div
            id="buttons"
            class="buttons">
          </div>

        </div>
      `;
    }


    connectedCallback() {

      this.readLayoutConfig();

      this.render();

      this.start();
    }


    readLayoutConfig() {

      /*
       * Webex Desktop Layout can pass properties
       * directly to the custom element.
       */

      const read = (name, fallback) => {

        return (
          this[name] !== undefined &&
          this[name] !== null
        )
          ? this[name]
          : fallback;

      };


      this.config.title =
        String(
          read(
            "title",
            this.config.title
          )
        );


      this.config.columns =
        Math.max(
          1,
          Number(
            read(
              "columns",
              this.config.columns
            )
          ) || 2
        );


      this.config.showNumbers =
        read(
          "showNumbers",
          this.config.showNumbers
        ) !== false;


      this.config.buttonMinHeight =
        String(
          read(
            "buttonMinHeight",
            this.config.buttonMinHeight
          )
        );


      this.config.buttonGap =
        String(
          read(
            "buttonGap",
            this.config.buttonGap
          )
        );


      let buttons =
        read(
          "buttons",
          []
        );


      /*
       * In case Webex passes the JSON array
       * as a string, parse it.
       */

      if (typeof buttons === "string") {

        try {

          buttons = JSON.parse(buttons);

        } catch (_) {

          buttons = [];

        }

      }


      this.config.buttons =
        Array.isArray(buttons)
          ? buttons
          : [];
    }


    getEnabledButtons() {

      return this.config.buttons.filter(
        button =>
          button &&
          button.visible !== false
      );

    }


    render() {

      const title =
        this.shadow.getElementById("title");

      title.textContent =
        this.config.title;


      const box =
        this.shadow.getElementById("buttons");


      box.innerHTML = "";


      box.style.gridTemplateColumns =
        `repeat(
          ${this.config.columns},
          minmax(0, 1fr)
        )`;


      box.style.gap =
        this.config.buttonGap;


      this.getEnabledButtons()
        .forEach(
          (cfg, index) => {

            const button =
              document.createElement("button");


            button.dataset.index =
              String(index);


            /*
             * Button appearance comes
             * entirely from the JSON.
             */

            button.style.background =
              cfg.backgroundColor ||
              "#475569";


            button.style.color =
              cfg.textColor ||
              "#ffffff";


            button.style.minHeight =
              cfg.minHeight ||
              this.config.buttonMinHeight;


            button.style.borderRadius =
              cfg.borderRadius ||
              "8px";


            if (cfg.borderColor) {

              button.style.borderColor =
                cfg.borderColor;

            }


            const label =
              document.createElement("span");


            label.className =
              "label";


            label.textContent =
              cfg.label ||
              "Transfer";


            button.appendChild(label);


            /*
             * Phone number can optionally
             * be displayed.
             */

            if (
              this.config.showNumbers &&
              cfg.showNumber !== false &&
              cfg.number
            ) {

              const number =
                document.createElement("span");


              number.className =
                "number";


              number.textContent =
                cfg.number;


              button.appendChild(number);

            }


            button.addEventListener(
              "click",
              () => this.transfer(cfg)
            );


            box.appendChild(button);

          }
        );


      this.updateButtonStates();
    }


    updateButtonStates() {

      const configs =
        this.getEnabledButtons();


      [
        ...this.shadow.querySelectorAll(
          "#buttons button"
        )
      ].forEach(
        (button, index) => {

          const cfg =
            configs[index] || {};


          button.disabled =
            cfg.enabled === false ||
            !cfg.number ||
            !this.activeInteractionId ||
            this.transferInProgress;

        }
      );
    }


    showStatus(
      message,
      type
    ) {

      const element =
        this.shadow.getElementById(
          "status"
        );


      element.textContent =
        message;


      element.className =
        "status " +
        (type || "info");
    }


    hideStatus() {

      const element =
        this.shadow.getElementById(
          "status"
        );


      element.textContent =
        "";


      element.className =
        "status";
    }


    async loadSDK() {

      let lastError;


      for (
        const url of SDK_URLS
      ) {

        try {

          const module =
            await import(url);


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

        return Array.from(
          taskMap.values()
        );

      }


      if (Array.isArray(taskMap)) {

        return taskMap;

      }


      if (
        typeof taskMap === "object"
      ) {

        return Object.values(
          taskMap
        );

      }


      return [];
    }


    getTaskSummary(entry) {

      const task =
        entry?.task ||
        entry ||
        {};


      const interaction =
        task.interaction ||
        {};


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
        String(
          summary.mediaType || ""
        ).toLowerCase() !==
        "telephony"
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

      const taskMap =
        await this.Desktop.actions.getTaskMap();


      return (
        this.normalizeTaskMap(taskMap)

          .map(
            item =>
              this.getTaskSummary(item)
          )

          .find(
            item =>
              this.isActiveTelephony(item)
          ) ||

        null
      );
    }


    async refreshInteraction() {

      try {

        const active =
          await this.findActiveInteraction();


        this.activeInteractionId =
          active?.interactionId ||
          null;


        this.updateButtonStates();


        if (
          !active &&
          !this.transferInProgress
        ) {

          this.hideStatus();

        }

      } catch (error) {

        console.error(
          "[WXCC Quick Transfer V7]",
          error
        );


        this.activeInteractionId =
          null;


        this.updateButtonStates();

      }

    }


    async transfer(cfg) {

      if (
        this.transferInProgress ||
        cfg.enabled === false ||
        !cfg.number
      ) {

        return;

      }


      try {

        /*
         * Always get the current task
         * immediately before transfer.
         */

        const active =
          await this.findActiveInteraction();


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
          `Transferring to ${
            cfg.label ||
            cfg.number
          }...`,
          "info"
        );


        /*
         * Webex Contact Center
         * blind transfer.
         */

        const response =
          await this.Desktop.agentContact.blindTransferV2({

            interactionId,

            data: {

              to: String(
                cfg.number
              ),

              destinationType:
                "dialNumber"

            }

          });


        const responseType =
          response?.type ||
          response?.data?.type ||
          response?.data?.eventType ||
          "";


        if (
          responseType ===
            "AgentBlindTransferFailedEvent" ||

          responseType ===
            "AgentBlindTransferFailed"
        ) {

          throw new Error(
            response?.reason ||
            response?.data?.reason ||
            "Unknown failure reason"
          );

        }


        this.showStatus(
          `Transfer sent to ${
            cfg.label ||
            cfg.number
          }.`,
          "success"
        );


      } catch (error) {

        console.error(
          "[WXCC Quick Transfer V7] Transfer failed",
          error
        );


        this.showStatus(
          "Transfer failed: " +
          (
            error?.message ||
            error
          ),
          "error"
        );


      } finally {

        this.transferInProgress =
          false;


        this.updateButtonStates();


        setTimeout(
          () =>
            this.refreshInteraction(),
          500
        );

      }

    }


    async start() {

      try {

        /*
         * Load Webex Contact Center
         * Desktop SDK.
         */

        this.Desktop =
          await this.loadSDK();


        /*
         * Initialize the Desktop SDK.
         */

        await this.Desktop.config.init(
          "quick-transfer-v7",
          "Axis"
        );


        /*
         * Detect the current call.
         */

        await this.refreshInteraction();


        /*
         * Continue checking for an
         * active telephony interaction.
         */

        this.pollTimer =
          setInterval(
            () =>
              this.refreshInteraction(),
            2000
          );


      } catch (error) {

        console.error(
          "[WXCC Quick Transfer V7] Startup failed",
          error
        );


        this.showStatus(
          "Quick Transfer could not start: " +
          (
            error?.message ||
            error
          ),
          "error"
        );

      }

    }


    disconnectedCallback() {

      if (this.pollTimer) {

        clearInterval(
          this.pollTimer
        );

        this.pollTimer = null;

      }

    }

  }


  customElements.define(
    TAG,
    QuickTransferV7
  );

})();
