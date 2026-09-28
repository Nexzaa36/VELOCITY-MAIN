// =============================
// VELOCITY REGISTER
// =============================


// ==================================
// ELEMENTS
// ==================================

const registerForm =
    document.getElementById(
        "register-form"
    );


const registerMessage =
    document.getElementById(
        "register-message"
    );


const passwordInput =
    document.getElementById(
        "register-password"
    );


const confirmInput =
    document.getElementById(
        "register-confirm"
    );


// ==================================
// PASSWORD REQUIREMENTS
// ==================================

const requirementLength =
    document.getElementById(
        "req-length"
    );


const requirementUppercase =
    document.getElementById(
        "req-uppercase"
    );


const requirementNumber =
    document.getElementById(
        "req-number"
    );


const requirementSpecial =
    document.getElementById(
        "req-special"
    );


// ==================================
// UPDATE REQUIREMENT UI
// ==================================

function updateRequirement(
    element,
    isValid
) {

    if (!element) {
        return;
    }


    const icon =
        element.querySelector(
            ".req-icon"
        );


    if (isValid) {

        element.classList.add(
            "valid"
        );


        if (icon) {

            icon.textContent =
                "✓";

        }

    } else {

        element.classList.remove(
            "valid"
        );


        if (icon) {

            icon.textContent =
                "○";

        }

    }

}


// ==================================
// CHECK PASSWORD REQUIREMENTS
// ==================================

function checkPasswordRequirements(
    password
) {

    const hasMinimumLength =
        password.length >= 8;


    const hasUppercase =
        /[A-Z]/.test(password);


    const hasNumber =
        /\d/.test(password);


    const hasSpecialCharacter =
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(
            password
        );


    updateRequirement(
        requirementLength,
        hasMinimumLength
    );


    updateRequirement(
        requirementUppercase,
        hasUppercase
    );


    updateRequirement(
        requirementNumber,
        hasNumber
    );


    updateRequirement(
        requirementSpecial,
        hasSpecialCharacter
    );


    return (
        hasMinimumLength &&
        hasUppercase &&
        hasNumber &&
        hasSpecialCharacter
    );

}


// ==================================
// PASSWORD INPUT
// ==================================

if (passwordInput) {

    passwordInput.addEventListener(
        "input",
        () => {

            checkPasswordRequirements(
                passwordInput.value
            );

        }
    );

}


// ==================================
// CONFIRM PASSWORD INPUT
// ==================================

if (confirmInput) {

    confirmInput.addEventListener(
        "input",
        () => {

            // Remove previous message while
            // the user is correcting the password.

            if (
                registerMessage &&
                registerMessage.textContent ===
                    "Passwords do not match."
            ) {

                registerMessage.textContent =
                    "";

                registerMessage.className =
                    "auth-message";

            }

        }
    );

}


// ==================================
// PASSWORD VALIDATION
// ==================================

function isValidPassword(
    password
) {

    return checkPasswordRequirements(
        password
    );

}


// ==================================
// REGISTER FORM
// ==================================

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            // ==================================
            // GET FORM VALUES
            // ==================================

            const name =
                document.getElementById(
                    "register-name"
                ).value.trim();


            const email =
                document.getElementById(
                    "register-email"
                ).value.trim();


            const password =
                passwordInput.value;


            const confirmPassword =
                confirmInput.value;


            // ==================================
            // CHECK PASSWORD REQUIREMENTS
            // ==================================

            if (
                !isValidPassword(
                    password
                )
            ) {

                registerMessage.textContent =
                    "Please meet all password requirements.";

                registerMessage.className =
                    "auth-message error";

                return;

            }


            // ==================================
            // CHECK PASSWORD MATCH
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


            // ==================================
            // CLEAR OLD MESSAGE
            // ==================================

            registerMessage.textContent =
                "";

            registerMessage.className =
                "auth-message";


            // ==================================
            // SEND REGISTER REQUEST
            // ==================================

            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/auth/register`,
                        {
                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    name,

                                    email,

                                    password

                                })

                        }
                    );


                // ==================================
                // READ RESPONSE
                // ==================================

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


                // ==================================
                // REDIRECT
                // ==================================

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