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
            const product = products.find(p => p.id == select.value);
            formData.items.push({
              id: select.value,
              name: select.options[select.selectedIndex].text,
              amount: parseFloat(input.value) || 0,
              defaultPrice: product ? product.price : 0
            });
          }
        });
        break;
    }
  }

  // Обновление итоговой информации
  function updateSummary() {
    // Обновляем подрядчика
    const contractorElement = document.querySelector('[data-summary="contractor"]');
    if (contractorElement) {
      contractorElement.textContent = `Будет выбран при выплате - ${formatCurrency(formData.contractorAmount)}`;
    }

    // Обновляем товары
    const productsElement = document.querySelector('[data-summary="products"]');
    const totalItemsAmount = formData.items.reduce((sum, item) => sum + item.amount, 0);
    if (productsElement) {
      productsElement.textContent = formatCurrency(totalItemsAmount);
    }

    // Обновляем комиссию
    const commissionElement = document.querySelector('[data-summary="commission"]');
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
    const totalItemsAmount = formData.items.reduce((sum, item) => sum + item.amount, 0);
    return formData.contractorAmount + totalItemsAmount + formData.commission;
  }

  // Форматирование валюты
  function formatCurrency(amount) {
    return new Intl.NumberFormat("ru-RU", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + " ₽";
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
          ${products.map(item => 
            `<option data-price="${item.price}" value="${item.id}">${item.name}</option>`
          ).join("")}
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

    select.addEventListener("change", function() {
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
    if (e.target.classList.contains("btn-remove") || e.target.closest(".btn-remove")) {
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
    if (e.target.classList.contains("btn-copy") || e.target.closest(".btn-copy")) {
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

      axios.post(
        "https://test.shamex.online/api/v1/payment/init",
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

      document.querySelector(".success-result p strong").textContent = formatCurrency(totalAmount);
    }
  });

  // Загрузка последних ссылок
  function loadRecentLinks() {
    axios.get("https://test.shamex.online/api/v1/payment/links", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then((res) => {
      const linksList = document.getElementById("recentLinksList");
      linksList.innerHTML = '';

      res.data.slice(0, 5).forEach(link => {
        const linkItem = document.createElement("div");
        linkItem.className = "link-item";
        
        let statusClass = "pending";
        let statusText = "Ожидание";
        
        if (link.status === "paid") {
          statusClass = "paid";
          statusText = "Оплачена";
        } else if (link.status === "expired") {
          statusClass = "expired";
          statusText = "Истекла";
        } else if (link.status === "active") {
          statusClass = "success";
          statusText = "Активна";
        }

        linkItem.innerHTML = `
          <div class="link-info">
            <h4>Заказ #${link.id}</h4>
            <p>${formatCurrency(link.totalAmount)} • ${formatTime(link.createdAt)}</p>
          </div>
          <div class="link-status ${statusClass}">${statusText}</div>
        `;
        
        linksList.appendChild(linkItem);
      });
    })
    .catch(err => {
      console.error("Ошибка загрузки ссылок:", err);
    });
  }

  // Форматирование времени
  function formatTime(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "только что";
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} час назад`;
    return `${diffDays} дней назад`;
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
    itemsContainer.innerHTML = '';
    itemsContainer.appendChild(createNomenclatureItem());
  }

  function validateStep(step) {
    switch (step) {
      case 1:
        const contractorAmount = document.getElementById("contractorAmount");
        if (!contractorAmount.value || parseFloat(contractorAmount.value) <= 0) {
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
    axios.get("https://test.shamex.online/api/v1/nomenclature")
      .then((res) => {
        products.length = 0;
        products.push(...res.data);
        
        // Обновляем существующие селекты
        document.querySelectorAll(".product-select").forEach(select => {
          const currentValue = select.value;
          select.innerHTML = '<option value="">-- Выберите товар --</option>' + 
            products.map(item => 
              `<option data-price="${item.price}" value="${item.id}">${item.name}</option>`
            ).join("");
          
          // Восстанавливаем выбранное значение если есть
          if (currentValue) {
            select.value = currentValue;
          }
        });
      })
      .catch(err => {
        console.error("Ошибка загрузки номенклатуры:", err);
      });
  }

  // Инициализация
  function init() {
    loadNomenclature();
    loadRecentLinks();
  }

  init();
});