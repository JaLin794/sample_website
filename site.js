const productOptionsByRequestType = {
  "Service": [
    "Calibration",
    "Maintenance",
    "Repair"
  ],
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
  ],
  "Peripheral Purchase": [
    "Combustion Air Generators / Zero Air Generators",
    "Dilution Systems",
    "Heated Multipoint Sequencers",
    "Chart Recorders / Data Loggers",
    "Liquid / Gas Separators",
    "Temperature Controllers and Heated Sample Lines"
  ]
};

const productLabelsByRequestType = {
  "Service": "Service Option",
  "Product Purchase": "Product",
  "Rental": "Rental Product",
  "Components Purchase": "Component",
  "Peripheral Purchase": "Peripheral"
};

const itemTypeLabelsByRequestType = {
  "Service": "Service",
  "Product Purchase": "Product",
  "Rental": "Rental",
  "Components Purchase": "Component",
  "Peripheral Purchase": "Peripheral"
};

const supportAnalyzerOptions = [
  "Model 10",
  "Model 10/2",
  "Model 20",
  "Model 20/2",
  "Model 200",
  "Model 200/1",
  "Model 200T",
  "Model 210"
];

const quoteCartStorageKey = "vigQuoteCart";
const selectedQuoteRequestsStorageKey = "vigSelectedQuoteRequests";
const quoteCartCountRequestTypes = [
  "Product Purchase",
  "Components Purchase",
  "Peripheral Purchase",
  "Rental"
];
let productRowId = 0;
let isLoadingStoredQuoteCart = false;
let hasLoadedStoredQuoteCart = false;

const model10Options = [
  "Automatic calibration",
  "Zero and calibration solenoids with software",
  "RS-232 interface",
  "Second concentration level alarm",
  "Internal combustion air supply",
  "Purge and internal cleaning system",
  "Dilution system",
  "User selectable fuel (H2 or H2/He mixture)",
  "Range recognition relays",
  "Multi-point sequencer",
  "Sample shut-off"
];

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
  productRowId += 1;
  const label = productLabelsByRequestType[quoteRequest];
  const amountLabel = quoteRequest === "Rental" ? "Weeks" : "Quantity";
  const minAmount = "1";
  const productName = isAdditional ? `Additional ${label}` : label;
  const quantityName = isAdditional ? `Additional ${label} ${amountLabel}` : `${label} ${amountLabel}`;
  const labelStart = `<label aria-label="${productName}">`;

  return `
    <div class="product-row" data-additional="${isAdditional}">
      ${labelStart}
        <select class="product-select" name="${productName}" required onchange="handleProductSelectionChange(this)">
          ${getProductOptionsMarkup(quoteRequest)}
        </select>
      </label>

      <div class="amount-label has-remove" aria-label="${quantityName}">
        <input type="number" name="${quantityName}" min="${minAmount}" step="1" value="${minAmount}" inputmode="numeric" oninput="enforceIntegerInput(this)">
        <button type="button" class="remove-item-btn" onclick="removeProductRow(this)" aria-label="Clear item" title="Clear item">&#128465;&#65039;</button>
      </div>
      ${quoteRequest === "Product Purchase" ? getModelOptionsMarkup(productName, productRowId) : ""}
    </div>
  `;
}

function getModelOptionsMarkup(productName, rowId) {
  const configurationTypeName = `${productName} Configuration Type ${rowId}`;

  return `
    <div class="model-options-section" style="display: none;">
      <div class="model-configuration-list">
        <label>
          <input type="radio" name="${configurationTypeName}" value="standard" checked onchange="handleModelConfigurationChange(this)">
          Standard
        </label>
        <label>
          <input type="radio" name="${configurationTypeName}" value="custom" onchange="handleModelConfigurationChange(this)">
          Custom
        </label>
        <label>
          <input type="checkbox" class="trade-in-option" name="${productName} Trade-In" value="trade-in" onchange="handleModelConfigurationChange(this)">
          Trade-In
        </label>
      </div>
      <div class="custom-model-options">
        <div class="model-options-list">
          ${model10Options.map(option => `
            <label>
              <input type="checkbox" name="${productName} Options" value="${option}" onchange="updateModelOptionsConfiguration(this)">
              ${option}
            </label>
          `).join("")}
        </div>
      </div>
      <input type="hidden" class="model-options-configuration" name="${productName} Configuration" value="Model 10 - Standard">
    </div>
  `;
}

