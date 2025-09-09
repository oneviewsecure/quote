const quotationData = { customProducts: [] }
let pdfBase64 = null

// UI-only manual discount state (non-sync to quotationData)
let manualDiscountAmount = null // absolute INR amount
let manualDiscountEdited = false // true when admin manually edits the absolute amount

// Configuration object - Uses environment variable for API key
const CONFIG = {
  API_ENDPOINT: "/api/send-email",
  SENDER_EMAIL: "noreply@oneviewsecuretech.in",
  SENDER_NAME: "One View Secure Technologies - Quotation System",
  RECIPIENT_EMAIL: "sales@oneviewsecuretech.in",
  RECIPIENT_NAME: "One View Secure Technologies Sales",
}

// Brand discount configuration
const brandDiscounts = {
  Analog: {
    Hikvision: 0.15,
    Dahua: 0.2,
    CPPlus: 0.2,
    Prama: 0.25,
  },
  IP: {
    TPLink: 0.075,
    Hikvision: 0.075,
    Dahua: 0.1,
    CPPlus: 0.125,
    Prama: 0.15,
  },
  "Wi-Fi Camera": {
    Trueview: 0.05,
    Ezviz: 0.0,
    Tapo: 0.0,
  },
  "4G Sim Card Camera": {
    Trueview: 0.05,
    Ezviz: 0.0,
    Tapo: 0.0,
    Hikvision: 0.0,
  },
  "Solar Camera": {
    Trueview: 0.0,
  },
}

// Branch contact information
const BRANCHES = {
  Chennai: {
    name: "Chennai Branch",
    address: "2nd St, Mahalakshmi Nagar, Sigamani Nagar, Madipakkam, Chennai, Tamil Nadu 600091",
    phone: "+91-6381094691",
  },
  Tirupur: {
    name: "Tirupur Branch",
    address: "1/656, Venkateswaran Nagar, K.Chettipalayam, Dharapuram Road, Tirupur.",
    phone: "+91-6381094691",
  },
}

// 5% global markup
const GLOBAL_MARKUP_RATE = 0.05

function applyGlobalMarkup(amount) {
  return Number((amount * (1 + GLOBAL_MARKUP_RATE)).toFixed(2))
}

// Camera options configuration
const analogCameraOptions = [
  { name: "2MP Camera", price: 1650 },
  { name: "2MP Night Color Camera", price: 1950 },
  { name: "5MP Camera", price: 2450 },
  { name: "5MP Night Color Camera", price: 2650 },
]

const ipCameraOptions = [
  { name: "2MP IP Camera", price: 4300 },
  { name: "4MP IP Camera", price: 5400 },
]

const wifiCameraOptions = [
  {
    name: "Indoor Wi-Fi",
    totalPrice64: 5500,
    cameraPrice64: 3100,
    totalPrice128: 6100,
    cameraPrice128: 3100,
    brands: ["Trueview", "Ezviz", "Tapo"],
  },
  {
    name: "Outdoor Wi-Fi",
    totalPrice64: 6500,
    cameraPrice64: 4100,
    totalPrice128: 7100,
    cameraPrice128: 4100,
    brands: ["Trueview", "Ezviz", "Tapo"],
  },
  {
    name: "Outdoor Linkage Wi-Fi",
    totalPrice64: 7500,
    cameraPrice64: 5100,
    totalPrice128: 8100,
    cameraPrice128: 5100,
    brands: ["Trueview"],
  },
]

const simCardCameraOptions = [
  {
    name: "Indoor 4G Sim Card",
    totalPrice64: 6500,
    cameraPrice64: 4100,
    totalPrice128: 7100,
    cameraPrice128: 4700,
    brands: ["Trueview", "Ezviz", "Tapo"],
  },
  {
    name: "Outdoor 4G Sim Card",
    totalPrice64: 6500,
    cameraPrice64: 5600,
    totalPrice128: 7100,
    cameraPrice128: 5600,
    brands: ["Trueview", "Ezviz", "Tapo"],
  },
  {
    name: "Hikvision Outdoor 4G Sim Card",
    totalPrice64: 8400,
    cameraPrice64: 7500,
    totalPrice128: 9000,
    cameraPrice128: 7500,
    brands: ["Hikvision"],
  },
  {
    name: "Outdoor Linkage 4G Sim Card",
    totalPrice64: 9000,
    cameraPrice64: 6600,
    totalPrice128: 9600,
    cameraPrice128: 7200,
    brands: ["Trueview"],
  },
]

const solarCameraOptions = [
  {
    name: "Outdoor Solar",
    totalPrice64: 12500,
    cameraPrice64: 10100,
    totalPrice128: 13100,
    cameraPrice128: 10700,
    brands: ["Trueview"],
  },
]

// Device options configuration
const dvrOptions = [
  { name: "4CH DVR", channels: 4, supports: ["2MP"], cost: 3900 },
  { name: "8CH DVR", channels: 8, supports: ["2MP"], cost: 4900 },
  { name: "16CH DVR", channels: 16, supports: ["2MP"], cost: 9800 },
  { name: "5MP Supported 4CH DVR", channels: 4, supports: ["2MP", "5MP"], cost: 5900 },
  { name: "5MP Supported 8CH DVR", channels: 8, supports: ["2MP", "5MP"], cost: 6900 },
  { name: "5MP Supported 16CH DVR", channels: 16, supports: ["2MP", "5MP"], cost: 13500 },
  { name: "5MP Real 4CH DVR", channels: 4, supports: ["2MP", "5MP", "8MP"], cost: 7900 },
  { name: "5MP Real 8CH DVR", channels: 8, supports: ["2MP", "5MP", "8MP"], cost: 12500 },
  { name: "5MP Real 16CH DVR", channels: 16, supports: ["2MP", "5MP", "8MP"], cost: 19500 },
]

const nvrOptions = [
  { name: "4CH NVR", channels: 4, cost: 8400 },
  { name: "8CH NVR", channels: 8, cost: 9400 },
  { name: "16CH NVR", channels: 16, cost: 14500 },
]

const smpsOptions = [
  { name: "Fyber 4CH SMPS", channels: 4, cost: 900 },
  { name: "Fyber 8CH SMPS", channels: 8, cost: 1200 },
  { name: "Fyber 16CH SMPS", channels: 16, cost: 1800 },
]

const poeOptions = [
  { name: "4 Port POE Switch", channels: 4, cost: 4900 },
  { name: "8 Port POE Switch", channels: 8, cost: 6400 },
  { name: "16 Port POE Switch", channels: 16, cost: 12500 },
]

// Utility functions
function updateAvailableBrands(systemType) {
  const availableBrandsDiv = document.getElementById("availableBrands")
  const brandsListDiv = document.getElementById("brandsList")

  let brands = []

  switch (systemType) {
    case "Analog":
      brands = ["Hikvision", "Dahua", "CPPlus", "Prama"]
      break
    case "IP":
      brands = ["Hikvision", "Dahua", "CPPlus", "Prama", "TPLink"]
      break
    case "Wi-Fi Camera":
      brands = ["Trueview", "Ezviz", "Tapo"]
      break
    case "4G Sim Card Camera":
      brands = ["Trueview", "Ezviz", "Tapo", "Hikvision"]
      break
    case "Solar Camera":
      brands = ["Trueview"]
      break
  }

  // Clear previous brands
  brandsListDiv.innerHTML = ""

  // Add brand tags
  brands.forEach((brand) => {
    const brandTag = document.createElement("span")
    brandTag.className = "brand-tag"
    brandTag.textContent = brand
    brandsListDiv.appendChild(brandTag)
  })

  // Show the available brands section
  availableBrandsDiv.style.display = "block"
}

