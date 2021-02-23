/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { UUID } from '@boostercloud/framework-types'
import { DynamoDB } from 'aws-sdk'

export const handler = async (event: any): Promise<void> => {
  for (const key in event.records) {
    const kafkaRecords = event.records[key]
    for (let i = 0; i < kafkaRecords.length; i++) {
      const record = kafkaRecords[i]
      const data = Buffer.from(record.value, 'base64').toString()
      const payload = JSON.parse(data)
      await saveEvent({
        messageId: UUID.generate(),
        topic: record.topic,
        payload,
      })
    }
  }
}

async function saveEvent(value: any): Promise<void> {
  const ddb = new DynamoDB.DocumentClient()
  const params = {
    TableName: process.env.EVENT_STORE_NAME!,
    Item: {
      createdAt: new Date().toISOString(),
      entityID: value.messageId,
      entityTypeName: process.env.ENTITY_TYPE_NAME,
      entityTypeName_entityID_kind: `${process.env.ENTITY_TYPE_NAME}-${value.messageId}-event`,
      kind: 'event',
      requestID: UUID.generate(),
      typeName: process.env.TYPE_NAME,
      value,
      version: 1,
    },
  }
  try {
    await ddb.put(params).promise()
  } catch (e) {
    console.log('[ROCKET#booster-kafka] An error occurred while performing a PutItem operation: ', e)
  }
}
