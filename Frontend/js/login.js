// =============================
// RUNFOLD LOGIN
// =============================

const loginForm =
    document.getElementById("login-form");


const loginMessage =
    document.getElementById("login-message");


loginForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();


        const email =
            document.getElementById(
                "login-email"
            ).value.trim();


        const password =
            document.getElementById(
                "login-password"
            ).value;


        const result =
            loginUser(
                email,
                password
            );


        if (!result.success) {

            loginMessage.textContent =
                result.message;

            loginMessage.className =
                "auth-message error";

            return;
        }
        // Save login session

localStorage.setItem(
    "runfold-auth",
    "true"
);

localStorage.setItem(
    "runfold-user",
    email
);

        loginMessage.textContent =
            "Login successful. Redirecting...";

        loginMessage.className =
            "auth-message success";


        setTimeout(() => {

            window.location.href =
                "index.html";

        }, 700);

    }
);