# PLAN — 我的核心是大佬 Ch2 Ep1：掛機修仙

## Metadata

| Field | Value |
|-------|-------|
| Episode ID | ch2ep1 |
| Directory | `my-core-is-boss-ch2-ep1/` |
| Language | zh-TW |
| Chapter | 第二章：修煉就是練功（第 1/3 集） |
| Arc position | setup |
| Status | draft |

## Characters

linyi, zhaoxiaoqi, xiaoelder, narrator

## Story Summary

林逸回到修煉場打坐，意外觸發系統「自動修煉腳本」功能——直接掛機睡覺，一覺醒來連升五十級。趙小七聽到「不想動」誤解為「以不動應萬動」，守門三天寫下十萬字觀察日記。蕭長老目睹升級震驚腿軟，回頭偷偷燒了自己修行三十年的功法。

## Scene Breakdown

| Scene | Characters | Background | Key Beats |
|-------|-----------|------------|-----------|
| TitleScene | narrator | — | 修煉場，林逸回洞府躺下 |
| ContentScene1 | linyi, zhaoxiaoqi, narrator | sect-training | 打坐→發現「自動修煉腳本」→「不想動」→趙小七誤解為「以不動應萬動」→自願守門→林逸睡了 |
| ContentScene2 | linyi, xiaoelder, narrator | sect-interior | 三天後醒來→Lv.52→蕭長老路過震驚→「掛機三天效率還行」→「全服第一」→長老腿軟 |
| ContentScene3 | zhaoxiaoqi, xiaoelder, narrator | sect-plaza | 趙小七誤解「先睡」= 元神運轉、「效率」= 天道法則→十萬字日記→蕭長老崩潰→燒功法 |
| OutroScene | narrator | — | 語錄升級為「觀察報告」+ 蕭長老燒功法 + 經驗值農場伏筆 |

## Running Gags

| Gag | This Episode | Previous Episode |
|-----|-------------|-----------------|
| 玩家黑話 | 掛機、自動修煉腳本、效率、隱藏加成、全服第一、Lv.52 | Ep3：碰撞體、Bug、NPC、尋路、卡模型 |
| 趙小七腦補 | 「不想動」→「以不動應萬動」、「先睡」→「元神獨自運轉天道」、「效率」→「天道運轉最高效法則」 | Ep3：空間禁錮之術、空間裂縫 |
| 蕭長老崩潰 | 路過看到 Lv.52→腿軟（呼應 ch1ep1）→「修行三百年…他三天就…」→燒毀三十年功法 | Ep3：偷偷記筆記改寫「空間節點」 |
| 系統 UI | 自動修煉腳本按鈕、升級通知（Lv.52）、修煉效率面板 | Ep3：HpBar、LevelTag |
| 語錄進化 | 從「語錄」升級為「觀察報告」系列（十萬字日記） | Ep3：第三篇語錄「空間法則」 |

## Story Links

- Continues from: Ch1-Ep3 OutroScene teaser「大比結束後，林逸回到自己的洞府打坐，卻意外觸發了系統面板上的一個新按鈕——『自動修煉腳本』」
- Teases: Ch2-Ep2 經驗值農場（定點刷怪升級）

## Episode Polish (baked-in)

### Effect Pacing (≤50% per scene)
- ContentScene1 (10 lines): sparkle on「自動修煉腳本？」, shock on zhaoxiaoqi「以不動應萬動」= 2/10 = 20%
- ContentScene2 (10 lines): shock on Lv.52, sweat on elder「掛…掛機…」, shock on「全服」= 3/10 = 30%
- ContentScene3 (12 lines): sparkle on「先睡」解讀, fire on 十萬字, sweat on elder「三百…三天…」, cry on 燒功法 = 4/12 = 33%

### Background Variety
- CS1: sect-training → CS2: sect-interior → CS3: sect-plaza (all different)

### TitleScene Hook
- Flash (5-22f) + Spring scale-in (10-40f) + System stinger「新功能已解鎖：自動修煉腳本」(35-95f) + Glow pulse

### OutroScene System UI
- QuestBadge「掛機修仙」+ UnlockingTeaser「Ch2-Ep2 解鎖進度：64%」
- Inline notes: [蕭長老功法 -1] [趙小七觀察日記 +100,000字]

### Environmental Effects
- CS1: warm lamp glow (打坐暖光), accent #FBBF24
- CS2: night monitor glow (洞府藍光), accent #60A5FA
- CS3: golden radiance (廣場日光), accent #F472B6

## Graphify 品質閘門

**結果：通過 (PROCEED)**

### Pipeline 執行紀錄

| 階段 | 數據 |
|------|------|
| Extract (ch2ep1) | 19 nodes, 26 edges |
| Merge (全系列 4 集) | 95 nodes, 164 edges, 24 link edges, 8 communities |
| Check | **15 PASS, 3 WARN, 0 FAIL** |

### 檢查結果

#### PASS (15/18)

