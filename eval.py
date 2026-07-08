"""Evaluation script for the alarm-assist service.

Sends a set of known test questions to the running FastAPI /query endpoint
and checks each response. Two kinds of cases:

  - "answer" cases: the response MUST contain all of the given keywords
    (tag names, thresholds, valve numbers) — this checks the system
    returns the correct, complete procedure.

  - "refuse" cases: the response MUST decline (out-of-scope or unanswerable)
    and MUST NOT contain the "forbidden" keywords — this checks the system
    doesn't invent procedures it doesn't have.

Run the server first:   python -m uvicorn app:app --reload
Then in another terminal: python eval.py

Add new cases by appending to TEST_CASES. Keep it honest — keywords should
be things that genuinely must appear in a correct answer.
"""

import requests

ENDPOINT = "http://localhost:8000/query"

# Phrases that indicate a proper refusal. If any appears, we treat the
# response as "the system declined."
REFUSAL_MARKERS = [
    "do not have a procedure",
    "don't have a procedure",
    "no procedure",
    "not contain",
    "no mention",
    "does not contain",
]

# Each case:
#   name    - short label
#   type    - "answer" or "refuse"
#   question- what to send
#   expect  - for "answer": keywords that MUST all appear
#             for "refuse": keywords that MUST NOT appear (things it might
#             hallucinate). Can be empty; the refusal marker check still runs.
TEST_CASES = [
    # ---- Correct-answer cases ----
    {
        "name": "OTSG high pressure (PAHH-101)",
        "type": "answer",
        "question": "What is the ESD response when OTSG pressure exceeds 11,500 kPag?",
        "expect": ["SDV-101", "SDV-102", "11,500"],
    },
    {
        "name": "OTSG stack temp high (TAHH-101)",
        "type": "answer",
        "question": "What is the response to a TAHH-101 alarm?",
        "expect": ["SDV-FG-101", "burner"],
    },
    {
        "name": "FWKO separator level very low (LALL-201)",
        "type": "answer",
        "question": "What are all the steps for a LALL-201 low level alarm on the FWKO separator?",
        "expect": ["oil outlet", "supervisor"],
    },
    {
        "name": "FWKO separator level very high (LAHH-201)",
        "type": "answer",
        "question": "What do I do if the FWKO separator level gets too high?",
        "expect": ["ESP", "inlet"],
    },
    {
        "name": "ESP motor temp high (TAHH-ESP)",
        "type": "answer",
        "question": "Which shutdown valve closes when the ESP motor overheats?",
        "expect": ["SDV-201"],
    },

    # ---- Refusal cases (should decline, not invent) ----
    {
        "name": "Reactor coolant leak (out of domain)",
        "type": "refuse",
        "question": "What is the procedure for a reactor coolant leak?",
        "expect": ["SDV"],  # should NOT start naming shutdown valves
    },
    {
        "name": "OTSG LOW pressure (only high exists)",
        "type": "refuse",
        "question": "What do I do if OTSG pressure drops too low?",
        "expect": ["SDV-101", "SDV-102"],  # must not reuse the high-pressure valves
    },
    {
        "name": "Unknown tag (PAHH-301)",
        "type": "refuse",
        "question": "What is the response to a PAHH-301 alarm?",
        "expect": [],  # any confident procedure would be wrong; rely on refusal marker
    },
    {
        "name": "Wrong threshold (15,000 kPag)",
        "type": "refuse",
        "question": "What is the ESD response when OTSG pressure exceeds 15,000 kPag?",
        "expect": [],
    },
    {
        "name": "Gas turbine shutdown (wrong equipment)",
        "type": "refuse",
        "question": "What is the shutdown sequence for a gas turbine?",
        "expect": ["SDV"],
    },
]


def query(question: str) -> str:
    """Send one question to the service and return the answer text."""
    resp = requests.post(ENDPOINT, json={"question": question}, timeout=600)
    resp.raise_for_status()
    return resp.json().get("answer", "")


def looks_like_refusal(answer: str) -> bool:
    low = answer.lower()
    return any(marker in low for marker in REFUSAL_MARKERS)


def check_case(case: dict) -> tuple:
    """Return (passed: bool, detail: str) for one test case."""
    answer = query(case["question"])

    if case["type"] == "answer":
        missing = [kw for kw in case["expect"] if kw.lower() not in answer.lower()]
        if missing:
            return False, f"missing keywords: {missing}"
        return True, "found all required keywords"

    # refuse case
    refused = looks_like_refusal(answer)
    leaked = [kw for kw in case["expect"] if kw.lower() in answer.lower()]
    if refused and not leaked:
        return True, "correctly declined"
    if leaked:
        return False, f"did NOT refuse — leaked: {leaked}"
    return False, "did not clearly refuse (no refusal phrase found)"


def main():
    print(f"Running {len(TEST_CASES)} test cases against {ENDPOINT}\n")

    passed = 0
    answer_pass = answer_total = 0
    refuse_pass = refuse_total = 0

    for case in TEST_CASES:
        try:
            ok, detail = check_case(case)
        except Exception as e:
            ok, detail = False, f"ERROR calling service: {e}"

        tag = "PASS" if ok else "FAIL"
        print(f"[{tag}] ({case['type']}) {case['name']} — {detail}")

        if ok:
            passed += 1
        if case["type"] == "answer":
            answer_total += 1
            answer_pass += 1 if ok else 0
        else:
            refuse_total += 1
            refuse_pass += 1 if ok else 0

    print("\n" + "-" * 50)
    print(f"TOTAL:    {passed}/{len(TEST_CASES)} passed")
    print(f"Answers:  {answer_pass}/{answer_total} correct")
    print(f"Refusals: {refuse_pass}/{refuse_total} correct")
    if refuse_pass < refuse_total:
        print("\n⚠  A refusal case failed — the system answered something it "
              "should have declined. Investigate before shipping changes.")


if __name__ == "__main__":
    main()