function updateCameraOptions() {
  const systemType = document.querySelector('input[name="systemType"]:checked').value
  const cameraTypeSelect = document.getElementById("cameraType")
  const brandSelect = document.getElementById("brand")
  const packageInfo = document.getElementById("packageInfo")
  const memoryCardSection = document.getElementById("memoryCardSection")
  const addonsSection = document.getElementById("addonsSection")
  const rackSection = document.getElementById("rackSection")

  cameraTypeSelect.innerHTML = ""
  brandSelect.innerHTML = ""

  let options = []
  let brands = []

  if (["Wi-Fi Camera", "4G Sim Card Camera", "Solar Camera"].includes(systemType)) {
    packageInfo.style.display = "block"
    memoryCardSection.style.display = "block"
    addonsSection.style.display = "none"
    rackSection.style.display = "none"
  } else {
    packageInfo.style.display = "none"
    memoryCardSection.style.display = "none"
    addonsSection.style.display = "block"
    rackSection.style.display = "block"
  }

  switch (systemType) {
    case "Analog":
      options = analogCameraOptions
      brands = ["Hikvision", "Dahua", "CPPlus", "Prama"]
      break
    case "IP":
      options = ipCameraOptions
      brands = ["Hikvision", "Dahua", "CPPlus", "Prama", "TPLink"]
      break
    case "Wi-Fi Camera":
      options = wifiCameraOptions
      brands = ["Trueview", "Ezviz", "Tapo"]
      break
    case "4G Sim Card Camera":
      options = simCardCameraOptions
      brands = ["Trueview", "Ezviz", "Tapo", "Hikvision"]
      break
    case "Solar Camera":
      options = solarCameraOptions
      brands = ["Trueview"]
      break
  }

  brands.forEach((brand) => {
    const el = document.createElement("option")
    el.value = brand
    el.textContent = brand
    brandSelect.appendChild(el)
  })

  if (brandDiscounts[systemType]) {
    let highestDiscountBrand = brands[0]
    let highestDiscount = 0

    brands.forEach((brand) => {
      const discount = brandDiscounts[systemType][brand] || 0
      if (discount > highestDiscount) {
        highestDiscount = discount
        highestDiscountBrand = brand
      }
    })

    brandSelect.value = highestDiscountBrand
  }

  options.forEach((option) => {
    const el = document.createElement("option")
    el.value = option.name

    if (option.totalPrice64) {
      el.dataset.totalPrice64 = option.totalPrice64
      el.dataset.cameraPrice64 = option.cameraPrice64
      el.dataset.totalPrice128 = option.totalPrice128
      el.dataset.cameraPrice128 = option.cameraPrice128
      el.dataset.brands = JSON.stringify(option.brands)
      el.textContent = `${option.name} (64GB: ₹${option.totalPrice64}, 128GB: ₹${option.totalPrice128})`
    } else {
      el.dataset.price = option.price
      el.textContent = `${option.name} (₹${option.price})`
    }

    cameraTypeSelect.appendChild(el)
  })

  // Update available brands display
  updateAvailableBrands(systemType)

  updateBrandOptionsForCamera()
  updateDiscountInfo()
}

function updateBrandOptionsForCamera() {
  const systemType = document.querySelector('input[name="systemType"]:checked').value
  const cameraTypeSelect = document.getElementById("cameraType")
  const brandSelect = document.getElementById("brand")

  if (["Wi-Fi Camera", "4G Sim Card Camera", "Solar Camera"].includes(systemType)) {
    const selectedOption = cameraTypeSelect.options[cameraTypeSelect.selectedIndex]
    if (selectedOption && selectedOption.dataset.brands) {
      const availableBrands = JSON.parse(selectedOption.dataset.brands)
      const currentBrand = brandSelect.value

      brandSelect.innerHTML = ""
      availableBrands.forEach((brand) => {
        const el = document.createElement("option")
        el.value = brand
        el.textContent = brand
        brandSelect.appendChild(el)
      })

      if (availableBrands.includes(currentBrand)) {
        brandSelect.value = currentBrand
      } else {
        brandSelect.value = availableBrands[0]
      }

      // Update available brands display for camera-specific brands
      const brandsListDiv = document.getElementById("brandsList")
      brandsListDiv.innerHTML = ""
      availableBrands.forEach((brand) => {
        const brandTag = document.createElement("span")
        brandTag.className = "brand-tag"
        brandTag.textContent = brand
        brandsListDiv.appendChild(brandTag)
      })
    }
  }

  updateDiscountInfo()
}

function updateDiscountInfo() {
  const systemType = document.querySelector('input[name="systemType"]:checked').value
  const brand = document.getElementById("brand").value

  if (brandDiscounts[systemType] && brandDiscounts[systemType][brand] !== undefined) {
    const discountRate = brandDiscounts[systemType][brand]
    document.getElementById("discountInfo").textContent =
      `Discount: ${(discountRate * 100).toFixed(1)}% (Applied to core items only)`
  } else {
    document.getElementById("discountInfo").textContent = ""
  }
}

function isPackageSystem(systemType) {
  return ["Wi-Fi Camera", "4G Sim Card Camera", "Solar Camera"].includes(systemType)
}

function getMemoryCardPrice() {
  const memoryCardType = document.querySelector('input[name="memoryCardType"]:checked')
  return memoryCardType && memoryCardType.value === "128GB" ? 1500 : 900
}

function getMemoryCardName() {
  const memoryCardType = document.querySelector('input[name="memoryCardType"]:checked')
  return memoryCardType && memoryCardType.value === "128GB" ? "128GB Memory Card" : "64GB Memory Card"
}

function selectDefaultRecordingDevice(cameraCount, systemType, cameraType) {
  if (isPackageSystem(systemType)) return null

  const options = systemType === "Analog" ? dvrOptions : nvrOptions

  if (systemType === "Analog") {
    const cameraMP = cameraType.includes("2MP") ? "2MP" : "5MP"
    let compatibleDevices = options.filter(
      (device) => device.channels >= cameraCount && device.supports.includes(cameraMP),
    )

    compatibleDevices.sort((a, b) => a.channels - b.channels)

    if (cameraMP === "2MP") {
      compatibleDevices = compatibleDevices.filter((device) => !device.name.includes("5MP"))
    } else if (cameraMP === "5MP") {
      compatibleDevices = compatibleDevices.filter(
        (device) => device.name.includes("5MP Supported") || device.name.includes("5MP Real"),
      )
    }

    return compatibleDevices[0]
  } else {
    const minChannels = cameraCount <= 4 ? 4 : cameraCount <= 8 ? 8 : 16
    return options.find((device) => device.channels === minChannels)
  }
}

function populateRecordingDeviceOptions(cameraCount, systemType, cameraType, defaultDevice, brand) {
  if (isPackageSystem(systemType)) return

  const options = systemType === "Analog" ? dvrOptions : nvrOptions
  const deviceSelect = document.getElementById("recordingDeviceType")
  deviceSelect.innerHTML = ""

  let compatibleDevices = []

  if (systemType === "Analog") {
    const cameraMP = cameraType.includes("2MP") ? "2MP" : "5MP"
    compatibleDevices = options.filter(
      (device) =>
        device.channels >= cameraCount && device.supports.includes(cameraMP) && device.name !== defaultDevice.name,
    )
  } else {
    compatibleDevices = options.filter((device) => device.channels >= cameraCount && device.name !== defaultDevice.name)
  }

  const defaultOption = document.createElement("option")
  defaultOption.value = defaultDevice.name
  defaultOption.dataset.price = defaultDevice.cost
  defaultOption.textContent = `${brand} ${defaultDevice.name}`
  deviceSelect.appendChild(defaultOption)

  compatibleDevices.forEach((device) => {
    const option = document.createElement("option")
    option.value = device.name
    option.dataset.price = device.cost
    option.textContent = `${brand} ${device.name}`
    deviceSelect.appendChild(option)
  })
}

function selectDefaultPowerDevice(cameraCount, systemType) {
  if (isPackageSystem(systemType)) return null

  const options = systemType === "Analog" ? smpsOptions : poeOptions
  const minChannels = cameraCount <= 4 ? 4 : cameraCount <= 8 ? 8 : 16
  return options.find((device) => device.channels === minChannels)
}

function populatePowerDeviceOptions(cameraCount, systemType, defaultDevice) {
  if (isPackageSystem(systemType)) return

  const options = systemType === "Analog" ? smpsOptions : poeOptions
  const deviceSelect = document.getElementById("powerDeviceType")
  deviceSelect.innerHTML = ""

  const compatibleDevices = options.filter(
    (device) => device.channels >= cameraCount && device.name !== defaultDevice.name,
  )

  const defaultOption = document.createElement("option")
  defaultOption.value = defaultDevice.name
  defaultOption.dataset.price = defaultDevice.cost
  defaultOption.textContent = defaultDevice.name
  deviceSelect.appendChild(defaultOption)

  compatibleDevices.forEach((device) => {
    const option = document.createElement("option")
    option.value = device.name
    option.dataset.price = device.cost
    option.textContent = device.name
    deviceSelect.appendChild(option)
  })
}

