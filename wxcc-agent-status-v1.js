(function () {
  "use strict";

  const TAG = "wxcc-agent-status-v1";

  const SDK_URLS = [
    "https://cdn.jsdelivr.net/npm/@wxcc-desktop/sdk/+esm",
    "https://esm.sh/@wxcc-desktop/sdk"
  ];

  if (customElements.get(TAG)) {
    return;
  }

  class AgentStatusV1 extends HTMLElement {
    constructor() {
      super();

      this.Desktop = null;
      this.pollTimer = null;
      this.clockTimer = null;
      this.stateListener = null;

      this.config = {
        title: "Agent Status",
        channel: "telephony",
        showOtherChannels: true,
        showTeam: true,
        showDN: false,
        showChannelCounts: true,
        showReason: true,
        compact: false,

        availableColor: "#16a34a",
        engagedColor: "#2563eb",
        idleColor: "#f59e0b",
        wrapupColor: "#7c3aed",
        offlineColor: "#64748b",
        defaultColor: "#475569",

        backgroundColor: "#ffffff",
        textColor: "#172033",
        mutedColor: "#64748b",
        borderColor: "#dbe2ea",

        channelColors: {
          telephony: "#2563eb",
          chat: "#7c3aed",
          email: "#0891b2",
          social: "#db2777"
        }
      };

      this.latestData = null;
      this.channelStates = {};

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
            color: var(--text-color);
          }

          .card {
            width: 100%;
            box-sizing: border-box;
            background: var(--background-color);
            color: var(--text-color);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
          }

          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 14px;
          }

          .title {
            font-size: 16px;
            font-weight: 700;
          }

          .main {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            flex: 0 0 12px;
            background: var(--default-color);
          }

          .state {
            font-size: 22px;
            font-weight: 700;
            line-height: 1.1;
          }

          .duration {
            margin-top: 4px;
            color: var(--muted-color);
            font-size: 12px;
          }

          .details {
            margin-top: 16px;
            display: grid;
            gap: 8px;
          }

          .detail {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            font-size: 12px;
          }

          .detail-label {
            color: var(--muted-color);
          }

          .detail-value {
            font-weight: 600;
            text-align: right;
          }

          .channels {
            margin-top: 16px;
            display: grid;
            gap: 7px;
          }

          .channel {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 8px 10px;
            border-radius: 8px;
            background: rgba(148, 163, 184, 0.10);
          }

          .channel-name {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            font-size: 12px;
          }

          .channel-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
          }

          .channel-state {
            font-size: 12px;
            font-weight: 600;
          }

          .count {
            margin-left: 5px;
            font-weight: 400;
            color: var(--muted-color);
          }

          .status {
            margin-top: 12px;
            padding: 8px 10px;
            border-radius: 8px;
            background: #f1f5f9;
            color: #475569;
            font-size: 11px;
          }

          .hidden {
            display: none !important;
          }

          .compact .card {
            padding: 12px;
          }

          .compact .details,
          .compact .channels {
            margin-top: 10px;
          }

        </style>

        <div class="card" id="card">

          <div class="header">
            <div class="title" id="title">
              Agent Status
            </div>
          </div>

          <div class="main">

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

            <div
              class="detail"
              id="teamRow">

              <span class="detail-label">
                Team
              </span>

              <span
                class="detail-value"
                id="team">
                --
              </span>

            </div>

            <div
              class="detail"
              id="dnRow">

              <span class="detail-label">
                DN
              </span>

              <span
                class="detail-value"
                id="dn">
                --
              </span>

            </div>

            <div
              class="detail"
              id="reasonRow">

              <span class="detail-label">
                Reason
              </span>

              <span
                class="detail-value"
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
            class="status hidden"
            id="status">

            Waiting for Desktop agent state...

          </div>

        </div>
      `;
    }

    connectedCallback() {

      this.readLayoutConfig();

      this.applyTheme();

      this.render();

      this.start();
    }

    disconnectedCallback() {

      if (this.pollTimer) {

        clearInterval(
          this.pollTimer
        );

        this.pollTimer = null;
      }

      if (this.clockTimer) {

        clearInterval(
          this.clockTimer
        );

        this.clockTimer = null;
      }

      if (
        this.Desktop &&
        this.stateListener &&
        this.Desktop.agentStateInfo
      ) {

        try {

          this.Desktop.agentStateInfo.removeEventListener(
            "eAgentChannelStateChanged",
            this.stateListener
          );

        } catch (error) {

          console.warn(
            "[WXCC Agent Status V1] Could not remove listener",
            error
          );

        }

      }

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

      this.config.channel =
        String(
          read(
            "channel",
            this.config.channel
          )
        ).toLowerCase();

      this.config.showOtherChannels =
        read(
          "showOtherChannels",
          this.config.showOtherChannels
        ) !== false;

      this.config.showTeam =
        read(
          "showTeam",
          this.config.showTeam
        ) !== false;

      this.config.showDN =
        read(
          "showDN",
          this.config.showDN
        ) === true;

      this.config.showChannelCounts =
        read(
          "showChannelCounts",
          this.config.showChannelCounts
        ) !== false;

      this.config.showReason =
        read(
          "showReason",
          this.config.showReason
        ) !== false;

      this.config.compact =
        read(
          "compact",
          this.config.compact
        ) === true;

      const colorNames = [

        "availableColor",
        "engagedColor",
        "idleColor",
        "wrapupColor",
        "offlineColor",
        "defaultColor",
        "backgroundColor",
        "textColor",
        "mutedColor",
        "borderColor"

      ];

      colorNames.forEach(
        name => {

          this.config[name] =
            String(
              read(
                name,
                this.config[name]
              )
            );

        }
      );

      if (
        this.channelColors &&
        typeof this.channelColors === "object"
      ) {

        this.config.channelColors =
          Object.assign(
            {},
            this.config.channelColors,
            this.channelColors
          );

      }

    }

    applyTheme() {

      const root =
        this.shadow.host.style;

      root.setProperty(
        "--available-color",
        this.config.availableColor
      );

      root.setProperty(
        "--engaged-color",
        this.config.engagedColor
      );

      root.setProperty(
        "--idle-color",
        this.config.idleColor
      );

      root.setProperty(
        "--wrapup-color",
        this.config.wrapupColor
      );

      root.setProperty(
        "--offline-color",
        this.config.offlineColor
      );

      root.setProperty(
        "--default-color",
        this.config.defaultColor
      );

      root.setProperty(
        "--background-color",
        this.config.backgroundColor
      );

      root.setProperty(
        "--text-color",
        this.config.textColor
      );

      root.setProperty(
        "--muted-color",
        this.config.mutedColor
      );

      root.setProperty(
        "--border-color",
        this.config.borderColor
      );

      const card =
        this.shadow.getElementById(
          "card"
        );

      if (this.config.compact) {

        card.classList.add(
          "compact"
        );

      } else {

        card.classList.remove(
          "compact"
        );

      }

    }

    getStateColor(state) {

      const value =
        String(state || "")
          .toLowerCase();

      if (
        value === "available" ||
        value === "ready"
      ) {

        return this.config.availableColor;

      }

      if (
        value === "engaged" ||
        value === "oncall" ||
        value === "on call" ||
        value === "connected"
      ) {

        return this.config.engagedColor;

      }

      if (
        value === "wrapup" ||
        value === "wrap_up" ||
        value === "wrap up"
      ) {

        return this.config.wrapupColor;

      }

      if (
        value === "idle" ||
        value === "break" ||
        value === "meeting" ||
        value === "lunch" ||
        value === "training"
      ) {

        return this.config.idleColor;

      }

      if (
        value === "offline" ||
        value === "loggedout" ||
        value === "logged out"
      ) {

        return this.config.offlineColor;

      }

      return this.config.defaultColor;
    }

    formatState(state) {

      if (!state) {

        return "Unknown";

      }

      const text =
        String(state)
          .replace(/_/g, " ")
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

      let milliseconds =
        Number(timestamp);

      if (
        !Number.isFinite(
          milliseconds
        )
      ) {

        return "--:--";

      }

      if (
        milliseconds <
        100000000000
      ) {

        milliseconds *= 1000;

      }

      const elapsed =
        Math.max(
          0,
          Date.now() -
          milliseconds
        );

      const totalSeconds =
        Math.floor(
          elapsed / 1000
        );

      const hours =
        Math.floor(
          totalSeconds / 3600
        );

      const minutes =
        Math.floor(
          (
            totalSeconds %
            3600
          ) / 60
        );

      const seconds =
        totalSeconds % 60;

      if (hours > 0) {

        return (
          String(hours)
            .padStart(2, "0") +
          ":" +
          String(minutes)
            .padStart(2, "0") +
          ":" +
          String(seconds)
            .padStart(2, "0")
        );

      }

      return (
        String(minutes)
          .padStart(2, "0") +
        ":" +
        String(seconds)
          .padStart(2, "0")
      );

    }

    getChannelStates(data) {

      if (
        data?.channelsStatesMap &&
        typeof data.channelsStatesMap === "object"
      ) {

        return data.channelsStatesMap;

      }

      return {};

    }

    getPrimaryState(data) {

      const states =
        this.getChannelStates(
          data
        );

      const primary =
        states[
          this.config.channel
        ];

      if (
        primary?.agentState
      ) {

        return primary;

      }

      const first =
        Object.values(states)
          .find(
            item =>
              item?.agentState
          );

      if (first) {

        return first;

      }

      if (data?.subStatus) {

        return {

          agentState:
            data.subStatus,

          stateChangeTimestamp:
            data.subStatusChangeTimestamp

        };

      }

      return {

        agentState:
          "Unknown",

        stateChangeTimestamp:
          null

      };

    }

    updateFromData(data) {

      if (!data) {

        return;

      }

      this.latestData =
        data;

      this.channelStates =
        this.getChannelStates(
          data
        );

      this.render();

      const status =
        this.shadow.getElementById(
          "status"
        );

      status.classList.add(
        "hidden"
      );

    }

    render() {

      const data =
        this.latestData;

      if (!data) {

        return;

      }

      const primary =
        this.getPrimaryState(
          data
        );

      const state =
        primary.agentState ||
        "Unknown";

      const color =
        this.getStateColor(
          state
        );

      const dot =
        this.shadow.getElementById(
          "dot"
        );

      dot.style.background =
        color;

      const stateElement =
        this.shadow.getElementById(
          "state"
        );

      stateElement.textContent =
        this.formatState(
          state
        );

      stateElement.style.color =
        color;

      this.shadow
        .getElementById(
          "duration"
        )
        .textContent =
          this.formatDuration(
            primary.stateChangeTimestamp
          );

      this.shadow
        .getElementById(
          "title"
        )
        .textContent =
          this.config.title;

      const teamRow =
        this.shadow.getElementById(
          "teamRow"
        );

      teamRow.classList.toggle(
        "hidden",
        !this.config.showTeam
      );

      this.shadow
        .getElementById(
          "team"
        )
        .textContent =
          data.teamName ||
          data.teamId ||
          "--";

      const dnRow =
        this.shadow.getElementById(
          "dnRow"
        );

      dnRow.classList.toggle(
        "hidden",
        !this.config.showDN
      );

      this.shadow
        .getElementById(
          "dn"
        )
        .textContent =
          data.dn ||
          data.agentDnNumber ||
          "--";

      const reasonRow =
        this.shadow.getElementById(
          "reasonRow"
        );

      reasonRow.classList.toggle(
        "hidden",
        !this.config.showReason
      );

      this.shadow
        .getElementById(
          "reason"
        )
        .textContent =
          primary.stateChangeReason ||
          data.idleCode?.name ||
          "--";

      this.renderChannels();

    }

    renderChannels() {

      const box =
        this.shadow.getElementById(
          "channels"
        );

      box.innerHTML = "";

      const states =
        this.channelStates || {};

      const entries =
        Object.entries(states)
          .filter(
            ([channel]) =>
              this.config.showOtherChannels ||
              channel === this.config.channel
          );

      entries.forEach(
        ([channel, state]) => {

          if (!state) {

            return;

          }

          const row =
            document.createElement(
              "div"
            );

          row.className =
            "channel";

          const name =
            document.createElement(
              "div"
            );

          name.className =
            "channel-name";

          const dot =
            document.createElement(
              "span"
            );

          dot.className =
            "channel-dot";

          dot.style.background =
            this.config
              .channelColors[channel] ||
            this.getStateColor(
              state.agentState
            );

          const label =
            document.createElement(
              "span"
            );

          label.textContent =
            this.formatChannelName(
              channel
            );

          name.appendChild(
            dot
          );

          name.appendChild(
            label
          );

          const stateElement =
            document.createElement(
              "div"
            );

          stateElement.className =
            "channel-state";

          stateElement.style.color =
            this.getStateColor(
              state.agentState
            );

          stateElement.textContent =
            this.formatState(
              state.agentState
            );

          if (
            this.config.showChannelCounts &&
            (
              state.totalChannelCount !==
                undefined ||
              state.availableChannelCount !==
                undefined
            )
          ) {

            const count =
              document.createElement(
                "span"
              );

            count.className =
              "count";

            const available =
              state.availableChannelCount ??
              "?";

            const total =
              state.totalChannelCount ??
              "?";

            count.textContent =
              `(${available}/${total})`;

            stateElement.appendChild(
              count
            );

          }

          row.appendChild(
            name
          );

          row.appendChild(
            stateElement
          );

          box.appendChild(
            row
          );

        }
      );

      box.classList.toggle(
        "hidden",
        entries.length === 0
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
        String(channel)
          .charAt(0)
          .toUpperCase() +
        String(channel).slice(1)
      );

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

    async refresh() {

      try {

        if (
          !this.Desktop?.agentStateInfo
        ) {

          return;

        }

        const data =
          this.Desktop
            .agentStateInfo
            .latestData;

        if (data) {

          this.updateFromData(
            data
          );

        }

      } catch (error) {

        console.error(
          "[WXCC Agent Status V1] Refresh failed",
          error
        );

      }

    }

    async start() {

      try {

        this.Desktop =
          await this.loadSDK();

        await this.Desktop.config.init(
          "agent-status-v1",
          "Axis"
        );

        await this.refresh();

        if (
          this.Desktop.agentStateInfo
        ) {

          this.stateListener =
            () => {

              this.refresh();

            };

          this.Desktop
            .agentStateInfo
            .addEventListener(
              "eAgentChannelStateChanged",
              this.stateListener
            );

          this.Desktop
            .agentStateInfo
            .addEventListener(
              "updated",
              this.stateListener
            );

        }

        this.pollTimer =
          setInterval(
            () =>
              this.refresh(),
            5000
          );

        this.clockTimer =
          setInterval(
            () => {

              if (
                this.latestData
              ) {

                this.render();

              }

            },
            1000
          );

      } catch (error) {

        console.error(
          "[WXCC Agent Status V1] Startup failed",
          error
        );

        const status =
          this.shadow.getElementById(
            "status"
          );

        status.textContent =
          "Agent Status could not start: " +
          (
            error?.message ||
            error
          );

        status.classList.remove(
          "hidden"
        );

      }

    }

  }

  customElements.define(
    TAG,
    AgentStatusV1
  );

})();
