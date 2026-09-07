from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from typing import Any

from ortools.sat.python import cp_model


@dataclass(frozen=True)
class Candidate:
    assignment_id: str
    section_id: str
    teacher_id: str
    subject_id: str
    room_id: str
    day: str
    period_id: str


def _as_id(value: Any) -> str:
    return str(value or "").strip()


def _unavailable(records: list[dict[str, Any]], entity_key: str) -> set[tuple[str, str, str]]:
    return {
        (_as_id(record.get(entity_key)), _as_id(record.get("day")), _as_id(record.get("periodId")))
        for record in records
        if str(record.get("status", "AVAILABLE")).upper() == "UNAVAILABLE"
    }


def solve_timetable(payload: dict[str, Any], time_limit_seconds: float = 20.0) -> dict[str, Any]:
    sections = { _as_id(item.get("id")): item for item in payload.get("sections", []) }
    teachers = { _as_id(item.get("id")): item for item in payload.get("teachers", []) }
    subjects = { _as_id(item.get("id")): item for item in payload.get("subjects", []) }
    rooms = { _as_id(item.get("id")): item for item in payload.get("rooms", []) }
    periods = [_as_id(item.get("id")) for item in payload.get("periods", []) if _as_id(item.get("id"))]
    working_days = [
        _as_id(item.get("day") if isinstance(item, dict) else item)
        for item in payload.get("workingDays", [])
        if (item.get("enabled", True) if isinstance(item, dict) else True)
    ]
    assignments = payload.get("assignments", [])
    unavailable_teachers = _unavailable(payload.get("availability", {}).get("teachers", []), "teacherId")
    unavailable_sections = _unavailable(payload.get("availability", {}).get("sections", []), "sectionId")
    unavailable_rooms = _unavailable(payload.get("availability", {}).get("rooms", []), "roomId")

    errors: list[str] = []
    candidates: list[Candidate] = []
    candidates_by_assignment: dict[str, list[int]] = defaultdict(list)

    for assignment in assignments:
        assignment_id = _as_id(assignment.get("id"))
        section_id = _as_id(assignment.get("sectionId"))
        teacher_id = _as_id(assignment.get("teacherId"))
        subject_id = _as_id(assignment.get("subjectId"))
        required = int(assignment.get("requiredWeeklyPeriods", 0) or 0)
        if not assignment_id or section_id not in sections or teacher_id not in teachers or subject_id not in subjects:
            errors.append(f"Assignment {assignment_id or '<unknown>'} references an invalid section, teacher, or subject")
            continue
        if required < 1:
            errors.append(f"Assignment {assignment_id} must require at least one weekly period")
            continue

        for day in working_days:
            for period_id in periods:
                if (teacher_id, day, period_id) in unavailable_teachers:
                    continue
                if (section_id, day, period_id) in unavailable_sections:
                    continue
                for room_id, room in rooms.items():
                    if int(room.get("capacity", 0) or 0) < int(sections[section_id].get("capacity", 0) or 0):
                        continue
                    if (room_id, day, period_id) in unavailable_rooms:
                        continue
                    candidate = Candidate(assignment_id, section_id, teacher_id, subject_id, room_id, day, period_id)
                    candidates_by_assignment[assignment_id].append(len(candidates))
                    candidates.append(candidate)

        if len(candidates_by_assignment[assignment_id]) < required:
            errors.append(
                f"Assignment {assignment_id} requires {required} weekly periods but only "
                f"{len(candidates_by_assignment[assignment_id])} valid slots are available"
            )

    if errors:
        return {"success": False, "entries": [], "errors": errors, "statistics": {"candidateCount": len(candidates)}}

    model = cp_model.CpModel()
    variables = [model.NewBoolVar(f"slot_{index}") for index in range(len(candidates))]

    for assignment in assignments:
        assignment_id = _as_id(assignment.get("id"))
        required = int(assignment.get("requiredWeeklyPeriods", 0) or 0)
        model.Add(sum(variables[index] for index in candidates_by_assignment[assignment_id]) == required)

    groups: dict[tuple[str, str, str], list[int]] = defaultdict(list)
    for index, candidate in enumerate(candidates):
        groups[("teacher", candidate.teacher_id, candidate.day + ":" + candidate.period_id)].append(index)
        groups[("section", candidate.section_id, candidate.day + ":" + candidate.period_id)].append(index)
        groups[("room", candidate.room_id, candidate.day + ":" + candidate.period_id)].append(index)
    for indexes in groups.values():
        model.Add(sum(variables[index] for index in indexes) <= 1)

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit_seconds
    solver.parameters.num_search_workers = 8
    status = solver.Solve(model)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {
            "success": False,
            "entries": [],
            "errors": ["No feasible timetable found", "The weekly requirements, availability, capacity, and collision constraints cannot all be satisfied."],
            "statistics": {"candidateCount": len(candidates), "solverStatus": solver.StatusName(status)},
        }

    entries = [
        {
            "assignmentId": candidate.assignment_id,
            "sectionId": candidate.section_id,
            "teacherId": candidate.teacher_id,
            "subjectId": candidate.subject_id,
            "roomId": candidate.room_id,
            "day": candidate.day,
            "periodId": candidate.period_id,
        }
        for index, candidate in enumerate(candidates)
        if solver.Value(variables[index])
    ]
    return {
        "success": True,
        "entries": entries,
        "errors": [],
        "statistics": {
            "candidateCount": len(candidates),
            "scheduledEntries": len(entries),
            "solverStatus": solver.StatusName(status),
            "wallTimeSeconds": solver.WallTime(),
        },
    }