function selectDefaultHDD(cameraCount) {
  if (cameraCount <= 4) return "500GB Hard Disk"
  if (cameraCount <= 8) return "1TB Hard Disk"
  return "2TB Hard Disk"
}

function calculateCameraCost(cameraType, cameraCount, systemType) {
  const cameraSelect = document.getElementById("cameraType")
  const selectedOption = cameraSelect.options[cameraSelect.selectedIndex]

  if (isPackageSystem(systemType)) {
    const memoryCardType = document.querySelector('input[name="memoryCardType"]:checked')
    const is128GB = memoryCardType && memoryCardType.value === "128GB"
    const cameraPrice = Number.parseInt(
      is128GB ? selectedOption.dataset.cameraPrice128 : selectedOption.dataset.cameraPrice64,
    )
    return cameraPrice * cameraCount
  } else {
    const price = Number.parseInt(selectedOption.dataset.price)
    return price * cameraCount
  }
}

function calculateRackCost(rackType) {
  const rackSelect = document.getElementById("rackType")
  const selectedOption = rackSelect.options[rackSelect.selectedIndex]
  return Number.parseInt(selectedOption.dataset.price)
}

function calculateLabourCharge(cameraCount, systemType) {
  if (isPackageSystem(systemType)) {
    return 1500 * cameraCount
  }

  if (cameraCount === 1) return 1000
  if (cameraCount === 2) return 1500
  if (cameraCount === 3) return 2000
  if (cameraCount === 4) return 2500
  return 2500 + (cameraCount - 4) * 500
}

function filterTerms(quotationData) {
  const hasCamera = quotationData.items.some(
    (item) =>
      item.name.includes("Camera") ||
      item.name.includes("Wi-Fi") ||
      item.name.includes("4G") ||
      item.name.includes("Solar"),
  )
  const hasDVR = quotationData.items.some((item) => item.name.includes("DVR"))
  const hasSMPS = quotationData.items.some((item) => item.name.includes("SMPS"))
  const hasIPCamera = quotationData.items.some((item) => item.name.includes("IP Camera"))
  const hasNVR = quotationData.items.some((item) => item.name.includes("NVR"))
  const has500GBHDD = quotationData.hddType === "500GB Hard Disk"
  const hasAbove1TBHDD = ["1TB Hard Disk", "2TB Hard Disk", "4TB Hard Disk"].includes(quotationData.hddType)
  const hasBrandedMonitor = quotationData.addons && quotationData.addons.includes("Branded Monitor")
  const hasNormalMonitor = quotationData.addons && quotationData.addons.includes("Monitor")
  const hasCabling = quotationData.items.some((item) => item.name === "Cabling" || item.name === "CAT 6 Cable")
  const isPackage = isPackageSystem(quotationData.systemType)

  const filteredTerms = []

  const term1Items = []
  if (hasCamera) term1Items.push("Camera")
  if (hasDVR) term1Items.push("DVR")
  if (hasSMPS) term1Items.push("SMPS")
  if (hasIPCamera) term1Items.push("IP Camera")
  if (hasNVR) term1Items.push("NVR")
  if (has500GBHDD) term1Items.push("500GB Hard Disk")
  if (term1Items.length > 0) {
    filteredTerms.push(`2 Years Manufacturer Warranty for ${term1Items.join(", ")}.`)
  }

  const term2Items = []
  if (hasAbove1TBHDD) term2Items.push("Hard Disk above 1TB")
  if (hasBrandedMonitor) term2Items.push("Branded Monitor")
  if (term2Items.length > 0) {
    filteredTerms.push(`3 Years Warranty for ${term2Items.join(", ")}.`)
  }

  const term3Items = []
  if (hasNormalMonitor) term3Items.push("Normal Monitor")
  if (term3Items.length > 0) {
    filteredTerms.push(`1 Year Warranty for ${term3Items.join(", ")}.`)
  }

  if (isPackage) {
    filteredTerms.push("3 Months Free Service.")
  } else {
    filteredTerms.push("1 Year Free Service.")
  }

  if (hasCabling) {
    filteredTerms.push("Cabling Length is Approximate. Actual Cable Length will be charged finally.")
  }

  if (isPackage) {
    filteredTerms.push(
      "Switch Box near Camera is Customer Scope. If needed, we will do it with extra charges as apply. (Approx Around Rs.1000 as per site)",
    )
  }

  if (term1Items.length > 0 || term2Items.length > 0 || term3Items.length > 0) {
    filteredTerms.push("Manufacturer Warranty will be claimed as per Manufacturer Terms. We only Facilitate.")
  }

  return filteredTerms
}

function hasSubmittedToday(customerName, customerMobile) {
  const userKey = `${customerName}_${customerMobile}`
  const lastSubmission = localStorage.getItem(userKey)

  if (!lastSubmission) {
    return false
  }

  const lastSubmissionDate = new Date(Number.parseInt(lastSubmission))
  const today = new Date()

  return lastSubmissionDate.toDateString() === today.toDateString()
}

function recordSubmission(customerName, customerMobile) {
  const userKey = `${customerName}_${customerMobile}`
  localStorage.setItem(userKey, Date.now().toString())
}

function getCameraDisplayName(brand, cameraType, systemType) {
  if (isPackageSystem(systemType)) {
    return `${brand} ${cameraType}`
  } else {
    return `${brand} ${cameraType}`
  }
}

function isDiscountableItem(itemName) {
  const nonDiscountableItems = [
    "Sim Modem",
    "Monitor",
    "Branded Monitor",
    "Zebronics 600VA UPS",
    "Zebronics 1KVA UPS",
    "Numeric 600VA UPS",
    "Numeric 1KVA UPS",
    "2U 350D Rack",
    "4U 350D Rack",
    "4U 500D Rack",
    "30m HDMI Extender",
    "60m HDMI Extender",
    "1 Ft Camera Extension Stand",
    "1+1 Ft Camera Extension Stand",
    "2+2 Ft Camera Extension Stand",
  ]

  return !nonDiscountableItems.some((nonDiscountable) => itemName.includes(nonDiscountable))
}

function showAlert(message, type) {
  const alertContainer = document.getElementById("alertContainer")
  const alertDiv = document.createElement("div")
  alertDiv.className = `alert alert-${type}`
  alertDiv.textContent = message
  alertContainer.appendChild(alertDiv)

  setTimeout(() => {
    alertDiv.remove()
  }, 5000)
}

function showLoading(show) {
  document.getElementById("loading").style.display = show ? "block" : "none"
}

// --- Custom product helpers ---
function addCustomProduct() {
  const nameEl = document.getElementById("customProductName")
  const priceEl = document.getElementById("customProductPrice")
  const qtyEl = document.getElementById("customProductQty")

  const name = (nameEl && nameEl.value || "").trim()
  const price = Number.parseFloat(priceEl && priceEl.value) || 0
  const qty = Number.parseInt(qtyEl && qtyEl.value) || 1

  if (!name) {
    showAlert("Enter a product name.", "danger")
    return
  }

  quotationData.customProducts = quotationData.customProducts || []
  // store per-custom-product discount flag so admin toggles persist
  quotationData.customProducts.push({ name, price, qty, amount: price * qty, _discountApplied: true })

  // clear inputs
  nameEl.value = ""
  priceEl.value = ""
  qtyEl.value = "1"

  // Re-render summary and regenerate PDF
  renderSummaryAndRefresh()
}

