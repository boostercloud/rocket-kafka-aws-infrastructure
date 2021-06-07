import { Stack } from '@aws-cdk/core'
import { BoosterConfig } from '@boostercloud/framework-types'
import { KafkaProducerStack } from './producer-stack'
import { KafkaRocketParams } from './types'
import { KafkaConsumerStack } from './consumer-stack'
export class KafkaRocketStack {
  public static mountStack(params: KafkaRocketParams, stack: Stack, config: BoosterConfig): void {
    if (params?.producerConfig) {
      KafkaProducerStack.mountStack(stack, config, params)
    }
    if (params?.consumerConfig) {
      KafkaConsumerStack.mountStack(stack, config, params)
    }
  }
}
