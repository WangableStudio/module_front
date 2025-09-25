// assets/js/script.js

// Глобальный класс Toast для всех страниц
class Toast {
  static show(message, type = "info", title = null, duration = 5000) {
    const container = document.getElementById("toastContainer");
    if (!container) {
      // Создаем контейнер если его нет
      const toastContainer = document.createElement("div");
      toastContainer.className = "toast-container";
      toastContainer.id = "toastContainer";
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    // Иконки для разных типов уведомлений
    const icons = {
      success: "fa-check-circle",
      error: "fa-exclamation-circle",
      warning: "fa-exclamation-triangle",
      info: "fa-info-circle",
    };

    // Заголовки по умолчанию
    const defaultTitles = {
      success: "Успешно!",
      error: "Ошибка!",
      warning: "Внимание!",
      info: "Информация",
    };

    toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${icons[type] || "fa-info-circle"}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title || defaultTitles[type]}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

    document.getElementById("toastContainer").appendChild(toast);

    // Показываем toast с анимацией
    setTimeout(() => {
      toast.classList.add("show");
    }, 100);

    // Обработчик закрытия
    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => {
      Toast.hide(toast);
    });

    // Автоматическое закрытие
    if (duration > 0) {
      setTimeout(() => {
        Toast.hide(toast);
      }, duration);
    }

    return toast;
  }

  static hide(toast) {
    toast.classList.remove("show");
    toast.classList.add("hide");

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  static success(message, title = null, duration = 5000) {
    return this.show(message, "success", title, duration);
  }

  static error(message, title = null, duration = 5000) {
    return this.show(message, "error", title, duration);
  }

  static warning(message, title = null, duration = 5000) {
    return this.show(message, "warning", title, duration);
  }

  static info(message, title = null, duration = 5000) {
    return this.show(message, "info", title, duration);
  }
}

// Общие функции для всех страниц
function confirmAction(message, confirmText = "Да", cancelText = "Нет") {
  return new Promise((resolve) => {
    // Создаем модальное окно подтверждения
    const modal = document.createElement("div");
    modal.className = "confirm-modal";
    modal.innerHTML = `
            <div class="confirm-modal-content">
                <h3>Подтверждение</h3>
                <p>${message}</p>
                <div class="confirm-modal-buttons">
                    <button class="btn btn-secondary" id="confirmCancel">${cancelText}</button>
                    <button class="btn btn-primary" id="confirmOk">${confirmText}</button>
                </div>
            </div>
        `;

    document.body.appendChild(modal);
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";

    // Обработчики кнопок
    document.getElementById("confirmCancel").addEventListener("click", () => {
      closeModal();
      resolve(false);
    });

    document.getElementById("confirmOk").addEventListener("click", () => {
      closeModal();
      resolve(true);
    });

    // Закрытие при клике вне окна
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
        resolve(false);
      }
    });

    function closeModal() {
      modal.style.display = "none";
      document.body.style.overflow = "auto";
      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
      }, 300);
    }
  });
}

// Функция для форматирования валюты
function formatCurrency(amount) {
  return (
    new Intl.NumberFormat("ru-RU", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + " ₽"
  );
}

// Функция для валидации email
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Функция для валидации телефона
function validatePhone(phone) {
  return /^(\+7|8)[\d\s\(\)-]{10,}$/.test(phone);
}

// Функция для валидации ИНН
function validateINN(inn) {
  return /^\d{10,12}$/.test(inn);
}

// Функция для debounce (задержки выполнения)
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Инициализация общих компонентов при загрузке страницы
document.addEventListener("DOMContentLoaded", function () {
  initTooltips();
  initModals();
  console.log("Common components initialized");
});

function initTooltips() {
  // Инициализация тултипов (можно добавить при необходимости)
  const tooltips = document.querySelectorAll("[title]");
  tooltips.forEach((el) => {
    el.addEventListener("mouseenter", function (e) {
      // Базовая реализация тултипов
      console.log("Tooltip:", this.title);
    });
  });
}

function initModals() {
  // Закрытие модальных окон по клику вне области
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("modal")) {
      e.target.style.display = "none";
      document.body.style.overflow = "auto";
      document.querySelector('[name="hidden"]').value = "";
    }
  });

  // Закрытие модальных окон по ESC
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      const modals = document.querySelectorAll(".modal");
      modals.forEach((modal) => {
        if (modal.style.display === "block") {
          modal.style.display = "none";
          document.body.style.overflow = "auto";
        }
      });
    }
  });
}

const token = localStorage.getItem("token");
if (!token) {
  alert("Пользователь не авторизован");
}

axios.post("https://module-bek.onrender.com/api/v1/user/auth", {}, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
}).then(res => {
}).catch(err => {
    window.location.href = '/'
})


document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token')
    window.location.href = '/'
})