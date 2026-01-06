Creating virtual environment:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
    Above is done because PowerShell + Windows blocks script execution by default for security reasons. The above allows it.
.\venv\Scripts\Activate.ps1
    executes virtual environment
pip install fastapi uvicorn sqlalchemy pymysql python-dotenv
    installs all the necessary dependencies
uvicorn app.main:app --reload --port 8001
    to execute the server
    