| 檢查項目 | 結果 | 說明 |
|----------|------|------|
| Trait Coverage | PASS | 所有角色實例至少偵測到 1 項特質 |
| Interaction Density | PASS | 所有角色實例至少有 1 次互動 |
| Community Structure | PASS | Global modularity: 0.5313 (8 communities) |
| Isolated Nodes | PASS | 無孤立節點 |
| Tech Term Diversity — ch1ep1 | PASS | 10 個科技術語：載入中、NPC、建模、任務面板、新手教程等 |
| Tech Term Diversity — ch1ep2 | PASS | 7 個科技術語：跳過、過場動畫、自動尋路、尋路、經驗值等 |
| Tech Term Diversity — ch1ep3 | PASS | 5 個科技術語：碰撞體、Bug、NPC、尋路、卡模型 |
| Tech Term Diversity — ch2ep1 | PASS | 5 個科技術語：系統面板、自動修煉、掛機、Lv.52、等級 |
| Character Consistency — xiaoelder | PASS | 跨 3 集特質一致（1 core trait: 三觀崩塌中） |
| Surprising Connection (×5) | PASS | 5 組跨社區連接均合理（角色→劇情、角色→科技術語） |
| Gag Evolution | PASS | 無 gag_evolves 邊需檢查（使用其他機制追蹤） |

#### WARN (3/18) — 非阻塞

| 檢查項目 | 結果 | 說明 | 是否為 ch2ep1 問題 |
|----------|------|------|-------------------|
| Character Consistency — linyi ch1ep2 | WARN | 缺少 core trait「遊戲化世界觀」 | 否 — ch1ep2 歷史遺留 |
| Character Consistency — zhaoxiaoqi ch1ep1 | WARN | 缺少 core trait「選擇性聽力」 | 否 — ch1ep1 歷史遺留 |
| Cross-Community Coherence | WARN | 50/164 edges 跨社區 (30.5%) | 否 — 結構性問題，非故事層面 |

### 角色一致性

| 角色 | ch2ep1 偵測特質 | Core Trait 穩定性 | ch1ep3→ch2ep1 演進 | 評估 |
|------|----------------|-------------------|-------------------|------|
| 林逸 (linyi) | 遊戲化世界觀 | **stable** — ch1ep1/ch1ep3/ch2ep1 三集出現 | 「卡模型 Bug」→「掛機三天效率還行」：從 Bug 利用者演進為掛機玩家，核心「把現實當遊戲」不變 | 一致。玩家黑話從「碰撞體」「尋路」自然升級為「掛機」「全服第一」「Lv.52」，符合 MMO 玩家進階路線 |
| 趙小七 (zhaoxiaoqi) | 選擇性聽力 | **stable** — ch1ep2/ch1ep3/ch2ep1 三集出現 | 「空間禁錮之術」→「以不動應萬動」「元神獨自運轉天道」：腦補模式從單一事件升級為系統性哲學解讀 | 一致。新增三層誤解鏈（「不想動」→「以不動應萬動」、「先睡」→「元神運轉」、「效率」→「天道法則」），展現腦補能力的進化，非退化 |
| 蕭長老 (xiaoelder) | 三觀崩塌中、老資格自居 | **stable** — ch1ep1/ch1ep3/ch2ep1 三集出現 | 「偷偷記筆記改寫空間節點」→「腿軟→燒功法」：從記錄研究升級為自我否定 | 一致。「修行三百年」口頭禪再次出現，行為弧線從震驚→記錄→否定自我，符合 plot-lines.md 崩潰進度條 Ch2 40% 預期 |
| 旁白 (narrator) | 客觀描述+冷吐槽 | stable | 延續前幾集風格 | 一致 |

### 招牌梗演進

| 梗 | ch1ep3 表現 | ch2ep1 表現 | 演進方式 | 評估 |
|----|-----------|-----------|---------|------|
| 玩家黑話 | 碰撞體、Bug、NPC、尋路、卡模型 | 系統面板、自動修煉腳本、掛機、效率、全服第一、Lv.52、隱藏加成 | **升級** — 從 Bug 術語轉向 MMO 掛機/效率術語，與「修煉就是練功」章節主題吻合 | 通過。5 個新術語與前集零重疊 |
| 趙小七腦補 | 「空間禁鋸之術」→上古失傳秘法 | 「不想動」→「以不動應萬動」、「先睡」→「元神獨自運轉天道」、「效率」→「天道運轉最高效法則」 | **升級** — 從單一事件腦補升級為三層遞進式哲學解讀，每一層比上一層更荒謬 | 通過。腦補層次明顯比前集更密集、更有體系 |
| 蕭長老崩潰 | 偷偷記筆記，改寫「卡模型」→「空間節點」 | 腿軟（呼應 ch1ep1）→「修行三百年」→燒毀三十年功法 | **轉向** — 從記錄/研究模式轉向自我否定/毀棄模式，崩潰程度加深 | 通過。燒功法是重大行為轉折，符合 plot-lines.md Ch2 40% 預期 |
| 系統 UI | HpBar、LevelTag | 自動修煉腳本按鈕、升級通知 (Lv.52)、修煉效率面板 | **升級** — 新增「自動修煉」功能 UI，展現系統功能擴展 | 通過。 |
| 語錄進化 | 第三篇語錄「空間法則」 | 十萬字觀察日記《論天道與呼吸的關係》，語錄→觀察報告 | **升級** — 從短篇語錄升級為系統性長篇觀察報告 | 通過。符合 plot-lines.md Ch2「十萬字觀察日記」預期 |

