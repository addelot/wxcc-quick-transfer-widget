(function () {
  "use strict";

  const TAG = "wxcc-quick-transfer-v11";

  const SDK_URLS = [
    "https://cdn.jsdelivr.net/npm/@wxcc-desktop/sdk/+esm",
    "https://esm.sh/@wxcc-desktop/sdk"
  ];

  if (customElements.get(TAG)) {
    return;
  }

  class QuickTransferV11 extends HTMLElement {

    constructor() {
      super();

      this.Desktop = null;
      this.activeInteractionId = null;
      this.transferInProgress = false;
      this.pollTimer = null;

      /*
       * All normal appearance/configuration is intended
       * to come from the Desktop Layout JSON.
       */
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

      const read = (
        name,
        fallback
      ) => {

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


      this.config.buttonWidth =
        String(
          read(
            "buttonWidth",
            this.config.buttonWidth
          )
        );


      this.config.buttonHeight =
        String(
          read(
            "buttonHeight",
            this.config.buttonHeight
          )
        );


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

      this.config.columnGap =
        String(
          read(
            "columnGap",
            this.config.buttonGap
          )
        );

      this.config.rowGap =
        String(
          read(
            "rowGap",
            this.config.buttonGap
          )
        );


      this.config.fontSize =
        String(
          read(
            "fontSize",
            this.config.fontSize
          )
        );


      this.config.numberFontSize =
        String(
          read(
            "numberFontSize",
            this.config.numberFontSize
          )
        );


      this.config.fontWeight =
        String(
          read(
            "fontWeight",
            this.config.fontWeight
          )
        );


      this.config.padding =
        String(
          read(
            "padding",
            this.config.padding
          )
        );


      this.config.borderRadius =
        String(
          read(
            "borderRadius",
            this.config.borderRadius
          )
        );


      this.config.borderWidth =
        String(
          read(
            "borderWidth",
            this.config.borderWidth
          )
        );


      this.config.borderColor =
        String(
          read(
            "borderColor",
            this.config.borderColor
          )
        );


      this.config.boxShadow =
        String(
          read(
            "boxShadow",
            this.config.boxShadow
          )
        );


      this.config.showNumbers =
        read(
          "showNumbers",
          this.config.showNumbers
        ) !== false;


      let buttons =
        read(
          "buttons",
          []
        );


      /*
       * Some Webex configurations may pass
       * the array as a JSON string.
       */

      if (
        typeof buttons ===
        "string"
      ) {

        try {

          buttons =
            JSON.parse(
              buttons
            );

        } catch (error) {

          console.error(
            "[WXCC Quick Transfer V11] Could not parse buttons JSON",
            error
          );

          buttons = [];

        }

      }


      this.config.buttons =
        Array.isArray(buttons)
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

      const title =
        this.shadow.getElementById(
          "title"
        );


      title.textContent =
        this.config.title;


      const box =
        this.shadow.getElementById(
          "buttons"
        );


      box.innerHTML =
        "";


      /*
       * Keep the button columns together.
       *
       * Previously the grid used 1fr columns across the full widget width.
       * That caused the empty space between the two columns to become very
       * large even when columnGap was only a few pixels.
       *
       * With buttonWidth = 100%, use max-content tracks so the grid hugs the
       * buttons instead of stretching across the whole Webex panel.
       */
      const configuredWidth =
        String(
          this.config.buttonWidth ||
          "100%"
        ).trim();


      box.style.width =
        "max-content";


      box.style.maxWidth =
        "100%";


      if (
        configuredWidth ===
        "100%"
      ) {

        box.style.gridTemplateColumns =
          `repeat(
            ${this.config.columns},
            max-content
          )`;

      } else {

        box.style.gridTemplateColumns =
          `repeat(
            ${this.config.columns},
            ${configuredWidth}
          )`;

      }


      box.style.columnGap =
        this.config.columnGap;


      box.style.rowGap =
        this.config.rowGap;


      this.getVisibleButtons()
        .forEach(
          cfg => {

            const button =
              document.createElement(
                "button"
              );


            /*
             * Colors
             */

            button.style.background =
              cfg.backgroundColor ||
              "#475569";


            button.style.color =
              cfg.textColor ||
              "#ffffff";


            /*
             * Size
             */

            button.style.width =
              cfg.width ||
              this.config.buttonWidth;


            button.style.height =
              cfg.height ||
              this.config.buttonHeight;


            button.style.minHeight =
              cfg.minHeight ||
              this.config.buttonMinHeight;


            /*
             * Typography
             */

            button.style.fontSize =
              cfg.fontSize ||
              this.config.fontSize;


            button.style.fontWeight =
              cfg.fontWeight ||
              this.config.fontWeight;


            /*
             * Spacing
             */

            button.style.padding =
              cfg.padding ||
              this.config.padding;


            /*
             * Border
             */

            button.style.borderRadius =
              cfg.borderRadius ||
              this.config.borderRadius;


            button.style.borderWidth =
              cfg.borderWidth ||
              this.config.borderWidth;


            button.style.borderStyle =
              cfg.borderStyle ||
              "solid";


            button.style.borderColor =
              cfg.borderColor ||
              this.config.borderColor;


            /*
             * Shadow
             */

            button.style.boxShadow =
              cfg.boxShadow ||
              this.config.boxShadow;


            /*
             * Label
             */

            const label =
              document.createElement(
                "span"
              );


            label.className =
              "label";


            label.textContent =
              cfg.label ||
              "Transfer";


            button.appendChild(
              label
            );


            /*
             * Phone number
             */

            if (
              this.config.showNumbers &&
              cfg.showNumber !== false &&
              cfg.number
            ) {

              const number =
                document.createElement(
                  "span"
                );


              number.className =
                "number";


              number.style.fontSize =
                cfg.numberFontSize ||
                this.config.numberFontSize;


              number.textContent =
                cfg.number;


              button.appendChild(
                number
              );

            }


            button.addEventListener(
              "click",
              () =>
                this.transfer(cfg)
            );


            box.appendChild(
              button
            );

          }
        );


      this.updateButtonStates();

    }


    updateButtonStates() {

      const buttons =
        this.getVisibleButtons();


      [
        ...this.shadow.querySelectorAll(
          "#buttons button"
        )
      ].forEach(
        (button, index) => {

          const cfg =
            buttons[index] ||
            {};


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
        (
          type ||
          "info"
        );

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
            await import(
              url
            );


          const Desktop =
            module.Desktop ||
            module.default?.Desktop ||
            module.default;


          if (Desktop) {

            return Desktop;

          }

        } catch (error) {

          lastError =
            error;

        }

      }


      throw (
        lastError ||
        new Error(
          "Unable to load Webex Contact Center Desktop SDK."
        )
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
          taskMap.values()
        );

      }


      if (
        Array.isArray(taskMap)
      ) {

        return taskMap;

      }


      if (
        typeof taskMap ===
        "object"
      ) {

        return Object.values(
          taskMap
        );

      }


      return [];

    }


    getTaskSummary(
      entry
    ) {

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


    isActiveTelephony(
      summary
    ) {

      if (
        !summary.interactionId
      ) {

        return false;

      }


      if (
        String(
          summary.mediaType ||
          ""
        ).toLowerCase() !==
        "telephony"
      ) {

        return false;

      }


      const state =
        String(
          summary.state ||
          ""
        ).toLowerCase();


      const inactiveStates = [

        "ended",

        "terminated",

        "closed",

        "wrapup",

        "wrappedup",

        "wrapped_up"

      ];


      return (
        !inactiveStates.includes(
          state
        )
      );

    }


    async findActiveInteraction() {

      const taskMap =
        await this.Desktop.actions.getTaskMap();


      return (
        this.normalizeTaskMap(
          taskMap
        )

        .map(
          item =>
            this.getTaskSummary(
              item
            )
        )

        .find(
          item =>
            this.isActiveTelephony(
              item
            )
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
          "[WXCC Quick Transfer V11] Interaction lookup failed",
          error
        );


        this.activeInteractionId =
          null;


        this.updateButtonStates();

      }

    }


    async transfer(
      cfg
    ) {

      if (
        this.transferInProgress ||
        cfg.enabled === false ||
        !cfg.number
      ) {

        return;

      }


      try {

        /*
         * Refresh the interaction immediately
         * before the transfer.
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
          "Transferring to " +
          (
            cfg.label ||
            cfg.number
          ) +
          "...",
          "info"
        );


        /*
         * Webex Contact Center transfer API.
         * The button type is configured in the Desktop Layout JSON.
         */

        const transferType =
          String(
            cfg.type ||
            "blind"
          ).trim().toLowerCase();


        let response;


        if (
          transferType ===
          "consult"
        ) {

          response =
            await this.Desktop.agentContact.consultV2({

              interactionId,

              data: {

                to:
                  String(
                    cfg.number
                  ),

                destinationType:
                  "dialNumber",

                holdParticipants:
                  true

              }

            });


        } else if (
          transferType ===
          "consulttransfer"
        ) {

          response =
            await this.Desktop.agentContact.consultTransferV2({

              interactionId,

              data: {

                to:
                  String(
                    cfg.number
                  ),

                destinationType:
                  "dialNumber"

              }

            });


        } else {

          response =
            await this.Desktop.agentContact.blindTransferV2({

              interactionId,

              data: {

                to:
                  String(
                    cfg.number
                  ),

                destinationType:
                  "dialNumber"

              }

            });

        }


        const responseType =
          response?.type ||
          response?.data?.type ||
          response?.data?.eventType ||
          "";


        if (
          responseType ===
            "AgentBlindTransferFailedEvent" ||

          responseType ===
            "AgentBlindTransferFailed" ||

          responseType ===
            "AgentConsultTransferFailedEvent" ||

          responseType ===
            "AgentConsultTransferFailed"
        ) {

          throw new Error(
            response?.reason ||
            response?.data?.reason ||
            "Unknown failure reason"
          );

        }


        const actionText =
          transferType ===
            "consult"

            ? "Consult started with "

            : transferType ===
                "consulttransfer"

              ? "Consult transfer sent to "

              : "Transfer sent to ";


        this.showStatus(
          actionText +
          (
            cfg.label ||
            cfg.number
          ) +
          ".",
          "success"
        );


      } catch (error) {

        console.error(
          "[WXCC Quick Transfer V11] Transfer failed",
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

        this.Desktop =
          await this.loadSDK();


        await this.Desktop.config.init(
          "quick-transfer-v11",
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
          "[WXCC Quick Transfer V11] Startup failed",
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
    QuickTransferV11
  );

})();
