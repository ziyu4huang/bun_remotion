# PLAN — 我的核心是大佬 Ch2 Ep2：經驗值農場

## Metadata

| Field | Value |
|-------|-------|
| Episode ID | ch2ep2 |
| Directory | `my-core-is-boss-ch2-ep2/` |
| Language | zh-TW |
| Chapter | 第二章：修煉就是練功（第 2/3 集） |
| Arc position | escalation |
| Status | draft |

## Characters

linyi, zhaoxiaoqi, xiaoelder, narrator

## Story Summary

林逸接到清剿靈獸洞窟的任務，發現怪物刷新點固定，於是找個十字路口站定「定點刷怪」——一擊秒殺排隊而來的妖獸，刷出驚人經驗值。趙小七目睹妖獸排隊倒下的場景，將其解讀為傳說中的「萬獸朝聖」，撰寫《萬獸朝聖錄》。蕭長老趕到後，從「萬獸朝聖」的上古神通震撼，到聽聞「三百隻」擊殺統計，最後忍不住問「老夫是不是也應該去刷刷妖獸」——修行觀念徹底動搖。

## Scene Breakdown

| Scene | Characters | Background | Key Beats |
|-------|-----------|------------|-----------|
| TitleScene | narrator | — | 靈獸洞窟介紹，林逸掛機升級後想更快 |
| ContentScene1 | linyi, narrator | spirit-beast-cave | 接任務→發現刷新點固定→定點刷怪→連殺加成 ×1.5→經驗值暴增 |
| ContentScene2 | linyi, zhaoxiaoqi, narrator | spirit-beast-cave | 趙小七目擊妖獸排隊→「萬獸朝聖」→「刷新率」=天道輪迴→「三十秒」=超度→《萬獸朝聖錄》 |
| ContentScene3 | linyi, zhaoxiaoqi, xiaoelder, narrator | spirit-beast-cave | 蕭長老趕到→「萬獸朝聖」古籍記載→「經驗值太少」→三百隻擊殺統計→「老夫也該刷刷」→三觀崩塌 |
| OutroScene | narrator | — | 萬獸朝聖傳說 + 蕭長老動搖 + 技能點分配伏筆 |

## Running Gags

| Gag | This Episode | Previous Episode |
|-----|-------------|-----------------|
| 玩家黑話 | 刷新點、定點刷怪、經驗值農場、連殺獎勵、經驗值倍率、重生點、打地鼠、任務進度、一刀一個 | Ep1：掛機、自動修煉腳本、效率、全服第一、Lv.52 |
| 趙小七腦補 | 「刷新率」→天道輪迴速度、「重生點」→超度、「萬獸朝聖」→妖獸自願歸順、「三十秒」=生死輪迴、《萬獸朝聖錄》 | Ep1：「不想動」→「以不動應萬動」、「效率」→天道法則、十萬字觀察日記 |
| 蕭長老崩潰 | 認出「萬獸朝聖」上古神通→「三百隻」衝擊→「老夫是不是也該去刷刷」→否認「老夫什麼都沒說」 | Ep1：腿軟→燒功法 |
| 系統 UI | 清剿任務面板、連殺加成倍率、經驗值計數器、擊殺統計、任務進度 | Ep1：自動修煉腳本、升級通知 |
| 語錄進化 | 《萬獸朝聖錄：林逸師兄超度妖獸全紀錄》—從觀察日記衍生出的新系列 | Ep1：《閉關悟道全紀錄》十萬字觀察日記 |

## Story Links

- Continues from: Ch2-Ep1 OutroScene teaser「靈獸洞窟，定點刷怪升級」
- Teases: Ch2-Ep3 技能點分配（採集 MAX）

## Episode Polish (baked-in)

### Effect Pacing (≤50% per scene)
- ContentScene1 (6 lines): sparkle on「連殺獎勵」= 1/6 = 17%
- ContentScene2 (9 lines): shock on zhaoxiaoqi「萬獸朝聖」, think on「刷新率」, gloating on「超度」= 3/9 = 33%
- ContentScene3 (15 lines): shock on xiaoelder「萬獸朝聖」, sweat on「低等…經驗值太少」, shock on「三百隻」, sweat on「老夫是不是…」, cry on「什麼都沒說」= 5/15 = 33%

