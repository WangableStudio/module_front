const token = localStorage.getItem("token");
if (!token) {
  alert("Пользователь не авторизован");
}

axios
  .post(
    "http://91.143.16.246:3000/api/v1/user/auth",
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