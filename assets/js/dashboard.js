document.addEventListener("DOMContentLoaded", function () {
  // Элементы модального окна
  const modal = document.getElementById("generationModal");
  const generateBtn = document.getElementById("generateLinkBtn");
  const closeBtn = document.querySelector(".close");
  const generateFinalBtn = document.getElementById("generateFinalBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const products = [];
  const token = localStorage.getItem("token");

  // Шаги и прогресс
  const progressSteps = document.querySelectorAll(".progress-step");
  const stepContents = document.querySelectorAll(".step-content");
  let currentStep = 1;

  // Данные формы
  let formData = {
    contractorAmount: 0,
    commission: 0,
    items: [],
  };

  // Открытие модального окна
  generateBtn.addEventListener("click", function () {
    modal.style.display = "block";
    resetSteps();
    document.body.style.overflow = "hidden";
  });

  // Закрытие модального окна
  function closeModal() {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
  }

  closeBtn.addEventListener("click", closeModal);
  closeModalBtn.addEventListener("click", closeModal);

  // Закрытие при клике вне окна
  window.addEventListener("click", function (event) {
    if (event.target === modal) {
      closeModal();
    }
  });

  // Кнопки "Далее"
  document.querySelectorAll(".btn-next").forEach((btn) => {
    btn.addEventListener("click", function () {
      if (validateStep(currentStep)) {
        saveStepData(currentStep);
        currentStep++;

        // Если переходим на шаг подтверждения, обновляем данные
        if (currentStep === 3) {
          updateSummary();
        }

        updateProgress();
      }
    });
  });

  // Кнопки "Назад"
  document.querySelectorAll(".btn-prev").forEach((btn) => {
    btn.addEventListener("click", function () {
      currentStep--;
      updateProgress();
    });
  });

  // Сохранение данных шага
  function saveStepData(step) {
    switch (step) {
      case 1:
        const contractorAmount = document.getElementById("contractorAmount");
        formData.contractorAmount = parseFloat(contractorAmount.value) || 0;
        break;

      case 2:
        const commissionAmount = document.getElementById("commissionAmount");
        formData.commission = parseFloat(commissionAmount.value) || 0;

        // Сохраняем товары
        formData.items = [];
        const items = document.querySelectorAll(".nomenclature-item");

        items.forEach((item) => {
          const select = item.querySelector(".product-select");
          const input = item.querySelector(".product-amount");

          if (select.value && input.value) {
            const product = products.find((p) => p.id == select.value);
            formData.items.push({
              id: select.value,
              name: select.options[select.selectedIndex].text,
              amount: parseFloat(input.value) || 0,
              defaultPrice: product ? product.price : 0,
            });
          }
        });
        break;
    }
  }

  // Обновление итоговой информации
  function updateSummary() {
    // Обновляем подрядчика
    const contractorElement = document.querySelector(
      '[data-summary="contractor"]'
    );
    if (contractorElement) {
      contractorElement.textContent = `Будет выбран при выплате - ${formatCurrency(
        formData.contractorAmount
      )}`;
    }

    // Обновляем товары
    const productsElement = document.querySelector('[data-summary="products"]');
    const totalItemsAmount = formData.items.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    if (productsElement) {
      productsElement.textContent = formatCurrency(totalItemsAmount);
    }

    // Обновляем комиссию
    const commissionElement = document.querySelector(
      '[data-summary="commission"]'
    );
    if (commissionElement) {
      commissionElement.textContent = formatCurrency(formData.commission);
    }

    // Обновляем детализацию товаров
    const itemsContainer = document.querySelector(".nomenclature-summary");
    if (itemsContainer) {
      itemsContainer.innerHTML = "";

      formData.items.forEach((item) => {
        const itemElement = document.createElement("div");
        itemElement.className = "nomenclature-summary-item";
        itemElement.innerHTML = `
          <span>${item.name}</span>
          <span>${formatCurrency(item.amount)}</span>
        `;
        itemsContainer.appendChild(itemElement);
      });
    }

    // Обновляем итоговую сумму
    const totalAmount = calculateTotal();
    const totalElement = document.querySelector(".total-number");
    if (totalElement) {
      totalElement.textContent = formatCurrency(totalAmount);
    }
  }

  // Расчет общей суммы
  function calculateTotal() {
    const totalItemsAmount = formData.items.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    return formData.contractorAmount + totalItemsAmount + formData.commission;
  }

  // Форматирование валюты
  function formatCurrency(amount) {
    // Если amount строка, преобразуем в число
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

    return (
      new Intl.NumberFormat("ru-RU", {
        style: "decimal",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(numAmount) + " ₽"
    );
  }

  // Добавление товара
  document.querySelector(".btn-add").addEventListener("click", function () {
    const newItem = createNomenclatureItem();
    document.querySelector(".nomenclature-list").appendChild(newItem);
  });

  // Создание элемента товара
  function createNomenclatureItem() {
    const newItem = document.createElement("div");
    newItem.className = "nomenclature-item";
    newItem.innerHTML = `
      <div class="select-wrapper">
        <select class="form-select product-select">
          <option value="">-- Выберите товар --</option>
          ${products
            .map(
              (item) =>
                `<option data-price="${item.price}" value="${item.id}">${item.name}</option>`
            )
            .join("")}
        </select>
        <i class="fas fa-chevron-down"></i>
      </div>
      <div class="price-display">
        <span class="price-label">Цена:</span>
        <span class="price-value">0 ₽</span>
      </div>
      <input type="number" class="form-input product-amount" placeholder="Введите сумму" min="1">
      <button class="btn btn-remove">
        <i class="fas fa-times"></i>
      </button>
    `;

    // Обработчик выбора товара
    const select = newItem.querySelector(".product-select");
    const priceDisplay = newItem.querySelector(".price-value");
    const amountInput = newItem.querySelector(".product-amount");

    select.addEventListener("change", function () {
      const selectedOption = this.options[this.selectedIndex];
      const price = selectedOption.dataset.price || 0;
      priceDisplay.textContent = formatCurrency(price);

      // Устанавливаем цену по умолчанию в поле ввода
      if (price > 0 && !amountInput.value) {
        amountInput.value = price;
      }
    });

    // Обработчик удаления
    newItem.querySelector(".btn-remove").addEventListener("click", function () {
      newItem.remove();
    });

    return newItem;
  }

  // Удаление позиции номенклатуры
  document.addEventListener("click", function (e) {
    if (
      e.target.classList.contains("btn-remove") ||
      e.target.closest(".btn-remove")
    ) {
      const item = e.target.closest(".nomenclature-item");
      if (item && document.querySelectorAll(".nomenclature-item").length > 1) {
        item.remove();
      } else {
        Toast.warning("Должен остаться хотя бы один товар");
      }
    }
  });

  // Копирование ссылки
  document.addEventListener("click", function (e) {
    if (
      e.target.classList.contains("btn-copy") ||
      e.target.closest(".btn-copy")
    ) {
      const input = document.querySelector(".generated-link input");
      input.select();
      document.execCommand("copy");

      // Визуальное подтверждение
      const btn = e.target.closest(".btn-copy");
      const originalHtml = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i>';
      btn.style.background = "var(--success)";

      setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.style.background = "";
      }, 2000);
    }
  });

  // Финальная генерация ссылки
  generateFinalBtn.addEventListener("click", function () {
    if (validateStep(currentStep)) {
      saveStepData(currentStep);
      updateSummary();

      Loader.start("Создаем ссылку...");

      const totalAmount = calculateTotal();

      axios
        .post(
          "http://91.143.16.246:3000/api/v1/payment/init",
          {
            contractorAmount: formData.contractorAmount,
            commission: formData.commission,
            items: formData.items,
            totalAmount: totalAmount,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )
        .then((res) => {
          const linkInput = document.querySelector(".generated-link input");
          linkInput.value = res.data.paymentUrl;
          currentStep = 4;
          updateProgress();

          // Обновляем список последних ссылок
          loadRecentLinks();
        })
        .catch((err) => {
          console.error("Ошибка создания ссылки:", err);
          Toast.error("Ошибка при создании ссылки");
        })
        .finally(() => {
          Loader.hide();
        });

      document.querySelector(".success-result p strong").textContent =
        formatCurrency(totalAmount);
    }
  });

  // Загрузка последних ссылок
  // Загрузка последних ссылок
  function loadRecentLinks() {
    const linksList = document.querySelector(".links-list");

    // Показываем индикатор загрузки
    linksList.innerHTML = '<div class="loading">Загрузка...</div>';

    axios
      .get("http://91.143.16.246:3000/api/v1/payment", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      .then((res) => {
        const links = res.data.sort((a, b) => b.id - a.id);
        linksList.innerHTML = "";

        if (links.length === 0) {
          linksList.innerHTML =
            '<div class="no-data">Нет созданных ссылок</div>';
          return;
        }

        // Берем последние 5 ссылок
        links.slice(0, 3).forEach((link) => {
          const linkItem = document.createElement("div");
          linkItem.className = "link-item";

          let statusClass = "pending";
          let statusText = "Ожидание";

          // Определяем статус на основе данных из API
          if (!link.isPaidOut && link.isConfirmed) {
            statusClass = "paid";
            statusText = "Оплачена";
          } else if (link.status === "REJECTED") {
            statusClass = "expired";
            statusText = "Отклонена";
          } else if (link.status === "NEW") {
            statusClass = "expired";
            statusText = "Не оплачена";
          } else if (link.isPaidOut) {
            statusClass = "success";
            statusText = "Выплачена";
          }

          linkItem.innerHTML = `
        <div class="link-info">
          <h4>Заказ ${link.orderId}</h4>
          <p>${formatCurrency(link.totalAmount)} • ${formatTime(
            link.createdAt
          )}</p>
        </div>
        <div class="link-status ${statusClass}">${statusText}</div>
      `;

          // Добавляем обработчик клика для копирования ссылки
          linkItem.addEventListener("click", function () {
            copyToClipboard(link.paymentUrl);
            Toast.success("Ссылка скопирована в буфер обмена");
          });

          linksList.appendChild(linkItem);
        });
      })
      .catch((err) => {
        console.error("Ошибка загрузки ссылок:", err);
        linksList.innerHTML = '<div class="error">Ошибка загрузки данных</div>';
      });
  }

  // Функция для копирования в буфер обмена
  function copyToClipboard(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  // Форматирование времени
  // Форматирование времени
  function formatTime(timestamp) {
    try {
      const now = new Date();
      const date = new Date(timestamp);
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "только что";
      if (diffMins < 60) return `${diffMins} мин назад`;
      if (diffHours < 24) return `${diffHours} час назад`;
      if (diffDays === 1) return "вчера";
      if (diffDays < 7) return `${diffDays} дней назад`;

      // Если прошло больше недели, показываем дату
      return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return "недавно";
    }
  }

  // Функции управления шагами
  function updateProgress() {
    progressSteps.forEach((step) => {
      const stepNum = parseInt(step.getAttribute("data-step"));
      step.classList.toggle("active", stepNum === currentStep);
    });

    stepContents.forEach((content) => {
      const contentStep = parseInt(content.getAttribute("data-step"));
      content.classList.toggle("active", contentStep === currentStep);
    });

    const modalBody = document.querySelector(".modal-body");
    modalBody.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetSteps() {
    currentStep = 1;
    formData = {
      contractorAmount: 0,
      commission: 0,
      items: [],
    };
    updateProgress();

    // Сброс полей
    document.getElementById("contractorAmount").value = "";
    document.getElementById("commissionAmount").value = "";

    // Оставляем только один товар и сбрасываем его
    const itemsContainer = document.querySelector(".nomenclature-list");
    itemsContainer.innerHTML = "";
    itemsContainer.appendChild(createNomenclatureItem());
  }

  function validateStep(step) {
    switch (step) {
      case 1:
        const contractorAmount = document.getElementById("contractorAmount");
        if (
          !contractorAmount.value ||
          parseFloat(contractorAmount.value) <= 0
        ) {
          Toast.error("Сумма для подрядчика должна быть больше 0");
          return false;
        }
        break;

      case 2:
        const commissionAmount = document.getElementById("commissionAmount");
        if (!commissionAmount.value || parseFloat(commissionAmount.value) < 0) {
          Toast.error("Укажите корректную комиссию");
          return false;
        }

        // Проверка товаров
        const items = document.querySelectorAll(".nomenclature-item");
        let valid = true;
        let hasItems = false;

        items.forEach((item) => {
          const select = item.querySelector(".product-select");
          const input = item.querySelector(".product-amount");

          if (select.value && input.value) {
            hasItems = true;
            if (parseFloat(input.value) <= 0) {
              valid = false;
            }
          }
        });

        if (!hasItems) {
          Toast.error("Добавьте хотя бы один товар");
          return false;
        }

        if (!valid) {
          Toast.warning("Сумма товара должна быть больше 0");
          return false;
        }
        break;
    }
    return true;
  }

  // Загрузка номенклатуры
  function loadNomenclature() {
    axios
      .get("http://91.143.16.246:3000/api/v1/nomenclature")
      .then((res) => {
        products.length = 0;
        products.push(...res.data);

        // Обновляем существующие селекты
        document.querySelectorAll(".product-select").forEach((select) => {
          const currentValue = select.value;
          select.innerHTML =
            '<option value="">-- Выберите товар --</option>' +
            products
              .map(
                (item) =>
                  `<option data-price="${item.price}" value="${item.id}">${item.name}</option>`
              )
              .join("");

          // Восстанавливаем выбранное значение если есть
          if (currentValue) {
            select.value = currentValue;
          }
        });
      })
      .catch((err) => {
        console.error("Ошибка загрузки номенклатуры:", err);
      });
  }

  function dashboard() {
    axios
      .get("http://91.143.16.246:3000/api/v1/user/dashboard")
      .then((res) => {
        document.getElementById("payments").textContent =
          res.data.payments.length;
        document.getElementById("total").textContent = res.data.total;
        document.getElementById("contractors").textContent =
          res.data.contractors.length;
        document.getElementById("nomenclatures").textContent =
          res.data.nomenclatures.length;
      })
      .catch((err) => {
        console.error("Ошибка загрузки номенклатуры:", err);
      });
  }

  // Переменные для аналитики
  let allPayments = [];
  let currentPage = 1;
  const itemsPerPage = 10;
  let currentFilter = "all";
  let currentSort = "newest";
  let dateRange = { start: null, end: null };

  // Загрузка данных для аналитики
  // Загрузка данных для аналитики
  function loadAnalyticsData() {
    const tableBody = document.getElementById("analyticsTableBody");

    console.log("Начало загрузки аналитики...");
    tableBody.innerHTML =
      '<tr><td colspan="9" class="loading">Загрузка данных...</td></tr>';

    // Проверяем наличие токена
    if (!token) {
      console.error("Токен не найден");
      tableBody.innerHTML =
        '<tr><td colspan="9" class="error">Ошибка авторизации</td></tr>';
      return;
    }

    axios
      .get("http://91.143.16.246:3000/api/v1/payment", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      .then((res) => {
        console.log("Данные получены:", res.data);

        if (!res.data || !Array.isArray(res.data)) {
          console.error("Некорректный формат данных:", res.data);
          tableBody.innerHTML =
            '<tr><td colspan="9" class="error">Некорректный формат данных</td></tr>';
          return;
        }

        allPayments = res.data;
        console.log(`Загружено ${allPayments.length} платежей`);

        // Сортируем по дате создания (сначала новые)
        sortPayments("newest");

        // Обновляем статистику
        updateAnalyticsStats();

        // Отображаем данные
        renderAnalyticsTable();
      })
      .catch((err) => {
        console.error("Ошибка загрузки аналитики:", err);
        let errorMessage = "Ошибка загрузки данных";

        if (err.response) {
          console.error("Статус ошибки:", err.response.status);
          console.error("Данные ошибки:", err.response.data);

          if (err.response.status === 401) {
            errorMessage = "Ошибка авторизации. Проверьте токен.";
          } else if (err.response.status === 403) {
            errorMessage = "Доступ запрещен";
          } else if (err.response.status === 404) {
            errorMessage = "API endpoint не найден";
          }
        } else if (err.request) {
          console.error("Не получен ответ от сервера");
          errorMessage = "Нет соединения с сервером";
        }

        tableBody.innerHTML = `<tr><td colspan="9" class="error">${errorMessage}</td></tr>`;
      });
  }

  // Обновление статистики
  function updateAnalyticsStats() {
    const filteredPayments = filterPayments();
    const totalAmount = filteredPayments.reduce(
      (sum, payment) => sum + parseFloat(payment.totalAmount),
      0
    );
    const totalCommission = filteredPayments.reduce(
      (sum, payment) => sum + parseFloat(payment.commission),
      0
    );
    const paidCount = filteredPayments.filter(
      (payment) => !payment.isPaidOut && payment.isConfirmed
    ).length;
    const paidOutCount = filteredPayments.filter(
      (payment) => payment.isPaidOut
    ).length;

    const statsSummary = document.getElementById("statsSummary");
    statsSummary.innerHTML = `
    <div class="stat-card-small">
      <h4>Общая сумма</h4>
      <div class="stat-number">${formatCurrency(totalAmount)}</div>
    </div>
    <div class="stat-card-small">
      <h4>Общая комиссия</h4>
      <div class="stat-number">${formatCurrency(totalCommission)}</div>
    </div>
    <div class="stat-card-small">
      <h4>Оплаченные</h4>
      <div class="stat-number">${paidCount}</div>
    </div>
    <div class="stat-card-small">
      <h4>Выплаченные</h4>
      <div class="stat-number">${paidOutCount}</div>
    </div>
  `;
  }

  // Сортировка платежей
  function sortPayments(sortType) {
    currentSort = sortType;

    switch (sortType) {
      case "newest":
        allPayments.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        break;
      case "oldest":
        allPayments.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        break;
      case "amount_high":
        allPayments.sort(
          (a, b) => parseFloat(b.totalAmount) - parseFloat(a.totalAmount)
        );
        break;
      case "amount_low":
        allPayments.sort(
          (a, b) => parseFloat(a.totalAmount) - parseFloat(b.totalAmount)
        );
        break;
    }
  }

  // Фильтрация платежей
  function filterPayments() {
    let filtered = allPayments;

    // Фильтр по статусу
    switch (currentFilter) {
      case "paid":
        filtered = filtered.filter(
          (payment) => !payment.isPaidOut && payment.isConfirmed
        );
        break;
      case "confirmed":
        filtered = filtered.filter((payment) => payment.isConfirmed);
        break;
      case "new":
        filtered = filtered.filter((payment) => payment.status === "NEW");
        break;
      case "rejected":
        filtered = filtered.filter((payment) => payment.status === "REJECTED");
        break;
      case "paidout":
        filtered = filtered.filter((payment) => payment.isPaidOut);
        break;
    }

    // Фильтр по дате
    if (dateRange.start) {
      filtered = filtered.filter(
        (payment) => new Date(payment.createdAt) >= new Date(dateRange.start)
      );
    }

    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Конец дня
      filtered = filtered.filter(
        (payment) => new Date(payment.createdAt) <= endDate
      );
    }

    return filtered;
  }

  function formatDateTime(timestamp) {
    try {
      if (!timestamp) return "Не указана";

      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "Неверная дата";

      return date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Ошибка форматирования даты:", error);
      return "Ошибка даты";
    }
  }
  // Отображение таблицы
  function renderAnalyticsTable() {
    const tableBody = document.getElementById("analyticsTableBody");
    const filteredPayments = filterPayments();
    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

    console.log(
      `Отображение таблицы: ${filteredPayments.length} платежей после фильтрации`
    );

    // Корректируем текущую страницу если нужно
    if (currentPage > totalPages) {
      currentPage = Math.max(1, totalPages);
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPayments = filteredPayments.slice(startIndex, endIndex);

    console.log(
      `Текущая страница: ${currentPage}, показываем платежи с ${startIndex} по ${endIndex}`
    );

    if (currentPayments.length === 0) {
      console.log("Нет данных для отображения");
      tableBody.innerHTML =
        '<tr><td colspan="9" class="loading">Нет данных для отображения</td></tr>';
      renderPagination(totalPages);
      return;
    }

    tableBody.innerHTML = currentPayments
      .map((payment, index) => {
        console.log(`Обработка платежа ${index + 1}:`, payment);

        // Определяем статус по вашей логике
        let statusClass = "pending";
        let statusText = "Ожидание";

        if (!payment.isPaidOut && payment.isConfirmed) {
          statusClass = "paid";
          statusText = "Оплачена";
        } else if (payment.status === "REJECTED") {
          statusClass = "rejected";
          statusText = "Отклонена";
        } else if (payment.status === "NEW") {
          statusClass = "expired";
          statusText = "Не оплачена";
        } else if (payment.isPaidOut) {
          statusClass = "success";
          statusText = "Выплачена";
        }

        return `
      <tr>
        <td><strong>${payment.id || "N/A"}</strong></td>
        <td>${payment.orderId || "N/A"}</td>
        <td>
          <div style="font-weight: 500;">${
            payment.clientFio || "Не указан"
          }</div>
          <small style="color: var(--text-light);">${
            payment.clientEmail || ""
          }</small>
        </td>
        <td><strong>${formatCurrency(payment.totalAmount)}</strong></td>
        <td>${formatCurrency(payment.contractorAmount)}</td>
        <td>${formatCurrency(payment.commission)}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${formatDateTime(payment.createdAt)}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-outline" onclick="copyPaymentLink('${
              payment.sbpUrl || ""
            }')" title="Копировать ссылку">
              <i class="fas fa-copy"></i>
            </button>
            <button class="btn btn-sm btn-outline" onclick="viewPaymentDetails('${
              payment.id || ""
            }')" title="Просмотреть детали">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
      })
      .join("");

    renderPagination(totalPages);
    console.log("Таблица успешно отрисована");
  }

  // Пагинация
  function renderPagination(totalPages) {
    const pagination = document.getElementById("pagination");

    if (totalPages <= 1) {
      pagination.innerHTML = "";
      return;
    }

    let paginationHTML = "";

    // Кнопка "Назад"
    paginationHTML += `
    <button class="pagination-btn" ${currentPage === 1 ? "disabled" : ""} 
            onclick="changePage(${currentPage - 1})">
      <i class="fas fa-chevron-left"></i>
    </button>
  `;

    // Номера страниц
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        paginationHTML += `
        <button class="pagination-btn ${i === currentPage ? "active" : ""}" 
                onclick="changePage(${i})">
          ${i}
        </button>
      `;
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        paginationHTML += `<span class="pagination-dots">...</span>`;
      }
    }

    // Кнопка "Вперед"
    paginationHTML += `
    <button class="pagination-btn" ${
      currentPage === totalPages ? "disabled" : ""
    } 
            onclick="changePage(${currentPage + 1})">
      <i class="fas fa-chevron-right"></i>
    </button>
  `;

    pagination.innerHTML = paginationHTML;
  }

  // Смена страницы
  function changePage(page) {
    currentPage = page;
    renderAnalyticsTable();
  }

  // Функции для действий
  function copyPaymentLink(url) {
    // Создаем временный textarea для копирования
    const textarea = document.createElement("textarea");
    textarea.value = url;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      const successful = document.execCommand("copy");
      if (successful) {
        Toast.success("Ссылка скопирована в буфер обмена");
      } else {
        Toast.error("Не удалось скопировать ссылку");
      }
    } catch (err) {
      console.error("Ошибка копирования:", err);
      Toast.error("Ошибка при копировании");
    }

    document.body.removeChild(textarea);
  }

  // Просмотр деталей платежа
  window.viewPaymentDetails = function (paymentId) {
    const payment = allPayments.find((p) => p.id === paymentId);
    if (!payment) {
      Toast.error("Платеж не найден");
      return;
    }

    const modal = document.getElementById("paymentDetailsModal");
    const content = document.getElementById("paymentDetailsContent");

    // Определяем статус
    let statusClass = "pending";
    let statusText = "Ожидание";

    if (!payment.isPaidOut && payment.isConfirmed) {
      statusClass = "paid";
      statusText = "Оплачена";
    } else if (payment.status === "REJECTED") {
      statusClass = "rejected";
      statusText = "Отклонена";
    } else if (payment.status === "NEW") {
      statusClass = "expired";
      statusText = "Не оплачена";
    } else if (payment.isPaidOut) {
      statusClass = "success";
      statusText = "Выплачена";
    }

    content.innerHTML = `
    <div class="payment-details-grid">
      <div class="detail-section">
        <h4>Основная информация</h4>
        <div class="detail-item">
          <span class="detail-label">ID платежа:</span>
          <span class="detail-value">${payment.id}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Заказ:</span>
          <span class="detail-value">${payment.orderId}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Статус:</span>
          <span class="status-badge ${statusClass}">${statusText}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Дата создания:</span>
          <span class="detail-value">${formatDateTime(payment.createdAt)}</span>
        </div>
      </div>

      <div class="detail-section">
        <h4>Финансы</h4>
        <div class="detail-item">
          <span class="detail-label">Общая сумма:</span>
          <span class="detail-value">${formatCurrency(
            payment.totalAmount
          )}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Подрядчик:</span>
          <span class="detail-value">${formatCurrency(
            payment.contractorAmount
          )}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Комиссия:</span>
          <span class="detail-value">${formatCurrency(
            payment.commission
          )}</span>
        </div>
      </div>

      <div class="detail-section">
        <h4>Клиент</h4>
        <div class="detail-item">
          <span class="detail-label">ФИО:</span>
          <span class="detail-value">${payment.clientFio || "Не указан"}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Email:</span>
          <span class="detail-value">${
            payment.clientEmail || "Не указан"
          }</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Соглашение:</span>
          <span class="detail-value">${payment.agreement ? "Да" : "Нет"}</span>
        </div>
      </div>

      <div class="detail-section">
        <h4>Товары</h4>
        ${
          payment.items && payment.items.map
            ? payment.items
                .map(
                  (item) => `
            <div class="item-row">
              <span>${item.name || "Неизвестный товар"}</span>
              
              <strong>${formatCurrency(
                (item.amount || 0)
              )}</strong>
            </div>
          `
                )
                .join("")
            : '<div class="item-row">Товары не указаны</div>'
        }
      </div>
    </div>

    <div class="payment-links">
      <div class="payment-link-item">
        <input type="text" value="${payment.paymentUrl || ""}" readonly>
        <button class="btn btn-sm btn-outline" onclick="copyPaymentLink('${
          payment.paymentUrl || ""
        }')">
          <i class="fas fa-copy"></i>
        </button>
      </div>
      ${
        payment.sbpUrl
          ? `
        <div class="payment-link-item">
          <input type="text" value="${payment.sbpUrl}" readonly>
          <button class="btn btn-sm btn-outline" onclick="copyPaymentLink('${payment.sbpUrl}')">
            <i class="fas fa-copy"></i>
          </button>
        </div>
      `
          : ""
      }
    </div>
  `;

    // Показываем модальное окно
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
  };

  // Также сделайте глобальными другие необходимые функции
  window.copyPaymentLink = copyPaymentLink;
  window.changePage = changePage;

  // Инициализация фильтров и сортировки
  function initAnalyticsFilters() {
    // Фильтр по статусу
    document
      .getElementById("statusFilter")
      .addEventListener("change", function (e) {
        currentFilter = e.target.value;
        currentPage = 1;
        updateAnalyticsStats();
        renderAnalyticsTable();
      });

    // Сортировка
    document
      .getElementById("sortFilter")
      .addEventListener("change", function (e) {
        sortPayments(e.target.value);
        currentPage = 1;
        renderAnalyticsTable();
      });

    // Фильтр по дате
    document
      .getElementById("startDate")
      .addEventListener("change", function (e) {
        dateRange.start = e.target.value;
        currentPage = 1;
        updateAnalyticsStats();
        renderAnalyticsTable();
      });

    document.getElementById("endDate").addEventListener("change", function (e) {
      dateRange.end = e.target.value;
      currentPage = 1;
      updateAnalyticsStats();
      renderAnalyticsTable();
    });

    // Сброс фильтров
    document
      .getElementById("resetFilters")
      .addEventListener("click", function () {
        currentFilter = "all";
        currentSort = "newest";
        dateRange = { start: null, end: null };
        currentPage = 1;

        document.getElementById("statusFilter").value = "all";
        document.getElementById("sortFilter").value = "newest";
        document.getElementById("startDate").value = "";
        document.getElementById("endDate").value = "";

        sortPayments("newest");
        updateAnalyticsStats();
        renderAnalyticsTable();
      });

    // Закрытие модального окна деталей
    document
      .querySelector("#paymentDetailsModal .close")
      .addEventListener("click", function () {
        document.getElementById("paymentDetailsModal").style.display = "none";
        document.body.style.overflow = "auto";
      });

    // Закрытие модального окна при клике вне его
    window.addEventListener("click", function (event) {
      const modal = document.getElementById("paymentDetailsModal");
      if (event.target === modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
      }
    });
  }

  // Инициализация
  function init() {
    loadNomenclature();
    dashboard();
    loadRecentLinks();
    loadAnalyticsData(); // Загружаем данные аналитики
    initAnalyticsFilters(); // Инициализируем фильтры
  }

  init();
});
