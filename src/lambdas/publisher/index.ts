import AWS = require('aws-sdk')
const { Kafka } = require('kafkajs')

/* eslint-disable @typescript-eslint/no-explicit-any */
export const handler = async (event: any): Promise<void> => {
  const nodes = process.env['KAFKA_NODES']?.split(',')
  const topic = process.env['KAFKA_PUBLISH_TOPIC'] || ''
  const subscribedTopic = process.env['KAFKA_SUBSCRIBED_TOPIC'] || ''
  const secretArn = process.env['KAFKA_SECRET_ARN'] || ''

  const client = new AWS.SecretsManager({ region: process.env.AWS_REGION })
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
  const unmarshall = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage)
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
