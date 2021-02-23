import { Table } from '@aws-cdk/aws-dynamodb'
import { ServicePrincipal } from '@aws-cdk/aws-iam'
import { Code, Runtime, Function, StartingPosition } from '@aws-cdk/aws-lambda'
import { DynamoEventSource } from '@aws-cdk/aws-lambda-event-sources'
import { Duration, Stack } from '@aws-cdk/core'
import { BoosterConfig } from '@boostercloud/framework-types'
import path = require('path')
import { KafkaRocketParams } from './stack'

export class KafkaProducerCDK {
  static createProducerLambda(stack: Stack, config: BoosterConfig, params: KafkaRocketParams): void {
    const eventStore = stack.node.tryFindChild('events-store') as Table

    const publisherLambda = new Function(stack, 'rocketKafkaPublisher', {
      runtime: Runtime.NODEJS_12_X,
      timeout: Duration.minutes(15),
      memorySize: 1024,
      handler: 'index.handler',
      functionName: config.appName + '',
      code: Code.fromAsset(path.join(__dirname, 'lambdas/publisher')),
      events: [new DynamoEventSource(eventStore, { startingPosition: StartingPosition.LATEST, batchSize: 1 })],
      environment: {
        KAFKA_NODES: params.bootstrapServers.toString(),
        KAFKA_PUBLISH_TOPIC: params.publishTopic,
        KAFKA_SUBSCRIBED_TOPIC: params.subscribedTopic,
      },
    })
    publisherLambda.addPermission(`${config.appName}-kafka-rocket-publisher-permission`, {
      principal: new ServicePrincipal('dynamodb.amazonaws.com'),
    })
  }
}
