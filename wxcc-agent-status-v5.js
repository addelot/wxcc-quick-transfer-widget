(function () {
  "use strict";

  const TAG = "wxcc-agent-status-v5";
  const LOG = "[AgentStatusV5]";

  if (customElements.get(TAG)) {
    console.log(LOG, "Already registered.");
    return;
  }

  const SDK_URLS = [
    "https://cdn.jsdelivr.net/npm/@wxcc-desktop/sdk/+esm",
    "https://esm.sh/@wxcc-desktop/sdk"
  ];

  let sdkPromise = null;
  let initPromise = null;

  async function loadDesktop() {
    if (window.Desktop && window.Desktop.agentStateInfo) {
      return window.Desktop;
    }

    if (sdkPromise) {
      return sdkPromise;
    }

    sdkPromise = (async () => {
      for (const url of SDK_URLS) {
        try {
          const mod = await import(url);

          const Desktop =
            mod.Desktop ||
            (mod.default &&
              (mod.default.Desktop || mod.default));

          if (Desktop && Desktop.agentStateInfo) {
            console.log(LOG, "SDK loaded:", url);
            return Desktop;
          }
        } catch (error) {
          console.warn(LOG, "SDK load failed:", url, error);
        }
      }

      return null;
    })();

    return sdkPromise;
  }

  async function initDesktop(Desktop) {
    if (!Desktop || !Desktop.config) {
      return;
    }

    if (initPromise) {
      return initPromise;
    }

    initPromise = (async () => {
      try {
        if (typeof Desktop.config.init === "function") {
          await Desktop.config.init({
            widgetName: TAG,
            widgetProvider: "Axis"
          });
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

  class AgentStatusV5 extends HTMLElement {

    constructor() {
      super();

      this.title = "Agent Status";

      this.teamName = "";
      this.agentDnNumber = "";
      this.channelsStatesMap = {};

      this.desktop = null;
      this.clockTimer = null;

      this.updatedHandler = null;
      this.channelStateHandler = null;

      this.sdkReady = false;
      this.latestDataReady = false;
      this.channelDataReady = false;

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
            min-height: 250px;
            padding: 16px;
            background: #fff;
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

          .diagnostic {
            margin-top: 14px;
            padding: 8px 10px;
            border-radius: 7px;
            background: #f8fafc;
            color: #64748b;
            font-size: 10px;
            line-height: 1.4;
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
            class="diagnostic"
            id="diagnostic">
            Initializing Desktop state...
          </div>

        </div>
      `;
    }


    connectedCallback() {

      this.readProperties();

      this.render();

      this.start();


      this.clockTimer =
        setInterval(
          () => {

            this.readProperties();

            this.render();

          },
          1000
        );
    }


    disconnectedCallback() {

      if (this.clockTimer) {

        clearInterval(
          this.clockTimer
        );

        this.clockTimer = null;
      }


      if (
        this.desktop &&
        this.updatedHandler
      ) {

        try {

          this.desktop.agentStateInfo
            .removeEventListener(
              "updated",
              this.updatedHandler
            );

        } catch (e) {}

      }


      if (
        this.desktop &&
        this.channelStateHandler
      ) {

        try {

          this.desktop.agentStateInfo
            .removeEventListener(
              "eAgentChannelStateChanged",
              this.channelStateHandler
            );

        } catch (e) {}

      }
    }


    async start() {

      const Desktop =
        await loadDesktop();


      if (!Desktop) {

        this.setDiagnostic(
          "SDK unavailable"
        );

        return;
      }


      this.desktop =
        Desktop;

      this.sdkReady = true;


      this.setDiagnostic(
        "SDK loaded"
      );


      await initDesktop(
        Desktop
      );


      this.subscribe();


      /*
       * Read current data.
       */

      this.readLatestData();


      /*
       * Retry after the Agent State
       * Information module has had time
       * to initialize.
       */

      setTimeout(
        () => {
          this.readLatestData();
        },
        250
      );


      setTimeout(
        () => {
          this.readLatestData();
        },
        1000
      );


      setTimeout(
        () => {
          this.readLatestData();
        },
        2500
      );


      this.render();
    }


    subscribe() {

      const info =
        this.desktop?.agentStateInfo;


      if (
        !info ||
        typeof info.addEventListener !==
          "function"
      ) {

        this.setDiagnostic(
          "SDK loaded; event API unavailable"
        );

        return;
      }


      /*
       * Agent State Information
       * updated event.
       */

      this.updatedHandler =
        () => {

          console.log(
            LOG,
            "updated event"
          );


          this.readLatestData();

          this.render();

        };


      /*
       * Granular channel state event.
       */

      this.channelStateHandler =
        (eventData) => {

          console.log(
            LOG,
            "eAgentChannelStateChanged:",
            eventData
          );


          /*
           * Some Desktop versions wrap
           * event information in data.
           */

          const event =
            eventData?.data?.channelType
              ? eventData.data
              : eventData;


          const channelType =
            event?.channelType;


          const detail =
            event?.agentChannelStateDetail;


          if (
            channelType &&
            detail
          ) {

            this.channelsStatesMap = {

              ...(this.channelsStatesMap || {}),

              [channelType]:
                detail

            };


            this.channelDataReady =
              true;
          }


          /*
           * Refresh complete state data.
           */

          this.readLatestData();

          this.render();

        };


      try {

        info.addEventListener(
          "updated",
          this.updatedHandler
        );


        info.addEventListener(
          "eAgentChannelStateChanged",
          this.channelStateHandler
        );


        console.log(
          LOG,
          "Subscribed to agentStateInfo events."
        );

      } catch (error) {

        console.error(
          LOG,
          "Event subscription failed:",
          error
        );


        this.setDiagnostic(
          "SDK loaded; subscription failed"
        );
      }
    }


    readLatestData() {

      const info =
        this.desktop?.agentStateInfo;


      if (!info) {

        return;
      }


      try {

        const data =
          info.latestData;


        if (
          !data ||
          typeof data !==
            "object"
        ) {

          return;
        }


        this.latestDataReady =
          true;


        /*
         * Team
         */

        if (
          data.teamName !==
            undefined
        ) {

          this.teamName =
            data.teamName ||
            "";

        }


        /*
         * DN
         */

        if (
          data.dn !==
            undefined
        ) {

          this.agentDnNumber =
            data.dn ||
            "";

        }


        /*
         * Channel states
         */

        if (
          data.channelsStatesMap &&
          typeof data.channelsStatesMap ===
            "object"
        ) {

          this.channelsStatesMap =
            data.channelsStatesMap;


          this.channelDataReady =
            Object.keys(
              this.channelsStatesMap
            ).length > 0;
        }


        console.log(
          LOG,
          "latestData:",
          data
        );


        if (
          this.channelDataReady
        ) {

          this.setDiagnostic(
            "SDK OK | latestData OK | channel state OK"
          );

        } else {

          this.setDiagnostic(
            "SDK OK | latestData OK | waiting for channel state"
          );

        }


        this.render();

      } catch (error) {

        console.warn(
          LOG,
          "latestData read failed:",
          error
        );
      }
    }


    readProperties() {

      /*
       * Keep STORE bindings as a
       * secondary data source.
       */

      const read =
        (
          name,
          fallback
        ) => {

          if (
            this[name] !==
              undefined &&
            this[name] !==
              null &&
            this[name] !==
              ""
          ) {

            return this[name];

          }


          const attr =
            this.getAttribute(
              name
            );


          if (
            attr !==
              null
          ) {

            return attr;
          }


          return fallback;

        };


      /*
       * Title
       */

      const title =
        read(
          "title",
          "Agent Status"
        );


      if (title) {

        this.title =
          String(
            title
          );

      }


      /*
       * Team
       */

      const team =
        read(
          "teamName",
          ""
        );


      if (team) {

        this.teamName =
          String(
            team
          );

      }


      /*
       * DN
       */

      const dn =
        read(
          "agentDnNumber",
          ""
        );


      if (dn) {

        this.agentDnNumber =
          String(
            dn
          );

      }


      /*
       * Channel map
       */

      let map =
        read(
          "channelsStatesMap",
          null
        );


      if (
        typeof map ===
          "string"
      ) {

        try {

          map =
            JSON.parse(
              map
            );

        } catch (e) {

          map = null;

        }
      }


      if (
        map &&
        typeof map ===
          "object"
      ) {

        this.channelsStatesMap =
          map;


        if (
          Object.keys(
            map
          ).length > 0
        ) {

          this.channelDataReady =
            true;

        }
      }
    }


    getPrimaryChannel() {

      const map =
        this.channelsStatesMap ||
        {};


      /*
       * Prefer Telephony.
       */

      if (
        map.telephony
      ) {

        return map.telephony;

      }


      /*
       * Otherwise use the
       * first available channel.
       */

      const first =
        Object.values(
          map
        ).find(
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


    getState() {

      const channel =
        this.getPrimaryChannel();


      return (
        channel.agentState ||
        "Unknown"
      );
    }


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


      if (
        channel.auxCodeId &&
        channel.auxCodeId !==
          "0"
      ) {

        return (
          "Aux code: " +
          channel.auxCodeId
        );

      }


      return "--";
    }


    stateColor(
      state
    ) {

      const value =
        String(
          state ||
          ""
        ).toLowerCase();


      if (
        value ===
          "available" ||
        value ===
          "ready"
      ) {

        return "#16a34a";

      }


      if (
        value ===
          "engaged" ||
        value ===
          "connected" ||
        value ===
          "oncall" ||
        value ===
          "on call"
      ) {

        return "#2563eb";

      }


      if (
        value ===
          "wrapup" ||
        value ===
          "wrap_up" ||
        value ===
          "wrap up"
      ) {

        return "#7c3aed";

      }


      if (
        value ===
          "idle" ||
        value ===
          "break" ||
        value ===
          "meeting" ||
        value ===
          "lunch" ||
        value ===
          "training"
      ) {

        return "#f59e0b";

      }


      if (
        value ===
          "offline" ||
        value ===
          "loggedout" ||
        value ===
          "logged out"
      ) {

        return "#64748b";

      }


      return "#475569";
    }


    formatState(
      state
    ) {

      if (!state) {

        return "Unknown";

      }


      const text =
        String(
          state
        )
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


    formatDuration(
      timestamp
    ) {

      if (!timestamp) {

        return "--:--";

      }


      let ts =
        Number(
          timestamp
        );


      if (
        !Number.isFinite(
          ts
        )
      ) {

        return "--:--";

      }


      /*
       * Epoch seconds.
       * Also supports milliseconds.
       */

      if (
        ts <
          100000000000
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
          seconds /
            3600
        );


      const minutes =
        Math.floor(
          (
            seconds %
              3600
          ) /
          60
        );


      const secs =
        seconds %
        60;


      if (
        hours >
          0
      ) {

        return (
          `${String(
            hours
          ).padStart(
            2,
            "0"
          )}:` +

          `${String(
            minutes
          ).padStart(
            2,
            "0"
          )}:` +

          `${String(
            secs
          ).padStart(
            2,
            "0"
          )}`
        );

      }


      return (
        `${String(
          minutes
        ).padStart(
          2,
          "0"
        )}:` +

        `${String(
          secs
        ).padStart(
          2,
          "0"
        )}`
      );
    }


    formatChannelName(
      channel
    ) {

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

        return names[
          channel
        ];

      }


      if (!channel) {

        return "Unknown";

      }


      return (
        channel.charAt(
          0
        ).toUpperCase() +

        channel.slice(
          1
        )
      );
    }


    setDiagnostic(
      text
    ) {

      const element =
        this.shadowRoot
          ?.getElementById(
            "diagnostic"
          );


      if (element) {

        element.textContent =
          text;

      }
    }


    render() {

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
          this.title;


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
       * State dot
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
       * Channel information
       */

      this.renderChannels();
    }


    renderChannels() {

      const box =
        this.shadowRoot
          .getElementById(
            "channels"
          );


      box.innerHTML =
        "";


      const map =
        this.channelsStatesMap ||
        {};


      Object.entries(
        map
      )
        .filter(
          (
            [
              ,
              detail
            ]
          ) =>
            detail &&
            typeof detail ===
              "object"
        )
        .forEach(
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
             * Left side
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
             * Right side
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
  }


  customElements.define(
    TAG,
    AgentStatusV5
  );


  console.log(
    LOG,
    "Custom element registered."
  );

})();
