// Webex Contact Center Desktop SDK Diagnostic v2
// This version ONLY tests SDK loading and Desktop.config.init().
// No transfer functionality is included.

(function () {
  "use strict";

  const TAG = "wxcc-quick-transfer-sdk-test-v2";
  const LOG = "[WXCC SDK TEST]";

  // Prevent duplicate registration
  if (customElements.get(TAG)) {
    console.log(LOG, "Already registered");
    return;
  }

  /*
   * Cisco Webex Contact Center Desktop SDK
   *
   * We are deliberately testing the SDK separately from
   * the rest of the Quick Transfer functionality.
   */
  const SDK_URLS = [
    "https://cdn.jsdelivr.net/npm/@wxcc-desktop/sdk/+esm",
    "https://esm.sh/@wxcc-desktop/sdk"
  ];

  class SDKTestWidget extends HTMLElement {

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
            margin-bottom: 18px;
            font-size: 13px;
            color: #475569;
          }

          .test {
            padding: 12px 14px;
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

          .code {
            margin-top: 6px;
            padding: 8px;
            background: rgba(0,0,0,.05);
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            word-break: break-word;
          }

        </style>

        <div class="root">

          <h2>
            Webex Contact Center SDK Test
          </h2>

          <div class="description">
            This widget tests the Webex Contact Center Desktop SDK.
            No transfer functionality is being tested yet.
          </div>

          <div id="widget" class="test success">
            <div class="label">
              External Widget
            </div>

            <div class="value">
              ✓ JavaScript loaded successfully
            </div>
          </div>

          <div id="sdk" class="test info">
            <div class="label">
              SDK Loading
            </div>

            <div id="sdkValue" class="value">
              Loading SDK...
            </div>
          </div>

          <div id="desktop" class="test info">
            <div class="label">
              Desktop Object
            </div>

            <div id="desktopValue" class="value">
              Waiting...
            </div>
          </div>

          <div id="config" class="test info">
            <div class="label">
              Desktop.config
            </div>

            <div id="configValue" class="value">
              Waiting...
            </div>
          </div>

          <div id="init" class="test info">
            <div class="label">
              Desktop.config.init()
            </div>

            <div id="initValue" class="value">
              Waiting...
            </div>
          </div>

          <div id="error" class="test error" style="display:none;">
            <div class="label">
              Error
            </div>

            <div id="errorValue" class="value">
            </div>
          </div>

        </div>
      `;

      this.shadow = shadow;
    }


    setStatus(id, value, type) {

      const box = this.shadow.getElementById(id);
      const valueElement =
        this.shadow.getElementById(
          id + "Value"
        );

      if (!box || !valueElement) {
        return;
      }

      valueElement.textContent = value;

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


    showError(error) {

      const box =
        this.shadow.getElementById(
          "error"
        );

      const value =
        this.shadow.getElementById(
          "errorValue"
        );

      box.style.display = "block";

      value.textContent =
        error?.message ||
        String(error);

      console.error(
        LOG,
        error
      );
    }


    async loadSDK() {

      /*
       * First check whether Desktop is already
       * available in the Webex Contact Center page.
       */
      if (
        window.Desktop &&
        window.Desktop.config
      ) {

        console.log(
          LOG,
          "Desktop already available on window"
        );

        return window.Desktop;
      }


      /*
       * Otherwise dynamically load the SDK.
       */
      for (
        const url of SDK_URLS
      ) {

        try {

          console.log(
            LOG,
            "Trying SDK:",
            url
          );

          this.setStatus(
            "sdk",
            "Loading from: " + url,
            "info"
          );

          const module =
            await import(url);


          console.log(
            LOG,
            "Module loaded:",
            module
          );


          /*
           * Try the documented Desktop export.
           */
          const Desktop =
            module.Desktop ||
            module.default?.Desktop ||
            module.default ||
            null;


          if (
            Desktop &&
            Desktop.config
          ) {

            console.log(
              LOG,
              "Desktop object found",
              Desktop
            );

            return Desktop;
          }

          console.warn(
            LOG,
            "Module loaded but Desktop object was not found"
          );

        } catch (error) {

          console.error(
            LOG,
            "SDK load failed:",
            url,
            error
          );

          this.showError(
            error
          );
        }
      }


      throw new Error(
        "The SDK loaded unsuccessfully from all configured URLs."
      );
    }


    async start() {

      try {

        /*
         * STEP 1
         * Load SDK
         */
        const Desktop =
          await this.loadSDK();


        this.setStatus(
          "sdk",
          "✓ SDK loaded successfully",
          "success"
        );


        /*
         * STEP 2
         * Verify Desktop object
         */
        if (!Desktop) {

          throw new Error(
            "Desktop object is undefined."
          );
        }


        this.setStatus(
          "desktop",
          "✓ Desktop object is available",
          "success"
        );


        /*
         * STEP 3
         * Verify Desktop.config
         */
        if (
          !Desktop.config
        ) {

          throw new Error(
            "Desktop.config is not available."
          );
        }


        this.setStatus(
          "config",
          "✓ Desktop.config is available",
          "success"
        );


        /*
         * STEP 4
         * Verify init()
         */
        if (
          typeof Desktop.config.init !==
          "function"
        ) {

          throw new Error(
            "Desktop.config.init is not a function."
          );
        }


        this.setStatus(
          "init",
          "Initializing Desktop SDK...",
          "info"
        );


        /*
         * Cisco documented initialization
         * for version 2+ requires:
         *
         * widgetName
         * widgetProvider
         */
        await Desktop.config.init(
          "quick-transfer-sdk-test",
          "Axis"
        );


        /*
         * STEP 5
         * Initialization successful
         */
        this.setStatus(
          "init",
          "✓ Desktop.config.init() completed successfully",
          "success"
        );


        console.log(
          LOG,
          "SDK initialization completed successfully"
        );


        /*
         * Show some available SDK modules.
         */
        const modules = [];

        for (
          const key of [
            "config",
            "actions",
            "agentContact",
            "agentStateInfo",
            "dialer"
          ]
        ) {

          if (Desktop[key]) {
            modules.push(key);
          }
        }


        const moduleBox =
          document.createElement(
            "div"
          );

        moduleBox.className =
          "test success";

        moduleBox.innerHTML = `
          <div class="label">
            Available Desktop Modules
          </div>

          <div class="value">
            ${modules.join(", ")}
          </div>

          <div class="code">
            ${modules.length
              ? "SDK modules detected successfully."
              : "No modules detected."}
          </div>
        `;

        this.shadow
          .querySelector(".root")
          .appendChild(
            moduleBox
          );


      } catch (error) {

        this.setStatus(
          "sdk",
          "✗ SDK test failed",
          "error"
        );

        this.showError(
          error
        );

        console.error(
          LOG,
          "Complete test failure:",
          error
        );
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
    SDKTestWidget
  );


  console.log(
    LOG,
    "Registered:",
    TAG
  );

})();
