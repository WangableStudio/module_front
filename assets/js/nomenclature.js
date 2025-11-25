// assets/js/nomenclature.js
document.addEventListener("DOMContentLoaded", function () {
  // Элементы
  const addItemBtn = document.getElementById("addItemBtn");
  const itemModal = document.getElementById("itemModal");
  const closeBtn = itemModal.querySelector(".close");
  const cancelBtn = document.getElementById("cancelBtn");
  const itemForm = document.getElementById("itemForm");
  const modalTitle = document.getElementById("modalTitle");

  // Открытие модального окна для добавления
  addItemBtn.addEventListener("click", function () {
    modalTitle.textContent = "Добавить товар/услугу";
    itemForm.reset();
    itemModal.style.display = "block";
    document.body.style.overflow = "hidden";
  });

  function getUnitsDisplayName(unit) {
    const units = {
      piece: "шт",
      kg: "кг",
      gram: "г",
      liter: "liter",
      meter: "м",
      set: "комплект",
      hour: "час",
    };

    return units[unit] || unit;
  }

  // Закрытие модального окна
  function closeItemModal() {
    itemModal.style.display = "none";
    document.body.style.overflow = "auto";
  }

  closeBtn.addEventListener("click", closeItemModal);
  cancelBtn.addEventListener("click", closeItemModal);

  itemForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;

    const formData = new FormData(e.target);

    const data = {
      id: formData.get("hidden") || null,
      name: formData.get("name"),
      price: formData.get("price"),
      description: formData.get("description"),
    };

    if (!validateItemData(data)) {
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
      ? `http://localhost:3000/api/v1/nomenclature/${data.id}`
      : "http://localhost:3000/api/v1/nomenclature/create";
    apiMethod(url, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        closeItemModal();
        Toast.success("Товар успешно сохранен", "Успешно");

        if (!data.id) {
          addItemToTable(res.data);
        }
      })
      .catch((err) => {
        console.log(err);
        Toast.error("Ошибка при добавление товара", "Ошибка");
      });
  });

  function populateForm(data) {
    itemForm.querySelector('[name="hidden"]').value = data.id;
    itemForm.querySelector('[name="name"]').value = data.name;
    itemForm.querySelector('[name="price"]').value = data.price;
    itemForm.querySelector('[name="description"]').value = data.description;
  }

  function validateItemData(data) {
    if (!data.name || data.name.length < 2) {
      Toast.error(
        "Наименование должно содержать минимум 2 символа",
        "Ошибка валидации"
      );
      return false;
    }

    if (!data.price || parseFloat(data.price) <= 0) {
      Toast.error("Цена должна быть больше 0", "Ошибка валидации");
      return false;
    }

    return true;
  }

  // Добавление товара в таблицу
  function addItemToTable(data) {
    const tbody = document.querySelector(".data-table tbody");
    const row = document.createElement("tr");

    const displayPrice = formatCurrency(parseFloat(data.price));
    const statusClass = data.status === true ? "active" : "inactive";
    const statusText = data.status === true ? "Активен" : "Неактивен";

    row.innerHTML = `
            <input type="hidden" value="${data.id}">
            <td>${data.name}</td>
            <td>${displayPrice}</td>
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

    // Добавляем обработчики для новых кнопок
    addRowEventListeners(row);
  }

  function addRowEventListeners(row) {
    row.querySelector(".btn-icon.edit").addEventListener("click", function () {
      Loader.start();
      const id = row.querySelector("input").value;
      axios
        .get(`http://localhost:3000/api/v1/nomenclature/${id}`)
        .then((res) => {
          populateForm(res.data);
          Loader.hide();
        })
        .catch((err) => {
          console.log(err);
        });

      modalTitle.textContent = "Редактировать товар/услугу";
      itemModal.style.display = "block";
    });

    row
      .querySelector(".btn-icon.delete")
      .addEventListener("click", async function () {
        const name = row.cells[0].textContent;
        const id = row.querySelector("input").value;
        const confirmed = await confirmAction(
          `Вы уверены, что хотите удалить "${name}"?`,
          "Удалить",
          "Отмена"
        );

        if (confirmed) {
          Loader.start();
          axios
            .delete(`http://localhost:3000/api/v1/nomenclature/${id}`)
            .then((res) => {
              row.remove();
              Toast.success("Товар успешно удален");
              Loader.hide();
            })
            .catch((err) => {
              Toast.error("Не получилось удалить товар");
            });
        }
      });
  }

  Loader.start();
  axios
    .get("http://localhost:3000/api/v1/nomenclature")
    .then((res) => {
      res.data.forEach((data) => {
        addItemToTable(data);
      });
      Loader.hide();
    })
    .catch((err) => {
      console.log(err);
    });
  console.log("Nomenclature page initialized");
});
