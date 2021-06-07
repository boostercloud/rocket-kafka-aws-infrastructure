import { Table } from '@aws-cdk/aws-dynamodb'
import { PolicyStatement, ServicePrincipal } from '@aws-cdk/aws-iam'
import { Code, Runtime, Function, StartingPosition } from '@aws-cdk/aws-lambda'
import { DynamoEventSource } from '@aws-cdk/aws-lambda-event-sources'
import { Duration, Stack } from '@aws-cdk/core'
import { BoosterConfig } from '@boostercloud/framework-types'
import path = require('path')
import { KafkaRocketParams } from './types'

export class KafkaProducerStack {
  static mountStack(stack: Stack, config: BoosterConfig, params: KafkaRocketParams): void {
    const eventStore = stack.node.tryFindChild('events-store') as Table

    const publisherLambda = new Function(stack, 'kafkaProducer', {
      runtime: Runtime.NODEJS_14_X,
      timeout: Duration.minutes(15),
      memorySize: 1024,
      handler: 'index.publisherHandler',
      functionName: config.appName + '-kafka-producer',
      code: Code.fromAsset(path.join(__dirname, 'lambdas')),
      events: [new DynamoEventSource(eventStore, { startingPosition: StartingPosition.TRIM_HORIZON, batchSize: 1000 })],
      environment: {
        KAFKA_NODES: params.bootstrapServers.toString(),
        KAFKA_TOPICS_CONFIG: JSON.stringify(params.producerConfig),
        KAFKA_SECRET_ARN: params.secretArn,
      },
    })
    publisherLambda.addPermission(`${config.appName}-kafka-rocket-publisher-permission`, {
      principal: new ServicePrincipal('dynamodb.amazonaws.com'),
    })

    const secretAccessPolicy = new PolicyStatement({
      resources: [params.secretArn],
      actions: ['secretsmanager:GetSecretValue'],
    })
    publisherLambda.addToRolePolicy(secretAccessPolicy)
  }
}
