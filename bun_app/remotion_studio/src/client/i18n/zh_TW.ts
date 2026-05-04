import type { Translations } from "./context.js";

import { appZhTW as app, navZhTW as nav, pagesZhTW as pages, errorZhTW as error, commonZhTW as common } from "./sections/core.js";
import { dashboardZhTW as dashboard } from "./sections/dashboard.js";
import { monitoringZhTW as monitoring, pipelineProgressZhTW as pipelineProgress, kanbanZhTW as kanban } from "./sections/monitoring.js";
import { projectsZhTW as projects } from "./sections/projects.js";
import { storyEditorZhTW as storyEditor } from "./sections/story-editor.js";
import { workflowsZhTW as workflows } from "./sections/workflows.js";
import { storygraphZhTW as storygraph } from "./sections/storygraph.js";
import { qualityZhTW as quality } from "./sections/quality.js";
import { benchmarkZhTW as benchmark } from "./sections/benchmark.js";
import { agentChatZhTW as agentChat } from "./sections/agent-chat.js";
import { assetsZhTW as assets } from "./sections/assets.js";
import { ttsZhTW as tts } from "./sections/tts.js";
import { renderZhTW as render } from "./sections/render.js";
import { imageGenZhTW as imageGen } from "./sections/image-gen.js";
import { settingsZhTW as settings } from "./sections/settings.js";
import { wizardZhTW as wizard } from "./sections/wizard.js";
import { jobsZhTW as jobs, advisorZhTW as advisor, onboardingTourZhTW as onboardingTour } from "./sections/shared.js";
import { seriesOverviewZhTW } from "./sections/series-overview.js";
import { continuityZhTW } from "./sections/continuity.js";
const { seriesOverview } = seriesOverviewZhTW;

export const zh_TW: Translations = {
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
  continuity: continuityZhTW,
};
