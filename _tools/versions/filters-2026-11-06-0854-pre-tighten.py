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
  r"feminicid|secuestr|extorsi[óo]n|pandilla|narco|detenid|juicio|demanda|litigio|adicci[óo]n|"
  # Japanese
  r"戦争|殺害|銃撃|攻撃|爆|ミサイル|死亡|テロ|犯罪|恐怖|刑務|汚職|虐待|暴力|"
  r"脅威|飢餓|干ばつ|誘拐|逮捕|訴訟|被害者|"
  # Lithuanian
  r"kar[ao]\b|žuvo|žūt|šaudyn|nužud|ataka|sprogim|raket|kariuomen|mirė|"
  r"ginkl|baim|nusikalt|kalėjim|korupc|smurt|grasin|badas|sausr|pagrobim|"
  r"suimt|teisiam|karin[iė]|kareivi|brigad|poligon|auk[ųos]\b)", re.I)

# ── 2. what this magazine is about ───────────────────────────────────────────
TOPIC = {
 "en": re.compile(r"\b(communit|restor|regenerat|elder|indigenous|native|tribal|"
                  r"farm|food|seed|water|forest|river|land|heal|resilien|longevity|"
                  r"calm|sleep|walk|run|craft|weav|language|school|youth|neighbou?r|"
                  r"cooperative|local|repair|reuse|solar|steward|"
                  # running, and sport held the old way
                  r"\brun\b|runner|running|trail|marathon|ultra|race|racer|mile|pace|"
                  r"stride|athlet|sport|coach|team|training|hike|walk|ride|rider|"
                  # western life — horses, sheep, the range
                  r"horse|mare|foal|pony|ranch|saddle|rodeo|corral|herd|cattle|"
                  r"sheep|wool|shear|livestock|pasture|range|cowboy|cowgirl|"
                  # the land and what grows on it
                  r"harvest|orchard|graze|grazing|crop|irrigat|heirloom|pollinat|"
                  r"compost|regenerative|rancher|grower|shepherd|"
                  # the animals, and the wild
                  r"animal|wildlife|bird|raptor|horse|dog|rescue|sanctuary|species|"
                  r"habitat|conservation|migration|herd|nest|"
                  # the research behind any of it
                  r"research|study|scientist|evidence|finding|data|trial)", re.I),
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
                  r"help|boost|improv|revitali|transform|hope|joy|gift|share|"
                  # what winning, finishing and new life look like in words
                  r"finish|complet|qualif|podium|comeback|champion|personal best|"
                  r"adopt|hatch|foal|lamb|calv|born|returning|returned|fledg|"
                  r"abundan|flourish|bumper crop|yield|bounty)", re.I),
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
  r"seimo|seimas|ministr|politik|partij|"
  r"警告|危机|危機|风险|風險|威胁|威脅|恶化|惡化|崩溃|崩潰|紧急|緊急|抗议|抗議|选举|選舉|议员|議員|部长|部長|政党|政黨|政治|制裁|审判|審判|"
  r"当局|被捕|流亡|煎熬|审查|管控|打压|冲突|争端|疫情|裁员|失业|"
  r"surveillance|occupied|occupation|crackdown|repress|detention|"
  r"geopolitic|strategic|succession|reckoning|deferred|sanction|"
  r"mining|lithium|extraction|reserves|displac|resettle|"
  r"infrastructure development|runaway|boarding school|"
  r"extinction|endangered|die-off|dying|poach|culled|false promise|lawsuit|addiction|ola de calor|inusualmente c[áa]lido|sequ[íi]a|Trump|Baltieji r[ūu]mai|atstov[ėe] spaudai|atstovas spaudai|"
  r"broken promise|backlash|the problem with|why we should stop)", re.I)

# ── 4. junk, in any language ─────────────────────────────────────────────────
JUNK = {
 "en": re.compile(r"\b(celebrit|royal|lottery|jackpot|viral|shock|slam|blast|crypto|betting)\b", re.I),
 "es": re.compile(r"(famoso|celebridad|loter[ií]a|baloto|sorteo|premio mayor|viral|"
                  r"esc[áa]ndalo|cripto|apuesta|mascota silvestre)", re.I),
 "ja": re.compile(r"(芸能|不倫|炎上|宝くじ|仮想通貨)"),
 "lt": re.compile(r"(įžymyb|loterij|skandal|kriptovaliut|lažyb)", re.I),
}

# Publishers put non-breaking spaces, curly quotes and soft hyphens inside
# headlines. "False\xa0Promise" slid straight through a gate looking for
# "false promise", so every blob is flattened before any gate sees it.
_SPACE = re.compile(r"[\u00a0\u2007\u202f\u2009\u200a\u2002-\u2006\t\r\n]+")
_DASH  = re.compile(r"[\u2010-\u2015\u2212]")
_QUOTE = re.compile(r"[\u2018\u2019\u201a\u201b\u2032]")
_DQUOT = re.compile(r"[\u201c\u201d\u201e\u201f\u2033]")

