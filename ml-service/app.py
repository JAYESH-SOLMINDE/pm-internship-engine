"""
PM Internship Scheme — Smart Allocation Engine
ml-service/app.py

Flask microservice providing AI/ML-based internship matching.
Uses scikit-learn for candidate-to-internship matching.

Endpoints:
  POST /match          → Match a candidate to internships
  POST /batch-match    → Batch match all candidates
  GET  /health         → Health check
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import LabelEncoder
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ─── Sample Internship Data (placeholder until DB integration) ─────────────────
SAMPLE_INTERNSHIPS = [
    {
        "id": "INT001",
        "title": "Data Analyst Intern",
        "company": "Tata Consultancy Services",
        "sector": "Technology",
        "location": "Mumbai",
        "state": "Maharashtra",
        "skills_required": ["Python", "SQL", "Data Analysis", "Excel", "Power BI"],
        "stipend": 5000,
        "duration_months": 6,
        "seats_total": 50,
        "seats_reserved_sc_st": 15,
        "seats_reserved_obc": 10,
        "seats_reserved_rural": 8,
        "min_percentage": 60,
    },
    {
        "id": "INT002",
        "title": "Finance & Accounts Intern",
        "company": "HDFC Bank",
        "sector": "Finance",
        "location": "Delhi",
        "state": "Delhi",
        "skills_required": ["Accounting", "Tally", "Excel", "Financial Modeling", "MS Office"],
        "stipend": 5000,
        "duration_months": 6,
        "seats_total": 40,
        "seats_reserved_sc_st": 12,
        "seats_reserved_obc": 8,
        "seats_reserved_rural": 6,
        "min_percentage": 55,
    },
    {
        "id": "INT003",
        "title": "Agricultural Field Intern",
        "company": "ITC Agri Business",
        "sector": "Agriculture",
        "location": "Raipur",
        "state": "Chhattisgarh",
        "skills_required": ["Research", "GIS", "Policy Analysis", "MS Office"],
        "stipend": 5000,
        "duration_months": 6,
        "seats_total": 30,
        "seats_reserved_sc_st": 10,
        "seats_reserved_obc": 6,
        "seats_reserved_rural": 10,
        "min_percentage": 50,
    },
    {
        "id": "INT004",
        "title": "Manufacturing Quality Intern",
        "company": "Mahindra & Mahindra",
        "sector": "Manufacturing",
        "location": "Pune",
        "state": "Maharashtra",
        "skills_required": ["AutoCAD", "Quality Control", "MATLAB", "MS Office"],
        "stipend": 5000,
        "duration_months": 6,
        "seats_total": 35,
        "seats_reserved_sc_st": 10,
        "seats_reserved_obc": 7,
        "seats_reserved_rural": 5,
        "min_percentage": 55,
    },
    {
        "id": "INT005",
        "title": "Machine Learning Intern",
        "company": "Infosys",
        "sector": "Technology",
        "location": "Bangalore",
        "state": "Karnataka",
        "skills_required": ["Machine Learning", "Python", "Deep Learning", "SQL", "TensorFlow"],
        "stipend": 5000,
        "duration_months": 6,
        "seats_total": 25,
        "seats_reserved_sc_st": 8,
        "seats_reserved_obc": 5,
        "seats_reserved_rural": 3,
        "min_percentage": 70,
    },
]

# ─── Quota Configuration (from PM Internship Scheme guidelines) ───────────────
QUOTA_CONFIG = {
    "SC":           0.15,   # 15% reservation
    "ST":           0.075,  # 7.5% reservation
    "OBC":          0.27,   # 27% reservation
    "rural":        0.10,   # 10% preference for rural candidates
    "aspirational": 0.05,   # Additional 5% for aspirational districts
}

# ─── Matching Engine ──────────────────────────────────────────────────────────

def compute_skill_similarity(candidate_skills: list, internship_skills: list) -> float:
    """
    Compute cosine similarity between candidate and internship skills
    using TF-IDF vectorization.
    """
    if not candidate_skills or not internship_skills:
        return 0.0

    # Join skills into strings for TF-IDF
    candidate_text   = " ".join(candidate_skills).lower()
    internship_text  = " ".join(internship_skills).lower()

    try:
        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform([candidate_text, internship_text])
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return float(round(similarity, 4))
    except Exception:
        # Fallback: simple overlap ratio
        cset = set(s.lower() for s in candidate_skills)
        iset = set(s.lower() for s in internship_skills)
        overlap = len(cset & iset)
        union   = len(cset | iset)
        return overlap / union if union > 0 else 0.0


def compute_sector_match(candidate_sectors: list, internship_sector: str) -> float:
    """Returns 1.0 if sector matches, 0.0 otherwise."""
    return 1.0 if internship_sector in candidate_sectors else 0.0


def compute_location_score(candidate_loc: dict, internship_state: str) -> float:
    """
    Returns:
      1.0  — exact state match
      0.7  — willing to relocate
      0.3  — no preference specified
    """
    if not candidate_loc:
        return 0.3
    if candidate_loc.get("state") == internship_state:
        return 1.0
    if candidate_loc.get("willingToRelocate"):
        return 0.7
    return 0.3


def compute_affirmative_bonus(candidate: dict, internship: dict) -> float:
    """
    Compute bonus score based on affirmative action quotas.
    Returns a value between 0.0 and 0.20 (up to 20% bonus).
    """
    bonus = 0.0
    social = candidate.get("socialCategory", "General")
    district = candidate.get("districtType", "Urban")

    if social == "SC":
        bonus += QUOTA_CONFIG["SC"]          # +15%
    elif social == "ST":
        bonus += QUOTA_CONFIG["ST"]          # +7.5%
    elif social == "OBC":
        bonus += QUOTA_CONFIG["OBC"] * 0.3   # +8.1% (weighted)

    if district == "Rural":
        bonus += QUOTA_CONFIG["rural"]        # +10%
    elif district == "Aspirational":
        bonus += QUOTA_CONFIG["aspirational"] + QUOTA_CONFIG["rural"]  # +15%

    return min(bonus, 0.25)  # Cap at 25% bonus


def compute_match_score(candidate: dict, internship: dict) -> dict:
    """
    Compute weighted match score between a candidate and an internship.

    Weights:
      40% — Skill match (TF-IDF cosine similarity)
      25% — Sector match
      20% — Location preference
      15% — Affirmative action bonus
    """
    all_skills = list(set(
        candidate.get("skills", []) + candidate.get("parsedSkills", [])
    ))

    skill_score    = compute_skill_similarity(all_skills, internship.get("skills_required", []))
    sector_score   = compute_sector_match(candidate.get("sectorInterest", []), internship.get("sector", ""))
    location_score = compute_location_score(candidate.get("locationPreference", {}), internship.get("state", ""))
    affirmative    = compute_affirmative_bonus(candidate, internship)

    # Percentage match (0–100) before bonus
    base_score = (
        skill_score    * 0.40 +
        sector_score   * 0.25 +
        location_score * 0.20
    )

    # Education filter: if candidate percentage < minimum, penalize
    cand_pct = candidate.get("education", {}).get("percentage", 50)
    min_pct  = internship.get("min_percentage", 50)
    if cand_pct and cand_pct < min_pct:
        base_score *= 0.7  # 30% penalty for below threshold

    # Final score with affirmative bonus (scaled to 100)
    final = min((base_score + affirmative) * 100, 100)
    final = round(final, 2)

    return {
        "internship_id":    internship["id"],
        "internship_title": internship["title"],
        "company":          internship["company"],
        "sector":           internship["sector"],
        "location":         internship["location"],
        "stipend":          internship["stipend"],
        "match_score":      final,
        "breakdown": {
            "skill_similarity":   round(skill_score * 100, 1),
            "sector_match":       round(sector_score * 100, 1),
            "location_score":     round(location_score * 100, 1),
            "affirmative_bonus":  round(affirmative * 100, 1),
        }
    }


# ─── API Routes ───────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "OK",
        "service": "PM Internship ML Service",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    })


@app.route("/match", methods=["POST"])
def match_candidate():
    """
    Match a single candidate to available internships.

    Request body:
    {
      "candidate": { <candidate object> },
      "internships": [ <optional custom list> ]
    }

    Returns top-5 matches with scores.
    """
    data = request.get_json()
    if not data or "candidate" not in data:
        return jsonify({"success": False, "message": "candidate data is required"}), 400

    candidate    = data["candidate"]
    internships  = data.get("internships", SAMPLE_INTERNSHIPS)

    # Compute scores for all internships
    scores = [compute_match_score(candidate, intern) for intern in internships]

    # Sort by match score descending
    scores.sort(key=lambda x: x["match_score"], reverse=True)

    # Return top 5
    top_matches = scores[:5]

    return jsonify({
        "success": True,
        "candidate_id": candidate.get("_id") or candidate.get("id"),
        "candidate_name": candidate.get("fullName"),
        "total_internships_evaluated": len(internships),
        "top_matches": top_matches,
        "generated_at": datetime.utcnow().isoformat(),
    })


@app.route("/batch-match", methods=["POST"])
def batch_match():
    """
    Batch match multiple candidates to internships.
    Used by admin for bulk allocation runs.

    Request body:
    {
      "candidates": [ <list of candidate objects> ],
      "internships": [ <optional custom list> ]
    }
    """
    data = request.get_json()
    if not data or "candidates" not in data:
        return jsonify({"success": False, "message": "candidates array is required"}), 400

    candidates   = data["candidates"]
    internships  = data.get("internships", SAMPLE_INTERNSHIPS)

    results = []
    for candidate in candidates:
        scores = [compute_match_score(candidate, intern) for intern in internships]
        scores.sort(key=lambda x: x["match_score"], reverse=True)
        results.append({
            "candidate_id":   candidate.get("_id") or candidate.get("id"),
            "candidate_name": candidate.get("fullName"),
            "top_match":      scores[0] if scores else None,
            "all_scores":     scores[:3],
        })

    return jsonify({
        "success": True,
        "total_candidates": len(candidates),
        "results": results,
        "generated_at": datetime.utcnow().isoformat(),
    })


@app.route("/quota-summary", methods=["POST"])
def quota_summary():
    """
    Returns quota utilization summary for a list of candidates.
    Used by admin dashboard to monitor affirmative action compliance.
    """
    data = request.get_json()
    candidates = data.get("candidates", [])

    summary = {
        "total": len(candidates),
        "by_category": {"General": 0, "OBC": 0, "SC": 0, "ST": 0},
        "by_district": {"Urban": 0, "Rural": 0, "Aspirational": 0},
    }

    for c in candidates:
        cat = c.get("socialCategory", "General")
        dist = c.get("districtType", "Urban")
        if cat in summary["by_category"]:
            summary["by_category"][cat] += 1
        if dist in summary["by_district"]:
            summary["by_district"][dist] += 1

    # Quota compliance
    total = max(summary["total"], 1)
    summary["quota_compliance"] = {
        "SC_ST_actual_pct":  round((summary["by_category"]["SC"] + summary["by_category"]["ST"]) / total * 100, 1),
        "SC_ST_required_pct": 22.5,
        "OBC_actual_pct":    round(summary["by_category"]["OBC"] / total * 100, 1),
        "OBC_required_pct":  27.0,
        "rural_actual_pct":  round((summary["by_district"]["Rural"] + summary["by_district"]["Aspirational"]) / total * 100, 1),
        "rural_required_pct": 15.0,
    }

    return jsonify({"success": True, "summary": summary})
@app.route("/match/candidate", methods=["POST"])
def match_candidate_v2():
    """
    Called by Node.js backend.
    Body: { candidate: {...}, internships: [...], topN: 10 }
    Returns: { matches: [...], total: N }
    """
    data        = request.get_json()
    candidate   = data.get('candidate', {})
    internships = data.get('internships', [])
    top_n       = int(data.get('topN', 10))

    if not candidate or not internships:
        return jsonify({ 'error': 'candidate and internships required' }), 400

    results = []
    for internship in internships:
        # Adapt internship fields to match compute_match_score format
        adapted = {
            'id':              str(internship.get('_id', '')),
            'title':           internship.get('title', ''),
            'company':         internship.get('companyId', {}).get('companyName', '') if isinstance(internship.get('companyId'), dict) else '',
            'sector':          internship.get('sector', ''),
            'location':        internship.get('location', {}).get('city', ''),
            'state':           internship.get('location', {}).get('state', ''),
            'skills_required': internship.get('skillsRequired', []),
            'stipend':         internship.get('stipend', 0),
            'min_percentage':  50,
        }
        score = compute_match_score(candidate, adapted)
        results.append({
            'internship': internship,
            'matchScore': score['match_score'],
            'breakdown': {
                'skills':        score['breakdown']['skill_similarity'],
                'sector':        score['breakdown']['sector_match'],
                'location':      score['breakdown']['location_score'],
                'qualification': 70,
                'categoryBonus': score['breakdown']['affirmative_bonus'],
            }
        })

    results.sort(key=lambda x: x['matchScore'], reverse=True)
    return jsonify({ 'matches': results[:top_n], 'total': len(results) })


@app.route("/match/internship", methods=["POST"])
def match_internship_v2():
    """
    Body: { internship: {...}, candidates: [...], topN: 20 }
    """
    data        = request.get_json()
    internship  = data.get('internship', {})
    candidates  = data.get('candidates', [])
    top_n       = int(data.get('topN', 20))

    adapted = {
        'id':              str(internship.get('_id', '')),
        'title':           internship.get('title', ''),
        'company':         '',
        'sector':          internship.get('sector', ''),
        'location':        internship.get('location', {}).get('city', ''),
        'state':           internship.get('location', {}).get('state', ''),
        'skills_required': internship.get('skillsRequired', []),
        'stipend':         internship.get('stipend', 0),
        'min_percentage':  50,
    }

    results = []
    for candidate in candidates:
        score = compute_match_score(candidate, adapted)
        results.append({
            'candidate':  candidate,
            'matchScore': score['match_score'],
            'breakdown': {
                'skills':        score['breakdown']['skill_similarity'],
                'sector':        score['breakdown']['sector_match'],
                'location':      score['breakdown']['location_score'],
                'qualification': 70,
                'categoryBonus': score['breakdown']['affirmative_bonus'],
            }
        })

    results.sort(key=lambda x: x['matchScore'], reverse=True)
    return jsonify({ 'matches': results[:top_n], 'total': len(results) })


@app.route("/match/bulk", methods=["POST"])
def match_bulk():
    """
    Body: { candidates: [...], internships: [...] }
    Returns full match matrix for admin.
    """
    data        = request.get_json()
    candidates  = data.get('candidates', [])
    internships = data.get('internships', [])

    matrix = []
    for candidate in candidates:
        row = []
        for internship in internships:
            adapted = {
                'id':              str(internship.get('_id', '')),
                'title':           internship.get('title', ''),
                'company':         '',
                'sector':          internship.get('sector', ''),
                'location':        internship.get('location', {}).get('city', ''),
                'state':           internship.get('location', {}).get('state', ''),
                'skills_required': internship.get('skillsRequired', []),
                'stipend':         internship.get('stipend', 0),
                'min_percentage':  50,
            }
            score = compute_match_score(candidate, adapted)
            row.append({
                'candidateId':  str(candidate.get('_id', '')),
                'internshipId': str(internship.get('_id', '')),
                'matchScore':   score['match_score'],
            })
        matrix.append(row)

    return jsonify({
        'matrix':          matrix,
        'candidateCount':  len(candidates),
        'internshipCount': len(internships),
    })

# ─── Run ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5002))
    print(f"🤖  PM Internship ML Service running on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
