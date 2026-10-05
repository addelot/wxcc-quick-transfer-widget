(function () {
  "use strict";

  const TAG = "wxcc-agent-status-v4";
  const LOG = "[AgentStatusV4]";

  if (customElements.get(TAG)) {
    console.log(LOG, "Already registered.");
    return;
  }

  /*
   * ------------------------------------------------------------
   * SDK LOADER
   * ------------------------------------------------------------
   */

  const SDK_URLS = [
    "https://cdn.jsdelivr.net/npm/@wxcc-desktop/sdk/+esm",
    "https://esm.sh/@wxcc-desktop/sdk"
  ];

  let sdkPromise = null;

  async function loadDesktop() {

    if (
      window.Desktop &&
      window.Desktop.agentStateInfo
    ) {
      console.log(
        LOG,
        "Using existing Desktop SDK."
      );

      return window.Desktop;
    }

    if (sdkPromise) {
      return sdkPromise;
    }

    sdkPromise = (async () => {

      for (const url of SDK_URLS) {

        try {

          console.log(
            LOG,
            "Trying SDK:",
            url
          );

          const mod =
            await import(url);

          const Desktop =
            mod.Desktop ||
            (
              mod.default &&
              (
                mod.default.Desktop ||
                mod.default
              )
            );

          if (
            Desktop &&
            Desktop.agentStateInfo
          ) {

            console.log(
              LOG,
              "SDK loaded successfully."
            );

            return Desktop;
          }

        } catch (error) {

          console.warn(
            LOG,
            "SDK load failed:",
            url,
            error
          );

        }
      }

      console.error(
        LOG,
        "Unable to load Webex Desktop SDK."
      );

      return null;

    })();

    return sdkPromise;
  }


  /*
   * ------------------------------------------------------------
   * SDK INITIALIZATION
   * ------------------------------------------------------------
   */

  let initPromise = null;

  async function initializeDesktop(Desktop) {

    if (!Desktop) {
      return;
    }

    if (initPromise) {
      return initPromise;
    }

    initPromise = (async () => {

      try {

        if (
          Desktop.config &&
          typeof Desktop.config.init === "function"
        ) {

          await Desktop.config.init({
            widgetName: TAG,
            widgetProvider: "Cisco"
          });

          console.log(
            LOG,
            "Desktop SDK initialized."
          );

        }

      } catch (error) {

        console.warn(
          LOG,
          "Desktop.config.init failed:",
          error
        );

      }

    })();

    return initPromise;
  }


  /*
   * ------------------------------------------------------------
   * WEB COMPONENT
   * ------------------------------------------------------------
   */

  class AgentStatusV4 extends HTMLElement {

    constructor() {

      super();

      /*
       * IMPORTANT:
       *
       * Define the public properties explicitly.
       * Desktop can then inject STORE data if available.
       */

      this.title = "Agent Status";

      this.teamName = "";
      this.agentDnNumber = "";

      this.channelsStatesMap = {};

      this.agentStateData = null;

      this.desktop = null;

      this.stateEventHandler = null;

      this.clockTimer = null;


      /*
       * SHADOW DOM
       */

      this.attachShadow({
        mode: "open"
      });


      this.shadowRoot.innerHTML = `

        <style>

          :host {
            display: block;
            width: 100%;
            height: 100%;
            box-sizing: border-box;
            font-family: inherit;
            color: #172033;
          }

          .card {
            box-sizing: border-box;

            width: 100%;

            min-height: 220px;

            padding: 16px;

            background: #ffffff;

            border: 1px solid #dbe2ea;

            border-radius: 12px;

            box-shadow:
              0 2px 8px rgba(15,23,42,.06);
          }

          .title {
            font-size: 16px;

            font-weight: 700;

            margin-bottom: 14px;
          }

          .stateRow {
            display: flex;

            align-items: center;

            gap: 10px;
          }

          .dot {
            width: 13px;

            height: 13px;

            min-width: 13px;

            border-radius: 50%;

            background: #64748b;
          }

          .state {
            font-size: 22px;

            line-height: 1.1;

            font-weight: 700;
          }

          .duration {
            margin-top: 4px;

            color: #64748b;

            font-size: 12px;
          }

          .details {
            margin-top: 16px;

            display: grid;

            gap: 7px;
          }

          .detail {
            display: flex;

            justify-content: space-between;

            gap: 12px;

            font-size: 12px;
          }

          .label {
            color: #64748b;
          }

          .value {
            font-weight: 600;

            text-align: right;

            max-width: 65%;

            overflow: hidden;

            text-overflow: ellipsis;

            white-space: nowrap;
          }

          .channels {
            margin-top: 14px;

            display: grid;

            gap: 6px;
          }

          .channel {
            display: flex;

            justify-content: space-between;

            align-items: center;

            padding: 8px 10px;

            border-radius: 7px;

            background: #f1f5f9;

            font-size: 12px;
          }

          .channelName {
            display: flex;

            align-items: center;

            gap: 7px;

            font-weight: 600;
          }

          .channelDot {
            width: 8px;

            height: 8px;

            min-width: 8px;

            border-radius: 50%;
          }

          .channelState {
            font-weight: 600;

            text-align: right;
          }

          .debug {
            margin-top: 12px;

            padding: 8px;

            border-radius: 7px;

            background: #f8fafc;

            color: #64748b;

            font-size: 10px;

            word-break: break-word;
          }

        </style>


        <div class="card">

          <div
            class="title"
            id="title">
            Agent Status
          </div>


          <div class="stateRow">

            <div
              class="dot"
              id="dot">
            </div>


            <div>

              <div
                class="state"
                id="state">
                Loading...
              </div>


              <div
                class="duration"
                id="duration">
                --:--
              </div>

            </div>

          </div>


          <div class="details">

            <div class="detail">

              <span class="label">
                Team
              </span>

              <span
                class="value"
                id="team">
                --
              </span>

            </div>


            <div class="detail">

              <span class="label">
                DN
              </span>

              <span
                class="value"
                id="dn">
                --
              </span>

            </div>


            <div class="detail">

              <span class="label">
                Reason
              </span>

              <span
                class="value"
                id="reason">
                --
              </span>

            </div>

          </div>


          <div
            class="channels"
            id="channels">
          </div>


          <div
            class="debug"
            id="debug"
            style="display:none">
          </div>

        </div>
      `;

    }


    /*
     * ------------------------------------------------------------
     * CONNECT
     * ------------------------------------------------------------
     */

    async connectedCallback() {

      console.log(
        LOG,
        "Widget connected."
      );


      this.render();


      /*
       * Load SDK
       */

      const Desktop =
        await loadDesktop();


      if (!Desktop) {

        console.error(
          LOG,
          "Desktop SDK unavailable."
        );

        this.showDebug(
          "Desktop SDK unavailable."
        );

        return;
      }


      this.desktop =
        Desktop;


      /*
       * Initialize SDK
       */

      await initializeDesktop(
        Desktop
      );


      /*
       * Read current state
       */

      this.readLatestData();


      /*
       * Listen for granular state changes
       */

      this.subscribeToStateChanges();


      /*
       * Render again after SDK
       */

      this.render();


      /*
       * Update duration every second
       */

      this.clockTimer =
        setInterval(
          () => {

            this.readLatestData();

            this.render();

          },
          1000
        );

    }


    /*
     * ------------------------------------------------------------
     * DISCONNECT
     * ------------------------------------------------------------
     */

    disconnectedCallback() {

      if (this.clockTimer) {

        clearInterval(
          this.clockTimer
        );

        this.clockTimer = null;
      }


      if (
        this.desktop &&
        this.stateEventHandler &&
        this.desktop.agentStateInfo &&
        typeof this.desktop.agentStateInfo.removeEventListener ===
          "function"
      ) {

        try {

          this.desktop.agentStateInfo.removeEventListener(
            "eAgentChannelStateChanged",
            this.stateEventHandler
          );

        } catch (error) {

          console.warn(
            LOG,
            "Could not remove state listener:",
            error
          );

        }

      }

    }


    /*
     * ------------------------------------------------------------
     * READ LATEST DATA
     * ------------------------------------------------------------
     */

    readLatestData() {

      if (
        !this.desktop ||
        !this.desktop.agentStateInfo
      ) {

        return;
      }


      const info =
        this.desktop.agentStateInfo;


      /*
       * Cisco exposes the latest agent
       * information through latestData.
       */

      let data =
        info.latestData;


      if (
        typeof data === "function"
      ) {

        try {

          data =
            data();

        } catch (error) {

          console.warn(
            LOG,
            "latestData() failed:",
            error
          );

        }

      }


      if (
        !data ||
        typeof data !== "object"
      ) {

        return;
      }


      this.agentStateData =
        data;


      /*
       * Team
       */

      if (
        data.teamName !== undefined
      ) {

        this.teamName =
          data.teamName;
      }


      /*
       * DN
       */

      if (
        data.dn !== undefined
      ) {

        this.agentDnNumber =
          data.dn;
      }


      /*
       * Granular channel state
       */

      if (
        data.channelsStatesMap &&
        typeof data.channelsStatesMap ===
          "object"
      ) {

        this.channelsStatesMap =
          data.channelsStatesMap;

      }


      console.log(
        LOG,
        "latestData:",
        data
      );

    }


    /*
     * ------------------------------------------------------------
     * STATE EVENT
     * ------------------------------------------------------------
     */

    subscribeToStateChanges() {

      if (
        !this.desktop ||
        !this.desktop.agentStateInfo ||
        typeof this.desktop.agentStateInfo.addEventListener !==
          "function"
      ) {

        console.warn(
          LOG,
          "agentStateInfo event API unavailable."
        );

        return;
      }


      this.stateEventHandler =
        (eventData) => {

          console.log(
            LOG,
            "eAgentChannelStateChanged:",
            eventData
          );


          /*
           * The event contains:
           *
           * channelType
           *
           * agentChannelStateDetail
           */

          if (
            eventData &&
            eventData.channelType &&
            eventData.agentChannelStateDetail
          ) {

            this.channelsStatesMap[
              eventData.channelType
            ] =
              eventData.agentChannelStateDetail;

          }


          /*
           * Refresh all other agent information.
           */

          this.readLatestData();


          this.render();

        };


      try {

        this.desktop.agentStateInfo.addEventListener(
          "eAgentChannelStateChanged",
          this.stateEventHandler
        );


        console.log(
          LOG,
          "Subscribed to eAgentChannelStateChanged."
        );

      } catch (error) {

        console.error(
          LOG,
          "State event subscription failed:",
          error
        );

      }

    }


    /*
     * ------------------------------------------------------------
     * PRIMARY CHANNEL
     * ------------------------------------------------------------
     */

    getPrimaryChannel() {

      const map =
        this.channelsStatesMap ||
        {};


      /*
       * Prefer telephony because this
       * is currently a voice agent.
       */

      if (
        map.telephony
      ) {

        return map.telephony;
      }


      /*
       * Otherwise use first channel.
       */

      const first =
        Object.values(map)
          .find(
            value =>
              value &&
              typeof value ===
                "object"
          );


      return (
        first ||
        {}
      );

    }


    /*
     * ------------------------------------------------------------
     * CURRENT STATE
     * ------------------------------------------------------------
     */

    getState() {

      const channel =
        this.getPrimaryChannel();


      return (
        channel.agentState ||
        "Unknown"
      );

    }


    /*
     * ------------------------------------------------------------
     * CURRENT REASON
     * ------------------------------------------------------------
     */

    getReason() {

      const channel =
        this.getPrimaryChannel();


      if (
        channel.stateChangeReason
      ) {

        return String(
          channel.stateChangeReason
        );

      }


      /*
       * The auxiliary code ID is useful
       * when no textual reason is supplied.
       */

      if (
        channel.auxCodeId &&
        channel.auxCodeId !== "0"
      ) {

        return (
          "Aux code: " +
          channel.auxCodeId
        );

      }


      return "--";

    }


    /*
     * ------------------------------------------------------------
     * STATE COLOR
     * ------------------------------------------------------------
     */

    stateColor(state) {

      const value =
        String(
          state ||
          ""
        ).toLowerCase();


      if (
        value === "available" ||
        value === "ready"
      ) {

        return "#16a34a";

      }


      if (
        value === "engaged" ||
        value === "connected" ||
        value === "oncall" ||
        value === "on call"
      ) {

        return "#2563eb";

      }


      if (
        value === "wrapup" ||
        value === "wrap_up" ||
        value === "wrap up"
      ) {

        return "#7c3aed";

      }


      if (
        value === "idle" ||
        value === "break" ||
        value === "meeting" ||
        value === "lunch" ||
        value === "training"
      ) {

        return "#f59e0b";

      }


      if (
        value === "offline" ||
        value === "loggedout" ||
        value === "logged out"
      ) {

        return "#64748b";

      }


      return "#475569";

    }


    /*
     * ------------------------------------------------------------
     * FORMAT STATE
     * ------------------------------------------------------------
     */

    formatState(state) {

      if (!state) {

        return "Unknown";

      }


      const text =
        String(state)
          .replace(
            /_/g,
            " "
          )
          .replace(
            /([a-z])([A-Z])/g,
            "$1 $2"
          );


      return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
      );

    }


    /*
     * ------------------------------------------------------------
     * DURATION
     * ------------------------------------------------------------
     */

    formatDuration(timestamp) {

      if (!timestamp) {

        return "--:--";

      }


      let ts =
        Number(timestamp);


      if (
        !Number.isFinite(ts)
      ) {

        return "--:--";

      }


      /*
       * Cisco supplies epoch seconds.
       */

      if (
        ts < 100000000000
      ) {

        ts *= 1000;

      }


      const seconds =
        Math.max(
          0,
          Math.floor(
            (
              Date.now() -
              ts
            ) /
            1000
          )
        );


      const hours =
        Math.floor(
          seconds / 3600
        );


      const minutes =
        Math.floor(
          (
            seconds % 3600
          ) /
          60
        );


      const secs =
        seconds %
        60;


      if (
        hours > 0
      ) {

        return (
          `${String(hours).padStart(2,"0")}:` +
          `${String(minutes).padStart(2,"0")}:` +
          `${String(secs).padStart(2,"0")}`
        );

      }


      return (
        `${String(minutes).padStart(2,"0")}:` +
        `${String(secs).padStart(2,"0")}`
      );

    }


    /*
     * ------------------------------------------------------------
     * CHANNEL NAME
     * ------------------------------------------------------------
     */

    formatChannelName(channel) {

      const names = {

        telephony:
          "Telephony",

        voice:
          "Voice",

        chat:
          "Chat",

        email:
          "Email",

        social:
          "Social"

      };


      if (
        names[channel]
      ) {

        return names[channel];

      }


      if (!channel) {

        return "Unknown";

      }


      return (
        channel.charAt(0).toUpperCase() +
        channel.slice(1)
      );

    }


    /*
     * ------------------------------------------------------------
     * RENDER
     * ------------------------------------------------------------
     */

    render() {

      const title =
        this.title ||
        "Agent Status";


      const state =
        this.getState();


      const channel =
        this.getPrimaryChannel();


      const color =
        this.stateColor(
          state
        );


      /*
       * Title
       */

      this.shadowRoot
        .getElementById(
          "title"
        )
        .textContent =
          title;


      /*
       * State
       */

      const stateElement =
        this.shadowRoot
          .getElementById(
            "state"
          );


      stateElement.textContent =
        this.formatState(
          state
        );


      stateElement.style.color =
        color;


      /*
       * Dot
       */

      this.shadowRoot
        .getElementById(
          "dot"
        )
        .style.background =
          color;


      /*
       * Duration
       */

      this.shadowRoot
        .getElementById(
          "duration"
        )
        .textContent =
          this.formatDuration(
            channel.stateChangeTimestamp
          );


      /*
       * Team
       */

      this.shadowRoot
        .getElementById(
          "team"
        )
        .textContent =
          this.teamName ||
          "--";


      /*
       * DN
       */

      this.shadowRoot
        .getElementById(
          "dn"
        )
        .textContent =
          this.agentDnNumber ||
          "--";


      /*
       * Reason
       */

      this.shadowRoot
        .getElementById(
          "reason"
        )
        .textContent =
          this.getReason();


      /*
       * Channels
       */

      this.renderChannels();

    }


    /*
     * ------------------------------------------------------------
     * CHANNEL RENDER
     * ------------------------------------------------------------
     */

    renderChannels() {

      const box =
        this.shadowRoot
          .getElementById(
            "channels"
          );


      box.innerHTML = "";


      const map =
        this.channelsStatesMap ||
        {};


      const entries =
        Object.entries(map)
          .filter(
            ([, detail]) =>
              detail &&
              typeof detail ===
                "object"
          );


      entries.forEach(
        (
          [
            channel,
            detail
          ]
        ) => {

          const row =
            document.createElement(
              "div"
            );


          row.className =
            "channel";


          /*
           * Left
           */

          const left =
            document.createElement(
              "div"
            );


          left.className =
            "channelName";


          const dot =
            document.createElement(
              "span"
            );


          dot.className =
            "channelDot";


          dot.style.background =
            this.stateColor(
              detail.agentState
            );


          const name =
            document.createElement(
              "span"
            );


          name.textContent =
            this.formatChannelName(
              channel
            );


          left.appendChild(
            dot
          );


          left.appendChild(
            name
          );


          /*
           * Right
           */

          const right =
            document.createElement(
              "span"
            );


          right.className =
            "channelState";


          right.style.color =
            this.stateColor(
              detail.agentState
            );


          right.textContent =
            this.formatState(
              detail.agentState
            );


          /*
           * Available / total
           */

          if (
            detail.availableChannelCount !==
              undefined &&
            detail.totalChannelCount !==
              undefined
          ) {

            right.textContent +=
              ` (${detail.availableChannelCount}/${detail.totalChannelCount})`;

          }


          row.appendChild(
            left
          );


          row.appendChild(
            right
          );


          box.appendChild(
            row
          );

        }
      );

    }


    /*
     * ------------------------------------------------------------
     * DEBUG
     * ------------------------------------------------------------
     */

    showDebug(message) {

      const debug =
        this.shadowRoot
          .getElementById(
            "debug"
          );


      debug.style.display =
        "block";


      debug.textContent =
        message;

    }

  }


  customElements.define(
    TAG,
    AgentStatusV4
  );


  console.log(
    LOG,
    "Custom element registered."
  );

})();
