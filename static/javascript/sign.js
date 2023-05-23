async function sha256(message) {

    const msgBuffer = new TextEncoder().encode(message);            
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));         
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

async function Signup() {
 
    var data = {};
    let username = document.getElementById("Signup_Username").value
    let email = document.getElementById("Signup_Email").value
    let password = await sha256(document.getElementById("Signup_Password").value)
    data.username = username;
    data.email = email;
    data.password = password;
    var json = JSON.stringify(data);
    var xhr = new XMLHttpRequest();
    var url = "api/signup";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
        console.log(xhr.responseText)
        if (xhr.responseText == "0") {alert("User already exists"); location.reload()}
        else if (xhr.responseText == "1") {alert("User " + username + " was successfully created"); location.reload()}
        }
    };

    xhr.send(json);
}

function Login() {
    httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = handleLogin;
    httpRequest.open('GET', '/api/login');
    httpRequest.send();
}

async function handleLogin() {
    if (httpRequest.readyState == 4 && httpRequest.status == 200) {
        var user_arr = JSON.parse(httpRequest.responseText)
        let username = document.getElementById("Login_Username").value

        let password = await sha256(document.getElementById("Login_Password").value)
        for (i = 0; i < user_arr.length; i++){
            if (user_arr[i]["Username"] == username) {
                if (user_arr[i]["Password"] == password) {LoginOK(user_arr[i]["User_ID"], user_arr[i]["Username"]); return}
                else {alert("Wrong Password"); return}
            } 
        }
        alert("User does not exist")
    }
}

function LoginOK(user_id, user_name) {
    document.cookie = "user_ID=" + user_id
    document.cookie = "user_name=" + user_name
    window.location.href = "index.html";
}

