import time
import webbrowser
import os

class WebGraph:
    def __init__(self):
        # История: bot_id -> список (время, всего_хороших, всего_мусора, доход)
        self.history = {}
        
        # Цены на книги (в монетах). Можешь менять тут.
        self.prices = {
            "магнит": 1050000,   # Среднее между 900к и 1200к
            "бульдозер": 1500000,
            "починка": 150000,
            "mending": 150000,
            "эффективность": 50000,
            "efficiency": 50000,
            "прочность": 30000,
            "unbreaking": 30000,
        }
        self.default_price = 100000 # Если книга неизвестная, считаем 100к

    def update_history(self, bot_id, books_good, books_trash, current_books):
        if bot_id not in self.history:
            self.history[bot_id] = []
        
        # Считаем примерный доход
        profit = 0
        # 1. Добавляем доход от книг, которые прямо сейчас в инвентаре
        for name, count in current_books.items():
            name_lower = name.lower()
            price = self.default_price
            for key, val in self.prices.items():
                if key in name_lower:
                    price = val
                    break
            profit += price * count

        # 2. Добавляем базовый доход от всех зачарованных книг (примерно)
        # Если в инвентаре пусто, но books_good > 0, значит они в шалкере.
        # Берем среднюю цену 500к за книгу в шалкере.
        profit += books_good * 500000

        now = time.strftime("%H:%M:%S")
        
        # Записываем точку раз в 5 секунд, чтобы график не был слишком плотным
        if not self.history[bot_id] or time.time() - self.history[bot_id][-1][4] >= 5:
            self.history[bot_id].append((now, books_good, books_trash, profit, time.time()))
            
            # Ограничиваем историю 500 точками (чтобы не лагало)
            if len(self.history[bot_id]) > 500:
                self.history[bot_id].pop(0)

    def open_graph(self, bot_id):
        data = self.history.get(bot_id, [])
        if not data:
            print("Нет данных для графика!")
            return

        labels = [d[0] for d in data]
        good_data = [d[1] for d in data]
        trash_data = [d[2] for d in data]
        profit_data = [d[3] for d in data]

        # Красивый HTML шаблон с Chart.js
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Farm+ График - {bot_id}</title>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                body {{
                    background-color: #1e1e1e;
                    color: #ffffff;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }}
                .container {{
                    width: 90%;
                    max-width: 1200px;
                    background: #2b2b2b;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                }}
                h1 {{ text-align: center; color: #4CAF50; }}
                .stats {{
                    display: flex;
                    justify-content: space-around;
                    margin-bottom: 20px;
                    font-size: 18px;
                }}
                .stat-box {{
                    background: #333;
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                    min-width: 200px;
                }}
                .stat-value {{ font-size: 24px; font-weight: bold; }}
                .val-good {{ color: #4CAF50; }}
                .val-trash {{ color: #F44336; }}
                .val-profit {{ color: #FFD700; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📊 Статистика зачарований: {bot_id}</h1>
                
                <div class="stats">
                    <div class="stat-box">
                        <div>Ценных книг</div>
                        <div class="stat-value val-good">{good_data[-1] if good_data else 0}</div>
                    </div>
                    <div class="stat-box">
                        <div>Мусора</div>
                        <div class="stat-value val-trash">{trash_data[-1] if trash_data else 0}</div>
                    </div>
                    <div class="stat-box">
                        <div>Примерный доход</div>
                        <div class="stat-value val-profit">{profit_data[-1] if profit_data else 0:,} монет</div>
                    </div>
                </div>

                <canvas id="myChart"></canvas>
            </div>

            <script>
                const ctx = document.getElementById('myChart').getContext('2d');
                const myChart = new Chart(ctx, {{
                    type: 'line',
                    data: {{
                        labels: {labels},
                        datasets: [
                            {{
                                label: 'Ценные книги',
                                data: {good_data},
                                borderColor: '#4CAF50',
                                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                                borderWidth: 2,
                                tension: 0.3,
                                fill: true
                            }},
                            {{
                                label: 'Мусор',
                                data: {trash_data},
                                borderColor: '#F44336',
                                backgroundColor: 'rgba(244, 67, 54, 0.2)',
                                borderWidth: 2,
                                tension: 0.3,
                                fill: true
                            }},
                            {{
                                label: 'Доход (x1000)',
                                data: {profit_data}.map(v => v / 1000),
                                borderColor: '#FFD700',
                                borderWidth: 2,
                                borderDash: [5, 5],
                                yAxisID: 'y1',
                                tension: 0.3
                            }}
                        ]
                    }},
                    options: {{
                        responsive: true,
                        interaction: {{
                            mode: 'index',
                            intersect: false,
                        }},
                        plugins: {{
                            legend: {{ labels: {{ color: '#fff' }} }}
                        }},
                        scales: {{
                            x: {{
                                ticks: {{ color: '#aaa' }},
                                grid: {{ color: '#444' }}
                            }},
                            y: {{
                                type: 'linear',
                                display: true,
                                position: 'left',
                                ticks: {{ color: '#4CAF50' }},
                                grid: {{ color: '#444' }},
                                title: {{ display: true, text: 'Количество книг', color: '#fff' }}
                            }},
                            y1: {{
                                type: 'linear',
                                display: true,
                                position: 'right',
                                ticks: {{ 
                                    color: '#FFD700',
                                    callback: function(value) {{ return value + 'k'; }}
                                }},
                                grid: {{ drawOnChartArea: false }},
                                title: {{ display: true, text: 'Доход (тысячи)', color: '#FFD700' }}
                            }}
                        }}
                    }}
                }});
            </script>
        </body>
        </html>
        """
        
        # Сохраняем во временный файл и открываем в браузере
        file_path = os.path.abspath(f"graph_{bot_id}.html")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(html)
        
        webbrowser.open(f"file://{file_path}")