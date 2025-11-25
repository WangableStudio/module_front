document.addEventListener("DOMContentLoaded", function () {
  const addContractorBtn = document.getElementById("addContractorBtn");
  const contractorModal = document.getElementById("contractorModal");
  const closeBtn = contractorModal.querySelector(".close");
  const cancelBtn = document.getElementById("cancelBtn");
  const contractorForm = document.getElementById("contractorForm");
  const modalTitle = document.getElementById("modalTitle");

  axios
    .get("http://91.143.16.246:3000/api/v1/contractors/GetSbpMembers")
    .then((res) => {
      res.data.forEach((member) => {
        document.getElementById(
          "members"
        ).innerHTML += `<option value="${member.MemberNameRus}">${member.MemberId}</option>`;
      });
    })
    .catch((err) => {
      console.log(err);
    });

  addContractorBtn.addEventListener("click", function () {
    modalTitle.textContent = "Добавить подрядчика";
    contractorForm.reset();
    contractorModal.style.display = "block";
    document.body.style.overflow = "hidden";

    // Активируем первую вкладку
    document.querySelectorAll(".form-tab").forEach((tab, index) => {
      if (index === 0) {
        tab.classList.add("active");
        document
          .getElementById(`tab-${tab.dataset.tab}`)
          .classList.add("active");
      } else {
        tab.classList.remove("active");
        document
          .getElementById(`tab-${tab.dataset.tab}`)
          .classList.remove("active");
      }
    });
  });

  function closeContractorModal() {
    contractorModal.style.display = "none";
    document.body.style.overflow = "auto";
    contractorForm.querySelector('[name="hidden"]').value = "";
  }

  closeBtn.addEventListener("click", closeContractorModal);
  cancelBtn.addEventListener("click", closeContractorModal);

  // Обработка отправки формы
  contractorForm.addEventListener("submit", function (e) {
    e.preventDefault();

    Loader.start("Загружаем данные...");

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;

    const memberInput = contractorForm.querySelector('input[name="memberId"]');
    const memberValue = memberInput.value;

    // Находим соответствующий <option> из <datalist>
    const selectedOption = Array.from(
      document.querySelectorAll("#members option")
    ).find((option) => option.value === memberValue);

    // Берем textContent (то, что между <option>...</option>)
    const memberText = selectedOption
      ? selectedOption.textContent
      : memberValue;

    const formData = new FormData(e.target);

    const pan = formData.get("pan").replace(/\s+/g, "");
    const expDate = formData.get("expDate").replace(/\//g, "");
    const cvv = formData.get("cvv");

    // Подготавливаем данные для отправки
    const data = {
      id: formData.get("hidden") || null,
      type: formData.get("type"),
      name: formData.get("name"),
      fullName: formData.get("fullName"),
      billingDescriptor: "for service",
      inn: formData.get("inn"),
      ogrn: formData.get("ogrn"),
      kpp: formData.get("kpp") || "000000000",
      okved: formData.get("okved"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      siteUrl: "https://shamex.online",
      comment: formData.get("comment"),

      // Адреса
      legalAddress: formData.get("legalAddress"),
      actualAddress: formData.get("actualAddress"),
      zip: formData.get("zip"),
      city: formData.get("city"),
      country: formData.get("country"),
      street: formData.get("street"),

      // Банковские реквизиты
      bankName: formData.get("bankName"),
      memberId: memberText,
      bankAccount: formData.get("bankAccount"),
      bankBik: formData.get("bankBik"),
      bankCorrespondentAccount: formData.get("bankCorrespondentAccount"),

      // Данные о карте
      pan: pan,
      expDate: expDate,
      cvv: cvv,
      cardHolder: formData.get("cardHolder"),

      // Руководитель
      ceoFirstName: formData.get("ceoFirstName"),
      ceoLastName: formData.get("ceoLastName"),
      ceoPhone: formData.get("ceoPhone"),
      ceoCountry: formData.get("ceoCountry"),
    };

    // Валидация обязательных полей
    if (!validateRequiredFields(data)) {
      Toast.error("Пожалуйста, заполните все обязательные поля", "Ошибка");
      btn.disabled = false;
      Loader.hide();
      return;
    }

    // Валидация данных карты
    if (pan && !validateCardData(pan, expDate, cvv)) {
      Toast.error("Пожалуйста, проверьте данные карты", "Ошибка валидации");
      btn.disabled = false;
      Loader.hide();
      return;
    }

    if (!validateINN(data.inn)) {
      Toast.error("Пожалуйста, введите корректный ИНН", "Ошибка валидации");
      btn.disabled = false;
      Loader.hide();
      return;
    }

    if (!validateBankDetails(data.bankAccount, data.bankBik)) {
      Toast.error(
        "Проверьте правильность банковских реквизитов",
        "Ошибка валидации"
      );
      btn.disabled = false;
      Loader.hide();
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Пользователь не авторизован");
      btn.disabled = false;
      Loader.hide();
      return;
    }

    const apiMethod = data.id ? axios.put : axios.post;
    const url = data.id
      ? `http://91.143.16.246:3000/api/v1/contractors/${data.id}`
      : "http://91.143.16.246:3000/api/v1/contractors/create";

    apiMethod(url, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        closeContractorModal();
        Toast.success("Подрядчик успешно сохранен", "Успешно");

        if (!data.id) {
          addContractorToTable(res.data);
        } else {
          // Обновляем строку в таблице
          updateContractorInTable(res.data);
        }
      })
      .catch((err) => {
        console.error(err);
        Toast.error("Ошибка при сохранении подрядчика", "Ошибка");
      })
      .finally(() => {
        btn.disabled = false;
        Loader.hide();
      });
  });

  // Валидация обязательных полей
  function validateRequiredFields(data) {
    const requiredFields = [
      "type",
      "name",
      "fullName",
      "billingDescriptor",
      "inn",
      "phone",
      "siteUrl",
      "zip",
      "city",
      "country",
      "bankName",
      "bankAccount",
      "bankBik",
      "memberId",
      "ceoFirstName",
      "ceoLastName",
      "ceoPhone",
      "ceoCountry",
    ];

    if(data.type !== "self_employed" && data.type !== 'individual') {
      requiredFields.push("ogrn");
      requiredFields.push("kpp");
      requiredFields.push("email");
    }

    const missingFields = [];
    requiredFields.forEach((field) => {
      if (!data[field] || data[field].toString().trim() === "") {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      Toast.error(
        `Заполните обязательные поля: ${missingFields.join(", ")}`,
        "Ошибка валидации"
      );
      return false;
    }

    return true;
  }

  function validateCardData(pan, expDate, cvv) {
    if (!pan || pan.length !== 16 || !/^\d+$/.test(pan)) {
      Toast.error("Номер карты должен содержать 16 цифр", "Ошибка валидации");
      return false;
    }

    if (!expDate || expDate.length !== 4 || !/^\d+$/.test(expDate)) {
      Toast.error(
        "Срок действия должен содержать 4 цифры (MMYY)",
        "Ошибка валидации"
      );
      return false;
    }

    if (!cvv || cvv.length !== 3 || !/^\d+$/.test(cvv)) {
      Toast.error("CVV код должен содержать 3 цифры", "Ошибка валидации");
      return false;
    }

    return true;
  }

  // Заполнение формы данными для редактирования
  function populateForm(data) {
    console.log("Populating form with data:", data);

    const fields = [
      "hidden",
      "type",
      "name",
      "fullName",
      "inn",
      "ogrn",
      "kpp",
      "okved",
      "email",
      "phone",
      "primaryActivities",
      "comment",
      "legalAddress",
      "actualAddress",
      "postalAddress",
      "zip",
      "city",
      "street",
      "country",
      "bankName",
      "bankAccount",
      "bankBik",
      "bankCorrespondentAccount",
      "memberId",
      "ceoFirstName",
      "ceoLastName",
      "ceoPhone",
      "ceoCountry",
      "pan",
      "expDate",
      "cardHolder",
      "cvv",
    ];

    fields.forEach((field) => {
      const input = contractorForm.querySelector(`[name="${field}"]`);
      if (!input) return;

      // 🔹 Если name === "hidden", подставляем data.id
      if (field === "hidden" && data.id !== undefined) {
        input.value = data.id;
        return;
      }

      // 🔹 Для остальных полей стандартное заполнение
      if (data[field] !== undefined && data[field] !== null) {
        input.value = data[field];
      }
    });
  }

  // Валидация банковских реквизитов
  function validateBankDetails(accountNumber, bik) {
    return (
      accountNumber && accountNumber.length >= 20 && bik && bik.length === 9
    );
  }

  // Валидация ИНН
  function validateINN(inn) {
    if (!inn) return false;

    // Простая валидация ИНН
    const innStr = inn.toString().trim();
    if (innStr.length === 10 || innStr.length === 12) {
      return /^\d+$/.test(innStr);
    }
    return false;
  }

  // Добавление подрядчика в таблицу
  function addContractorToTable(data) {
    const tbody = document.querySelector(".data-table tbody");
    const row = document.createElement("tr");

    row.innerHTML = `
      <input type="hidden" value="${data.id}">
      <td>${data.name}</td>
      <td>${getTypeDisplayName(data.type)}</td>
      <td>${data.inn}</td>
      <td>${data.ogrn || "-"}</td>
      <td>${data.bankName}</td>
      <td>${data.partnerId || "Не зарегистрирован"}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon edit" title="Редактировать">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon register" title="Зарегистрировать в Т-Банке">
            <i class="fas fa-user-plus"></i>
          </button>
          <button class="btn-icon delete" title="Удалить">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    `;

    tbody.appendChild(row);
    addRowEventListeners(row);
  }

  // Обновление подрядчика в таблице
  function updateContractorInTable(data) {
    const rows = document.querySelectorAll(".data-table tbody tr");
    rows.forEach((row) => {
      const rowId = row.querySelector("input").value;
      if (rowId == data.id) {
        row.cells[0].textContent = data.name;
        row.cells[1].textContent = getTypeDisplayName(data.type);
        row.cells[2].textContent = data.inn;
        row.cells[3].textContent = data.ogrn || "-";
        row.cells[4].textContent = data.bankName;
        row.cells[5].textContent = data.partnerId || "Не зарегистрирован";
      }
    });
  }

  // Получение отображаемого имени типа
  function getTypeDisplayName(type) {
    const types = {
      ip: "ИП",
      ooo: "ООО",
      self_employed: "Самозанятый",
      individual: "Физ. лицо",
    };
    return types[type] || type;
  }

  // Добавление обработчиков для строки таблицы
  function addRowEventListeners(row) {
    // Редактирование
    row.querySelector(".btn-icon.edit").addEventListener("click", function () {
      const id = row.querySelector("input").value;
      Loader.data("Загружаем данные...");
      axios
        .get(`http://91.143.16.246:3000/api/v1/contractors/${id}`)
        .then((res) => {
          populateForm(res.data);
          modalTitle.textContent = "Редактировать подрядчика";
          contractorModal.style.display = "block";
          Loader.hide();
        })
        .catch((err) => {
          console.error(err);
          Toast.error("Ошибка при загрузке данных", "Ошибка");
        });
    });

    // Регистрация в Т-Банке
    row
      .querySelector(".btn-icon.register")
      .addEventListener("click", function () {
        const id = row.querySelector("input").value;
        const name = row.cells[0].textContent;

        Toast.info("Регистрация в Т-Банке...", "Инфо");

        axios
          .post(`http://91.143.16.246:3000/api/v1/contractors/register`, {
            contractorId: id,
          })
          .then((res) => {
            Toast.success(
              "Подрядчик успешно зарегистрирован в Т-Банке",
              "Успех"
            );
            // Обновляем PartnerId в таблице
            row.cells[5].textContent = res.data.partnerId;
          })
          .catch((err) => {
            Toast.error(err.response.data.message, "Ошибка");
          });
      });

    // Удаление
    row
      .querySelector(".btn-icon.delete")
      .addEventListener("click", async function () {
        const name = row.cells[0].textContent;
        const id = row.querySelector("input").value;

        const confirmed = await confirmAction(
          `Вы уверены, что хотите удалить подрядчика "${name}"?`,
          "Удалить",
          "Отмена"
        );

        if (confirmed) {
          axios
            .delete(`http://91.143.16.246:3000/api/v1/contractors/${id}`)
            .then((res) => {
              row.remove();
              Toast.success("Подрядчик успешно удален");
            })
            .catch((err) => {
              Toast.error("Не получилось удалить подрядчика");
            });
        }
      });
  }

  // Поиск подрядчиков
  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", filterContractors);

  function filterContractors() {
    const searchTerm = searchInput.value.toLowerCase();
    const rows = document.querySelectorAll(".data-table tbody tr");

    rows.forEach((row) => {
      const name = row.cells[0].textContent.toLowerCase();
      const type = row.cells[1].textContent.toLowerCase();
      const inn = row.cells[2].textContent.toLowerCase();
      const ogrn = row.cells[3].textContent.toLowerCase();
      const bank = row.cells[4].textContent.toLowerCase();
      const partnerId = row.cells[5].textContent.toLowerCase();

      const matchesSearch =
        name.includes(searchTerm) ||
        type.includes(searchTerm) ||
        inn.includes(searchTerm) ||
        ogrn.includes(searchTerm) ||
        bank.includes(searchTerm) ||
        partnerId.includes(searchTerm);

      row.style.display = matchesSearch ? "" : "none";
    });
  }

  // Загрузка подрядчиков при загрузке страницы
  function loadContractors() {
    Loader.start("Загружаем данные...");
    axios
      .get("http://91.143.16.246:3000/api/v1/contractors")
      .then((res) => {
        // Loader.hide();
        res.data.forEach((data) => {
          addContractorToTable(data);
        });
        Loader.hide();
      })
      .catch((err) => {
        console.error(err);
        Toast.error("Ошибка при загрузке подрядчиков", "Ошибка");
      });
  }

  // Инициализация
  loadContractors();
  console.log("Contractors page initialized");
});
