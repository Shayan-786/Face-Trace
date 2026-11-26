export const VIDEO_FORMATS = 'MP4, AVI, MOV, MKV, WebM'
export const VIDEO_ACCEPT =
  '.mp4,.avi,.mov,.mkv,.webm,video/mp4,video/x-msvideo,video/quicktime,video/x-matroska,video/webm'
export const MAX_FILE_BYTES = 100 * 1024 * 1024
export const MAX_DURATION_SECONDS = 5 * 60

const formats = {
  mp4: ['video/mp4', 'application/mp4'],
  mov: ['video/quicktime'],
  avi: ['video/x-msvideo', 'video/avi', 'video/msvideo'],
  mkv: ['video/x-matroska', 'video/matroska'],
  webm: ['video/webm'],
}

export function validateVideo(file) {
  const extension = file.name.split('.').pop().toLowerCase()
  if (!formats[extension]) {
    return `Unsupported format. Choose ${VIDEO_FORMATS}.`
  }
  if (!file.size) {
    return 'This file is empty. Choose a video with content.'
  }
  if (file.size > MAX_FILE_BYTES) {
    return 'This file exceeds the 100 MB limit.'
  }
  if (
    file.type &&
    file.type !== 'application/octet-stream' &&
    !formats[extension].includes(file.type)
  ) {
    return 'The file type does not match its extension. Choose the original video file.'
  }
  return ''
}

export async function verifyVideoHeader(file) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  const text = new TextDecoder().decode(bytes)
  const extension = file.name.split('.').pop().toLowerCase()
  let valid = false

  if (extension === 'mp4' || extension === 'mov') {
    valid = ['ftyp', 'moov', 'mdat', 'wide', 'free', 'skip'].includes(text.slice(4, 8))
  } else if (extension === 'avi') {
    valid = text.startsWith('RIFF') && text.slice(8, 12) === 'AVI '
  } else {
    valid =
      bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3
  }

  if (!valid) {
    throw new Error(
      'This file does not have a recognized video container. It may be corrupt or renamed.',
    )
  }
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 3)
  return `${Number((bytes / 1024 ** unit).toFixed(1))} ${['B', 'KB', 'MB', 'GB'][unit]}`
}

export function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return 'Unavailable'
  }
  const rounded = Math.round(seconds)
  return `${Math.floor(rounded / 60)}m ${String(rounded % 60).padStart(2, '0')}s`
}