### Background Variety
- CS1: spirit-beast-cave (綠色螢光) → CS2: spirit-beast-cave (紫藍光暈) → CS3: spirit-beast-cave (紅橙暖光)
  - Same background but different environmental accents per scene for variety

### TitleScene Hook
- Flash (5-22f) + Spring scale-in (10-40f) + System stinger「新任務：清剿靈獸洞窟妖獸 ×500」(35-95f) + Glow pulse

### OutroScene System UI
- QuestBadge「經驗值農場」+ UnlockingTeaser「Ch2-Ep3 解鎖進度：48%」
- Inline notes: [妖獸擊殺統計 +500] [趙小七《萬獸朝聖錄》v1.0]

### Environmental Effects
- CS1: green cavern glow (洞窟綠光), accent #34D399
- CS2: blue-purple crystal glow (藍紫晶光), accent #818CF8
- CS3: warm amber torchlight (琥珀火光), accent #FBBF24

## Graphify 品質閘門

**結果：通過 (PROCEED)** — 有 3 項 story-level WARN 需注意（regex 提取遺漏，非故事問題）

### Pipeline 執行紀錄

| 步驟 | 數據 |
|------|------|
| Extract (ch2ep2) | 13 nodes, 19 edges |
| Merge (全系列 5 集) | 109 nodes, 215 edges, 40 link edges, 7 communities |
| Check | **14 PASS, 6 WARN, 0 FAIL** |

### 檢查結果

#### PASS (14/20)

| 檢查項目 | 結果 | 說明 |
|----------|------|------|
| Tech Term Diversity — ch2ep2 | PASS | 2 個科技術語：掛機、經驗值 |
| Interaction Density | PASS | 所有角色實例至少有 1 次互動 |
| Community Structure | PASS | Global modularity: 0.5403 (7 communities) |
| Isolated Nodes | PASS | 無孤立節點 |
| Surprising Connection (×5) | PASS | 跨社區連接合理 |

#### WARN (6/20) — 非阻塞

| 檢查項目 | 結果 | 說明 | 是否為 ch2ep2 問題 |
|----------|------|------|-------------------|
| Trait Coverage — ch2ep2 linyi | WARN | **無偵測到角色特質** — regex 未從對話中提取到「遊戲化世界觀」等特質 | 是 — ch2ep2 linyi 對話偏短、技術性強，regex 模式未匹配 |
| Trait Coverage — ch2ep2 zhaoxiaoqi | WARN | **無偵測到角色特質** — regex 未提取到「選擇性聽力」「過度解讀」 | 是 — ch2ep2 腦補台詞較隱晦（「刷新率=天道輪迴」），regex 未命中 |
| Character Consistency — xiaoelder | WARN | ch2ep2 缺少 core trait「三觀崩塌中」 | 是 — regex 未匹配「修行觀念正在崩塌」等旁白描述 |
| Character Consistency — xiaoelder ch1ep1 | WARN | 缺少 core trait「老資格自居」 | 否 — ch1ep1 歷史遺留 |
| Community Cohesion — comm 0 | WARN | ch1ep1 社區凝聚力過低 (0.09) | 否 — 結構性問題 |
| Cross-Community Coherence | WARN | 50/215 edges 跨社區 (23.3%) | 否 — 結構性問題 |

**WARN 根因分析：** 3 項 ch2ep2 相關 WARN 全部是 regex 提取遺漏，非故事層面問題。人工閱讀確認：linyi 的「刷新點固定？」「定點刷怪」「經驗值太少」明確展現「遊戲化世界觀」特質；zhaoxiaoqi 的「刷新率=天道輪迴」「三十秒=生死輪迴」明確展現「選擇性聽力」特質；xiaoelder 的「老夫是不是也應該去刷刷」明確展現「三觀崩塌中」特質。

### 角色一致性

