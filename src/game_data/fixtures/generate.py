"""Regenerates the game CSV fixtures in this folder.

Builds synthetic Firebase records for QA participant 9001 the way
Cognitive-Tasks writes them (record metadata plus a data_json trial array,
including redundant interim snapshots), then runs them through
json2csv-cogtask's own process_data, so the CSVs are exactly what staff
download. Needs the json2csv-cogtask checkout beside this repo:

    uv run --project ../json2csv-cogtask python src/game_data/fixtures/generate.py
"""
import os, shutil, sys, tempfile, uuid
from datetime import datetime, timedelta
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[3] / "json2csv-cogtask"))
import json2csv_cogtask as j2c

PID = "9001"
START = "2026-09-07"  # a Monday
UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15"
_uuid_n = 0


def new_uuid():
    global _uuid_n
    _uuid_n += 1
    return str(uuid.UUID(int=_uuid_n))


def stamp(dt):
    return dt.strftime("%Y-%m-%d %H:%M:%S") + " (Central Daylight Time)"


def common(day, session_uuid, began, experiment_name, pid=PID):
    return dict(
        cycle_start_date=START, connectivity=None, role="adolescent", day=str(day),
        last_commit="abc1234", lang="eng", experiment_name=experiment_name,
        subject_id=pid, study_id="77897789", session_id=session_uuid,
        session_uuid=session_uuid, CurrentDate=stamp(began), useragent=UA,
        on_mobile=True, screen_availHeight=844, screen_availWidth=390,
        Subject=pid, stimulus_load_time=12,
    )


def record(activity_id, task_version, session_uuid, began, trials, pid=PID, **extra):
    return dict(
        study_uid="Project SEED", user_uid=pid, session_uid=session_uuid,
        session_uuid=session_uuid, role="adolescent", activity_id=activity_id,
        timestamp_start=began.isoformat(), task_version=task_version,
        useragent=UA, debug_flag="false", event_type="on_finish()",
        data_json=trials, **extra,
    )


def instructions(base, began, index):
    return dict(base, trial_type="instructions", trial_index=index,
                task_section="instructions", trial_timestamp=stamp(began),
                time_elapsed=1000 * index)


# --- BDS ---------------------------------------------------------------------
BDS_LENGTHS = [2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8]


def bds_session(day, began, n_test, n_correct, n_training=4, pid=PID, su=None):
    su = su or new_uuid()
    # the task's jsPsych addProperties defaults, which every trial carries
    base = dict(common(day, su, began, "projectseed-bds-production", pid),
                ExperimentName="BDS-Seed", Session=1, List=str(day), Trial=None,
                TestTrial=None, accuracy=None, response=None)
    trials = [instructions(base, began, 0)]
    t = began
    for i in range(n_training + n_test):
        t += timedelta(seconds=9)
        test = i >= n_training
        k = i - n_training
        length = BDS_LENGTHS[k] if test else 2
        correct = (k < n_correct) if test else True
        trials.append(dict(
            base, trial_type="plugin-bds-response-pad", trial_index=len(trials),
            task_section="test" if test else "training",
            trial_timestamp=stamp(t), time_elapsed=int((t - began).total_seconds() * 1000),
            Trial=k + 1 if test else -999, TestTrial=1 if test else 0,
            List=length, accuracy=correct, CorrectResponse="12345678"[:length],
            BackwardCorrectResponse="87654321"[-length:], response="1" * length,
            reaction_time=1500, typing_time=2100,
        ))
    return su, trials


def bds_records():
    """Day 1 full (10/14 correct), 2 missing, 3 half done, 4 an abandoned
    session then a full one, 5 low accuracy, 6 full, 7 played after midnight."""
    plan = {
        1: [(datetime(2026, 9, 7, 21, 0), 14, 10)],
        3: [(datetime(2026, 9, 9, 21, 0), 7, 7)],
        4: [(datetime(2026, 9, 10, 21, 0), 3, 3), (datetime(2026, 9, 10, 21, 30), 14, 12)],
        5: [(datetime(2026, 9, 11, 21, 0), 14, 3)],
        6: [(datetime(2026, 9, 12, 21, 0), 14, 14)],
        7: [(datetime(2026, 9, 14, 0, 20), 14, 11)],
    }
    out = {}
    for day, sessions in plan.items():
        for began, n_test, n_correct in sessions:
            su, trials = bds_session(day, began, n_test, n_correct)
            out[f"bds-{su}"] = record("projectseed-bds-production", "0.3a", su, began, trials)
    # an interim snapshot of day 1 that json2csv must de-duplicate
    first = next(iter(out.values()))
    out["bds-interim"] = dict(first, event_type="on_interaction_data_update()",
                              data_json=first["data_json"][:8])
    return out


