#!/usr/bin/env python3
"""What the magazine is allowed to publish.

Tony's standard, 10/4/2026: not "non-violent" — UPLIFTING. The old filter was a
blocklist, so anything that dodged the blocked words got through on topic alone.
That let two pieces onto the Spanish edition that had no business there: one on
criminalisation in Guatemala, and one on fear of insecurity driving gun sales
(it matched the topic list on "camin", inside "camino a la compra de armas").

Three gates now, and an item must clear all three:
  1. VETO   — harm, fear, crime, catastrophe. Never, in any language.
  2. TOPIC  — is it about the things this magazine is about?
  3. UPLIFT — is something being built, healed, opened, won or celebrated?
Gate 3 is the new one. Topic alone is not enough, because a story can be about
a community and still leave the reader braced.
"""
import re

# ── 1. the hard veto ─────────────────────────────────────────────────────────
VETO = re.compile(
  # English
  r"(war\b|killed|shoot|murder|attack|bomb|missile|troops|invasion|dead\b|death toll|"
  r"\bgun|weapon|crime|criminal|fear\b|prison|jail|corrupt|abuse|violen|threat|"
  r"famine|drought|kidnap|assault|scandal|lawsuit|arrest|trafficking|"
  # Spanish
  r"guerra|matan|asesinat|disparo|tiroteo|ataque|bomba|misil|tropas|muertos|"
  r"\barmas?\b|miedo|inseguridad|criminaliz|delito|crimen|c[áa]rcel|prisi[óo]n|"
  r"corrupci[óo]n|abuso|violenc|amenaza|desplaz|hambruna|sequ[íi]a|acoso|"
  r"feminicid|secuestr|extorsi[óo]n|pandilla|narco|detenid|"
  # Japanese
  r"戦争|殺害|銃撃|攻撃|爆|ミサイル|死亡|テロ|犯罪|恐怖|刑務|汚職|虐待|暴力|"
  r"脅威|飢餓|干ばつ|誘拐|逮捕|訴訟|被害者|"
  # Lithuanian
  r"kar[ao]\b|žuvo|žūt|šaudyn|nužud|ataka|sprogim|raket|kariuomen|mirė|"
  r"ginkl|baim|nusikalt|kalėjim|korupc|smurt|grasin|badas|sausr|pagrobim|"
  r"suimt|teisiam|auk[ųos]\b)", re.I)

# ── 2. what this magazine is about ───────────────────────────────────────────
TOPIC = {
 "en": re.compile(r"\b(communit|restor|regenerat|elder|indigenous|native|tribal|"
                  r"farm|food|seed|water|forest|river|land|heal|resilien|longevity|"
                  r"calm|sleep|walk|run|craft|weav|language|school|youth|neighbou?r|"
                  r"cooperative|local|repair|reuse|solar|steward)", re.I),
 "es": re.compile(r"(comunidad|comunitari|restaur|regener|anciano|ind[ií]gena|maya|"
                  r"campesin|huerto|semilla|agua|bosque|r[ií]o|tierra|salud|sanar|"
                  r"resilien|longevidad|calma|sue[nñ]o|caminata|caminar|artesan|tejid|"
                  r"lengua|escuela|juventud|vecin|cooperativa|local|reparar|solar|cuidado|[áa]rbol|plantar|planta|bosqu|jard[íi]n|parque|barrio|municipi|ciudad|naturaleza|clima|energ[íi]a|cultur|museo|biblioteca|m[úu]sica|danza|arte|alimento|cocina|mercado|libro|memoria|territorio)", re.I),
 "ja": re.compile(r"(地域|コミュニティ|再生|循環|高齢|先住|農|種|水|森|川|土|"
                  r"健康|癒|回復|レジリエン|長寿|眠|歩|手仕事|織|言語|学校|"
                  r"若者|近所|協同|地元|修理|太陽光|ケア|暮らし|木|植|公園|庭|自然|気候|エネルギー|文化|博物館|図書館|音楽|踊|芸術|食|市場|本|記憶|まち|集落)"),
 "lt": re.compile(r"(bendruomen|atkur|regener|senol|vyresn|ūkinink|sėkl|vanden|"
                  r"mišk|upė|žem|sveikat|gydy|atspar|ilgaamž|ramyb|mieg|"
                  r"amat|aud|kalb|mokykl|jaunim|kaimyn|kooperat|vietos|taisy|saulė|globa|"
                  r"kultūr|paveld|muziej|daina|dainav|tradicij|papročia|šventė|paroda|"
                  r"istorij|archyv|knyg|menas|meninink|tautodail|etnograf|medži|sodin|sodas|parkas|gamt|klimat|energij|maist|turg|atmint|miest|kaim|festival|teatr|muzik)", re.I),
}

