/* eslint-disable @typescript-eslint/no-explicit-any */
import { Event } from '@boostercloud/framework-core'
import { UUID } from '@boostercloud/framework-types'

@Event
export class KafkaMessageReceived {
  public constructor(
    readonly messageId: string,
    readonly topic: string,
    readonly payload: any,
    readonly createdAt: string
  ) {}

  public entityID(): UUID {
    return this.messageId
  }
}
