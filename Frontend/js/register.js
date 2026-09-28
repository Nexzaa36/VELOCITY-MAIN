// =============================
//  REGISTER
// =============================
const registerForm =
    document.getElementById(
        "register-form"
    );


const registerMessage =
    document.getElementById(
        "register-message"
    );


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const name =
                document.getElementById(
                    "register-name"
                ).value.trim();


            const email =
                document.getElementById(
                    "register-email"
                ).value.trim();


            const password =
                document.getElementById(
                    "register-password"
                ).value;


            const confirmPassword =
                document.getElementById(
                    "register-confirm"
                ).value;


            // ==================================
            // PASSWORD CHECK
            // ==================================

            if (
                password !==
                confirmPassword
            ) {

                registerMessage.textContent =
                    "Passwords do not match.";

                registerMessage.className =
                    "auth-message error";

                return;

            }


            try {

                // ==================================
                // SEND REGISTER REQUEST
                // ==================================

                const response =
                    await fetch(
                        `${API_BASE_URL}/auth/register`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                name,
                                email,
                                password
                            })
                        }
                    );


                const data =
                    await response.json();


                console.log(
                    "Register Response:",
                    data
                );


                // ==================================
                // HANDLE ERROR
                // ==================================

                if (
                    !response.ok ||
                    !data.success
                ) {

                    registerMessage.textContent =
                        data.message ||
                        "Registration failed.";

                    registerMessage.className =
                        "auth-message error";

                    return;

                }


                // ==================================
                // SUCCESS
                // ==================================

                registerMessage.textContent =
                    "Account created successfully. Redirecting to login...";

                registerMessage.className =
                    "auth-message success";


                setTimeout(
                    () => {

                        window.location.href =
                            "login.html";

                    },
                    1000
                );

            } catch (error) {

                console.error(
                    "Register Error:",
                    error
                );


                registerMessage.textContent =
                    "Unable to connect to the server.";

                registerMessage.className =
                    "auth-message error";

            }

        }
    );

}