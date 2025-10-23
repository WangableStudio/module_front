// assets/js/script.js

class Loader {
  static #currentLoader = null;
  static #progressInterval = null;
  static #progress = 0;
  static #particles = [];

  static start(message = "Загружаем данные...", type = "default") {
    // Если уже есть активный лоадер, сначала закрываем его
    if (this.#currentLoader) {
      this.hide();
    }

    const container = document.getElementById("loaderContainer");
    if (!container) {
      const loaderContainer = document.createElement("div");
      loaderContainer.className = "loader-container";
      loaderContainer.id = "loaderContainer";
      document.body.appendChild(loaderContainer);
    }

    const loader = document.createElement("div");
    loader.className = `loader ${type}`;
    loader.id = "currentLoader";

    const icons = {
      default: "fa-spinner",
      success: "fa-check-circle",
      error: "fa-exclamation-circle",
      warning: "fa-exclamation-triangle",
      info: "fa-info-circle",
      route: "fa-route",
      database: "fa-database",
      network: "fa-wifi",
      security: "fa-shield-alt",
      search: "fa-search",
    };

    const gradients = {
      default: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      route: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      database: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      network: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      success: "linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)",
      error: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
      security: "linear-gradient(135deg, #ffd89b 0%, #19547b 100%)",
      search: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    };

    loader.innerHTML = `
      <div class="loader-backdrop">
        <div class="loader-particles"></div>
        <div class="loader-gradient"></div>
      </div>
      <div class="loader-content">
        <div class="loader-main">
          <div class="loader-icon-wrapper">
            <div class="loader-icon-pulse"></div>
            <div class="loader-icon">
              <i class="fas ${icons[type] || "fa-spinner"}"></i>
            </div>
          </div>
          <div class="loader-text">
            <div class="loader-message">${message}</div>
            <div class="loader-progress-container">
              <div class="loader-progress-bar">
                <div class="loader-progress-fill">
                  <div class="loader-progress-glow"></div>
                </div>
              </div>
              <div class="loader-progress-stats">
                <span class="loader-progress-text">0%</span>
                <div class="loader-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button class="loader-cancel" title="Отменить">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    document.getElementById("loaderContainer").appendChild(loader);
    this.#currentLoader = loader;
    this.#progress = 0;

    // Устанавливаем градиент для бэкдропа
    const gradientEl = loader.querySelector('.loader-gradient');
    if (gradientEl) {
      gradientEl.style.background = gradients[type] || gradients.default;
    }

    // Создаем частицы
    this.#createParticles();

    setTimeout(() => {
      loader.classList.add("show");
    }, 50);

    this.#startProgressAnimation();

    return {
      update: (newMessage, newProgress = null) => this.update(newMessage, newProgress),
      setProgress: (progress) => this.setProgress(progress),
      hide: () => this.hide(),
      setCancelable: (cancelCallback) => this.#setCancelable(cancelCallback)
    };
  }

  static #createParticles() {
    if (!this.#currentLoader) return;

    const particlesContainer = this.#currentLoader.querySelector('.loader-particles');
    if (!particlesContainer) return;

    this.#particles = [];
    const particleCount = 12;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'loader-particle';
      
      const size = Math.random() * 6 + 2;
      const posX = Math.random() * 100;
      const posY = Math.random() * 100;
      const delay = Math.random() * 2;
      const duration = Math.random() * 3 + 2;
      
      particle.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${posX}%;
        top: ${posY}%;
        animation-delay: ${delay}s;
        animation-duration: ${duration}s;
      `;
      
      particlesContainer.appendChild(particle);
      this.#particles.push(particle);
    }
  }

  static #startProgressAnimation() {
    if (this.#progressInterval) {
      clearInterval(this.#progressInterval);
    }

    this.#progressInterval = setInterval(() => {
      if (this.#progress < 85) {
        this.#progress += Math.random() * 8 + 2;
        if (this.#progress > 85) this.#progress = 85;
        this.#updateProgress();
      }
    }, 400);
  }

  static #updateProgress() {
    if (!this.#currentLoader) return;

    const progressFill = this.#currentLoader.querySelector('.loader-progress-fill');
    const progressText = this.#currentLoader.querySelector('.loader-progress-text');
    
    if (progressFill) {
      progressFill.style.width = `${this.#progress}%`;
    }
    if (progressText) {
      progressText.textContent = `${Math.round(this.#progress)}%`;
    }
  }

  static update(message = null, progress = null) {
    if (!this.#currentLoader) return;

    if (message) {
      const messageEl = this.#currentLoader.querySelector('.loader-message');
      if (messageEl) {
        // Анимация смены текста
        messageEl.style.opacity = '0';
        setTimeout(() => {
          messageEl.textContent = message;
          messageEl.style.opacity = '1';
        }, 200);
      }
    }

    if (progress !== null) {
      this.setProgress(progress);
    }
  }

  static setProgress(progress) {
    if (!this.#currentLoader || progress < 0 || progress > 100) return;

    if (this.#progressInterval) {
      clearInterval(this.#progressInterval);
      this.#progressInterval = null;
    }

    this.#progress = progress;
    this.#updateProgress();
  }

  static #setCancelable(cancelCallback) {
    if (!this.#currentLoader || !cancelCallback) return;

    const cancelBtn = this.#currentLoader.querySelector('.loader-cancel');
    if (cancelBtn) {
      cancelBtn.style.display = 'flex';
      cancelBtn.onclick = () => {
        cancelCallback();
        this.hide();
      };
    }
  }

  static hide(delay = 400) {
    if (!this.#currentLoader) return;

    this.setProgress(100);

    if (this.#progressInterval) {
      clearInterval(this.#progressInterval);
      this.#progressInterval = null;
    }

    // Очищаем частицы
    this.#particles.forEach(particle => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    });
    this.#particles = [];

    const loader = this.#currentLoader;
    loader.classList.remove("show");
    loader.classList.add("hide");

    setTimeout(() => {
      if (loader.parentNode) {
        loader.parentNode.removeChild(loader);
      }
      this.#currentLoader = null;
      this.#progress = 0;
    }, delay);
  }

  // Специализированные методы
  static route(message = "Маршрутизация...") {
    return this.start(message, "route");
  }

  static data(message = "Загружаем данные...") {
    return this.start(message, "database");
  }

  static network(message = "Соединение с сервером...") {
    return this.start(message, "network");
  }

  static security(message = "Проверка безопасности...") {
    return this.start(message, "security");
  }

  static search(message = "Поиск данных...") {
    return this.start(message, "search");
  }

  static success(message = "Готово!", duration = 1200) {
    const loader = this.start(message, "success");
    this.setProgress(100);
    setTimeout(() => this.hide(), duration);
    return loader;
  }

  static withProgress(message = "Загрузка...") {
    return this.start(message, "default");
  }
}

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

axios
  .post(
    "https://test.shamex.online/api/v1/user/auth",
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )
  .then((res) => {})
  .catch((err) => {
    window.location.href = "/";
  });

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "/";
});
