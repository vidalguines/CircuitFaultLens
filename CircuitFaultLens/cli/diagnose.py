#!/usr/bin/env python3
"""
CircuitFaultLens — Interactive CLI
Diagnose circuit faults from partial symptom descriptions.
"""

import sys
import os
import json
import textwrap

# Allow running from repo root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.core.engine import run_diagnosis, FAULT_KNOWLEDGE_BASE, normalise_symptom
from app.models.schemas import Symptom

# ANSI colours
R = "\033[0;31m"
G = "\033[0;32m"
Y = "\033[0;33m"
B = "\033[0;34m"
C = "\033[0;36m"
W = "\033[1;37m"
DIM = "\033[2m"
RESET = "\033[0m"
BOLD = "\033[1m"

BAND_COLOURS = {
    "HIGH": G,
    "MODERATE": Y,
    "LOW": Y,
    "UNLIKELY": DIM,
}

KNOWN_SYMPTOMS = sorted({
    s for fd in FAULT_KNOWLEDGE_BASE.values() for s in fd["symptoms"].keys()
})


def banner():
    print(f"""
{C}╔══════════════════════════════════════════════════════╗
║        C i r c u i t F a u l t L e n s              ║
║        Bayesian fault diagnosis under uncertainty    ║
╚══════════════════════════════════════════════════════╝{RESET}
""")


def print_hypothesis(idx: int, h):
    band_colour = BAND_COLOURS.get(h.confidence_band, DIM)
    bar_len = int(h.posterior * 40)
    bar = "█" * bar_len + "░" * (40 - bar_len)
    print(f"  {BOLD}{idx+1}.{RESET} {W}{h.description}{RESET}")
    print(f"     ID: {DIM}{h.fault_id}{RESET}")
    print(f"     {band_colour}{bar}{RESET} {h.posterior*100:.1f}%  [{h.confidence_band}]")
    print()


def print_tests(tests):
    print(f"\n{B}{BOLD}▸ Next-Best Tests (ranked by information gain / cost){RESET}\n")
    for i, t in enumerate(tests):
        gain_bar = "▮" * min(10, int(t.information_gain * 60))
        print(f"  {BOLD}{i+1}.{RESET} {W}{t.name}{RESET}")
        print(f"     Gain: {C}{gain_bar}{RESET}  Cost: {'⚡'*t.cost_units}  Targets: {DIM}{', '.join(t.target_faults)}{RESET}")
    print()


def prompt_symptoms() -> list[Symptom]:
    print(f"{Y}Known symptoms:{RESET}")
    for i, s in enumerate(KNOWN_SYMPTOMS):
        end = "\n" if (i + 1) % 4 == 0 else "  "
        print(f"  {DIM}{s}{RESET}", end=end)
    print("\n")
    raw = input(f"{W}Enter observed symptoms (comma-separated, aliases OK):{RESET} ").strip()
    if not raw:
        return []
    parts = [p.strip() for p in raw.split(",") if p.strip()]
    return [Symptom(name=p) for p in parts]


def prompt_absent() -> list[str]:
    raw = input(f"{W}Symptoms explicitly absent? (comma-separated, blank=none):{RESET} ").strip()
    if not raw:
        return []
    return [p.strip() for p in raw.split(",") if p.strip()]


def run_tests_dialog(already_run: list[str]) -> list[str]:
    raw = input(f"{W}Tests already performed? (comma-sep test IDs, blank=none):{RESET} ").strip()
    if not raw:
        return already_run
    ids = [p.strip() for p in raw.split(",") if p.strip()]
    return already_run + ids


def interactive_loop():
    banner()
    print(f"{DIM}Type 'quit' at any prompt to exit.  Type 'json' to dump last result.{RESET}\n")

    already_run: list[str] = []
    last_result = None

    while True:
        print(f"{C}{'─'*54}{RESET}")
        print(f"{BOLD}New diagnosis session{RESET}")
        symptoms = prompt_symptoms()

        if any(str(s.name).lower() == "quit" for s in symptoms):
            print("Goodbye.")
            break

        if not symptoms:
            print(f"{R}No symptoms entered — try again.{RESET}\n")
            continue

        absent = prompt_absent()
        already_run = run_tests_dialog(already_run)

        result = run_diagnosis(
            symptoms=symptoms,
            absent_symptoms=absent,
            already_run_tests=already_run,
            top_n=5,
        )
        last_result = result

        print(f"\n{G}{BOLD}▸ Fault Hypotheses  (completeness: {result.data_completeness*100:.0f}%){RESET}\n")
        for i, h in enumerate(result.hypotheses):
            print_hypothesis(i, h)

        print_tests(result.next_best_tests)

        cmd = input(f"{DIM}[Enter]=new session  [json]=dump  [quit]=exit ▸ {RESET}").strip().lower()
        if cmd == "quit":
            break
        if cmd == "json" and last_result:
            print(json.dumps(last_result.model_dump(), indent=2))
            print()


def main():
    try:
        interactive_loop()
    except KeyboardInterrupt:
        print(f"\n{DIM}Interrupted.{RESET}")


if __name__ == "__main__":
    main()
