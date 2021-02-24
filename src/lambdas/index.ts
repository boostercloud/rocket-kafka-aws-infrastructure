/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { UUID } from '@boostercloud/framework-types'
import { DynamoDB, SecretsManager } from 'aws-sdk'
import * as KFK from 'kafkajs'

export const consumerHandler = async (event: any): Promise<void> => {
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
        createdAt: new Date().toISOString(),
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

export const publisherHandler = async (event: any): Promise<void> => {
  const nodes = process.env['KAFKA_NODES']?.split(',') || []
  const topic = process.env['KAFKA_PUBLISH_TOPIC'] || ''
  const subscribedTopic = process.env['KAFKA_SUBSCRIBED_TOPIC'] || ''
  const secretArn = process.env['KAFKA_SECRET_ARN'] || ''

  const client = new SecretsManager({ region: process.env.AWS_REGION })
  const secret = await client.getSecretValue({ SecretId: secretArn }).promise()
  const secretValue = JSON.parse(secret.SecretString || '{}')

  const kafka = new KFK.Kafka({
    clientId: 'booster-kafka-rocket',
    brokers: nodes,
    ssl: true,
    sasl: {
      mechanism: 'scram-sha-512',
      username: secretValue.username,
      password: secretValue.password,
    },
  })
  const record = event.Records[0]
  const unmarshall = DynamoDB.Converter.unmarshall(record.dynamodb.NewImage)
  console.log(unmarshall.value)
  if (unmarshall.typeName === subscribedTopic) {
    const producer = kafka.producer()
    await producer.connect()
    await producer.send({
      topic: topic,
      messages: [{ value: JSON.stringify(unmarshall.value) }],
    })
    await producer.disconnect()
  } else {
    console.log(`ignoring the event ${unmarshall.typeName} because it is not of type: ${subscribedTopic}`)
  }
}
