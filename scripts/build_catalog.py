#!/usr/bin/env python3
"""
build_catalog.py — Universal vehicle catalog pipeline (Phase 0).

Pulls two free, no-key sources and joins them into static JSON committed under
public/data/, so the app can let a user pick (or VIN-decode) ANY vehicle with no
backend:

  * fueleconomy.gov  bulk vehicles.csv   -> specs (powertrain, body class,
    drivetrain, EPA range, kWh/100mi, ...). This is the spec backbone; it covers
    essentially every EPA-rated US consumer vehicle.
  * NHTSA vPIC       GetAllMakes / GetModelsForMakeYear -> the make/model
    identity universe, used to (a) canonicalize make names and (b) fill
    identity-only entries for models that have no fuel-economy row (so the picker
    can still find them; the user supplies MSRP, which is now an attribute).

Output schema (public/data/catalog.json, list of):
  { id, year, make, model, trim, powertrain, body_class, drivetrain,
    battery_kwh, epa_range, kwh_per_100mi, msrp, seats, dc_peak_kw, aliases[] }
Null/unknown fields are omitted per entry to keep the payload small.

Stdlib only (urllib, csv, json, gzip, concurrent.futures) so it runs anywhere
with zero pip installs.

Usage:
  python3 scripts/build_catalog.py            # full build (fueleconomy + NHTSA)
  python3 scripts/build_catalog.py --no-nhtsa # fueleconomy only (fast)
  python3 scripts/build_catalog.py --verify   # look up the 20 test vehicles
"""

from __future__ import annotations

import argparse
import csv
import gzip
import io
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "scripts", ".cache")
NHTSA_CACHE = os.path.join(CACHE, "nhtsa")
OUT_DIR = os.path.join(ROOT, "public", "data")

VEHICLES_CSV_URL = "https://www.fueleconomy.gov/feg/epadata/vehicles.csv"
NHTSA = "https://vpic.nhtsa.dot.gov/api/vehicles"

START_YEAR = 2012
GZIP_BUDGET = 800 * 1024  # 800 KB target for the gzipped transfer size
# Battery capacity is not a source field. For EVs we estimate usable capacity
# from EPA range and wall-to-wheels consumption, backing out ~15% charging loss.
CHARGING_EFFICIENCY = 0.85

csv.field_size_limit(10_000_000)


# ── string normalization ──────────────────────────────────────────
def norm(s: str) -> str:
    """lowercase, punctuation -> space, whitespace collapsed."""
    s = re.sub(r"[^a-z0-9]+", " ", (s or "").lower())
    return re.sub(r"\s+", " ", s).strip()


def slug(*parts: str) -> str:
    return "-".join(p for p in (norm(x).replace(" ", "-") for x in parts) if p)


# ── network helpers ───────────────────────────────────────────────
def http_get(url: str, timeout: int = 40) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "ev-catalog-builder/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def download_vehicles_csv() -> str:
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, "vehicles.csv")
    if os.path.exists(path) and os.path.getsize(path) > 1_000_000:
        return path
    print("Downloading fueleconomy vehicles.csv ...", flush=True)
    data = http_get(VEHICLES_CSV_URL, timeout=180)
    with open(path, "wb") as f:
        f.write(data)
    return path


# ── fueleconomy parsing ───────────────────────────────────────────
def powertrain_of(atv: str, ft1: str) -> str:
    atv = (atv or "").strip()
    if atv == "EV":
        return "EV"
    if atv == "Plug-in Hybrid":
        return "PHEV"
    if atv == "Hybrid":
        return "Hybrid"
    if atv in ("FCV", "eFCV"):
        return "FCV"
    if atv == "Diesel":
        return "Diesel"
    return "ICE"  # gas, FFV, CNG, bi-fuel


def fnum(s: str):
    try:
        v = float(s)
        return v
    except (TypeError, ValueError):
        return None


def split_trim(model_full: str, base: str):
    """Return (model, trim). Handles Tesla-style ('Model 3 Long Range AWD' over
    base 'Model 3' -> trim 'Long Range AWD') and BMW-style ('330i' over base
    '3 Series' -> model '3 Series', trim '330i')."""
    model_full = (model_full or "").strip()
    base = (base or "").strip()
    if not base:
        return model_full, ""
    if model_full.lower().startswith(base.lower()):
        return base, model_full[len(base):].strip()
    # Disjoint family/trim naming: keep the family as model, the full label as trim.
    return base, ("" if norm(model_full) == norm(base) else model_full)


