
/*
 * Webex Contact Center - Atea Wallboard Navigator V1
 *
 * Features:
 * - 14 configurable dashboards
 * - One iframe loaded at a time
 * - Dashboard selector buttons
 * - Refresh current dashboard
 * - Responsive layout
 * - No external libraries
 */

class WxccWallboardNavigatorV1 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.currentIndex = 0;
    this.wallboards = [];
  }

  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;

    this.wallboards = [
      {
        name: "AE",
        url: "https://dashboard.wxcc.ateasystems.com/wxcc/dashboard/18?at=20ddc135-5b4d-49df-84b8-1407f8596a8d"
      },
      {
        name: "AT",
        url: "https://dashboard.wxcc.ateasystems.com/wxcc/dashboard/19?at=e89fe598-8b58-4742-a385-03260f1a98c9"
      },
      {
        name: "BE",
        url: "https://dashboard.wxcc.ateasystems.com/wxcc/dashboard/20?at=f64830cf-1568-482c-a272-53fa52a6c4a6"
      },
      {
        name: "CH",
        url: "https://dashboard.wxcc.ateasystems.com/wxcc/dashboard/21?at=606561d5-a288-4ded-b926-f45a2c998b18"
      },
      {
        name: "DE",
        url: "https://dashboard.wxcc.ateasystems.com/wxcc/dashboard/15?at=0c109c68-8f7e-454b-943c-f4aaef5f1cc6"
      },
      {
        name: "ES",
        url: "https://dashboard.wxcc.ateasystems.com/wxcc/dashboard/22?at=809db111-99b8-4633-a1ee-1c8cc8a83ed2"
      },
      {
        name: "FR",
        url: "https://dashboard.wxcc.ateasystems.com/wxcc/dashboard/24?at=11e09fdb-0b8e-4e22-bb50-a39f93128912"
      },
      {
        name: "IT",
        url: "https://dashboard.wxcc.ateasystems.com/wxcc/dashboard/23?at=ecd7bf06-6eef-438b-a946-5beb6e585108"
      },
      {
        name: "NL",
        url: "https://dashboard.wxcc.ateasystems.com/wxcc/dashboard/25?at=7e50be9f-8e46-41b0-b567-e3a16fa608d9"
      },
      {
        name: "OVF",
        url: "https://dashboard.wxcc.ateasystems.com/wxcc/dashboard/26?at=8a960037-38c0-44cf-af0f-e390dce3a912"
      },
      {
        name: "SE",
        url: "https://dashboard.wxcc.ateasystems.com/wxcc/dashboard/27?at=e55362ae-2eb3-436f-9244-6d3af78c73da"
      },
      {
        name: "UK",
        url: "https://dashboard.wxcc.ateasystems.com/wxcc/dashboard/16?at=40c5ad6e-7a56-4ee0-83b1-ebf1235770eb"
      },
      {
        name: "ZA",
        url: "https://dashboard.wxcc.ateasystems.com/wxcc/dashboard/28?at=a8a646ab-3b32-4145-817c-98de7f088ecb"
      },
      {
        name: "Solution",
        url: "https://dashboard.wxcc.ateasystems.com/wxcc/dashboard/29?at=f40bda3b-86e7-4896-abcb-7f45e79c25cd"
      }
    ];

    this.render();
    this.loadDashboard(0);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          min-height: 0;
          box-sizing: border-box;
          font-family: inherit;
        }

        * {
          box-sizing: border-box;
        }

        .container {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          min-height: 0;
          overflow: hidden;
          background: #f4f5f7;
        }

        .toolbar {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px;
          background: #ffffff;
          border-bottom: 1px solid #d8dce3;
          flex-wrap: wrap;
          flex-shrink: 0;
        }

        .buttons {
          display: flex;
          flex: 1;
          flex-wrap: wrap;
          gap: 5px;
          align-items: center;
        }

        button {
          border: 1px solid #d1d5db;
          background: #f3f4f6;
          color: #374151;
          border-radius: 5px;
          padding: 7px 12px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        button:hover {
          background: #e5e7eb;
        }

        button.active {
          background: #2563eb;
          border-color: #2563eb;
          color: #ffffff;
        }

        .refresh {
          flex-shrink: 0;
          background: #ffffff;
          font-size: 16px;
          padding: 6px 11px;
        }

        .statusbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 5px 10px;
          background: #e9edf2;
          border-bottom: 1px solid #d8dce3;
          font-size: 12px;
          color: #4b5563;
          flex-shrink: 0;
        }

        .dashboard {
          flex: 1;
          width: 100%;
          min-height: 0;
          position: relative;
          overflow: hidden;
          background: #ffffff;
        }

        iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: none;
          display: block;
          background: white;
        }

        @media (max-width: 600px) {
          .toolbar {
            gap: 4px;
            padding: 5px;
          }

          button {
            padding: 6px 9px;
            font-size: 12px;
          }
        }
      </style>

      <div class="container">
        <div class="toolbar">
          <div class="buttons" id="buttons"></div>
          <button class="refresh" id="refresh" title="Refresh dashboard">↻</button>
        </div>

        <div class="statusbar">
          <span id="currentName">Loading…</span>
          <span id="counter"></span>
        </div>

        <div class="dashboard" id="dashboard"></div>
      </div>
    `;

    this.createButtons();

    this.shadowRoot
      .getElementById("refresh")
      .addEventListener("click", () => this.refreshDashboard());
  }

  createButtons() {
    const container = this.shadowRoot.getElementById("buttons");

    this.wallboards.forEach((wallboard, index) => {
      const button = document.createElement("button");
      button.textContent = wallboard.name;
      button.dataset.index = index;

      button.addEventListener("click", () => {
        this.loadDashboard(index);
      });

      container.appendChild(button);
    });
  }

  loadDashboard(index) {
    if (index < 0 || index >= this.wallboards.length) return;

    this.currentIndex = index;
    const wallboard = this.wallboards[index];

    const dashboard = this.shadowRoot.getElementById("dashboard");
    dashboard.innerHTML = "";

    const iframe = document.createElement("iframe");
    iframe.title = `Atea Wallboard - ${wallboard.name}`;
    iframe.src = wallboard.url;
    iframe.allow = "fullscreen";

    dashboard.appendChild(iframe);

    this.updateUI();
  }

  refreshDashboard() {
    const iframe = this.shadowRoot.querySelector("#dashboard iframe");
    if (iframe) {
      iframe.src = this.wallboards[this.currentIndex].url;
    }
  }

  updateUI() {
    const buttons = this.shadowRoot.querySelectorAll(".buttons button");

    buttons.forEach((button, index) => {
      button.classList.toggle("active", index === this.currentIndex);
    });

    const current = this.wallboards[this.currentIndex];

    this.shadowRoot.getElementById("currentName").textContent =
      `Wallboard: ${current.name}`;

    this.shadowRoot.getElementById("counter").textContent =
      `${this.currentIndex + 1} / ${this.wallboards.length}`;
  }
}

if (!customElements.get("wxcc-wallboard-navigator-v1")) {
  customElements.define(
    "wxcc-wallboard-navigator-v1",
    WxccWallboardNavigatorV1
  );
}
