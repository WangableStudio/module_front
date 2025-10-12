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
    contractor: null,
    contractorAmount: 0,
    companyAmount: 0,
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
        // Сохраняем данные перед переходом
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
        const contractorSelect = document.getElementById("contractorSelect");
        const contractorAmount = document.getElementById("contractorAmount");

        formData.contractor = {
          id: contractorSelect.value,
          name: contractorSelect.options[contractorSelect.selectedIndex].text,
        };
        formData.contractorAmount = parseFloat(contractorAmount.value) || 0;
        break;

      case 2:
        const companyAmount = document.getElementById("companyAmount");
        const commissionAmount = document.getElementById("commissionAmount");

        formData.companyAmount = parseFloat(companyAmount.value) || 0;
        formData.commission = parseFloat(commissionAmount.value) || 0;

        // Сохраняем товары
        formData.items = [];
        const items = document.querySelectorAll(".nomenclature-item");

        items.forEach((item) => {
          const select = item.querySelector("select");
          const input = item.querySelector("input");

          if (select.value && input.value) {
            formData.items.push({
              name: select.options[select.selectedIndex].text,
              amount: parseFloat(input.value) || 0,
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
    if (contractorElement && formData.contractor) {
      contractorElement.textContent = `${
        formData.contractor.name
      } - ${formatCurrency(formData.contractorAmount)}`;
    }

    // Обновляем компанию (включая товары)
    const companyElement = document.querySelector('[data-summary="company"]');
    if (companyElement) {
      const totalItemsAmount = formData.items.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const totalCompanyAmount = formData.companyAmount + totalItemsAmount;
      companyElement.textContent = `ООО "ВашаКомпания" - ${formatCurrency(
        totalCompanyAmount
      )}`;
    }

    // Обновляем комиссию
    const commissionElement = document.querySelector(
      '[data-summary="commission"]'
    );
    if (commissionElement) {
      commissionElement.textContent = formatCurrency(formData.commission);
    }

    // Обновляем товары
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
    return (
      formData.contractorAmount +
      formData.companyAmount +
      totalItemsAmount +
      formData.commission
    );
  }

  // Форматирование валюты
  function formatCurrency(amount) {
    return (
      new Intl.NumberFormat("ru-RU", {
        style: "decimal",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount) + " ₽"
    );
  }

  // Добавление товара
  document.querySelector(".btn-add").addEventListener("click", function () {
    const newItem = document.createElement("div");

    newItem.className = "nomenclature-item";
    newItem.innerHTML = `
            <div class="select-wrapper">
                <select class="form-select">
                    <option value="">-- Выберите товар --</option>
                    ${products
                      .map(
                        (item) =>
                          `<option value="${item.id}">${item.name}</option>`
                      )
                      .join("")}
                </select>
                <i class="fas fa-chevron-down"></i>
            </div>
            <input type="number" class="form-input" placeholder="0">
            <button class="btn btn-remove">
                <i class="fas fa-times"></i>
            </button>
        `;

    document.querySelector(".nomenclature-list").appendChild(newItem);

    // Добавляем обработчик для новой кнопки удаления
    newItem.querySelector(".btn-remove").addEventListener("click", function () {
      newItem.remove();
    });
  });

  // Удаление позиции номенклатуры
  document.addEventListener("click", function (e) {
    if (
      e.target.classList.contains("btn-remove") ||
      e.target.closest(".btn-remove")
    ) {
      const item = e.target.closest(".nomenclature-item");
      if (item) {
        item.remove();
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

      // Здесь будет реальная интеграция с API
      const totalAmount = calculateTotal();

      axios
        .post(
          "https://test.shamex.online/api/v1/payment/init",
          {
            contractor: formData.contractor,
            contractorAmount: formData.contractorAmount,
            companyAmount: formData.companyAmount,
            commission: formData.commission,
            items: formData.items,
            totalAmount,
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
        })
        .catch((err) => {
          console.log(err);
        });

      document.querySelector(".success-result p strong").textContent =
        formatCurrency(totalAmount);
    }
  });

  // Функции управления шагами
  function updateProgress() {
    // Обновляем прогресс-бар
    progressSteps.forEach((step) => {
      const stepNum = parseInt(step.getAttribute("data-step"));
      step.classList.toggle("active", stepNum === currentStep);
    });

    // Показываем текущий шаг
    stepContents.forEach((content) => {
      const contentStep = parseInt(content.getAttribute("data-step"));
      content.classList.toggle("active", contentStep === currentStep);
    });

    // Плавная прокрутка к верху контента
    const modalBody = document.querySelector(".modal-body");
    modalBody.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetSteps() {
    currentStep = 1;
    formData = {
      contractor: null,
      contractorAmount: 0,
      companyAmount: 0,
      commission: 0,
      items: [],
    };
    updateProgress();

    // Сброс полей
    document.getElementById("contractorSelect").selectedIndex = 0;
    document.getElementById("contractorAmount").value = "";
    document.getElementById("companyAmount").value = "";
    document.getElementById("commissionAmount").value = "";

    // Оставляем только один товар
    const items = document.querySelectorAll(".nomenclature-item");
    for (let i = 1; i < items.length; i++) {
      items[i].remove();
    }
    if (items[0]) {
      items[0].querySelector("select").selectedIndex = 0;
      items[0].querySelector("input").value = "";
    }
  }

  function validateStep(step) {
    switch (step) {
      case 1:
        const contractorSelect = document.getElementById("contractorSelect");
        const contractorAmount = document.getElementById("contractorAmount");

        if (!contractorSelect.value || !contractorAmount.value) {
          Toast.error("Заполните все поля для подрядчика");
          return false;
        }
        if (parseFloat(contractorAmount.value) <= 0) {
          Toast.error("Сумма для подрядчика должна быть больше 0");
          return false;
        }
        break;

      case 2:
        const companyAmount = document.getElementById("companyAmount");
        const commissionAmount = document.getElementById("commissionAmount");

        // Проверка комиссии
        if (!commissionAmount.value) {
          Toast.error("Укажите комиссию");
          return false;
        }

        if (parseFloat(commissionAmount.value) < 0) {
          Toast.warning("Комиссия не может быть отрицательной");
          return false;
        }

        // Проверка товаров
        const items = document.querySelectorAll(".nomenclature-item");
        let valid = true;
        let hasItems = false;

        items.forEach((item) => {
          const select = item.querySelector("select");
          const input = item.querySelector("input");

          if (select.value && input.value) {
            hasItems = true;
            if (parseFloat(input.value) <= 0) {
              valid = false;
            }
          }
        });

        if (!hasItems) {
          Toast.warning("Добавьте хотя бы один товар");
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

  // Инициализация
  function initComponents() {
    console.log("Components initialized");
  }

  const contractorSelect = document.getElementById("contractorSelect");

  // Загрузка подрядчиков
  axios.get("https://test.shamex.online/api/v1/contractors").then((res) => {
    res.data.map((contractor) => {
      contractorSelect.innerHTML += `<option value="${contractor.id}">${contractor.name} (ИНН ${contractor.inn})</option>`;
    });
  });

  // Загрузка номенклатуры
  axios.get("https://test.shamex.online/api/v1/nomenclature").then((res) => {
    const selects = document.querySelectorAll(".nomenclature-item select");
    selects.forEach((select) => {
      res.data.map((nomenclature) => {
        select.innerHTML += `<option value="${nomenclature.id}">${nomenclature.name}</option>`;
      });
    });
    products.push(...res.data);
  });

  initComponents();
});