# --- Simon -------------------------------------------------------------------
def simon_session(day, began, n_test, n_correct, no_response=()):
    su = new_uuid()
    base = dict(common(day, su, began, "projectseed-simon-production"),
                ExperimentName="Simon-Seed")
    trials = [instructions(base, began, 0)]
    t = began
    n_training = 4
    for i in range(n_training + n_test):
        t += timedelta(seconds=3)
        test = i >= n_training
        k = i - n_training
        skipped = test and k in no_response
        correct = test and k < n_correct and not skipped or not test
        side = "left" if i % 2 else "right"
        trials.append(dict(
            base, trial_type="html-button-response", trial_index=len(trials),
            trialType="testing" if test else "training",
            task_section="test" if test else "training",
            trial_timestamp=stamp(t), time_elapsed=int((t - began).total_seconds() * 1000),
            Trial=k + 1 if test else -999, TrialEPrime=k + 1 if test else i + 1,
            Compatibility="compatible" if i % 3 else "incompatible",
            CorrectResponse=side, Procedure_Trial="TestingProc" if test else "TrainingList",
            Slide1_ACC=correct, Slide1_CRESP=side,
            FormResponse="none" if skipped else (side if correct else ("left" if side == "right" else "right")),
            Slide1_RT=-999 if skipped else 450 + 10 * (i % 5),
            StimulusLocation=side, StimulusColor="red" if i % 2 else "blue",
        ))
    return su, trials


def simon_records():
    """Day 1 full (28/32 correct), day 2 stopped halfway with two no-responses."""
    out = {}
    for day, began, n_test, n_correct, none in [
        (1, datetime(2026, 9, 7, 21, 5), 32, 28, ()),
        (2, datetime(2026, 9, 8, 21, 5), 16, 16, (14, 15)),
    ]:
        su, trials = simon_session(day, began, n_test, n_correct, none)
        out[f"simon-{su}"] = record("projectseed-simon-production", "0.3a", su, began, trials)
    return out


# --- Color-Shape -------------------------------------------------------------
def cs_session(day, began, n_test, n_correct, no_response=()):
    su = new_uuid()
    base = dict(common(day, su, began, "projectseed-cs-production"),
                ExperimentName="ColorShape-Seed")
    trials = [instructions(base, began, 0)]
    t = began
    n_training = 4
    words = ["COLOR", "COLOR", "SHAPE", "SHAPE", "COLOR"]
    for i in range(n_training + n_test):
        t += timedelta(seconds=3)
        test = i >= n_training
        k = i - n_training
        skipped = test and k in no_response
        correct = (k < n_correct and not skipped) if test else True
        word = words[i % len(words)]
        first = k == 0 or i == 0
        # a fixation row, which json2csv drops because it has no TrialType
        trials.append(dict(base, trial_type="html-keyboard-response", trial_index=len(trials),
                           task_section="fixation", trial_timestamp=stamp(t), TrialType=None))
        trials.append(dict(
            base, trial_type="html-button-response", trial_index=len(trials),
            task_section="test" if test else "training",
            trial_timestamp=stamp(t), time_elapsed=int((t - began).total_seconds() * 1000),
            Trial=k + 1 if test else -999, TrialEPrime=i + 1,
            TrialType=1 if first else ("STAY" if words[(i - 1) % len(words)] == word else "SWITCH"),
            Name=f"{word.lower()}-{i}", SwitchType=1, SpcSWITCH=1,
            CriticalSlide_CRESP=0, CriticalSlide_ACC=correct,
            CriticalSlide_RESP="none" if skipped else (0 if correct else 1),
            CriticalSlide_RT=0 if skipped else 600 + 10 * (i % 4),
            Procedure="Experproc" if test else "PracticeProc",
            Running="ColorShapeExperiment" if test else "PracticeList",
            SHAPE="circle", COLOR="red", StimulusWord=word,
        ))
    return su, trials


