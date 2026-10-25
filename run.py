import os
import subprocess
import sys

def main():
    print("=" * 56)
    print("              FARM+ HUB WEB SERVER v2.0")
    print("=" * 56)
    print()

    # Check if dependencies installed
    tsx_path = os.path.join("node_modules", "tsx")
    if not os.path.exists(tsx_path):
        print("[1/2] Установка библиотек (npm install --legacy-peer-deps)...")
        res = subprocess.run("npm install --legacy-peer-deps", shell=True)
        if res.returncode != 0:
            print("Повтор с флагом --force...")
            subprocess.run("npm install --force", shell=True)
        print()

    print("[2/2] Запуск сервера Farm+ Hub...")
    print("Панель доступна по адресу: http://localhost:3000")
    print()
    subprocess.run("npm run dev", shell=True)

if __name__ == "__main__":
    main()
