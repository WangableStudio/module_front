document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("orderId");
  const paymentDetails = document.querySelector(".payment-details");
  Loader.start("Загружаем данные...");
  axios
    .get(`https://test.shamex.online/api/v1/payment/${orderId}`)
    .then((res) => {
      const data = res.data;
      const formattedDate = new Date(data.payment?.updatedAt).toLocaleString(
        "ru-RU",
        {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
      paymentDetails.innerHTML = `
              <div class="detail-row">
                <span class="detail-label">Номер заказа:</span>
                <span class="detail-value">${data.payment?.orderId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Дата и время:</span>
                <span class="detail-value">${formattedDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Способ оплаты:</span>
                <span class="detail-value">${
                  data.payment?.paymentMethod || "Не указано"
                }</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Комиссия сервиса:</span>
                <span class="detail-value"
                  >${Number(data.payment?.commission).toLocaleString(
                    "ru-RU"
                  )} ₽</span
                >
              </div>
              <div class="detail-row">
                <span class="detail-label">Сумма платежа:</span>
                <span class="detail-value total-amount">${Number(
                  data.payment?.totalAmount
                ).toLocaleString("ru-RU")} ₽</span>
              </div>
            `;
      Loader.hide();
    })
    .catch((err) => {
      console.log(err);
    });

  // Обработчики кнопок
  document
    .getElementById("printReceiptBtn")
    ?.addEventListener("click", function () {
      alert("Функция печати квитанции будет реализована в будущем");
    });

  document
    .getElementById("retryPaymentBtn")
    ?.addEventListener("click", function () {
      alert("Перенаправление на страницу оплаты");
      // В реальном приложении здесь будет перенаправление на страницу оплаты
    });
});
