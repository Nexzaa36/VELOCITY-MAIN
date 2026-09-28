// =============================
// RUNFOLD AUTH HELPERS
// =============================

const API_BASE_URL = "http://localhost:5000/api";

function getCurrentUser() {
    try {
        return JSON.parse(
            localStorage.getItem("user")
        );
    } catch (error) {
        return null;
    }
}

function getToken() {
    return localStorage.getItem("token");
}

function isLoggedIn() {
    return !!getToken();
}

function logoutUser() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    localStorage.removeItem("runfold-auth");
    localStorage.removeItem("runfold-user");

    window.location.href = "login.html";
}