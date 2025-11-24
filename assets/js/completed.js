document.getElementById("paymentForm").addEventListener("submit", function (e) {
  e.preventDefault();

  // Получаем значения полей
  const email = document.getElementById("email").value.trim();
  const fio = document.getElementById("fio").value.trim();
  const agreement = document.getElementById("agreement").checked;

  // Валидация email
  if (!validateEmail(email)) {
    Toast.error("Введите корректный email", "Ошибка валидации");
    return;
  }

  // Валидация ФИО
  if (fio.length < 2) {
    Toast.error("Введите корректное ФИО", "Ошибка валидации");
    return;
  }

  // Проверка согласия
  if (!agreement) {
    Toast.error("Вы должны согласиться с условиями", "Ошибка валидации");
    return;
  }

  sendDataToBackend(email, fio, agreement);
});

function validateEmail(email) {
  const re =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function hideAllErrors() {
  const errors = document.querySelectorAll(".error");
  errors.forEach((error) => {
    error.style.display = "none";
  });
}

function sendDataToBackend(email, fio, agreement = ture) {
  const urlParams = new URLSearchParams(window.location.search);
  const payment = urlParams.get("payment");
  Loader.start("Подождите, идет переход...");
  axios
    .post("https://test.shamex.online/api/v1/payment/complate", {
      email,
      fio,
      payment,
      agreement
    })
    .then((res) => {
      window.location.href = res.data.sbpUrl;
    })
    .catch((err) => {
      console.log(err);
    });
}
