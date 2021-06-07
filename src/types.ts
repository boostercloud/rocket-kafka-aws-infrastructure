export interface MappingOption {
  entityTypeName: string
  eventTypeName: string
  fields: {
    [key: string]: string
  }
  topicEntityId: string
}

export interface ConsumerTopicConfig {
  topicName: string
  mappingOptions?: MappingOption[]
}

export interface ProducerTopicConfig {
  topicName: string
  eventTypeName: string
  fields?: { [key: string]: string }
}

export interface KafkaRocketParams {
  consumerConfig?: ConsumerTopicConfig[]
  producerConfig?: ProducerTopicConfig[]
  bootstrapServers: string[]
  secretArn: string
}
