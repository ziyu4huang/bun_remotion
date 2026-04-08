"""
Kokoro voice catalog + language/emotion metadata.

Prefix legend:
  a = American English, b = British English
  z = Mandarin Chinese, j = Japanese
  e = Spanish, f = French, h = Hindi, i = Italian, p = Portuguese-BR
  f/m = female/male
"""

KOKORO_VOICES: dict[str, dict] = {
    # ---------- American English Female ----------
    "af_heart":    {"lang": "en-us", "lang_code": "a", "gender": "female", "accent": "american", "note": "warm & expressive (default)"},
    "af_sarah":    {"lang": "en-us", "lang_code": "a", "gender": "female", "accent": "american", "note": "clear & professional"},
    "af_bella":    {"lang": "en-us", "lang_code": "a", "gender": "female", "accent": "american", "note": "bright & energetic"},
    "af_sky":      {"lang": "en-us", "lang_code": "a", "gender": "female", "accent": "american", "note": "calm & soothing"},
    "af_nicole":   {"lang": "en-us", "lang_code": "a", "gender": "female", "accent": "american", "note": "natural conversational"},
    "af_nova":     {"lang": "en-us", "lang_code": "a", "gender": "female", "accent": "american", "note": "smooth & confident"},
    # ---------- American English Male ------------
    "am_adam":     {"lang": "en-us", "lang_code": "a", "gender": "male",   "accent": "american", "note": "deep & authoritative"},
    "am_michael":  {"lang": "en-us", "lang_code": "a", "gender": "male",   "accent": "american", "note": "friendly & clear"},
    "am_echo":     {"lang": "en-us", "lang_code": "a", "gender": "male",   "accent": "american", "note": "resonant"},
    "am_liam":     {"lang": "en-us", "lang_code": "a", "gender": "male",   "accent": "american", "note": "casual & relaxed"},
    # ---------- British English Female -----------
    "bf_emma":     {"lang": "en-gb", "lang_code": "b", "gender": "female", "accent": "british",  "note": "elegant & precise"},
    "bf_isabella": {"lang": "en-gb", "lang_code": "b", "gender": "female", "accent": "british",  "note": "warm & refined"},
    # ---------- British English Male -------------
    "bm_george":   {"lang": "en-gb", "lang_code": "b", "gender": "male",   "accent": "british",  "note": "classic & distinguished"},
    "bm_lewis":    {"lang": "en-gb", "lang_code": "b", "gender": "male",   "accent": "british",  "note": "calm & measured"},
    "bm_daniel":   {"lang": "en-gb", "lang_code": "b", "gender": "male",   "accent": "british",  "note": "formal newsreader style"},
    # ---------- Mandarin Chinese Female ----------
    "zf_xiaobei":  {"lang": "zh",    "lang_code": "z", "gender": "female", "accent": "mandarin", "note": "lively & youthful"},
    "zf_xiaoni":   {"lang": "zh",    "lang_code": "z", "gender": "female", "accent": "mandarin", "note": "gentle & warm"},
    # ---------- Mandarin Chinese Male ------------
    "zm_yunjian":  {"lang": "zh",    "lang_code": "z", "gender": "male",   "accent": "mandarin", "note": "deep & broadcast"},
    "zm_yunxi":    {"lang": "zh",    "lang_code": "z", "gender": "male",   "accent": "mandarin", "note": "natural & conversational"},
    # ---------- Japanese Female ------------------
    "jf_alpha":    {"lang": "ja",    "lang_code": "j", "gender": "female", "accent": "japanese", "note": "clear & expressive"},
    "jf_gongitsune":{"lang": "ja",   "lang_code": "j", "gender": "female", "accent": "japanese", "note": "storyteller"},
    # ---------- Japanese Male -------------------
    "jm_kumo":     {"lang": "ja",    "lang_code": "j", "gender": "male",   "accent": "japanese", "note": "calm & measured"},
    # ---------- Spanish (espeak-ng G2P) ----------
    "af_heart":    {"lang": "es",    "lang_code": "e", "gender": "female", "accent": "spanish",  "note": "espeak-ng G2P"},
    # ---------- French (espeak-ng G2P) -----------
    "af_heart":    {"lang": "fr",    "lang_code": "f", "gender": "female", "accent": "french",   "note": "espeak-ng G2P"},
    # ---------- Hindi (espeak-ng G2P) ------------
    "af_heart":    {"lang": "hi",    "lang_code": "h", "gender": "female", "accent": "hindi",    "note": "espeak-ng G2P"},
    # ---------- Italian (espeak-ng G2P) ----------
    "af_heart":    {"lang": "it",    "lang_code": "i", "gender": "female", "accent": "italian",  "note": "espeak-ng G2P"},
    # ---------- Portuguese-BR (espeak-ng G2P) ----
    "af_heart":    {"lang": "pt-br", "lang_code": "p", "gender": "female", "accent": "portuguese","note": "espeak-ng G2P"},
}