| 角色 | graphify 偵測特質 | Core Trait 穩定性 | 人工覆核 | 評估 |
|------|-----------------|-------------------|---------|------|
| 林逸 (linyi) | regex 未偵測到（WARN） | graphify: 0 traits detected | 人工確認：「刷新點固定？」「定點刷怪」「經驗值太少」明確展現「遊戲化世界觀」 | 一致。graphify regex 遺漏，故事層面無問題。玩家黑話從「掛機」升級為「刷新點」「經驗值倍率」「連殺獎勵」 |
| 趙小七 (zhaoxiaoqi) | regex 未偵測到（WARN） | graphify: 0 traits detected | 人工確認：「刷新率=天道輪迴」「三十秒=生死輪迴」明確展現「選擇性聽力」 | 一致。graphify regex 遺漏。三層腦補鏈（刷新率→輪迴、重生點→超度、三十秒→生死輪迴）+ 首次命名「萬獸朝聖」 |
| 蕭長老 (xiaoelder) | 老資格自居（graphify: 1 trait） | graphify: missing core「三觀崩塌中」（WARN） | 人工確認：「老夫是不是也應該去刷刷」「老夫什麼都沒說」明確展現三觀崩塌 | 一致。graphify regex 遺漏 core trait。崩潰弧線 ch1ep1 震驚→ch1ep3 研究→ch2ep1 燒功法→ch2ep2 動搖 |
| 旁白 (narrator) | graphify: 無特質追蹤 | stable | 延續前四集風格 | 一致。「修行觀念正在以肉眼可見的速度崩塌」 |

### 3. Running Gag Evolution Check

| 梗 | ch2ep1 表現 | ch2ep2 表現 | 演進方式 | 與 plot-lines.md Ch2 比對 | 評估 |
|----|-----------|-----------|---------|-------------------------|------|
| 玩家黑話 | 掛機、自動修煉腳本、效率、全服第一、Lv.52、隱藏加成 | 刷新點、定點刷怪、經驗值農場、連殺獎勵、經驗值倍率、重生點、打地鼠、任務進度、一刀一個 | **升級** — 從 MMO 掛機術語轉向 MMO 農怪/效率計算術語，與「經驗值農場」標題完全吻合 | 通過。plot-lines.md Ch2 欄位寫的是「掛機練功」，ep2 從「掛機」（ep1）推進到「定點刷怪/農場」，符合預期演進方向。9 個新術語與 ep1 零重疊（ep1 的「掛機」在 ep2 僅 TitleScene 回顧提及，非新用法） |
| 趙小七腦補 | 「不想動」→「以不動應萬動」、「先睡」→「元神運轉」、「效率」→「天道法則」、十萬字觀察日記 | 「刷新率」→天道輪迴速度、「重生點就在這」→超度、「三十秒」→生死輪迴、「萬獸朝聖」→妖獸自願歸順、《萬獸朝聖錄》 | **升級** — 從個人腦補升級為「命名傳說」+ 創建新書系統。腦補對象從林逸的「話語」擴展為林逸的「行為場景」（妖獸排隊倒下） | 通過。plot-lines.md Ch2 欄位寫的是「十萬字日記」，ep2 從「觀察日記」（ep1）推進到《萬獸朝聖錄》——日記從單一文檔衍生出主題專錄系列，符合進化預期 |
| 蕭長老崩潰 | 腿軟→「修行三百年」→燒功法 | 認出「萬獸朝聖」上古神通→「三百隻」衝擊→「老夫是不是也該去刷刷」→否認「老夫什麼都沒說」 | **轉向+深化** — 崩潰從「自我否定」（燒功法）轉向「開始動搖」（想嘗試林逸的方式），否認行為暗示內心已不完全反對 | 通過。plot-lines.md Ch2 崩潰進度 40%「承認林逸超越自己」。ep1 完成承認（燒功法=承認功法無用），ep2 更進一步：不再只是承認，而是開始想學。「老夫是不是也應該去刷刷」是崩潰進度條推向 45% 的標誌性台詞 |
| 系統 UI | 自動修煉腳本按鈕、升級通知 (Lv.52)、修煉效率面板 | 清剿任務面板、經驗值倍率顯示（連殺加成 ×1.5）、經驗值計數器（二百/三萬）、擊殺統計（307）、任務進度（60%） | **升級** — 系統 UI 從「修煉輔助」擴展為「戰鬥統計」，展現系統功能的 MMO 化 | 通過。plot-lines.md Ch2 欄位寫的是「自動修煉」，ep2 UI 從修煉面板推進到戰鬥統計面板，符合技術進階 |
| 語錄進化 | 十萬字觀察日記《論天道與呼吸的關係》，語錄→觀察報告 | 《萬獸朝聖錄：林逸師兄超度妖獸全紀錄》—從觀察日記衍生出主題專錄 | **升級** — 從「綜合觀察日記」升級為「主題專錄系列」，標誌趙小七的記錄系統化 | 通過。plot-lines.md Ch2 寫「十萬字日記（正式發售）」，《萬獸朝聖錄》是日記的第一個衍生作品，語錄進化軌跡連續 |

