const API_URL = "http://localhost:5000";

const form = document.getElementById("adminLoginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const message = document.getElementById("loginMessage");
const togglePassword = document.getElementById("togglePassword");

// Check required elements
if (!form || !emailInput || !passwordInput || !loginButton || !message || !togglePassword) {
    console.error("Admin login page is missing one or more required elements.");
}

// Redirect only when an admin session already exists
const existingAdminToken = localStorage.getItem("adminToken");
const existingAdminRole = localStorage.getItem("adminRole");

if (existingAdminToken && existingAdminRole === "admin") {
    window.location.replace("./admin-dashboard.html");
}

// Password visibility
if (togglePassword) {
    togglePassword.addEventListener("click", () => {
        const isPassword = passwordInput.type === "password";

        passwordInput.type = isPassword ? "text" : "password";
        togglePassword.textContent = isPassword ? "HIDE" : "SHOW";
    });
}

// Admin login
if (form) {
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        message.textContent = "";
        message.className = "";

        loginButton.disabled = true;
        loginButton.innerHTML = "AUTHENTICATING...";

        try {
            const email = emailInput.value.trim().toLowerCase();
            const password = passwordInput.value;

            if (!email || !password) {
                throw new Error("Please enter your admin email and password.");
            }

            console.log("=================================");
            console.log("ADMIN LOGIN");
            console.log("Email:", email);
            console.log("API:", `${API_URL}/api/admin/auth/login`);
            console.log("=================================");

            // Abort request if backend does not respond within 10 seconds
            const controller = new AbortController();

            const timeout = setTimeout(() => {
                controller.abort();
            }, 10000);

            let response;

            try {
                response = await fetch(
                    `${API_URL}/api/admin/auth/login`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            email,
                            password
                        }),
                        signal: controller.signal
                    }
                );
            } finally {
                clearTimeout(timeout);
            }

            console.log("Admin login HTTP status:", response.status);

            const contentType =
                response.headers.get("content-type") || "";

            if (!contentType.includes("application/json")) {
                const serverResponse = await response.text();

                console.error(
                    "Non-JSON server response:",
                    serverResponse
                );

                throw new Error(
                    "Admin login server returned an invalid response."
                );
            }

            const data = await response.json();

            console.log("Admin Login Response:", data);

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Invalid admin credentials."
                );
            }

            if (!data.token || !data.admin) {
                throw new Error(
                    "Invalid admin login response from server."
                );
            }

            if (data.admin.role !== "admin") {
                throw new Error(
                    "This account does not have administrator access."
                );
            }

            // Store admin session separately from customer session
            localStorage.setItem(
                "adminToken",
                data.token
            );

            localStorage.setItem(
                "adminRole",
                "admin"
            );

            localStorage.setItem(
                "adminUser",
                JSON.stringify(data.admin)
            );

            // Remove an old admin session accidentally stored in customer keys
            if (localStorage.getItem("role") === "admin") {
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                localStorage.removeItem("user");
            }

            console.log("Admin session created successfully.");

            message.textContent =
                "Login successful. Redirecting...";

            message.className = "success";

            loginButton.innerHTML = "SUCCESS";

            setTimeout(() => {
                window.location.replace(
                    "./admin-dashboard.html"
                );
            }, 300);
        } catch (error) {
            console.error("Admin Login Error:", error);

            if (error.name === "AbortError") {
                message.textContent =
                    "Admin login server did not respond. Check that the backend is running on port 5000.";

                message.className = "error";
            } else {
                message.textContent =
                    error.message ||
                    "Unable to sign in.";

                message.className = "error";
            }

            loginButton.disabled = false;
            loginButton.innerHTML =
                `SIGN IN <span>→</span>`;
        }
    });
}