# Rebuild without duplicate keys — keyed by (voice_id, lang_code) pair for UI
VOICE_CATALOG: list[dict] = [
    # --- American English ---
    {"id": "af_heart",    "lang": "en-us", "lang_code": "a", "gender": "female", "accent": "american",   "note": "warm & expressive (default)"},
    {"id": "af_sarah",    "lang": "en-us", "lang_code": "a", "gender": "female", "accent": "american",   "note": "clear & professional"},
    {"id": "af_bella",    "lang": "en-us", "lang_code": "a", "gender": "female", "accent": "american",   "note": "bright & energetic"},
    {"id": "af_sky",      "lang": "en-us", "lang_code": "a", "gender": "female", "accent": "american",   "note": "calm & soothing"},
    {"id": "af_nicole",   "lang": "en-us", "lang_code": "a", "gender": "female", "accent": "american",   "note": "natural conversational"},
    {"id": "af_nova",     "lang": "en-us", "lang_code": "a", "gender": "female", "accent": "american",   "note": "smooth & confident"},
    {"id": "am_adam",     "lang": "en-us", "lang_code": "a", "gender": "male",   "accent": "american",   "note": "deep & authoritative"},
    {"id": "am_michael",  "lang": "en-us", "lang_code": "a", "gender": "male",   "accent": "american",   "note": "friendly & clear"},
    {"id": "am_echo",     "lang": "en-us", "lang_code": "a", "gender": "male",   "accent": "american",   "note": "resonant"},
    {"id": "am_liam",     "lang": "en-us", "lang_code": "a", "gender": "male",   "accent": "american",   "note": "casual & relaxed"},
    # --- British English ---
    {"id": "bf_emma",     "lang": "en-gb", "lang_code": "b", "gender": "female", "accent": "british",    "note": "elegant & precise"},
    {"id": "bf_isabella", "lang": "en-gb", "lang_code": "b", "gender": "female", "accent": "british",    "note": "warm & refined"},
    {"id": "bm_george",   "lang": "en-gb", "lang_code": "b", "gender": "male",   "accent": "british",    "note": "classic & distinguished"},
    {"id": "bm_lewis",    "lang": "en-gb", "lang_code": "b", "gender": "male",   "accent": "british",    "note": "calm & measured"},
    {"id": "bm_daniel",   "lang": "en-gb", "lang_code": "b", "gender": "male",   "accent": "british",    "note": "formal newsreader style"},
    # --- Mandarin Chinese ---
    {"id": "zf_xiaobei",  "lang": "zh",    "lang_code": "z", "gender": "female", "accent": "mandarin",   "note": "lively & youthful"},
    {"id": "zf_xiaoni",   "lang": "zh",    "lang_code": "z", "gender": "female", "accent": "mandarin",   "note": "gentle & warm"},
    {"id": "zm_yunjian",  "lang": "zh",    "lang_code": "z", "gender": "male",   "accent": "mandarin",   "note": "deep & broadcast"},
    {"id": "zm_yunxi",    "lang": "zh",    "lang_code": "z", "gender": "male",   "accent": "mandarin",   "note": "natural & conversational"},
    # --- Japanese ---
    {"id": "jf_alpha",      "lang": "ja",  "lang_code": "j", "gender": "female", "accent": "japanese",   "note": "clear & expressive"},
    {"id": "jf_gongitsune", "lang": "ja",  "lang_code": "j", "gender": "female", "accent": "japanese",   "note": "storyteller style"},
    {"id": "jm_kumo",       "lang": "ja",  "lang_code": "j", "gender": "male",   "accent": "japanese",   "note": "calm & measured"},
    # --- Other languages (English voice + espeak-ng G2P) ---
    {"id": "af_heart",    "lang": "es",    "lang_code": "e", "gender": "female", "accent": "spanish",    "note": "via espeak-ng G2P"},
    {"id": "af_heart",    "lang": "fr",    "lang_code": "f", "gender": "female", "accent": "french",     "note": "via espeak-ng G2P"},
    {"id": "af_heart",    "lang": "hi",    "lang_code": "h", "gender": "female", "accent": "hindi",      "note": "via espeak-ng G2P"},
    {"id": "af_heart",    "lang": "it",    "lang_code": "i", "gender": "female", "accent": "italian",    "note": "via espeak-ng G2P"},
    {"id": "af_heart",    "lang": "pt-br", "lang_code": "p", "gender": "female", "accent": "portuguese", "note": "via espeak-ng G2P"},
]

