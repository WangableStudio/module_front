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