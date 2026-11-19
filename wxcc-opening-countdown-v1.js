
/* Webex Contact Center opening-hours countdown widget
 *
 * Configurable through Desktop Layout attributes:
 * open-time="08:00"
 * close-time="17:00"
 * days="mon,tue,wed,thu,fri"
 * timezone="Europe/Amsterdam"
 * label="Opening hours"
 */

class WxccOpeningCountdownV1 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._timer = null;
  }

  connectedCallback() {
    if (this._rendered) return;
    this._rendered = true;
    this.render();
    this.update();
    this._timer = setInterval(() => this.update(), 1000);
  }

  disconnectedCallback() {
    if (this._timer) clearInterval(this._timer);
  }

  get openTime() {
    return this.getAttribute('open-time') || '08:00';
  }

  get closeTime() {
    return this.getAttribute('close-time') || '17:00';
  }

  get timezone() {
    return this.getAttribute('timezone') || 'Europe/Amsterdam';
  }

  get label() {
    return this.getAttribute('label') || 'Opening hours';
  }

  get days() {
    return (this.getAttribute('days') || 'mon,tue,wed,thu,fri')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          font-family: inherit;
          color: inherit;
        }

        .box {
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          padding: 4px 9px;
          border-radius: 6px;
          background: rgba(128,128,128,.12);
        }

        .status {
          font-weight: 700;
        }

        .time {
          font-variant-numeric: tabular-nums;
          font-weight: 600;
        }

        .open .status {
          color: #18a558;
        }

        .closed .status {
          color: #d97706;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #999;
          flex: 0 0 auto;
        }

        .open .dot {
          background: #18a558;
        }

        .closed .dot {
          background: #d97706;
        }
      </style>

      <div class="box closed" id="box">
        <span class="dot"></span>
        <span class="status" id="status">Loading…</span>
        <span class="time" id="time"></span>
      </div>
    `;
  }

  parts(date) {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: this.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
      weekday: 'short'
    });

    const out = {};
    for (const p of fmt.formatToParts(date)) {
      if (p.type !== 'literal') out[p.type] = p.value;
    }
    return out;
  }

  localToUtc(y, mo, d, hh, mm, ss = 0) {
    // DST-aware conversion from timezone wall-clock time to UTC.
    const target = Date.UTC(y, mo - 1, d, hh, mm, ss);
    let guess = target;

    for (let i = 0; i < 4; i++) {
      const p = this.parts(new Date(guess));
      const represented = Date.UTC(
        Number(p.year),
        Number(p.month) - 1,
        Number(p.day),
        Number(p.hour),
        Number(p.minute),
        Number(p.second)
      );
      guess += target - represented;
    }

    return new Date(guess);
  }

  parseTime(s) {
    const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(s);

    return m
      ? { hour: Number(m[1]), minute: Number(m[2]) }
      : { hour: 8, minute: 0 };
  }

  dateKeyShift(y, mo, d, shift) {
    const dt = new Date(Date.UTC(y, mo - 1, d + shift));

    return {
      year: dt.getUTCFullYear(),
      month: dt.getUTCMonth() + 1,
      day: dt.getUTCDate()
    };
  }

  weekdayKey(weekday) {
    return {
      Mon: 'mon',
      Tue: 'tue',
      Wed: 'wed',
      Thu: 'thu',
      Fri: 'fri',
      Sat: 'sat',
      Sun: 'sun'
    }[weekday] || '';
  }

  formatCountdown(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;

    if (days > 0) {
      return `${days}d ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  update() {
    try {
      const now = new Date();
      const local = this.parts(now);

      const open = this.parseTime(this.openTime);
      const close = this.parseTime(this.closeTime);

      const nowMins = Number(local.hour) * 60 + Number(local.minute);
      const openMins = open.hour * 60 + open.minute;
      const closeMins = close.hour * 60 + close.minute;

      const isTodayOpenDay = this.days.includes(
        this.weekdayKey(local.weekday)
      );

      const box = this.shadowRoot.getElementById('box');
      const status = this.shadowRoot.getElementById('status');
      const time = this.shadowRoot.getElementById('time');

      // Currently open
      if (
        isTodayOpenDay &&
        nowMins >= openMins &&
        nowMins < closeMins
      ) {
        const closeAt = this.localToUtc(
          Number(local.year),
          Number(local.month),
          Number(local.day),
          close.hour,
          close.minute,
          0
        );

        box.className = 'box open';
        status.textContent = 'OPEN NOW';
        time.textContent = `Closes in ${this.formatCountdown(closeAt - now)}`;
        return;
      }

      // Find next opening time
      let nextOpen = null;

      for (let shift = 0; shift <= 7; shift++) {
        const date = this.dateKeyShift(
          Number(local.year),
          Number(local.month),
          Number(local.day),
          shift
        );

        const weekday = this.parts(
          this.localToUtc(date.year, date.month, date.day, 12, 0, 0)
        ).weekday;

        if (!this.days.includes(this.weekdayKey(weekday))) continue;

        const candidate = this.localToUtc(
          date.year,
          date.month,
          date.day,
          open.hour,
          open.minute,
          0
        );

        if (candidate > now) {
          nextOpen = candidate;
          break;
        }
      }

      box.className = 'box closed';
      status.textContent = this.label;

      time.textContent = nextOpen
        ? `Opens in ${this.formatCountdown(nextOpen - now)}`
        : 'Schedule unavailable';

    } catch (e) {
      const status = this.shadowRoot.getElementById('status');
      const time = this.shadowRoot.getElementById('time');

      if (status) status.textContent = 'Hours unavailable';
      if (time) time.textContent = '';
    }
  }
}

if (!customElements.get('wxcc-opening-countdown-v1')) {
  customElements.define(
    'wxcc-opening-countdown-v1',
    WxccOpeningCountdownV1
  );
}
