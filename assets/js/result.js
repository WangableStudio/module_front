document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("orderId");
  const paymentDetails = document.querySelector(".payment-details");
  
  // Элементы модального окна
  const emailModal = document.getElementById("emailModal");
  const emailInput = document.getElementById("emailInput");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const sendEmailBtn = document.getElementById("sendEmailBtn");
  
  let paymentData = null; // Сохраняем данные платежа

  Loader.start("Загружаем данные...");
  axios
    .get(`http://91.143.16.246:3000/api/v1/payment/${orderId}`)
    .then((res) => {
      paymentData = res.data; // Сохраняем данные
      const data = res.data;
      const formattedDate = new Date(data.updatedAt).toLocaleString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      
      paymentDetails.innerHTML = `
        <div class="detail-row">
          <span class="detail-label">Номер заказа:</span>
          <span class="detail-value">${data.orderId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Дата и время:</span>
          <span class="detail-value">${formattedDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Комиссия сервиса:</span>
          <span class="detail-value">${Number(data.commission).toLocaleString("ru-RU")} ₽</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Сумма платежа:</span>
          <span class="detail-value total-amount">${Number(data.totalAmount).toLocaleString("ru-RU")} ₽</span>
        </div>
      `;
      Loader.hide();
    })
    .catch((err) => {
      console.log(err);
      Loader.hide();
    });
});