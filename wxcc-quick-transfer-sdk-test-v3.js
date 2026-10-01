// Webex Contact Center Desktop SDK Diagnostic v3
// Tests SDK loading, initialization, and retrieval of the active task map.
// NO transfer functionality is included.

(function () {
  "use strict";

  const TAG = "wxcc-quick-transfer-sdk-test-v3";
  const LOG = "[WXCC SDK TEST V3]";

  if (customElements.get(TAG)) {
    console.log(LOG, "Already registered");
    return;
  }

  const SDK_URLS = [
    "https://cdn.jsdelivr.net/npm/@wxcc-desktop/sdk/+esm",
    "https://esm.sh/@wxcc-desktop/sdk"
  ];

  class SDKTestV3Widget extends HTMLElement {
    constructor() {
      super();

      const shadow = this.attachShadow({ mode: "open" });

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

          .task {
            padding: 10px;
            margin-top: 8px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            background: #ffffff;
          }

          .task-title {
            font-weight: 600;
            margin-bottom: 6px;
          }

          .row {
            display: grid;
            grid-template-columns: 180px 1fr;
            gap: 8px;
            margin: 3px 0;
            font-size: 12px;
          }

          .key {
            font-weight: 600;
            color: #475569;
          }

          .value-code {
            font-family: monospace;
            word-break: break-all;
          }

          .code {
            margin-top: 6px;
            padding: 8px;
            background: rgba(0, 0, 0, 0.05);
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            word-break: break-word;
          }

          @media (max-width: 700px) {
            .row {
              grid-template-columns: 1fr;
              gap: 2px;
            }
          }
        </style>

        <div class="root">

          <h2>Webex Contact Center SDK Test V3</h2>

          <div class="description">
            Tests the Desktop SDK and reads the current task map.
            No transfer functionality is being tested.
          </div>

          <div id="widget" class="test success">
            <div class="label">External Widget</div>
            <div class="value">
              ✓ JavaScript loaded successfully
            </div>
          </div>

          <div id="sdk" class="test info">
            <div class="label">SDK Loading</div>
            <div id="sdkValue" class="value">
              Loading SDK...
            </div>
          </div>

          <div id="desktop" class="test info">
            <div class="label">Desktop Object</div>
            <div id="desktopValue" class="value">
              Waiting...
            </div>
          </div>

          <div id="config" class="test info">
            <div class="label">Desktop.config</div>
            <div id="configValue" class="value">
              Waiting...
            </div>
          </div>

          <div id="init" class="test info">
            <div class="label">Desktop.config.init()</div>
            <div id="initValue" class="value">
              Waiting...
            </div>
          </div>

          <div id="taskMap" class="test info">
            <div class="label">
              Desktop.actions.getTaskMap()
            </div>
            <div id="taskMapValue" class="value">
              Waiting...
            </div>
          </div>

          <div id="activeTask" class="test info">
            <div class="label">
              Active Telephony Interaction
            </div>
            <div id="activeTaskValue" class="value">
              Waiting...
            </div>
          </div>

          <div id="tasks" class="test info" style="display:none;">
            <div class="label">
              Task Details
            </div>
            <div id="tasksValue"></div>
          </div>

          <div id="error" class="test error" style="display:none;">
            <div class="label">
              Error
            </div>
            <div id="errorValue" class="value"></div>
          </div>

        </div>
      `;

      this.shadow = shadow;
      this.Desktop = null;
      this.pollTimer = null;
    }

    setStatus(id, value, type) {
      const box =
        this.shadow.getElementById(id);

      const valueElement =
        this.shadow.getElementById(id + "Value");

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
        this.shadow.getElementById("error");

      const value =
        this.shadow.getElementById("errorValue");

      if (!box || !value) {
        return;
      }

      box.style.display = "block";

      value.textContent =
        error?.message || String(error);

      console.error(
        LOG,
        error
      );
    }

    async loadSDK() {

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

      for (const url of SDK_URLS) {

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

        }
      }

      throw new Error(
        "The SDK could not be loaded from any configured URL."
      );
    }

    normalizeTaskMap(taskMap) {

      if (!taskMap) {
        return [];
      }

      /*
       * Webex SDK may expose the task map as a Map.
       */

      if (taskMap instanceof Map) {

        return Array.from(
          taskMap.entries()
        ).map(
          ([key, value]) => ({
            key,
            task: value
          })
        );
      }

      /*
       * Handle an array just in case
       * the SDK returns one.
       */

      if (Array.isArray(taskMap)) {

        return taskMap.map(
          (task, index) => ({
            key: String(index),
            task
          })
        );
      }

      /*
       * Handle a normal object.
       */

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

      const eventType =
        task.type ||
        task.eventType ||
        null;

      const contactDirection =
        interaction.contactDirection?.type ||
        null;

      const outboundType =
        interaction.outboundType ||
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

        eventType:
          eventType,

        contactDirection:
          contactDirection,

        outboundType:
          outboundType,

        ani:
          callDetails.ani ||
          null,

        dnis:
          callDetails.dnis ||
          null,

        customerNumber:
          callDetails.customerNumber ||
          null,

        queueId:
          callDetails.QueueId ||
          callDetails.queueId ||
          null,

        task:
          task,

        interaction:
          interaction
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

    renderTaskDetails(
      summaries
    ) {

      const box =
        this.shadow.getElementById(
          "tasks"
        );

      const container =
        this.shadow.getElementById(
          "tasksValue"
        );

      if (
        !box ||
        !container
      ) {
        return;
      }

      box.style.display =
        "block";

      container.innerHTML =
        "";

      if (
        !summaries.length
      ) {

        container.textContent =
          "No tasks returned.";

        return;
      }

      summaries.forEach(
        (summary, index) => {

          const div =
            document.createElement(
              "div"
            );

          div.className =
            "task";

          const safe =
            value =>
              value === null ||
              value === undefined ||
              value === ""
                ? "—"
                : String(value);

          div.innerHTML = `

            <div class="task-title">
              Task ${index + 1}
            </div>

            <div class="row">
              <div class="key">
                Map key
              </div>

              <div class="value-code">
                ${safe(summary.key)}
              </div>
            </div>

            <div class="row">
              <div class="key">
                interactionId
              </div>

              <div class="value-code">
                ${safe(summary.interactionId)}
              </div>
            </div>

            <div class="row">
              <div class="key">
                mediaType
              </div>

              <div>
                ${safe(summary.mediaType)}
              </div>
            </div>

            <div class="row">
              <div class="key">
                state
              </div>

              <div>
                ${safe(summary.state)}
              </div>
            </div>

            <div class="row">
              <div class="key">
                event/type
              </div>

              <div>
                ${safe(summary.eventType)}
              </div>
            </div>

            <div class="row">
              <div class="key">
                direction
              </div>

              <div>
                ${safe(summary.contactDirection)}
              </div>
            </div>

            <div class="row">
              <div class="key">
                outboundType
              </div>

              <div>
                ${safe(summary.outboundType)}
              </div>
            </div>

            <div class="row">
              <div class="key">
                ANI
              </div>

              <div>
                ${safe(summary.ani)}
              </div>
            </div>

            <div class="row">
              <div class="key">
                DNIS
              </div>

              <div>
                ${safe(summary.dnis)}
              </div>
            </div>

          `;

          container.appendChild(
            div
          );
        }
      );
    }

    async checkTaskMap() {

      try {

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

        this.setStatus(
          "taskMap",

          `✓ getTaskMap() succeeded — ${summaries.length} task(s) returned`,

          "success"
        );

        this.renderTaskDetails(
          summaries
        );

        const active =
          summaries.find(
            summary =>
              this.isActiveTelephony(
                summary
              )
          );

        if (active) {

          this.setStatus(
            "activeTask",

            "✓ Active telephony interaction found: " +
              active.interactionId,

            "success"
          );

        } else {

          this.setStatus(
            "activeTask",

            "No active telephony interaction found.",

            "warning"
          );
        }

      } catch (error) {

        this.setStatus(
          "taskMap",
          "✗ getTaskMap() failed",
          "error"
        );

        this.setStatus(
          "activeTask",
          "Could not determine active interaction.",
          "error"
        );

        this.showError(
          error
        );

        console.error(
          LOG,
          "getTaskMap failure:",
          error
        );
      }
    }

    async start() {

      try {

        const Desktop =
          await this.loadSDK();

        this.Desktop =
          Desktop;

        this.setStatus(
          "sdk",
          "✓ SDK loaded successfully",
          "success"
        );

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

        if (!Desktop.config) {

          throw new Error(
            "Desktop.config is not available."
          );
        }

        this.setStatus(
          "config",
          "✓ Desktop.config is available",
          "success"
        );

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

        await Desktop.config.init(
          "quick-transfer-sdk-test-v3",
          "Axis"
        );

        this.setStatus(
          "init",
          "✓ Desktop.config.init() completed successfully",
          "success"
        );

        await this.checkTaskMap();

        /*
         * Refresh the task map every two seconds.
         * This lets us see the interaction as the
         * call changes state.
         */

        this.pollTimer =
          setInterval(
            () =>
              this.checkTaskMap(),
            2000
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

    disconnectedCallback() {

      if (this.pollTimer) {

        clearInterval(
          this.pollTimer
        );

        this.pollTimer =
          null;
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
    SDKTestV3Widget
  );

  console.log(
    LOG,
    "Registered:",
    TAG
  );

})();
