install:
    python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && npm install && source .venv/bin/activate

run:
    uvicorn app:app --host 0.0.0.0 & npm start