function getStoredQuoteCart() {
  try {
    return JSON.parse(localStorage.getItem(quoteCartStorageKey)) || [];
  } catch {
    return [];
  }
}

function saveStoredQuoteCart(cart) {
  localStorage.setItem(quoteCartStorageKey, JSON.stringify(cart));
  updateQuoteCartBadge();
}

function getStoredSelectedQuoteRequests() {
  try {
    const storedRequests = JSON.parse(localStorage.getItem(selectedQuoteRequestsStorageKey)) || [];
    return Array.isArray(storedRequests) ? storedRequests : [];
  } catch {
    return [];
  }
}

function saveSelectedQuoteRequests(quoteRequests) {
  localStorage.setItem(selectedQuoteRequestsStorageKey, JSON.stringify(quoteRequests));
}

function clearStoredQuoteRequestState() {
  localStorage.removeItem(quoteCartStorageKey);
  localStorage.removeItem(selectedQuoteRequestsStorageKey);
  updateQuoteCartBadge();
}

function getRenderedQuoteCart() {
  const productList = document.getElementById("productList");

  if (!productList) {
    return getStoredQuoteCart();
  }

  return Array.from(productList.querySelectorAll(".product-choice-section")).flatMap(section => {
    const quoteRequest = section.dataset.quoteRequest;

    if (!productOptionsByRequestType[quoteRequest]) {
      return [];
    }

    return Array.from(section.querySelectorAll(".product-row")).map(row => {
      const select = row.querySelector(".product-select");
      const amountInput = row.querySelector('input[type="number"]');

      if (!select || !select.value) {
        return null;
      }

      const isModel10 = select.value === "Model 10";
      const selectedModel10Configuration = row.querySelector(".model-options-section .model-configuration-list input[type='radio']:checked")?.value || "standard";
      const includesTradeIn = Boolean(row.querySelector(".model-options-section .trade-in-option:checked"));
      const options = isModel10 && selectedModel10Configuration === "custom"
        ? Array.from(row.querySelectorAll(".model-options-section .model-options-list input[type='checkbox']:checked")).map(input => input.value)
        : [];
      const amount = Number(amountInput && amountInput.value ? amountInput.value : 1);

      return {
        amount: Number.isFinite(amount) ? Math.max(amount, 1) : 1,
        configurationType: isModel10 ? `${selectedModel10Configuration}${includesTradeIn ? "+trade-in" : ""}` : "",
        itemName: select.value,
        options,
        quoteRequest
      };
    }).filter(Boolean);
  });
}

function saveRenderedQuoteCart() {
  if (isLoadingStoredQuoteCart || !hasLoadedStoredQuoteCart || !document.getElementById("productList")) {
    updateQuoteCartBadge();
    return;
  }

  saveStoredQuoteCart(getRenderedQuoteCart());
}

function getQuoteCartItemCount() {
  const renderedCount = getRenderedQuoteItemCount();

  if (renderedCount !== null) {
    return renderedCount;
  }

  return getStoredQuoteCart().reduce((total, item) => {
    if (!quoteCartCountRequestTypes.includes(item.quoteRequest)) {
      return total;
    }

    return total + Number(item.amount || 1);
  }, 0);
}

