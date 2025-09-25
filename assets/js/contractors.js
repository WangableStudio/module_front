document.addEventListener("DOMContentLoaded", function () {
  const addContractorBtn = document.getElementById("addContractorBtn");
  const contractorModal = document.getElementById("contractorModal");
  const closeBtn = contractorModal.querySelector(".close");
  const cancelBtn = document.getElementById("cancelBtn");
  const contractorForm = document.getElementById("contractorForm");
  const modalTitle = document.getElementById("modalTitle");

  addContractorBtn.addEventListener("click", function () {
    modalTitle.textContent = "Добавить подрядчика";
    contractorForm.reset();
    contractorModal.style.display = "block";
    document.body.style.overflow = "hidden";
  });

  // Закрытие модального окна
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

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;

    const formData = new FormData(e.target);

    const data = {
      id: formData.get("hidden") || null,
      type: formData.get("type"),
      name: formData.get("name"),
      inn: formData.get("inn"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      city: formData.get("city"),
      name_bank: formData.get("bank_name"),
      curr_acc: formData.get("account_number"),
      bik: formData.get("bik"),
      corr_acc: formData.get("correspondent_account"),
      comment: formData.get("comment"),
    };

    if (!validateINN(data.inn)) {
      Toast.error(
        "Пожалуйста, введите корректный ИНН (12 цифр)",
        "Ошибка валидации"
      );
      btn.disabled = false;
      return;
    }

    if (!validateBankDetails(data.curr_acc, data.bik)) {
      Toast.error(
        "Проверьте правильность банковских реквизитов",
        "Ошибка валидации"
      );
      btn.disabled = false;
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Пользователь не авторизован");
      btn.disabled = false;
      return;
    }
    const apiMethod = data.id ? axios.put : axios.post;
    const url = data.id
      ? `https://module-bek.onrender.com/api/v1/contractors/${data.id}`
      : "https://module-bek.onrender.com/api/v1/contractors/create";
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
        }
      })
      .catch((err) => {
        console.log(err);
        Toast.error("Ошибка при добавление подрятчика", "Ошибка");
      })
      .finally(() => {
        btn.disabled = false; // 🔓 всегда возвращаем доступность кнопки
      });
  });

  // Заполнение формы данными для редактирования
  function populateForm(data) {
    console.log(data);
    
    contractorForm.querySelector('[name="hidden"]').value = data.id;
    contractorForm.querySelector('[name="name"]').value = data.name;
    contractorForm.querySelector('[name="type"]').value = data.type;
    contractorForm.querySelector('[name="inn"]').value = data.inn;
    contractorForm.querySelector('[name="email"]').value = data.email;
    contractorForm.querySelector('[name="phone"]').value = data.phone;
    contractorForm.querySelector('[name="city"]').value = data.city;
    contractorForm.querySelector('[name="bank_name"]').value = data.name_bank;
    contractorForm.querySelector('[name="account_number"]').value =
      data.curr_acc;
    contractorForm.querySelector('[name="bik"]').value = data.bik;
    contractorForm.querySelector('[name="correspondent_account"]').value =
      data.corr_acc;
    contractorForm.querySelector('[name="comment"]').value = data.comment;
  }

  // Валидация банковских реквизитов
  function validateBankDetails(accountNumber, bik) {
    console.log(accountNumber, bik);
    
    return accountNumber.length >= 20 && bik.length === 9;
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
            <td>${data.name_bank}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon edit" title="Редактировать">
                        <i class="fas fa-edit"></i>
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
    row.querySelector(".btn-icon.edit").addEventListener("click", function () {
      const id = row.querySelector("input").value;
      axios
        .get(`https://module-bek.onrender.com/api/v1/contractors/${id}`)
        .then((res) => {
          populateForm(res.data);
        })
        .catch((err) => {
          console.log(err);
        });

      modalTitle.textContent = "Редактировать подрядчика";
      //   populateForm(data);
      contractorModal.style.display = "block";
    });

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
            .delete(`https://module-bek.onrender.com/api/v1/contractors/${id}`)
            .then((res) => {
              row.remove();
              Toast.success("Подрядчик успешно удален");
            })
            .catch((err) => {
              Toast.error("Не получилось удалить подрятчика");
            });
        }
      });
  }

  // Поиск подрядчиков
  const searchInput = document.getElementById("searchInput");
  // const statusFilter = document.getElementById('statusFilter');

  searchInput.addEventListener("input", filterContractors);
  // statusFilter.addEventListener('change', filterContractors);

  function filterContractors() {
    const searchTerm = searchInput.value.toLowerCase();

    const rows = document.querySelectorAll(".data-table tbody tr");

    rows.forEach((row) => {
      const name = row.cells[0].textContent.toLowerCase();
      const type = row.cells[1].textContent.toLowerCase();
      const inn = row.cells[2].textContent.toLowerCase();
      const bank = row.cells[3].textContent.toLowerCase();

      const matchesSearch =
        name.includes(searchTerm) ||
        type.includes(searchTerm) ||
        inn.includes(searchTerm) ||
        bank.includes(searchTerm);

      row.style.display = matchesSearch ? "" : "none";
    });
  }

  axios
    .get("https://module-bek.onrender.com/api/v1/contractors")
    .then((res) => {
      res.data.forEach((data) => {
        addContractorToTable(data);
      });
    })
    .catch((err) => {
      console.log(err);
    });

  console.log("Contractors page initialized");
});
