document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const btn = document.getElementById("loginBtn");
  const errorMessage = document.getElementById("errorMessage");
  const errorText = document.getElementById("errorText");

  btn.disabled = true;
  axios
    .post("https://test.shamex.online/api/v1/user/login", {
      login: document.getElementById("username").value,
      password: document.getElementById("password").value,
    })
    .then((res) => {
      console.log(res);

      localStorage.setItem("token", res.data.token);
      window.location.href = "/dashboard.html";
    })
    .catch((err) => {
      console.log(err);
      errorText.textContent = err.response?.data?.message || "Ошибка";
      errorMessage.style.display = "block";
    })
    .finally(() => {
      btn.disabled = false;
    });
});