function getRenderedQuoteItemCount() {
  const productList = document.getElementById("productList");

  if (!productList) {
    return null;
  }

  return Array.from(productList.querySelectorAll(".product-choice-section")).reduce((total, section) => {
    if (!quoteCartCountRequestTypes.includes(section.dataset.quoteRequest)) {
      return total;
    }

    const sectionTotal = Array.from(section.querySelectorAll(".product-row")).reduce((rowTotal, row) => {
      const select = row.querySelector(".product-select");
      const amountInput = row.querySelector('input[type="number"]');

      if (!select || !select.value) {
        return rowTotal;
      }

      return rowTotal + Number(amountInput && amountInput.value ? amountInput.value : 1);
    }, 0);

    return total + sectionTotal;
  }, 0);
}

function updateQuoteCartBadge() {
  const count = getQuoteCartItemCount();

  document.querySelectorAll(".quote-cart-badge").forEach(badge => {
    badge.textContent = count ? String(count) : "";
    badge.classList.toggle("active", count > 0);
    badge.setAttribute("aria-label", count ? `${count} quote cart item${count === 1 ? "" : "s"}` : "Quote cart is empty");
  });
}

function addItemToQuote(quoteRequest, itemName, selectedOptions = [], configurationType = "") {
  const cart = getStoredQuoteCart();
  const existingItem = cart.find(item =>
    item.quoteRequest === quoteRequest &&
    item.itemName === itemName &&
    JSON.stringify(item.options || []) === JSON.stringify(selectedOptions) &&
    (item.configurationType || "") === configurationType
  );

  if (existingItem) {
    existingItem.amount = Number(existingItem.amount || 1) + 1;
  } else {
    cart.push({
      amount: 1,
      configurationType,
      itemName,
      options: selectedOptions,
      quoteRequest
    });
  }

  saveStoredQuoteCart(cart);
}

function addModel10ToQuote() {
  const isCustom = document.querySelector('input[name="model10Configuration"]:checked')?.value === "custom";
  const selectedOptions = Array.from(
    document.querySelectorAll(".product-options-panel .custom-model-options input:checked")
  ).map(input => input.value);

  addItemToQuote("Product Purchase", "Model 10", isCustom ? selectedOptions : [], isCustom ? "custom" : "standard");
  showAddToQuoteConfirmation();
}

function addComponentToQuote(componentName, button) {
  addItemToQuote("Components Purchase", componentName);
  showAddToQuoteConfirmation(button);
}

function addPeripheralToQuote(peripheralName, button) {
  addItemToQuote("Peripheral Purchase", peripheralName);
  showAddToQuoteConfirmation(button);
}

function addServiceToQuote(serviceName, button) {
  addItemToQuote("Service", serviceName);
  showAddToQuoteConfirmation(button);
}

function addSupportToQuote(supportName, button) {
  addItemToQuote("Technical Support", supportName);
  showAddToQuoteConfirmation(button);
}

function showAddToQuoteConfirmation(source) {
  const container = source ? source.closest(".card, .product-quote-actions") : document;
  const message = container ? container.querySelector(".quote-confirmation") : null;

  if (!message) {
    return;
  }

  message.textContent = "Added to quote";
  message.classList.add("active");

  window.clearTimeout(showAddToQuoteConfirmation.timeoutId);
  showAddToQuoteConfirmation.timeoutId = window.setTimeout(() => {
    message.classList.remove("active");
    message.textContent = "";
  }, 2200);
}

function toggleModel10ProductOptions() {
  const isCustom = document.querySelector('input[name="model10Configuration"]:checked')?.value === "custom";
  const panel = document.querySelector(".product-options-panel");
  const customOptions = panel ? panel.querySelector(".custom-model-options") : null;

  if (customOptions) {
    customOptions.classList.toggle("active", Boolean(isCustom));
  }

  if (!isCustom && panel) {
    panel.querySelectorAll(".custom-model-options input[type='checkbox']").forEach(input => {
      input.checked = false;
    });
  }
}

