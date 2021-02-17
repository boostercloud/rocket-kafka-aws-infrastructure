import { Duration, Stack } from '@aws-cdk/core'
import { BoosterConfig } from '@boostercloud/framework-types'
import { Code, Function, Runtime } from '@aws-cdk/aws-lambda'
import { Table } from '@aws-cdk/aws-dynamodb'

import path = require('path')
import { SelfManagedKafkaEventSource } from './cdk-extensions/kafka'
import { StartingPosition } from './cdk-extensions/event-source-mapping'
import { Secret } from '@aws-cdk/aws-secretsmanager'

export interface KafkaRocketParams {
  topic: string
  bootstrapServers: string[]
  secretName: string
}

export class KafkaRocketStack {
  public static mountStack(params: KafkaRocketParams, stack: Stack, config: BoosterConfig): void {
    const eventsStore = stack.node.tryFindChild('events-store') as Table

    const kafkaTriggerFunction = new Function(stack, 'rocketKafkaTrigger', {
      runtime: Runtime.NODEJS_12_X,
      timeout: Duration.minutes(15),
      memorySize: 1024,
      handler: 'index.handler',
      functionName: config.appName + '-kafka-rocket-trigger',
      code: Code.fromAsset(path.join(__dirname, 'lambdas')),
      environment: {
        EVENT_STORE_NAME: eventsStore.tableName,
        ENTITY_TYPE_NAME: 'KafkaMessage',
        TYPE_NAME: 'KafkaMessageReceived',
      },
    })

    const secret = new Secret(stack, 'Secret', { secretName: params.secretName })
    kafkaTriggerFunction.addEventSource(
      new SelfManagedKafkaEventSource({
        bootstrapServers: params.bootstrapServers,
        topic: params.topic,
        secret: secret,
        batchSize: 100,
        startingPosition: StartingPosition.LATEST,
      })
    )
  }

  public static unmountStack?(): void {
    console.log('Unmount')
  }
}