def flatten(blob):
    blob = _SPACE.sub(" ", blob or "")
    blob = _DASH.sub("-", blob)
    blob = _QUOTE.sub("'", blob)
    blob = _DQUOT.sub('"', blob)
    blob = blob.replace("\u00ad", "")          # soft hyphen
    return re.sub(r"\s{2,}", " ", blob)

def passes(blob, lang):
    """True only if the item clears every gate. Returns (ok, why_not)."""
    blob = flatten(blob)
    if VETO.search(blob):                        return False, "veto"
    if ALARM.search(blob):                       return False, "alarm"
    j = JUNK.get(lang)
    if j and j.search(blob):                     return False, "junk"
    t = TOPIC.get(lang)
    if t and not t.search(blob):                 return False, "off-topic"
    u = UPLIFT.get(lang)
    if u and not u.search(blob):                 return False, "not uplifting"
    return True, ""


# India reads in English, so it uses the English gates with a few more of its
# own words. China reads in Chinese.
TOPIC["india"] = re.compile(TOPIC["en"].pattern +
  r"|\b(village|panchayat|artisan|handloom|khadi|millet|monsoon|forest dweller|"
  r"adivasi|tribal|temple|festival|craft|weaver|potter|farmer|self-help group|"
  r"watershed|stepwell|heritage|folk|classical|raga|ayurved|yoga)", re.I)
TOPIC["zh"] = re.compile(
  # simplified and traditional together
  r"(社区|社區|社群|乡村|鄉村|村|修复|修復|再生|循环|循環|长者|長者|老人|"
  r"原住民|少数民族|少數民族|农|農|种子|種子|水|森林|河|土地|"
  r"健康|疗愈|療癒|康复|康復|韧性|韌性|长寿|長壽|平静|平靜|睡眠|步行|"
  r"手艺|手藝|手工|编织|編織|织|織|语言|語言|学校|學校|青年|邻里|鄰里|"
  r"合作社|在地|本地|修理|太阳能|太陽能|照护|照護|生活|树|樹|植树|植樹|"
  r"公园|公園|花园|花園|自然|气候|氣候|能源|"
  r"文化|博物馆|博物館|图书馆|圖書館|音乐|音樂|舞蹈|艺术|藝術|食物|市集|"
  r"书|書|记忆|記憶|传统|傳統|非遗|非遺|古镇|古鎮|手作|部落|祭典|工艺|工藝)")
UPLIFT["india"] = re.compile(UPLIFT["en"].pattern +
  r"|\b(revive|revived|reviving|uplift|empower|rejuvenat|turnaround|"
  r"planted|restored|crore saved|model village)", re.I)
UPLIFT["zh"] = re.compile(
  r"(实现|實現|成功|开设|開設|开张|開張|开馆|開館|开幕|開幕|举办|舉辦|"
  r"建成|完成|复活|復活|复兴|復興|重生|再生|恢复|恢復|救|守护|守護|培育|"
  r"推广|推廣|扩大|擴大|首次|首个|首個|获奖|獲獎|得奖|得獎|纪录|紀錄|"
  r"庆祝|慶祝|支持|帮助|幫助|改善|提升|希望|欢喜|歡喜|喜悦|喜悅|"
  r"努力|尝试|嘗試|诞生|誕生|连接|連結|相连|相連|学习|學習|馈赠|饋贈|"
  r"赠送|贈送|分享|重建|焕新|煥新|传承|傳承|找回|重新|走向|打造|陪伴)")
JUNK["india"] = JUNK["en"]
JUNK["zh"] = re.compile(r"(明星|绯闻|緋聞|八卦|彩票|加密货币|加密貨幣|博彩|网红带货|網紅帶貨)")

# Tibet reads in English, from the exile community's own publications. Its
# own vocabulary matters: settlement, monastery, thangka, the language itself.
# Tony, 10/4, after I showed him China had no source worth reading: "do tibet."
TOPIC["tibet"] = re.compile(TOPIC["en"].pattern +
  r"|\b(tibet|tibetan|settlement|monaster|nunnery|monk|nun|thangka|"
  r"dharamshala|dharamsala|himalay|plateau|nomad|yak|barley|tsampa|"
  r"sowa rigpa|men-tsee-khang|opera|lhamo|exile|refugee school|"
  r"language class|manuscript|archive|pilgrim|festival|losar)", re.I)
UPLIFT["tibet"] = re.compile(UPLIFT["en"].pattern +
  r"|\b(gold medal|clinch|marathon|rally|roadmap|observed|marks|"
  r"inaugurat|enrol|graduat|scholarship|preserv|revitalis|revitaliz)", re.I)
JUNK["tibet"] = JUNK["en"]
