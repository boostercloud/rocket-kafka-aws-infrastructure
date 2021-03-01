# Booster Kafka Rocket

## Description

This rocket will connect a Booster Application to a self anaged Kafka cluster.

Disclaimer: This rocket is only available for the AWS provider.

### Usage

To configure a Booster application you have to provide the following parameters:

* WIP

#### Example

```typescript
Booster.configure('production', (config: BoosterConfig): void => {
  config.appName = 'kafka-bank-integration'
  config.provider = Provider([
    {
      packageName: '@boostercloud/rocket-kakfa-connector-aws-infrastructure',
      parameters: {
        consumerConfig: [
          {
            topicName: 'account-created',
            mappingOptions: {
              entityTypeName: 'Account',
              eventTypeName: 'AccountCreated',
              topicEntityId: 'accountId',
              fields: {
                accountId: 'id',
                clientId: 'customerId',
                balance: 'currentBalance',
              },
            },
          },
          {
            topicName: 'customer-created',
          },
        ],
        producerConfig: [
          {
            topicName: 'account-withdrawn',
            eventTypeName: 'AccountWithdrawn',
            fields: {
              id: 'accountId',
              qty: 'accountQty',
            }
          },
        ]
        bootstrapServers: [
          'serverA',
          'serverB',
          '...',
        ],
        secretArn: '<secretArn>',
      },
    },
  ])
})
```