function removeCustomProduct(index) {
  // index refers to the index in quotationData.items when the remove button is clicked
  if (!quotationData.items || !quotationData.items[index]) return
  const item = quotationData.items[index]
  if (!item.isCustom) return

  // remove from items
  quotationData.items.splice(index, 1)

  // also remove matching entry from customProducts (first match)
  if (quotationData.customProducts) {
    const cpIdx = quotationData.customProducts.findIndex(
      (p) => p.name === item.name && Number(p.price) === Number(item.price) && Number(p.qty) === Number(item.qty),
    )
    if (cpIdx !== -1) quotationData.customProducts.splice(cpIdx, 1)
  }

  renderSummaryAndRefresh()
}

  function renderSummaryAndRefresh() {
  // Rebuild the items array to include custom products at the end
  // Keep existing logic for calculation intact; assume generateQuotation/updateQuotation sets quotationData.items
  // Append custom products
  if (quotationData.customProducts && quotationData.customProducts.length > 0) {
    // ensure items exists
    quotationData.items = quotationData.items || []
    // remove any previous "Custom Product" entries
    quotationData.items = quotationData.items.filter((it) => !(it.isCustom))
    quotationData.customProducts.forEach((p) => {
      // ensure custom products also auto-apply discount by default
      quotationData.items.push({
        name: p.name,
        qty: p.qty,
        price: p.price,
        amount: p.price * p.qty,
        isCustom: true,
        _discountApplied: typeof p._discountApplied === 'boolean' ? p._discountApplied : true,
      })
    })
  }

  // Recompute totals and discount
  const subtotal = quotationData.items.reduce((s, it) => s + (it.amount || 0), 0)
  const discountRate = quotationData.discountRate || 0
  const discountableAmount = quotationData.items
    .filter((item) => isDiscountableItem(item.name))
    .reduce((t, item) => t + (item.amount || 0), 0)
  const discount = discountableAmount * discountRate
  quotationData.discount = discount
  quotationData.grandTotal = subtotal - discount

  // Render summary HTML (used in both generate and update flows)
    const summaryContent = `
    <p><strong>Customer:</strong> ${quotationData.customerName || ""}</p>
    <p><strong>Mobile:</strong> ${quotationData.customerMobile || ""}</p>
    <p><strong>Email:</strong> ${quotationData.customerEmail || "N/A"}</p>
    <p><strong>Address:</strong> ${quotationData.customerAddress || "N/A"}</p>
  <p><strong>Brand:</strong> ${quotationData.brand || ""}</p>
  <p><strong>Branch:</strong> ${quotationData.branchInfo ? quotationData.branchInfo.name : (quotationData.branch || '')}</p>
    <p><strong>System Type:</strong> ${quotationData.systemType || ""}</p>
    <table>
      <tr>
        <th>Apply Discount?</th>
        <th>Item</th>
        <th>Qty</th>
        <th>Price (INR)</th>
        <th>Amount (INR)</th>
        <th>Action</th>
      </tr>
      ${quotationData.items
        .map(
          (item, idx) => `
        <tr>
          <td style="text-align:center"><input type="checkbox" data-idx="${idx}" ${item._discountApplied ? 'checked' : ''} onchange="toggleItemDiscount(${idx}, this.checked)" /></td>
          <td><input value="${item.name.replace(/"/g, '&quot;')}" onchange="updateItemField(${idx}, 'name', this.value)" style="width:220px" /></td>
          <td><input type="number" value="${item.qty}" min="0" onchange="updateItemField(${idx}, 'qty', this.value)" style="width:60px" /></td>
          <td><input type="number" step="0.01" value="${(item.price || 0).toFixed(2)}" onchange="updateItemField(${idx}, 'price', this.value)" style="width:100px" /></td>
          <td>${(item.amount || 0).toFixed(2)}</td>
          <td><button onclick="removeItem(${idx})">Remove</button></td>
        </tr>
      `,
        )
        .join("")}

  <!-- Manual discount removed: render editable discount in the totals row below instead -->

      ${(() => {
        // compute displayed totals taking manual discounts and per-item discount flags into account
        const subtotalDisplay = quotationData.items.reduce((s, it) => s + (it.amount || 0), 0)
        // Determine computed discount from per-item flags (brand rate applies only to items marked true)
        let flagDiscount = 0
        quotationData.items.forEach((it) => {
          if (it._discountApplied) {
            const rate = quotationData.discountRate || 0
            if (rate > 0) {
              flagDiscount += (isDiscountableItem(it.name) ? it.amount * rate : 0)
            }
          }
        })
        // If admin hasn't manually edited the amount, initialize manualDiscountAmount to the computed flagDiscount
        if (!manualDiscountEdited) {
          manualDiscountAmount = flagDiscount
        }
        const manualDiscAmount = Number(manualDiscountAmount) || 0
        // The manual amount overrides the computed discount (it's the final discount used)
        const totalDiscount = manualDiscAmount
        const grandTotalDisplay = Math.max(0, subtotalDisplay - totalDiscount)

        // Persist the displayed discount/grand total back to quotationData so PDF/email reflect admin edits
        quotationData.discount = totalDiscount
        quotationData.grandTotal = grandTotalDisplay

        return `
          <tr style="background-color: #f0f0f0;">
            <td colspan="4" style="text-align:right">Discount (combined)</td>
            <td>₹ <input id="combinedDiscountInput" type="number" step="0.01" min="0" style="width:120px" value="${totalDiscount.toFixed(2)}" onchange="setManualDiscountAmount(this.value)" /></td>
            <td></td>
          </tr>
          <tr style="background-color: #e6f0ff; font-weight: bold;">
            <td colspan="4">Grand Total</td>
            <td>${grandTotalDisplay.toFixed(2)}</td>
            <td></td>
          </tr>
        `
      })()}
    </table>
  `

  const summaryEl = document.getElementById("summaryContent")
  if (summaryEl) summaryEl.innerHTML = summaryContent

  // Update terms
  const termsList = document.getElementById("termsList")
  if (termsList) termsList.innerHTML = (quotationData.terms || []).map((t) => `<li>${t}</li>`).join("")

  document.getElementById("summary").style.display = "block"

  // regenerate PDF in background
  generatePDFWithJSPDF(quotationData)
    .then((newPdf) => {
      pdfBase64 = newPdf
    })
    .catch((err) => console.warn("PDF regen failed:", err))
}

// Called from editable inputs in summary table
function updateItemField(index, field, value) {
  if (!quotationData.items || !quotationData.items[index]) return
  const item = quotationData.items[index]
  if (field === "name") {
    item.name = String(value)
  } else if (field === "qty") {
    const n = Number.parseInt(value) || 0
    item.qty = n
    item.amount = (Number(item.price) || 0) * n
  } else if (field === "price") {
    const p = Number.parseFloat(value) || 0
    item.price = p
    item.amount = p * (Number(item.qty) || 0)
  }

  // sync back to customProducts if isCustom
  if (item.isCustom && quotationData.customProducts) {
    const cp = quotationData.customProducts.find((p) => p.name === item.name) || null
    if (cp) {
      cp.name = item.name
      cp.price = item.price
      cp.qty = item.qty
      cp.amount = item.amount
    }
  }

  // Re-render summary and regenerate PDF
  renderSummaryAndRefresh()
}

// Toggle per-item discount flag (UI-only) - keeps _discountApplied on item
function toggleItemDiscount(index, checked) {
  if (!quotationData.items || !quotationData.items[index]) return
  quotationData.items[index]._discountApplied = !!checked
  // If this is a custom product, persist the flag into quotationData.customProducts as well
  const it = quotationData.items[index]
  if (it && it.isCustom && quotationData.customProducts) {
    const cp = quotationData.customProducts.find((p) => p.name === it.name && Number(p.price) === Number(it.price) && Number(p.qty) === Number(it.qty))
    if (cp) cp._discountApplied = !!checked
  }
  // Re-render summary (do not sync to server-side discountRate)
  renderSummaryAndRefresh()
}

// Remove any item by index
function removeItem(index) {
  if (!quotationData.items || !quotationData.items[index]) return
  // capture the item being removed before mutating the items array
  const removed = quotationData.items[index]
  quotationData.items.splice(index, 1)
  // also remove from customProducts if matches
  if (removed && removed.isCustom && quotationData.customProducts) {
    const cpIdx = quotationData.customProducts.findIndex((p) => p.name === removed.name && Number(p.price) === Number(removed.price) && Number(p.qty) === Number(removed.qty))
    if (cpIdx !== -1) quotationData.customProducts.splice(cpIdx, 1)
  }

  renderSummaryAndRefresh()
}

// Manual discount setter (non-sync) - only absolute INR amount
function setManualDiscountAmount(val) {
  // mark that admin manually edited the amount so we don't auto-sync it back to computed value
  manualDiscountEdited = true
  if (val === '' || val === null) {
    manualDiscountAmount = null
  } else {
    manualDiscountAmount = Number(val) || 0
  }
  renderSummaryAndRefresh()
}

// --- end custom product helpers ---

