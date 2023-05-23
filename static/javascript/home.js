var item_desriptions = {
    "1":"An Italian luxury sports car manufacturer based in Maranello, Italy. <br><br> $400,000",
    "2":"Pagani Automobili is an Italian manufacturer of hypercars and carbon fiber components. <br><br> $1,200,000",
    "3":"The namesake of the 'pony car' automobile segment, the Mustang was developed as a highly styled line of sporty coupes and convertibles <br><br> $250,000",
    "4":"Aston Martin is a modern, exclusive sports car brand with a unique heritage instantly recognised around the world. <br><br> $550,000",
}

var item_id = 0

var img_dict = {
    "1":"/static/images/car1.png",
    "2":"/static/images/car2.png",
    "3":"/static/images/car3.png",
    "4":"/static/images/car4.png"
}

var price_dict = {
    "1":400000,
    "2":1200000,
    "3":250000,
    "4":550000
}

function loadHome(){
    if (getCookie("user_name") == null){
        let nm = document.getElementById("navMenu")
        let sign = document.createElement("a")
        sign.innerHTML = "Signup and Login"; sign.setAttribute("href", "sign.html"); sign.setAttribute("id", "sign"); nm.appendChild(sign)
    }
    else {
        loadUsername()
        addItems()
    }
}

function loadUsername(){
    let username = getCookie("user_name")
    document.getElementById("User").innerHTML = username
}

function logout(){
    document.cookie = "user_name=; expires=Thu, 18 Dec 2013 12:00:00 UTC; path=/";
    document.cookie = "user_ID=; expires=Thu, 18 Dec 2013 12:00:00 UTC; path=/";
    window.location.href = "index.html";
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    else return null
  }

function addItems(){
    let um = document.getElementById("userMenu")
    let b = document.createElement("button")
    b.innerHTML = "Logout"; b.setAttribute("id", "logout_button"); b.setAttribute("class", "button"); b.setAttribute("onclick", "logout()"); um.appendChild(b)
    let nm = document.getElementById("navMenu")
    let shop = document.createElement("a")
    shop.innerHTML = "Shop"; shop.setAttribute("href", "shop.html"); nm.appendChild(shop)
    let orders = document.createElement("a")
    orders.innerHTML = "Orders"; orders.setAttribute("href", "orders.html"); nm.appendChild(orders)
    let cart = document.createElement("img")
    cart.setAttribute("class", "carticon"); cart.setAttribute("onclick", "openCart()"); cart.setAttribute("src", "/static/images/scart.png"); um.appendChild(cart)
}

function addRow(d1,d2,d3,d4){
    let tbody = document.getElementById("tbody")
    let tr = document.createElement("tr")
    tbody.appendChild(tr)
    let td1 = document.createElement("td")
    let td2 = document.createElement("td")
    let td3 = document.createElement("td")
    let td4 = document.createElement("td")
    td1.innerHTML = d1
    td2.innerHTML = d2
    td3.innerHTML = d3
    td4.innerHTML = d4
    tr.appendChild(td1)
    tr.appendChild(td2)
    tr.appendChild(td3)
    tr.appendChild(td4)
}

function getOrders() {
    httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = handle_getOrders;
    httpRequest.open('GET', '/api/getorders');
    httpRequest.send();
}

function handle_getOrders(){  
    if (httpRequest.readyState == 4 && httpRequest.status == 200) {
        let user_id = getCookie("user_ID")
        var order_arr = JSON.parse(httpRequest.responseText)
        for (i = 0; i < order_arr.length; i++){
            if (user_id == order_arr[i]["User_ID"]){
                addRow(order_arr[i]["Order_ID"], order_arr[i]["Order_Date"], order_arr[i]["Product_ID"], order_arr[i]["Product_Name"])
            }
        }  
    }
}

function openItem(id){
    var modal = document.getElementById("ItemModal");
    var modalImg = document.getElementById("img01");
    var description = document.getElementById("caption")
    modal.style.display = "block";
    description.innerHTML = item_desriptions[id]
    modalImg.src = img_dict[id]
    item_id = id

}

function closeItem(){
    var modal = document.getElementById("ItemModal");
    modal.style.display = "none";
}

function addCart(){
    var data = {};
    let user_id = getCookie("user_ID");
    let product_id = item_id;
    data.user_id = user_id;
    data.product_id = product_id;
    var json = JSON.stringify(data);
    var xhr = new XMLHttpRequest();
    var url = "api/addcart";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            if (xhr.responseText == 1) {location.reload()}
        };
    }
    xhr.send(json);
}

