// =============================================
// RUNFOLD RESET PASSWORD
// =============================================

const API_BASE_URL =
    "https://velocity-y30h.onrender.com/api";


// =============================================
// ELEMENTS
// =============================================

const resetForm =
    document.getElementById(
        "reset-password-form"
    );


const resetMessage =
    document.getElementById(
        "reset-message"
    );


const passwordInput =
    document.getElementById(
        "new-password"
    );


const confirmPasswordInput =
    document.getElementById(
        "confirm-password"
    );


// =============================================
// GET RESET TOKEN
// =============================================

const urlParams =
    new URLSearchParams(
        window.location.search
    );


const resetToken =
    urlParams.get("token");


// =============================================
// CHECK TOKEN
// =============================================

if (!resetToken) {

    resetMessage.textContent =
        "This password reset link is invalid or missing.";

    resetMessage.className =
        "auth-message error";

    if (resetForm) {

        resetForm.style.display =
            "none";

    }

}


// =============================================
// RESET PASSWORD
// =============================================

if (
    resetForm &&
    resetToken
) {

    resetForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const password =
                passwordInput.value;


            const confirmPassword =
                confirmPasswordInput.value;


            // =========================================
            // VALIDATE PASSWORD
            // =========================================

            if (password.length < 6) {

                resetMessage.textContent =
                    "Password must be at least 6 characters.";

                resetMessage.className =
                    "auth-message error";

                return;
            }


            // =========================================
            // CONFIRM PASSWORD
            // =========================================

            if (
                password !==
                confirmPassword
            ) {

                resetMessage.textContent =
                    "Passwords do not match.";

                resetMessage.className =
                    "auth-message error";

                return;
            }


            // =========================================
            // BUTTON
            // =========================================

            const button =
                resetForm.querySelector(
                    "button[type='submit']"
                );


            button.disabled =
                true;


            button.textContent =
                "Resetting...";


            resetMessage.textContent =
                "";


            try {

                // =====================================
                // SEND RESET REQUEST
                // =====================================

                const response =
                    await fetch(
                        `${API_BASE_URL}/auth/reset-password`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    token:
                                        resetToken,

                                    password
                                })
                        }
                    );


                const data =
                    await response.json();


                console.log(
                    "Reset Password Response:",
                    data
                );


                // =====================================
                // ERROR
                // =====================================

                if (
                    !response.ok ||
                    !data.success
                ) {

                    resetMessage.textContent =
                        data.message ||
                        "Password reset failed.";

                    resetMessage.className =
                        "auth-message error";

                    return;
                }


                // =====================================
                // SUCCESS
                // =====================================

                resetMessage.textContent =
                    "Password reset successfully. Redirecting to login...";

                resetMessage.className =
                    "auth-message success";


                resetForm.reset();


                setTimeout(
                    () => {

                        window.location.href =
                            "login.html";

                    },
                    1500
                );


            } catch (error) {

                console.error(
                    "Reset Password Error:",
                    error
                );


                resetMessage.textContent =
                    "Unable to connect to the server.";

                resetMessage.className =
                    "auth-message error";


            } finally {

                button.disabled =
                    false;

                button.textContent =
                    "Reset Password";

            }

        }
    );

}