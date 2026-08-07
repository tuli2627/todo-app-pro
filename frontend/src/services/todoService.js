/**
 * All todo-related API calls in one place. Components import from here
 * instead of calling axios directly — keeps endpoints/URLs out of UI code.
 */

import api from "./api";

const RESOURCE = "/todos/";

export const todoService = {
  getAll: (params = {}) => api.get(RESOURCE, { params }),
  create: (todo) => api.post(RESOURCE, todo),
  update: (id, updates) => api.patch(`${RESOURCE}${id}/`, updates),
  delete: (id) => api.delete(`${RESOURCE}${id}/`),
};