function openCart(){
    var data = {};
    let user_id = getCookie("user_ID");
    data.user_id = user_id;
    var json = JSON.stringify(data);
    var xhr = new XMLHttpRequest();
    var url = "api/opencart";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            if (xhr.responseText == "0") {alert("Shoppingcart empty"); location.reload();}
            else {handle_openCart(xhr.responseText)}
        };
    }
    xhr.send(json);
}

function handle_openCart(response){
    var modal = document.getElementById("CartModal");
    modal.style.display = "block";

    total_val = 0

    let cartlable = document.createElement("div")
    cartlable.setAttribute("class", "cartlable")
    cartlable.innerHTML = "Shopping Cart"
    modal.appendChild(cartlable)

    let cross = document.createElement("span")
    cross.setAttribute("class", "cartclose")
    cross.setAttribute("onclick", "closeCart()")
    cross.innerHTML = "&times;"
    modal.appendChild(cross)


    response = JSON.parse(response)
    for (const [key, value] of Object.entries(response)) {
        addCartitem(key, value, price_dict[key])
        total_val += value * price_dict[key]
    }
    
    let total = document.createElement("div")
    total.setAttribute("class", "total")
    total.innerHTML = "Total Price: $" + total_val
    modal.appendChild(total)

    let confirmo = document.createElement("button")
    confirmo.setAttribute("class","confirmorder")
    confirmo.setAttribute("onclick", "confirmOrder()")
    confirmo.innerHTML = "Confirm Order"
    modal.appendChild(confirmo)
    
}

function addCartitem(id, order_quantity, price){

    var modal = document.getElementById("CartModal");
    let cartitem = document.createElement("div")
    cartitem.setAttribute("class", "cartitem")
    modal.appendChild(cartitem)

    let img = document.createElement("img")
    img.setAttribute("class", "cartimg")
    img.src = img_dict[id]

    let ctext1 = document.createElement("div")
    ctext1.setAttribute("class", "ctext1")
    ctext1.innerHTML = "<br>Ordered Quantity: <br>" + order_quantity

    let ctext2 = document.createElement("div")
    ctext2.setAttribute("class", "ctext2")
    ctext2.innerHTML = "<br>Price: <br>$"+ order_quantity * price

    let trashbin = document.createElement("img")
    trashbin.setAttribute("id", id)
    trashbin.setAttribute("onclick", "delete_cartItem(this.id)")
    trashbin.setAttribute("class", "trashbin")
    trashbin.src = "/static/images/trash.png"

    cartitem.appendChild(img)
    cartitem.appendChild(ctext1)
    cartitem.appendChild(ctext2)
    cartitem.appendChild(trashbin)
}

function closeCart(){
    var modal = document.getElementById("CartModal");
    modal.innerHTML = ""
    modal.style.display = "none";
    location.reload();
}

function delete_cartItem(id){
    var data = {};
    let user_id = getCookie("user_ID");
    let product_id = id;
    data.user_id = user_id;
    data.product_id = product_id;
    var json = JSON.stringify(data);
    var xhr = new XMLHttpRequest();
    var url = "api/deletecartitem";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            if (xhr.responseText == "1") {
                var modal = document.getElementById("CartModal");
                modal.innerHTML = "";
                openCart();
            }
        };
    }
    xhr.send(json);
}

function cartValue(){
    var data = {};
    let user_id = getCookie("user_ID");
    data.user_id = user_id;
    var json = JSON.stringify(data);
    var xhr = new XMLHttpRequest();
    var url = "api/cartvalue";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            if (xhr.responseText != "0") {handle_cartValue(xhr.responseText)}
        };
    }
    xhr.send(json);
}

function handle_cartValue(num){
    body = document.getElementById("body")
    let cv = document.createElement("div")
    cv.setAttribute("class", "cartvalue")
    cv.innerHTML = num
    body.appendChild(cv)
}

function confirmOrder(){
    var data = {};
    let user_id = getCookie("user_ID");
    data.user_id = user_id;
    var json = JSON.stringify(data);
    var xhr = new XMLHttpRequest();
    var url = "api/confirmorder";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            console.log(xhr.responseText)
            handle_confirmOrder(xhr.responseText)
        };
    }
    xhr.send(json);
}

function handle_confirmOrder(response){
    if (response == "1"){
        location.reload();
    }
    else {
        alert(response)
        location.reload();
    }

}