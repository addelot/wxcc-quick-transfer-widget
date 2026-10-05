(function () {
  "use strict";

  const TAG = "wxcc-agent-status-v2";

  if (customElements.get(TAG)) {
    return;
  }

  class AgentStatusV2 extends HTMLElement {

    constructor() {
      super();

      this.config = {
        title: "Agent Status",
        teamName: "",
        agentDnNumber: "",
        status: "",
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
            min-height: 180px;
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
            padding: 7px 9px;
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
            border-radius: 50%;
          }

          .channelState {
            font-weight: 600;
          }

          .error {
            margin-top: 12px;
            padding: 8px 10px;
            border-radius: 7px;
            background: #fee2e2;
            color: #991b1b;
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
            class="error"
            id="error"
            style="display:none">
          </div>

        </div>
      `;

      this.data = {};

      this.clockTimer = null;
    }

    connectedCallback() {

      this.readProperties();

      this.render();

      this.clockTimer =
        setInterval(
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

      this.config.status =
        String(
          read(
            "status",
            ""
          )
        );

      let map =
        read(
          "channelsStatesMap",
          {}
        );

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

          // Keep plain string as the reason.

        }

      }

      this.config.idleCode =
        idle;

      this.data = {

        teamName:
          this.config.teamName,

        dn:
          this.config.agentDnNumber,

        status:
          this.config.status,

        channelsStatesMap:
          this.config.channelsStatesMap,

        idleCode:
          this.config.idleCode

      };
    }

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
            Boolean
          );

      return (
        first ||
        {}
      );
    }

    getState() {

      const primary =
        this.getPrimaryChannel();

      return (
        primary.agentState ||
        this.config.status ||
        "Unknown"
      );
    }

    getReason() {

      const primary =
        this.getPrimaryChannel();

      if (
        primary.stateChangeReason
      ) {

        return (
          primary.stateChangeReason
        );

      }

      const idle =
        this.config.idleCode;

      if (
        idle &&
        typeof idle === "object" &&
        idle.name
      ) {

        return idle.name;

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
       * Current granular agent-state
       * timestamp is normally epoch seconds.
       *
       * Also accept milliseconds.
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

      const h =
        Math.floor(
          seconds / 3600
        );

      const m =
        Math.floor(
          (
            seconds % 3600
          ) / 60
        );

      const s =
        seconds % 60;

      if (
        h > 0
      ) {

        return (
          `${String(h).padStart(2,"0")}:` +
          `${String(m).padStart(2,"0")}:` +
          `${String(s).padStart(2,"0")}`
        );

      }

      return (
        `${String(m).padStart(2,"0")}:` +
        `${String(s).padStart(2,"0")}`
      );
    }

    formatChannelName(channel) {

      const names = {

        telephony:
          "Telephony",

        chat:
          "Chat",

        email:
          "Email",

        social:
          "Social"

      };

      return (
        names[channel] ||
        channel.charAt(0).toUpperCase() +
        channel.slice(1)
      );
    }

    render() {

      /*
       * Properties can be populated after
       * connectedCallback, so reread them
       * every second.
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

      this.shadowRoot
        .getElementById(
          "title"
        )
        .textContent =
          this.config.title;

      const dot =
        this.shadowRoot
          .getElementById(
            "dot"
          );

      dot.style.background =
        color;

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

      this.shadowRoot
        .getElementById(
          "duration"
        )
        .textContent =
          this.formatDuration(
            primary.stateChangeTimestamp
          );

      this.shadowRoot
        .getElementById(
          "team"
        )
        .textContent =
          this.config.teamName ||
          "--";

      this.shadowRoot
        .getElementById(
          "dn"
        )
        .textContent =
          this.config.agentDnNumber ||
          "--";

      this.shadowRoot
        .getElementById(
          "reason"
        )
        .textContent =
          this.getReason();

      this.renderChannels();
    }

    renderChannels() {

      const box =
        this.shadowRoot
          .getElementById(
            "channels"
          );

      box.innerHTML = "";

      const map =
        this.config.channelsStatesMap ||
        {};

      Object.entries(map)
        .forEach(
          (
            [
              channel,
              detail
            ]
          ) => {

            if (!detail) {

              return;

            }

            const row =
              document.createElement(
                "div"
              );

            row.className =
              "channel";

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
    AgentStatusV2
  );

})();
