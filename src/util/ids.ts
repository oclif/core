import {Config} from '../interfaces'

export function toStandardizedId(commandID: string, config: Config): string {
  return commandID.replaceAll(new RegExp(config.topicSeparator, 'g'), ':')
}

export function toConfiguredId(commandID: string, config: Config): string {
  const defaultTopicSeparator = ':'
  return commandID.replaceAll(new RegExp(defaultTopicSeparator, 'g'), config.topicSeparator || defaultTopicSeparator)
}