# Unique voice IDs (for simple dict-keyed access)
KOKORO_VOICES = {v["id"]: v for v in VOICE_CATALOG if v["lang_code"] in ("a", "b", "z", "j")}

DEFAULT_VOICE = "af_heart"

LANGUAGES = {
    "en-us": {"name": "English (US)",       "code": "a", "default_voice": "af_heart"},
    "en-gb": {"name": "English (UK)",       "code": "b", "default_voice": "bm_george"},
    "zh":    {"name": "Mandarin Chinese",   "code": "z", "default_voice": "zf_xiaobei"},
    "ja":    {"name": "Japanese",           "code": "j", "default_voice": "jf_alpha"},
    "es":    {"name": "Spanish",            "code": "e", "default_voice": "af_heart"},
    "fr":    {"name": "French",             "code": "f", "default_voice": "af_heart"},
    "hi":    {"name": "Hindi",              "code": "h", "default_voice": "af_heart"},
    "it":    {"name": "Italian",            "code": "i", "default_voice": "af_heart"},
    "pt-br": {"name": "Portuguese (BR)",    "code": "p", "default_voice": "af_heart"},
}

# Emotion presets — adjust speed and optionally transform text
EMOTIONS: dict[str, dict] = {
    "neutral": {
        "label": "Neutral",
        "speed_mult": 1.0,
        "description": "Natural, balanced delivery",
        "icon": "😐",
        "recommended_voices": ["af_heart", "am_michael", "bm_george"],
    },
    "happy": {
        "label": "Happy",
        "speed_mult": 1.08,
        "description": "Upbeat, warm, slightly faster",
        "icon": "😊",
        "recommended_voices": ["af_bella", "af_heart", "am_liam"],
    },
    "excited": {
        "label": "Excited",
        "speed_mult": 1.18,
        "description": "Energetic, fast-paced, dynamic",
        "icon": "🤩",
        "recommended_voices": ["af_bella", "af_nova", "am_echo"],
    },
    "sad": {
        "label": "Sad",
        "speed_mult": 0.85,
        "description": "Slow, somber, subdued",
        "icon": "😢",
        "recommended_voices": ["af_sky", "bf_emma", "bm_lewis"],
    },
    "calm": {
        "label": "Calm",
        "speed_mult": 0.92,
        "description": "Slow, composed, meditative",
        "icon": "😌",
        "recommended_voices": ["af_sky", "bm_lewis", "af_sarah"],
    },
    "serious": {
        "label": "Serious",
        "speed_mult": 0.95,
        "description": "Authoritative, measured, deliberate",
        "icon": "🧐",
        "recommended_voices": ["am_adam", "bm_george", "bm_daniel"],
    },
    "whispery": {
        "label": "Whispery",
        "speed_mult": 0.88,
        "description": "Soft, intimate, close",
        "icon": "🤫",
        "recommended_voices": ["af_sky", "af_nicole", "bf_isabella"],
    },
    "storytelling": {
        "label": "Storytelling",
        "speed_mult": 0.97,
        "description": "Expressive, narrative, engaging",
        "icon": "📖",
        "recommended_voices": ["af_heart", "bm_george", "jf_gongitsune"],
    },
}


def list_voices(gender: str = None, accent: str = None) -> list[dict]:
    result = VOICE_CATALOG
    if gender:
        result = [v for v in result if v["gender"] == gender.lower()]
    if accent:
        result = [v for v in result if v["accent"] == accent.lower()]
    return result


def voice_info(voice_id: str) -> dict | None:
    return KOKORO_VOICES.get(voice_id)


def emotion_speed(base_speed: float, emotion: str) -> float:
    mult = EMOTIONS.get(emotion, EMOTIONS["neutral"])["speed_mult"]
    return round(base_speed * mult, 2)
