const productOptionsByRequestType = {
  "Product Purchase": [
    "Model 10",
    "Model 10/2",
    "Model 20",
    "Model 20/2",
    "Model 200",
    "Model 200/1",
    "Model 200T",
    "Model 210"
  ],
  "Rental": [
    "Model 20 Oven Heated THC Analyzer",
    "Model 20/2 Oven Heated Dual Channel THC Analyzer",
    "Model 200 Methane / Non-Methane / THC Analyzer",
    "Model 200/1 Methane / Non-Methane (NMHC) Hydrocarbon Analyzer",
    "Model 200T Methane / Non-Methane / THC Analyzer",
    "Model 210 Methane / Ethane / Non-Methane-Ethane (NMEHC) / THC Analyzer"
  ],
  "Components Purchase": [
    "PTFE Isolated Burner (FID)",
    "Custom Electronics",
    "Custom Heated Sample Pumps",
    "Dual-Stage Stainless Steel Sample Filter",
    "Digital / Graphical Display",
    "PTFE and Stainless Steel Tubing",
    "Stainless Steel Solenoid Valves",
    "Heated Oven",
    "Column"
  ]
};

const productLabelsByRequestType = {
  "Product Purchase": "Product",
  "Rental": "Rental Product",
  "Components Purchase": "Component"
};

function getSelectedQuoteRequests() {
  return Array.from(document.querySelectorAll(".quote-request-options input:checked"))
    .map(input => input.value);
}

function getProductOptionsMarkup(quoteRequest) {
  const options = productOptionsByRequestType[quoteRequest] || [];

  return [
    `<option value="" disabled selected>Select a ${productLabelsByRequestType[quoteRequest].toLowerCase()}</option>`,
    ...options.map(option => `<option>${option}</option>`)
  ].join("");
}

function getProductRowMarkup(quoteRequest, isAdditional = false) {
  const label = productLabelsByRequestType[quoteRequest];
  const amountLabel = quoteRequest === "Rental" ? "Week" : "Quantity";
  const minAmount = "1";
  const productName = isAdditional ? `Additional ${label}` : label;
  const quantityName = isAdditional ? `Additional ${label} ${amountLabel}` : `${label} ${amountLabel}`;
  const labelStart = `<label aria-label="${productName}">`;
  const amountClass = isAdditional ? "amount-label has-remove" : "amount-label";
  const removeButton = isAdditional
    ? '<button type="button" class="remove-item-btn" onclick="removeProductRow(this)" aria-label="Remove item" title="Remove item">&#128465;&#65039;</button>'
    : "";

  return `
    <div class="product-row">
      ${labelStart}
        <select class="product-select" name="${productName}" required>
          ${getProductOptionsMarkup(quoteRequest)}
        </select>
      </label>

      <div class="${amountClass}" aria-label="${quantityName}">
        <input type="number" name="${quantityName}" min="${minAmount}" step="1" value="${minAmount}" inputmode="numeric" oninput="enforceIntegerInput(this)">
        ${removeButton}
      </div>
    </div>
  `;
}

function renderProductSections() {
  const productList = document.getElementById("productList");

  if (!productList) {
    return;
  }

  const quoteRequests = getSelectedQuoteRequests()
    .filter(quoteRequest => productOptionsByRequestType[quoteRequest]);

  productList.innerHTML = quoteRequests.map(quoteRequest => {
    const label = productLabelsByRequestType[quoteRequest];
    const amountLabel = quoteRequest === "Rental" ? "Week" : "Quantity";

    return `
      <div class="product-choice-section" data-quote-request="${quoteRequest}">
        <div class="product-choice-header">
          <h3>${label}</h3>
          <span>${amountLabel}</span>
        </div>
        ${getProductRowMarkup(quoteRequest)}
        <button type="button" class="add-btn" onclick="addProduct('${quoteRequest}')">+ Add Another ${label}</button>
      </div>
    `;
  }).join("");
}

function handleQuoteRequestChange() {
  const quoteRequests = getSelectedQuoteRequests();
  const quoteRequestValue = document.getElementById("quoteRequestValue");
  const otherField = document.getElementById("otherQuoteRequestField");

  if (quoteRequestValue) {
    quoteRequestValue.value = quoteRequests.join(", ");
  }

  if (otherField) {
    otherField.classList.toggle("active", quoteRequests.includes("Other"));
  }

  renderProductSections();
}

function validateQuoteRequest() {
  if (getSelectedQuoteRequests().length) {
    return true;
  }

  alert("Please select at least one quote request.");
  return false;
}

function addProduct(quoteRequest) {
  const section = document.querySelector(
    `.product-choice-section[data-quote-request="${quoteRequest}"]`
  );

  if (!section) {
    return;
  }

  const addButton = section.querySelector(".add-btn");
  addButton.insertAdjacentHTML("beforebegin", getProductRowMarkup(quoteRequest, true));
}

function removeProductRow(button) {
  const row = button.closest(".product-row");

  if (row) {
    row.remove();
  }
}

function enforceIntegerInput(input) {
  if (input.value === "") {
    return;
  }

  const min = Number(input.min || 1);
  const value = Math.floor(Number(input.value));

  input.value = Number.isFinite(value) ? Math.max(value, min) : min;
}

handleQuoteRequestChange();

