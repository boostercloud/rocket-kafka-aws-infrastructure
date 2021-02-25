export interface ConsumerTopicConfig {
  topicName: string
  mappingOptions?: {
    entityTypeName: string
    eventTypeName: string
    fields: Record<string, string>[]
  }
}

export interface ProducerTopicConfig {
  topicName: string
  eventTypeName: string
  fields?: { [key: string]: string }
}

export interface KafkaRocketParams {
  consumerConfig: ConsumerTopicConfig[]
  producerConfig: ProducerTopicConfig[]
  bootstrapServers: string[]
  secretArn: string
}
