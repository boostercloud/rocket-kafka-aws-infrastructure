/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { UUID } from '@boostercloud/framework-types'
import { DynamoDB, SecretsManager } from 'aws-sdk'
import * as KFK from 'kafkajs'
import { ConsumerTopicConfig } from '../types'

export const consumerHandler = async (event: any): Promise<void> => {
  for (const key in event.records) {
    const kafkaRecords = event.records[key]
    for (let i = 0; i < kafkaRecords.length; i++) {
      const record = kafkaRecords[i]
      // TODO: TAKE A LOOK AT AVRO, SCHEMA REGISTRY AND SO ON...
      const data = Buffer.from(record.value, 'base64').toString()
      const payload = JSON.parse(data)
      await saveEvent(record.topic, payload)
    }
  }
}

async function saveEvent(topic: string, payload: any): Promise<void> {
  const ddb = new DynamoDB.DocumentClient()
  const consumerConfig: ConsumerTopicConfig[] = JSON.parse(process.env.CONSUMER_CONFIG!)
  const topicConfig = consumerConfig.find((item) => item.topicName === topic)
  if (!topicConfig) {
    return
  }

  const messageId = UUID.generate()
  const createdAt = new Date().toISOString()
  const entityID = topicConfig.mappingOptions ? payload[topicConfig.mappingOptions.topicEntityId] : messageId
  const typeName = topicConfig.mappingOptions ? topicConfig.mappingOptions.eventTypeName : 'KafkaMessageReceived'
  const entityTypeName = topicConfig.mappingOptions ? topicConfig.mappingOptions.entityTypeName : 'KafkaMessage'
  const valueForKafkaEvent = {
    messageId,
    payload,
    createdAt,
    topic,
  }
  const value = topicConfig.mappingOptions
    ? getValueMappings(topicConfig.mappingOptions.fields, payload)
    : valueForKafkaEvent

  const params = {
    TableName: process.env.EVENT_STORE_NAME!,
    Item: {
      createdAt,
      kind: 'event',
      requestID: UUID.generate(),
      entityID,
      entityTypeName,
      entityTypeName_entityID_kind: `${entityTypeName}-${entityID}-event`,
      typeName,
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

const getValueMappings = (fields: Record<string, string>[], payload: any): any => {
  let value: any
  fields.forEach((item) => {
    value[item.value] = payload[item.key]
  })
  return value
}
