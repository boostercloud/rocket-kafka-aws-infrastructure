import { InfrastructureRocket } from '@boostercloud/framework-provider-aws-infrastructure'
import { KafkaRocketStack, KafkaRocketParams } from './stack'

const Stack = (params: KafkaRocketParams): InfrastructureRocket => ({
  mountStack: KafkaRocketStack.mountStack.bind(null, params),
  unmountStack: KafkaRocketStack.unmountStack?.bind(null, params),
})

export default Stack
