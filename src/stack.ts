import { Stack } from '@aws-cdk/core'
import { BoosterConfig } from '@boostercloud/framework-types'
import { KafkaProducerCDK } from './producer-cdk'
import { KafkaRocketParams } from './types'
import { KafkaConsumerCDK } from './consumer-cdk'
export class KafkaRocketStack {
  public static mountStack(params: KafkaRocketParams, stack: Stack, config: BoosterConfig): void {
    KafkaProducerCDK.createProducerLambda(stack, config, params)
    KafkaConsumerCDK.createKafkaConsumer(stack, config, params)
  }
}