function setProductRowValues(row, item) {
  const select = row.querySelector(".product-select");
  const amountInput = row.querySelector('input[type="number"]');

  if (select) {
    if (item.itemName === "Model 10 - Standard" || item.itemName === "Model 10 - Custom") {
      select.value = "Model 10";
    } else {
      select.value = item.itemName;
    }
    handleProductSelectionChange(select);
  }

  if (amountInput) {
    amountInput.value = item.amount || 1;
  }

  if (
    item.itemName === "Model 10 - Custom" ||
    (item.configurationType || "").includes("custom") ||
    (item.configurationType || "").includes("trade-in") ||
    (item.itemName === "Model 10" && item.options && item.options.length)
  ) {
    const itemOptions = item.options || [];
    const hasTradeIn = (item.configurationType || "").includes("trade-in");
    const configurationValue = (item.configurationType || "").includes("custom") || itemOptions.length ? "custom" : "standard";
    const customInput = row.querySelector(`.model-options-section input[type="radio"][value="${configurationValue}"]`);
    const tradeInInput = row.querySelector(".model-options-section .trade-in-option");

    if (customInput) {
      customInput.checked = true;
      handleModelConfigurationChange(customInput);
    }

    if (tradeInInput) {
      tradeInInput.checked = hasTradeIn;
    }

    row.querySelectorAll(".model-options-section .model-options-list input[type='checkbox']").forEach(input => {
      input.checked = itemOptions.includes(input.value);
    });

    const firstOption = row.querySelector(".model-options-section input[type='checkbox']");
    if (firstOption) {
      updateModelOptionsConfiguration(firstOption);
    } else {
      updateModelOptionsConfiguration(row.querySelector(".model-options-section"));
    }
  }
}

