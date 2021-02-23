/* eslint-disable @typescript-eslint/no-explicit-any */
import { Entity, Reduces } from '@boostercloud/framework-core'
import { UUID } from '@boostercloud/framework-types'
import { KafkaMessageReceived } from '../events/kafka-message-received'

@Entity
export class KafkaMessage {
  public constructor(readonly id: UUID, readonly topic: string, readonly payload: any, readonly createdAt: string) {}

  @Reduces(KafkaMessageReceived)
  public static onMessageReceived(event: KafkaMessageReceived): KafkaMessage {
    return new KafkaMessage(event.messageId, event.topic, event.payload, event.createdAt)
  }
}
