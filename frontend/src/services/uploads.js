import { apiUpload } from './api.js'

/** @param {File} file  @param {{onProgress?: Function, signal?: AbortSignal}} [opts] */
export function uploadDocument(file, opts) {
  const fd = new FormData()
  fd.append('file', file)
  return apiUpload('/uploads/document', fd, opts)
}

/** @param {File} file  @param {{onProgress?: Function, signal?: AbortSignal}} [opts] */
export function uploadMaterialImage(file, opts) {
  const fd = new FormData()
  fd.append('file', file)
  return apiUpload('/uploads/material-image', fd, opts)
}
