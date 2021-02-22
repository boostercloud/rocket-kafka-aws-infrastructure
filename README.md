# Booster Kafka Rocket

## Description

This rocket will connect a Booster Application to a self anaged Kafka cluster.

Disclaimer: This rocket is only available for the AWS provider.

### Usage

To configure a Booster application you have to provide the following parameters:

* topicConfig: Objects array with the topics you want to be connected to. In the future we will map those topics to Booster Events, that's the reason why this is an object array.

* boostrapServers: Array of Kafka bootstrap servers in the Kafka cluster to be connected to.

* secretArn: You have to create a secret configuration containing the Kafka cluster security credentials in SASL/SCRAM format. We will change this as soon as posible.

#### Example

```typescript
Booster.configure('production', (config: BoosterConfig): void => {
  config.appName = 'kafka-integration'
  config.provider = Provider([
    {
      packageName: '@boostercloud/rocket-kakfa-connector-aws-infrastructure',
      parameters: {
        topicConfig: [
          {
            topicName: 'topic-A',
          },
          {
            topicName: 'topic-B',
          },
          {
            topicName: 'topic-C',
          },
        ],
        bootstrapServers: [
          '...',
        ],
        secretArn: 'arn:aws:secretsmanager:us-east-1:<secretArn>',
      },
    },
  ])
})
```
