from flask import Flask, render_template, request, redirect
import datetime

app = Flask(__name__)
expenses = []

@app.route("/")
def home():
    total = sum([expense[1] for expense in expenses])
    return render_template("index.html", expenses=expenses, total=total)

@app.route("/add", methods=["POST"])
def add_expense():
    name = request.form["name"]
    amount_text = request.form["amount"]

    # Check type + تحويل الأنواع + Try/Except
    print(f"Type before: {type(amount_text)}")

    try:
        amount = float(amount_text)
        print(f"Type after: {type(amount)}")
    except:
        print("Error: Not a number")
        return redirect("/")

    if amount <= 0:
        print("Amount must be > 0")
        return redirect("/")

    date = str(datetime.date.today())
    expenses.append([name, amount, date])
    return redirect("/")

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")
