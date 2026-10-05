(function () {
  "use strict";

  const TAG = "wxcc-agent-status-v3";

  if (customElements.get(TAG)) {
    return;
  }

  class AgentStatusV3 extends HTMLElement {

    constructor() {
      super();

      this.config = {
        title: "Agent Status",
        teamName: "",
        agentDnNumber: "",
        channelsStatesMap: {},
        idleCode: null
      };

      this.shadow = this.attachShadow({
        mode: "open"
      });

      this.shadow.innerHTML = `
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
            box-shadow: 0 2px 8px rgba(15,23,42,.06);
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

          .noChannels {
            margin-top: 14px;
            padding: 10px;
            border-radius: 7px;
            background: #f8fafc;
            color: #64748b;
            font-size: 11px;
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
            class="noChannels"
            id="noChannels"
            style="display:none">
            No channel state information available.
          </div>

        </div>
      `;

      this.clockTimer = null;
    }


    connectedCallback() {

      this.readProperties();

      this.render();

      this.clockTimer = setInterval(
        () => {
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
    }


    readProperties() {

      const read = (
        name,
        fallback
      ) => {

        if (
          this[name] !== undefined &&
          this[name] !== null
        ) {

          return this[name];

        }

        const attr =
          this.getAttribute(name);

        if (attr !== null) {

          return attr;

        }

        return fallback;
      };


      this.config.title =
        String(
          read(
            "title",
            "Agent Status"
          )
        );


      this.config.teamName =
        String(
          read(
            "teamName",
            ""
          )
        );


      this.config.agentDnNumber =
        String(
          read(
            "agentDnNumber",
            ""
          )
        );


      let map =
        read(
          "channelsStatesMap",
          {}
        );


      /*
       * Webex normally supplies this
       * as an object.
       *
       * This also supports a JSON string
       * in case the Desktop serializes it.
       */

      if (
        typeof map === "string"
      ) {

        try {

          map =
            JSON.parse(map);

        } catch {

          map = {};

        }
      }


      this.config.channelsStatesMap =
        map &&
        typeof map === "object"
          ? map
          : {};


      let idle =
        read(
          "idleCode",
          null
        );


      if (
        typeof idle === "string"
      ) {

        try {

          idle =
            JSON.parse(idle);

        } catch {

          // Keep the string.
        }
      }


      this.config.idleCode =
        idle;
    }


    /*
     * Get the telephony channel first.
     *
     * If telephony doesn't exist,
     * use the first available channel.
     */

    getPrimaryChannel() {

      const map =
        this.config.channelsStatesMap ||
        {};


      if (
        map.telephony
      ) {

        return map.telephony;
      }


      const first =
        Object.values(map)
          .find(
            value =>
              value &&
              typeof value === "object"
          );


      return (
        first ||
        {}
      );
    }


    /*
     * IMPORTANT:
     *
     * We deliberately DO NOT use
     * STORE.agent.status or
     * STORE.agent.subStatus.
     *
     * The state comes directly from:
     *
     * channelsStatesMap[channel].agentState
     */

    getState() {

      const primary =
        this.getPrimaryChannel();


      return (
        primary.agentState ||
        "Unknown"
      );
    }


    getReason() {

      const primary =
        this.getPrimaryChannel();


      /*
       * Cisco provides stateChangeReason
       * directly on the channel state.
       */

      if (
        primary.stateChangeReason
      ) {

        return String(
          primary.stateChangeReason
        );
      }


      /*
       * If there is an idle code,
       * display its name.
       */

      const idle =
        this.config.idleCode;


      if (
        idle &&
        typeof idle === "object" &&
        idle.name
      ) {

        return String(
          idle.name
        );
      }


      if (
        typeof idle === "string" &&
        idle
      ) {

        return idle;
      }


      return "--";
    }


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
       * Cisco example timestamps are
       * epoch seconds.
       *
       * If milliseconds are supplied,
       * handle those too.
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
            ) / 1000
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
          ) / 60
        );


      const secs =
        seconds % 60;


      if (
        hours > 0
      ) {

        return (
          `${String(hours).padStart(2, "0")}:` +
          `${String(minutes).padStart(2, "0")}:` +
          `${String(secs).padStart(2, "0")}`
        );
      }


      return (
        `${String(minutes).padStart(2, "0")}:` +
        `${String(secs).padStart(2, "0")}`
      );
    }


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


    render() {

      /*
       * Re-read properties because
       * Webex Desktop can update the
       * data provider while the widget
       * is already running.
       */

      this.readProperties();


      const state =
        this.getState();


      const primary =
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
          this.config.title;


      /*
       * State dot
       */

      const dot =
        this.shadowRoot
          .getElementById(
            "dot"
          );


      dot.style.background =
        color;


      /*
       * State text
       */

      const stateEl =
        this.shadowRoot
          .getElementById(
            "state"
          );


      stateEl.textContent =
        this.formatState(
          state
        );


      stateEl.style.color =
        color;


      /*
       * State duration
       */

      this.shadowRoot
        .getElementById(
          "duration"
        )
        .textContent =
          this.formatDuration(
            primary.stateChangeTimestamp
          );


      /*
       * Team
       */

      this.shadowRoot
        .getElementById(
          "team"
        )
        .textContent =
          this.config.teamName ||
          "--";


      /*
       * DN
       */

      this.shadowRoot
        .getElementById(
          "dn"
        )
        .textContent =
          this.config.agentDnNumber ||
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


      const noChannels =
        this.shadowRoot
          .getElementById(
            "noChannels"
          );


      box.innerHTML = "";


      const map =
        this.config.channelsStatesMap ||
        {};


      const entries =
        Object.entries(map)
          .filter(
            ([, detail]) =>
              detail &&
              typeof detail === "object"
          );


      if (
        entries.length === 0
      ) {

        noChannels.style.display =
          "block";

        return;
      }


      noChannels.style.display =
        "none";


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
           * Available / total channels
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
    AgentStatusV3
  );

})();
