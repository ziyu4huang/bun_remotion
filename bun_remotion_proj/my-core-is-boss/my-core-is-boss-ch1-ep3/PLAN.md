# PLAN — 我的核心是大佬 Ch1 Ep3：Bug 利用

> Parent: [../PLAN.md](../PLAN.md) | Parent TODO: [../TODO.md](../TODO.md) | Episode TODO: [./TODO.md](./TODO.md)

## Metadata

| Field | Value |
|-------|-------|
| Episode ID | ch1ep3 |
| Directory | `my-core-is-boss-ch1-ep3/` |
| Language | zh-TW |
| Chapter | 第一章：系統覺醒（第 3/3 集） |
| Arc position | cliffhanger（章節完結，埋第二章伏筆） |
| Status | scaffolded |

## Characters

linyi, zhaoxiaoqi, xiaoelder, narrator

## Story Summary

宗門大比展開，林逸在比武中被對手追趕時意外穿牆，發現碰撞體判定 Bug。他利用地形縫隙把對手全部卡住，連勝所有比賽。趙小七腦補為「空間禁錮之術」，蕭長老偷偷把「卡模型」改寫成「空間節點」記進修煉筆記。章節結尾埋下第二章「自動修煉腳本」伏筆。

## Scene Breakdown

| Scene | Characters | Background | Key Beats |
|-------|-----------|------------|-----------|
| TitleScene | narrator | — | 宗門大比開幕，林逸蹲在比武台旁戳牆壁 |
| ContentScene1 | linyi, xiaoelder, narrator | tournament-stage | 被對手追趕→慌忙後退穿牆→意外發現碰撞 Bug→卡牆→NPC 尋路缺陷 |
| ContentScene2 | linyi, xiaoelder, narrator | boss-arena | 引對手到縫隙卡住（第二個不肯靠牆→繞到右邊另一個縫隙）→連勝 |
| ContentScene3 | linyi, zhaoxiaoqi, xiaoelder, narrator | tournament-stage | 趙小七腦補「空間禁錮之術」（與蕭長老交替對話）→蕭長老偷偷記筆記 |
| OutroScene | narrator | — | 語錄第三篇 + 蕭長老筆記 + 自動修煉腳本伏筆 |

## Running Gags

| Gag | This Episode | Previous Episode |
|-----|-------------|-----------------|
| 玩家黑話 | 碰撞體、穿模、尋路邏輯、卡牆 Bug、HP、NPC、攻擊前搖 | Ep2：跳過、過場動畫、自動尋路、經驗值 |
| 趙小七腦補 | 空間禁錮之術、空間裂縫、座標控制 | Ep2：大乘期修為直取天道本源 |
| 語錄更新 | 第三篇：「真正的空間法則，在於找到世界的縫隙」 | Ep2：第二篇「跳過=超越」 |
| 蕭長老崩潰 | 偷偷記筆記「卡模型」→改寫為「空間節點」 | Ep2：開始暗中記錄林逸的每句話 |

## Story Links

- Continues from: Ch1-Ep2 OutroScene teaser「宗門大比，林逸發現比武台有碰撞體 Bug，可以把對手卡在牆裡」
- Teases: Ch2-Ep1 掛機修仙（林逸觸發「自動修煉腳本」按鈕）

## System UI

| Scene | UI Elements | Notes |
|-------|------------|-------|
| ContentScene2 | HpBar（對戰血條）、LevelTag（等級顯示） | 比武對戰 UI |

## Graphify 品質閘門

**結果：通過 (PROCEED)**

### Pipeline 執行紀錄

| 步驟 | 狀態 | 輸出 |
|------|------|------|
| Extract（萃取） | 完成 | `bun_graphify_out/graph.json` — 23 nodes, 28 edges |
| Merge（合併） | 完成 | 系列 `bun_graphify_out/merged-graph.json` — 76 nodes, 115 edges, 12 cross-episode links |
| Check（檢查） | 完成 | `bun_graphify_out/consistency-report.md` |

### 檢查結果

#### PASS (9/9)

| 檢查項目 | 發現 |
|----------|------|
| 角色一致性：linyi | 跨 3 集特質穩定 — `萬物皆有Bug`（ep1→ep3）+ `遊戲化世界觀`（ep1→ep3）貫穿 |
| 角色一致性：zhaoxiaoqi | 跨 3 集特質穩定 — `過度解讀`（ep1→ep3）+ `主動腦補`（ep2→ep3）+ `選擇性聽力`（ep2→ep3） |
| 角色一致性：xiaoelder | 1 項核心穩定特質（`嚴肅長老表面`），跨 2 集一致 |
| 梗的演進 | 未偵測到停滯 |
| 科技術語多樣性：ep1 | 10 個術語（載入中, NPC, 建模, 任務面板, 新手教程, ...） |
| 科技術語多樣性：ep2 | 7 個術語（跳過, 過場動畫, 自動尋路, 尋路, 經驗值, ...） |
| 科技術語多樣性：ep3 | 5 個術語（碰撞體, Bug, NPC, 尋路, 卡模型）— 其中 3 個為本集新增 |
| 特質覆蓋率 | 所有角色實例至少偵測到 1 項特質 |
| 互動密度 | 所有角色實例至少有 1 次互動 |