function loadStoredQuoteCart() {
  const cart = getStoredQuoteCart().filter(item =>
    productOptionsByRequestType[item.quoteRequest]
  );

  if (!cart.length || !document.getElementById("productList")) {
    hasLoadedStoredQuoteCart = true;
    return;
  }

  isLoadingStoredQuoteCart = true;
  const quoteRequests = [...new Set(cart.map(item => item.quoteRequest))];

  document.querySelectorAll(".quote-request-options input").forEach(input => {
    input.checked = input.checked || quoteRequests.includes(input.value);
  });

  handleQuoteRequestChange();

  quoteRequests.forEach(quoteRequest => {
    const section = document.querySelector(
      `.product-choice-section[data-quote-request="${quoteRequest}"]`
    );

    if (!section) {
      return;
    }

    const items = cart.filter(item => item.quoteRequest === quoteRequest);
    const firstRow = section.querySelector(".product-row");

    if (firstRow && items[0]) {
      setProductRowValues(firstRow, items[0]);
    }

    items.slice(1).forEach(item => {
      const addButton = section.querySelector(".add-btn");
      addButton.insertAdjacentHTML("beforebegin", getProductRowMarkup(quoteRequest, true));
      const rows = section.querySelectorAll(".product-row");
      setProductRowValues(rows[rows.length - 1], item);
    });
  });

  isLoadingStoredQuoteCart = false;
  hasLoadedStoredQuoteCart = true;
  updateQuoteCartBadge();
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
    const amountLabel = quoteRequest === "Rental" ? "Weeks" : "Quantity";

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

function restoreProductSectionsFromItems(items) {
  if (!items.length) {
    return;
  }

  const itemsByRequest = items.reduce((groupedItems, item) => {
    if (!groupedItems[item.quoteRequest]) {
      groupedItems[item.quoteRequest] = [];
    }

    groupedItems[item.quoteRequest].push(item);
    return groupedItems;
  }, {});

  Object.keys(itemsByRequest).forEach(quoteRequest => {
    const section = document.querySelector(
      `.product-choice-section[data-quote-request="${quoteRequest}"]`
    );

    if (!section) {
      return;
    }

    const itemsForRequest = itemsByRequest[quoteRequest];
    const firstRow = section.querySelector(".product-row");

    if (firstRow && itemsForRequest[0]) {
      setProductRowValues(firstRow, itemsForRequest[0]);
    }

    itemsForRequest.slice(1).forEach(item => {
      const addButton = section.querySelector(".add-btn");

      if (!addButton) {
        return;
      }

      addButton.insertAdjacentHTML("beforebegin", getProductRowMarkup(quoteRequest, true));
      const rows = section.querySelectorAll(".product-row");
      setProductRowValues(rows[rows.length - 1], item);
    });
  });
}

function renderSupportAnalyzerSection(selectedModel = "") {
  const supportAnalyzerList = document.getElementById("supportAnalyzerList");

  if (!supportAnalyzerList) {
    return;
  }

  const isTechnicalSupport = getSelectedQuoteRequests().includes("Technical Support");

  supportAnalyzerList.innerHTML = isTechnicalSupport
    ? `
      <div class="support-analyzer-section">
        <label>
          Technical Support Analyzer Model
          <select class="support-analyzer-select" name="Technical Support Analyzer Model">
            <option value="" disabled${selectedModel ? "" : " selected"}>Select an analyzer model</option>
          ${supportAnalyzerOptions.map(option => `
            <option value="${option}"${selectedModel === option ? " selected" : ""}>${option}</option>
          `).join("")}
          </select>
        </label>
      </div>
    `
    : "";
}

function handleQuoteRequestChange() {
  const quoteRequestOptions = document.querySelector(".quote-request-options");
  const quoteRequests = getSelectedQuoteRequests();
  const quoteRequestValue = document.getElementById("quoteRequestValue");
  const otherField = document.getElementById("otherQuoteRequestField");
  const selectedSupportAnalyzer = document.querySelector(".support-analyzer-select")?.value || "";
  const currentProductItems = getRenderedQuoteCart();

  if (quoteRequestValue) {
    quoteRequestValue.value = quoteRequests.join(", ");
  }

  if (otherField) {
    const isOtherSelected = quoteRequests.includes("Other");
    const otherInput = otherField.querySelector("input");

    otherField.classList.toggle("active", isOtherSelected);

    if (otherInput) {
      otherInput.disabled = !isOtherSelected;

      if (!isOtherSelected) {
        otherInput.value = "";
      }
    }
  }

  renderProductSections();
  restoreProductSectionsFromItems(currentProductItems);
  renderSupportAnalyzerSection(selectedSupportAnalyzer);
  if (quoteRequestOptions) {
    saveSelectedQuoteRequests(quoteRequests);
  }
  saveRenderedQuoteCart();
}

function applyRequestFromUrl() {
  if (!document.querySelector(".quote-request-options")) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const requestedType = params.get("request");
  const supportModel = params.get("supportModel");

  if (requestedType) {
    document.querySelectorAll(".quote-request-options input").forEach(input => {
      if (input.value === requestedType) {
        input.checked = true;
      }
    });
  }

  if (supportModel) {
    const matchingModel = document.querySelector(".support-analyzer-select");

    if (matchingModel && supportAnalyzerOptions.includes(supportModel)) {
      matchingModel.value = supportModel;
    }
  }
}

function loadStoredSelectedQuoteRequests() {
  const storedRequests = getStoredSelectedQuoteRequests();

  if (!storedRequests.length) {
    return;
  }

  document.querySelectorAll(".quote-request-options input").forEach(input => {
    input.checked = input.checked || storedRequests.includes(input.value);
  });
}

function syncRequestFieldsWithoutRenderingProducts() {
  const quoteRequests = getSelectedQuoteRequests();
  const quoteRequestValue = document.getElementById("quoteRequestValue");
  const otherField = document.getElementById("otherQuoteRequestField");

  if (quoteRequestValue) {
    quoteRequestValue.value = quoteRequests.join(", ");
  }

  if (otherField) {
    const isOtherSelected = quoteRequests.includes("Other");
    const otherInput = otherField.querySelector("input");

    otherField.classList.toggle("active", isOtherSelected);

    if (otherInput) {
      otherInput.disabled = !isOtherSelected;

      if (!isOtherSelected) {
        otherInput.value = "";
      }
    }
  }

  renderSupportAnalyzerSection(document.querySelector(".support-analyzer-select")?.value || "");
  saveSelectedQuoteRequests(quoteRequests);
}

function ensureSelectedProductSectionsRendered() {
  const productList = document.getElementById("productList");

  if (!productList) {
    return;
  }

  const selectedProductRequests = getSelectedQuoteRequests()
    .filter(quoteRequest => productOptionsByRequestType[quoteRequest]);
  const renderedProductRequests = Array.from(productList.querySelectorAll(".product-choice-section"))
    .map(section => section.dataset.quoteRequest);
  const hasMissingProductSection = selectedProductRequests.some(quoteRequest =>
    !renderedProductRequests.includes(quoteRequest)
  );

  if (hasMissingProductSection || (!selectedProductRequests.length && productList.children.length)) {
    handleQuoteRequestChange();
  }
}

function handleProductSelectionChange(select) {
  const row = select.closest(".product-row");
  const optionsSection = row ? row.querySelector(".model-options-section") : null;

  if (!optionsSection) {
    return;
  }

  const isModel10 = select.value === "Model 10";
  optionsSection.style.display = isModel10 ? "block" : "none";

  if (!isModel10) {
    optionsSection.querySelectorAll("input[type='checkbox']").forEach(input => {
      input.checked = false;
    });
    const standardInput = optionsSection.querySelector('input[value="standard"]');

    if (standardInput) {
      standardInput.checked = true;
    }
  }

  updateModelOptionsConfiguration(optionsSection);
}

function handleModelConfigurationChange(input) {
  updateModelOptionsConfiguration(input);
}

function updateModelOptionsConfiguration(source) {
  const section = source.closest ? source.closest(".model-options-section") : source;

  if (!section) {
    return;
  }

  const selectedOptions = Array.from(section.querySelectorAll(".model-options-list input[type='checkbox']:checked"))
    .map(input => input.value);
  const isCustom = section.querySelector('input[value="custom"]:checked');
  const isTradeIn = section.querySelector(".trade-in-option:checked");
  const customOptions = section.querySelector(".custom-model-options");
  const configuration = section.querySelector(".model-options-configuration");
  const baseValue = isCustom
    ? selectedOptions.length
      ? `Model 10 - Custom with options: ${selectedOptions.join(", ")}`
      : "Model 10 - Custom"
    : "Model 10 - Standard";
  const value = isTradeIn ? `${baseValue} + Trade-In` : baseValue;

  if (customOptions) {
    customOptions.classList.toggle("active", Boolean(isCustom));
  }

  if (!isCustom) {
    section.querySelectorAll(".model-options-list input[type='checkbox']").forEach(input => {
      input.checked = false;
    });
  }

  if (configuration) {
    configuration.value = value;
  }
}

function validateQuoteRequest() {
  if (getSelectedQuoteRequests().length) {
    return true;
  }

  alert("Please select at least one request.");
  return false;
}

function removePreparedQuoteFields(form) {
  form.querySelectorAll(".prepared-quote-field").forEach(field => {
    field.remove();
  });
}

function addPreparedQuoteField(form, name, value) {
  const input = document.createElement("input");

  input.type = "hidden";
  input.name = name;
  input.value = value || "";
  input.className = "prepared-quote-field";
  form.appendChild(input);
}

function getFormFieldValue(form, selector) {
  return form.querySelector(selector)?.value.trim() || "";
}

function addMessageLine(lines, label, value) {
  lines.push(`${label}: ${value || ""}`);
}

function getRequestDateValue() {
  const requestDate = new Date();
  const year = requestDate.getFullYear();
  const month = String(requestDate.getMonth() + 1).padStart(2, "0");
  const day = String(requestDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getProductRowConfiguration(row) {
  const optionsSection = row.querySelector(".model-options-section");
  const select = row.querySelector(".product-select");

  if (!optionsSection || !select || select.value !== "Model 10") {
    return "";
  }

  const configurationType = optionsSection.querySelector(".model-configuration-list input[type='radio']:checked")?.value || "standard";
  const includesTradeIn = Boolean(optionsSection.querySelector(".trade-in-option:checked"));
  const label = configurationType === "custom" ? "Custom" : "Standard";

  return includesTradeIn ? `${label} + Trade-In` : label;
}

function getProductRowOptions(row) {
  const select = row.querySelector(".product-select");

  if (!select || select.value !== "Model 10") {
    return "";
  }

  const isCustom = row.querySelector(".model-options-section .model-configuration-list input[value='custom']:checked");

  if (!isCustom) {
    return "";
  }

  return Array.from(row.querySelectorAll(".model-options-section .model-options-list input[type='checkbox']:checked"))
    .map(input => input.value)
    .join(", ");
}

function prepareQuoteSubmission(form) {
  removePreparedQuoteFields(form);

  const rows = Array.from(document.querySelectorAll("#productList .product-choice-section .product-row"));
  const messageLines = [];
  let itemIndex = 0;

  addMessageLine(messageLines, "Request Date", getRequestDateValue());
  addMessageLine(messageLines, "Customer Name", getFormFieldValue(form, 'input[name="Customer Name"]'));
  addMessageLine(messageLines, "Company", getFormFieldValue(form, 'input[name="Company"]'));
  addMessageLine(messageLines, "Address", getFormFieldValue(form, 'input[name="Shipping Address"]'));
  addMessageLine(messageLines, "Email", getFormFieldValue(form, 'input[name="Email"]'));
  addMessageLine(messageLines, "Phone", getFormFieldValue(form, 'input[name="Phone"]'));
  addMessageLine(messageLines, "Request", getFormFieldValue(form, 'input[name="Request"]'));

  const otherRequest = getFormFieldValue(form, 'input[name="Other Request"]:not(:disabled)');
  const supportAnalyzer = getFormFieldValue(form, 'select[name="Technical Support Analyzer Model"]');

  if (otherRequest) {
    addMessageLine(messageLines, "Other Request", otherRequest);
  }

  if (supportAnalyzer) {
    addMessageLine(messageLines, "Technical Support Analyzer Model", supportAnalyzer);
  }

  addMessageLine(messageLines, "Comments", getFormFieldValue(form, 'textarea[name="Comments"]'));

  rows.forEach(row => {
    const section = row.closest(".product-choice-section");
    const quoteRequest = section ? section.dataset.quoteRequest : "";
    const select = row.querySelector(".product-select");
    const amountInput = row.querySelector('input[type="number"]');

    if (!select || !select.value) {
      return;
    }

    itemIndex += 1;
    messageLines.push("");
    addMessageLine(messageLines, `Item ${itemIndex} Type`, itemTypeLabelsByRequestType[quoteRequest] || quoteRequest);
    addMessageLine(messageLines, `Item ${itemIndex} Name`, select.value);
    addMessageLine(messageLines, `Item ${itemIndex} Configuration`, getProductRowConfiguration(row));
    addMessageLine(messageLines, `Item ${itemIndex} Qty`, amountInput && amountInput.value ? amountInput.value : "1");
    addMessageLine(messageLines, `Item ${itemIndex} Options`, getProductRowOptions(row));
  });

  if (itemIndex) {
    messageLines.push("");
    addMessageLine(messageLines, "Item Count", String(itemIndex));
  }

  addPreparedQuoteField(form, "message", messageLines.join("\n"));

  form.querySelectorAll("input[name], select[name], textarea[name]").forEach(field => {
    const isSystemField = ["access_key", "subject"].includes(field.name);
    const isPreparedField = field.classList.contains("prepared-quote-field");

    if (!isSystemField && !isPreparedField) {
      field.disabled = true;
    }
  });
}

function resetQuoteRequestForm(form) {
  if (!form) {
    return;
  }

  form.reset();
  productRowId = 0;
  hasLoadedStoredQuoteCart = true;
  renderProductSections();
  renderSupportAnalyzerSection();
  syncRequestFieldsWithoutRenderingProducts();
  updateQuoteCartBadge();
}

function handleQuoteFormSubmit(form) {
  if (!validateQuoteRequest()) {
    return false;
  }

  prepareQuoteSubmission(form);
  sessionStorage.setItem("vigQuoteSubmitted", "true");
  clearStoredQuoteRequestState();
  return true;
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

  if (!row) {
    return;
  }

  const section = row.closest(".product-choice-section");
  const rows = section ? section.querySelectorAll(".product-row") : [];

  if (rows.length <= 1) {
    resetProductRow(row);
  } else {
    row.remove();
  }

  saveRenderedQuoteCart();
}

function resetProductRow(row) {
  const select = row.querySelector(".product-select");
  const amountInput = row.querySelector('input[type="number"]');
  const optionsSection = row.querySelector(".model-options-section");

  if (select) {
    select.value = "";
  }

  if (amountInput) {
    amountInput.value = amountInput.min || 1;
  }

  if (optionsSection) {
    optionsSection.style.display = "none";
    optionsSection.querySelectorAll("input[type='checkbox']").forEach(input => {
      input.checked = false;
    });

    const standardInput = optionsSection.querySelector('input[value="standard"]');

    if (standardInput) {
      standardInput.checked = true;
    }

    updateModelOptionsConfiguration(optionsSection);
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

function getProductGroups() {
  return Array.from(document.querySelectorAll(".product-group"));
}

function filterProducts() {
  const search = document.getElementById("productSearch");

  if (!search) {
    return;
  }

  const query = search.value.trim().toLowerCase();

  getProductGroups().forEach(group => {
    const cards = Array.from(group.querySelectorAll(".product, .card"));
    const matchingCards = cards.filter(card => {
      const isMatch = !query || card.textContent.toLowerCase().includes(query);
      card.classList.toggle("product-filter-hidden", !isMatch);
      return isMatch;
    });

    group.classList.toggle("product-filter-hidden", query && !matchingCards.length);
  });

  updateProductNavState();
}

function updateProductNavState() {
  const navLinks = Array.from(document.querySelectorAll("[data-product-nav]"));

  if (!navLinks.length) {
    return;
  }

  const targets = [...new Set(navLinks.map(link => link.dataset.productNav))]
    .map(id => document.getElementById(id))
    .filter(Boolean);
  const activationLine = 150;
  const activeTarget = targets.reduce((current, target) => {
    const targetTop = target.getBoundingClientRect().top;

    if (targetTop <= activationLine) {
      return target;
    }

    return current;
  }, targets[0]);

  navLinks.forEach(link => {
    link.classList.toggle("active", link.dataset.productNav === activeTarget.id);
  });
}

function initializeProductControls() {
  const search = document.getElementById("productSearch");

  if (search) {
    search.addEventListener("input", filterProducts);
  }

  if (document.querySelector("[data-product-nav]")) {
    window.addEventListener("scroll", updateProductNavState, { passive: true });
    window.addEventListener("resize", updateProductNavState);
    window.addEventListener("hashchange", updateProductNavState);
    updateProductNavState();
  }
}

loadStoredSelectedQuoteRequests();
applyRequestFromUrl();
loadStoredQuoteCart();
ensureSelectedProductSectionsRendered();
syncRequestFieldsWithoutRenderingProducts();
applyRequestFromUrl();
updateQuoteCartBadge();
initializeProductControls();

window.addEventListener("pageshow", () => {
  if (sessionStorage.getItem("vigQuoteSubmitted") !== "true") {
    return;
  }

  sessionStorage.removeItem("vigQuoteSubmitted");
  clearStoredQuoteRequestState();
  resetQuoteRequestForm(document.querySelector("#contact form"));
});

const productList = document.getElementById("productList");
const productOptionsPanel = document.querySelector(".product-options-panel");

if (productList) {
  productList.addEventListener("change", saveRenderedQuoteCart);
  productList.addEventListener("input", saveRenderedQuoteCart);
}

if (productOptionsPanel) {
  productOptionsPanel.addEventListener("change", toggleModel10ProductOptions);
  toggleModel10ProductOptions();
}