def parse_fueleconomy(path: str):
    """Return {(year,nmake,nmodel,ntrim): entry-dict} with specs."""
    groups: dict[tuple, dict] = {}
    with open(path, newline="", encoding="utf-8", errors="replace") as f:
        for row in csv.DictReader(f):
            year = row.get("year", "")
            if not year.isdigit() or int(year) < START_YEAR:
                continue
            year = int(year)
            make = (row.get("make") or "").strip()
            model, trim = split_trim(row.get("model"), row.get("baseModel"))
            if not make or not model:
                continue

            pt = powertrain_of(row.get("atvType", ""), row.get("fuelType1", ""))
            rng = fnum(row.get("range"))
            combe = fnum(row.get("combE"))
            epa_range = int(round(rng)) if rng and rng > 0 else None
            kwh100 = round(combe, 1) if combe and combe > 0 else None
            battery = None
            if pt == "EV" and epa_range and kwh100:
                battery = round(epa_range * (kwh100 / 100.0) * CHARGING_EFFICIENCY, 1)

            key = (year, norm(make), norm(model), norm(trim))
            entry = {
                "year": year,
                "make": make,
                "model": model,
                "trim": trim,
                "powertrain": pt,
                "body_class": (row.get("VClass") or "").strip() or None,
                "drivetrain": (row.get("drive") or "").strip() or None,
                "battery_kwh": battery,
                "epa_range": epa_range,
                "kwh_per_100mi": kwh100,
                "_src": "fe",
            }
            # Collapse duplicate configs (e.g. auto vs manual); prefer the row
            # that carries the richest EV/spec data.
            prev = groups.get(key)
            if prev is None or _richness(entry) > _richness(prev):
                groups[key] = entry
    return groups


def _richness(e: dict) -> int:
    return sum(
        1
        for k in ("battery_kwh", "epa_range", "kwh_per_100mi", "body_class", "drivetrain")
        if e.get(k) is not None
    )


# ── NHTSA identity universe ───────────────────────────────────────
def nhtsa_models(make: str, year: int) -> list[str]:
    os.makedirs(NHTSA_CACHE, exist_ok=True)
    cache = os.path.join(NHTSA_CACHE, f"{norm(make).replace(' ', '_')}_{year}.json")
    if os.path.exists(cache):
        try:
            with open(cache) as f:
                return json.load(f)
        except Exception:
            pass
    url = (
        f"{NHTSA}/GetModelsForMakeYear/make/"
        f"{urllib.parse.quote(make)}/modelyear/{year}?format=json"
    )
    try:
        data = json.loads(http_get(url, timeout=30))
        models = sorted({(r.get("Model_Name") or "").strip() for r in data.get("Results", []) if r.get("Model_Name")})
    except Exception:
        models = []
    with open(cache, "w") as f:
        json.dump(models, f)
    return models


def enrich_with_nhtsa(groups: dict, makes: list[str], years: list[int]):
    """Add identity-only entries for (year, make, base model) with no FE row."""
    have_base = {(y, nm, nmod) for (y, nm, nmod, _tr) in groups}
    jobs = [(mk, yr) for mk in makes for yr in years]
    print(f"NHTSA: fetching model lists for {len(jobs)} make/year pairs ...", flush=True)
    added = 0
    done = 0
    with ThreadPoolExecutor(max_workers=16) as ex:
        futs = {ex.submit(nhtsa_models, mk, yr): (mk, yr) for mk, yr in jobs}
        for fut in as_completed(futs):
            mk, yr = futs[fut]
            done += 1
            if done % 250 == 0:
                print(f"  ... {done}/{len(jobs)}", flush=True)
            for model in fut.result():
                nm, nmod = norm(mk), norm(model)
                if (yr, nm, nmod) in have_base:
                    continue
                key = (yr, nm, nmod, "")
                if key in groups:
                    continue
                groups[key] = {
                    "year": yr,
                    "make": mk,
                    "model": model,
                    "trim": "",
                    "powertrain": None,
                    "body_class": None,
                    "drivetrain": None,
                    "battery_kwh": None,
                    "epa_range": None,
                    "kwh_per_100mi": None,
                    "_src": "nhtsa",
                }
                have_base.add((yr, nm, nmod))
                added += 1
    print(f"NHTSA: added {added} identity-only entries.", flush=True)


def fueleconomy_makes(groups: dict) -> list[str]:
    seen, out = set(), []
    for e in groups.values():
        if e["_src"] == "fe" and e["make"] not in seen:
            seen.add(e["make"])
            out.append(e["make"])
    return sorted(out)