### 角色一致性

| 角色 | 已建立特質 | 本集表現 | 狀態 |
|------|-----------|---------|------|
| linyi | 簡短玩家術語、不耐煩、吐槽、「萬物皆有Bug」、「遊戲化世界觀」 | 碰撞體/Bug/NPC/尋路/HP/攻擊前搖。隨性：「哦，來了。」「好，下一個。來來來」。吐槽：「什麼節點？我就是看哪裡有縫隙而已」 | 一致，自然演進 |
| zhaoxiaoqi | 「師兄」開頭、感嘆號多、過度解讀、選擇性聽力 | 「師兄根本不需要出手！」→空間禁錮之術→座標控制→空間裂縫。林逸說「縫隙」→她聽成「空間的裂縫」 | 一致，自然演進 |
| xiaoelder | 嚴肅長老表面、三觀崩塌中、偷偷記錄研究、自稱「老夫」 | 「這……這怎麼可能！」（ContentScene2）、偷偷改寫「卡模型→空間節點」（ContentScene3）。本集未用「老夫」自稱 | 一致，微小遺漏（未用「老夫」） |
| narrator | 簡練場景設定、喜劇反差收尾 | 「蹲在比武台旁邊，用手戳牆壁」— 比 ep2 的「還在研究系統面板」更具畫面感 | 一致 |

### 招牌梗演進

| 梗 | 前集（Ep2） | 本集表現 | 狀態 |
|----|-----------|---------|------|
| 玩家黑話 | 跳過、過場動畫、自動尋路、經驗值 | 碰撞體、Bug、NPC、尋路、卡模型 + 新增：攻擊前搖、HP、碰撞判定 | 演進 — 拓展至戰鬥/物理引擎新領域 |
| 趙小七腦補 | 「大乘期修為直取天道本源」 | 「空間禁錮之術」→「座標控制」→「空間結構的弱點」。比 ep2 更具「偽技術分析」感 | 漸進 — 從抽象讚美升級為偽技術分析 |
| 語錄更新 | 第二篇：「跳過=超越」 | 第三篇：「真正的空間法則，在於找到世界的縫隙」— 三篇中最佳 | 漸進 |
| 蕭長老崩潰 | 開始暗中記錄林逸的每句話 | 偷偷改寫「卡模型」→「空間禁錮……以氣場扭曲空間」— 從被動震驚到主動參與誤解 | 漸進 — 本集最佳表現 |

### 故事 Arc 連續性

- **承接：** Ep2 OutroScene 預告「宗門大比，林逸發現比武台有碰撞體 Bug，可以把對手卡在牆裡」→ Ep3 TitleScene 開幕 + ContentScene1 比武台 — 無縫銜接
- **伏筆：** Ep3 OutroScene「自動修煉腳本」按鈕 → Ch2-Ep1 掛機修仙 — 伏筆強度高，引入全新概念而非重複 Bug 利用套路
- **章節 Arc 位置：** cliffhanger（第一章 3/3）— 完美收尾。Ep1（鋪陳：到來+首次誤解）→ Ep2（升級：任務跳過+語錄）→ Ep3（高潮：大比勝利+所有梗回收+伏筆）

### 修訂評估

修訂改善了五個方面：

1. **ContentScene1 意外發現** — 「慌忙後退→穿牆」比分析式發現更自然且更有喜劇效果。「閃閃閃——！」「……我怎麼卡進來了？」提供更好的肢體喜劇
2. **ContentScene2 升級** — 加入「這個精一點，不肯靠牆」→「右邊還有個縫隙」創造節奏變化，避免所有比賽相同勝法
3. **ContentScene3 對話交替** — 打破趙小七獨白，加入蕭長老反應（「空……空間禁錮？」「那不是傳說中渡劫期以上才能施展的禁術嗎……？」）創造三角動態
4. **TitleScene 優化** — 「蹲在比武台旁邊，用手戳牆壁」更具畫面感
5. **新增術語「攻擊前搖」** — 玩家獨有術語（修仙語境無意義），強化「世界是遊戲」核心設定

### 閘門判定

**通過 (PROCEED)** — 修訂成功解決原始版本的所有弱點。角色特質與 ep1-2 一致，四條梗全部升級而非重複。章節完結完美回收第一章 Arc 線，同時埋下第二章伏筆。結構健康（23 nodes, 28 edges, 9 PASS / 0 WARN / 0 FAIL）。唯一小點：蕭長老本集未自稱「老夫」，但微小不構成漂移。
