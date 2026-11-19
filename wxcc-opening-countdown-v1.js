
(function () {
  "use strict";

  const TAG = "wxcc-opening-countdown-v1";
  if (customElements.get(TAG)) return;

  class OpeningCountdownV1 extends HTMLElement {
    constructor() {
      super();
      this.timer = null;
      this.shadow = this.attachShadow({ mode: "open" });

      this.shadow.innerHTML = `
        <style>
          :host {
            display: block;
            width: auto;
            max-width: 100%;
            font-family: inherit;
            color: var(--wxcc-countdown-text, inherit);
          }

          .root {
            box-sizing: border-box;
            padding: 0 10px;
          }

          .row {
            display: flex;
            align-items: center;
            gap: 7px;
            white-space: nowrap;
          }

          .label {
            font-size: 11px;
            font-weight: 600;
            opacity: 0.78;
          }

          .value {
            font-size: 14px;
            line-height: 1.2;
            font-weight: 700;
            font-variant-numeric: tabular-nums;
          }

          .status {
            font-size: 11px;
            font-weight: 700;
            padding: 3px 7px;
            border-radius: 10px;
            background: #e5f6ed;
            color: #167346;
          }

          .closed {
            background: #fff2df;
            color: #985700;
          }

          @media (max-width: 760px) {
            .label {
              font-size: 10px;
            }

            .value {
              font-size: 12px;
            }

            .row {
              gap: 5px;
            }
          }
        </style>

        <div class="root" aria-label="Office opening hours countdown">
          <div class="row">
            <span class="label" id="label">Office</span>
            <span class="value" id="time">--:--:--</span>
            <span class="status" id="status">Loading</span>
          </div>
        </div>
      `;
    }

    connectedCallback() {
      this.update();
      this.timer = setInterval(() => this.update(), 1000);
    }

    disconnectedCallback() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }

    parts(date) {
      const p = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Amsterdam",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23"
      }).formatToParts(date);

      const out = {};
      p.forEach(x => {
        if (x.type !== "literal") out[x.type] = x.value;
      });

      return out;
    }

    localToUtc(y, m, d, h, min, sec) {
      // Convert Amsterdam local time to UTC, accounting for CET/CEST.
      let guess = Date.UTC(y, m - 1, d, h, min, sec);

      for (let i = 0; i < 3; i++) {
        const p = this.parts(new Date(guess));

        const represented = Date.UTC(
          Number(p.year),
          Number(p.month) - 1,
          Number(p.day),
          Number(p.hour),
          Number(p.minute),
          Number(p.second)
        );

        const wanted = Date.UTC(y, m - 1, d, h, min, sec);

        guess += wanted - represented;
      }

      return guess;
    }

    fmt(seconds) {
      seconds = Math.max(0, Math.floor(seconds));

      const days = Math.floor(seconds / 86400);
      seconds %= 86400;

      const hours = Math.floor(seconds / 3600);
      seconds %= 3600;

      const mins = Math.floor(seconds / 60);
      seconds %= 60;

      return (days ? days + "d " : "") +
        [hours, mins, seconds]
          .map(v => String(v).padStart(2, "0"))
          .join(":");
    }

    update() {
      const now = new Date();
      const p = this.parts(now);

      const weekday = p.weekday;
      const hour = Number(p.hour);
      const minute = Number(p.minute);
      const second = Number(p.second);

      const isWeekday = ["Mon", "Tue", "Wed", "Thu", "Fri"]
        .includes(weekday);

      const isOpen =
        isWeekday &&
        (hour > 8 || (hour === 8 && (minute > 0 || second >= 0))) &&
        hour < 17;

      const label = this.shadow.getElementById("label");
      const time = this.shadow.getElementById("time");
      const status = this.shadow.getElementById("status");

      if (isOpen) {
        const closeUtc = this.localToUtc(
          Number(p.year),
          Number(p.month),
          Number(p.day),
          17, 0, 0
        );

        label.textContent = "Closes in";
        time.textContent = this.fmt(
          (closeUtc - now.getTime()) / 1000
        );

        status.textContent = "OPEN NOW";
        status.className = "status";
      } else {
        let y = Number(p.year);
        let m = Number(p.month);
        let d = Number(p.day);

        let daysToAdd = 0;

        if (weekday === "Sat") {
          daysToAdd = 2;
        } else if (weekday === "Sun") {
          daysToAdd = 1;
        } else if (hour >= 17) {
          daysToAdd = weekday === "Fri" ? 3 : 1;
        }

        const date = new Date(Date.UTC(y, m - 1, d + daysToAdd));

        y = date.getUTCFullYear();
        m = date.getUTCMonth() + 1;
        d = date.getUTCDate();

        const openUtc = this.localToUtc(y, m, d, 8, 0, 0);

        label.textContent = "Opens in";
        time.textContent = this.fmt(
          (openUtc - now.getTime()) / 1000
        );

        status.textContent = "CLOSED";
        status.className = "status closed";
      }
    }
  }

  customElements.define(TAG, OpeningCountdownV1);
})();
