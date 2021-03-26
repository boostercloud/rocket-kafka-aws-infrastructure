/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { UUID } from '@boostercloud/framework-types'
import { DynamoDB, SecretsManager } from 'aws-sdk'
const { Kafka } = require('kafkajs')
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
  if (!topicConfig || !payload.eventTypeName) {
    return
  }

  const option = topicConfig.mappingOptions
    ? topicConfig.mappingOptions.find((item) => item.eventTypeName === payload.eventTypeName)
    : undefined

  const messageId = UUID.generate()
  const createdAt = new Date().toISOString()
  const entityID = option ? payload[option.topicEntityId] : messageId
  const typeName = option ? option.eventTypeName : 'KafkaMessageReceived'
  const entityTypeName = option ? option.entityTypeName : 'KafkaMessage'
  const valueForKafkaEvent = {
    messageId,
    payload,
    createdAt,
    topic,
  }
  const value = option ? getValueMappings(option.fields, payload) : valueForKafkaEvent

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

function getKafkaPayload(fields: { [key: string]: string }, boosterEvent: any): string {
  if (!fields) {
    return JSON.stringify({ value: boosterEvent.value, eventTypeName: boosterEvent.typeName })
  } else {
    const outputData = {} as any
    Object.keys(fields).forEach((key) => {
      outputData[fields[key]] = boosterEvent.value[key]
    })
    return JSON.stringify(outputData)
  }
}

export const publisherHandler = async (event: any): Promise<void> => {
  const nodes = process.env['KAFKA_NODES']?.split(',') || []
  const topicConfig = JSON.parse(process.env['KAFKA_TOPICS_CONFIG'] || '')
  const secretArn = process.env['KAFKA_SECRET_ARN'] || ''

  const client = new SecretsManager({ region: process.env.AWS_REGION })
  const secret = await client.getSecretValue({ SecretId: secretArn }).promise()
  const secretValue = JSON.parse(secret.SecretString || '{}')

  const kafka = new Kafka({
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
  const boosterEvent = DynamoDB.Converter.unmarshall(record.dynamodb.NewImage)
  const currentTopicConfig = topicConfig.find((element: any) => element.eventTypeName === boosterEvent.typeName)

  console.log(boosterEvent.value)
  console.log(currentTopicConfig)

  if (!currentTopicConfig) {
    console.log(
      `ignoring the event ${boosterEvent.typeName} because it is not of any of these types: ${topicConfig
        .map((element: any) => element.topic)
        .toString()}`
    )
    return
  }
  const producer = kafka.producer()
  await producer.connect()
  await producer.send({
    topic: currentTopicConfig.topicName,
    messages: [{ value: getKafkaPayload(currentTopicConfig.fields, boosterEvent) }],
  })
  await producer.disconnect()
}

const getValueMappings = (fields: { [key: string]: string }, payload: any): any => {
  const value = {} as any
  Object.keys(fields).forEach((key) => {
    value[fields[key]] = payload[key]
  })
  return value
}
