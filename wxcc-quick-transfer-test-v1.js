// Webex Contact Center Quick Transfer - external widget test v1
(function () {
  "use strict";

  const TAG = "wxcc-quick-transfer-test-v1";

  // Prevent registering the same custom element twice
  if (customElements.get(TAG)) {
    console.log("[QuickTransferTest] already defined");
    return;
  }

  class QuickTransferTest extends HTMLElement {

    constructor() {
      super();

      const shadow = this.attachShadow({
        mode: "open"
      });

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

          .message {
            margin-bottom: 16px;
            font-size: 13px;
            color: #475569;
          }

          .success {
            padding: 10px 12px;
            margin-bottom: 16px;
            border-radius: 6px;
            background: #dcfce7;
            border: 1px solid #86efac;
            color: #166534;
            font-weight: 600;
          }

          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          button {
            min-height: 50px;
            border: 2px solid rgba(0,0,0,.15);
            border-radius: 8px;
            color: white;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          }

          button:hover {
            filter: brightness(0.92);
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

          @media (max-width: 520px) {
            .grid {
              grid-template-columns: 1fr;
            }
          }

        </style>

        <div class="root">

          <h2>
            Quick Transfer TEST
          </h2>

          <div class="message">
            This widget is loaded from GitHub Pages.
          </div>

          <div class="success">
            ✓ External JavaScript loaded successfully
          </div>

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

        </div>
      `;
    }


    connectedCallback() {

      console.log(
        "[QuickTransferTest] connectedCallback - widget rendered successfully"
      );

      this.shadowRoot
        .querySelectorAll("button")
        .forEach(button => {

          button.addEventListener(
            "click",
            () => {

              alert(
                "The external Quick Transfer widget is working.\\n\\nClicked: " +
                button.textContent.trim()
              );

            }
          );

        });

    }

  }


  // Register the custom Web Component
  customElements.define(
    TAG,
    QuickTransferTest
  );


  console.log(
    "[QuickTransferTest] custom element registered:",
    TAG
  );

})();
