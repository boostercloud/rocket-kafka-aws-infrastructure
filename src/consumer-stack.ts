import { CfnInclude, Duration, Stack } from '@aws-cdk/core'
import { BoosterConfig } from '@boostercloud/framework-types'
import { PolicyStatement } from '@aws-cdk/aws-iam'
import { Code, Function, Runtime } from '@aws-cdk/aws-lambda'
import { Table } from '@aws-cdk/aws-dynamodb'
import path = require('path')
import { KafkaRocketParams } from './types'

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

    params.consumerConfig?.forEach((config) => {
      const resourceName = 'kfkes' + config.topicName.replace(/-/g, '')
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
    })
  }
}