function calculateAddonsCost(addons) {
  let total = 0

  addons.forEach((addon) => {
    const checkbox = document.querySelector(`input[name="addons"][value="${addon}"]`)
    if (checkbox) {
      total += Number.parseInt(checkbox.dataset.price)
    }
  })

  const upsSelect = document.getElementById("upsType")
  if (upsSelect.value !== "None" && !addons.includes(upsSelect.value)) {
    total += Number.parseInt(upsSelect.options[upsSelect.selectedIndex].dataset.price)
  }

  const hdmiExtenderSelect = document.getElementById("hdmiExtenderType")
  if (hdmiExtenderSelect.value !== "None") {
    total += Number.parseInt(hdmiExtenderSelect.options[hdmiExtenderSelect.selectedIndex].dataset.price)
  }

  const cameraExtensionStandSelect = document.getElementById("cameraExtensionStandType")
  if (cameraExtensionStandSelect.value !== "None") {
    total += Number.parseInt(cameraExtensionStandSelect.options[cameraExtensionStandSelect.selectedIndex].dataset.price)
  }

  return total
}

// Enhanced PDF generation function using jsPDF
function generatePDFWithJSPDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const { jsPDF } = window.jspdf
      const doc = new jsPDF()

  // Set font
  doc.setFont("helvetica")

  // Clean header background
  doc.setFillColor(245, 247, 250)
  doc.rect(0, 0, 210, 36, "F")

  // Prepare branch display and company text (logo will be drawn to left when available)
  const branchDisplay = data.branchInfo || { address: "", phone: "" }

  // Company title (left-aligned to leave space for logo on the left)
  doc.setTextColor(20, 33, 61)
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("One View Secure Technologies", 50, 14, { align: "left" })

  // Contact / branch lines under company title
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  if (branchDisplay.name) doc.text(branchDisplay.name, 50, 20, { align: "left" })
  if (branchDisplay.address) doc.text(branchDisplay.address, 50, 25, { align: "left" })
  const contactLineTop = `${branchDisplay.phone ? 'Phone: ' + branchDisplay.phone + ' | ' : ''}sales@oneviewsecuretech.in`
  doc.text(contactLineTop, 50, 30, { align: "left" })

  // Reset text color to default for body
  doc.setTextColor(0, 0, 0)

  // Quotation Title and Date (centered below header)
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("QUOTATION", 105, 55, { align: "center" })

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      const currentDate = new Date().toLocaleDateString("en-IN")
      const quotationNumber = `QT${Date.now().toString().slice(-6)}`
      doc.text(`Date: ${currentDate}`, 150, 65)
      doc.text(`Quotation #: ${quotationNumber}`, 150, 70)

  // Customer Details
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("Customer Details:", 20, 85)

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Customer: ${data.customerName}`, 20, 95)
      doc.text(`Mobile: ${data.customerMobile}`, 20, 102)
      doc.text(`Email: ${data.customerEmail || "N/A"}`, 20, 109)
      doc.text(`Address: ${data.customerAddress || "N/A"}`, 20, 116)
      doc.text(`Brand: ${data.brand}`, 20, 123)
      doc.text(`System Type: ${data.systemType}`, 20, 130)

      function loadImageAsPngDataUrl(src) {
        return new Promise((resolveImg, rejectImg) => {
          try {
            const imgEl = new Image()
            imgEl.crossOrigin = "anonymous"
            imgEl.onload = () => {
              try {
                const canvas = document.createElement("canvas")
                canvas.width = imgEl.naturalWidth
                canvas.height = imgEl.naturalHeight
                const ctx = canvas.getContext("2d")
                ctx.drawImage(imgEl, 0, 0)
                const pngDataUrl = canvas.toDataURL("image/png")
                resolveImg(pngDataUrl)
              } catch (err) {
                rejectImg(err)
              }
            }
            imgEl.onerror = () => rejectImg(new Error("Failed to load image: " + src))
            imgEl.src = src
          } catch (err) {
            rejectImg(err)
          }
        })
      }

      // Attempt to load both images concurrently; failures are tolerated
      const logoPromise = loadImageAsPngDataUrl(logoSrc).catch((err) => {
        console.warn("Could not load logo for PDF:", err)
        return null
      })

      const appImagePromise = loadImageAsPngDataUrl(appImageSrc).catch((err) => {
        console.warn("Could not load app image for PDF:", err)
        return null
      })

      const imagesPromise = Promise.all([logoPromise, appImagePromise])

  // Table Header
      let yPos = 145
      doc.setFillColor(0, 102, 204)
      doc.rect(20, yPos - 5, 170, 10, "F")

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.text("Item", 25, yPos)
      doc.text("Qty", 120, yPos)
      doc.text("Price (INR)", 140, yPos)
      doc.text("Amount (INR)", 165, yPos)

      // Reset text color
      doc.setTextColor(0, 0, 0)
      doc.setFont("helvetica", "normal")

      // Table Rows
      yPos += 10
      data.items.forEach((item, index) => {
        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage()
          yPos = 20

          // Add table header on new page
          doc.setFillColor(0, 102, 204)
          doc.rect(20, yPos - 5, 170, 10, "F")
          doc.setTextColor(255, 255, 255)
          doc.setFont("helvetica", "bold")
          doc.text("Item", 25, yPos)
          doc.text("Qty", 120, yPos)
          doc.text("Price (INR)", 140, yPos)
          doc.text("Amount (INR)", 165, yPos)
          doc.setTextColor(0, 0, 0)
          doc.setFont("helvetica", "normal")
          yPos += 10
        }

        // Alternate row colors
        if (index % 2 === 0) {
          doc.setFillColor(248, 249, 250)
          doc.rect(20, yPos - 5, 170, 8, "F")
        }

        // Truncate long item names
        let itemName = item.name
        if (itemName.length > 35) {
          itemName = itemName.substring(0, 32) + "..."
        }

        doc.text(itemName, 25, yPos)
        doc.text(item.qty.toString(), 120, yPos)
        doc.text(item.price.toFixed(2), 140, yPos)
        doc.text(item.amount.toFixed(2), 165, yPos)
        yPos += 8
      })

      // Discount Row
      if (data.discount > 0) {
        doc.setFillColor(255, 230, 230)
        doc.rect(20, yPos - 5, 170, 8, "F")
        doc.setTextColor(211, 47, 47)
        doc.setFont("helvetica", "bold")
        doc.text(`Discount (${(data.discountRate * 100).toFixed(1)}%)`, 25, yPos)
        doc.text(`-${data.discount.toFixed(2)}`, 165, yPos)
        doc.setTextColor(0, 0, 0)
        doc.setFont("helvetica", "normal")
        yPos += 8
      }

      // Grand Total Row
      doc.setFillColor(227, 242, 253)
      doc.rect(20, yPos - 5, 170, 12, "F")
      doc.setTextColor(25, 118, 210)
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("GRAND TOTAL", 25, yPos + 3)
      doc.text(data.grandTotal.toFixed(2), 165, yPos + 3)

      yPos += 20

      // Terms & Conditions
      if (yPos > 220) {
        doc.addPage()
        yPos = 20
      }

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("Terms & Conditions:", 20, yPos)
      yPos += 10

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      data.terms.forEach((term, index) => {
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }

        const termText = `${index + 1}. ${term}`
        const lines = doc.splitTextToSize(termText, 170)
        doc.text(lines, 20, yPos)
        yPos += lines.length * 4 + 2
      })

      // Footer will be added after potential image insertion

      // Wait for both logo and app image to resolve, then draw them where available
      imagesPromise.then(([logoDataUrl, appDataUrl]) => {
        try {
          const pageWidth = doc.internal.pageSize.getWidth()

          // Draw logo on left of header (if available). Header height ~36; keep logo within 32x32 or scale preserving aspect.
          if (logoDataUrl) {
            try {
              const props = doc.getImageProperties(logoDataUrl)
              const maxLogoW = 32
              const maxLogoH = 32
              let logoW = props.width
              let logoH = props.height
              const ratio = Math.min(maxLogoW / logoW, maxLogoH / logoH, 1)
              logoW = logoW * ratio
              logoH = logoH * ratio
              const logoX = 14
              const logoY = 4
              doc.addImage(logoDataUrl, "PNG", logoX, logoY, logoW, logoH)
            } catch (err) {
              console.warn("Could not draw logo into PDF:", err)
            }
          }

          // Draw app image near the quotation number (if available)
          if (appDataUrl) {
            try {
              const props = doc.getImageProperties(appDataUrl)
              const maxImgWidth = 60
              const imgW = Math.min(maxImgWidth, pageWidth - 130)
              const imgH = (props.height * imgW) / props.width
              const x = pageWidth - imgW - 14
              const y = 60
              doc.addImage(appDataUrl, "PNG", x, y, imgW, imgH)
            } catch (err) {
              console.warn("Could not draw app image into PDF:", err)
            }
          }
        } catch (err) {
          console.warn("Error while drawing images into PDF:", err)
        }

        // Footer for each page
        const pageCount = doc.internal.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i)
          // subtle divider line
          doc.setDrawColor(220, 220, 220)
          doc.setLineWidth(0.2)
          doc.line(14, 274, pageWidth - 14, 274)

          doc.setFontSize(10)
          doc.setFont("helvetica", "bold")
          doc.setTextColor(20, 33, 61)
          doc.text("One View Secure Technologies", 20, 282)

          doc.setFontSize(8)
          doc.setFont("helvetica", "normal")
          doc.setTextColor(102, 102, 102)
          const contactLine = `${branchDisplay && branchDisplay.phone ? branchDisplay.phone + ' | ' : ''}sales@oneviewsecuretech.in | www.oneviewsecure.in`
          doc.text(`For queries: ${contactLine}`, 20, 287)
          doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, 287)
        }

        // Convert to base64 and resolve
        pdfBase64 = doc.output("datauristring").split(",")[1]
        resolve(pdfBase64)
      }).catch((err) => {
        console.warn("Unexpected error while handling image promises:", err)
        try {
          const pageWidth = doc.internal.pageSize.getWidth()
          const pageCount = doc.internal.getNumberOfPages()
          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(10)
            doc.setFont("helvetica", "bold")
            doc.setTextColor(20, 33, 61)
            doc.text("One View Secure Technologies", 20, 282)
            doc.setFontSize(8)
            doc.setFont("helvetica", "normal")
            doc.setTextColor(102, 102, 102)
            const contactLine = `${branchDisplay && branchDisplay.phone ? branchDisplay.phone + ' | ' : ''}sales@oneviewsecuretech.in | www.oneviewsecure.in`
            doc.text(`For queries: ${contactLine}`, 20, 287)
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, 287)
          }
        } catch (err2) {
          console.warn("Failed to draw fallback footer:", err2)
        }
        pdfBase64 = doc.output("datauristring").split(",")[1]
        resolve(pdfBase64)
      })
    } catch (error) {
      reject(error)
    }
  })
}

// Updated email sending function with proper API endpoint approach
async function sendEmailNotification(quotationData) {
  try {
    // Create the email payload
    const emailPayload = {
      customerName: quotationData.customerName,
      customerMobile: quotationData.customerMobile,
      customerEmail: quotationData.customerEmail,
      customerAddress: quotationData.customerAddress,
      systemType: quotationData.systemType,
      brand: quotationData.brand,
      cameraType: quotationData.cameraType,
      cameraCount: quotationData.cameraCount,
      items: quotationData.items,
      discount: quotationData.discount,
      discountRate: quotationData.discountRate,
  grandTotal: quotationData.grandTotal,
  pdfBase64: pdfBase64,
      terms: quotationData.terms,
    }

    // Try to send via your API endpoint
    const response = await fetch(CONFIG.API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    })

    if (response.ok) {
      const result = await response.json()
      return { success: true, message: "Email sent successfully via API endpoint" }
    } else {
      throw new Error(`API endpoint failed: ${response.status}`)
    }
  } catch (error) {
    console.error("Email API error:", error)

    // Fallback: Show a helpful message about setting up the API endpoint
    return {
      success: false,
      message:
        "Email notification requires server-side API endpoint. Please set up BREVO_API_KEY environment variable.",
    }
  }
}

async function generateQuotation() {
  const customerName = document.getElementById("customerName").value.trim()
  const customerMobile = document.getElementById("customerMobile").value.trim()

  if (!customerName) {
    showAlert("Please enter customer name.", "danger")
    document.getElementById("customerName").focus()
    return
  }

  if (!customerMobile) {
    showAlert("Please enter mobile number.", "danger")
    document.getElementById("customerMobile").focus()
    return
  }

  if (!/^[0-9]{10}$/.test(customerMobile)) {
    showAlert("Please enter a valid 10-digit mobile number.", "danger")
    document.getElementById("customerMobile").focus()
    return
  }

  showLoading(true)

  const customerEmail = document.getElementById("customerEmail").value
  const customerAddress = document.getElementById("customerAddress").value
  const branchSelect = document.getElementById("branchSelect")
  const branchKey = branchSelect ? branchSelect.value : 'Chennai'
  const branchInfo = BRANCHES[branchKey]
  const systemType = document.querySelector('input[name="systemType"]:checked').value
  const brand = document.getElementById("brand").value
  const cameraType = document.getElementById("cameraType").value
  const cameraCount = Number.parseInt(document.getElementById("cameraCount").value)

  const addons = Array.from(document.querySelectorAll('input[name="addons"]:checked')).map((el) => el.value)
  const rackType = document.getElementById("rackType").value
  const totalCableLength = cameraCount * 20

  const alreadySubmittedToday = hasSubmittedToday(customerName, customerMobile)

  let items = []
  let recordingDeviceCost = 0
  let powerDeviceCost = 0
  let hddCost = 0
  let cablingCost = 0
  let connectorCost = 0
  let boxCost = 0
  let defaultRecordingDevice = null
  let defaultPowerDevice = null
  let defaultHDD = null

  const cameraCost = calculateCameraCost(cameraType, cameraCount, systemType)
  const addonsCost = calculateAddonsCost(addons)
  const rackCost = calculateRackCost(rackType)
  const labourCharge = calculateLabourCharge(cameraCount, systemType)

  if (isPackageSystem(systemType)) {
    const cameraDisplayName = getCameraDisplayName(brand, cameraType, systemType)
    const memoryCardPrice = getMemoryCardPrice()
    const memoryCardName = getMemoryCardName()

    items = [
      { name: cameraDisplayName, qty: cameraCount, price: cameraCost / cameraCount, amount: cameraCost },
      { name: memoryCardName, qty: cameraCount, price: memoryCardPrice, amount: memoryCardPrice * cameraCount },
      { name: "Labour Charge", qty: 1, price: labourCharge, amount: labourCharge },
    ]

    document.getElementById("customizeSection").style.display = "none"
  } else {
    defaultRecordingDevice = selectDefaultRecordingDevice(cameraCount, systemType, cameraType)
    defaultPowerDevice = selectDefaultPowerDevice(cameraCount, systemType)
    defaultHDD = selectDefaultHDD(cameraCount)

    populateRecordingDeviceOptions(cameraCount, systemType, cameraType, defaultRecordingDevice, brand)
    populatePowerDeviceOptions(cameraCount, systemType, defaultPowerDevice)

    document.getElementById("hddType").value = defaultHDD
    document.getElementById("totalCableLength").value = totalCableLength

    const hddSelect = document.getElementById("hddType")
    const selectedHDD = hddSelect.options[hddSelect.selectedIndex]
    hddCost = Number.parseInt(selectedHDD.dataset.price)

    recordingDeviceCost = defaultRecordingDevice.cost
    powerDeviceCost = defaultPowerDevice.cost

    const cableCostPerMeter = systemType === "Analog" ? 50 : 60
    cablingCost = totalCableLength * cableCostPerMeter

    let connectorName, boxName

    if (systemType === "Analog") {
      connectorName = "Connectors"
      connectorCost = cameraCount * 150
      boxName = "PVC Box"
      boxCost = cameraCount * 50
    } else {
      connectorName = "D-Link RJ45 Jack"
      connectorCost = cameraCount * 50
      boxName = "Kosmos Box"
      boxCost = cameraCount * 150
    }

  items = [
      { name: `${brand} ${cameraType}`, qty: cameraCount, price: cameraCost / cameraCount, amount: cameraCost },
      {
        name: `${brand} ${defaultRecordingDevice.name}`,
        qty: 1,
        price: recordingDeviceCost,
        amount: recordingDeviceCost,
      },
      { name: defaultPowerDevice.name, qty: 1, price: powerDeviceCost, amount: powerDeviceCost },
      ...addons.map((addon) => {
        const checkbox = document.querySelector(`input[name="addons"][value="${addon}"]`)
        const price = Number.parseInt(checkbox.dataset.price)
        return { name: addon, qty: 1, price: price, amount: price }
      }),
      ...(() => {
        const dropdownItems = []

        const upsSelect = document.getElementById("upsType")
        if (upsSelect.value !== "None" && !addons.includes(upsSelect.value)) {
          const price = Number.parseInt(upsSelect.options[upsSelect.selectedIndex].dataset.price)
          dropdownItems.push({ name: upsSelect.value, qty: 1, price: price, amount: price })
        }

        const hdmiExtenderSelect = document.getElementById("hdmiExtenderType")
        if (hdmiExtenderSelect.value !== "None") {
          const price = Number.parseInt(hdmiExtenderSelect.options[hdmiExtenderSelect.selectedIndex].dataset.price)
          dropdownItems.push({ name: hdmiExtenderSelect.value, qty: 1, price: price, amount: price })
        }

        const cameraExtensionStandSelect = document.getElementById("cameraExtensionStandType")
        if (cameraExtensionStandSelect.value !== "None") {
          const price = Number.parseInt(
            cameraExtensionStandSelect.options[cameraExtensionStandSelect.selectedIndex].dataset.price,
          )
          dropdownItems.push({ name: cameraExtensionStandSelect.value, qty: 1, price: price, amount: price })
        }

        return dropdownItems
      })(),
      ...(rackType !== "None" ? [{ name: rackType, qty: 1, price: rackCost, amount: rackCost }] : []),
      { name: defaultHDD, qty: 1, price: hddCost, amount: hddCost },
      {
        name: `${systemType === "Analog" ? "Cabling" : "CAT 6 Cable"}`,
        qty: totalCableLength,
        price: cableCostPerMeter,
        amount: cablingCost,
      },
      {
        name: connectorName,
        qty: cameraCount,
        price: connectorName === "Connectors" ? 150 : 50,
        amount: connectorCost,
      },
      { name: boxName, qty: cameraCount, price: boxName === "PVC Box" ? 50 : 150, amount: boxCost },
      { name: "HDMI Cable 1.5m", qty: 1, price: 150, amount: 150 },
      { name: "Ethernet Cable (For Internet) 1.5m", qty: 1, price: 150, amount: 150 },
      { name: "Labour Charge", qty: 1, price: labourCharge, amount: labourCharge },
    ]

    document.getElementById("customizeSection").style.display = "block"
  }

  // Apply global markup to each item amount and price
  items = items.map((it) => {
    const priced = Object.assign({}, it)
    priced.price = applyGlobalMarkup(Number(priced.price || priced.amount / Math.max(1, priced.qty)))
    priced.amount = applyGlobalMarkup(Number(priced.amount || priced.price * priced.qty))
    return priced
  })

  const subtotal = items.reduce((total, item) => total + item.amount, 0)

  const discountRate = brandDiscounts[systemType][brand] || 0
  const discountableAmount = items
    .filter((item) => isDiscountableItem(item.name))
    .reduce((total, item) => total + item.amount, 0)
  const discount = discountableAmount * discountRate
  const grandTotal = subtotal - discount

  // Update global quotationData object
  // Preserve existing per-item UI flags (_discountApplied) when possible
  const previousFlags = {}
  if (quotationData.items && Array.isArray(quotationData.items)) {
    quotationData.items.forEach((it, i) => {
      previousFlags[`${it.name}__${it.qty}__${it.price}`] = !!it._discountApplied
    })
  }

  // assign and rehydrate flags; default to true (auto-apply brand discount) when no previous flag exists
  const newItems = items.map((it) => ({
    ...it,
    _discountApplied: previousFlags.hasOwnProperty(`${it.name}__${it.qty}__${it.price}`)
      ? !!previousFlags[`${it.name}__${it.qty}__${it.price}`]
      : true,
  }))

  Object.assign(quotationData, {
    customerName,
    customerMobile,
    customerEmail,
    customerAddress,
    systemType,
    brand,
    cameraType,
    cameraCount,
    totalCableLength,
    recordingDeviceType: defaultRecordingDevice ? `${brand} ${defaultRecordingDevice.name}` : null,
    powerDeviceType: defaultPowerDevice ? defaultPowerDevice.name : null,
    hddType: defaultHDD,
    addons: isPackageSystem(systemType) ? [] : addons,
    rackType: isPackageSystem(systemType) ? "None" : rackType,
    memoryCardType: isPackageSystem(systemType) ? getMemoryCardName() : null,
  items: newItems,
    discountRate,
  discount,
  grandTotal,
  branch: branchKey,
  branchInfo,
    terms: filterTerms({
      items,
      hddType: defaultHDD,
      addons: isPackageSystem(systemType) ? [] : addons,
      rackType: isPackageSystem(systemType) ? "None" : rackType,
      systemType,
    }),
  })

  // Ensure discountRate is stored for later recalculation
  quotationData.discountRate = discountRate

  // Render summary and regenerate PDF (includes custom products if any)
  renderSummaryAndRefresh()

  // Send email notification
  if (!alreadySubmittedToday) {
    try {
      const emailResult = await sendEmailNotification(quotationData)

      if (emailResult.success) {
        showAlert("Quotation generated successfully and email notification sent!", "success")
        recordSubmission(customerName, customerMobile)
      } else {
        showAlert(`Quotation generated successfully. ${emailResult.message}`, "warning")
      }
    } catch (error) {
      console.error("Error sending email notification:", error)
      showAlert("Quotation generated successfully but email notification failed to send.", "warning")
    }
  } else {
    showAlert("Quotation generated successfully. Email notification skipped (already sent today).", "info")
  }

  showLoading(false)
}

async function updateQuotation() {
  if (isPackageSystem(quotationData.systemType)) {
    showAlert("Package systems cannot be customized.", "info")
    return
  }

  showLoading(true)

  // Get the selected values from the customization dropdowns
  const recordingDeviceType = document.getElementById("recordingDeviceType").value
  const recordingDeviceOption =
    document.getElementById("recordingDeviceType").options[document.getElementById("recordingDeviceType").selectedIndex]
  const recordingDevicePrice = Number.parseInt(recordingDeviceOption.dataset.price)

  const powerDeviceType = document.getElementById("powerDeviceType").value
  const powerDeviceOption =
    document.getElementById("powerDeviceType").options[document.getElementById("powerDeviceType").selectedIndex]
  const powerDevicePrice = Number.parseInt(powerDeviceOption.dataset.price)

  const hddType = document.getElementById("hddType").value
  const hddOption = document.getElementById("hddType").options[document.getElementById("hddType").selectedIndex]
  const hddPrice = Number.parseInt(hddOption.dataset.price)

  const totalCableLength = Number.parseInt(document.getElementById("totalCableLength").value)

  const hdmiCableType = document.getElementById("hdmiCableType").value
  const hdmiCableOption =
    document.getElementById("hdmiCableType").options[document.getElementById("hdmiCableType").selectedIndex]
  const hdmiCablePrice = Number.parseInt(hdmiCableOption.dataset.price)

  // Update the quotation data
  const systemType = quotationData.systemType
  const brand = quotationData.brand
  const cameraCount = quotationData.cameraCount

  // Find the items to update
  const recordingDeviceIndex = quotationData.items.findIndex(
    (item) => item.name.includes("DVR") || item.name.includes("NVR"),
  )
  const powerDeviceIndex = quotationData.items.findIndex(
    (item) => item.name.includes("SMPS") || item.name.includes("POE"),
  )
  const hddIndex = quotationData.items.findIndex((item) => item.name.includes("Hard Disk"))
  const cableIndex = quotationData.items.findIndex((item) => item.name === "Cabling" || item.name === "CAT 6 Cable")
  const hdmiCableIndex = quotationData.items.findIndex((item) => item.name.includes("HDMI Cable"))

  // Update the items
  if (recordingDeviceIndex !== -1) {
    quotationData.items[recordingDeviceIndex].name = recordingDeviceOption.textContent
    quotationData.items[recordingDeviceIndex].price = recordingDevicePrice
    quotationData.items[recordingDeviceIndex].amount = recordingDevicePrice
  }

  if (powerDeviceIndex !== -1) {
    quotationData.items[powerDeviceIndex].name = powerDeviceType
    quotationData.items[powerDeviceIndex].price = powerDevicePrice
    quotationData.items[powerDeviceIndex].amount = powerDevicePrice
  }

  if (hddIndex !== -1) {
    quotationData.items[hddIndex].name = hddType
    quotationData.items[hddIndex].price = hddPrice
    quotationData.items[hddIndex].amount = hddPrice
  }

  if (cableIndex !== -1) {
    const cableCostPerMeter = systemType === "Analog" ? 50 : 60
    const cablingCost = totalCableLength * cableCostPerMeter

    quotationData.items[cableIndex].qty = totalCableLength
    quotationData.items[cableIndex].amount = cablingCost
  }

  if (hdmiCableIndex !== -1) {
    quotationData.items[hdmiCableIndex].name = hdmiCableType
    quotationData.items[hdmiCableIndex].price = hdmiCablePrice
    quotationData.items[hdmiCableIndex].amount = hdmiCablePrice
  }

  // Recalculate the total
  let subtotal = 0
  quotationData.items.forEach((item) => {
    subtotal += item.amount
  })

  // Ensure Ethernet cable is included if not already present
  const hasEthernet = quotationData.items.some((item) => item.name.includes("Ethernet Cable"))

  if (!hasEthernet) {
    quotationData.items.splice(-1, 0, { name: "Ethernet Cable (For Internet) 1.5m", qty: 1, price: 150, amount: 150 })
    subtotal += 150
  }

  // Apply brand-specific discount ONLY to discountable items (exclude add-ons and racks)
  const discountRate = brandDiscounts[systemType][brand] || 0
  const discountableAmount = quotationData.items
    .filter((item) => isDiscountableItem(item.name))
    .reduce((total, item) => total + item.amount, 0)
  const discount = discountableAmount * discountRate
  const grandTotal = subtotal - discount

  // Update the quotation data
  quotationData.recordingDeviceType = recordingDeviceOption.textContent
  quotationData.powerDeviceType = powerDeviceType
  quotationData.hddType = hddType
  quotationData.totalCableLength = totalCableLength
  quotationData.discount = discount
  quotationData.grandTotal = grandTotal

  // Update the terms based on the new items
  quotationData.terms = filterTerms(quotationData)

  // Re-render summary and regenerate PDF
  renderSummaryAndRefresh()
  showAlert("Quotation updated successfully!", "success")
  showLoading(false)
}

async function downloadPDF() {
  try {
    showLoading(true)

    if (pdfBase64) {
      // Create download link
      const link = document.createElement("a")
      link.href = `data:application/pdf;base64,${pdfBase64}`
      link.download = `quotation_${quotationData.customerName.replace(/\s+/g, "_")}_${new Date().toLocaleDateString("en-GB").replace(/\//g, "-")}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      showAlert("PDF downloaded successfully!", "success")
    } else {
      // Fallback: Generate PDF if not available
      try {
        pdfBase64 = await generatePDFWithJSPDF(quotationData)
        const link = document.createElement("a")
        link.href = `data:application/pdf;base64,${pdfBase64}`
        link.download = `quotation_${quotationData.customerName.replace(/\s+/g, "_")}_${new Date().toLocaleDateString("en-GB").replace(/\//g, "-")}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        showAlert("PDF downloaded successfully!", "success")
      } catch (error) {
        console.error("PDF generation failed:", error)
        showAlert("PDF generation failed. Please try again or contact support.", "danger")
      }
    }

    showLoading(false)
  } catch (error) {
    console.error("Error:", error)
    showAlert("PDF download failed. Please try again.", "danger")
    showLoading(false)
  }
}

async function shareOnWhatsApp() {
  try {
    showLoading(true)

    if (!pdfBase64) {
      showAlert("Please generate a quotation first.", "danger")
      showLoading(false)
      return
    }

    const customerMobile = quotationData.customerMobile
    let phoneNumber = customerMobile.replace(/\D/g, "")
    if (phoneNumber.length === 10) {
      phoneNumber = "91" + phoneNumber
    }

    // Create PDF blob for sharing
    let pdfBlob = null
    try {
      const binaryString = atob(pdfBase64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      pdfBlob = new Blob([bytes], { type: "application/pdf" })
    } catch (error) {
      console.error("Error creating PDF blob:", error)
      throw new Error("Failed to prepare PDF for sharing")
    }

    // Try to use Web Share API if available (for mobile devices)
    if (navigator.share && pdfBlob) {
      try {
        const file = new File([pdfBlob], `quotation_${quotationData.customerName.replace(/\s+/g, "_")}.pdf`, {
          type: "application/pdf",
        })

        await navigator.share({
          files: [file],
        })

        // Open WhatsApp chat after successful share
        const whatsappUrl = `https://wa.me/${phoneNumber}`
        window.open(whatsappUrl, "_blank")

        showLoading(false)
        showAlert("PDF shared successfully! WhatsApp chat opened.", "success")
        return
      } catch (shareError) {
        console.log("Web Share API failed, falling back to download:", shareError)
      }
    }

    // Fallback to manual download
    downloadPDF()
    
    // Open WhatsApp chat
    const whatsappUrl = `https://wa.me/${phoneNumber}`
    window.open(whatsappUrl, "_blank")

    showLoading(false)
    showAlert("PDF downloaded successfully! You can now share it on WhatsApp.", "success")
  } catch (error) {
    console.error("Error:", error)
    showAlert("Failed to prepare PDF for WhatsApp sharing. Please try again.", "danger")
    showLoading(false)
  }
}