### 故事 Arc 連續性

**Ch1→Ch2 過渡分析：**

1. **接續點精確：** Ch1ep3 OutroScene 預告「大比結束後，林逸回到自己的洞府打坐，卻意外觸發了系統面板上的一個新按鈕——『自動修煉腳本』」，ch2ep1 TitleScene 以「大比剛結束，弟子們紛紛回洞府閉關」無縫接軌。

2. **人設升級弧線：** Ch1 林逸人設為「隱世高人」→ Ch2 掛機三天升 50 級 → 人設提升至「超越大乘期的存在」（趙小七解讀）/「隱藏加成超越大陸所有修行者總和」（旁白揭示），完全符合 plot-lines.md「林逸的大佬人設建立過程」表中 Ch2 的「超越大乘期的存在」定位。

3. **蕭長老崩潰進度條：** Ch1ep1 腿軟（20%）→ Ch2ep1 燒功法（40%），符合 plot-lines.md `[████░░░░░░] 40% — 燒功法，承認林逸超越自己` 的預期。

4. **語錄進化軌跡：** Ch1 第一篇語錄 → Ch2 十萬字觀察日記（正式發售），符合 plot-lines.md 預期的「Ch2：十萬字觀察日記（正式發售）」。

5. **伏筆鋪設：** OutroScene 預告 Ch2ep2「經驗值農場」（定點刷怪升級），承接「自動修煉」主題的自然延伸。

6. **角色登場一致性：** ch1ep3 使用 linyi/zhaoxiaoqi/xiaoelder/narrator 四角色，ch2ep1 延續完全相同的角色陣容，符合 PLAN.md Episode Guide 中 Ch2Ep1 的角色配置。

### 修訂評估

本次修訂針對原始版本的兩個 story-level WARN 進行了修復：

**修復 1：zhaoxiaoqi 特質覆蓋 (Trait Coverage WARN → PASS)**

- **修訂前：** zhaoxiaoqi 在 ch2ep1 僅有被動的「守門」「寫日記」行為，缺乏可被圖譜偵測的主動特質標記。Graphify 無法從原文中提取到她的經典「過度解讀」模式。
- **修訂後：** 新增三層遞進式過度解讀鏈——「不想動」→「以不動應萬動」（ContentScene1）、「先睡」→「元神獨自運轉天道」（ContentScene3）、「效率」→「天道運轉最高效法則」（ContentScene3）。每一層都展現了 zhaoxiaoqi 的核心行為模式：把林逸的懶人話語自動昇華為修仙哲學。這三個解讀案例讓 Graphify 能明確偵測到「選擇性聽力」和「過度解讀」特質。
- **效果：** Trait Coverage 從 WARN 升為 PASS，zhaoxiaoqi 的 stable core trait「選擇性聽力」現在在 ch1ep2/ch1ep3/ch2ep1 三集連續出現。

**修復 2：linyi 互動密度 (Interaction Density WARN → PASS)**

- **修訂前：** linyi 在 ContentScene1 和 ContentScene2 僅有獨白或與系統面板的單向互動，缺乏與其他角色的雙向對話。Graphify 的 Interaction Density 檢查要求每個角色實例至少有 1 次互動邊。
- **修訂後：** ContentScene1 中 zhaoxiaoqi 主動加入與 linyi 的對話（「不想動」→「以不動應萬動」→「不是，我就是懶」→「師兄太謙虛了」），形成完整的 linyi↔zhaoxiaoqi 互動鏈。ContentScene2 中 xiaoelder 主動來查看修煉進度，形成 linyi↔xiaoelder 互動（「掛機三天就升了五十級，效率還行吧」→「掛……掛機三天……升了……五十……級……」）。
- **效果：** Interaction Density 從 WARN 升為 PASS，Extract 階段從 18 nodes/19 edges 提升至 19 nodes/26 edges（+37% 邊數），故事圖譜連接更緊密。

**連帶改善：** 由於多角色互動增加，Merge 階段的 link edges 更加豐富，Cross-Community Coherence 雖仍為 WARN (30.5%)，但社區間連接的語義品質提升——角色之間的互動不再是單向的，而是有來有往的對話循環。

### 閘門判定

**PROCEED** — 15/18 項檢查通過，3 項 WARN 均為非阻塞（2 項 ch1ep1/ch1ep2 歷史遺留 + 1 項結構性跨社區問題），ch2ep1 本身零 FAIL、零 story-level WARN。角色特質跨集穩定（三角色均有 stable core trait），四條招牌梗全部成功推進（2 條升級 + 1 條轉向 + 1 條升級），Ch1→Ch2 章節過渡與 plot-lines.md 預期完全吻合。修訂成功修復了原始版本的兩個 story-level 問題，圖譜連接密度提升 37%。
