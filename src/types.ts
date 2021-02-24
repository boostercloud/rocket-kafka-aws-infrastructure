export interface TopicConfig {
  topicName: string
}

export interface KafkaRocketParams {
  topicConfig: TopicConfig[]
  bootstrapServers: string[]
  publishTopic: string
  subscribedTopic: string
  // TODO: How to generate secrets
  secretArn: string
}