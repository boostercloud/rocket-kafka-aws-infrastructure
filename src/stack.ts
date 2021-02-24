import { Stack } from '@aws-cdk/core'
import { BoosterConfig } from '@boostercloud/framework-types'
import { KafkaProducerStack } from './producer-stack'
import { KafkaRocketParams } from './types'
import { KafkaConsumerStack } from './consumer-stack'
export class KafkaRocketStack {
  public static mountStack(params: KafkaRocketParams, stack: Stack, config: BoosterConfig): void {
    KafkaProducerStack.mountStack(stack, config, params)
    KafkaConsumerStack.mountStack(stack, config, params)
  }
}
