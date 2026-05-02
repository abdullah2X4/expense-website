from flask import Flask, render_template, request, redirect
import json
import os

app = Flask(__name__)
DATA_FILE = 'expenses.json'

def load_expenses():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_expenses(expenses):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(expenses, f, ensure_ascii=False, indent=2)

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        name = request.form['name']
        amount = float(request.form['amount'])
        expenses = load_expenses()
        expenses.append({'name': name, 'amount': amount})
        save_expenses(expenses)
        return redirect('/')
    
    expenses = load_expenses()
    total = sum(item['amount'] for item in expenses)
    return render_template('index.html', expenses=expenses, total=total)

@app.route('/delete/<int:id>')
def delete_expense(id):
    expenses = load_expenses()
    if 0 <= id < len(expenses):
        expenses.pop(id)
        save_expenses(expenses)
    return redirect('/')

if __name__ == '__main__':
    app.run(debug=True)
