// =============================
// RUNFOLD LOGIN
// =============================

const loginForm =
    document.getElementById("login-form");

const loginMessage =
    document.getElementById("login-message");

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const email =
                document
                    .getElementById("login-email")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("login-password")
                    .value;

            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/auth/login`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email,
                                password
                            })
                        }
                    );

                const data =
                    await response.json();

                console.log(
                    "Login Response:",
                    data
                );

                if (
                    !response.ok ||
                    !data.success
                ) {

                    loginMessage.textContent =
                        data.message ||
                        "Login failed.";

                    loginMessage.className =
                        "auth-message error";

                    return;
                }

                // Save JWT
                localStorage.setItem(
                    "token",
                    data.token
                );

                // Save user
                localStorage.setItem(
                    "user",
                    JSON.stringify(data.user)
                );

                // Keep existing frontend compatibility
                localStorage.setItem(
                    "runfold-auth",
                    "true"
                );

                localStorage.setItem(
                    "runfold-user",
                    data.user.email
                );

                loginMessage.textContent =
                    "Login successful. Redirecting...";

                loginMessage.className =
                    "auth-message success";

                setTimeout(() => {

                    window.location.href =
                        "index.html";

                }, 700);

            } catch (error) {

                console.error(
                    "Login Error:",
                    error
                );

                loginMessage.textContent =
                    "Unable to connect to the server.";

                loginMessage.className =
                    "auth-message error";
            }
        }
    );
}