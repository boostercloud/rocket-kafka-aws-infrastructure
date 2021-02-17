/* eslint-disable @typescript-eslint/no-explicit-any */
import { Event } from '@boostercloud/framework-core'
import { UUID } from '@boostercloud/framework-types'

@Event
export class KafkaMessageReceived {
  public constructor(readonly id: UUID, readonly payload: any) {}

  public entityID(): UUID {
    return this.id
  }
}
