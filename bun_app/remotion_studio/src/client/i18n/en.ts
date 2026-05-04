import { appEn as app, navEn as nav, pagesEn as pages, errorEn as error, commonEn as common } from "./sections/core.js";
import { dashboardEn as dashboard } from "./sections/dashboard.js";
import { monitoringEn as monitoring, pipelineProgressEn as pipelineProgress, kanbanEn as kanban } from "./sections/monitoring.js";
import { projectsEn as projects } from "./sections/projects.js";
import { storyEditorEn as storyEditor } from "./sections/story-editor.js";
import { workflowsEn as workflows } from "./sections/workflows.js";
import { storygraphEn as storygraph } from "./sections/storygraph.js";
import { qualityEn as quality } from "./sections/quality.js";
import { benchmarkEn as benchmark } from "./sections/benchmark.js";
import { agentChatEn as agentChat } from "./sections/agent-chat.js";
import { assetsEn as assets } from "./sections/assets.js";
import { ttsEn as tts } from "./sections/tts.js";
import { renderEn as render } from "./sections/render.js";
import { imageGenEn as imageGen } from "./sections/image-gen.js";
import { settingsEn as settings } from "./sections/settings.js";
import { wizardEn as wizard } from "./sections/wizard.js";
import { jobsEn as jobs, advisorEn as advisor, onboardingTourEn as onboardingTour } from "./sections/shared.js";
import { seriesOverviewEn } from "./sections/series-overview.js";
import { continuityEn } from "./sections/continuity.js";
const { seriesOverview } = seriesOverviewEn;

export const en = {
  app,
  nav,
  pages,
  dashboard,
  monitoring,
  pipelineProgress,
  kanban,
  projects,
  storyEditor,
  workflows,
  storygraph,
  quality,
  benchmark,
  agentChat,
  assets,
  tts,
  render,
  imageGen,
  error,
  settings,
  wizard,
  seriesOverview,
  jobs,
  common,
  advisor,
  onboardingTour,
  continuity: continuityEn,
} as const;
