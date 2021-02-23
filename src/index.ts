import { InfrastructureRocket } from '@boostercloud/framework-provider-aws-infrastructure'
import { KafkaRocketStack } from './stack'
import { KafkaRocketParams } from './types'

const Stack = (params: KafkaRocketParams): InfrastructureRocket => ({
  mountStack: KafkaRocketStack.mountStack.bind(null, params),
})

export default Stack
