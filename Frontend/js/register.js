// =============================
// RUNFOLD REGISTER
// =============================

const registerForm =
    document.getElementById(
        "register-form"
    );


const registerMessage =
    document.getElementById(
        "register-message"
    );


registerForm.addEventListener(
    "submit",
    event => {

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


        if (password !== confirmPassword) {

            registerMessage.textContent =
                "Passwords do not match.";

            registerMessage.className =
                "auth-message error";

            return;
        }


        const result =
            registerUser(
                name,
                email,
                password
            );


        if (!result.success) {

            registerMessage.textContent =
                result.message;

            registerMessage.className =
                "auth-message error";

            return;
        }


        registerMessage.textContent =
            "Account created. Redirecting to login...";

        registerMessage.className =
            "auth-message success";


        setTimeout(() => {

            window.location.href =
                "login.html";

        }, 1000);

    }
);