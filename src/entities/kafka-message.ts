/* eslint-disable @typescript-eslint/no-explicit-any */
import { Entity, Reduces } from '@boostercloud/framework-core'
import { UUID } from '@boostercloud/framework-types'
import { KafkaMessageReceived } from '../events/kafka-message-received'

@Entity
export class KafkaMessage {
  public constructor(readonly id: UUID, readonly payload: any) {}

  @Reduces(KafkaMessageReceived)
  public static reduceSmallFileAdded(event: KafkaMessageReceived, currentSmallFile?: KafkaMessage): KafkaMessage {
    return new KafkaMessage(UUID.generate(), event.payload)
  }
}
