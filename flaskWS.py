from flask import Flask, render_template, request, jsonify
import pymysql
import random
from datetime import date
from flask_talisman import Talisman
import time
import mysql.connector

app = Flask(__name__)
Talisman(app, content_security_policy=None)

cart = {}

def DBquery(query, mode, tuple = ()):
    connection = pymysql.connect(host="dsd400.port0.org", user="dsd400", password="krångligt_".encode().decode('latin1'),
    database="FHDB", charset="utf8mb4",
    cursorclass=pymysql.cursors.DictCursor)
    with connection:
        with connection.cursor() as cursor:
            if mode == "POST":
                cursor.execute("set autocommit = 1")
                cursor.execute(query, tuple)
                return
            elif mode == "GET":
                cursor.execute(query, tuple)
                result = cursor.fetchall()
                return result


@app.route('/index.html')
def index():
    return render_template('index.html')

@app.route('/orders.html')
def orders():
    return render_template('orders.html')

@app.route('/shop.html')
def shop():
    return render_template('shop.html')

@app.route('/sign.html')
def sign():
    return render_template('sign.html')

@app.route("/api/login")
def login():
    result = DBquery("SELECT * FROM Users", "GET")
    return jsonify(result)

@app.route("/api/signup", methods = ["GET","POST"])
def signup():
    content = request.json

    id = random.randint(0, 1000000)
    username = content["username"]
    email = content["email"]
    password = content["password"]

    result = DBquery("SELECT * FROM Users", "GET")
    for i in result:
        if i["Username"] == username:
            return "0"
    
    tup = (id, username, email, password)
    DBquery("INSERT INTO Users (User_ID, Username, Email, Password) VALUES (%s, %s, %s, %s);", "POST", tup)
    return "1"
    
@app.route("/api/getorders")
def getorders():
    result = DBquery("select User_Orders.Order_ID, User_Orders.Order_Date, User_Orders.Product_ID, Products.Product_Name, User_Orders.User_ID from User_Orders, Products where User_Orders.Product_ID = Products.Product_ID order by Order_ID;","GET")
    return jsonify(result)

@app.route("/api/addcart", methods = ["GET","POST"])
def addcart():
    content = request.json
    user_id = content["user_id"]
    product_id = content["product_id"]

    if user_id not in cart:
        cart[user_id] = {}
        user_dict = cart[user_id]
        user_dict[product_id] = 1
    else:
        user_dict = cart[user_id]
        if product_id not in user_dict:
            user_dict[product_id] = 1
        else:
            user_dict[product_id] += 1

    return "1"

@app.route("/api/opencart", methods = ["GET","POST"])
def opencart():
    content = request.json
    user_id = content["user_id"]
    if user_id in cart:
        return cart[user_id]
    else:
        return "0"

@app.route("/api/deletecartitem", methods = ["GET","POST"])
def deletecartitem():
    content = request.json
    user_id = content["user_id"]
    product_id = content["product_id"]

    user_dict = cart[user_id]
    user_dict.pop(product_id)

    if len(user_dict) == 0:
        cart.pop(user_id)

    return "1"

@app.route("/api/cartvalue", methods = ["GET","POST"])
def cartvalue():
    content = request.json
    user_id = content["user_id"]
    if user_id not in cart: return "0"
    res = 0
    for i in cart[user_id]:
        res += cart[user_id][i]
    return str(res)

@app.route("/api/confirmorder", methods = ["GET","POST"])
def confirmorder():
    content = request.json
    user_id = content["user_id"]
    user_dict = cart[user_id]
    reply = ""
    print(user_dict)
    for i in user_dict:
        for j in range(user_dict[i]):
            if placeorder(i, user_id):
                pass
            else:
                tup = (i,)
                prodname = DBquery("SELECT Product_Name from FHDB.Products where Product_ID = %s;", "GET", tup)
                prodname = prodname[0]["Product_Name"]
                reply = reply + (f"Failed to purchase item '{prodname}', item balance too low\n")
    cart.pop(user_id)
    if len(reply) == 0: reply = "1"
    return reply

def placeorder(product_id, user_id):
    db = mysql.connector.connect(
    host="dsd400.port0.org",
    user="dsd400",
    password="krångligt_",
    database="FHDB"
    )
    cursor = db.cursor()
    cursor.execute("START TRANSACTION;")
    try:
        # lås din rad där du vill handla
        product_id_tup = (product_id,)
        cursor.execute("SELECT * FROM FHDB.Products where Product_ID = %s FOR UPDATE;", product_id_tup)
        _ = cursor.fetchall()
        cursor.execute("SELECT Product_Balance FROM FHDB.Products where Product_ID = %s;", product_id_tup)
        # kolla om varan finns
        stock = cursor.fetchone()[0]
        if stock > 0:
            # uppdatera varan
            cursor.execute("UPDATE FHDB.Products SET Product_Balance = Product_Balance - 1 WHERE Product_ID = %s;", product_id_tup)
            cursor.execute("SELECT COUNT(*) as NUM FROM FHDB.User_Orders;")
            order_id = cursor.fetchone()[0] + 1
            tup = (order_id, date.today(), product_id, user_id)
            cursor.execute("INSERT INTO FHDB.User_Orders (Order_ID, Order_Date, Product_ID, User_ID) VALUES (%s, %s, %s, %s);", tup)
            db.commit()
            print("Transaction committed")
        else:
            # om varan är slut rollback
            cursor.close()
            db.rollback()
            print("Transaction rolled back")
            return False
    except Exception as e:
        # om error rollback
        cursor.close()
        db.rollback()
        print("Transaction rolled back")
        print(f"Error: {str(e)}")
        return False
    # stäng databas
    cursor.close()
    db.close()
    return True


if __name__ == '__main__':
    app.run(port=5000, host="0.0.0.0", ssl_context=('cert.pem', 'key.pem'))
