import {settings} from './settings'

function termwidth(stream: any): number {
  if (!stream.isTTY) {
    return 80
  }

  const width = stream.getWindowSize()[0]
  if (width < 1) {
    return 80
  }

  if (width < 40) {
    return 40
  }

  return width
}

const columns = Number.parseInt(process.env.OCLIF_COLUMNS!, 10) || settings.columns

export const stdtermwidth = columns || termwidth(process.stdout)
export const errtermwidth = columns || termwidth(process.stderr)
