(() => {
  class WxccQuickTransferTest extends HTMLElement {

    constructor() {
      super();

      this.attachShadow({
        mode: "open"
      });
    }

    connectedCallback() {
      this.shadowRoot.innerHTML = `
        <style>

          :host {
            display: block;
            width: 100%;
            min-height: 250px;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
          }

          .container {
            padding: 16px;
            width: 100%;
            box-sizing: border-box;
          }

          h2 {
            margin: 0 0 14px;
            font-size: 18px;
            font-weight: 600;
          }

          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          button {
            width: 100%;
            min-height: 48px;
            padding: 10px 14px;
            border: 2px solid rgba(0,0,0,.18);
            border-radius: 8px;
            color: #ffffff;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-sizing: border-box;
          }

          button:hover {
            filter: brightness(1.08);
          }

          .sales {
            background: #2563eb;
          }

          .billing {
            background: #16a34a;
          }

          .technical {
            background: #d97706;
          }

          .reception {
            background: #7c3aed;
          }

          .manager {
            background: #dc2626;
          }

          .other {
            background: #475569;
          }

          .status {
            margin-top: 14px;
            padding: 8px 10px;
            background: #f1f5f9;
            color: #334155;
            border-radius: 6px;
            font-size: 12px;
          }

        </style>

        <div class="container">

          <h2>Quick Transfer TEST v2</h2>

          <div class="grid">

            <button class="sales">
              Sales
            </button>

            <button class="billing">
              Billing
            </button>

            <button class="technical">
              Technical Support
            </button>

            <button class="reception">
              Reception
            </button>

            <button class="manager">
              Manager
            </button>

            <button class="other">
              Other
            </button>

          </div>

          <div class="status">
            Widget loaded successfully.
          </div>

        </div>
      `;

      const buttons =
        this.shadowRoot.querySelectorAll("button");

      buttons.forEach(button => {

        button.addEventListener("click", () => {

          const status =
            this.shadowRoot.querySelector(".status");

          status.textContent =
            button.textContent.trim() +
            " clicked — test only.";

        });

      });
    }
  }

  if (!customElements.get("wxcc-quick-transfer-test")) {

    customElements.define(
      "wxcc-quick-transfer-test",
      WxccQuickTransferTest
    );

  }

})();
