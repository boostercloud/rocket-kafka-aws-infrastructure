import AWS = require('aws-sdk')
const { Kafka } = require('kafkajs')

/* eslint-disable @typescript-eslint/no-explicit-any */
export const handler = async (event: any): Promise<void> => {
  const nodes = process.env['KAFKA_NODES']?.split(',')
  const topic = process.env['KAFKA_PUBLISH_TOPIC']
  const subscribedTopic = process.env['KAFKA_SUBSCRIBED_TOPIC']
  const kafka = new Kafka({
    clientId: 'booster-kafka-rocket',
    brokers: nodes,
    ssl: true,
    sasl: {
      mechanism: 'scram-sha-256',
      username: 'm7ok2npy',
      password: 'zvkyWIf7VSPNiHTkGBOFUMO9MdwvLcRP',
    },
  })
  const record = event.Records[0]
  const unmarshall = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage)
  console.log(unmarshall.value)
  if (unmarshall.typeName === subscribedTopic) {
    const producer = kafka.producer()
    await producer.connect()
    await producer.send({
      topic: `m7ok2npy-${topic}`,
      messages: [{ value: JSON.stringify(unmarshall.value) }],
    })
    await producer.disconnect()
  } else {
    console.log(`ignoring the event ${unmarshall.typeName} because it is not of type: ${subscribedTopic}`)
  }
}