# ── aliases ───────────────────────────────────────────────────────
def load_aliases() -> dict:
    path = os.path.join(OUT_DIR, "aliases.json")
    if not os.path.exists(path):
        return {}
    with open(path) as f:
        return json.load(f)


def attach_aliases(entries: list[dict], aliases: dict):
    """Map each shorthand to the newest matching entry (by make/model[/trim])."""
    by_make_model: dict[tuple, list[dict]] = {}
    for e in entries:
        by_make_model.setdefault((norm(e["make"]), norm(e["model"])), []).append(e)
    attached = 0
    for shorthand, target in aliases.items():
        mk, mod = norm(target.get("make", "")), norm(target.get("model", ""))
        cands = by_make_model.get((mk, mod), [])
        want_trim = norm(target.get("trim", ""))
        if want_trim:
            trimmed = [e for e in cands if want_trim in norm(e.get("trim", ""))]
            cands = trimmed or cands
        if not cands:
            continue
        # Prefer the newest entry that actually carries specs over a bare
        # identity stub from a future model year.
        with_specs = [e for e in cands if e.get("powertrain")]
        newest = max(with_specs or cands, key=lambda e: e["year"])
        newest.setdefault("aliases", [])
        if shorthand not in newest["aliases"]:
            newest["aliases"].append(shorthand)
            attached += 1
    return attached


# ── emit ──────────────────────────────────────────────────────────
def finalize(groups: dict) -> list[dict]:
    entries = []
    used_ids: set[str] = set()
    for e in sorted(groups.values(), key=lambda x: (-x["year"], norm(x["make"]), norm(x["model"]), norm(x.get("trim", "")))):
        base = slug(str(e["year"]), e["make"], e["model"], e.get("trim", ""))
        vid, n = base, 2
        while vid in used_ids:
            vid = f"{base}-{n}"
            n += 1
        used_ids.add(vid)
        out = {"id": vid, "year": e["year"], "make": e["make"], "model": e["model"]}
        if e.get("trim"):
            out["trim"] = e["trim"]
        for k in ("powertrain", "body_class", "drivetrain", "battery_kwh", "epa_range", "kwh_per_100mi", "msrp", "seats", "dc_peak_kw"):
            if e.get(k) is not None:
                out[k] = e[k]
        if e.get("aliases"):
            out["aliases"] = sorted(e["aliases"])
        entries.append(out)
    return entries