def cs_records():
    """Day 1 full (30/33 correct, one no-response), day 2 missing."""
    su, trials = cs_session(1, datetime(2026, 9, 7, 21, 10), 33, 30, (32,))
    return {f"cs-{su}": record("projectseed-cs-production", "0.3a", su, datetime(2026, 9, 7, 21, 10), trials)}


# --- Fortune Decks -----------------------------------------------------------
GAIN = {"A": 100, "B": 100, "C": 50, "D": 50}


def fortune_session(day, began, n_trials, picks):
    su = new_uuid()
    net = 2500
    trials = [dict(trial_type="instructions", trial_index=0, task_section="instructions",
                   stimulus="<p>Pick a deck</p>", trial_timestamp=stamp(began))]
    t = began
    for i in range(n_trials):
        t += timedelta(seconds=4)
        deck = picks[i % len(picks)]
        loss = -250 if deck in "AB" and i % 4 == 3 else (-50 if deck in "CD" and i % 5 == 4 else 0)
        net += GAIN[deck] + loss
        trials.append(dict(
            trial_type="html-button-response", trial_index=len(trials), task_section="test",
            trial_timestamp=stamp(t), time_elapsed=int((t - began).total_seconds() * 1000),
            Running="List1", List1_Cycle=1, List1_Sample=i + 1, Deck_ACC=0, Deck_CRESP="1234",
            Deck_RESP=deck, Deck_RT=900, totalsum=net, var=GAIN[deck] + loss, loss_event=loss,
            DeckA=200, DeckB=200, DeckC=100, DeckD=100,
            DeckAScreen=1, DeckBScreen=2, DeckCScreen=3, DeckDScreen=4,
            Deck_Screen_Position="ABCD".index(deck) + 1,
        ))
    meta = dict(
        cycle_start_date=START, day=str(day), last_commit="abc1234",
        lang="eng", expected_trial_count=80, experiment_name="projectseed-iowa-production",
        subject_id=PID, study_id="77897789", on_mobile=True, ExperimentName="IGT-Seed",
        ExperimentVersion="jspsych-0.4a-mobile", ExperimentPlatform="-mobile",
        window_innerHeight=750, window_innerWidth=390, screen_availHeight=844,
        screen_availWidth=390, screen_width=390, screen_height=844,
    )
    return su, record("projectseed-iowa-production", "0.4a", su, began, trials, **meta)


def fortune_records():
    """Day 8 full (decks in turn), day 9 missing, day 10 stopped at 40 picks
    of mostly C and D."""
    out = {}
    for day, began, n, picks in [
        (8, datetime(2026, 9, 14, 21, 0), 80, "ABCD"),
        (10, datetime(2026, 9, 16, 21, 0), 40, "CDCDA"),
    ]:
        su, rec = fortune_session(day, began, n, picks)
        out[f"igt-{su}"] = rec
    first = next(iter(out.values()))
    out["igt-interim"] = dict(first, event_type="on_interaction_data_update()",
                              data_json=first["data_json"][:31])
    return out


if __name__ == "__main__":
    os.chdir(tempfile.mkdtemp())  # json2csv writes timestamped folders into the cwd
    cog = {**bds_records(), **simon_records(), **cs_records()}
    # a second QA participant who played BDS once, to check rows stay apart
    su, trials = bds_session(1, datetime(2026, 9, 7, 19, 0), 14, 14, pid="9002", su="second-participant")
    other = {f"bds-{su}": record("projectseed-bds-production", "0.3a", su, datetime(2026, 9, 7, 19, 0), trials, pid="9002")}
    j2c.process_data("Mind Mix 1", data=[{PID: {"cog": cog, "igt": fortune_records()}, "9002": {"cog": other}}])
    for path in j2c._LAST_OUTPUT_FILES:  # ".../2026-10-03-1933-bds.csv" -> "bds.csv"
        shutil.copy(path, HERE / path.rsplit("-", 1)[1])
