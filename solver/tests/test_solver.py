from solver.model import solve_timetable


def base_problem():
    return {
        "sections": [{"id": "A", "capacity": 30, "defaultRoomId": "R1"}, {"id": "B", "capacity": 30, "defaultRoomId": "R2"}],
        "teachers": [{"id": "T1"}],
        "subjects": [{"id": "PHY"}],
        "rooms": [{"id": "R1", "capacity": 40}, {"id": "R2", "capacity": 40}],
        "periods": [{"id": "P1"}, {"id": "P2"}],
        "workingDays": [{"day": "MONDAY", "enabled": True}, {"day": "TUESDAY", "enabled": True}, {"day": "WEDNESDAY", "enabled": True}],
        "assignments": [
            {"id": "TA", "sectionId": "A", "teacherId": "T1", "subjectId": "PHY", "requiredWeeklyPeriods": 2},
            {"id": "TB", "sectionId": "B", "teacherId": "T1", "subjectId": "PHY", "requiredWeeklyPeriods": 2},
        ],
        "availability": {"teachers": [], "sections": [], "rooms": []},
    }


def test_shared_teacher_never_overlaps_sections():
    result = solve_timetable(base_problem())
    assert result["success"] is True
    teacher_slots = [(entry["teacherId"], entry["day"], entry["periodId"]) for entry in result["entries"]]
    assert len(teacher_slots) == len(set(teacher_slots))
    assert {entry["sectionId"] for entry in result["entries"]} == {"A", "B"}


def test_section_and_room_slots_are_unique():
    result = solve_timetable(base_problem())
    assert result["success"] is True
    section_slots = [(entry["sectionId"], entry["day"], entry["periodId"]) for entry in result["entries"]]
    room_slots = [(entry["roomId"], entry["day"], entry["periodId"]) for entry in result["entries"]]
    assert len(section_slots) == len(set(section_slots))
    assert len(room_slots) == len(set(room_slots))


def test_section_uses_one_default_room_for_all_subject_sessions():
    result = solve_timetable(base_problem())
    assert result["success"] is True
    assert {entry["roomId"] for entry in result["entries"] if entry["sectionId"] == "A"} == {"R1"}
    assert {entry["roomId"] for entry in result["entries"] if entry["sectionId"] == "B"} == {"R2"}


def test_unavailable_default_room_is_not_replaced():
    problem = base_problem()
    problem["assignments"].append({"id": "TA2", "sectionId": "A", "teacherId": "T1", "subjectId": "PHY", "requiredWeeklyPeriods": 1})
    problem["availability"]["rooms"] = [{"roomId": "R1", "day": day, "periodId": period, "status": "UNAVAILABLE"} for day in ("MONDAY", "TUESDAY", "WEDNESDAY") for period in ("P1", "P2")]
    result = solve_timetable(problem)
    assert result["success"] is False


def test_unavailable_teacher_is_respected():
    problem = base_problem()
    problem["availability"]["teachers"] = [{"teacherId": "T1", "day": "MONDAY", "periodId": "P1", "status": "UNAVAILABLE"}]
    result = solve_timetable(problem)
    assert result["success"] is True
    assert all((entry["day"], entry["periodId"]) != ("MONDAY", "P1") for entry in result["entries"])


def test_unavailable_section_and_room_are_respected():
    problem = base_problem()
    problem["availability"]["sections"] = [{"sectionId": "A", "day": "MONDAY", "periodId": "P1", "status": "UNAVAILABLE"}]
    problem["availability"]["rooms"] = [{"roomId": "R1", "day": "MONDAY", "periodId": "P2", "status": "UNAVAILABLE"}]
    result = solve_timetable(problem)
    assert result["success"] is True
    assert all(not (entry["sectionId"] == "A" and entry["day"] == "MONDAY" and entry["periodId"] == "P1") for entry in result["entries"])
    assert all(not (entry["roomId"] == "R1" and entry["day"] == "MONDAY" and entry["periodId"] == "P2") for entry in result["entries"])


def test_infeasible_room_capacity_is_explained():
    problem = base_problem()
    problem["rooms"] = [{"id": "R1", "capacity": 10}]
    result = solve_timetable(problem)
    assert result["success"] is False
    assert "No feasible timetable found" not in result["errors"]
    assert any("valid slots" in error for error in result["errors"])