### 4. Story Arc Continuity

**Ch2-Ep1→Ch2-Ep2 過渡分析：**

1. **接續點精確：** Ch2ep1 OutroScene 預告「當他發現靈獸洞窟可以定點刷怪升級時，一場『經驗值農場』的傳說即將開始」，ch2ep2 TitleScene 以「靈獸洞窟，天道宗弟子的試煉聖地。林逸前一集掛機升了五十級，覺得效率還可以更快」無縫接軌——直接引用「前一集掛機」回顧，並以「效率還可以更快」銜接 ep1 的效率主題。

2. **伏筆鋪設 Ch2-Ep3：** OutroScene 預告「當林逸打開技能點分配面板，把所有點數全砸在『採集』上的時候，一場更大的誤會即將誕生」——「技能點分配」和「採集 MAX」是全新技術術語，與前集零重疊，預留了充足的 ep3 故事空間。「更大的誤會」暗示 ep3 的誤會等級將超越「萬獸朝聖」。

3. **人設升級弧線：** Ch2 關鍵誤會對照 plot-lines.md：
   - plot-lines.md Ch2：「掛機=閉關悟道、刷怪=萬獸朝聖」→「超越大乘期的存在」
   - ep1 覆蓋「掛機=閉關悟道」→ ep2 覆蓋「刷怪=萬獸朝聖」→ 趙小七明確說出「超越天道的氣息」，旁白以「傳說」定性
   - 人設從「隱世高人」（Ch1）→「超越大乘期的存在」（Ch2 完成）的弧線完整達成

4. **蕭長老崩潰進度條：**
   - Ch2ep1：燒功法（40%）
   - Ch2ep2：「老夫是不是也應該去刷刷」→ 否認（~45%）
   - 進度條從 40% 微幅推進，不急不緩，為 Ch3「穿牆必修」的 60% 預留空間。合理。

5. **語錄進化軌跡：**
   - Ch1：第一篇語錄 → 第二篇語錄 → 第三篇語錄
   - Ch2ep1：十萬字觀察日記《論天道與呼吸的關係》
   - Ch2ep2：《萬獸朝聖錄：林逸師兄超度妖獸全紀錄》
   - 語錄從「單一文檔」→「綜合日記」→「主題專錄系列」，進化鏈完整。與 plot-lines.md「Ch2：十萬字觀察日記（正式發售）」一致。

6. **角色登場一致性：** ch2ep2 使用 linyi/zhaoxiaoqi/xiaoelder/narrator 四角色，與 ch2ep1 完全一致，符合全系列角色陣容。

### 5. Gate Verdict

**PROCEED** — graphify pipeline 實際執行：5 集全萃取，merged graph 109 nodes / 215 edges / 40 link edges。3 項 story-level WARN 全部是 regex 提取遺漏（linyi/zhaoxiaoqi 零特質偵測、xiaoelder 缺 core trait），人工覆核確認故事層面無問題。4 條招牌梗成功推進，Ch2 人設弧線完整。

**regex 遺漏根因：** ch2ep2 的腦補台詞使用隱喻格式（「刷新率=天道輪迴」），graphify regex 模式基於直接描述詞匹配（如「遊戲化世界觀」「選擇性聽力」），無法匹配這類間接表達。建議未來改進 regex 或增加 LLM 輔助 trait extraction。
