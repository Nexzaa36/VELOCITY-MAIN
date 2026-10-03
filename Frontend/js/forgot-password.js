// =============================================
// RUNFOLD FORGOT PASSWORD
// =============================================

const API_BASE_URL =
    "https://velocity-y30h.onrender.com/api";


const forgotForm =
    document.getElementById(
        "forgot-password-form"
    );


const forgotMessage =
    document.getElementById(
        "forgot-message"
    );


if (forgotForm) {

    forgotForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const email =
                document
                    .getElementById(
                        "forgot-email"
                    )
                    .value
                    .trim()
                    .toLowerCase();


            if (!email) {

                forgotMessage.textContent =
                    "Please enter your email address.";

                forgotMessage.className =
                    "auth-message error";

                return;
            }


            const button =
                forgotForm.querySelector(
                    "button[type='submit']"
                );


            button.disabled = true;

            button.textContent =
                "Sending...";


            forgotMessage.textContent = "";


            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/auth/forgot-password`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    email
                                })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    forgotMessage.textContent =
                        data.message ||
                        "Unable to process request.";

                    forgotMessage.className =
                        "auth-message error";

                    return;
                }


                forgotMessage.textContent =
                    "If an account exists with this email, a password reset link has been sent.";

                forgotMessage.className =
                    "auth-message success";


                document
                    .getElementById(
                        "forgot-email"
                    )
                    .value = "";


            } catch (error) {

                console.error(
                    "Forgot Password Error:",
                    error
                );


                forgotMessage.textContent =
                    "Unable to connect to the server.";

                forgotMessage.className =
                    "auth-message error";

            } finally {

                button.disabled = false;

                button.textContent =
                    "Continue";
            }

        }
    );

}   