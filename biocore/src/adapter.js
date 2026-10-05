import { loadQuestions } from "./data/index.js";
import { createSessionController } from "./adapter/session.js";
import { catalogView, prioritiesView, mistakesView, analyticsView, overviewView, searchView } from "./adapter/views.js";
export function createBiocoreAdapter(storage) {
  const session = createSessionController(storage);
  const view = fn => async (...args) => fn(await loadQuestions(),session.getState(),...args);
  return { ...session,
    overview:view(overviewView),catalog:view(catalogView),analytics:view(analyticsView),
    priorities:view(prioritiesView),mistakes:view(mistakesView),search:view(searchView) };
}
export const adapter = createBiocoreAdapter();
export default adapter;
