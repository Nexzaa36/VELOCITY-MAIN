const API_URL = "http://localhost:5000";

const form = document.getElementById("adminLoginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const message = document.getElementById("loginMessage");
const togglePassword = document.getElementById("togglePassword");


// =========================================
// CHECK REQUIRED ELEMENTS
// =========================================

if (
    !form ||
    !emailInput ||
    !passwordInput ||
    !loginButton ||
    !message ||
    !togglePassword
) {
    console.error(
        "Admin login page is missing one or more required elements."
    );
}


// =========================================
// REDIRECT IF ALREADY ADMIN
// =========================================

const existingToken =
    localStorage.getItem("token");

const existingRole =
    localStorage.getItem("role");

if (
    existingToken &&
    existingRole === "admin"
) {
    window.location.href =
        "./admin-dashboard.html";
}


// =========================================
// PASSWORD VISIBILITY
// =========================================

if (togglePassword) {

    togglePassword.addEventListener(
        "click",
        () => {

            const isPassword =
                passwordInput.type === "password";

            passwordInput.type =
                isPassword
                    ? "text"
                    : "password";

            togglePassword.textContent =
                isPassword
                    ? "HIDE"
                    : "SHOW";
        }
    );

}


// =========================================
// ADMIN LOGIN
// =========================================

if (form) {

    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            message.textContent = "";
            message.className = "";

            loginButton.disabled = true;
            loginButton.innerHTML =
                "AUTHENTICATING...";


            try {

                const email =
                    emailInput.value
                        .trim()
                        .toLowerCase();

                const password =
                    passwordInput.value;


                // =========================================
                // BASIC VALIDATION
                // =========================================

                if (!email || !password) {

                    throw new Error(
                        "Please enter your admin email and password."
                    );

                }


                // =========================================
                // SEND ADMIN LOGIN REQUEST
                // =========================================

                const response =
                    await fetch(
                        `${API_URL}/api/admin/auth/login`,
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


                // =========================================
                // CHECK RESPONSE TYPE
                // =========================================

                const contentType =
                    response.headers.get(
                        "content-type"
                    ) || "";


                if (
                    !contentType.includes(
                        "application/json"
                    )
                ) {

                    const serverResponse =
                        await response.text();

                    console.error(
                        "Non-JSON server response:",
                        serverResponse
                    );

                    throw new Error(
                        "Unable to reach the admin login API. Make sure the backend is running on port 5000."
                    );

                }


                // =========================================
                // READ JSON RESPONSE
                // =========================================

                const data =
                    await response.json();


                console.log(
                    "Admin Login Response:",
                    data
                );


                // =========================================
                // HANDLE LOGIN ERROR
                // =========================================

                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.message ||
                        "Invalid admin credentials."
                    );

                }


                // =========================================
                // VERIFY ADMIN DATA
                // =========================================

                if (
                    !data.token ||
                    !data.admin
                ) {

                    throw new Error(
                        "Invalid login response from server."
                    );

                }


                if (
                    data.admin.role !== "admin"
                ) {

                    throw new Error(
                        "Admin access denied."
                    );

                }


                // =========================================
                // STORE ADMIN SESSION
                // =========================================

                localStorage.setItem(
                    "token",
                    data.token
                );

                localStorage.setItem(
                    "user",
                    JSON.stringify(
                        data.admin
                    )
                );

                localStorage.setItem(
                    "role",
                    data.admin.role
                );


                // =========================================
                // SUCCESS MESSAGE
                // =========================================

                message.textContent =
                    "Login successful. Redirecting...";

                message.className =
                    "success";


                // =========================================
                // REDIRECT TO ADMIN DASHBOARD
                // =========================================

                window.location.href =
                    "./admin-dashboard.html";

            }


            // =========================================
            // ERROR HANDLING
            // =========================================

            catch (error) {

                console.error(
                    "Admin Login Error:",
                    error
                );

                message.textContent =
                    error.message ||
                    "Unable to sign in.";

                message.className =
                    "error";

                loginButton.disabled =
                    false;

                loginButton.innerHTML =
                    `SIGN IN <span>→</span>`;

            }

        }
    );

}