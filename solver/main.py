from __future__ import annotations

import json
import sys
from typing import Any

from fastapi import FastAPI
from fastapi.responses import JSONResponse

try:
    from solver.model import solve_timetable
except ModuleNotFoundError:
    from model import solve_timetable

app = FastAPI(title="Acadule Timetable Solver", version="1.0.0")


@app.post("/solve")
def solve(payload: dict[str, Any]) -> JSONResponse:
    return JSONResponse(solve_timetable(payload))


if __name__ == "__main__":
    payload = json.load(sys.stdin)
    json.dump(solve_timetable(payload), sys.stdout)
    sys.stdout.write("\n")
