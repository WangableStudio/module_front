document.addEventListener("DOMContentLoaded", function () {
  let contractorArr = [];
  // Элементы
  const payoutModal = document.getElementById("payoutModal");
  const cancelPayoutBtn = document.getElementById("cancelPayout");
  const confirmPayoutBtn = document.getElementById("confirmPayout");
  const closeModalBtn = payoutModal
    ? payoutModal.querySelector(".close")
    : null;
  const refreshBtn = document.getElementById("refreshBtn");
  const searchInput = document.getElementById("searchInput");
  const contractorSelect = document.getElementById("payoutContractorSelect");
  const payoutMethodGroup = document.getElementById("payoutMethodGroup");
  const payoutsTableBody = document.getElementById("payoutsTableBody");
  const statusFilter = document.getElementById("statusFilter");

  // Текущая выплата для обработки
  let currentPayoutId = null;
  let allPayouts = [];

  // Базовый URL API
  const API_BASE_URL = "http://localhost:3000/api/v1";

  // Инициализация
  function init() {
    setupEventListeners();
    loadContractors();
    loadPayouts();
  }

  // Загрузка выплат из API
  async function loadPayouts() {
    try {
      Loader.start("Загружаем данные...");
      const response = await axios.get(`${API_BASE_URL}/payment/`);
      allPayouts = response.data;
      renderPayoutsTable(allPayouts);
      Loader.hide();
    } catch (error) {
      console.error("Ошибка при загрузке выплат:", error);
      Toast.error("Не удалось загрузить выплаты");
      Loader.hide();
    }
  }

  // Загрузка подрядчиков из API
  async function loadContractors() {
    try {
      const contractors = await axios.get(`${API_BASE_URL}/contractors/`);
      contractorArr = contractors.data;

      populateContractorsSelect(contractors.data);
    } catch (error) {
      console.error("Ошибка при загрузке подрядчиков:", error);
    }
  }

  // Заполнение выпадающего списка подрядчиков
  function populateContractorsSelect(contractors) {
    if (!contractorSelect) return;

    contractorSelect.innerHTML =
      '<option value="">-- Выберите подрядчика --</option>';

    const legalEntities = contractors.filter(
      (c) => c.type === "ip" || c.type === "ooo"
    );
    const individuals = contractors.filter(
      (c) => c.type === "individual" || c.type === "self_employed"
    );

    if (legalEntities.length > 0) {
      contractorSelect.innerHTML += `<optgroup label="Юридические лица">`;
      legalEntities.forEach((contractor) => {
        contractorSelect.innerHTML += `
                    <option value="${contractor.id}" data-type="legal">
                        ${contractor.name} (ИНН ${contractor.inn})
                    </option>
                `;
      });
      contractorSelect.innerHTML += `</optgroup>`;
    }

    if (individuals.length > 0) {
      contractorSelect.innerHTML += `<optgroup label="Физические лица">`;
      individuals.forEach((contractor) => {
        contractorSelect.innerHTML += `
                    <option value="${contractor.id}" data-type="individual">
                        ${contractor.name} (ИНН ${contractor.inn})
                    </option>
                `;
      });
      contractorSelect.innerHTML += `</optgroup>`;
    }
  }

  // Отображение выплат в таблице
  function renderPayoutsTable(payouts) {
    if (!payoutsTableBody) return;

    payoutsTableBody.innerHTML = "";

    if (payouts.length === 0) {
      payoutsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-money-bill-wave"></i>
                            <p>Нет данных о выплатах</p>
                        </div>
                    </td>
                </tr>
            `;
      return;
    }

    payouts.forEach((payout) => {
      const row = createPayoutRow(payout);
      payoutsTableBody.appendChild(row);
    });
  }

  // Создание строки таблицы для выплаты
  function createPayoutRow(payout) {
    const row = document.createElement("tr");

    // Форматирование даты
    const createdAt = new Date(payout.createdAt);
    const formattedDate = createdAt.toLocaleDateString("ru-RU");
    const formattedTime = createdAt.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Определение статуса
    const statusInfo = getStatusInfo(payout);

    // Информация о подрядчике
    const contractorInfo = getContractorInfo(payout);

    row.innerHTML = `
            <td>
                <div class="id-cell">
                    <span class="id-number">#${payout.id}</span>
                </div>
            </td>
            <td>
                <div class="contractor-info">
                    <div class="contractor-name">${contractorInfo.name}</div>
                    <div class="contractor-details">${
                      contractorInfo.details
                    }</div>
                </div>
            </td>
            <td class="amount">${formatAmount(payout.contractorAmount)} ₽</td>
            <td>
                <span class="status-badge ${statusInfo.className}">
                    <i class="fas ${statusInfo.icon}"></i>
                    ${statusInfo.text}
                </span>
            </td>
            <td class="client-fio">${payout.clientFio ? payout.clientFio : "-"}</td>
            <td class="client-email">${payout.clientEmail? payout.clientEmail : "-"}</td>
            <td>
                <div class="date-cell">
                    <div class="date">${formattedDate}</div>
                    <div class="time">${formattedTime}</div>
                </div>
            </td>
            <td>
                ${payout.agreement ? "Да" : "Нет"}    
            </td>
            <td>
                <div class="action-buttons">
                    ${getActionButtons(payout)}
                </div>
            </td>
        `;

    return row;
  }

  // Получение информации о статусе
  function getStatusInfo(payout) {
    if (payout.isPaidOut) {
      return {
        className: "status-paid",
        icon: "fa-check-circle",
        text: "Выплачено",
      };
    } else if (payout.isConfirmed && !payout.isPaidOut) {
      return {
        className: "status-pending",
        icon: "fa-clock",
        text: "Ожидает выплаты",
      };
    } else if (payout.status == "REJECTED") {
      return {
        className: "status-failed",
        icon: "fa-exclamation-circle",
        text: "Платеж отменен",
      };
    } else if (payout.status == "NEW") {
      return {
        className: "status-pending",
        icon: "fa-clock",
        text: "Не оплачена",
      };
    } else if(payout.status == "AUTHORIZED"){
      return {
        className: "status-pending",
        icon: "fa-clock",
        text: "На проверке",
      };
    }else {
      return {
        className: "status-failed",
        icon: "fa-exclamation-circle",
        text: "Ошибка",
      };
    }
  }

  // Получение информации о подрядчике
  function getContractorInfo(payout) {
    if (payout.contractorId) {
      console.log(contractorArr);

      const contractorName = contractorArr.find(
        (contractor) => contractor.id == payout.contractorId
      ).name;
      console.log(contractorName);

      return {
        name: "Подрядчик",
        details: `Имя: ${contractorName}`,
      };
    } else {
      return {
        name: "Не назначен",
        details: "Выберите подрядчика",
      };
    }
  }

  // Получение кнопок действий
  function getActionButtons(payout) {
    if (!payout.isPaidOut && payout.isConfirmed) {
      return `
                <button class="btn btn-sm btn-primary payout-btn" data-id="${payout.id}">
                    <i class="fas fa-play"></i>
                    Выплатить
                </button>
            `;
    } else if (!payout.isConfirmed && payout.status == "NEW") {
      return `
                <button class="btn btn-sm btn-primary copy-btn" data-url="${payout.clientEmail && payout.clientFio ? 
                  payout.sbpUrl || payout.paymentUrl : payout.url
                }">
                    <i class="fas fa-copy"></i>
                </button>
            `;
    } else if(payout.status == "AUTHORIZED"){
      return `
                <button class="btn btn-sm btn-outline confirm-btn" data-id="${payout.id}">
                    <i class="fas fa-check"></i>
                </button>
            `
    } {
      return `
                <button class="btn btn-sm btn-outline details-btn" data-id="${payout.id}">
                    <i class="fas fa-eye"></i>
                </button>
            `;
    }
  }

  // Форматирование суммы
  function formatAmount(amount) {
    return parseFloat(amount).toLocaleString("ru-RU");
  }

  // Настройка обработчиков событий
  function setupEventListeners() {
    // Кнопки выплаты в таблице
    document.addEventListener("click", function (e) {
      if (e.target.closest(".payout-btn")) {
        const btn = e.target.closest(".payout-btn");
        const payoutId = btn.dataset.id;
        openPayoutModal(payoutId);
      }

      if (e.target.closest(".details-btn")) {
        const btn = e.target.closest(".details-btn");
        const payoutId = btn.dataset.id;
        showPayoutDetails(payoutId);
      }
      if (e.target.closest(".copy-btn")) {
        const btn = e.target.closest(".copy-btn");
        const payoutUrl = btn.dataset.url;

        if (payoutUrl) {
          navigator.clipboard.writeText(payoutUrl).then(() => {
            Toast.success("Ссылка успешно скопирована");
          });
        } else {
          console.warn("Атрибут data-url не найден");
        }
      }

      if (e.target.closest(".confirm-btn")) {
        const btn = e.target.closest(".confirm-btn");
        const payoutId = btn.dataset.id;
        confirmPayout(payoutId);
      }
    });

    // Изменение выбора подрядчика
    contractorSelect.addEventListener("change", function () {
      const selectedOption = this.options[this.selectedIndex];
      const contractorType = selectedOption.dataset.type;

      // Показываем/скрываем выбор способа выплаты для физлиц
      if (contractorType === "individual") {
        payoutMethodGroup.style.display = "block";
      } else {
        payoutMethodGroup.style.display = "none";
      }
    });

    // Модальное окно выплаты
    closeModalBtn.addEventListener("click", closePayoutModal);
    cancelPayoutBtn.addEventListener("click", closePayoutModal);
    confirmPayoutBtn.addEventListener("click", processPayout);

    // Фильтры и действия
    refreshBtn.addEventListener("click", refreshData);
    searchInput.addEventListener("input", handleSearch);
    statusFilter.addEventListener("change", applyFilters);

    // Закрытие модального окна при клике вне
    window.addEventListener("click", function (e) {
      if (e.target === payoutModal) {
        closePayoutModal();
      }
    });
  }

  // Открытие модального окна выплаты
  function openPayoutModal(payoutId) {
    currentPayoutId = payoutId;

    // Находим данные выплаты
    const payout = allPayouts.find((p) => p.id === payoutId);
    if (payout) {
      document.getElementById("modalPayoutId").textContent = `#${payout.id}`;
      document.getElementById(
        "modalPayoutAmount"
      ).textContent = `${formatAmount(payout.contractorAmount)} ₽`;
    }

    // Сбрасываем форму
    contractorSelect.value = "";
    payoutMethodGroup.style.display = "none";
    document.querySelector(
      'input[name="payoutMethod"][value="sbp"]'
    ).checked = true;

    payoutModal.style.display = "block";
    document.body.style.overflow = "hidden";
  }

  // Закрытие модального окна выплаты
  function closePayoutModal() {
    payoutModal.style.display = "none";
    document.body.style.overflow = "auto";
    currentPayoutId = null;
  }

  // Обработка выплаты
  async function processPayout() {
    const contractorId = contractorSelect.value;
    const contractorName =
      contractorSelect.options[contractorSelect.selectedIndex].text;
    const contractorType =
      contractorSelect.options[contractorSelect.selectedIndex].dataset.type;

    if (!contractorId) {
      Toast.error("Выберите подрядчика для выплаты");
      return;
    }

    let payoutMethod = "partnerId";
    if (contractorType === "individual" || contractorType === "self_employed") {
      const methodRadio = document.querySelector(
        'input[name="payoutMethod"]:checked'
      );
      if (!methodRadio) {
        Toast.error("Выберите способ выплаты");
        return;
      }
      payoutMethod = methodRadio.value;
    }

    confirmPayoutBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Обработка...';
    confirmPayoutBtn.disabled = true;

    try {
      await axios.post("http://localhost:3000/api/v1/payment/payout", {
        paymentId: currentPayoutId,
        contractorId: contractorId,
        payoutMethod: payoutMethod,
      });
      Toast.success("Выплата успешно выполнена");
      closePayoutModal();
      // Обновляем данные
      loadPayouts();
    } catch (error) {
      console.error("Ошибка при выполнении выплаты:", error);
      Toast.error("Не удалось выполнить выплату");
    } finally {
      // Восстанавливаем кнопку
      confirmPayoutBtn.innerHTML =
        '<i class="fas fa-check"></i> Подтвердить выплату';
      confirmPayoutBtn.disabled = false;
    }
  }

  // Показать детали выплаты
  function showPayoutDetails(payoutId) {
    const payout = allPayouts.find((p) => p.id === payoutId);
    if (!payout) return;

    const itemsList = payout.items
      .map((item) => `${item.name}: ${item.amount} ₽`)
      .join("\n");

    const details = `
ID выплаты: #${payout.id}
ID заказа: ${payout.orderId}
Сумма подрядчика: ${formatAmount(payout.contractorAmount)} ₽
Комиссия: ${formatAmount(payout.commission)} ₽
Общая сумма: ${formatAmount(payout.totalAmount)} ₽
Статус: ${payout.status}
Способ оплаты: ${payout.paymentMethod}
Товары:
${itemsList}
Дата создания: ${new Date(payout.createdAt).toLocaleString("ru-RU")}
        `.trim();

    alert(details); // Можно заменить на красивый toast или модальное окно
  }

  // Обновление данных
  function refreshData() {
    loadPayouts();
    Toast.success("Данные обновлены");
  }

  function confirmPayout(payoutId) {
    axios
      .post("http://localhost:3000/api/v1/payment/confirm", {
        paymentId: payoutId,
      })
      .then((response) => {
        Toast.success("Выплата подтверждена");
        loadPayouts();
      })
      .catch((error) => {
        Toast.error("Не удалось подтвердить выплату");
      });
  }

  // Применение фильтров
  function applyFilters() {
    const statusValue = statusFilter.value;
    const searchTerm = searchInput.value.toLowerCase();

    let filteredPayouts = allPayouts;

    // Фильтрация по статусу
    if (statusValue) {
      filteredPayouts = filteredPayouts.filter((payout) => {
        if (statusValue === "pending")
          return payout.isConfirmed && !payout.isPaidOut;
        if (statusValue === "paid") return payout.isPaidOut;
        if (statusValue === "failed") return !payout.isConfirmed;
        return true;
      });
    }

    // Фильтрация по поиску
    if (searchTerm) {
      filteredPayouts = filteredPayouts.filter(
        (payout) =>
          payout.id.toLowerCase().includes(searchTerm) ||
          (payout.orderId &&
            payout.orderId.toLowerCase().includes(searchTerm)) ||
          payout.contractorAmount.includes(searchTerm) ||
          payout.status.toLowerCase().includes(searchTerm)
      );
    }

    renderPayoutsTable(filteredPayouts);
    Toast.success("Фильтры применены");
  }

  // Поиск
  function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();

    if (searchTerm.length === 0) {
      applyFilters(); // Применяем текущие фильтры
      return;
    }

    if (searchTerm.length > 2) {
      applyFilters(); // Применяем фильтры с поиском
    }
  }

  // Запуск приложения
  init();
});