async function sendViaEmail() {
  try {
    showLoading(true)

  const subject = `Quotation - One View Secure Technologies (${quotationData.customerName})`

  const branchLine = quotationData.branchInfo ? `${quotationData.branchInfo.name} - ${quotationData.branchInfo.phone}` : ""

  // Reduced email content with essential information only
  const body = `Dear ${quotationData.customerName},

Thank you for your interest in One View Secure Technologies!

QUOTATION SUMMARY:
• System: ${quotationData.systemType}
• Brand: ${quotationData.brand}
• Cameras: ${quotationData.cameraCount}
• Total Amount: ₹${quotationData.grandTotal.toFixed(2)}
${quotationData.discount > 0 ? `• Discount Applied: ₹${quotationData.discount.toFixed(2)}` : ""}

📎 Detailed PDF quotation is attached separately.

KEY TERMS:
• ${quotationData.terms.slice(0, 3).join("\n• ")}

CONTACT US:
${branchLine}
📧 sales@oneviewsecuretech.in
🌐 www.oneviewsecure.in

Best regards,
One View Secure Technologies Team`

    // Create PDF blob for attachment
    let pdfBlob = null
    if (pdfBase64) {
      try {
        const binaryString = atob(pdfBase64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        pdfBlob = new Blob([bytes], { type: "application/pdf" })
      } catch (error) {
        console.error("Error creating PDF blob:", error)
      }
    }

    // Try to use Web Share API if available (for mobile devices)
    if (navigator.share && pdfBlob) {
      try {
        const file = new File([pdfBlob], `quotation_${quotationData.customerName.replace(/\s+/g, "_")}.pdf`, {
          type: "application/pdf",
        })

        await navigator.share({
          title: subject,
          text: body,
          files: [file],
        })

        showLoading(false)
        showAlert("📧 Quotation shared successfully with PDF attachment!", "success")
        return
      } catch (shareError) {
        console.log("Web Share API failed, falling back to mailto:", shareError)
      }
    }

    // Fallback to mailto (PDF will need to be attached manually)
    const mailtoLink = `mailto:${quotationData.customerEmail || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = mailtoLink

    // Offer to download PDF for manual attachment
    setTimeout(() => {
      if (confirm("Email client opened. Would you like to download the PDF to attach manually?")) {
        downloadPDF()
      }
    }, 1000)

    showLoading(false)
    showAlert("📧 Email client opened! Download PDF separately to attach.", "info")
  } catch (error) {
    console.error("Error with email sharing:", error)
    showLoading(false)
    showAlert("❌ Failed to share via email. Please try again.", "danger")
  }
}

// Event listeners and initialization
document.addEventListener("DOMContentLoaded", () => {
  updateCameraOptions()
  updateDiscountInfo()

  document.querySelectorAll('input[name="systemType"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      updateCameraOptions()
      updateDiscountInfo()
    })
  })

  const brandSelect = document.getElementById("brand")
  if (brandSelect) {
    brandSelect.addEventListener("change", updateDiscountInfo)
  }

  const cameraTypeSelect = document.getElementById("cameraType")
  if (cameraTypeSelect) {
    cameraTypeSelect.addEventListener("change", updateBrandOptionsForCamera)
  }
})
