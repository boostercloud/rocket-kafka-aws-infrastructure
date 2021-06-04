import { Duration, Stack } from '@aws-cdk/core'
import { BoosterConfig } from '@boostercloud/framework-types'
import { PolicyStatement } from '@aws-cdk/aws-iam'
import { Code, Function, Runtime, StartingPosition } from '@aws-cdk/aws-lambda'
import { Table } from '@aws-cdk/aws-dynamodb'
import path = require('path')
import { KafkaRocketParams } from './types'
import { AuthenticationMethod, SelfManagedKafkaEventSource } from '@aws-cdk/aws-lambda-event-sources';
import { Secret } from '@aws-cdk/aws-secretsmanager'

export class KafkaConsumerStack {
  static mountStack(stack: Stack, config: BoosterConfig, params: KafkaRocketParams): void {
    const eventsStore = stack.node.tryFindChild('events-store') as Table

    const kafkaTriggerFunction = new Function(stack, 'kafkaConsumer', {
      runtime: Runtime.NODEJS_14_X,
      timeout: Duration.minutes(15),
      memorySize: 1024,
      handler: 'index.consumerHandler',
      functionName: config.appName + '-kafka-consumer',
      code: Code.fromAsset(path.join(__dirname, 'lambdas')),
      environment: {
        EVENT_STORE_NAME: eventsStore.tableName,
        CONSUMER_CONFIG: JSON.stringify(params.consumerConfig),
      },
    })

    const eventsStoreAccessPolicy = new PolicyStatement({
      resources: [eventsStore.tableArn],
      actions: ['dynamodb:Put*'],
    })
    kafkaTriggerFunction.addToRolePolicy(eventsStoreAccessPolicy)

    const secretAccessPolicy = new PolicyStatement({
      resources: [params.secretArn],
      actions: ['secretsmanager:GetSecretValue'],
    })
    kafkaTriggerFunction.addToRolePolicy(secretAccessPolicy)

    this.addKafkaEventSourceForTopic(stack, params, kafkaTriggerFunction)
  }
  private static addKafkaEventSourceForTopic(
    stack: Stack,
    params: KafkaRocketParams,
    kafkaTriggerFunction: Function
  ): void {
    params.consumerConfig.forEach((config) => {
      kafkaTriggerFunction.addEventSource(new SelfManagedKafkaEventSource({
        bootstrapServers: params.bootstrapServers,
        topic: config.topicName,
        authenticationMethod: AuthenticationMethod.SASL_SCRAM_512_AUTH,
        batchSize: 100,
        startingPosition: StartingPosition.LATEST,
        secret: Secret.fromSecretCompleteArn(stack, 'secret', params.secretArn)
      }));
    })
  }
}