# ── 3. is something good actually HAPPENING? ─────────────────────────────────
# The gate Tony asked for. Something must be built, opened, healed, won,
# protected, celebrated or discovered. A story that merely describes a subject
# does not qualify, however on-theme it is.
UPLIFT = {
 "en": re.compile(r"\b(launch|open|built?|building|create|restor|reviv|renew|"
                  r"win|won|award|prize|record|thriv|flourish|rescu|sav(e|ed|ing)|"
                  r"heal|recover|grow|rise|rising|first\b|breakthrough|discover|"
                  r"success|celebrat|reunit|protect|preserv|donat|volunteer|"
                  r"help|boost|improv|revitali|transform|hope|joy|gift|share)", re.I),
 "es": re.compile(r"(logr|consigu|inaugur|abre\b|abri[óe]|constru|cre[aó]|crear|"
                  r"restaur|recuper|revit|salv|rescat|crec|florec|premi|r[ée]cord|"
                  r"[ée]xito|celebr|protege|proteg|preserv|dona|volunt|mejor|avanc|"
                  r"impuls|esperanza|alegr|primer|nuev|renac|regres|moviliza|"
                  r"comparte|aprend|siembra|cosecha)", re.I),
 "ja": re.compile(r"(実現|成功|開設|開校|開館|開催|完成|復活|再生|回復|救|守|育|"
                  r"広がる|広げ|初の|初めて|受賞|記録|祝|支援|改善|希望|喜|"
                  r"取り組み|挑戦|生まれ|つなぐ|つながる|学ぶ|恵み|贈)"),
 "lt": re.compile(r"(atidar|atkūr|atkur|sukūr|sukur|pasiek|laimėj|apdovanoj|rekord|"
                  r"sėkm|švent|aug|klest|išsaug|padėj|savanor|pagerin|viltis|"
                  r"džiaug|pirm|nauj|pristat|atgim|kuria|kuriam|mokos|mokym|dovan|"
                  r"subūr|telkia|puošia|grįžta)", re.I),
}

# ── 3b. alarm and politics ───────────────────────────────────────────────────
# A story can clear every gate above and still leave a reader braced: a warning,
# a party-political fight, a climate measurement framed as a threat. Those are
# not this magazine's work. Added after the ocean-heat piece and a story about
# deputies chasing electoral gain both reached the Spanish edition.
ALARM = re.compile(
  r"\b(warns?|warning|alarm|crisis|threatens?|risk of|worst|worsen|decline|"
  r"collapse|emergency|protest|election|electoral|parliament|senate|minister|"
  r"lawmaker|politician|party leader|"
  r"advierte|alerta|crisis|amenaz|riesgo|peor|empeora|declive|colapso|"
  r"emergencia|protesta|elector|diputad|senador|ministr|pol[ií]tic|partido|"
  r"persigu|r[ée]ditos|"
  r"警告|危機|懸念|悪化|崩壊|緊急|抗議|選挙|議員|大臣|政党|政治|"
  r"įspėj|krizė|grės|pavoj|blogėj|žlug|avarin|protest|rinkim|"
  r"seimo|seimas|ministr|politik|partij)", re.I)

# ── 4. junk, in any language ─────────────────────────────────────────────────
JUNK = {
 "en": re.compile(r"\b(celebrit|royal|lottery|viral|shock|slam|blast|crypto|betting)\b", re.I),
 "es": re.compile(r"(famoso|celebridad|loter[ií]a|viral|esc[áa]ndalo|cripto|apuesta)", re.I),
 "ja": re.compile(r"(芸能|不倫|炎上|宝くじ|仮想通貨)"),
 "lt": re.compile(r"(įžymyb|loterij|skandal|kriptovaliut|lažyb)", re.I),
}

def passes(blob, lang):
    """True only if the item clears all three gates. Returns (ok, why_not)."""
    if VETO.search(blob):                        return False, "veto"
    if ALARM.search(blob):                       return False, "alarm"
    j = JUNK.get(lang)
    if j and j.search(blob):                     return False, "junk"
    t = TOPIC.get(lang)
    if t and not t.search(blob):                 return False, "off-topic"
    u = UPLIFT.get(lang)
    if u and not u.search(blob):                 return False, "not uplifting"
    return True, ""
