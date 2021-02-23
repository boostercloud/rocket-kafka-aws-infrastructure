//import { CfnInclude, Duration, Stack } from '@aws-cdk/core'
import { Stack } from '@aws-cdk/core'
import { BoosterConfig } from '@boostercloud/framework-types'
//import { PolicyStatement } from '@aws-cdk/aws-iam'
//import { Code, Function, Runtime } from '@aws-cdk/aws-lambda'
//import { Table } from '@aws-cdk/aws-dynamodb'
//import path = require('path')
import { KafkaProducerCDK } from './producer-cdk'

export interface TopicConfig {
  topicName: string
}

export interface KafkaRocketParams {
  topicConfig: TopicConfig[]
  bootstrapServers: string[]
  publishTopic: string
  subscribedTopic: string
  // TODO: How to generate secrets
  secretArn: string
}

export class KafkaRocketStack {
  public static mountStack(params: KafkaRocketParams, stack: Stack, config: BoosterConfig): void {
    KafkaProducerCDK.createProducerLambda(stack, config, params)
    /*const eventsStore = stack.node.tryFindChild('events-store') as Table

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

    KafkaRocketStack.addKafkaEventSourceForTopic(stack, params, kafkaTriggerFunction)
  }

  private static addKafkaEventSourceForTopic = (
    stack: Stack,
    params: KafkaRocketParams,
    kafkaTriggerFunction: Function
  ): void => {
    const baseProperties = {
      FunctionName: kafkaTriggerFunction.functionArn,
      StartingPosition: 'LATEST',
      SelfManagedEventSource: {
        Endpoints: {
          KafkaBootstrapServers: params.bootstrapServers,
        },
      },
      SourceAccessConfigurations: [
        {
          Type: 'SASL_SCRAM_512_AUTH',
          URI: params.secretArn,
        },
      ],
    }

    params.topicConfig.forEach((config) => {
      const resourceName = 'kfkes' + config.topicName.replace('-', '')
      new CfnInclude(stack, resourceName, {
        template: {
          Resources: {
            [resourceName]: {
              Type: 'AWS::Lambda::EventSourceMapping',
              Properties: {
                ...baseProperties,
                Topics: [config.topicName],
              },
            },
          },
        },
      })
    })*/
  }
}
