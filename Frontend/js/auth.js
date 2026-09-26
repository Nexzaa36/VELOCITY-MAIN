// =============================
// RUNFOLD AUTHENTICATION
// FRONTEND DEVELOPMENT VERSION
// =============================

function getUsers() {
    return JSON.parse(
        localStorage.getItem("runfold-users")
    ) || [];
}


function saveUsers(users) {
    localStorage.setItem(
        "runfold-users",
        JSON.stringify(users)
    );
}


function getCurrentUser() {
    return JSON.parse(
        localStorage.getItem("runfold-current-user")
    );
}


function isLoggedIn() {
    return getCurrentUser() !== null;
}


function registerUser(name, email, password) {

    const users = getUsers();

    const existingUser = users.find(
        user =>
            user.email.toLowerCase() ===
            email.toLowerCase()
    );

    if (existingUser) {
        return {
            success: false,
            message: "An account with this email already exists."
        };
    }

    const newUser = {
        id: "USR-" + Date.now(),
        name: name,
        email: email.toLowerCase(),
        password: password
    };

    users.push(newUser);

    saveUsers(users);

    return {
        success: true,
        message: "Account created successfully."
    };
}


function loginUser(email, password) {

    const users = getUsers();

    const user = users.find(
        user =>
            user.email.toLowerCase() ===
            email.toLowerCase() &&
            user.password === password
    );

    if (!user) {
        return {
            success: false,
            message: "Invalid email or password."
        };
    }

    const sessionUser = {
        id: user.id,
        name: user.name,
        email: user.email
    };

    localStorage.setItem(
        "runfold-current-user",
        JSON.stringify(sessionUser)
    );

    return {
        success: true,
        user: sessionUser
    };
}


function logoutUser() {

    localStorage.removeItem(
        "runfold-current-user"
    );

    window.location.href = "index.html";
}


function requireLogin() {

    if (!isLoggedIn()) {

        window.location.href =
            "login.html";

        return false;
    }

    return true;
}