// assets/js/company.js
document.addEventListener("DOMContentLoaded", function () {
  // Элементы формы
  const companyForm = document.getElementById("companyForm");
  const resetBtn = document.getElementById("resetBtn");

  // Загрузка сохраненных данных
  loadCompanyData();

  // Обработка отправки формы
  companyForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(e.target);

    const data = {
      id: formData.get("id") || null,
      company_name: formData.get("company_name"),
      inn: formData.get("inn"),
      kpp: formData.get("kpp"),
      ogrn: formData.get("ogrn"),
      legal_address: formData.get("legal_address"),
      actual_address: formData.get("actual_address"),
      bank_name: formData.get("bank_name"),
      account_number: formData.get("account_number"),
      bik: formData.get("bik"),
      correspondent_account: formData.get("correspondent_account"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      website: formData.get("website"),
      director: formData.get("director"),
    };

    // Валидация данных
    if (!validateCompanyData(data)) {
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
      ? `https://module-bek.onrender.com/api/v1/company/${data.id}`
      : "https://module-bek.onrender.com/api/v1/company/create";
    apiMethod(url, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        Toast.success("Изменение успешно сохранено");
      })
      .catch((err) => {
        console.log(err);
        Toast.error("Ошибка при изменени данных");
      });
  });

  // Сброс формы
  resetBtn.addEventListener("click", async function () {
    const confirmed = await confirmAction(
      "Вы уверены, что хотите сбросить все настройки? Данные будут восстановлены к значениям по умолчанию.",
      "Сбросить",
      "Отмена"
    );

    if (confirmed) {
      companyForm.reset();
      localStorage.removeItem("companySettings");
      Toast.info("Настройки сброшены к значениям по умолчанию");
    }
  });

  // Валидация данных компании
  function validateCompanyData(data) {
    // Валидация ИНН
    if (data.inn && !/^\d{10,12}$/.test(data.inn)) {
      Toast.error("ИНН должен содержать 10 или 12 цифр", "Ошибка валидации");
      return false;
    }

    // Валидация КПП
    if (data.kpp && !/^\d{9}$/.test(data.kpp)) {
      Toast.error("КПП должен содержать 9 цифр", "Ошибка валидации");
      return false;
    }

    // Валидация ОГРН
    if (data.ogrn && !/^\d{13}$/.test(data.ogrn)) {
      Toast.error("ОГРН должен содержать 13 цифр", "Ошибка валидации");
      return false;
    }

    // Валидация расчетного счета
    if (data.account_number && !/^\d{20}$/.test(data.account_number)) {
      Toast.error(
        "Расчетный счет должен содержать 20 цифр",
        "Ошибка валидации"
      );
      return false;
    }

    // Валидация БИК
    if (data.bik && !/^\d{9}$/.test(data.bik)) {
      Toast.error("БИК должен содержать 9 цифр", "Ошибка валидации");
      return false;
    }

    // Валидация телефона
    if (data.phone && !/^(\+7|8)[\d\s\(\)-]{10,}$/.test(data.phone)) {
      Toast.error("Введите корректный номер телефона", "Ошибка валидации");
      return false;
    }

    // Валидация email
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      Toast.error("Введите корректный email адрес", "Ошибка валидации");
      return false;
    }

    return true;
  }

  function loadCompanyData() {
    axios
      .get("https://module-bek.onrender.com/api/v1/company")
      .then((res) => {
        populateForm(res.data[0])
      })
      .catch((err) => {
        Toast.error("Не удалось загрузить информатцию о компании");
        console.log(err);
      });
  }

  // Заполнение формы данными
  function populateForm(data) {
    Object.keys(data).forEach((key) => {
      const element = companyForm.querySelector(`[name="${key}"]`);
      if (element) {
        element.value = data[key];
      }
    });
  }

  function initInputMasks() {
    // Маска для телефона
    const phoneInput = companyForm.querySelector('[name="phone"]');
    if (phoneInput) {
      phoneInput.addEventListener("input", function (e) {
        let value = e.target.value.replace(/\D/g, "");
        if (value.startsWith("7") || value.startsWith("8")) {
          value = value.substring(1);
        }
        if (value.length > 0) {
          value = "+7 (" + value;
          if (value.length > 7)
            value = value.substring(0, 7) + ") " + value.substring(7);
          if (value.length > 12)
            value = value.substring(0, 12) + "-" + value.substring(12);
          if (value.length > 15)
            value = value.substring(0, 15) + "-" + value.substring(15);
        }
        e.target.value = value;
      });
    }

    // Маска для ИНН
    const innInput = companyForm.querySelector('[name="inn"]');
    if (innInput) {
      innInput.addEventListener("input", function (e) {
        e.target.value = e.target.value.replace(/\D/g, "").substring(0, 12);
      });
    }

    // Маска для расчетного счета
    const accountInput = companyForm.querySelector('[name="account_number"]');
    if (accountInput) {
      accountInput.addEventListener("input", function (e) {
        e.target.value = e.target.value.replace(/\D/g, "").substring(0, 20);
      });
    }

    // Маска для БИК
    const bikInput = companyForm.querySelector('[name="bik"]');
    if (bikInput) {
      bikInput.addEventListener("input", function (e) {
        e.target.value = e.target.value.replace(/\D/g, "").substring(0, 9);
      });
    }
  }

  initInputMasks();
  console.log("Company page initialized");
});