def dump_gz(obj, path: str) -> int:
    raw = json.dumps(obj, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    with open(path, "wb") as f:
        f.write(raw)
    buf = io.BytesIO()
    with gzip.GzipFile(fileobj=buf, mode="wb", compresslevel=9, mtime=0) as g:
        g.write(raw)
    gz = buf.getvalue()
    with open(path + ".gz", "wb") as f:
        f.write(gz)
    return len(gz)


def write_outputs(entries: list[dict]):
    os.makedirs(OUT_DIR, exist_ok=True)
    combined = os.path.join(OUT_DIR, "catalog.json")
    gz_size = dump_gz(entries, combined)
    print(f"\ncatalog.json: {len(entries):,} entries, {gz_size/1024:.0f} KB gzipped", flush=True)

    manifest = {
        "generated_from": ["fueleconomy.gov/vehicles.csv", "NHTSA vPIC"],
        "start_year": START_YEAR,
        "count": len(entries),
        "gzip_bytes": gz_size,
    }

    if gz_size <= GZIP_BUDGET:
        manifest["mode"] = "single"
        manifest["files"] = ["catalog.json"]
    else:
        # Over budget: split by decade and lazy-load client-side.
        print(f"Over {GZIP_BUDGET/1024:.0f} KB budget -> splitting by decade.", flush=True)
        # remove the oversized combined file so it isn't shipped
        for p in (combined, combined + ".gz"):
            if os.path.exists(p):
                os.remove(p)
        by_decade: dict[int, list] = {}
        for e in entries:
            by_decade.setdefault((e["year"] // 10) * 10, []).append(e)
        files = []
        for decade, items in sorted(by_decade.items()):
            name = f"catalog-{decade}s.json"
            sz = dump_gz(items, os.path.join(OUT_DIR, name))
            files.append({"file": name, "decade": decade, "count": len(items), "gzip_bytes": sz})
            print(f"  {name}: {len(items):,} entries, {sz/1024:.0f} KB gzipped", flush=True)
        manifest["mode"] = "decade-split"
        manifest["files"] = files

    with open(os.path.join(OUT_DIR, "catalog-manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)
    return manifest


# ── verification ──────────────────────────────────────────────────
TEST_VEHICLES = [
    (2022, "Tesla", "Model 3"), (2023, "Tesla", "Model Y"), (2021, "Tesla", "Model S"),
    (2022, "Ford", "Mustang Mach-E"), (2023, "Ford", "F-150 Lightning"),
    (2022, "Chevrolet", "Bolt EV"), (2022, "Rivian", "R1T"),
    (2022, "Hyundai", "Ioniq 5"), (2023, "Kia", "EV6"), (2020, "Nissan", "Leaf"),
    (2022, "Lucid", "Air"), (2022, "Porsche", "Taycan"),
    (2022, "Toyota", "Camry"), (2022, "Toyota", "RAV4"), (2022, "Honda", "Accord"),
    (2022, "Honda", "Civic"), (2022, "Honda", "CR-V"), (2022, "BMW", "3 Series"),
    (2022, "Ford", "F150"), (2021, "Audi", "e-tron"),
]


def verify(entries: list[dict]):
    idx: dict[tuple, list[dict]] = {}
    for e in entries:
        idx.setdefault((e["year"], norm(e["make"]), norm(e["model"])), []).append(e)
    print("\n=== 20 test-vehicle lookups ===")
    hits = 0
    for year, make, model in TEST_VEHICLES:
        matches = idx.get((year, norm(make), norm(model)))
        if not matches:
            # fall back to any year for that make/model
            alt = [e for e in entries if norm(e["make"]) == norm(make) and norm(e["model"]) == norm(model)]
            matches = alt[:1]
        if matches:
            hits += 1
            e = max(matches, key=_richness)
            specs = {k: e.get(k) for k in ("powertrain", "body_class", "drivetrain", "epa_range", "kwh_per_100mi", "battery_kwh")}
            complete = "OK " if e.get("powertrain") and (e.get("body_class") or e.get("epa_range")) else "thin"
            print(f"  [{complete}] {year} {make} {model:16s} -> {e['id']}")
            print(f"          {specs}")
        else:
            print(f"  [MISS] {year} {make} {model}")
    print(f"\n{hits}/{len(TEST_VEHICLES)} test vehicles found.")


def coverage(groups: dict, makes: list[str], years: list[int]):
    """Share of NHTSA base (year,make,model) rows our catalog covers."""
    have = {(y, nm, nmod) for (y, nm, nmod, _t) in groups}
    total = covered = 0
    for mk in makes:
        for yr in years:
            for model in nhtsa_models(mk, yr):
                total += 1
                if (yr, norm(mk), norm(model)) in have:
                    covered += 1
    if total:
        print(f"\nCoverage vs NHTSA base model-years (consumer makes): {covered}/{total} = {covered/total*100:.1f}%")


# ── main ──────────────────────────────────────────────────────────
def build(use_nhtsa: bool):
    csv_path = download_vehicles_csv()
    print("Parsing fueleconomy specs ...", flush=True)
    groups = parse_fueleconomy(csv_path)
    fe_makes = fueleconomy_makes(groups)
    years = list(range(START_YEAR, 2028))
    print(f"fueleconomy: {len(groups):,} spec entries across {len(fe_makes)} makes.", flush=True)

    if use_nhtsa:
        enrich_with_nhtsa(groups, fe_makes, years)

    aliases = load_aliases()
    entries = finalize(groups)
    attached = attach_aliases(entries, aliases)
    print(f"aliases: {len(aliases)} shorthands, {attached} attached to entries.", flush=True)

    manifest = write_outputs(entries)
    if use_nhtsa:
        coverage(groups, fe_makes, years)
    verify(entries)
    return entries, manifest


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-nhtsa", action="store_true", help="fueleconomy only (fast)")
    ap.add_argument("--verify", action="store_true", help="verify an existing catalog.json")
    args = ap.parse_args()

    if args.verify:
        path = os.path.join(OUT_DIR, "catalog.json")
        if not os.path.exists(path):
            # reassemble from decade splits
            entries = []
            man = json.load(open(os.path.join(OUT_DIR, "catalog-manifest.json")))
            for f in man["files"]:
                name = f["file"] if isinstance(f, dict) else f
                entries += json.load(open(os.path.join(OUT_DIR, name)))
        else:
            entries = json.load(open(path))
        verify(entries)
        return

    build(use_nhtsa=not args.no_nhtsa)


if __name__ == "__main__":
    main()
